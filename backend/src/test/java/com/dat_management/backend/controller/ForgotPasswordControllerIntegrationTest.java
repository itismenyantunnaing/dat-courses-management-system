package com.dat_management.backend.controller;

import com.dat_management.backend.dto.EmailDto;
import com.dat_management.backend.dto.ResetPasswordRequest;
import com.dat_management.backend.dto.VerifyOtpRequest;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// ─────────────────────────────────────────────────────────────────────────────
// Integration Tests for ForgotPasswordController
//
// Exercises the real /api/auth/{forgot-password,verify-otp,reset-password}
// endpoints end-to-end through MockMvc + a real H2-backed Employee, carrying
// one HttpSession across all 3 steps (the flow is entirely session-state
// based, so this is the only way to test it at the HTTP layer).
//
// JavaMailSender is mocked (@MockitoBean) because application-test.properties
// points spring.mail.host at localhost:3025, where nothing is listening —
// letting the real bean run would make TC_SEC_20 fail on a connection
// refused error rather than testing our own code.
// ─────────────────────────────────────────────────────────────────────────────

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ForgotPasswordControllerIntegrationTest {

    private static final Pattern OTP_IN_EMAIL_BODY = Pattern.compile("Your OTP is: (\\d{6})");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private JavaMailSender mailSender;

    @BeforeEach
    void setUp() {
        employeeRepository.deleteAll();
    }

    @Test
    @DisplayName("TC_SEC_20 | full flow | forgot-password → verify-otp → reset-password (valid OTP, matching passwords) → password actually changes in DB")
    void fullResetFlow_validOtpAndPassword_updatesStoredPassword() throws Exception {
        String email = "reset.target@dat.com";
        String oldPassword = "OldPass1!";
        String newPassword = "NewPass2@";
        insertEmployee(email, oldPassword);
        MockHttpSession session = new MockHttpSession();

        // STEP 1: request OTP
        EmailDto step1 = new EmailDto();
        step1.setEmail(email);
        mockMvc.perform(post("/api/auth/forgot-password")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(step1)))
                .andExpect(status().isOk())
                .andExpect(content().string("OTP sent to email"));

        String otp = captureOtpFromLastEmail();

        // STEP 2: verify the OTP that was actually emailed
        VerifyOtpRequest step2 = new VerifyOtpRequest();
        step2.setEmail(email);
        step2.setOtp(otp);
        mockMvc.perform(post("/api/auth/verify-otp")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(step2)))
                .andExpect(status().isOk())
                .andExpect(content().string("OTP verified successfully"));

        // STEP 3: reset the password
        ResetPasswordRequest step3 = new ResetPasswordRequest();
        step3.setEmail(email);
        step3.setNewPassword(newPassword);
        step3.setConfirmPassword(newPassword);
        mockMvc.perform(post("/api/auth/reset-password")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(step3)))
                .andExpect(status().isOk())
                .andExpect(content().string("Password reset successful"));

        Employee updated = employeeRepository.findByEmail(email).orElseThrow();
        assertThat(passwordEncoder.matches(newPassword, updated.getPassword())).isTrue();
        assertThat(passwordEncoder.matches(oldPassword, updated.getPassword())).isFalse();
        assertThat(updated.getStatus()).isEqualTo("active");
    }

    @Test
    @DisplayName("TC_SEC_21 | reset-password | newPassword and confirmPassword differ → API accepts it anyway " +
            "(DEFECT: ForgotPasswordController never compares request.getConfirmPassword() against newPassword)")
    void resetFlow_mismatchedConfirmPassword_isNotRejected() throws Exception {
        // FINDING: ResetPasswordRequest carries a confirmPassword field, but
        // ForgotPasswordController#resetPassword only forwards email + newPassword to the
        // service — confirmPassword is read from the request body and then silently dropped.
        // This test documents the CURRENT (buggy) behavior so it fails loudly the moment
        // someone adds the missing check, prompting an update here rather than a silent gap.
        String email = "confirm.mismatch@dat.com";
        insertEmployee(email, "OldPass1!");
        MockHttpSession session = new MockHttpSession();
        requestAndVerifyOtp(session, email);

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail(email);
        request.setNewPassword("NewPass2@");
        request.setConfirmPassword("TotallyDifferent3#");

        mockMvc.perform(post("/api/auth/reset-password")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Password reset successful"));

        Employee updated = employeeRepository.findByEmail(email).orElseThrow();
        assertThat(passwordEncoder.matches("NewPass2@", updated.getPassword())).isTrue();
    }

    @Test
    @DisplayName("TC_SEC_22 | forgot-password | unregistered email → silently returns 200 OK with an empty body " +
            "(DEFECT: sendOtp() throws a plain RuntimeException that GlobalExceptionHandler doesn't catch, and " +
            "no HandlerExceptionResolver handles it either, so Spring's test dispatcher swallows it entirely — " +
            "the client sees what looks like success with no confirmation message and no OTP actually sent)")
    void sendOtp_unregisteredEmail_silentlyReturnsEmptyOk() throws Exception {
        EmailDto request = new EmailDto();
        request.setEmail("nobody-registered@dat.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string(""));
    }

    // ── helpers ────────────────────────────────────────────────────────────

    private void requestAndVerifyOtp(MockHttpSession session, String email) throws Exception {
        EmailDto emailRequest = new EmailDto();
        emailRequest.setEmail(email);
        mockMvc.perform(post("/api/auth/forgot-password")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emailRequest)))
                .andExpect(status().isOk());

        String otp = captureOtpFromLastEmail();

        VerifyOtpRequest verifyRequest = new VerifyOtpRequest();
        verifyRequest.setEmail(email);
        verifyRequest.setOtp(otp);
        mockMvc.perform(post("/api/auth/verify-otp")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andExpect(content().string("OTP verified successfully"));
    }

    private String captureOtpFromLastEmail() {
        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, atLeastOnce()).send(captor.capture());
        SimpleMailMessage lastMessage = captor.getAllValues().get(captor.getAllValues().size() - 1);
        Matcher matcher = OTP_IN_EMAIL_BODY.matcher(lastMessage.getText());
        assertThat(matcher.find())
                .as("expected the mocked email body to contain 'Your OTP is: NNNNNN', got: " + lastMessage.getText())
                .isTrue();
        return matcher.group(1);
    }

    private Employee insertEmployee(String email, String rawPassword) {
        Employee employee = new Employee();
        employee.setId("EMP-SEC-" + Math.abs(email.hashCode()));
        employee.setName("Reset Target");
        employee.setEmail(email);
        employee.setPassword(passwordEncoder.encode(rawPassword));
        employee.setPosition("Engineer");
        employee.setStatus("active");
        employee.setEmpStatus("active");
        employee.setIsCorePersonnel(false);
        employee.setHasJapanBusinessTrip(false);
        employee.setNotiSetting(false);
        employee.setIsDeleted(false);
        return employeeRepository.save(employee);
    }
}