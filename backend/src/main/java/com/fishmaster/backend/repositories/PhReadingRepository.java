package com.fishmaster.backend.repositories;

import com.fishmaster.backend.model.PhReading;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhReadingRepository extends JpaRepository<PhReading, Long> {
    Optional<PhReading> findTopByTankIdOrderByServerTimestampDesc(String tankId);
    List<PhReading> findByTankIdOrderByServerTimestampDesc(String tankId, Pageable pageable);
}
