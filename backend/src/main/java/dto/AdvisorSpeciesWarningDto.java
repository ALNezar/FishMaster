package dto;

import java.util.ArrayList;
import java.util.List;

public class AdvisorSpeciesWarningDto {
    private String title;
    private String message;
    private List<String> fishNames = new ArrayList<>();

    public AdvisorSpeciesWarningDto() {}

    public AdvisorSpeciesWarningDto(String title, String message, List<String> fishNames) {
        this.title = title;
        this.message = message;
        this.fishNames = fishNames != null ? fishNames : new ArrayList<>();
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public List<String> getFishNames() { return fishNames; }
    public void setFishNames(List<String> fishNames) { this.fishNames = fishNames; }
}
