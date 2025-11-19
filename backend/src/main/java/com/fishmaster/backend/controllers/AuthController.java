package com.fishmaster.backend.controllers;

import com.fishmaster.backend.model.User;
import com.fishmaster.backend.responses.LoginResponse;
import com.fishmaster.backend.service.AuthenticationService;
import com.fishmaster.backend.service.JwtService;
import dto.LoginUserDto;
import dto.RegisterUserDto;
import dto.VerifyUserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;
    private final JwtService jwtService;

    @PostMapping("/signup")
    public ResponseEntity<User> signup(@RequestBody RegisterUserDto dto) {
        User user = authenticationService.signup(dto);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginUserDto dto) {
        User user = authenticationService.authenticate(dto);
        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new LoginResponse(token, jwtService.getExpirationTime()));
    }

    @PostMapping("/verify")
    public ResponseEntity<String> verify(@RequestBody VerifyUserDto dto) {
        try {
            authenticationService.verifyUser(dto);
            return ResponseEntity.ok("Account verified");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/resend")
    public ResponseEntity<String> resend(@RequestBody String email) {
        try {
            authenticationService.resendVerificationCode(email);
            return ResponseEntity.ok("Verification code sent");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
