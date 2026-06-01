package com.fishmaster.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "alerts", indexes = {
        @Index(name = "idx_alerts_user_created", columnList = "user_id, created_at DESC"),
        @Index(name = "idx_alerts_tank_metric", columnList = "tank_id, metric, resolved_at")
})
@Getter
@Setter
@NoArgsConstructor
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "tank_id", nullable = false)
    private Long tankId;

    @Column(length = 32, nullable = false)
    private String metric;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal value;

    @Column(name = "threshold_low", precision = 10, scale = 2)
    private BigDecimal thresholdLow;

    @Column(name = "threshold_high", precision = 10, scale = 2)
    private BigDecimal thresholdHigh;

    @Enumerated(EnumType.STRING)
    @Column(length = 16, nullable = false)
    private AlertSeverity severity;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
