package com.fishmaster.backend.repositories;

import com.fishmaster.backend.model.TankQuestCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TankQuestCompletionRepository extends JpaRepository<TankQuestCompletion, Long> {
    List<TankQuestCompletion> findByUserIdAndTankIdAndQuestDate(Long userId, Long tankId, LocalDate questDate);

    Optional<TankQuestCompletion> findByUserIdAndTankIdAndQuestKeyAndQuestDate(
            Long userId, Long tankId, String questKey, LocalDate questDate);
}
