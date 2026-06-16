package com.dat_management.backend.service;

import com.dat_management.backend.config.JwtService;
import com.dat_management.backend.dto.AuthResponse;
import com.dat_management.backend.dto.LoginRequest;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final EmployeeRepository employeeRepository;

    private final AuthenticationManager authenticationManager;

    private final JwtService jwtService;



    public AuthResponse authenticateUser(LoginRequest loginRequest) {

        Employee employee = employeeRepository.findById(loginRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (employee.getAccountLockedUntil() != null
                && employee.getAccountLockedUntil().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Account locked for 3 minutes.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUserId(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            employee.setFailedLoginAttempts(0);
            employee.setAccountLockedUntil(null);
            employeeRepository.save(employee);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            String token = jwtService.generateToken(userDetails);

            String role = userDetails.getAuthorities()
                    .stream()
                    .findFirst()
                    .map(authority -> authority.getAuthority().replace("ROLE_", "").toUpperCase(Locale.ROOT))
                    .orElse("STAFF");

            return new AuthResponse(token, "Login successful", false, userDetails.getUsername(), role);

        } catch (BadCredentialsException e) {

            int attempts = employee.getFailedLoginAttempts() + 1;
            employee.setFailedLoginAttempts(attempts);

            if (attempts >= 5) {
                employee.setAccountLockedUntil(LocalDateTime.now().plusMinutes(3));
            }

            employeeRepository.save(employee);

            throw new RuntimeException("Invalid username or password");
        }
    }
}
