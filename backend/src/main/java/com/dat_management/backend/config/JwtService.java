package com.dat_management.backend.config;

import com.dat_management.backend.entity.SystemConfig;
import com.dat_management.backend.repository.SystemConfigRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class JwtService {

    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);

    private final SystemConfigRepository systemConfigRepository;

    @Value("${jwt.secret}")
    private String secret;

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private long getExpirationTime() {

        SystemConfig config = systemConfigRepository.findById(1L)
                .orElseThrow(() ->
                        new RuntimeException("System configuration not found"));

        return config.getJwtExpiryHours() * 60L * 60L * 1000L;
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(
            String token,
            Function<Claims, T> claimsResolver) {

        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {

        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {

        Date expiration = extractExpiration(token);
        return expiration.before(new Date());
    }

    public String generateToken(UserDetails userDetails) {

        Map<String, Object> claims = new HashMap<>();
        claims.put(
                "authorities",
                userDetails.getAuthorities().toString());

        return createToken(
                claims,
                userDetails.getUsername());
    }

    private String createToken(
            Map<String, Object> claims,
            String subject) {

        Date now = new Date();

        Date expiryDate =
                new Date(now.getTime() + getExpirationTime());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public Boolean validateToken(String token) {

        try {
            return !isTokenExpired(token);
        } catch (ExpiredJwtException e) {
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    public Boolean validateToken(
            String token,
            UserDetails userDetails) {

        try {

            final String username =
                    extractUsername(token);

            return username.equals(
                    userDetails.getUsername())
                    && !isTokenExpired(token);

        } catch (Exception e) {
            return false;
        }
    }
}