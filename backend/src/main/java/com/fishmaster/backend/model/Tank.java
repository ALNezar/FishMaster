package com.fishmaster.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a user's aquarium tank.
 * Small freshwater tanks (20-70L) are the primary target for FishMaster,
 * as these require more careful monitoring due to limited water volume
 * making them chemically unstable (Kidd & Kidd, 1999).
 */
@Entity
@Table(name = "tanks")
@Getter
@Setter
@NoArgsConstructor
public class Tank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(name = "size_liters", nullable = false)
    private Integer sizeLiters;

    @OneToMany(mappedBy = "tank", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Fish> fish = new ArrayList<>();

    @OneToOne(mappedBy = "tank", cascade = CascadeType.ALL, orphanRemoval = true)
    private WaterParameters waterParameters;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Tank(User user, String name, Integer sizeLiters) {
        this.user = user;
        this.name = name;
        this.sizeLiters = sizeLiters;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void addFish(Fish fish) {
        this.fish.add(fish);
        fish.setTank(this);
    }

    public void setWaterParameters(WaterParameters params) {
        this.waterParameters = params;
        params.setTank(this);
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
