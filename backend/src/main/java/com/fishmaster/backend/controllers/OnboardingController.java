package com.fishmaster.backend.controllers;

import com.fishmaster.backend.model.Tank;
import com.fishmaster.backend.model.User;
import com.fishmaster.backend.service.OnboardingService;
import dto.FishTypeDto;
import dto.OnboardingDto;
import dto.OnboardingStatusDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the onboarding flow.
 * Handles fish type listing, onboarding status checks, and completing the setup.
 */
@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;

    /**
     * Get all available fish types for the onboarding dropdown.
     * Returns species with their optimal water parameters.
     */
    @GetMapping("/fish-types")
    public ResponseEntity<List<FishTypeDto>> getFishTypes(
            @RequestParam(required = false) String careLevel) {
        
        List<FishTypeDto> fishTypes;
        if (careLevel != null && !careLevel.isBlank()) {
            fishTypes = onboardingService.getFishTypesByCareLevel(careLevel);
        } else {
            fishTypes = onboardingService.getAllFishTypes();
        }
        
        return ResponseEntity.ok(fishTypes);
    }

    /**
     * Check the current user's onboarding status.
     */
    @GetMapping("/status")
    public ResponseEntity<OnboardingStatusDto> getStatus() {
        User user = getCurrentUser();
        OnboardingStatusDto status = onboardingService.getOnboardingStatus(user);
        return ResponseEntity.ok(status);
    }

    /**
     * Complete the onboarding process.
     * Creates the user's first tank with fish and water parameters.
     */
    @PostMapping("/complete")
    public ResponseEntity<?> completeOnboarding(@RequestBody OnboardingDto dto) {
        try {
            User user = getCurrentUser();
            
            // Validate required fields
            if (dto.getTankName() == null || dto.getTankName().isBlank()) {
                return ResponseEntity.badRequest().body("Tank name is required");
            }
            if (dto.getTankSize() == null || dto.getTankSize() <= 0) {
                return ResponseEntity.badRequest().body("Tank size must be greater than 0");
            }
            if (dto.getFish() == null || dto.getFish().isEmpty()) {
                return ResponseEntity.badRequest().body("At least one fish is required");
            }
            
            Tank tank = onboardingService.completeOnboarding(user, dto);
            
            return ResponseEntity.ok().body(new OnboardingCompleteResponse(
                    true,
                    "Your tank '" + tank.getName() + "' is ready! 🐠",
                    tank.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to complete onboarding: " + e.getMessage());
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (User) authentication.getPrincipal();
    }

    // Response record for onboarding completion
    record OnboardingCompleteResponse(boolean success, String message, Long tankId) {}
}
