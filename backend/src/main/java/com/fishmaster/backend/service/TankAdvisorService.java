package com.fishmaster.backend.service;

import com.fishmaster.backend.model.*;
import com.fishmaster.backend.repositories.*;
import dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TankAdvisorService {

    private static final List<String> QUEST_KEYS = List.of(
            "check_temperature", "check_ph", "check_clarity", "feed_fish", "clean_filter", "watch_fish"
    );

    private final TankRepository tankRepository;
    private final AlertThresholdRepository thresholdRepository;
    private final AlertRepository alertRepository;
    private final TankQuestCompletionRepository questRepository;
    private final TemperatureReadingRepository temperatureRepository;
    private final PhReadingRepository phRepository;
    private final TurbidityReadingRepository turbidityRepository;

    @Transactional(readOnly = true)
    public AdvisorSnapshotDto getSnapshot(User user, Long tankId) {
        Tank tank = tankRepository.findByIdWithFish(tankId)
                .orElseThrow(() -> new IllegalArgumentException("Tank not found"));
        if (!tank.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Unauthorized");
        }

        String mqttTankId = tank.getMqttTankId() != null ? tank.getMqttTankId() : "tank" + tankId;
        AlertThreshold stored = thresholdRepository.findByTankId(tankId).orElse(null);
        TankHealthCalculator.Thresholds thresholds = TankHealthCalculator.resolveThresholds(tank, stored);

        BigDecimal temp = latestTemperature(mqttTankId);
        BigDecimal ph = latestPh(mqttTankId);
        BigDecimal turbidity = latestTurbidity(mqttTankId);

        TankHealthCalculator.MetricScore scores = TankHealthCalculator.scoreReadings(temp, ph, turbidity, thresholds);
        int health = TankHealthCalculator.overallPercent(scores);

        List<Alert> openAlerts = alertRepository.findByTankIdOrderByCreatedAtDesc(tankId).stream()
                .filter(a -> a.getResolvedAt() == null)
                .toList();
        boolean critical = openAlerts.stream().anyMatch(a -> a.getSeverity() == AlertSeverity.CRITICAL);
        String mood = TankHealthCalculator.moodFromHealth(health, critical);

        LocalDate today = LocalDate.now();
        syncAutoQuests(user.getId(), tankId, today, temp, ph, turbidity, thresholds);

        AdvisorSnapshotDto dto = new AdvisorSnapshotDto();
        dto.setTankId(tankId);
        dto.setTankName(tank.getName());
        dto.setHealthPercent(health);
        dto.setMood(mood);
        dto.setMoodLabel(TankHealthCalculator.moodLabel(mood));
        dto.setAlertCards(buildAlertCards(openAlerts, temp, ph, turbidity, thresholds));
        dto.setQuests(buildQuests(user.getId(), tankId, today));
        dto.setSpeciesWarnings(buildSpeciesWarnings(tank));
        dto.setWeeklyReport(buildWeeklyReport(mqttTankId));
        dto.setRecommendedActions(buildRecommendedActions(dto.getAlertCards(), dto.getQuests()));
        populateTankCareSummary(dto, tank, temp, thresholds, dto.getSpeciesWarnings());
        return dto;
    }

    private void populateTankCareSummary(AdvisorSnapshotDto dto, Tank tank, BigDecimal temp,
                                         TankHealthCalculator.Thresholds thresholds,
                                         List<AdvisorSpeciesWarningDto> speciesWarnings) {
        dto.setSizeLiters(tank.getSizeLiters());
        dto.setFishCount(tank.getFish() != null ? tank.getFish().size() : 0);
        dto.setCompatibilityLabel(compatibilityLabel(speciesWarnings, tank));
        dto.setStockingPercent(estimateStockingPercent(tank));

        if (thresholds.tempMin() != null) {
            dto.setIdealTempMin(thresholds.tempMin().doubleValue());
        }
        if (thresholds.tempMax() != null) {
            dto.setIdealTempMax(thresholds.tempMax().doubleValue());
        }
        if (temp != null) {
            dto.setCurrentTemperature(temp.doubleValue());
            dto.setTemperatureStatus(describeTemperature(temp, thresholds.tempMin(), thresholds.tempMax()));
        } else {
            dto.setTemperatureStatus("No live reading yet");
        }
    }

    private String compatibilityLabel(List<AdvisorSpeciesWarningDto> warnings, Tank tank) {
        if (tank.getFish() == null || tank.getFish().isEmpty()) {
            return "Add fish";
        }
        if (warnings == null || warnings.isEmpty()) {
            return "Good";
        }
        boolean severe = warnings.stream()
                .anyMatch(w -> w.getTitle() != null && w.getTitle().toLowerCase().contains("different"));
        return severe ? "Mixed" : "Watch";
    }

    private String describeTemperature(BigDecimal temp, BigDecimal min, BigDecimal max) {
        if (min == null || max == null) return "In range";
        if (temp.compareTo(min) < 0) {
            BigDecimal gap = min.subtract(temp);
            return gap.compareTo(new BigDecimal("1")) <= 0 ? "Slightly low" : "Too cold";
        }
        if (temp.compareTo(max) > 0) {
            BigDecimal gap = temp.subtract(max);
            return gap.compareTo(new BigDecimal("1")) <= 0 ? "Slightly high" : "Too warm";
        }
        return "In range";
    }

    /** Rough liters-per-fish heuristic for overcrowding hint. */
    private int estimateStockingPercent(Tank tank) {
        if (tank.getFish() == null || tank.getFish().isEmpty() || tank.getSizeLiters() == null || tank.getSizeLiters() <= 0) {
            return 0;
        }
        int required = tank.getFish().size() * 20;
        return Math.min(150, Math.round((required * 100f) / tank.getSizeLiters()));
    }

    @Transactional
    public AdvisorSnapshotDto completeQuest(User user, Long tankId, String questKey) {
        if (!QUEST_KEYS.contains(questKey)) {
            throw new IllegalArgumentException("Unknown quest: " + questKey);
        }
        Tank tank = tankRepository.findById(tankId).orElseThrow(() -> new IllegalArgumentException("Tank not found"));
        if (!tank.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Unauthorized");
        }

        LocalDate today = LocalDate.now();
        TankQuestCompletion completion = questRepository
                .findByUserIdAndTankIdAndQuestKeyAndQuestDate(user.getId(), tankId, questKey, today)
                .orElseGet(TankQuestCompletion::new);

        completion.setUserId(user.getId());
        completion.setTankId(tankId);
        completion.setQuestKey(questKey);
        completion.setQuestDate(today);
        completion.setSource(QuestCompletionSource.MANUAL);
        completion.setCompletedAt(Instant.now());
        questRepository.save(completion);

        return getSnapshot(user, tankId);
    }

    private void syncAutoQuests(Long userId, Long tankId, LocalDate today,
                                BigDecimal temp, BigDecimal ph, BigDecimal turbidity,
                                TankHealthCalculator.Thresholds thresholds) {
        Map<String, Boolean> autoDone = Map.of(
                "check_temperature", inRange(temp, thresholds.tempMin(), thresholds.tempMax()),
                "check_ph", inRange(ph, thresholds.phMin(), thresholds.phMax()),
                "check_clarity", turbidity != null && thresholds.turbidityMax() != null
                        && turbidity.compareTo(thresholds.turbidityMax()) <= 0
        );

        for (var entry : autoDone.entrySet()) {
            if (!entry.getValue()) continue;
            upsertQuest(userId, tankId, entry.getKey(), today, QuestCompletionSource.AUTO);
        }
    }

    private void upsertQuest(Long userId, Long tankId, String questKey, LocalDate date, QuestCompletionSource source) {
        Optional<TankQuestCompletion> existing = questRepository
                .findByUserIdAndTankIdAndQuestKeyAndQuestDate(userId, tankId, questKey, date);
        if (existing.isPresent()) {
            TankQuestCompletion c = existing.get();
            if (c.getSource() == QuestCompletionSource.MANUAL) return;
            return;
        }
        TankQuestCompletion c = new TankQuestCompletion();
        c.setUserId(userId);
        c.setTankId(tankId);
        c.setQuestKey(questKey);
        c.setQuestDate(date);
        c.setSource(source);
        c.setCompletedAt(Instant.now());
        questRepository.save(c);
    }

    private List<AdvisorQuestDto> buildQuests(Long userId, Long tankId, LocalDate today) {
        Map<String, TankQuestCompletion> completed = questRepository
                .findByUserIdAndTankIdAndQuestDate(userId, tankId, today).stream()
                .collect(Collectors.toMap(TankQuestCompletion::getQuestKey, c -> c, (a, b) -> a));

        List<AdvisorQuestDto> quests = new ArrayList<>();
        for (String key : QUEST_KEYS) {
            boolean manual = isManualQuest(key);
            TankQuestCompletion c = completed.get(key);
            boolean done = c != null;
            String status = done ? "done" : "todo";
            String source = c != null ? c.getSource().name().toLowerCase() : null;
            quests.add(new AdvisorQuestDto(key, questTitle(key), questIcon(key), status, source, manual));
        }
        return quests;
    }

    private boolean isManualQuest(String key) {
        return "feed_fish".equals(key) || "clean_filter".equals(key) || "watch_fish".equals(key);
    }

    private String questTitle(String key) {
        return switch (key) {
            case "check_temperature" -> "Check temperature";
            case "check_ph" -> "Check pH";
            case "check_clarity" -> "Check water clarity";
            case "feed_fish" -> "Feed your fish";
            case "clean_filter" -> "Clean the filter";
            case "watch_fish" -> "Watch your fish";
            default -> key;
        };
    }

    private String questIcon(String key) {
        return switch (key) {
            case "check_temperature" -> "temperature";
            case "check_ph" -> "ph";
            case "check_clarity" -> "turbidity";
            case "feed_fish" -> "feed";
            case "clean_filter" -> "filter";
            case "watch_fish" -> "fish";
            default -> "fish";
        };
    }

    private List<AdvisorAlertCardDto> buildAlertCards(List<Alert> openAlerts,
                                                      BigDecimal temp, BigDecimal ph, BigDecimal turbidity,
                                                      TankHealthCalculator.Thresholds thresholds) {
        Set<String> seen = new HashSet<>();
        List<AdvisorAlertCardDto> cards = new ArrayList<>();

        for (Alert alert : openAlerts) {
            FriendlyAlertCopy.FriendlyMessage msg = FriendlyAlertCopy.forAlert(alert);
            String id = "alert-" + alert.getId();
            cards.add(new AdvisorAlertCardDto(id, msg.iconKey(), toneFromSeverity(alert.getSeverity().name()),
                    msg.body(), alert.getMetric()));
            seen.add(alert.getMetric().toLowerCase());
        }

        addLiveCard(cards, seen, "temperature", temp, thresholds.tempMin(), thresholds.tempMax());
        addLiveCard(cards, seen, "ph", ph, thresholds.phMin(), thresholds.phMax());
        addLiveCard(cards, seen, "turbidity", turbidity, null, thresholds.turbidityMax());

        return cards.stream().limit(5).toList();
    }

    private void addLiveCard(List<AdvisorAlertCardDto> cards, Set<String> seen, String metric,
                             BigDecimal value, BigDecimal low, BigDecimal high) {
        if (seen.contains(metric) || value == null) return;
        boolean lowViol = low != null && value.compareTo(low) < 0;
        boolean highViol = high != null && value.compareTo(high) > 0;
        if (!lowViol && !highViol) return;
        FriendlyAlertCopy.FriendlyMessage msg = FriendlyAlertCopy.forMetric(metric, lowViol, "WARNING");
        cards.add(new AdvisorAlertCardDto("live-" + metric, msg.iconKey(), "warning", msg.body(), metric));
    }

    private String toneFromSeverity(String severity) {
        return "CRITICAL".equals(severity) ? "danger" : "warning";
    }

    private List<AdvisorSpeciesWarningDto> buildSpeciesWarnings(Tank tank) {
        List<Fish> fishList = tank.getFish();
        if (fishList == null || fishList.size() < 2) {
            return List.of();
        }

        List<String> names = fishList.stream().map(Fish::getName).toList();
        BigDecimal minTempOverlap = fishList.stream().map(f -> f.getFishType().getMinTemp()).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal maxTempOverlap = fishList.stream().map(f -> f.getFishType().getMaxTemp()).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal minPhOverlap = fishList.stream().map(f -> f.getFishType().getMinPh()).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal maxPhOverlap = fishList.stream().map(f -> f.getFishType().getMaxPh()).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);

        List<AdvisorSpeciesWarningDto> warnings = new ArrayList<>();

        if (minTempOverlap.compareTo(maxTempOverlap) > 0) {
            warnings.add(new AdvisorSpeciesWarningDto(
                    "Different temperature needs",
                    "These fish may not share the same comfort zone.",
                    names));
        } else if (maxTempOverlap.subtract(minTempOverlap).compareTo(new BigDecimal("2")) < 0) {
            warnings.add(new AdvisorSpeciesWarningDto(
                    "Tight temperature overlap",
                    "Keep an eye on how your fish behave together.",
                    names));
        }

        if (minPhOverlap.compareTo(maxPhOverlap) > 0) {
            warnings.add(new AdvisorSpeciesWarningDto(
                    "Different pH needs",
                    "Water chemistry might be tricky for everyone.",
                    names));
        }

        return warnings;
    }

    private List<String> buildWeeklyReport(String mqttTankId) {
        List<String> lines = new ArrayList<>();
        lines.add(trendSentence("Temperature", temperatureValues(mqttTankId, 160)));
        lines.add(trendSentence("pH", phValues(mqttTankId, 160)));
        lines.add(trendSentence("Water clarity", turbidityValues(mqttTankId, 160)));
        return lines.stream().filter(s -> s != null && !s.isBlank()).limit(4).toList();
    }

    private List<String> buildRecommendedActions(List<AdvisorAlertCardDto> cards, List<AdvisorQuestDto> quests) {
        List<String> actions = new ArrayList<>();
        for (AdvisorAlertCardDto card : cards) {
            if ("turbidity".equals(card.getMetric())) {
                actions.add("Check the filter");
            } else if ("temperature".equals(card.getMetric())) {
                actions.add("Check the heater");
            } else if ("ph".equals(card.getMetric())) {
                actions.add("Test the water");
            }
        }
        for (AdvisorQuestDto quest : quests) {
            if ("todo".equals(quest.getStatus())) {
                if ("feed_fish".equals(quest.getKey())) actions.add("Feed your fish");
                if ("clean_filter".equals(quest.getKey())) actions.add("Clean the filter");
            }
        }
        if (actions.isEmpty()) {
            actions.add("Watch your fish for a minute");
        }
        return actions.stream().distinct().limit(3).toList();
    }

    private String trendSentence(String label, List<BigDecimal> values) {
        if (values.size() < 4) return label + ": not enough data yet.";
        int mid = values.size() / 2;
        double first = values.subList(0, mid).stream().mapToDouble(BigDecimal::doubleValue).average().orElse(0);
        double second = values.subList(mid, values.size()).stream().mapToDouble(BigDecimal::doubleValue).average().orElse(0);
        double change = first == 0 ? 0 : ((second - first) / Math.abs(first)) * 100;
        if (Math.abs(change) < 2) return label + " stayed steady this week.";
        if (change > 0) return label + " went up a little this week.";
        return label + " went down a little this week.";
    }

    private List<BigDecimal> temperatureValues(String tankId, int limit) {
        return temperatureRepository.findByTankIdOrderByServerTimestampDesc(tankId, PageRequest.of(0, limit))
                .stream().map(TemperatureReading::getTemperature).filter(Objects::nonNull).toList();
    }

    private List<BigDecimal> phValues(String tankId, int limit) {
        return phRepository.findByTankIdOrderByServerTimestampDesc(tankId, PageRequest.of(0, limit))
                .stream().map(PhReading::getPhValue).filter(Objects::nonNull).toList();
    }

    private List<BigDecimal> turbidityValues(String tankId, int limit) {
        return turbidityRepository.findByTankIdOrderByServerTimestampDesc(tankId, PageRequest.of(0, limit))
                .stream().map(TurbidityReading::getNtu).filter(Objects::nonNull).toList();
    }

    private BigDecimal latestTemperature(String tankId) {
        return temperatureRepository.findTopByTankIdOrderByServerTimestampDesc(tankId)
                .map(TemperatureReading::getTemperature).orElse(null);
    }

    private BigDecimal latestPh(String tankId) {
        return phRepository.findTopByTankIdOrderByServerTimestampDesc(tankId)
                .map(PhReading::getPhValue).orElse(null);
    }

    private BigDecimal latestTurbidity(String tankId) {
        return turbidityRepository.findTopByTankIdOrderByServerTimestampDesc(tankId)
                .map(TurbidityReading::getNtu).orElse(null);
    }

    private boolean inRange(BigDecimal value, BigDecimal min, BigDecimal max) {
        if (value == null) return false;
        if (min != null && value.compareTo(min) < 0) return false;
        if (max != null && value.compareTo(max) > 0) return false;
        return true;
    }
}
