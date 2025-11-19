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

@RequestMapping("/auth")
@RestController
@RequiredArgsConstructor
public class AuthController {

    private final JwtService jwtService;
    private final AuthenticationService authenticationService;

    @PostMapping("/signup")
    public ResponseEntity<User> register(@RequestBody RegisterUserDto registerUserDto) {

        // Create user in DB
        User registeredUser = authenticationService.signup(registerUserDto);

        // Return the user object
        return ResponseEntity.ok(registeredUser);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticate(@RequestBody LoginUserDto loginUserDto) {

        // Check credentials
        User authenticatedUser = authenticationService.authenticate(loginUserDto);

        // Generate token
        String jwtToken = jwtService.generateToken(authenticatedUser);

        // Prepare response
        LoginResponse loginResponse = new LoginResponse(
                jwtToken,
                jwtService.getExpirationTime()
        );

        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyUser(@RequestBody VerifyUserDto verifyUserDto) {
        try {
            // Try to verify the user using the code they sent
            authenticationService.verifyUser(verifyUserDto);

            // Send success message
            return ResponseEntity.ok("account verified");

        } catch (RuntimeException e) {
            // Send back error message
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/resend")
    public ResponseEntity<?> resendVerificationCode(@RequestBody String email) {
        try {
            // Resend code to email
            authenticationService.resendVerificationCode(email);

            return ResponseEntity.ok("verification code sent");

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
