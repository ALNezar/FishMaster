package com.fishmaster.backend.service;

import com.fishmaster.backend.model.Tank;
import com.fishmaster.backend.model.User;
import com.fishmaster.backend.repositories.TankRepository;
import com.fishmaster.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TankService {

    private final TankRepository tankRepository;
    private final UserRepository userRepository;

    public List<Tank> getUserTanks(User user) {
        return tankRepository.findByUserId(user.getId());
    }

    public Tank createTank(User user, Tank tank) {
        tank.setUser(user);
        return tankRepository.save(tank);
    }

    public Tank updateTank(User user, Long tankId, Tank updatedTank) {
        Tank existingTank = tankRepository.findById(tankId)
                .orElseThrow(() -> new RuntimeException("Tank not found"));

        if (!existingTank.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to update this tank");
        }

        existingTank.setName(updatedTank.getName());
        existingTank.setSizeLiters(updatedTank.getSizeLiters());

        return tankRepository.save(existingTank);
    }

    public void deleteTank(User user, Long tankId) {
        Tank existingTank = tankRepository.findById(tankId)
                .orElseThrow(() -> new RuntimeException("Tank not found"));

        if (!existingTank.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to delete this tank");
        }

        tankRepository.delete(existingTank);
    }

    public Tank getTank(User user, Long tankId) {
        Tank existingTank = tankRepository.findById(tankId)
                .orElseThrow(() -> new RuntimeException("Tank not found"));

        if (!existingTank.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to view this tank");
        }
        return existingTank;
    }
}
