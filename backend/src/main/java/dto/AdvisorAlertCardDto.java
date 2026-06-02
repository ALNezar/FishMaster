package dto;

public class AdvisorAlertCardDto {
    private String id;
    private String iconKey;
    private String tone;
    private String message;
    private String metric;

    public AdvisorAlertCardDto() {}

    public AdvisorAlertCardDto(String id, String iconKey, String tone, String message, String metric) {
        this.id = id;
        this.iconKey = iconKey;
        this.tone = tone;
        this.message = message;
        this.metric = metric;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getIconKey() { return iconKey; }
    public void setIconKey(String iconKey) { this.iconKey = iconKey; }
    public String getTone() { return tone; }
    public void setTone(String tone) { this.tone = tone; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }
}
