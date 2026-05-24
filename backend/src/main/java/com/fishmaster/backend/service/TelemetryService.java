package com.fishmaster.backend.service;

import com.fishmaster.backend.model.DeviceInfoSnapshot;
import com.fishmaster.backend.model.TemperatureReading;
import com.fishmaster.backend.model.TurbidityReading;
import com.fishmaster.backend.repositories.DeviceInfoSnapshotRepository;
import com.fishmaster.backend.repositories.TemperatureReadingRepository;
import com.fishmaster.backend.repositories.TurbidityReadingRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelemetryService {

    private final TemperatureReadingRepository temperatureRepository;
    private final TurbidityReadingRepository turbidityRepository;
    private final DeviceInfoSnapshotRepository deviceInfoRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final java.util.Set<SseEmitter> tempEmitters = java.util.Collections.synchronizedSet(new java.util.HashSet<>());
    private final java.util.Set<SseEmitter> turbidityEmitters = java.util.Collections.synchronizedSet(new java.util.HashSet<>());

    @Value("${TELEMETRY_DEFAULT_TANK_ID:tank1}")
    private String defaultTankId;

    @Value("${TELEMETRY_TURBIDITY_ALERT_NTU:5.0}")
    private double turbidityAlertThreshold;

    public void handleTemperaturePayload(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            JsonNode tempNode = node.get("temperature");
            if (tempNode == null || !tempNode.isNumber()) {
                log.warn("[MQTT] Received payload missing numeric 'temperature': {}", payload);
                return;
            }

            BigDecimal value = tempNode.decimalValue();

            TemperatureReading reading = new TemperatureReading();
            reading.setTemperature(value);
            reading.setTankId(Optional.ofNullable(node.path("tankId").asText(null))
                    .filter(s -> !s.isBlank()).orElse(defaultTankId));

            if (node.has("timestamp")) {
                try {
                    reading.setDeviceTimestamp(Instant.parse(node.get("timestamp").asText()));
                } catch (Exception ignored) { }
            }

            // serverTimestamp is initialized in entity
            TemperatureReading saved = temperatureRepository.save(reading);
            log.info("[TELEMETRY] Stored temperature reading: tank={}, value={}, id={}",
                    saved.getTankId(), saved.getTemperature(), saved.getId());
            emitTemperature(saved);
        } catch (Exception ex) {
            log.error("[TELEMETRY] Failed to parse/store payload: {}", payload, ex);
        }
    }

    public SseEmitter registerEmitter() {
        SseEmitter emitter = new SseEmitter(0L); // no timeout, client controls
        tempEmitters.add(emitter);
        emitter.onCompletion(() -> tempEmitters.remove(emitter));
        emitter.onTimeout(() -> tempEmitters.remove(emitter));
        return emitter;
    }

    private void emitTemperature(TemperatureReading reading) {
        synchronized (tempEmitters) {
            java.util.Iterator<SseEmitter> it = tempEmitters.iterator();
            while (it.hasNext()) {
                SseEmitter emitter = it.next();
                try {
                    emitter.send(SseEmitter.event()
                            .name("temperature")
                            .data(reading));
                } catch (Exception e) {
                    it.remove();
                }
            }
        }
    }

    // --- Turbidity handling ---
    public void handleTurbidityPayload(String payload, String sourceClientId) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            JsonNode rawNode = node.get("raw_adc");
            JsonNode ntuNode = node.get("ntu");
            if (rawNode == null || !rawNode.isInt() || ntuNode == null || !ntuNode.isNumber()) {
                log.warn("[MQTT] Received payload missing required turbidity fields: {}", payload);
                return;
            }

            TurbidityReading reading = new TurbidityReading();
            reading.setRawAdc(rawNode.asInt());
            reading.setNtu(ntuNode.decimalValue());
            reading.setSourceClientId(sourceClientId);
            reading.setTankId(java.util.Optional.ofNullable(node.path("tankId").asText(null))
                    .filter(s -> !s.isBlank()).orElse(defaultTankId));

            TurbidityReading saved = turbidityRepository.save(reading);
            log.info("[TELEMETRY] Stored turbidity reading: tank={}, ntu={}, raw={}, id={}",
                    saved.getTankId(), saved.getNtu(), saved.getRawAdc(), saved.getId());

            if (saved.getNtu() != null && saved.getNtu().doubleValue() > turbidityAlertThreshold) {
                log.warn("[ALERT] Turbidity above threshold: ntu={} > {} (tank={})",
                        saved.getNtu(), turbidityAlertThreshold, saved.getTankId());
            }

            emitTurbidity(saved);
        } catch (Exception ex) {
            log.error("[TELEMETRY] Failed to parse/store turbidity payload: {}", payload, ex);
        }
    }

    public SseEmitter registerTurbidityEmitter() {
        SseEmitter emitter = new SseEmitter(0L);
        turbidityEmitters.add(emitter);
        emitter.onCompletion(() -> turbidityEmitters.remove(emitter));
        emitter.onTimeout(() -> turbidityEmitters.remove(emitter));
        return emitter;
    }

    private void emitTurbidity(TurbidityReading reading) {
        synchronized (turbidityEmitters) {
            java.util.Iterator<SseEmitter> it = turbidityEmitters.iterator();
            while (it.hasNext()) {
                SseEmitter emitter = it.next();
                try {
                    emitter.send(SseEmitter.event()
                            .name("turbidity")
                            .data(reading));
                } catch (Exception e) {
                    it.remove();
                }
            }
        }
    }

    // --- Device info handling ---
    public void handleDeviceInfoPayload(String payload) {
        try {
            JsonNode n = objectMapper.readTree(payload);
            String deviceId = n.path("device_id").asText(null);
            if (deviceId == null || deviceId.isBlank()) {
                log.warn("[MQTT] DeviceInfo missing device_id: {}", payload);
                return;
            }
            DeviceInfoSnapshot s = new DeviceInfoSnapshot();
            s.setDeviceId(deviceId);
            s.setFirmwareVersion(n.path("firmware_version").asText(null));
            if (n.has("cpu_mhz")) s.setCpuMhz(n.get("cpu_mhz").asInt());
            if (n.has("free_heap")) s.setFreeHeap(n.get("free_heap").asInt());
            if (n.has("heap_total")) s.setHeapTotal(n.get("heap_total").asInt());
            s.setMacAddress(n.path("mac_address").asText(null));
            s.setIpAddress(n.path("ip_address").asText(null));
            s.setWifiSsid(n.path("wifi_ssid").asText(null));
            if (n.has("rssi_dbm")) s.setRssiDbm(n.get("rssi_dbm").asInt());
            if (n.has("uptime_ms")) s.setUptimeMs(n.get("uptime_ms").asLong());
            s.setChipId(n.path("chip_id").asText(null));

            DeviceInfoSnapshot saved = deviceInfoRepository.save(s);
            log.info("[TELEMETRY] Stored DeviceInfo snapshot for device={} id={}", saved.getDeviceId(), saved.getId());
        } catch (Exception ex) {
            log.error("[TELEMETRY] Failed to parse/store DeviceInfo payload: {}", payload, ex);
        }
    }
}
