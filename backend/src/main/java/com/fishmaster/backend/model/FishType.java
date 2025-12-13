package com.fishmaster.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Reference entity for fish species with their optimal water parameters.
 * Used to provide guidance on safe tank conditions during onboarding
 * and to calculate default water parameters based on fish selection.
 */
@Entity
@Table(name = "fish_types")
@Getter
@Setter
@NoArgsConstructor
public class FishType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false, unique = true)
    private String name;

    @Column(name = "min_ph", nullable = false, precision = 3, scale = 1)
    private BigDecimal minPh;

    @Column(name = "max_ph", nullable = false, precision = 3, scale = 1)
    private BigDecimal maxPh;

    @Column(name = "min_temp", nullable = false, precision = 4, scale = 1)
    private BigDecimal minTemp;

    @Column(name = "max_temp", nullable = false, precision = 4, scale = 1)
    private BigDecimal maxTemp;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "care_level", length = 20)
    private String careLevel = "beginner";

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public FishType(String name, BigDecimal minPh, BigDecimal maxPh, 
                    BigDecimal minTemp, BigDecimal maxTemp) {
        this.name = name;
        this.minPh = minPh;
        this.maxPh = maxPh;
        this.minTemp = minTemp;
        this.maxTemp = maxTemp;
        this.createdAt = Instant.now();
    }
}
