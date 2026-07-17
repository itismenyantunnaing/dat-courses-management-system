package com.dat_management.backend.controller;

import com.dat_management.backend.config.JwtService;
import com.dat_management.backend.dto.ChangePasswordRequest;
import com.dat_management.backend.dto.LoginRequest;
import com.dat_management.backend.dto.VerifyCurrentPassword;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.EmployeeRepository;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/security/api/auth")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true", allowedHeaders = "*", exposedHeaders = {
                "Authorization", "Content-Type" }, methods = { RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
                                RequestMethod.DELETE, RequestMethod.OPTIONS })
public class AuthRestController {

        private final AuthenticationManager authenticationManager;
        private final JwtService jwtService;
        private final EmployeeRepository employeeRepository;
        private final PasswordEncoder passwordEncoder;

        public AuthRestController(
                        AuthenticationManager authenticationManager,
                        JwtService jwtService,
                        EmployeeRepository userRepository,
                        PasswordEncoder passwordEncoder) {

                this.authenticationManager = authenticationManager;
                this.jwtService = jwtService;
                this.employeeRepository = userRepository;
                this.passwordEncoder = passwordEncoder;
        }

        @PostMapping("/login")
        public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {

                Employee employee = employeeRepository.findByIdAndIsDeletedFalse(request.getUserId())
                                .orElse(null);

                if (employee == null) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body(Map.of("message", "Invalid credentials"));
                }

                // 🔴 1. CHECK ACCOUNT LOCK
                if (employee.getAccountLockedUntil() != null &&
                                employee.getAccountLockedUntil().isAfter(LocalDateTime.now())) {

                        return ResponseEntity.status(HttpStatus.LOCKED)
                                        .body(Map.of(
                                                        "message", "Account locked. Try again later.",
                                                        "lockedUntil", employee.getAccountLockedUntil()));
                }

                // 🔴 2. CHECK PASSWORD
                if (!passwordEncoder.matches(request.getPassword(), employee.getPassword())) {

                        int attempts = employee.getFailedLoginAttempts() + 1;
                        employee.setFailedLoginAttempts(attempts);

                        // 🔥 LOCK AFTER 3 ATTEMPTS
                        if (attempts >= 3) {
                                employee.setAccountLockedUntil(LocalDateTime.now().plusMinutes(10));
                                employee.setFailedLoginAttempts(0); // reset counter
                        }

                        employeeRepository.save(employee);

                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body(Map.of(
                                                        "message", "Invalid password",
                                                        "attempts", attempts));
                }

                // 🟢 3. SUCCESS LOGIN → RESET SECURITY FIELDS
                employee.setFailedLoginAttempts(0);
                employee.setAccountLockedUntil(null);
                employeeRepository.save(employee);

                // 🔵 4. GENERATE TOKEN (your existing logic)
                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getUserId(),
                                                request.getPassword()));

                org.springframework.security.core.userdetails.User springUser = (org.springframework.security.core.userdetails.User) authentication
                                .getPrincipal();

                String token = jwtService.generateToken(springUser);

                return ResponseEntity.ok(Map.of(
                                "token", token,
                                "userId", employee.getId(),
                                "role", employee.getRole().getRoleName(),
                                "name", employee.getName(),
                                "email", employee.getEmail(),
                                "status", employee.getStatus(),
                                "message", "Login successful"));
        }

        @GetMapping("/me")
        public ResponseEntity<?> me(Authentication authentication) {

                Employee employee = employeeRepository
                                .findById(authentication.getName())
                                .orElse(null);

                if (employee == null) {
                        return ResponseEntity.notFound().build();
                }

                Map<String, Object> response = new HashMap<>();

                response.put("id", employee.getId());
                response.put("name", employee.getName());
                response.put("email", employee.getEmail());
                response.put("role", employee.getRole().getRoleName());
                response.put("status", employee.getStatus());

                return ResponseEntity.ok(response);
        }

        @PostMapping("/verify-current-password")
        public ResponseEntity<?> verifyCurrentPassword(
                        @RequestBody VerifyCurrentPassword request,
                        Authentication authentication,
                        HttpSession session) {

                Employee employee = employeeRepository.findById(authentication.getName())
                                .orElseThrow();

                if (!passwordEncoder.matches(request.getCurrentPassword(), employee.getPassword())) {
                        return ResponseEntity.badRequest().body(
                                        Map.of("verified", false, "message", "Wrong password"));
                }

                // 🔥 STORE FLAG
                session.setAttribute("pwd_verified", true);

                return ResponseEntity.ok(
                                Map.of("verified", true, "message", "Verified"));
        }

        @PostMapping("/change-password")
        public ResponseEntity<?> changePassword(
                        @RequestBody ChangePasswordRequest request,
                        Authentication authentication,
                        HttpSession session) {

                Boolean verified = (Boolean) session.getAttribute("pwd_verified");

                Employee employee = employeeRepository.findById(authentication.getName())
                                .orElseThrow();
                                
                if ((verified == null || !verified) && !(employee.getStatus().equals("default"))) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                        .body(Map.of("message", "Verify current password first"));
                }

                if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("message", "Passwords do not match"));
                }

                employee.setPassword(passwordEncoder.encode(request.getNewPassword()));
                employee.setStatus("active");

                employeeRepository.save(employee);

                session.removeAttribute("pwd_verified");

                return ResponseEntity.ok(
                                Map.of("message", "Password changed successfully"));
        }

        @PostMapping("/logout")
        public ResponseEntity<?> logout() {

                return ResponseEntity.ok(
                                Map.of(
                                                "message",
                                                "Logout successful"));
        }
}