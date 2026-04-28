package com.fishmaster.backend.controllers;

import com.fishmaster.backend.model.TemperatureReading;
import com.fishmaster.backend.repositories.TemperatureReadingRepository;
import com.fishmaster.backend.service.TelemetryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/telemetry/temperature")
@RequiredArgsConstructor
public class TelemetryController {

    private final TelemetryService telemetryService;
    private final TemperatureReadingRepository repository;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return telemetryService.registerEmitter();
    }

    @GetMapping("/latest")
    public Optional<TemperatureReading> latest(@RequestParam(defaultValue = "tank1") String tankId) {
        return repository.findTopByTankIdOrderByServerTimestampDesc(tankId);
    }

    @GetMapping("/recent")
    public List<TemperatureReading> recent(@RequestParam(defaultValue = "tank1") String tankId,
                                           @RequestParam(defaultValue = "50") int limit) {
        int safeLimit = Math.max(1, Math.min(500, limit));
        return repository.findByTankIdOrderByServerTimestampDesc(tankId, PageRequest.of(0, safeLimit));
    }

    // Optional HTTP ingest for testing or when MQTT is not available in the runtime
    @PostMapping(value = "/ingest", consumes = MediaType.APPLICATION_JSON_VALUE)
    public void ingest(@RequestBody String payload) {
        telemetryService.handleTemperaturePayload(payload);
    }
}
