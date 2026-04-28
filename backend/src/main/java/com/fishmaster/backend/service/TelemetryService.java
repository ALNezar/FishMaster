package com.fishmaster.backend.service;

import com.fishmaster.backend.model.TemperatureReading;
import com.fishmaster.backend.repositories.TemperatureReadingRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelemetryService {

    private final TemperatureReadingRepository repository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final java.util.Set<SseEmitter> emitters = java.util.Collections.synchronizedSet(new java.util.HashSet<>());

    @Value("${TELEMETRY_DEFAULT_TANK_ID:tank1}")
    private String defaultTankId;

    public void handleTemperaturePayload(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            JsonNode tempNode = node.get("temperature");
            if (tempNode == null || !tempNode.isNumber()) {
                log.warn("[MQTT] Received payload missing numeric 'temperature': {}", payload);
                return;
            }

            BigDecimal value = tempNode.decimalValue();

            TemperatureReading reading = new TemperatureReading();
            reading.setTemperature(value);
            reading.setTankId(Optional.ofNullable(node.path("tankId").asText(null))
                    .filter(s -> !s.isBlank()).orElse(defaultTankId));

            if (node.has("timestamp")) {
                try {
                    reading.setDeviceTimestamp(Instant.parse(node.get("timestamp").asText()));
                } catch (Exception ignored) { }
            }

            // serverTimestamp is initialized in entity
            TemperatureReading saved = repository.save(reading);
            log.info("[TELEMETRY] Stored temperature reading: tank={}, value={}, id={}",
                    saved.getTankId(), saved.getTemperature(), saved.getId());
            emitToSubscribers(saved);
        } catch (Exception ex) {
            log.error("[TELEMETRY] Failed to parse/store payload: {}", payload, ex);
        }
    }

    public SseEmitter registerEmitter() {
        SseEmitter emitter = new SseEmitter(0L); // no timeout, client controls
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        return emitter;
    }

    private void emitToSubscribers(TemperatureReading reading) {
        synchronized (emitters) {
            java.util.Iterator<SseEmitter> it = emitters.iterator();
            while (it.hasNext()) {
                SseEmitter emitter = it.next();
                try {
                    emitter.send(SseEmitter.event()
                            .name("temperature")
                            .data(reading));
                } catch (Exception e) {
                    it.remove();
                }
            }
        }
    }
}
