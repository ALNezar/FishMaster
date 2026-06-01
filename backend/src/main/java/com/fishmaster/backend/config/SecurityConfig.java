package com.fishmaster.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AuthenticationProvider authenticationProvider;
    private final JwtAuthFilter jwtAuthenticationFilter;

    // Main security configuration
    @Bean
    public SecurityFilterChain appSecurity(HttpSecurity http) throws Exception {
        http
                // Explicitly enable CORS using the configuration source defined below
                .cors(Customizer.withDefaults())

                // Turn off CSRF since we use JWT, not sessions
                .csrf(csrf -> csrf.disable())

                // Allow /auth/** for public access, protect everything else
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/api/telemetry/**").permitAll()
                        .requestMatchers("/api/devices/**").permitAll()
                        .requestMatchers("/device/**").permitAll()
                        .requestMatchers("/api/alerts/stream").permitAll()
                        .anyRequest().authenticated()
                )

                // Disable sessions (stateless for JWT)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Use our own authentication logic
                .authenticationProvider(authenticationProvider)

                // Run our JWT filter before Spring’s built-in one
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 2. Return CorsConfigurationSource instead of CorsFilter
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Telemetry endpoints are public and don't need cookies; disabling credentials simplifies CORS
        config.setAllowCredentials(false);
        // Allow common local dev and Railway origins; patterns also enable port-agnostic localhost
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://*.railway.app",
                "https://fishmastero.up.railway.app"
        ));
        config.setAllowedHeaders(List.of("*")); // allow all headers
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")); // allowed HTTP methods
        // Helpful when using custom headers with SSE though not strictly required
        config.setExposedHeaders(List.of("Cache-Control", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}