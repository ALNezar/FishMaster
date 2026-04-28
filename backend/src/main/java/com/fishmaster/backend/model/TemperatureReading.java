package com.fishmaster.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "temperature_readings", indexes = {
        // Note: DESC in JPA @Index columnList is not portable; omit direction for compatibility
        @Index(name = "idx_temp_tank_time", columnList = "tank_id, server_timestamp")
})
@Getter
@Setter
@NoArgsConstructor
public class TemperatureReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tank_id", nullable = false, length = 64)
    private String tankId = "tank1";

    @Column(name = "temperature", precision = 5, scale = 2, nullable = false)
    private BigDecimal temperature;

    @Column(name = "device_timestamp")
    private Instant deviceTimestamp;

    @Column(name = "server_timestamp", nullable = false, updatable = false)
    private Instant serverTimestamp = Instant.now();
}
