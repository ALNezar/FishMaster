package dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * DTO for water parameters during onboarding.
 * User can optionally specify pH and temperature, 
 * or leave null to use defaults based on fish types.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WaterParametersDto {
    
    private BigDecimal ph;
    private BigDecimal temperature;
}
