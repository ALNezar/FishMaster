package com.fishmaster.backend.repositories;

import com.fishmaster.backend.model.TemperatureReading;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TemperatureReadingRepository extends JpaRepository<TemperatureReading, Long> {
    Optional<TemperatureReading> findTopByTankIdOrderByServerTimestampDesc(String tankId);
    List<TemperatureReading> findByTankIdOrderByServerTimestampDesc(String tankId, Pageable pageable);
}
