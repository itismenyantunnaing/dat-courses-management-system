package com.dat_management.backend.controller;

import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.Role;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.RoleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * AuthRestControllerLoginTest already covers login/verify/change-password
 * business logic thoroughly, but entirely via direct method calls on a
 * Mockito-mocked controller instance — no HTTP, no real password encoding,
 * no real JWT generation, and no Spring Security filter chain. This file
 * fills that gap: a real MockMvc round trip through JwtAuthenticationFilter
 * and SecurityConfig's authorization rules, using the real BCryptPasswordEncoder
 * and real JwtService bean.
 *
 * NOTE: JwtService.getExpirationTime() and AuthRestController.getMaxLoginAttempts()
 * both hardcode systemConfigRepository.findById(1L). data.sql seeds that row
 * (id 1) once at application context startup, outside any test's transaction,
 * so it's already present before setUp() ever runs and survives every test's
 * rollback. setUp() intentionally leaves it alone -- see the comment there.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthRestControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String RAW_PASSWORD = "correct-password";

    @BeforeEach
    void setUp() {
        employeeRepository.deleteAll();
    }

    @Test
    @DisplayName("TC_AUTH_INT_001 | POST login with correct credentials -> 200, real JWT issued, security fields reset")
    void login_correctCredentials_returnsRealJwtAndResetsSecurityFields() throws Exception {
        employeeRepository.save(employee("EMP001", "admin", 2, LocalDateTime.now().minusMinutes(5)));

        MvcResult result = mockMvc.perform(post("/security/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("EMP001", RAW_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("EMP001"))
                .andExpect(jsonPath("$.role").value("admin"))
                .andExpect(jsonPath("$.name").value("Alice Admin"))
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andReturn();

        String token = extractField(result, "token");
        Assertions.assertEquals(3, token.split("\\.").length, "JWT should have header.payload.signature");

        Employee updated = employeeRepository.findById("EMP001").orElseThrow();
        Assertions.assertEquals(0, updated.getFailedLoginAttempts());
        Assertions.assertNull(updated.getAccountLockedUntil());
    }

    @Test
    @DisplayName("TC_AUTH_INT_002 | POST login with wrong password -> 401, increments failed attempts in DB")
    void login_wrongPassword_returns401AndIncrementsAttempts() throws Exception {
        employeeRepository.save(employee("EMP002", "staff", 0, null));

        mockMvc.perform(post("/security/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("EMP002", "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid password"))
                .andExpect(jsonPath("$.attempts").value(1));

        Employee updated = employeeRepository.findById("EMP002").orElseThrow();
        Assertions.assertEquals(1, updated.getFailedLoginAttempts());
    }

    @Test
    @DisplayName("TC_AUTH_INT_003 | POST login for unknown user -> 401 Invalid credentials")
    void login_unknownUser_returns401() throws Exception {
        mockMvc.perform(post("/security/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("UNKNOWN", "any-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    @DisplayName("TC_AUTH_INT_004 | POST login for a locked account -> 423 Locked, password never checked")
    void login_accountLocked_returns423() throws Exception {
        LocalDateTime lockedUntil = LocalDateTime.now().plusMinutes(10);
        employeeRepository.save(employee("EMP003", "admin", 0, lockedUntil));

        mockMvc.perform(post("/security/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("EMP003", "totally-wrong-password")))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.message").value("Account locked. Try again later."));
    }

    @Test
    @DisplayName("TC_AUTH_INT_005 | GET /me without a token -> 403 Forbidden (unauthenticated)")
    void me_noToken_returns403() throws Exception {
        mockMvc.perform(get("/security/api/auth/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC_AUTH_INT_006 | GET /me with a garbage token -> 403 Forbidden")
    void me_garbageToken_returns403() throws Exception {
        mockMvc.perform(get("/security/api/auth/me")
                        .header("Authorization", "Bearer not-a-real-jwt"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC_AUTH_INT_007 | GET /me with a valid token from real login -> 200, resolves employee via the filter chain")
    void me_validToken_returnsAuthenticatedEmployee() throws Exception {
        employeeRepository.save(employee("EMP001", "admin", 0, null));
        String token = login("EMP001", RAW_PASSWORD);

        mockMvc.perform(get("/security/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("EMP001"))
                .andExpect(jsonPath("$.name").value("Alice Admin"))
                .andExpect(jsonPath("$.role").value("admin"))
                .andExpect(jsonPath("$.status").value("active"));
    }

    @Test
    @DisplayName("TC_AUTH_INT_008 | POST /logout without a token -> 403 Forbidden (not in the permitAll list)")
    void logout_noToken_returns403() throws Exception {
        mockMvc.perform(post("/security/api/auth/logout"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC_AUTH_INT_009 | POST /logout with a valid token -> 200 Logout successful")
    void logout_validToken_returns200() throws Exception {
        employeeRepository.save(employee("EMP001", "admin", 0, null));
        String token = login("EMP001", RAW_PASSWORD);

        mockMvc.perform(post("/security/api/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logout successful"));
    }

    @Test
    @DisplayName("TC_AUTH_INT_010 | verify-current-password then change-password, sharing one session -> password actually changes and old password stops working")
    void verifyThenChangePassword_fullRoundTrip_persistsNewPasswordAndInvalidatesOld() throws Exception {
        employeeRepository.save(employee("EMP001", "admin", 0, null));
        String token = login("EMP001", RAW_PASSWORD);

        MvcResult verifyResult = mockMvc.perform(post("/security/api/auth/verify-current-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"" + RAW_PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true))
                .andReturn();
        MockHttpSession session = (MockHttpSession) verifyResult.getRequest().getSession(false);
        Assertions.assertNotNull(session, "verify-current-password should have stored the pwd_verified flag in a session");

        mockMvc.perform(post("/security/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newPassword\":\"NewPass1!\",\"confirmPassword\":\"NewPass1!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));

        Employee updated = employeeRepository.findById("EMP001").orElseThrow();
        Assertions.assertTrue(passwordEncoder.matches("NewPass1!", updated.getPassword()));
        Assertions.assertEquals("active", updated.getStatus());

        mockMvc.perform(post("/security/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("EMP001", RAW_PASSWORD)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/security/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("EMP001", "NewPass1!")))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("TC_AUTH_INT_011 | change-password without verifying first, for a non-\"default\" status employee -> 403 Forbidden")
    void changePassword_noPriorVerification_returns403() throws Exception {
        employeeRepository.save(employee("EMP001", "admin", 0, null));
        String token = login("EMP001", RAW_PASSWORD);

        mockMvc.perform(post("/security/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newPassword\":\"NewPass1!\",\"confirmPassword\":\"NewPass1!\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Verify current password first"));
    }

    private String login(String userId, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/security/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(userId, password)))
                .andExpect(status().isOk())
                .andReturn();
        return extractField(result, "token");
    }

    private static String extractField(MvcResult result, String field) throws Exception {
        Map<?, ?> body = new ObjectMapper().readValue(result.getResponse().getContentAsString(), Map.class);
        return String.valueOf(body.get(field));
    }

    private Employee employee(String id, String roleName, int failedAttempts, LocalDateTime lockedUntil) {
        Role role = roleRepository.findByRoleName(roleName).orElseGet(() -> roleRepository.save(role(roleName)));

        Employee employee = new Employee();
        employee.setId(id);
        employee.setName("Alice Admin");
        employee.setEmail(id.toLowerCase() + "@dat.com");
        employee.setPassword(passwordEncoder.encode(RAW_PASSWORD));
        employee.setDoorlog("door-" + id);
        employee.setPosition("Engineer");
        employee.setEmpStatus("active");
        employee.setStatus("active");
        employee.setRole(role);
        employee.setFailedLoginAttempts(failedAttempts);
        employee.setAccountLockedUntil(lockedUntil);
        employee.setIsCorePersonnel(false);
        employee.setHasJapanBusinessTrip(false);
        employee.setNotiSetting(false);
        employee.setIsDeleted(false);
        return employee;
    }

    private static Role role(String roleName) {
        Role role = new Role();
        role.setRoleName(roleName);
        return role;
    }

    private static String loginJson(String userId, String password) {
        return "{\"userId\":\"" + userId + "\",\"password\":\"" + password + "\"}";
    }
}