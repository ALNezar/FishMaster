package com.fishmaster.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {

        CorsConfiguration config = new CorsConfiguration();

        // Allow frontend (Vite)
        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        ));

        // IMPORTANT: must be true if using JWT / Authorization headers
        config.setAllowCredentials(true);

        // Allow ALL standard REST methods
        config.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "PATCH",
                "OPTIONS"
        ));

        // Allow ALL headers (safe for development + APIs)
        config.setAllowedHeaders(List.of("*"));

        // Expose all headers (optional but useful for debugging)
        config.setExposedHeaders(List.of("*"));

        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        // ✅ This is the key part: apply to ALL REST endpoints
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}