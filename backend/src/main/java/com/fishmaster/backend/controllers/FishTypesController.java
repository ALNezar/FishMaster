package com.fishmaster.backend.controllers;

import com.fishmaster.backend.model.FishType;
import com.fishmaster.backend.service.FishTypeService;
import com.fishmaster.backend.repositories.FishTypeRepository;
import dto.CreateFishTypeRequest;
import dto.FishTypeDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fish-types")
@RequiredArgsConstructor
public class FishTypesController {

    private final FishTypeService fishTypeService;
    private final FishTypeRepository fishTypeRepository;

    /**
     * Create a new custom FishType. Requires authentication via JWT (see SecurityConfig).
     */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateFishTypeRequest req) {
        try {
            FishType created = fishTypeService.createFishType(req);
            FishTypeDto dto = toDto(created);
            return ResponseEntity
                    .created(URI.create("/api/fish-types/" + created.getId()))
                    .body(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    /**
     * Convenience listing endpoint (duplicates data provided by /api/onboarding/fish-types)
     * to allow the frontend to refresh list after creation without touching onboarding APIs.
     */
    @GetMapping
    public ResponseEntity<List<FishTypeDto>> listAll() {
        List<FishTypeDto> items = fishTypeRepository.findAllByOrderByNameAsc()
                .stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    private FishTypeDto toDto(FishType f) {
        return new FishTypeDto(
                f.getId(),
                f.getName(),
                f.getMinPh(),
                f.getMaxPh(),
                f.getMinTemp(),
                f.getMaxTemp(),
                f.getDescription(),
                f.getCareLevel()
        );
    }
}
