package com.fishmaster.backend.service;

import com.fishmaster.backend.model.Fish;
import com.fishmaster.backend.model.Tank;
import com.fishmaster.backend.model.WaterParameters;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Shared logic for computing target water parameters from fish species overlap.
 */
public final class WaterParametersCalculator {

    private WaterParametersCalculator() {}

    public static WaterParameters calculateDefaultParameters(Tank tank) {
        List<Fish> fishList = tank.getFish();

        if (fishList == null || fishList.isEmpty()) {
            return new WaterParameters(
                    tank,
                    new BigDecimal("7.0"),
                    new BigDecimal("24.0"),
                    true);
        }

        BigDecimal minPhOverlap = fishList.stream()
                .map(f -> f.getFishType().getMinPh())
                .max(BigDecimal::compareTo)
                .orElse(new BigDecimal("6.5"));

        BigDecimal maxPhOverlap = fishList.stream()
                .map(f -> f.getFishType().getMaxPh())
                .min(BigDecimal::compareTo)
                .orElse(new BigDecimal("7.5"));

        BigDecimal minTempOverlap = fishList.stream()
                .map(f -> f.getFishType().getMinTemp())
                .max(BigDecimal::compareTo)
                .orElse(new BigDecimal("22.0"));

        BigDecimal maxTempOverlap = fishList.stream()
                .map(f -> f.getFishType().getMaxTemp())
                .min(BigDecimal::compareTo)
                .orElse(new BigDecimal("26.0"));

        BigDecimal optimalPh = minPhOverlap.add(maxPhOverlap)
                .divide(new BigDecimal("2"), 1, RoundingMode.HALF_UP);

        BigDecimal optimalTemp = minTempOverlap.add(maxTempOverlap)
                .divide(new BigDecimal("2"), 1, RoundingMode.HALF_UP);

        return new WaterParameters(tank, optimalPh, optimalTemp, true);
    }

    public static void applyRecalculatedDefaults(WaterParameters existing, Tank tank) {
        WaterParameters calculated = calculateDefaultParameters(tank);
        existing.setPh(calculated.getPh());
        existing.setTemperature(calculated.getTemperature());
        existing.setIsDefault(true);
    }
}
