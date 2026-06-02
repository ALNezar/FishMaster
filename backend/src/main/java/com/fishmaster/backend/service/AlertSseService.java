package com.fishmaster.backend.service;

import com.fishmaster.backend.model.Alert;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Collections;

@Service
@Slf4j
public class AlertSseService {

    private final Map<Long, Set<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    public SseEmitter register(Long userId) {
        SseEmitter emitter = new SseEmitter(0L);
        userEmitters.computeIfAbsent(userId, k -> Collections.synchronizedSet(new java.util.HashSet<>())).add(emitter);

        Runnable cleanup = () -> {
            Set<SseEmitter> emitters = userEmitters.get(userId);
            if (emitters != null) {
                emitters.remove(emitter);
                if (emitters.isEmpty()) userEmitters.remove(userId);
            }
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (Exception ignored) {}

        log.debug("[ALERT-SSE] Registered emitter for user={}", userId);
        return emitter;
    }

    public void emit(Long userId, Alert alert) {
        Set<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) return;

        FriendlyAlertCopy.FriendlyMessage friendly = FriendlyAlertCopy.forAlert(alert);
        String displayMessage = friendly.body();

        synchronized (emitters) {
            var it = emitters.iterator();
            while (it.hasNext()) {
                SseEmitter emitter = it.next();
                try {
                    emitter.send(SseEmitter.event()
                            .name("alert")
                            .data(Map.of(
                                    "id", alert.getId(),
                                    "tankId", alert.getTankId(),
                                    "metric", alert.getMetric(),
                                    "value", alert.getValue(),
                                    "severity", alert.getSeverity().name(),
                                    "message", displayMessage,
                                    "title", friendly.title(),
                                    "createdAt", alert.getCreatedAt().toString()
                            )));
                } catch (Exception e) {
                    it.remove();
                }
            }
        }
        log.debug("[ALERT-SSE] Emitted alert id={} to user={}", alert.getId(), userId);
    }

    public void emitResolution(Long userId, Alert alert) {
        Set<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) return;

        synchronized (emitters) {
            var it = emitters.iterator();
            while (it.hasNext()) {
                SseEmitter emitter = it.next();
                try {
                    emitter.send(SseEmitter.event()
                            .name("alert-resolved")
                            .data(Map.of(
                                    "id", alert.getId(),
                                    "tankId", alert.getTankId(),
                                    "metric", alert.getMetric(),
                                    "resolvedAt", alert.getResolvedAt().toString()
                            )));
                } catch (Exception e) {
                    it.remove();
                }
            }
        }
    }
}
