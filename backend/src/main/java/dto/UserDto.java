package dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String timezone;
    private Boolean enabled;
    private Boolean onboardingCompleted;
    private String contactNumber;
    private Boolean emailNotifications;
    private Boolean smsNotifications;
    private List<TankDto> tanks;
}

