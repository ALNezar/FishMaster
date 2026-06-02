package dto;

import java.util.ArrayList;
import java.util.List;

public class AdvisorSnapshotDto {
    private Long tankId;
    private String tankName;
    private int healthPercent;
    private String mood;
    private String moodLabel;
    private List<AdvisorAlertCardDto> alertCards = new ArrayList<>();
    private List<AdvisorQuestDto> quests = new ArrayList<>();
    private List<AdvisorSpeciesWarningDto> speciesWarnings = new ArrayList<>();
    private List<String> weeklyReport = new ArrayList<>();
    private List<String> recommendedActions = new ArrayList<>();
    private Integer sizeLiters;
    private Integer fishCount;
    private String compatibilityLabel;
    private Double currentTemperature;
    private Double idealTempMin;
    private Double idealTempMax;
    private String temperatureStatus;
    private Integer stockingPercent;

    public Long getTankId() { return tankId; }
    public void setTankId(Long tankId) { this.tankId = tankId; }
    public String getTankName() { return tankName; }
    public void setTankName(String tankName) { this.tankName = tankName; }
    public int getHealthPercent() { return healthPercent; }
    public void setHealthPercent(int healthPercent) { this.healthPercent = healthPercent; }
    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }
    public String getMoodLabel() { return moodLabel; }
    public void setMoodLabel(String moodLabel) { this.moodLabel = moodLabel; }
    public List<AdvisorAlertCardDto> getAlertCards() { return alertCards; }
    public void setAlertCards(List<AdvisorAlertCardDto> alertCards) { this.alertCards = alertCards; }
    public List<AdvisorQuestDto> getQuests() { return quests; }
    public void setQuests(List<AdvisorQuestDto> quests) { this.quests = quests; }
    public List<AdvisorSpeciesWarningDto> getSpeciesWarnings() { return speciesWarnings; }
    public void setSpeciesWarnings(List<AdvisorSpeciesWarningDto> speciesWarnings) { this.speciesWarnings = speciesWarnings; }
    public List<String> getWeeklyReport() { return weeklyReport; }
    public void setWeeklyReport(List<String> weeklyReport) { this.weeklyReport = weeklyReport; }
    public List<String> getRecommendedActions() { return recommendedActions; }
    public void setRecommendedActions(List<String> recommendedActions) { this.recommendedActions = recommendedActions; }
    public Integer getSizeLiters() { return sizeLiters; }
    public void setSizeLiters(Integer sizeLiters) { this.sizeLiters = sizeLiters; }
    public Integer getFishCount() { return fishCount; }
    public void setFishCount(Integer fishCount) { this.fishCount = fishCount; }
    public String getCompatibilityLabel() { return compatibilityLabel; }
    public void setCompatibilityLabel(String compatibilityLabel) { this.compatibilityLabel = compatibilityLabel; }
    public Double getCurrentTemperature() { return currentTemperature; }
    public void setCurrentTemperature(Double currentTemperature) { this.currentTemperature = currentTemperature; }
    public Double getIdealTempMin() { return idealTempMin; }
    public void setIdealTempMin(Double idealTempMin) { this.idealTempMin = idealTempMin; }
    public Double getIdealTempMax() { return idealTempMax; }
    public void setIdealTempMax(Double idealTempMax) { this.idealTempMax = idealTempMax; }
    public String getTemperatureStatus() { return temperatureStatus; }
    public void setTemperatureStatus(String temperatureStatus) { this.temperatureStatus = temperatureStatus; }
    public Integer getStockingPercent() { return stockingPercent; }
    public void setStockingPercent(Integer stockingPercent) { this.stockingPercent = stockingPercent; }
}
