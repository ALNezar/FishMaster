package dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Response DTO for onboarding status check.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingStatusDto {
    
    private boolean completed;
    private String userName;
    private String tankName;
}
