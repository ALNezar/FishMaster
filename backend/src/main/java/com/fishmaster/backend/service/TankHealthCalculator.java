package com.fishmaster.backend.service;

import com.fishmaster.backend.model.AlertThreshold;
import com.fishmaster.backend.model.Fish;
import com.fishmaster.backend.model.Tank;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

public final class TankHealthCalculator {

    public record MetricScore(int temperature, int ph, int turbidity) {}
    public record Thresholds(BigDecimal tempMin, BigDecimal tempMax, BigDecimal phMin, BigDecimal phMax, BigDecimal turbidityMax) {}

    private TankHealthCalculator() {}

    public static Thresholds resolveThresholds(Tank tank, AlertThreshold stored) {
        if (stored != null) {
            return new Thresholds(
                    stored.getTemperatureMin(),
                    stored.getTemperatureMax(),
                    stored.getPhMin(),
                    stored.getPhMax(),
                    stored.getTurbidityMax()
            );
        }
        return defaultThresholdsFromFish(tank);
    }

    public static Thresholds defaultThresholdsFromFish(Tank tank) {
        BigDecimal tempMin = new BigDecimal("22.0");
        BigDecimal tempMax = new BigDecimal("28.0");
        BigDecimal phMin = new BigDecimal("6.5");
        BigDecimal phMax = new BigDecimal("7.5");

        List<Fish> fishList = tank != null ? tank.getFish() : List.of();
        if (!fishList.isEmpty()) {
            tempMin = fishList.stream().map(f -> f.getFishType().getMinTemp()).max(BigDecimal::compareTo).orElse(tempMin);
            tempMax = fishList.stream().map(f -> f.getFishType().getMaxTemp()).min(BigDecimal::compareTo).orElse(tempMax);
            phMin = fishList.stream().map(f -> f.getFishType().getMinPh()).max(BigDecimal::compareTo).orElse(phMin);
            phMax = fishList.stream().map(f -> f.getFishType().getMaxPh()).min(BigDecimal::compareTo).orElse(phMax);
        }

        return new Thresholds(tempMin, tempMax, phMin, phMax, new BigDecimal("5.0"));
    }

    public static int scoreValue(BigDecimal value, BigDecimal safeMin, BigDecimal safeMax, boolean lowerIsBetterOnly) {
        if (value == null) return 50;
        if (lowerIsBetterOnly && safeMax != null) {
            return clamp(100 - value.divide(safeMax.max(BigDecimal.ONE), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")).intValue());
        }
        if (safeMin == null || safeMax == null) return 70;
        BigDecimal midpoint = safeMin.add(safeMax).divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
        BigDecimal span = safeMax.subtract(safeMin);
        if (span.compareTo(BigDecimal.ZERO) <= 0) span = BigDecimal.ONE;
        BigDecimal distance = value.subtract(midpoint).abs();
        return clamp(100 - distance.divide(span.divide(new BigDecimal("2"), 4, RoundingMode.HALF_UP), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100")).intValue());
    }

    public static MetricScore scoreReadings(BigDecimal temp, BigDecimal ph, BigDecimal turbidity, Thresholds t) {
        int temperature = scoreValue(temp, t.tempMin(), t.tempMax(), false);
        int phScore = scoreValue(ph, t.phMin(), t.phMax(), false);
        int turbidityScore = scoreValue(turbidity, BigDecimal.ZERO, t.turbidityMax(), true);
        return new MetricScore(temperature, phScore, turbidityScore);
    }

    public static int overallPercent(MetricScore scores) {
        double weighted = scores.temperature() * 0.35 + scores.ph() * 0.35 + scores.turbidity() * 0.30;
        return clamp((int) Math.round(weighted));
    }

    public static String moodFromHealth(int health, boolean hasCriticalAlert) {
        if (hasCriticalAlert || health < 55) return "stressed";
        if (health < 85) return "okay";
        return "happy";
    }

    public static String moodLabel(String mood) {
        return switch (mood) {
            case "happy" -> "Happy fish";
            case "okay" -> "Doing okay";
            default -> "Needs care";
        };
    }

    private static int clamp(int value) {
        return Math.min(100, Math.max(0, value));
    }
}
