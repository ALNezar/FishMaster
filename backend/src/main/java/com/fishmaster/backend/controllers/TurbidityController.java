package com.fishmaster.backend.controllers;

import com.fishmaster.backend.model.TurbidityReading;
import com.fishmaster.backend.repositories.TurbidityReadingRepository;
import com.fishmaster.backend.service.TelemetryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.servlet.http.HttpServletResponse;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/telemetry/turbidity")
@RequiredArgsConstructor
public class TurbidityController {

    private final TelemetryService telemetryService;
    private final TurbidityReadingRepository repository;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Accel-Buffering", "no");
        SseEmitter emitter = telemetryService.registerTurbidityEmitter();
        try {
            emitter.send(SseEmitter.event().name("ready").data("ok"));
        } catch (Exception ignored) { }
        return emitter;
    }

    @GetMapping("/latest")
    public Optional<TurbidityReading> latest(@RequestParam(defaultValue = "tank1") String tankId) {
        return repository.findTopByTankIdOrderByServerTimestampDesc(tankId);
    }

    @GetMapping("/recent")
    public List<TurbidityReading> recent(@RequestParam(defaultValue = "tank1") String tankId,
                                         @RequestParam(defaultValue = "50") int limit) {
        int safeLimit = Math.max(1, Math.min(500, limit));
        return repository.findByTankIdOrderByServerTimestampDesc(tankId, PageRequest.of(0, safeLimit));
    }

    // Optional HTTP ingest for testing or when MQTT is not available in the runtime
    @PostMapping(value = "/ingest", consumes = MediaType.APPLICATION_JSON_VALUE)
    public void ingest(@RequestBody String payload) {
        telemetryService.handleTurbidityPayload(payload, "http-ingest");
    }
}
