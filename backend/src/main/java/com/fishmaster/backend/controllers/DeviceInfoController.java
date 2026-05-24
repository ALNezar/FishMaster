package com.fishmaster.backend.controllers;

import com.fishmaster.backend.model.DeviceInfoSnapshot;
import com.fishmaster.backend.repositories.DeviceInfoSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class DeviceInfoController {

    private final DeviceInfoSnapshotRepository repository;

    @GetMapping("/{deviceId}/info/latest")
    public Optional<DeviceInfoSnapshot> latestDeviceInfo(@PathVariable String deviceId) {
        return repository.findTopByDeviceIdOrderByServerTimestampDesc(deviceId);
    }
}
