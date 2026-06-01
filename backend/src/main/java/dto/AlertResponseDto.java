package dto;

import java.math.BigDecimal;
import java.time.Instant;

public class AlertResponseDto {

    private Long id;
    private Long tankId;
    private String tankName;
    private String metric;
    private BigDecimal value;
    private BigDecimal thresholdLow;
    private BigDecimal thresholdHigh;
    private String severity;
    private String message;
    private Instant createdAt;
    private Instant acknowledgedAt;
    private Instant resolvedAt;

    public AlertResponseDto() {}

    public AlertResponseDto(Long id, Long tankId, String tankName, String metric,
                            BigDecimal value, BigDecimal thresholdLow, BigDecimal thresholdHigh,
                            String severity, String message, Instant createdAt,
                            Instant acknowledgedAt, Instant resolvedAt) {
        this.id = id;
        this.tankId = tankId;
        this.tankName = tankName;
        this.metric = metric;
        this.value = value;
        this.thresholdLow = thresholdLow;
        this.thresholdHigh = thresholdHigh;
        this.severity = severity;
        this.message = message;
        this.createdAt = createdAt;
        this.acknowledgedAt = acknowledgedAt;
        this.resolvedAt = resolvedAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTankId() { return tankId; }
    public void setTankId(Long tankId) { this.tankId = tankId; }
    public String getTankName() { return tankName; }
    public void setTankName(String tankName) { this.tankName = tankName; }
    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }
    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal value) { this.value = value; }
    public BigDecimal getThresholdLow() { return thresholdLow; }
    public void setThresholdLow(BigDecimal thresholdLow) { this.thresholdLow = thresholdLow; }
    public BigDecimal getThresholdHigh() { return thresholdHigh; }
    public void setThresholdHigh(BigDecimal thresholdHigh) { this.thresholdHigh = thresholdHigh; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(Instant acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
