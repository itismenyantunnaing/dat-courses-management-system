package com.dat_management.backend.controller;

import com.dat_management.backend.config.JwtService;
import com.dat_management.backend.dto.LoginRequest;
import com.dat_management.backend.dto.VerifyCurrentPassword;
import com.dat_management.backend.dto.ChangePasswordRequest;
import com.dat_management.backend.entity.Role;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.EmployeeRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.mock.web.MockHttpSession;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthRestControllerLoginTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void loginReturnsSuccessResponseAndResetsSecurityFields() {
        AuthRestController controller = controller();
        Employee employee = buildUser("EMP001", "encoded-password", 2, LocalDateTime.now().minusMinutes(5));
        LoginRequest request = loginRequest("EMP001", "correct-password");
        org.springframework.security.core.userdetails.User springUser =
                new org.springframework.security.core.userdetails.User(
                        "EMP001",
                        "encoded-password",
                        employee.getAuthorities());
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                springUser,
                null,
                springUser.getAuthorities());

        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches("correct-password", "encoded-password")).thenReturn(true);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtService.generateToken(springUser)).thenReturn("jwt-token");

        ResponseEntity<?> response = controller.login(request);

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = bodyAsMap(response);
        Assertions.assertEquals("jwt-token", body.get("token"));
        Assertions.assertEquals("EMP001", body.get("userId"));
        Assertions.assertEquals("admin", body.get("role"));
        Assertions.assertEquals("Alice Admin", body.get("name"));
        Assertions.assertEquals("alice@dat.com", body.get("email"));
        Assertions.assertEquals("active", body.get("status"));
        Assertions.assertEquals("Login successful", body.get("message"));

        verify(employeeRepository).save(employee);
        Assertions.assertEquals(0, employee.getFailedLoginAttempts());
        Assertions.assertNull(employee.getAccountLockedUntil());
    }

    @Test
    void loginReturnsUnauthorizedWhenUserDoesNotExist() {
        AuthRestController controller = controller();
        LoginRequest request = loginRequest("UNKNOWN", "any-password");

        when(employeeRepository.findById("UNKNOWN")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.login(request);

        Assertions.assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        Assertions.assertEquals("Invalid credentials", bodyAsMap(response).get("message"));
        verify(employeeRepository, never()).save(any(Employee.class));
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void loginReturnsLockedWhenAccountIsStillLocked() {
        AuthRestController controller = controller();
        LocalDateTime lockedUntil = LocalDateTime.now().plusMinutes(10);
        Employee employee = buildUser("EMP003", "encoded-password", 0, lockedUntil);
        LoginRequest request = loginRequest("EMP003", "correct-password");

        when(employeeRepository.findById("EMP003")).thenReturn(Optional.of(employee));

        ResponseEntity<?> response = controller.login(request);

        Assertions.assertEquals(HttpStatus.LOCKED, response.getStatusCode());
        Map<String, Object> body = bodyAsMap(response);
        Assertions.assertEquals("Account locked. Try again later.", body.get("message"));
        Assertions.assertEquals(lockedUntil, body.get("lockedUntil"));
        verify(employeeRepository, never()).save(any(Employee.class));
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void loginReturnsUnauthorizedAndIncrementsAttemptsForInvalidPassword() {
        AuthRestController controller = controller();
        Employee employee = buildUser("EMP002", "encoded-password", 1, null);
        LoginRequest request = loginRequest("EMP002", "wrong-password");

        when(employeeRepository.findById("EMP002")).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches("wrong-password", "encoded-password")).thenReturn(false);

        ResponseEntity<?> response = controller.login(request);

        Assertions.assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        Map<String, Object> body = bodyAsMap(response);
        Assertions.assertEquals("Invalid password", body.get("message"));
        Assertions.assertEquals(2, body.get("attempts"));
        verify(employeeRepository).save(employee);
        Assertions.assertEquals(2, employee.getFailedLoginAttempts());
        Assertions.assertNull(employee.getAccountLockedUntil());
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void loginLocksAccountOnThirdInvalidPasswordAttempt() {
        AuthRestController controller = controller();
        Employee employee = buildUser("EMP003", "encoded-password", 2, null);
        LoginRequest request = loginRequest("EMP003", "wrong-password");

        when(employeeRepository.findById("EMP003")).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches("wrong-password", "encoded-password")).thenReturn(false);

        ResponseEntity<?> response = controller.login(request);

        Assertions.assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        Map<String, Object> body = bodyAsMap(response);
        Assertions.assertEquals("Invalid password", body.get("message"));
        Assertions.assertEquals(3, body.get("attempts"));
        verify(employeeRepository).save(employee);
        Assertions.assertEquals(0, employee.getFailedLoginAttempts());
        Assertions.assertNotNull(employee.getAccountLockedUntil());
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void verifyCurrentPasswordSetsSessionFlagWhenPasswordMatches() {
        AuthRestController controller = controller();
        Employee employee = buildUser("EMP001", "encoded-password", 0, null);
        Authentication authentication = new UsernamePasswordAuthenticationToken("EMP001", null);
        MockHttpSession session = new MockHttpSession();
        VerifyCurrentPassword request = new VerifyCurrentPassword();
        request.setCurrentPassword("correct-password");

        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches("correct-password", "encoded-password")).thenReturn(true);

        ResponseEntity<?> response = controller.verifyCurrentPassword(request, authentication, session);

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(Boolean.TRUE, session.getAttribute("pwd_verified"));
        Assertions.assertEquals(true, bodyAsMap(response).get("verified"));
    }

    @Test
    void verifyCurrentPasswordRejectsWrongPassword() {
        AuthRestController controller = controller();
        Employee employee = buildUser("EMP001", "encoded-password", 0, null);
        Authentication authentication = new UsernamePasswordAuthenticationToken("EMP001", null);
        MockHttpSession session = new MockHttpSession();
        VerifyCurrentPassword request = new VerifyCurrentPassword();
        request.setCurrentPassword("wrong-password");

        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches("wrong-password", "encoded-password")).thenReturn(false);

        ResponseEntity<?> response = controller.verifyCurrentPassword(request, authentication, session);

        Assertions.assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Assertions.assertNull(session.getAttribute("pwd_verified"));
        Assertions.assertEquals(false, bodyAsMap(response).get("verified"));
        Assertions.assertEquals("Wrong password", bodyAsMap(response).get("message"));
    }

    @Test
    void changePasswordRequiresVerifiedSessionFlag() {
        AuthRestController controller = controller();
        Authentication authentication = new UsernamePasswordAuthenticationToken("EMP001", null);
        MockHttpSession session = new MockHttpSession();
        ChangePasswordRequest request = changePasswordRequest("NewPass1!", "NewPass1!");

        ResponseEntity<?> response = controller.changePassword(request, authentication, session);

        Assertions.assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        Assertions.assertEquals("Verify current password first", bodyAsMap(response).get("message"));
    }

    @Test
    void changePasswordRejectsMismatchedPasswords() {
        AuthRestController controller = controller();
        Employee employee = buildUser("EMP001", "encoded-password", 0, null);
        Authentication authentication = new UsernamePasswordAuthenticationToken("EMP001", null);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("pwd_verified", true);
        ChangePasswordRequest request = changePasswordRequest("NewPass1!", "DifferentPass1!");

        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));

        ResponseEntity<?> response = controller.changePassword(request, authentication, session);

        Assertions.assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Assertions.assertEquals("Passwords do not match", bodyAsMap(response).get("message"));
    }

    @Test
    void changePasswordUpdatesPasswordAndClearsVerificationFlag() {
        AuthRestController controller = controller();
        Employee employee = buildUser("EMP001", "encoded-password", 0, null);
        Authentication authentication = new UsernamePasswordAuthenticationToken("EMP001", null);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("pwd_verified", true);
        ChangePasswordRequest request = changePasswordRequest("NewPass1!", "NewPass1!");

        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(passwordEncoder.encode("NewPass1!")).thenReturn("new-encoded-password");

        ResponseEntity<?> response = controller.changePassword(request, authentication, session);

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals("Password changed successfully", bodyAsMap(response).get("message"));
        Assertions.assertEquals("new-encoded-password", employee.getPassword());
        Assertions.assertEquals("active", employee.getStatus());
        Assertions.assertNull(session.getAttribute("pwd_verified"));
        verify(employeeRepository).save(employee);
    }

    private AuthRestController controller() {
        return new AuthRestController(
                authenticationManager,
                jwtService,
                employeeRepository,
                passwordEncoder);
    }

    private static LoginRequest loginRequest(String userId, String password) {
        LoginRequest request = new LoginRequest();
        request.setUserId(userId);
        request.setPassword(password);
        return request;
    }

    private static ChangePasswordRequest changePasswordRequest(String newPassword, String confirmPassword) {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setNewPassword(newPassword);
        request.setConfirmPassword(confirmPassword);
        return request;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> bodyAsMap(ResponseEntity<?> response) {
        return (Map<String, Object>) response.getBody();
    }

    private static Employee buildUser(
            String id,
            String encodedPassword,
            int failedAttempts,
            LocalDateTime lockedUntil
    ) {
        Role role = new Role(1L, "admin");
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName("Alice Admin");
        employee.setEmail("alice@dat.com");
        employee.setPassword(encodedPassword);
        employee.setStatus("active");
        employee.setEmpStatus("active");
        employee.setFailedLoginAttempts(failedAttempts);
        employee.setAccountLockedUntil(lockedUntil);
        employee.setRole(role);
        return employee;
    }
}
