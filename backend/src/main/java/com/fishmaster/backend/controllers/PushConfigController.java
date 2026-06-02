package com.fishmaster.backend.controllers;

import com.fishmaster.backend.service.WebPushService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushConfigController {

    private final WebPushService webPushService;

    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, Object>> getVapidPublicKey() {
        if (!webPushService.isConfigured()) {
            return ResponseEntity.ok(Map.of("configured", false, "publicKey", ""));
        }
        return ResponseEntity.ok(Map.of(
                "configured", true,
                "publicKey", webPushService.getPublicKey()
        ));
    }
}
