package com.fishmaster.backend.repositories;

import com.fishmaster.backend.model.FishType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FishTypeRepository extends JpaRepository<FishType, Long> {
    Optional<FishType> findByName(String name);

    List<FishType> findAllByOrderByNameAsc();

    List<FishType> findByCareLevel(String careLevel);
}
