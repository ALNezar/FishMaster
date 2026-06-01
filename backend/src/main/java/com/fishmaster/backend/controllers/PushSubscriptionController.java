package com.fishmaster.backend.controllers;

import com.fishmaster.backend.model.PushSubscription;
import com.fishmaster.backend.model.User;
import com.fishmaster.backend.repositories.PushSubscriptionRepository;
import dto.PushSubscriptionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushSubscriptionController {

    private final PushSubscriptionRepository pushSubscriptionRepository;

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(
            @AuthenticationPrincipal User user,
            @RequestBody PushSubscriptionDto dto) {
        if (dto.getEndpoint() == null || dto.getEndpoint().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "endpoint is required"));
        }

        // Check if already subscribed
        if (pushSubscriptionRepository.findByEndpoint(dto.getEndpoint()).isPresent()) {
            return ResponseEntity.ok(Map.of("message", "Already subscribed"));
        }

        PushSubscription sub = new PushSubscription();
        sub.setUserId(user.getId());
        sub.setEndpoint(dto.getEndpoint());
        sub.setP256dh(dto.getP256dh());
        sub.setAuth(dto.getAuth());
        pushSubscriptionRepository.save(sub);

        return ResponseEntity.ok(Map.of("message", "Subscribed successfully"));
    }

    @DeleteMapping("/unsubscribe")
    @Transactional
    public ResponseEntity<?> unsubscribe(
            @AuthenticationPrincipal User user,
            @RequestBody PushSubscriptionDto dto) {
        if (dto.getEndpoint() == null || dto.getEndpoint().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "endpoint is required"));
        }
        pushSubscriptionRepository.deleteByEndpoint(dto.getEndpoint());
        return ResponseEntity.ok(Map.of("message", "Unsubscribed successfully"));
    }
}
