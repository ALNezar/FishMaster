package com.fishmaster.backend.service;

import com.fishmaster.backend.model.User;
import com.fishmaster.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public User updateUser(Long userId, dto.UpdateUserDto dto) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.getName() != null)
            user.setName(dto.getName());
        if (dto.getContactNumber() != null)
            user.setContactNumber(dto.getContactNumber());
        if (dto.getEmailNotifications() != null)
            user.setEmailNotifications(dto.getEmailNotifications());
        if (dto.getSmsNotifications() != null)
            user.setSmsNotifications(dto.getSmsNotifications());

        return userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    public List<User> getAllUsers() {
        List<User> users = new ArrayList<>();
        userRepository.findAll().forEach(users::add);
        return users;
    }
}
