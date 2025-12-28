package com.fishmaster.backend.util;

import com.fishmaster.backend.model.Tank;
import com.fishmaster.backend.model.User;
import dto.TankDto;
import dto.UserDto;
import java.util.stream.Collectors;

public class UserMapper {
    public static UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setTimezone(user.getTimezone());
        dto.setEnabled(user.getEnabled());
        dto.setOnboardingCompleted(user.getOnboardingCompleted());
        dto.setContactNumber(user.getContactNumber());
        dto.setEmailNotifications(user.getEmailNotifications());
        dto.setSmsNotifications(user.getSmsNotifications());
        if (user.getTanks() != null) {
            dto.setTanks(user.getTanks().stream().map(UserMapper::tankToDto).collect(Collectors.toList()));
        }
        return dto;
    }

    private static TankDto tankToDto(Tank tank) {
        TankDto dto = new TankDto();
        dto.setName(tank.getName());
        dto.setSizeLiters(tank.getSizeLiters());
        return dto;
    }
}
