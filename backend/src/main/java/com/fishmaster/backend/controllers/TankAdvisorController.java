package com.fishmaster.backend.controllers;

import com.fishmaster.backend.model.User;
import com.fishmaster.backend.service.TankAdvisorService;
import dto.AdvisorSnapshotDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/advisor")
@RequiredArgsConstructor
public class TankAdvisorController {

    private final TankAdvisorService tankAdvisorService;

    @GetMapping("/tanks/{tankId}")
    public ResponseEntity<AdvisorSnapshotDto> getSnapshot(
            @AuthenticationPrincipal User user,
            @PathVariable Long tankId) {
        return ResponseEntity.ok(tankAdvisorService.getSnapshot(user, tankId));
    }

    @PostMapping("/tanks/{tankId}/quests/{questKey}/complete")
    public ResponseEntity<AdvisorSnapshotDto> completeQuest(
            @AuthenticationPrincipal User user,
            @PathVariable Long tankId,
            @PathVariable String questKey) {
        return ResponseEntity.ok(tankAdvisorService.completeQuest(user, tankId, questKey));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> forbidden(SecurityException ex) {
        return ResponseEntity.status(403).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
