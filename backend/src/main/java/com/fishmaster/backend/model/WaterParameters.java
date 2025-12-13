package com.fishmaster.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Stores the target water parameters for a tank.
 * Can be user-specified or auto-calculated based on the fish species
 * in the tank (taking the overlapping safe range for all species).
 * 
 * FishMaster monitors actual sensor readings against these targets
 * and provides alerts when conditions deviate from safe ranges.
 */
@Entity
@Table(name = "water_parameters")
@Getter
@Setter
@NoArgsConstructor
public class WaterParameters {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tank_id", nullable = false, unique = true)
    private Tank tank;

    @Column(precision = 3, scale = 1)
    private BigDecimal ph;

    @Column(precision = 4, scale = 1)
    private BigDecimal temperature;

    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public WaterParameters(Tank tank, BigDecimal ph, BigDecimal temperature, Boolean isDefault) {
        this.tank = tank;
        this.ph = ph;
        this.temperature = temperature;
        this.isDefault = isDefault;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
