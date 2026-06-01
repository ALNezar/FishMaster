package com.fishmaster.backend.controllers;

import com.fishmaster.backend.model.Alert;
import com.fishmaster.backend.model.Tank;
import com.fishmaster.backend.model.User;
import com.fishmaster.backend.repositories.AlertRepository;
import com.fishmaster.backend.repositories.TankRepository;
import com.fishmaster.backend.service.AlertSseService;
import dto.AlertResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.servlet.http.HttpServletResponse;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertRepository alertRepository;
    private final TankRepository tankRepository;
    private final AlertSseService alertSseService;

    @GetMapping
    public ResponseEntity<List<AlertResponseDto>> getAllAlerts(@AuthenticationPrincipal User user) {
        List<Alert> alerts = alertRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return ResponseEntity.ok(alerts.stream().map(a -> toDto(a, null)).collect(Collectors.toList()));
    }

    @GetMapping("/tank/{tankId}")
    public ResponseEntity<List<AlertResponseDto>> getAlertsByTank(
            @AuthenticationPrincipal User user,
            @PathVariable Long tankId) {
        // Verify tank belongs to user
        Tank tank = tankRepository.findById(tankId).orElse(null);
        if (tank == null || !tank.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<Alert> alerts = alertRepository.findByTankIdOrderByCreatedAtDesc(tankId);
        return ResponseEntity.ok(alerts.stream().map(a -> toDto(a, tank.getName())).collect(Collectors.toList()));
    }

    @GetMapping("/open")
    public ResponseEntity<List<AlertResponseDto>> getOpenAlerts(@AuthenticationPrincipal User user) {
        List<Alert> alerts = alertRepository.findByUserIdAndResolvedAtIsNullOrderByCreatedAtDesc(user.getId());
        return ResponseEntity.ok(alerts.stream().map(a -> toDto(a, null)).collect(Collectors.toList()));
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<?> acknowledgeAlert(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        Alert alert = alertRepository.findById(id).orElse(null);
        if (alert == null) {
            return ResponseEntity.notFound().build();
        }
        if (!alert.getUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (alert.getAcknowledgedAt() != null) {
            return ResponseEntity.ok(Map.of("message", "Already acknowledged"));
        }
        alert.setAcknowledgedAt(Instant.now());
        alertRepository.save(alert);
        return ResponseEntity.ok(Map.of("message", "Alert acknowledged", "id", alert.getId()));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal User user, HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Accel-Buffering", "no");

        Long userId = user != null ? user.getId() : 0L;
        return alertSseService.register(userId);
    }

    private AlertResponseDto toDto(Alert alert, String tankName) {
        if (tankName == null) {
            Tank tank = tankRepository.findById(alert.getTankId()).orElse(null);
            tankName = tank != null ? tank.getName() : "Tank #" + alert.getTankId();
        }
        return new AlertResponseDto(
                alert.getId(),
                alert.getTankId(),
                tankName,
                alert.getMetric(),
                alert.getValue(),
                alert.getThresholdLow(),
                alert.getThresholdHigh(),
                alert.getSeverity().name(),
                alert.getMessage(),
                alert.getCreatedAt(),
                alert.getAcknowledgedAt(),
                alert.getResolvedAt()
        );
    }
}
