package com.dat_management.backend.config;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // Comma-separated list of allowed browser origins. Defaults to local dev
    // (Next.js on localhost:3000) so `mvn spring-boot:run` / a plain local
    // checkout keeps working with zero setup. For Docker/prod, docker-compose
    // injects CORS_ALLOWED_ORIGINS (built from SERVER_IP) so the deployed
    // frontend's real origin is allowed too — see application-prod.properties.
    // This single source of truth replaces the old per-controller
    // @CrossOrigin annotations, which were inconsistent (some allowed "*",
    // others were hardcoded to "http://localhost:3000") and silently broke
    // core features (login, employees, courses, etc.) whenever the app was
    // accessed from anywhere other than localhost.
    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // ✅ Add CORS
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Allow WebSocket endpoints
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/ws/info/**").permitAll()
                        .requestMatchers("/ws/websocket/**").permitAll()

                        // Allow SockJS endpoints
                        .requestMatchers("/sockjs/**").permitAll()

                        // Your existing API endpoints
                        .requestMatchers("/api/**").permitAll()
                        .requestMatchers(
                                "/security/api/auth",
                                "/security/api/auth/login",
                                "/security/api/auth/forgot-password",
                                "/security/api/auth/verify-otp",
                                "/security/api/auth/reset-password",
                                "/api/employees",
                                "/api/employees/",
                                "/courses/**",
                                "/uploads/certificates/**",
                                "/uploads/profiles/**",
                                "/uploads/courses/**",
                                "/profiles/**",
                                "/api/**")
                        .permitAll()

                        // Dashboard endpoints
                        .requestMatchers("/dashboard/admin").hasAnyRole("Admin", "PMO")
                        .requestMatchers("/dashboard/PM").hasAnyRole("PM", "HOD")
                        .requestMatchers("/dashboard/staff").hasRole("STAFF")

                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}