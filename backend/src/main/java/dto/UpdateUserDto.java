package dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserDto {
    private String name;
    private String contactNumber;
    private Boolean emailNotifications;
    private Boolean smsNotifications;
}
