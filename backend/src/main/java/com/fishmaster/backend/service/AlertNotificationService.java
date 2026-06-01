package com.fishmaster.backend.service;

import com.fishmaster.backend.model.Alert;
import com.fishmaster.backend.model.AlertSeverity;
import com.fishmaster.backend.model.AlertThreshold;
import com.fishmaster.backend.model.Tank;
import com.fishmaster.backend.model.User;
import com.fishmaster.backend.repositories.TankRepository;
import com.fishmaster.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertNotificationService {

    private final AlertSseService alertSseService;
    private final EmailService emailService;
    private final WebPushService webPushService;
    private final TankRepository tankRepository;
    private final UserRepository userRepository;

    public void dispatch(Alert alert, AlertThreshold thresholds) {
        Long userId = alert.getUserId();

        // 1. Always emit via SSE (in-app real-time)
        try {
            if (thresholds == null || Boolean.TRUE.equals(thresholds.getInAppAlertsEnabled())) {
                alertSseService.emit(userId, alert);
            }
        } catch (Exception e) {
            log.warn("[ALERT-NOTIFY] SSE emission failed: {}", e.getMessage());
        }

        // 2. Send email for WARNING and CRITICAL
        if (alert.getSeverity() != AlertSeverity.INFO
                && (thresholds == null || Boolean.TRUE.equals(thresholds.getEmailAlertsEnabled()))) {
            try {
                User user = userRepository.findById(userId).orElse(null);
                Tank tank = tankRepository.findById(alert.getTankId()).orElse(null);
                if (user != null && Boolean.TRUE.equals(user.getEmailNotifications())) {
                    String safeRange = formatSafeRange(alert);
                    String timestamp = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss 'UTC'")
                            .withZone(ZoneOffset.UTC)
                            .format(alert.getCreatedAt());

                    emailService.sendAlertEmail(
                            user.getEmail(),
                            tank != null ? tank.getName() : "Tank #" + alert.getTankId(),
                            alert.getMetric(),
                            alert.getValue().toPlainString() + getUnit(alert.getMetric()),
                            safeRange,
                            alert.getSeverity().name(),
                            timestamp
                    );
                }
            } catch (Exception e) {
                log.warn("[ALERT-NOTIFY] Email dispatch failed: {}", e.getMessage());
            }
        }

        // 3. Send web push
        try {
            webPushService.sendPush(userId, alert);
        } catch (Exception e) {
            log.warn("[ALERT-NOTIFY] Web push failed: {}", e.getMessage());
        }
    }

    public void dispatchResolution(Alert alert) {
        try {
            alertSseService.emitResolution(alert.getUserId(), alert);
        } catch (Exception e) {
            log.warn("[ALERT-NOTIFY] Resolution SSE failed: {}", e.getMessage());
        }
    }

    private String formatSafeRange(Alert alert) {
        String unit = getUnit(alert.getMetric());
        if (alert.getThresholdLow() != null && alert.getThresholdHigh() != null) {
            return alert.getThresholdLow().toPlainString() + unit + " – " + alert.getThresholdHigh().toPlainString() + unit;
        } else if (alert.getThresholdHigh() != null) {
            return "max " + alert.getThresholdHigh().toPlainString() + unit;
        } else if (alert.getThresholdLow() != null) {
            return "min " + alert.getThresholdLow().toPlainString() + unit;
        }
        return "N/A";
    }

    private String getUnit(String metric) {
        return switch (metric) {
            case "temperature" -> "°C";
            case "ph" -> "";
            case "turbidity" -> " NTU";
            default -> "";
        };
    }
}
