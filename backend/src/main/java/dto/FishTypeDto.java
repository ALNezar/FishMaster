package dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Response DTO for fish types list.
 * Includes all information needed for the onboarding dropdown.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FishTypeDto {
    
    private Long id;
    private String name;
    private BigDecimal minPh;
    private BigDecimal maxPh;
    private BigDecimal minTemp;
    private BigDecimal maxTemp;
    private String description;
    private String careLevel;
}
