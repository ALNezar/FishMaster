package com.fishmaster.backend.service;

import com.fishmaster.backend.model.User;
import com.fishmaster.backend.repositories.UserRepo;
import dto.LoginUserDto;
import dto.RegisterUserDto;
import dto.VerifyUserDto;
import jakarta.mail.MessagingException;
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
    private final com.example.demo.service.EmailService emailService;

    public AuthenticationService(
            UserRepo userRepo,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            com.example.demo.service.EmailService emailService
    ) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    public User signup(RegisterUserDto input) {
        User user = new User();
        user.setName(input.getUsername());
        user.setEmail(input.getEmail());
        user.setPassword(passwordEncoder.encode(input.getPassword()));
        user.setVerificationCode(generateVerificationCode());
        user.setVerificationCode(LocalDateTime.now().plusMinutes(15));
        user.setEnabled(false);

        sendVerificationEmail(user);

        return userRepo.save(user);
    }

    public User authenticate(LoginUserDto input) {
        User user = userRepo.findByEmail(input.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email or password"));

        if (!passwordEncoder.matches(input.getPassword(), user.getPassword())) {
            throw new UsernameNotFoundException("Invalid email or password");
        }

        if (!user.isEnabled()) {
            throw new DisabledException("Account not verified, please verify your email");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        input.getEmail(),
                        input.getPassword()
                )
        );

        return user;
    }

    public void resendVerificationCode(String email) {
        Optional<User> optionalUser = userRepo.findByEmail(email);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            if (user.isEnabled()) {
                throw new RuntimeException("Account is already verified");
            }
            user.setVerificationCode(generateVerificationCode());
            user.setVerificationCode(LocalDateTime.now().plusHours(1));
            sendVerificationEmail(user);
            userRepo.save(user);
        } else {
            throw new RuntimeException("User not found");
        }
    }
            // this is gonna take the user
    private void sendVerificationEmail(User user) {
        String subject = "Account Verification";
        String verificationCode = "VERIFICATION CODE " + user.getVerificationCode();
        String htmlMessage = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\" /><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" /><title>Fishmaster \u2014 Verification</title></head><body style=\"margin:0;padding:0;font-family:Arial, Helvetica, sans-serif;background:#eef7fb;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#eef7fb;padding:24px 0;\"><tr><td align=\"center\">"
                + "<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,0.08);\">"
                + "<tr><td style=\"padding:20px 24px;background:linear-gradient(90deg,#007b9e,#00a6d6);color:#fff;\">"
                + "<table role=\"presentation\" width=\"100%\"><tr><td style=\"vertical-align:middle;\">"
                + "<img src=\"https://example.com/fishmaster-logo.png\" alt=\"Fishmaster\" width=\"120\" style=\"display:block;border:0;outline:none;text-decoration:none;\">"
                + "</td><td style=\"text-align:right;vertical-align:middle;font-size:14px;opacity:0.95;\">Smart Aquarium Monitoring</td></tr></table>"
                + "</td></tr>"
                + "<tr><td style=\"padding:24px;\"><h2 style=\"margin:0 0 8px 0;color:#0b3a4b;font-size:20px;\">Verify your Fishmaster account</h2>"
                + "<p style=\"margin:0 0 18px 0;color:#3b5d66;font-size:14px;line-height:1.4;\">Enter the verification code below to complete sign-in. This code expires in 10 minutes.</p>"
                + "<div style=\"background:#f8fbff;padding:18px;border-radius:6px;border:1px solid #e6f2f8;display:inline-block;\">"
                + "<p style=\"margin:0;font-size:13px;color:#2b3f46;\">Verification Code</p>"
                + "<p style=\"margin:6px 0 0 0;font-size:24px;font-weight:700;letter-spacing:3px;color:#007b9e;\">{{verificationCode}}</p>"
                + "</div>"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top:20px;\"><tr><td style=\"padding:12px;background:#fbfeff;border-radius:6px;border:1px solid #eef7fb;\">"
                + "<strong style=\"display:block;color:#0b3a4b;\">{{deviceName}} \u2014 Snapshot</strong>"
                + "<table role=\"presentation\" cellpadding=\"6\" cellspacing=\"0\" style=\"width:100%;font-size:13px;color:#2f4a53;margin-top:8px;\"><tr>"
                + "<td style=\"width:33%;\"><small style=\"color:#6b8b92;\">Temp</small><div style=\"font-weight:600;\">{{temp}} \u00b0C</div></td>"
                + "<td style=\"width:33%;\"><small style=\"color:#6b8b92;\">pH</small><div style=\"font-weight:600;\">{{ph}}</div></td>"
                + "<td style=\"width:34%;\"><small style=\"color:#6b8b92;\">Water</small><div style=\"font-weight:600;\">{{waterLevel}}</div></td>"
                + "</tr></table></td></tr></table>"
                + "<p style=\"margin:18px 0 0 0;\"><a href=\"{{dashboardUrl}}\" style=\"display:inline-block;padding:10px 16px;border-radius:6px;background:#007b9e;color:#fff;text-decoration:none;font-weight:600;\">Open Fishmaster Dashboard</a></p>"
                + "<p style=\"margin:18px 0 0 0;color:#6b8b92;font-size:12px;\">If you didn't request this, ignore this email or revoke sessions from your Fishmaster account.</p>"
                + "</td></tr>"
                + "<tr><td style=\"padding:14px 24px;background:#f4fbfe;border-top:1px solid #e7f3f8;font-size:12px;color:#56707a;\">Fishmaster \u2014 IoT Aquarium Lab<br/><span style=\"color:#6b8b92;\">\u00a9 {{year}} Fishmaster</span></td></tr>"
                + "</table></td></tr></table></body></html>";


        try {
            emailService.sendVerificationEmail(user.getEmail(), subject, htmlMessage);
        } catch (MessagingException e) {
            // Handle email sending exception
            e.printStackTrace();
        }
    }
    private String generateVerificationCode() {
        Random random = new Random();
        int code = random.nextInt(900000) + 100000;
        return String.valueOf(code);
    }
}
}
