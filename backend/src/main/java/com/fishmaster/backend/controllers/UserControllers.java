package com.fishmaster.backend.controllers;

import com.fishmaster.backend.model.User;
import com.fishmaster.backend.service.UserService;
import com.fishmaster.backend.util.UserMapper;
import dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RequestMapping("/users")
@RestController
@RequiredArgsConstructor
public class UserControllers {
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDto> authenticateUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(UserMapper.toDto(currentUser));
    }

    @GetMapping("/")
    public ResponseEntity<List<dto.UserDto>> allUsers() {
        List<dto.UserDto> users = userService.getAllUsers().stream().map(UserMapper::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @org.springframework.web.bind.annotation.PutMapping("/me")
    public ResponseEntity<UserDto> updateUser(@org.springframework.web.bind.annotation.RequestBody dto.UpdateUserDto dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        User updatedUser = userService.updateUser(currentUser.getId(), dto);
        return ResponseEntity.ok(UserMapper.toDto(updatedUser));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/me")
    public ResponseEntity<Void> deleteUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        userService.deleteUser(currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
