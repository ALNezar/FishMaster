package com.fishmaster.backend.service;

import com.fishmaster.backend.model.Fish;
import com.fishmaster.backend.model.FishType;
import com.fishmaster.backend.model.Tank;
import com.fishmaster.backend.model.User;
import com.fishmaster.backend.model.WaterParameters;
import com.fishmaster.backend.repositories.FishRepository;
import com.fishmaster.backend.repositories.FishTypeRepository;
import com.fishmaster.backend.repositories.TankRepository;
import com.fishmaster.backend.repositories.WaterParametersRepository;
import dto.FishDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TankService {

    private final TankRepository tankRepository;
    private final FishRepository fishRepository;
    private final FishTypeRepository fishTypeRepository;
    private final WaterParametersRepository waterParametersRepository;

    @Transactional(readOnly = true)
    public List<Tank> getUserTanks(User user) {
        return tankRepository.findByUserIdWithFish(user.getId());
    }

    public Tank createTank(User user, Tank tank) {
        tank.setUser(user);
        return tankRepository.save(tank);
    }

    public Tank updateTank(User user, Long tankId, Tank updatedTank) {
        Tank existingTank = requireOwnedTank(user, tankId);
        existingTank.setName(updatedTank.getName());
        existingTank.setSizeLiters(updatedTank.getSizeLiters());
        return tankRepository.save(existingTank);
    }

    public void deleteTank(User user, Long tankId) {
        Tank existingTank = requireOwnedTank(user, tankId);
        tankRepository.delete(existingTank);
    }

    @Transactional(readOnly = true)
    public Tank getTank(User user, Long tankId) {
        Tank tank = tankRepository.findByIdWithFish(tankId)
                .orElseThrow(() -> new IllegalArgumentException("Tank not found"));
        if (!tank.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Unauthorized to view this tank");
        }
        return tank;
    }

    @Transactional
    public Fish addFish(User user, Long tankId, FishDto dto) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new IllegalArgumentException("Fish name is required");
        }
        if (dto.getFishTypeId() == null) {
            throw new IllegalArgumentException("Fish type is required");
        }

        Tank tank = tankRepository.findByIdWithFish(tankId)
                .orElseThrow(() -> new IllegalArgumentException("Tank not found"));
        if (!tank.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Unauthorized");
        }

        FishType fishType = fishTypeRepository.findById(dto.getFishTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Fish type not found"));

        Fish fish = new Fish(tank, fishType, dto.getName().trim());
        fish = fishRepository.save(fish);
        tank.getFish().add(fish);

        recalculateWaterParametersIfAuto(tank);
        return fish;
    }

    @Transactional
    public void removeFish(User user, Long tankId, Long fishId) {
        Tank tank = tankRepository.findByIdWithFish(tankId)
                .orElseThrow(() -> new IllegalArgumentException("Tank not found"));
        if (!tank.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Unauthorized");
        }

        Fish fish = fishRepository.findById(fishId)
                .orElseThrow(() -> new IllegalArgumentException("Fish not found"));
        if (!fish.getTank().getId().equals(tankId)) {
            throw new IllegalArgumentException("Fish does not belong to this tank");
        }

        tank.getFish().remove(fish);
        fishRepository.delete(fish);
        recalculateWaterParametersIfAuto(tank);
    }

    private void recalculateWaterParametersIfAuto(Tank tank) {
        waterParametersRepository.findByTankId(tank.getId()).ifPresent(wp -> {
            if (Boolean.TRUE.equals(wp.getIsDefault())) {
                WaterParametersCalculator.applyRecalculatedDefaults(wp, tank);
                waterParametersRepository.save(wp);
            }
        });
    }

    private Tank requireOwnedTank(User user, Long tankId) {
        Tank existingTank = tankRepository.findById(tankId)
                .orElseThrow(() -> new IllegalArgumentException("Tank not found"));
        if (!existingTank.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Unauthorized");
        }
        return existingTank;
    }
}
