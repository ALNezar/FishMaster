package com.fishmaster.backend.service;

import com.fishmaster.backend.model.FishType;
import com.fishmaster.backend.repositories.FishTypeRepository;
import com.fishmaster.backend.util.WaterParamNormalizer;
import dto.CreateFishTypeRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class FishTypeService {

    private final FishTypeRepository repo;
    private final WaterParamNormalizer normalizer;

    public FishTypeService(FishTypeRepository repo, WaterParamNormalizer normalizer) {
        this.repo = repo;
        this.normalizer = normalizer;
    }

    /**
     * Creates a new FishType after validating and normalizing the payload.
     * Throws IllegalArgumentException for invalid input or duplicates.
     */
    public FishType createFishType(CreateFishTypeRequest req) {
        if (req == null) throw new IllegalArgumentException("Request body is required");

        if (req.getName() == null || req.getName().isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        String name = req.getName().trim();
        if (name.length() > 100) {
            throw new IllegalArgumentException("Name must be at most 100 characters");
        }

        // Prevent duplicates (name is unique in DB)
        repo.findByName(name).ifPresent(x -> {
            throw new IllegalArgumentException("A species with this name already exists");
        });

        var ph = normalizer.normalizePhRange(req.getMinPh(), req.getMaxPh(), req.getCareLevel());
        var t  = normalizer.normalizeTempRange(req.getMinTemp(), req.getMaxTemp());

        FishType ft = new FishType();
        ft.setName(name);
        ft.setMinPh(toBD(ph.min()));
        ft.setMaxPh(toBD(ph.max()));
        ft.setMinTemp(toBD(t.min()));
        ft.setMaxTemp(toBD(t.max()));

        if (req.getDescription() != null) ft.setDescription(req.getDescription());
        if (req.getCareLevel() != null && !req.getCareLevel().isBlank()) {
            ft.setCareLevel(req.getCareLevel().toLowerCase());
        }

        return repo.save(ft);
    }

    private static BigDecimal toBD(double v) {
        return BigDecimal.valueOf(v).setScale(1, RoundingMode.HALF_UP);
    }
}
