package dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for individual fish data during onboarding.
 * Each fish has a name and a type (species).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FishDto {
    
    private String name;
    private Long fishTypeId;
}
