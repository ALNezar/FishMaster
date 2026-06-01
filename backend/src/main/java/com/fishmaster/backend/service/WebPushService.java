package com.fishmaster.backend.service;

import com.fishmaster.backend.model.Alert;
import com.fishmaster.backend.model.PushSubscription;
import com.fishmaster.backend.repositories.PushSubscriptionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@Service
@Slf4j
public class WebPushService {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${vapid.public-key:}")
    private String vapidPublicKey;

    @Value("${vapid.private-key:}")
    private String vapidPrivateKey;

    public WebPushService(PushSubscriptionRepository pushSubscriptionRepository) {
        this.pushSubscriptionRepository = pushSubscriptionRepository;
    }

    @Async
    public void sendPush(Long userId, Alert alert) {
        if (vapidPublicKey == null || vapidPublicKey.isBlank()) {
            log.debug("[WEB-PUSH] VAPID keys not configured, skipping push notification");
            return;
        }

        List<PushSubscription> subscriptions = pushSubscriptionRepository.findByUserId(userId);
        if (subscriptions.isEmpty()) {
            log.debug("[WEB-PUSH] No push subscriptions for user={}", userId);
            return;
        }

        String severityEmoji = switch (alert.getSeverity()) {
            case CRITICAL -> "🚨";
            case WARNING -> "⚠️";
            case INFO -> "ℹ️";
        };

        String payload = """
                {"title":"%s %s Alert","body":"%s","icon":"/android/launchericon-192x192.png","url":"/alerts"}
                """.formatted(
                severityEmoji,
                capitalize(alert.getMetric()),
                alert.getMessage().replace("\"", "\\\"")
        ).trim();

        for (PushSubscription sub : subscriptions) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(sub.getEndpoint()))
                        .header("Content-Type", "application/json")
                        .header("TTL", "86400")
                        .POST(HttpRequest.BodyPublishers.ofString(payload))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 410 || response.statusCode() == 404) {
                    log.info("[WEB-PUSH] Subscription expired, removing: {}", sub.getEndpoint());
                    pushSubscriptionRepository.delete(sub);
                } else if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    log.info("[WEB-PUSH] Push sent successfully to user={}", userId);
                } else {
                    log.warn("[WEB-PUSH] Push failed with status={}: {}", response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.error("[WEB-PUSH] Failed to send push to {}: {}", sub.getEndpoint(), e.getMessage());
            }
        }
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
