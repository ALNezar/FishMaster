package com.fishmaster.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "tank_quest_completions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "tank_id", "quest_key", "quest_date"})
)
@Getter
@Setter
@NoArgsConstructor
public class TankQuestCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "tank_id", nullable = false)
    private Long tankId;

    @Column(name = "quest_key", nullable = false, length = 64)
    private String questKey;

    @Column(name = "quest_date", nullable = false)
    private LocalDate questDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private QuestCompletionSource source;

    @Column(name = "completed_at", nullable = false)
    private Instant completedAt = Instant.now();
}
