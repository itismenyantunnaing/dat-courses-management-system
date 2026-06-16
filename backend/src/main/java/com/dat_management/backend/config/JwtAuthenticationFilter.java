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

        String path = request.getServletPath();

        logger.info("➡️ REQUEST PATH: {}", path);

        String authHeader = request.getHeader("Authorization");
        logger.info("➡️ AUTH HEADER: {}", authHeader);

        try {
            String jwt = parseJwt(request);

            if (jwt == null) {
                logger.warn("❌ JWT IS NULL");
                filterChain.doFilter(request, response);
                return;
            }

            logger.info("➡️ JWT TOKEN: {}", jwt);

            if (jwtService.validateToken(jwt)) {

                String userId = jwtService.extractUsername(jwt);
                logger.info("➡️ EXTRACTED USERID: {}", userId);

                if (userId != null &&
                        SecurityContextHolder.getContext().getAuthentication() == null) {

                    UserDetails userDetails = userDetailsService.loadUserByUsername(userId);

                    logger.info("➡️ USER LOADED: {}", userDetails.getUsername());
                    logger.info("➡️ AUTHORITIES: {}", userDetails.getAuthorities());

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

                        logger.info("✅ AUTH SUCCESSFUL");
                    } else {
                        logger.error("❌ TOKEN VALIDATION FAILED (userDetails check)");
                    }
                }
            } else {
                logger.error("❌ TOKEN INVALID");
            }

        } catch (ExpiredJwtException e) {
            logger.error("❌ TOKEN EXPIRED");
        } catch (Exception e) {
            logger.error("❌ JWT ERROR: ", e);
        }

        logger.info("➡️ FINAL AUTH: {}", SecurityContextHolder.getContext().getAuthentication());

        filterChain.doFilter(request, response);
    }

    private boolean shouldSkipAuthentication(String path) {
        return PUBLIC_PATHS.contains(path) ||
                path.startsWith("/css/") ||
                path.startsWith("/js/") ||
                path.startsWith("/images/");
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
