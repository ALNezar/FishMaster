package com.fishmaster.backend.controllers;

import com.fishmaster.backend.service.MqttSubscriberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/device")
@RequiredArgsConstructor
public class DeviceAdminController {

    private final MqttSubscriberService mqttSubscriberService;

    @GetMapping("/reconnect")
    public ResponseEntity<Map<String, Object>> reconnect() {
        mqttSubscriberService.reconnectNow();
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "action", "mqtt-reconnect-requested"
        ));
    }

    // Some frontends issue POST instead of GET; provide the same action for POST to avoid 403/405.
    @PostMapping("/reconnect")
    public ResponseEntity<Map<String, Object>> reconnectPost() {
        mqttSubscriberService.reconnectNow();
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "action", "mqtt-reconnect-requested"
        ));
    }
}
