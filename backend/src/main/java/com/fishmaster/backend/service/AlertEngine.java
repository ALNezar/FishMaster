package com.fishmaster.backend.service;

import com.fishmaster.backend.model.*;
import com.fishmaster.backend.repositories.AlertRepository;
import com.fishmaster.backend.repositories.AlertThresholdRepository;
import com.fishmaster.backend.repositories.TankRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertEngine {

    private static final Duration COOLDOWN = Duration.ofMinutes(15);

    // Default thresholds if none configured
    private static final BigDecimal DEFAULT_TEMP_MIN = new BigDecimal("22.0");
    private static final BigDecimal DEFAULT_TEMP_MAX = new BigDecimal("28.0");
    private static final BigDecimal DEFAULT_PH_MIN = new BigDecimal("6.5");
    private static final BigDecimal DEFAULT_PH_MAX = new BigDecimal("7.5");
    private static final BigDecimal DEFAULT_TURBIDITY_MAX = new BigDecimal("5.0");

    private final AlertRepository alertRepository;
    private final AlertThresholdRepository thresholdRepository;
    private final TankRepository tankRepository;
    private final AlertNotificationService notificationService;

    @Transactional
    public void evaluate(String mqttTankId, String metric, BigDecimal value) {
        if (value == null || metric == null) return;

        // 1. Resolve Tank entity
        Optional<Tank> tankOpt = tankRepository.findFirstByMqttTankId(mqttTankId);
        if (tankOpt.isEmpty()) {
            log.debug("[ALERT] No tank found for mqttTankId={}, skipping evaluation", mqttTankId);
            return;
        }
        Tank tank = tankOpt.get();
        Long tankId = tank.getId();
        Long userId = tank.getUser().getId();

        // 2. Load thresholds
        AlertThreshold thresholds = thresholdRepository.findByTankId(tankId).orElse(null);

        // 3. Check if this metric is enabled
        if (thresholds != null && !Boolean.TRUE.equals(thresholds.getGlobalAlertsEnabled())) {
            return;
        }
        if (thresholds != null && !isMetricEnabled(thresholds, metric)) {
            return;
        }

        // 4. Get thresholds for this metric
        BigDecimal low = getThresholdLow(thresholds, tank, metric);
        BigDecimal high = getThresholdHigh(thresholds, tank, metric);

        // 5. Check violation
        boolean violatesLow = low != null && value.compareTo(low) < 0;
        boolean violatesHigh = high != null && value.compareTo(high) > 0;
        boolean isViolation = violatesLow || violatesHigh;

        if (!isViolation) {
            // Auto-resolve any open alert
            autoResolve(tankId, metric, userId);
            return;
        }

        // 6. Cooldown check
        Instant cooldownCutoff = Instant.now().minus(COOLDOWN);
        List<Alert> recentAlerts = alertRepository
                .findByTankIdAndMetricAndResolvedAtIsNullAndCreatedAtAfter(tankId, metric, cooldownCutoff);
        if (!recentAlerts.isEmpty()) {
            log.debug("[ALERT] Cooldown active for tank={} metric={}, skipping", tankId, metric);
            return;
        }

        // 7. Determine severity
        AlertSeverity severity = calculateSeverity(value, low, high);

        // 8. Build message
        String message = buildMessage(metric, value, low, high, violatesLow);

        // 9. Create and save alert
        Alert alert = new Alert();
        alert.setUserId(userId);
        alert.setTankId(tankId);
        alert.setMetric(metric);
        alert.setValue(value);
        alert.setThresholdLow(low);
        alert.setThresholdHigh(high);
        alert.setSeverity(severity);
        alert.setMessage(message);
        alert = alertRepository.save(alert);

        log.info("[ALERT] Created {} alert id={} for tank={} metric={} value={}",
                severity, alert.getId(), tankId, metric, value);

        // 10. Dispatch notifications
        notificationService.dispatch(alert, thresholds);
    }

    private void autoResolve(Long tankId, String metric, Long userId) {
        Optional<Alert> openAlert = alertRepository
                .findFirstByTankIdAndMetricAndResolvedAtIsNullOrderByCreatedAtDesc(tankId, metric);
        if (openAlert.isPresent()) {
            Alert alert = openAlert.get();
            alert.setResolvedAt(Instant.now());
            alertRepository.save(alert);
            log.info("[ALERT] Auto-resolved alert id={} for tank={} metric={}", alert.getId(), tankId, metric);
            notificationService.dispatchResolution(alert);
        }
    }

    private boolean isMetricEnabled(AlertThreshold t, String metric) {
        return switch (metric) {
            case "temperature" -> Boolean.TRUE.equals(t.getTemperatureEnabled());
            case "ph" -> Boolean.TRUE.equals(t.getPhEnabled());
            case "turbidity" -> Boolean.TRUE.equals(t.getTurbidityEnabled());
            default -> false;
        };
    }

    private BigDecimal getThresholdLow(AlertThreshold t, Tank tank, String metric) {
        if (t != null) {
            return switch (metric) {
                case "temperature" -> t.getTemperatureMin();
                case "ph" -> t.getPhMin();
                case "turbidity" -> null; // turbidity has no min threshold
                default -> null;
            };
        }
        // Fall back to fish-type based safe ranges
        return switch (metric) {
            case "temperature" -> getFishBasedMin(tank, "temperature", DEFAULT_TEMP_MIN);
            case "ph" -> getFishBasedMin(tank, "ph", DEFAULT_PH_MIN);
            default -> null;
        };
    }

    private BigDecimal getThresholdHigh(AlertThreshold t, Tank tank, String metric) {
        if (t != null) {
            return switch (metric) {
                case "temperature" -> t.getTemperatureMax();
                case "ph" -> t.getPhMax();
                case "turbidity" -> t.getTurbidityMax();
                default -> null;
            };
        }
        return switch (metric) {
            case "temperature" -> getFishBasedMax(tank, "temperature", DEFAULT_TEMP_MAX);
            case "ph" -> getFishBasedMax(tank, "ph", DEFAULT_PH_MAX);
            case "turbidity" -> DEFAULT_TURBIDITY_MAX;
            default -> null;
        };
    }

    private BigDecimal getFishBasedMin(Tank tank, String metric, BigDecimal fallback) {
        if (tank.getFish() == null || tank.getFish().isEmpty()) return fallback;
        try {
            return tank.getFish().stream()
                    .map(f -> metric.equals("temperature") ? f.getFishType().getMinTemp() : f.getFishType().getMinPh())
                    .max(BigDecimal::compareTo)
                    .orElse(fallback);
        } catch (Exception e) {
            return fallback;
        }
    }

    private BigDecimal getFishBasedMax(Tank tank, String metric, BigDecimal fallback) {
        if (tank.getFish() == null || tank.getFish().isEmpty()) return fallback;
        try {
            return tank.getFish().stream()
                    .map(f -> metric.equals("temperature") ? f.getFishType().getMaxTemp() : f.getFishType().getMaxPh())
                    .min(BigDecimal::compareTo)
                    .orElse(fallback);
        } catch (Exception e) {
            return fallback;
        }
    }

    private AlertSeverity calculateSeverity(BigDecimal value, BigDecimal low, BigDecimal high) {
        // Calculate how far outside the range
        BigDecimal deviation;
        BigDecimal rangeSize;

        if (high != null && value.compareTo(high) > 0) {
            deviation = value.subtract(high).abs();
            rangeSize = high.abs().max(BigDecimal.ONE);
        } else if (low != null && value.compareTo(low) < 0) {
            deviation = low.subtract(value).abs();
            rangeSize = low.abs().max(BigDecimal.ONE);
        } else {
            return AlertSeverity.INFO;
        }

        BigDecimal pct = deviation.divide(rangeSize, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));

        return pct.compareTo(new BigDecimal("20")) > 0 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING;
    }

    private String buildMessage(String metric, BigDecimal value, BigDecimal low, BigDecimal high, boolean violatesLow) {
        String unit = switch (metric) {
            case "temperature" -> "°C";
            case "ph" -> "";
            case "turbidity" -> " NTU";
            default -> "";
        };
        String metricLabel = metric.substring(0, 1).toUpperCase() + metric.substring(1);

        if (violatesLow && low != null) {
            return metricLabel + " is below safe range: " + value.toPlainString() + unit
                    + " (min: " + low.toPlainString() + unit + ")";
        } else if (high != null) {
            return metricLabel + " is above safe range: " + value.toPlainString() + unit
                    + " (max: " + high.toPlainString() + unit + ")";
        }
        return metricLabel + " is out of range: " + value.toPlainString() + unit;
    }
}
