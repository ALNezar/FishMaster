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

    @Async
    public void sendAlertEmail(String to, String tankName, String metric,
                                String currentValue, String safeRange,
                                String severity, String timestamp) {
        try {
            String severityEmoji = severity.equals("CRITICAL") ? "🚨" : "⚠";
            String subject = severityEmoji + " FishMaster Alert: " + capitalize(metric) + " Out of Range";

            String htmlContent = """
                <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
                    <h2 style="color: %s; margin: 0 0 16px;">%s %s Alert</h2>
                    <table style="width: 100%%; border-collapse: collapse;">
                        <tr><td style="padding: 8px 0; color: #666;">Tank</td><td style="padding: 8px 0; font-weight: 700;">%s</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Metric</td><td style="padding: 8px 0; font-weight: 700;">%s</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Current Value</td><td style="padding: 8px 0; font-weight: 700; color: %s;">%s</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Safe Range</td><td style="padding: 8px 0;">%s</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Time</td><td style="padding: 8px 0;">%s</td></tr>
                    </table>
                    <p style="margin-top: 20px; color: #888; font-size: 12px;">— FishMaster Aquarium Monitor</p>
                </div>
                """.formatted(
                    severity.equals("CRITICAL") ? "#dc2626" : "#ca8a04",
                    severityEmoji, capitalize(metric),
                    tankName, capitalize(metric),
                    severity.equals("CRITICAL") ? "#dc2626" : "#ca8a04",
                    currentValue, safeRange, timestamp
            );

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
                logger.info("Alert email sent to: {} for {} alert", to, metric);
            } else {
                logger.error("Resend API error for alert email: {}", response.body());
            }
        } catch (Exception e) {
            logger.error("FAILED to send alert email to: " + to, e);
        }
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
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