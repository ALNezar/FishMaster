package com.fishmaster.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "turbidity_readings", indexes = {
        @Index(name = "idx_turbidity_tank_time", columnList = "tank_id, server_timestamp")
})
@Getter
@Setter
@NoArgsConstructor
public class TurbidityReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tank_id", nullable = false, length = 64)
    private String tankId = "tank1";

    @Column(name = "source_client_id", length = 128)
    private String sourceClientId;

    @Column(name = "raw_adc", nullable = false)
    private Integer rawAdc;

    @Column(name = "ntu", precision = 7, scale = 2, nullable = false)
    private BigDecimal ntu;

    @Column(name = "server_timestamp", nullable = false, updatable = false)
    private Instant serverTimestamp = Instant.now();
}
