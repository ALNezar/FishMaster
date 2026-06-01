package com.fishmaster.backend.repositories;

import com.fishmaster.backend.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Alert> findByTankIdOrderByCreatedAtDesc(Long tankId);
    List<Alert> findByUserIdAndResolvedAtIsNullOrderByCreatedAtDesc(Long userId);
    Optional<Alert> findFirstByTankIdAndMetricAndResolvedAtIsNullOrderByCreatedAtDesc(Long tankId, String metric);
    List<Alert> findByTankIdAndMetricAndResolvedAtIsNullAndCreatedAtAfter(Long tankId, String metric, Instant after);
}
