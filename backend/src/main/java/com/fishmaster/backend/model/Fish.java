package com.fishmaster.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Represents an individual fish in a user's tank.
 * Each fish is associated with a FishType which defines
 * the optimal water parameters for that species.
 */
@Entity
@Table(name = "fish")
@Getter
@Setter
@NoArgsConstructor
public class Fish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tank_id", nullable = false)
    private Tank tank;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fish_type_id", nullable = false)
    private FishType fishType;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public Fish(Tank tank, FishType fishType, String name) {
        this.tank = tank;
        this.fishType = fishType;
        this.name = name;
        this.createdAt = Instant.now();
    }
}
