package com.fishmaster.backend.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender emailSender;

    @Async // Runs in a background thread
    public void sendVerificationEmail(String to, String subject, String htmlContent) {
        try {
            logger.info("Attempting to send email to: {}", to);

            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            emailSender.send(message);

            logger.info("Email successfully sent to: {}", to);

        } catch (Exception e) {
            // Log the error here so we can see it in the console
            logger.error("FAILED to send email to: " + to, e);
        }
    }
}