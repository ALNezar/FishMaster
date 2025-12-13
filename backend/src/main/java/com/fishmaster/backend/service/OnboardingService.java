package com.fishmaster.backend.service;

import com.fishmaster.backend.model.*;
import com.fishmaster.backend.repositories.*;
import dto.FishDto;
import dto.FishTypeDto;
import dto.OnboardingDto;
import dto.OnboardingStatusDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service handling the onboarding flow for new users.
 * Manages tank creation, fish setup, and water parameters calculation.
 * 
 * The service calculates optimal water parameters by finding the overlapping
 * safe range across all fish species in the tank - this ensures all fish
 * can thrive in the same conditions.
 */
@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final UserRepo userRepo;
    private final TankRepository tankRepository;
    private final FishRepository fishRepository;
    private final FishTypeRepository fishTypeRepository;
    private final WaterParametersRepository waterParametersRepository;

    /**
     * Get all available fish types for the onboarding dropdown.
     */
    public List<FishTypeDto> getAllFishTypes() {
        return fishTypeRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toFishTypeDto)
                .collect(Collectors.toList());
    }

    /**
     * Get fish types filtered by care level (beginner, intermediate, advanced).
     */
    public List<FishTypeDto> getFishTypesByCareLevel(String careLevel) {
        return fishTypeRepository.findByCareLevel(careLevel)
                .stream()
                .map(this::toFishTypeDto)
                .collect(Collectors.toList());
    }

    /**
     * Check whether the user has completed onboarding.
     */
    public OnboardingStatusDto getOnboardingStatus(User user) {
        List<Tank> tanks = tankRepository.findByUserId(user.getId());
        String tankName = tanks.isEmpty() ? null : tanks.get(0).getName();
        
        return new OnboardingStatusDto(
                user.isOnboardingCompleted(),
                user.getName(),
                tankName
        );
    }

    /**
     * Complete the onboarding process by creating the user's tank, fish, and water parameters.
     * This is called at the end of the 10-step onboarding wizard.
     */
    @Transactional
    public Tank completeOnboarding(User user, OnboardingDto dto) {
        // Update user name if provided
        if (dto.getUserName() != null && !dto.getUserName().isBlank()) {
            user.setName(dto.getUserName());
        }

        // Create the tank
        Tank tank = new Tank(user, dto.getTankName(), dto.getTankSize());
        tank = tankRepository.save(tank);

        // Add fish to the tank
        for (FishDto fishDto : dto.getFish()) {
            FishType fishType = fishTypeRepository.findById(fishDto.getFishTypeId())
                    .orElseThrow(() -> new RuntimeException("Fish type not found: " + fishDto.getFishTypeId()));
            
            Fish fish = new Fish(tank, fishType, fishDto.getName());
            fishRepository.save(fish);
            tank.getFish().add(fish);
        }

        // Create water parameters (user-specified or calculated defaults)
        WaterParameters waterParams;
        if (dto.getWaterParameters() != null && 
            dto.getWaterParameters().getPh() != null && 
            dto.getWaterParameters().getTemperature() != null) {
            // User specified their own parameters
            waterParams = new WaterParameters(
                    tank,
                    dto.getWaterParameters().getPh(),
                    dto.getWaterParameters().getTemperature(),
                    false
            );
        } else {
            // Calculate optimal defaults based on fish species
            waterParams = calculateDefaultParameters(tank);
        }
        waterParametersRepository.save(waterParams);
        tank.setWaterParameters(waterParams);

        // Mark onboarding as complete
        user.setOnboardingCompleted(true);
        userRepo.save(user);

        return tankRepository.save(tank);
    }

    /**
     * Calculate default water parameters based on the fish in the tank.
     * Finds the overlapping safe range for all species to ensure compatibility.
     * 
     * Algorithm:
     * - Find the maximum of all minimum values (the highest low threshold)
     * - Find the minimum of all maximum values (the lowest high threshold)
     * - Take the midpoint of the overlapping range
     */
    private WaterParameters calculateDefaultParameters(Tank tank) {
        List<Fish> fishList = tank.getFish();
        
        if (fishList.isEmpty()) {
            // Default to neutral freshwater parameters
            return new WaterParameters(
                    tank,
                    new BigDecimal("7.0"),
                    new BigDecimal("24.0"),
                    true
            );
        }

        // Find overlapping pH range
        BigDecimal minPhOverlap = fishList.stream()
                .map(f -> f.getFishType().getMinPh())
                .max(BigDecimal::compareTo)
                .orElse(new BigDecimal("6.5"));
        
        BigDecimal maxPhOverlap = fishList.stream()
                .map(f -> f.getFishType().getMaxPh())
                .min(BigDecimal::compareTo)
                .orElse(new BigDecimal("7.5"));

        // Find overlapping temperature range
        BigDecimal minTempOverlap = fishList.stream()
                .map(f -> f.getFishType().getMinTemp())
                .max(BigDecimal::compareTo)
                .orElse(new BigDecimal("22.0"));
        
        BigDecimal maxTempOverlap = fishList.stream()
                .map(f -> f.getFishType().getMaxTemp())
                .min(BigDecimal::compareTo)
                .orElse(new BigDecimal("26.0"));

        // Calculate midpoints
        BigDecimal optimalPh = minPhOverlap.add(maxPhOverlap)
                .divide(new BigDecimal("2"), 1, RoundingMode.HALF_UP);
        
        BigDecimal optimalTemp = minTempOverlap.add(maxTempOverlap)
                .divide(new BigDecimal("2"), 1, RoundingMode.HALF_UP);

        return new WaterParameters(tank, optimalPh, optimalTemp, true);
    }

    private FishTypeDto toFishTypeDto(FishType fishType) {
        return new FishTypeDto(
                fishType.getId(),
                fishType.getName(),
                fishType.getMinPh(),
                fishType.getMaxPh(),
                fishType.getMinTemp(),
                fishType.getMaxTemp(),
                fishType.getDescription(),
                fishType.getCareLevel()
        );
    }
}
