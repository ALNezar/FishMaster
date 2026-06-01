package com.fishmaster.backend.util;

import org.springframework.stereotype.Component;

@Component
public class WaterParamNormalizer {

    public record PhRange(double min, double max, boolean defaultsApplied) {}

    public record TempRange(double min, double max, boolean defaultsApplied,
                            boolean fahrenheitConverted, boolean swapped) {}

    public PhRange normalizePhRange(Double minPh, Double maxPh, String careLevel) {
        double min, max;
        boolean defaultsApplied = false;
        // Sensible default band based on care level
        double defMin = 6.5, defMax = 7.5;
        if (careLevel != null) {
            String cl = careLevel.toLowerCase();
            if (cl.contains("intermediate")) { defMin = 6.0; defMax = 7.5; }
            else if (cl.contains("advanced")) { defMin = 5.5; defMax = 7.0; }
        }

        if (minPh == null && maxPh == null) {
            min = defMin; max = defMax; defaultsApplied = true;
        } else if (minPh == null) {
            max = maxPh;
            min = Math.max(4.0, Math.min(max - 0.5, defMin));
            defaultsApplied = true;
        } else if (maxPh == null) {
            min = minPh;
            max = Math.min(9.5, Math.max(min + 0.5, defMax));
            defaultsApplied = true;
        } else {
            min = minPh; max = maxPh;
        }

        // Clamp to plausible aquarium limits and ensure order
        min = clamp(min, 4.0, 9.5);
        max = clamp(max, 4.0, 9.5);
        if (min > max) {
            double t = min; min = max; max = t;
        }
        return new PhRange(min, max, defaultsApplied);
    }

    public TempRange normalizeTempRange(Double minTemp, Double maxTemp) {
        boolean convertedF = false; boolean defaults = false; boolean swapped = false;
        Double tMin = minTemp, tMax = maxTemp;

        // Detect Fahrenheit if any value clearly > 45
        if ((tMin != null && tMin > 45) || (tMax != null && tMax > 45)) {
            if (tMin != null) tMin = fahrenheitToCelsius(tMin);
            if (tMax != null) tMax = fahrenheitToCelsius(tMax);
            convertedF = true;
        }

        // If both missing, default typical tropical range
        if (tMin == null && tMax == null) {
            tMin = 22.0; tMax = 26.0; defaults = true;
        } else if (tMin == null) {
            tMin = clamp((tMax - 2.0), 16.0, 32.0); defaults = true;
        } else if (tMax == null) {
            tMax = clamp((tMin + 2.0), 16.0, 32.0); defaults = true;
        }

        // Clamp plausible aquarium temperature limits
        double min = clamp(tMin, 10.0, 34.0);
        double max = clamp(tMax, 10.0, 34.0);

        if (min > max) { double t = min; min = max; max = t; swapped = true; }

        return new TempRange(min, max, defaults, convertedF, swapped);
    }

    private static double clamp(double v, double lo, double hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    private static double fahrenheitToCelsius(double f) {
        return (f - 32.0) * 5.0 / 9.0;
    }
}
