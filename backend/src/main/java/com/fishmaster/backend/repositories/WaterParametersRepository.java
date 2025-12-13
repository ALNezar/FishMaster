package com.fishmaster.backend.repositories;

import com.fishmaster.backend.model.WaterParameters;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WaterParametersRepository extends JpaRepository<WaterParameters, Long> {
    
    Optional<WaterParameters> findByTankId(Long tankId);
}
