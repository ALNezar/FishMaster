package dto;

public class AdvisorQuestDto {
    private String key;
    private String title;
    private String iconKey;
    private String status;
    private String source;
    private boolean manual;

    public AdvisorQuestDto() {}

    public AdvisorQuestDto(String key, String title, String iconKey, String status, String source, boolean manual) {
        this.key = key;
        this.title = title;
        this.iconKey = iconKey;
        this.status = status;
        this.source = source;
        this.manual = manual;
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getIconKey() { return iconKey; }
    public void setIconKey(String iconKey) { this.iconKey = iconKey; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public boolean isManual() { return manual; }
    public void setManual(boolean manual) { this.manual = manual; }
}
