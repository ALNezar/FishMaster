package com.fishmaster.backend.bootstrap;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fishmaster.backend.model.FishType;
import com.fishmaster.backend.repositories.FishTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Component
@RequiredArgsConstructor
public class FishDataSeeder implements CommandLineRunner {

    private final FishTypeRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) throws Exception {
        // Prefer the full dataset that currently lives under the Java package path (compiled into classpath)
        // To avoid accidentally seeding from a placeholder file, we DO NOT fall back to resources/data here.
        String chosenPath = "com/fishmaster/backend/data/fish_cleaned.json";
        InputStream inputStream = getClass().getClassLoader().getResourceAsStream(chosenPath);

        if (inputStream == null) {
            System.out.println("[FishDataSeeder] Dataset not found at: " + chosenPath + ". Skipping seeding.");
            return;
        }

        System.out.println("[FishDataSeeder] Loading dataset from: " + chosenPath);

        List<FishDTO> fishList = objectMapper.readValue(inputStream, new TypeReference<List<FishDTO>>() {});

        int inserted = 0;
        int skippedInvalid = 0;
        int skippedDuplicate = 0;
        int phDefaultsApplied = 0;
        int tempDefaultsApplied = 0;
        int fahrenheitConverted = 0;
        int swappedRanges = 0;
        java.util.List<String> invalidSamples = new java.util.ArrayList<>();
        java.util.List<String> duplicateSamples = new java.util.ArrayList<>();
        for (FishDTO dto : fishList) {
            if (dto == null) continue;

            // basic validation on name
            if (isBlank(dto.name)) {
                if (invalidSamples.size() < 10) {
                    invalidSamples.add("<no-name>");
                }
                skippedInvalid++;
                continue;
            }

            // Normalize pH range (fill defaults if missing)
            Double inMinPh = dto.minPh, inMaxPh = dto.maxPh;
            double[] phRange = normalizePhRange(inMinPh, inMaxPh, dto.careLevel);
            if ((inMinPh == null || inMaxPh == null) && phRange[2] > 0) {
                phDefaultsApplied++;
            }

            // Normalize temperature range (detect Fahrenheit, infer missing bounds)
            Double inMinTemp = dto.minTemp, inMaxTemp = dto.maxTemp;
            TempNormalizationResult tnr = normalizeTempRange(inMinTemp, inMaxTemp);
            if (tnr.fahrenheitConverted) fahrenheitConverted++;
            if (tnr.defaultsApplied) tempDefaultsApplied++;
            if (tnr.swapped) swappedRanges++;

            // After normalization, ensure we have valid complete ranges
            if (Double.isNaN(phRange[0]) || Double.isNaN(phRange[1]) || Double.isNaN(tnr.min) || Double.isNaN(tnr.max)) {
                if (invalidSamples.size() < 10) {
                    invalidSamples.add(dto.name.trim());
                }
                skippedInvalid++;
                continue;
            }

            // prevent duplicates by name (case-sensitive to match DB unique index)
            if (repository.findByName(dto.name).isPresent()) {
                if (duplicateSamples.size() < 10) {
                    duplicateSamples.add(dto.name.trim());
                }
                skippedDuplicate++;
                continue;
            }

            FishType fish = new FishType();
            fish.setName(dto.name.trim());

            fish.setMinPh(toBigDecimal(phRange[0], 1));
            fish.setMaxPh(toBigDecimal(phRange[1], 1));
            fish.setMinTemp(toBigDecimal(tnr.min, 1));
            fish.setMaxTemp(toBigDecimal(tnr.max, 1));

            fish.setDescription(dto.description);
            // default to entity's default if null/blank
            if (!isBlank(dto.careLevel)) {
                fish.setCareLevel(dto.careLevel.toLowerCase());
            }

            repository.save(fish);
            inserted++;
        }

        System.out.println("[FishDataSeeder] Completed. Parsed: " + (fishList != null ? fishList.size() : 0)
                + ", Inserted: " + inserted
                + ", Skipped invalid: " + skippedInvalid
                + ", Skipped duplicates: " + skippedDuplicate);

        if (!invalidSamples.isEmpty()) {
            System.out.println("[FishDataSeeder] Example invalid records (missing required fields): " + invalidSamples);
        }
        if (!duplicateSamples.isEmpty()) {
            System.out.println("[FishDataSeeder] Example duplicate names (already existed): " + duplicateSamples);
        }

        if (phDefaultsApplied > 0 || tempDefaultsApplied > 0 || fahrenheitConverted > 0 || swappedRanges > 0) {
            System.out.println("[FishDataSeeder] Normalization summary: phDefaultsApplied=" + phDefaultsApplied
                    + ", tempDefaultsApplied=" + tempDefaultsApplied
                    + ", fahrenheitConverted=" + fahrenheitConverted
                    + ", rangesSwapped=" + swappedRanges);
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static BigDecimal toBigDecimal(Double v, int scale) {
        if (v == null) return null;
        return BigDecimal.valueOf(v).setScale(scale, RoundingMode.HALF_UP);
    }

    private static BigDecimal toBigDecimal(double v, int scale) {
        return BigDecimal.valueOf(v).setScale(scale, RoundingMode.HALF_UP);
    }

    // Returns [min, max, defaultsAppliedFlagAsDouble]
    private static double[] normalizePhRange(Double minPh, Double maxPh, String careLevel) {
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
        return new double[]{min, max, defaultsApplied ? 1.0 : 0.0};
    }

    private static class TempNormalizationResult {
        double min; double max; boolean defaultsApplied; boolean fahrenheitConverted; boolean swapped;
        TempNormalizationResult(double min, double max, boolean defaultsApplied, boolean fahrenheitConverted, boolean swapped) {
            this.min = min; this.max = max; this.defaultsApplied = defaultsApplied; this.fahrenheitConverted = fahrenheitConverted; this.swapped = swapped;
        }
    }

    private static TempNormalizationResult normalizeTempRange(Double minTemp, Double maxTemp) {
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

        return new TempNormalizationResult(min, max, defaults, convertedF, swapped);
    }

    private static double clamp(double v, double lo, double hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    private static double fahrenheitToCelsius(double f) {
        return (f - 32.0) * 5.0 / 9.0;
    }

    // DTO mapping the JSON schema
    public static class FishDTO {
        public String name;
        public Double minPh;
        public Double maxPh;
        public Double minTemp;
        public Double maxTemp;
        public String description;
        public String careLevel;
        public String imageUrl;
        public String detailsUrl;
    }
}
