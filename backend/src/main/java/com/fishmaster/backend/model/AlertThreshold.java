package com.fishmaster.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "alert_thresholds")
@Getter
@Setter
@NoArgsConstructor
public class AlertThreshold {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tank_id", nullable = false, unique = true)
    private Long tankId;

    @Column(name = "global_alerts_enabled")
    private Boolean globalAlertsEnabled = true;

    @Column(name = "email_alerts_enabled")
    private Boolean emailAlertsEnabled = true;

    @Column(name = "in_app_alerts_enabled")
    private Boolean inAppAlertsEnabled = true;

    @Column(name = "temperature_enabled")
    private Boolean temperatureEnabled = true;

    @Column(name = "temperature_min", precision = 5, scale = 1)
    private BigDecimal temperatureMin = new BigDecimal("22.0");

    @Column(name = "temperature_max", precision = 5, scale = 1)
    private BigDecimal temperatureMax = new BigDecimal("28.0");

    @Column(name = "ph_enabled")
    private Boolean phEnabled = true;

    @Column(name = "ph_min", precision = 3, scale = 1)
    private BigDecimal phMin = new BigDecimal("6.5");

    @Column(name = "ph_max", precision = 3, scale = 1)
    private BigDecimal phMax = new BigDecimal("7.5");

    @Column(name = "turbidity_enabled")
    private Boolean turbidityEnabled = true;

    @Column(name = "turbidity_max", precision = 5, scale = 1)
    private BigDecimal turbidityMax = new BigDecimal("5.0");

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
