package com.fishmaster.backend.repositories;

import com.fishmaster.backend.model.AlertThreshold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AlertThresholdRepository extends JpaRepository<AlertThreshold, Long> {
    Optional<AlertThreshold> findByTankId(Long tankId);
}
