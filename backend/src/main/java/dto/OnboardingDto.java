package dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

/**
 * Complete onboarding payload submitted when user finishes the 10-step setup flow.
 * Contains all data needed to create the user's first tank, fish, and water parameters.
 */
@Getter
@Setter
@NoArgsConstructor
public class OnboardingDto {
    
    private String userName;
    private String tankName;
    private Integer tankSize;  // in liters
    private List<FishDto> fish;
    private WaterParametersDto waterParameters;  // nullable - if null, use defaults
}
