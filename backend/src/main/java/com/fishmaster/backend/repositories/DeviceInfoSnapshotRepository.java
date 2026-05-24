package com.fishmaster.backend.repositories;

import com.fishmaster.backend.model.DeviceInfoSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeviceInfoSnapshotRepository extends JpaRepository<DeviceInfoSnapshot, Long> {
    Optional<DeviceInfoSnapshot> findTopByDeviceIdOrderByServerTimestampDesc(String deviceId);
}
