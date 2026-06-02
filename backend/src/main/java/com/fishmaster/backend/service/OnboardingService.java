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

        private final UserRepository userRepository;
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
                        Boolean.TRUE.equals(user.getOnboardingCompleted()),
                                user.getName(),
                                tankName);
        }

        /**
         * Complete the onboarding process by creating the user's tank, fish, and water
         * parameters.
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
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Fish type not found: " + fishDto.getFishTypeId()));

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
                                        false);
                } else {
                        // Calculate optimal defaults based on fish species
                        waterParams = WaterParametersCalculator.calculateDefaultParameters(tank);
                }
                waterParametersRepository.save(waterParams);
                tank.setWaterParameters(waterParams);

                // Mark onboarding as complete
                user.setOnboardingCompleted(true);
                userRepository.save(user);

                return tankRepository.save(tank);
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
                                fishType.getCareLevel());
        }
}
