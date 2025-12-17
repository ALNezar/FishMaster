package com.fishmaster.backend.controllers;

import com.fishmaster.backend.model.Tank;
import com.fishmaster.backend.model.User;
import com.fishmaster.backend.service.TankService;
import dto.TankDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tanks")
@RequiredArgsConstructor
public class TankController {

    private final TankService tankService;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (User) authentication.getPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<Tank>> getMyTanks() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(tankService.getUserTanks(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tank> getTank(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(tankService.getTank(user, id));
    }

    @PostMapping
    public ResponseEntity<Tank> createTank(@RequestBody TankDto dto) {
        User user = getAuthenticatedUser();
        Tank tank = new Tank();
        tank.setName(dto.getName());
        tank.setSizeLiters(dto.getSizeLiters());

        return ResponseEntity.ok(tankService.createTank(user, tank));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tank> updateTank(@PathVariable Long id, @RequestBody TankDto dto) {
        User user = getAuthenticatedUser();
        Tank tankUpdate = new Tank();
        tankUpdate.setName(dto.getName());
        tankUpdate.setSizeLiters(dto.getSizeLiters());

        return ResponseEntity.ok(tankService.updateTank(user, id, tankUpdate));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTank(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        tankService.deleteTank(user, id);
        return ResponseEntity.noContent().build();
    }
}
