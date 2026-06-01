package com.fishmaster.backend.controllers;

import com.fishmaster.backend.model.AlertThreshold;
import com.fishmaster.backend.model.Tank;
import com.fishmaster.backend.model.User;
import com.fishmaster.backend.repositories.AlertThresholdRepository;
import com.fishmaster.backend.repositories.TankRepository;
import dto.AlertThresholdDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/thresholds")
@RequiredArgsConstructor
public class AlertThresholdController {

    private final AlertThresholdRepository thresholdRepository;
    private final TankRepository tankRepository;

    @GetMapping("/{tankId}")
    public ResponseEntity<?> getThresholds(
            @AuthenticationPrincipal User user,
            @PathVariable Long tankId) {
        Tank tank = tankRepository.findById(tankId).orElse(null);
        if (tank == null || !tank.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        AlertThreshold threshold = thresholdRepository.findByTankId(tankId)
                .orElseGet(() -> createDefaultThreshold(tankId));

        return ResponseEntity.ok(toDto(threshold));
    }

    @PutMapping
    public ResponseEntity<?> updateThresholds(
            @AuthenticationPrincipal User user,
            @RequestBody AlertThresholdDto dto) {
        if (dto.getTankId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "tankId is required"));
        }
        if (!dto.isValid()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid threshold values"));
        }

        Tank tank = tankRepository.findById(dto.getTankId()).orElse(null);
        if (tank == null || !tank.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        AlertThreshold threshold = thresholdRepository.findByTankId(dto.getTankId())
                .orElseGet(() -> {
                    AlertThreshold t = new AlertThreshold();
                    t.setTankId(dto.getTankId());
                    return t;
                });

        // Update fields
        if (dto.getGlobalAlertsEnabled() != null) threshold.setGlobalAlertsEnabled(dto.getGlobalAlertsEnabled());
        if (dto.getEmailAlertsEnabled() != null) threshold.setEmailAlertsEnabled(dto.getEmailAlertsEnabled());
        if (dto.getInAppAlertsEnabled() != null) threshold.setInAppAlertsEnabled(dto.getInAppAlertsEnabled());
        if (dto.getTemperatureEnabled() != null) threshold.setTemperatureEnabled(dto.getTemperatureEnabled());
        if (dto.getTemperatureMin() != null) threshold.setTemperatureMin(dto.getTemperatureMin());
        if (dto.getTemperatureMax() != null) threshold.setTemperatureMax(dto.getTemperatureMax());
        if (dto.getPhEnabled() != null) threshold.setPhEnabled(dto.getPhEnabled());
        if (dto.getPhMin() != null) threshold.setPhMin(dto.getPhMin());
        if (dto.getPhMax() != null) threshold.setPhMax(dto.getPhMax());
        if (dto.getTurbidityEnabled() != null) threshold.setTurbidityEnabled(dto.getTurbidityEnabled());
        if (dto.getTurbidityMax() != null) threshold.setTurbidityMax(dto.getTurbidityMax());
        threshold.setUpdatedAt(Instant.now());

        thresholdRepository.save(threshold);
        return ResponseEntity.ok(toDto(threshold));
    }

    private AlertThreshold createDefaultThreshold(Long tankId) {
        AlertThreshold t = new AlertThreshold();
        t.setTankId(tankId);
        return thresholdRepository.save(t);
    }

    private AlertThresholdDto toDto(AlertThreshold t) {
        AlertThresholdDto dto = new AlertThresholdDto(t.getTankId());
        dto.setGlobalAlertsEnabled(t.getGlobalAlertsEnabled());
        dto.setEmailAlertsEnabled(t.getEmailAlertsEnabled());
        dto.setInAppAlertsEnabled(t.getInAppAlertsEnabled());
        dto.setTemperatureEnabled(t.getTemperatureEnabled());
        dto.setTemperatureMin(t.getTemperatureMin());
        dto.setTemperatureMax(t.getTemperatureMax());
        dto.setPhEnabled(t.getPhEnabled());
        dto.setPhMin(t.getPhMin());
        dto.setPhMax(t.getPhMax());
        dto.setTurbidityEnabled(t.getTurbidityEnabled());
        dto.setTurbidityMax(t.getTurbidityMax());
        return dto;
    }
}
