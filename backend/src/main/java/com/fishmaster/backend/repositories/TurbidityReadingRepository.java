package com.fishmaster.backend.repositories;

import com.fishmaster.backend.model.TurbidityReading;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TurbidityReadingRepository extends JpaRepository<TurbidityReading, Long> {
    Optional<TurbidityReading> findTopByTankIdOrderByServerTimestampDesc(String tankId);
    List<TurbidityReading> findByTankIdOrderByServerTimestampDesc(String tankId, Pageable pageable);
}
