package com.fishmaster.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "mqtt")
@Getter
@Setter
public class MqttProperties {
    private String host;           // e.g. ssl://...:8883
    private String username;       // MQTT username
    private String password;       // MQTT password
    private String clientId = "fishmaster-backend";
    // Comma-separated to subscribe to multiple topics by default
    private String topic = "FishMaster/Temperature,FishMaster/Turbidity,FishMaster/Ph,FishMaster/DeviceInfo";
    private boolean tlsInsecure = true; // allow insecure TLS if needed
    private int keepAlive = 30;
    private int connectionTimeout = 10;
    private int reconnectDelaySeconds = 5;
}
