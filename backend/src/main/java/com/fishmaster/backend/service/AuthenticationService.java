package com.fishmaster.backend.service;

import com.fishmaster.backend.model.User;
import com.fishmaster.backend.repositories.UserRepo;
import dto.LoginUserDto;
import dto.RegisterUserDto;
import dto.VerifyUserDto;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class AuthenticationService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;


    public AuthenticationService(
            UserRepo userRepo,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            EmailService emailService
    ) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    // --- SIGNUP ---
    public User signup(RegisterUserDto input) {
        User user = new User();
        user.setName(input.getUsername());
        user.setEmail(input.getEmail());
        user.setPassword(passwordEncoder.encode(input.getPassword()));
        user.setVerificationCode(generateVerificationCode());
        user.setVerificationExpiration(LocalDateTime.now().plusMinutes(15));
        user.setEnabled(false);

        // Send email asynchronously (Non-blocking)
        sendVerificationEmail(user);

        return userRepo.save(user);
    }

    // --- LOGIN ---
    public User authenticate(LoginUserDto input) {
        // 1. Check Credentials
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        input.getEmail(),
                        input.getPassword()
                )
        );

        // 2. Fetch User
        User user = userRepo.findByEmail(input.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // 3. Check Verification Status
        if (!user.isEnabled()) {
            throw new DisabledException("Account not verified, please verify your email");
        }

        return user;
    }

    // --- RESEND CODE ---
    public void resendVerificationCode(String email) {
        Optional<User> optionalUser = userRepo.findByEmail(email);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            if (user.isEnabled()) {
                throw new RuntimeException("Account is already verified");
            }
            // Generate new code & Extend expiration
            user.setVerificationCode(generateVerificationCode());
            user.setVerificationExpiration(LocalDateTime.now().plusHours(1));

            // Send the new code via email
            sendVerificationEmail(user);

            userRepo.save(user);
        } else {
            throw new RuntimeException("User not found");
        }
    }

    // --- VERIFY USER ---
    public void verifyUser(VerifyUserDto dto) {
        User user = userRepo.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isEnabled()) {
            throw new RuntimeException("Account already verified");
        }

        // Check if code matches
        // Note: Using getVerficationCode() based on your uploaded DTO (Check for typo in DTO class if red)
        if (!user.getVerificationCode().equals(dto.getVerificationCode())) {
            throw new RuntimeException("Invalid verification code");
        }

        // Check if expired
        if (user.getVerificationExpiration().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification code expired");
        }

        // Enable user
        user.setEnabled(true);
        userRepo.save(user);
    }

    // --- HELPER: SEND EMAIL ---
    private void sendVerificationEmail(User user) {
        String subject = "Account Verification";

        String htmlMessage = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\" />"
                + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />"
                + "<title>Fishmaster - Verification</title></head>"
                + "<body style=\"margin:0;padding:0;font-family:Arial, Helvetica, sans-serif;background:#eef7fb;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#eef7fb;padding:24px 0;\">"
                + "<tr><td align=\"center\">"
                + "<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,0.08);\">"
                + "<tr><td style=\"padding:20px 24px;background:linear-gradient(90deg,#007b9e,#00a6d6);color:#fff;\">"
                + "<table role=\"presentation\" width=\"100%\"><tr><td style=\"vertical-align:middle;\">"
                + "<img src=\"https://example.com/fishmaster-logo.png\" alt=\"Fishmaster\" width=\"120\" style=\"display:block;border:0;outline:none;text-decoration:none;\">"
                + "</td><td style=\"text-align:right;vertical-align:middle;font-size:14px;opacity:0.95;\">Smart Aquarium Monitoring</td></tr></table>"
                + "</td></tr>"
                + "<tr><td style=\"padding:24px;\"><h2 style=\"margin:0 0 8px 0;color:#0b3a4b;font-size:20px;\">Verify your Fishmaster account</h2>"
                + "<p style=\"margin:0 0 18px 0;color:#3b5d66;font-size:14px;line-height:1.4;\">Enter the verification code below to complete sign-in. This code expires in 15 minutes.</p>"
                + "<div style=\"background:#f8fbff;padding:18px;border-radius:6px;border:1px solid #e6f2f8;display:inline-block;\">"
                + "<p style=\"margin:0;font-size:13px;color:#2b3f46;\">Verification Code</p>"
                + "<p style=\"margin:6px 0 0 0;font-size:24px;font-weight:700;letter-spacing:3px;color:#007b9e;\">" + user.getVerificationCode() + "</p>"
                + "</div>"
                + "<p style=\"margin:18px 0 0 0;\"><a href=\"#\" style=\"display:inline-block;padding:10px 16px;border-radius:6px;background:#007b9e;color:#fff;text-decoration:none;font-weight:600;\">Open Fishmaster Dashboard</a></p>"
                + "<p style=\"margin:18px 0 0 0;color:#6b8b92;font-size:12px;\">If you didn't request this, ignore this email.</p>"
                + "</td></tr></table></td></tr></table></body></html>";

        // No try-catch block needed here anymore!
        // The EmailService handles the exception logging internally.
        emailService.sendVerificationEmail(user.getEmail(), subject, htmlMessage);
    }

    private String generateVerificationCode() {
        Random random = new Random();
        int code = random.nextInt(900000) + 100000;
        return String.valueOf(code);
    }
}