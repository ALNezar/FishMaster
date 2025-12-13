package com.fishmaster.backend.repositories;

import com.fishmaster.backend.model.FishType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FishTypeRepository extends JpaRepository<FishType, Long> {
    
    Optional<FishType> findByName(String name);
    
    List<FishType> findByCareLevel(String careLevel);
    
    List<FishType> findAllByOrderByNameAsc();
}
