package com.fishmaster.backend.repositories;

import com.fishmaster.backend.model.Tank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TankRepository extends JpaRepository<Tank, Long> {
    List<Tank> findByUserId(Long userId);

    @Query("SELECT DISTINCT t FROM Tank t LEFT JOIN FETCH t.fish f LEFT JOIN FETCH f.fishType WHERE t.user.id = :userId")
    List<Tank> findByUserIdWithFish(@Param("userId") Long userId);
    Optional<Tank> findFirstByMqttTankId(String mqttTankId);

    @Query("SELECT DISTINCT t FROM Tank t LEFT JOIN FETCH t.fish f LEFT JOIN FETCH f.fishType WHERE t.id = :id")
    Optional<Tank> findByIdWithFish(@Param("id") Long id);
}
