package com.fishmaster.backend.controllers;

import com.fishmaster.backend.model.User;
import com.fishmaster.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping("/users")
@RestController
@RequiredArgsConstructor
public class UserControllers {
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<User> authenticateUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(currentUser);
    }

    @GetMapping("/")
    public ResponseEntity<List<User>> allUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @org.springframework.web.bind.annotation.PutMapping("/me")
    public ResponseEntity<User> updateUser(@org.springframework.web.bind.annotation.RequestBody dto.UpdateUserDto dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        User updatedUser = userService.updateUser(currentUser.getId(), dto);
        return ResponseEntity.ok(updatedUser);
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/me")
    public ResponseEntity<Void> deleteUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        userService.deleteUser(currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
