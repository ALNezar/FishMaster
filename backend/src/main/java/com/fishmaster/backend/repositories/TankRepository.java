package com.fishmaster.backend.repositories;

import com.fishmaster.backend.model.Tank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TankRepository extends JpaRepository<Tank, Long> {
    List<Tank> findByUserId(Long userId);
}
