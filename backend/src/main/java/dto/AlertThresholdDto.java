package dto;

import java.math.BigDecimal;

/**
 * Data Transfer Object for alert threshold configuration per tank.
 * 
 * Allows users to configure safe threshold values for water parameters
 * (temperature, pH, turbidity, ammonia) so that FishMaster can generate
 * alerts when readings become unsafe.
 * 
 * Use Case: UC-5 (Configure Alert Thresholds)
 */
public class AlertThresholdDto {

    private Long tankId;

    // Global settings
    private Boolean globalAlertsEnabled;
    private Boolean emailAlertsEnabled;
    private Boolean inAppAlertsEnabled;

    // Temperature thresholds (°C)
    private Boolean temperatureEnabled;
    private BigDecimal temperatureMin;
    private BigDecimal temperatureMax;

    // pH thresholds
    private Boolean phEnabled;
    private BigDecimal phMin;
    private BigDecimal phMax;

    // Turbidity threshold (NTU) - only max, lower is better
    private Boolean turbidityEnabled;
    private BigDecimal turbidityMax;

    // Ammonia threshold (ppm) - only max, any amount is harmful
    private Boolean ammoniaEnabled;
    private BigDecimal ammoniaMax;

    // Constructors
    public AlertThresholdDto() {
    }

    public AlertThresholdDto(Long tankId) {
        this.tankId = tankId;
        // Set defaults for freshwater tanks
        this.globalAlertsEnabled = true;
        this.emailAlertsEnabled = true;
        this.inAppAlertsEnabled = true;
        this.temperatureEnabled = true;
        this.temperatureMin = new BigDecimal("22.0");
        this.temperatureMax = new BigDecimal("28.0");
        this.phEnabled = true;
        this.phMin = new BigDecimal("6.5");
        this.phMax = new BigDecimal("7.5");
        this.turbidityEnabled = true;
        this.turbidityMax = new BigDecimal("5.0");
        this.ammoniaEnabled = true;
        this.ammoniaMax = new BigDecimal("0.25");
    }

    // Getters and Setters
    public Long getTankId() {
        return tankId;
    }

    public void setTankId(Long tankId) {
        this.tankId = tankId;
    }

    public Boolean getGlobalAlertsEnabled() {
        return globalAlertsEnabled;
    }

    public void setGlobalAlertsEnabled(Boolean globalAlertsEnabled) {
        this.globalAlertsEnabled = globalAlertsEnabled;
    }

    public Boolean getEmailAlertsEnabled() {
        return emailAlertsEnabled;
    }

    public void setEmailAlertsEnabled(Boolean emailAlertsEnabled) {
        this.emailAlertsEnabled = emailAlertsEnabled;
    }

    public Boolean getInAppAlertsEnabled() {
        return inAppAlertsEnabled;
    }

    public void setInAppAlertsEnabled(Boolean inAppAlertsEnabled) {
        this.inAppAlertsEnabled = inAppAlertsEnabled;
    }

    public Boolean getTemperatureEnabled() {
        return temperatureEnabled;
    }

    public void setTemperatureEnabled(Boolean temperatureEnabled) {
        this.temperatureEnabled = temperatureEnabled;
    }

    public BigDecimal getTemperatureMin() {
        return temperatureMin;
    }

    public void setTemperatureMin(BigDecimal temperatureMin) {
        this.temperatureMin = temperatureMin;
    }

    public BigDecimal getTemperatureMax() {
        return temperatureMax;
    }

    public void setTemperatureMax(BigDecimal temperatureMax) {
        this.temperatureMax = temperatureMax;
    }

    public Boolean getPhEnabled() {
        return phEnabled;
    }

    public void setPhEnabled(Boolean phEnabled) {
        this.phEnabled = phEnabled;
    }

    public BigDecimal getPhMin() {
        return phMin;
    }

    public void setPhMin(BigDecimal phMin) {
        this.phMin = phMin;
    }

    public BigDecimal getPhMax() {
        return phMax;
    }

    public void setPhMax(BigDecimal phMax) {
        this.phMax = phMax;
    }

    public Boolean getTurbidityEnabled() {
        return turbidityEnabled;
    }

    public void setTurbidityEnabled(Boolean turbidityEnabled) {
        this.turbidityEnabled = turbidityEnabled;
    }

    public BigDecimal getTurbidityMax() {
        return turbidityMax;
    }

    public void setTurbidityMax(BigDecimal turbidityMax) {
        this.turbidityMax = turbidityMax;
    }

    public Boolean getAmmoniaEnabled() {
        return ammoniaEnabled;
    }

    public void setAmmoniaEnabled(Boolean ammoniaEnabled) {
        this.ammoniaEnabled = ammoniaEnabled;
    }

    public BigDecimal getAmmoniaMax() {
        return ammoniaMax;
    }

    public void setAmmoniaMax(BigDecimal ammoniaMax) {
        this.ammoniaMax = ammoniaMax;
    }

    /**
     * Validates that min values are less than max values for parameters that have both.
     * 
     * @return true if valid, false otherwise
     */
    public boolean isValid() {
        // Validate temperature range
        if (temperatureMin != null && temperatureMax != null) {
            if (temperatureMin.compareTo(temperatureMax) >= 0) {
                return false;
            }
        }

        // Validate pH range
        if (phMin != null && phMax != null) {
            if (phMin.compareTo(phMax) >= 0) {
                return false;
            }
        }

        // Validate bounds
        if (temperatureMin != null && temperatureMin.compareTo(BigDecimal.ZERO) < 0) {
            return false;
        }
        if (phMin != null && (phMin.compareTo(BigDecimal.ZERO) < 0 || phMin.compareTo(new BigDecimal("14")) > 0)) {
            return false;
        }
        if (phMax != null && (phMax.compareTo(BigDecimal.ZERO) < 0 || phMax.compareTo(new BigDecimal("14")) > 0)) {
            return false;
        }
        if (turbidityMax != null && turbidityMax.compareTo(BigDecimal.ZERO) < 0) {
            return false;
        }
        if (ammoniaMax != null && ammoniaMax.compareTo(BigDecimal.ZERO) < 0) {
            return false;
        }

        return true;
    }

    @Override
    public String toString() {
        return "AlertThresholdDto{" +
                "tankId=" + tankId +
                ", globalAlertsEnabled=" + globalAlertsEnabled +
                ", emailAlertsEnabled=" + emailAlertsEnabled +
                ", inAppAlertsEnabled=" + inAppAlertsEnabled +
                ", temperatureEnabled=" + temperatureEnabled +
                ", temperatureMin=" + temperatureMin +
                ", temperatureMax=" + temperatureMax +
                ", phEnabled=" + phEnabled +
                ", phMin=" + phMin +
                ", phMax=" + phMax +
                ", turbidityEnabled=" + turbidityEnabled +
                ", turbidityMax=" + turbidityMax +
                ", ammoniaEnabled=" + ammoniaEnabled +
                ", ammoniaMax=" + ammoniaMax +
                '}';
    }
}
