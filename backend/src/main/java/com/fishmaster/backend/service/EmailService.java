package com.fishmaster.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${resend.api-key}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Async
    public void sendVerificationEmail(String to, String subject, String htmlContent) {
        try {
            logger.info("Attempting to send email to: {}", to);

            String body = """
                {
                    "from": "Fishmaster <onboarding@resend.dev>",
                    "to": ["%s"],
                    "subject": "%s",
                    "html": %s
                }
                """.formatted(to, subject, toJsonString(htmlContent));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                logger.info("Email successfully sent to: {}", to);
            } else {
                logger.error("Resend API error: {}", response.body());
            }

        } catch (Exception e) {
            logger.error("FAILED to send email to: " + to, e);
        }
    }

    // Safely escapes the HTML string for embedding in JSON
    private String toJsonString(String text) {
        return "\"" + text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t")
                + "\"";
    }
}