package com.dat_management.backend.config;

import com.dat_management.backend.service.UserDetailsServiceImpl;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/api/auth",
            "/api/auth/login",
            "/api/auth/forgot-password",
            "/api/auth/test-mail",
            "/api/auth/verify-otp",
            "/api/auth/reset-password",
            "/security/api/auth",
            "/security/api/auth/login",
            "/security/api/auth/forgot-password",
            "/security/api/auth/verify-otp",
            "/security/api/auth/reset-password",
            "/",
            "/error"
    );

    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();

        return "OPTIONS".equalsIgnoreCase(request.getMethod()) ||
                shouldSkipAuthentication(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String jwt = parseJwt(request);

            if (jwt == null) {
                filterChain.doFilter(request, response);
                return;
            }

            if (jwtService.validateToken(jwt)) {

                String userId = jwtService.extractUsername(jwt);

                if (userId != null &&
                        SecurityContextHolder.getContext().getAuthentication() == null) {

                    UserDetails userDetails = userDetailsService.loadUserByUsername(userId);

                    if (jwtService.validateToken(jwt, userDetails)) {

                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails,
                                        null,
                                        userDetails.getAuthorities()
                                );

                        auth.setDetails(
                                new WebAuthenticationDetailsSource().buildDetails(request)
                        );

                        SecurityContextHolder.getContext().setAuthentication(auth);
                    } else {
                        logger.debug("JWT rejected: token does not match resolved user");
                    }
                }
            } else {
                logger.debug("JWT rejected: invalid token");
            }

        } catch (ExpiredJwtException e) {
            logger.debug("JWT rejected: expired");
        } catch (Exception e) {
            // Deliberately not logging the exception message/stacktrace here —
            // JWT parsing exceptions from this library can include the raw
            // token text, which must never land in logs.
            logger.debug("JWT rejected: could not be parsed");
        }

        filterChain.doFilter(request, response);
    }

    private boolean shouldSkipAuthentication(String path) {
        // Check exact matches
        if (PUBLIC_PATHS.contains(path)) {
            return true;
        }
        
        // Check path prefixes and patterns
        return path.startsWith("/css/") ||
                path.startsWith("/js/") ||
                path.startsWith("/images/") ||
                // 🔥 ADD THESE TO CATCH ANY AUTH PATHS
                // path.startsWith("/security/api/auth/") ||
                // path.startsWith("/api/auth/") ||
                path.endsWith("/login") ||
                path.endsWith("/forgot-password") ||
                path.endsWith("/verify-otp") ||
                path.endsWith("/reset-password");
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}