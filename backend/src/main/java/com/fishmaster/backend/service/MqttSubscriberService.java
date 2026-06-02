package com.fishmaster.backend.service;

import com.fishmaster.backend.config.MqttProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.util.Arrays;
import java.util.Objects;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Minimal MQTT subscriber that connects to HiveMQ (or any MQTT 3.1.1 broker)
 * and forwards incoming payloads to TelemetryService for parsing and storage.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MqttSubscriberService implements MqttCallbackExtended {

    private final MqttProperties mqttProps;
    private final TelemetryService telemetryService;

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "mqtt-reconnector");
        t.setDaemon(true);
        return t;
    });

    private MqttAsyncClient client;
    private volatile boolean shuttingDown = false;

    @PostConstruct
    public void init() {
        if (mqttProps == null || mqttProps.getHost() == null || mqttProps.getHost().isBlank()) {
            log.warn("[MQTT] mqtt.host not configured; MQTT subscriber will not start");
            return;
        }
        log.info("[MQTT] Initializing subscriber. host={}, topic={}, clientId={}",
                mqttProps.getHost(), mqttProps.getTopic(), mqttProps.getClientId());

        // Try initial connect quickly; if it fails, schedule retry loop
        scheduler.execute(this::connectWithRetry);
    }

    private void connectWithRetry() {
        int delay = Math.max(1, mqttProps.getReconnectDelaySeconds());
        while (!shuttingDown) {
            try {
                connectAndSubscribe();
                return; // success; leave retry loop. Auto-reconnect will handle drops.
            } catch (Exception e) {
                log.warn("[MQTT] Connect/subscribe failed: {}. Retrying in {}s", e.getMessage(), delay);
                try {
                    TimeUnit.SECONDS.sleep(delay);
                } catch (InterruptedException ignored) {
                }
            }
        }
    }

    private void connectAndSubscribe() throws Exception {
        String serverURI = Objects.requireNonNull(mqttProps.getHost(), "mqtt.host");
        String clientId = mqttProps.getClientId();
        if (clientId == null || clientId.isBlank()) clientId = "fishmaster-backend";

        if (client == null) {
            client = new MqttAsyncClient(serverURI, clientId, new MemoryPersistence());
            client.setCallback(this);
        }

        MqttConnectOptions options = new MqttConnectOptions();
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);
        options.setKeepAliveInterval(Math.max(10, mqttProps.getKeepAlive()));
        options.setConnectionTimeout(Math.max(5, mqttProps.getConnectionTimeout()));

        if (mqttProps.getUsername() != null && !mqttProps.getUsername().isBlank()) {
            options.setUserName(mqttProps.getUsername());
        }
        if (mqttProps.getPassword() != null) {
            options.setPassword(mqttProps.getPassword().toCharArray());
        }

        // If using TLS and tlsInsecure=true, trust all certs (for testing environments)
        if (serverURI.startsWith("ssl://") && mqttProps.isTlsInsecure()) {
            options.setSocketFactory(trustAllSocketFactory());
            log.warn("[MQTT] TLS insecure mode enabled: trusting all certificates (testing only)");
        }

        log.info("[MQTT] Connecting to {} as {} ...", serverURI, clientId);
        IMqttToken token = client.connect(options);
        token.waitForCompletion();
        if (!client.isConnected()) {
            throw new MqttException(MqttException.REASON_CODE_CLIENT_EXCEPTION);
        }

        // Subscribe to configured topic(s)
        String topicProp = Objects.requireNonNull(mqttProps.getTopic(), "mqtt.topic");
        String[] topics = Arrays.stream(topicProp.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
        int[] qos = new int[topics.length];
        Arrays.fill(qos, 1);

        IMqttMessageListener listener = (t, message) -> onMessage(t, message);
        IMqttMessageListener[] listeners = new IMqttMessageListener[topics.length];
        Arrays.fill(listeners, listener);

        client.subscribe(topics, qos, listeners);
        log.info("[MQTT] Connected and subscribed to topics: {}", String.join(", ", topics));
    }

    /**
     * Manually trigger a reconnect to the MQTT broker. Useful for admin endpoints or ops tooling.
     */
    public synchronized void reconnectNow() {
        log.info("[MQTT] Manual reconnect requested");
        try {
            if (client != null) {
                try { if (client.isConnected()) client.disconnect(); } catch (Exception ignored) {}
                try { client.close(); } catch (Exception ignored) {}
                client = null;
            }
        } catch (Exception e) {
            log.warn("[MQTT] Error while closing client during manual reconnect: {}", e.getMessage());
        }
        // Schedule a new connection attempt
        scheduler.execute(this::connectWithRetry);
    }

    private void onMessage(String topic, MqttMessage message) {
        try {
            String payload = new String(message.getPayload(), StandardCharsets.UTF_8);
            log.debug("[MQTT] Received on {}: {} (qos={}, retained={})", topic, payload, message.getQos(), message.isRetained());
            String t = topic == null ? "" : topic;
            if (t.endsWith("/Temperature") || t.equals("FishMaster/Temperature")) {
                telemetryService.handleTemperaturePayload(payload);
            } else if (t.endsWith("/Turbidity") || t.equals("FishMaster/Turbidity")) {
                // Source client id is this subscriber's client id; device id is expected via DeviceInfo retained msg
                String sourceClientId = mqttProps.getClientId();
                telemetryService.handleTurbidityPayload(payload, sourceClientId);
            } else if (t.endsWith("/Ph") || t.equals("FishMaster/Ph") || t.equalsIgnoreCase("FishMaster/pH")
                    || t.equalsIgnoreCase("aquarium/telemetry") || t.toLowerCase().endsWith("/telemetry")) {
                telemetryService.handlePhPayload(payload);
            } else if (t.endsWith("/DeviceInfo") || t.equals("FishMaster/DeviceInfo")) {
                telemetryService.handleDeviceInfoPayload(payload);
            } else {
                // Fallback: try parsing as temperature to not lose data in case of misconfig
                telemetryService.handleTemperaturePayload(payload);
            }
        } catch (Exception e) {
            log.error("[MQTT] Failed processing message from {}: {}", topic, e.getMessage(), e);
        }
    }

    @PreDestroy
    public void shutdown() {
        shuttingDown = true;
        try {
            if (client != null && client.isConnected()) {
                client.disconnect();
            }
        } catch (Exception ignored) {
        }
        try {
            if (client != null) client.close();
        } catch (Exception ignored) {
        }
        scheduler.shutdownNow();
    }

    @Override
    public void connectComplete(boolean reconnect, String serverURI) {
        log.info("[MQTT] {} to {} at {}", reconnect ? "Reconnected" : "Connected", serverURI, Instant.now());
    }

    @Override
    public void connectionLost(Throwable cause) {
        if (cause != null) {
            log.warn("[MQTT] Connection lost: {}. Auto-reconnect is enabled.", cause.getMessage());
        } else {
            log.warn("[MQTT] Connection lost. Auto-reconnect is enabled.");
        }
        // Automatic reconnect is enabled; no manual action needed here.
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        onMessage(topic, message);
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // Not used (we are a subscriber), but required by interface
    }

    private static SSLSocketFactory trustAllSocketFactory() throws Exception {
        TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                    public void checkClientTrusted(X509Certificate[] certs, String authType) { }
                    public void checkServerTrusted(X509Certificate[] certs, String authType) { }
                }
        };
        SSLContext sc = SSLContext.getInstance("TLS");
        sc.init(null, trustAllCerts, new SecureRandom());
        return sc.getSocketFactory();
    }
}
