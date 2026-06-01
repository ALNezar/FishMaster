package dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request payload for creating a custom FishType.
 * All numeric fields are optional and will be normalized server-side
 * (defaults applied and Fahrenheit converted to Celsius when needed).
 */
@Getter
@Setter
@NoArgsConstructor
public class CreateFishTypeRequest {
    private String name;
    private Double minPh;     // optional
    private Double maxPh;     // optional
    private Double minTemp;   // optional (°C or °F, detected automatically)
    private Double maxTemp;   // optional (°C or °F, detected automatically)
    private String description;
    private String careLevel; // beginner | intermediate | advanced (case-insensitive), optional
}
