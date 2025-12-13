package com.fishmaster.backend.repositories;

import com.fishmaster.backend.model.Fish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FishRepository extends JpaRepository<Fish, Long> {
    
    List<Fish> findByTankId(Long tankId);
    
    void deleteByTankId(Long tankId);
}
