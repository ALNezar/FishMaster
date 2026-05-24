package com.fishmaster.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "device_info_snapshots", indexes = {
        @Index(name = "idx_device_info_device_time", columnList = "device_id, server_timestamp")
})
@Getter
@Setter
@NoArgsConstructor
public class DeviceInfoSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id", length = 128, nullable = false)
    private String deviceId;

    @Column(name = "firmware_version", length = 64)
    private String firmwareVersion;

    @Column(name = "cpu_mhz")
    private Integer cpuMhz;

    @Column(name = "free_heap")
    private Integer freeHeap;

    @Column(name = "heap_total")
    private Integer heapTotal;

    @Column(name = "mac_address", length = 32)
    private String macAddress;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "wifi_ssid", length = 128)
    private String wifiSsid;

    @Column(name = "rssi_dbm")
    private Integer rssiDbm;

    @Column(name = "uptime_ms")
    private Long uptimeMs;

    @Column(name = "chip_id", length = 64)
    private String chipId;

    @Column(name = "server_timestamp", nullable = false, updatable = false)
    private Instant serverTimestamp = Instant.now();
}
