package com.fishmaster.backend.service;

import com.fishmaster.backend.model.Alert;
import com.fishmaster.backend.model.PushSubscription;
import com.fishmaster.backend.repositories.PushSubscriptionRepository;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@Slf4j
public class WebPushService {

    private final PushSubscriptionRepository pushSubscriptionRepository;

    @Value("${vapid.public-key:}")
    private String vapidPublicKey;

    @Value("${vapid.private-key:}")
    private String vapidPrivateKey;

    @Value("${vapid.subject:mailto:alerts@fishmaster.app}")
    private String vapidSubject;

    public WebPushService(PushSubscriptionRepository pushSubscriptionRepository) {
        this.pushSubscriptionRepository = pushSubscriptionRepository;
    }

    public boolean isConfigured() {
        return vapidPublicKey != null && !vapidPublicKey.isBlank()
                && vapidPrivateKey != null && !vapidPrivateKey.isBlank();
    }

    public String getPublicKey() {
        return vapidPublicKey;
    }

    @Async
    public void sendPush(Long userId, Alert alert) {
        if (!isConfigured()) {
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

        PushService pushService = new PushService();
        pushService.setPublicKey(vapidPublicKey);
        pushService.setPrivateKey(vapidPrivateKey);
        pushService.setSubject(vapidSubject);

        for (PushSubscription sub : subscriptions) {
            try {
                Subscription subscription = new Subscription(
                        sub.getEndpoint(),
                        sub.getP256dh(),
                        sub.getAuth()
                );
                Notification notification = new Notification(
                        subscription,
                        payload.getBytes(StandardCharsets.UTF_8)
                );
                pushService.send(notification);
                log.info("[WEB-PUSH] Push sent successfully to user={}", userId);
            } catch (Exception e) {
                String message = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                if (message.contains("410") || message.contains("404") || message.contains("Gone")) {
                    log.info("[WEB-PUSH] Subscription expired, removing: {}", sub.getEndpoint());
                    pushSubscriptionRepository.delete(sub);
                } else {
                    log.warn("[WEB-PUSH] Failed to send push to {}: {}", sub.getEndpoint(), message);
                }
            }
        }
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
