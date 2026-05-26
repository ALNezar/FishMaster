package com.fishmaster.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "ph_readings", indexes = {
        @Index(name = "idx_ph_tank_time", columnList = "tank_id, server_timestamp")
})
@Getter
@Setter
@NoArgsConstructor
public class PhReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tank_id", nullable = false, length = 64)
    private String tankId = "tank1";

    @Column(name = "ph_voltage", precision = 10, scale = 4)
    private BigDecimal phVoltage;

    @Column(name = "ph_value", precision = 5, scale = 2)
    private BigDecimal phValue;

    @Column(name = "internal_chip_temp", precision = 5, scale = 2)
    private BigDecimal internalChipTemp;

    @Column(name = "uptime_ms")
    private Long uptimeMs;

    @Column(name = "server_timestamp", nullable = false, updatable = false)
    private Instant serverTimestamp = Instant.now();
}
