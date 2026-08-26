package com.dat_management.backend.service;

import com.dat_management.backend.dto.VerifyOtpRequest;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

// ─────────────────────────────────────────────────────────────────────────────
// Unit Tests for ForgotPasswordService
//
// Covers the 3-step OTP password-reset flow (sendOtp → verifyOtpOnly →
// resetPassword). This flow had ZERO prior test coverage despite being
// security-sensitive (unauthenticated, session-based, mutates credentials).
//
// A couple of genuine behavioral findings are captured here rather than
// "fixed silently" — see TC_SEC_19, and TC_SEC_21/22 in
// ForgotPasswordControllerIntegrationTest — flag these to the team before
// deciding whether they're bugs or accepted behavior.
// ─────────────────────────────────────────────────────────────────────────────

@ExtendWith(MockitoExtension.class)
class ForgotPasswordServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    private ForgotPasswordService service;

    private static final String EMAIL = "user@dat.com";
    private static final String STRONG_PASSWORD = "Abcdef1!";

    @BeforeEach
    void setUp() {
        service = new ForgotPasswordService(employeeRepository, passwordEncoder, emailService);
    }

    // ── sendOtp ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC_SEC_01 | sendOtp | registered email → generates 6-digit OTP, stores in session, emails it")
    void sendOtp_registeredEmail_generatesAndEmailsOtp() {
        Employee employee = buildEmployee(EMAIL);
        MockHttpSession session = new MockHttpSession();
        when(employeeRepository.findByEmail(EMAIL)).thenReturn(Optional.of(employee));

        String result = service.sendOtp(EMAIL, session);

        assertThat(result).isEqualTo("OTP sent to email");
        String storedOtp = (String) session.getAttribute("otp");
        assertThat(storedOtp).matches("\\d{6}");
        assertThat(session.getAttribute("otpEmail")).isEqualTo(EMAIL);

        LocalDateTime expiry = (LocalDateTime) session.getAttribute("otpExpiry");
        assertThat(expiry).isAfter(LocalDateTime.now().plusSeconds(50));
        assertThat(expiry).isBefore(LocalDateTime.now().plusSeconds(70));

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendOtp(eq(EMAIL), otpCaptor.capture());
        assertThat(otpCaptor.getValue()).isEqualTo(storedOtp);
    }

    @Test
    @DisplayName("TC_SEC_02 | sendOtp | unregistered email → throws, no OTP stored, no email sent")
    void sendOtp_unregisteredEmail_throwsAndSendsNothing() {
        MockHttpSession session = new MockHttpSession();
        when(employeeRepository.findByEmail("ghost@dat.com")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.sendOtp("ghost@dat.com", session));

        assertThat(ex.getMessage()).isEqualTo("Employee not found");
        assertThat(session.getAttribute("otp")).isNull();
        verify(emailService, never()).sendOtp(anyString(), anyString());
    }

    // ── verifyOtpOnly ──────────────────────────────────────────────────────

    @Test
    @DisplayName("TC_SEC_03 | verifyOtpOnly | correct OTP within validity window → verified, session flagged")
    void verifyOtpOnly_correctOtp_marksSessionVerified() {
        MockHttpSession session = seedOtpSession(EMAIL, "123456", LocalDateTime.now().plusSeconds(30));
        VerifyOtpRequest request = verifyOtpRequest(EMAIL, "123456");

        String result = service.verifyOtpOnly(request, session);

        assertThat(result).isEqualTo("OTP verified successfully");
        assertThat(session.getAttribute("otpVerified")).isEqualTo(Boolean.TRUE);
    }

    @Test
    @DisplayName("TC_SEC_04 | verifyOtpOnly | no OTP ever requested (empty session) → \"OTP not generated\"")
    void verifyOtpOnly_emptySession_returnsNotGenerated() {
        MockHttpSession session = new MockHttpSession();
        VerifyOtpRequest request = verifyOtpRequest(EMAIL, "123456");

        String result = service.verifyOtpOnly(request, session);

        assertThat(result).isEqualTo("OTP not generated");
    }

    @Test
    @DisplayName("TC_SEC_05 | verifyOtpOnly | session missing otpExpiry only (partial state) → still \"OTP not generated\"")
    void verifyOtpOnly_partiallyPopulatedSession_returnsNotGenerated() {
        // Boundary on the (sessionOtp == null || sessionEmail == null || expiry == null) check —
        // otp and email are present but expiry alone is missing.
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("otp", "123456");
        session.setAttribute("otpEmail", EMAIL);
        VerifyOtpRequest request = verifyOtpRequest(EMAIL, "123456");

        String result = service.verifyOtpOnly(request, session);

        assertThat(result).isEqualTo("OTP not generated");
    }

    @Test
    @DisplayName("TC_SEC_06 | verifyOtpOnly | OTP past its 1-minute validity → \"OTP expired\", session invalidated")
    void verifyOtpOnly_expiredOtp_invalidatesSessionAndRejects() {
        MockHttpSession session = seedOtpSession(EMAIL, "123456", LocalDateTime.now().minusSeconds(1));
        VerifyOtpRequest request = verifyOtpRequest(EMAIL, "123456");

        String result = service.verifyOtpOnly(request, session);

        assertThat(result).isEqualTo("OTP expired");
        assertThrows(IllegalStateException.class, () -> session.getAttribute("otp"));
    }

    @Test
    @DisplayName("TC_SEC_07 | verifyOtpOnly | request email differs from the email OTP was sent to → \"Email mismatch\"")
    void verifyOtpOnly_emailMismatch_rejectsWithoutInvalidatingSession() {
        MockHttpSession session = seedOtpSession(EMAIL, "123456", LocalDateTime.now().plusSeconds(30));
        VerifyOtpRequest request = verifyOtpRequest("someone.else@dat.com", "123456");

        String result = service.verifyOtpOnly(request, session);

        assertThat(result).isEqualTo("Email mismatch");
        // Session should remain usable for a legitimate retry with the correct email.
        assertThat(session.getAttribute("otp")).isEqualTo("123456");
    }

    @Test
    @DisplayName("TC_SEC_08 | verifyOtpOnly | wrong OTP code → \"Invalid OTP\", session stays alive for retry")
    void verifyOtpOnly_wrongOtp_rejectsWithoutInvalidatingSession() {
        MockHttpSession session = seedOtpSession(EMAIL, "123456", LocalDateTime.now().plusSeconds(30));
        VerifyOtpRequest request = verifyOtpRequest(EMAIL, "999999");

        String result = service.verifyOtpOnly(request, session);

        assertThat(result).isEqualTo("Invalid OTP");
        assertThat(session.getAttribute("otpVerified")).isNull();
    }

    // ── resetPassword ──────────────────────────────────────────────────────

    @Test
    @DisplayName("TC_SEC_09 | resetPassword | OTP never verified this session → \"Please verify OTP first\", DB untouched")
    void resetPassword_notVerified_rejectsAndSkipsDb() {
        MockHttpSession session = new MockHttpSession();

        String result = service.resetPassword(EMAIL, STRONG_PASSWORD, session);

        assertThat(result).isEqualTo("Please verify OTP first");
        verifyNoInteractions(employeeRepository, passwordEncoder);
    }

    @Test
    @DisplayName("TC_SEC_10 | resetPassword | otpVerified explicitly false → treated same as never-verified")
    void resetPassword_verifiedFlagFalse_rejects() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("otpVerified", false);
        session.setAttribute("otpEmail", EMAIL);

        String result = service.resetPassword(EMAIL, STRONG_PASSWORD, session);

        assertThat(result).isEqualTo("Please verify OTP first");
        verifyNoInteractions(employeeRepository);
    }

    @Test
    @DisplayName("TC_SEC_11 | resetPassword | verified for a different email than the one being reset → \"Invalid email\"")
    void resetPassword_emailDoesNotMatchVerifiedSession_rejects() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("otpVerified", true);
        session.setAttribute("otpEmail", "verified.owner@dat.com");

        String result = service.resetPassword("attacker.target@dat.com", STRONG_PASSWORD, session);

        assertThat(result).isEqualTo("Invalid email");
        verifyNoInteractions(employeeRepository);
    }

    @Test
    @DisplayName("TC_SEC_12 | resetPassword | password below 8 characters → rejected by policy check")
    void resetPassword_passwordTooShort_rejectedByPolicy() {
        assertPolicyRejects("Ab1!abc"); // 7 chars
    }

    @Test
    @DisplayName("TC_SEC_13 | resetPassword | password missing an uppercase letter → rejected by policy check")
    void resetPassword_passwordMissingUppercase_rejectedByPolicy() {
        assertPolicyRejects("abcdefg1!");
    }

    @Test
    @DisplayName("TC_SEC_14 | resetPassword | password missing a lowercase letter → rejected by policy check")
    void resetPassword_passwordMissingLowercase_rejectedByPolicy() {
        assertPolicyRejects("ABCDEFG1!");
    }

    @Test
    @DisplayName("TC_SEC_15 | resetPassword | password missing a digit → rejected by policy check")
    void resetPassword_passwordMissingDigit_rejectedByPolicy() {
        assertPolicyRejects("Abcdefgh!");
    }

    @Test
    @DisplayName("TC_SEC_16 | resetPassword | password missing a special character → rejected by policy check")
    void resetPassword_passwordMissingSpecialChar_rejectedByPolicy() {
        assertPolicyRejects("Abcdefg1");
    }

    private void assertPolicyRejects(String weakPassword) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("otpVerified", true);
        session.setAttribute("otpEmail", EMAIL);

        String result = service.resetPassword(EMAIL, weakPassword, session);

        assertThat(result).isEqualTo(
                "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character");
        verifyNoInteractions(employeeRepository);
    }

    @Test
    @DisplayName("TC_SEC_17 | resetPassword | verified + valid password, but employee record is gone → throws \"User not found\"")
    void resetPassword_employeeMissingFromDb_throws() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("otpVerified", true);
        session.setAttribute("otpEmail", EMAIL);
        when(employeeRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.resetPassword(EMAIL, STRONG_PASSWORD, session));

        assertThat(ex.getMessage()).isEqualTo("User not found");
        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    @DisplayName("TC_SEC_18 | resetPassword | fully verified + valid strong password → password updated, encoded, session cleared")
    void resetPassword_validRequest_updatesPasswordAndInvalidatesSession() {
        Employee employee = buildEmployee(EMAIL);
        employee.setStatus("locked-pending-reset");
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("otpVerified", true);
        session.setAttribute("otpEmail", EMAIL);
        when(employeeRepository.findByEmail(EMAIL)).thenReturn(Optional.of(employee));
        when(passwordEncoder.encode(STRONG_PASSWORD)).thenReturn("bcrypt-encoded-value");

        String result = service.resetPassword(EMAIL, STRONG_PASSWORD, session);

        assertThat(result).isEqualTo("Password reset successful");
        assertThat(employee.getPassword()).isEqualTo("bcrypt-encoded-value");
        assertThat(employee.getStatus()).isEqualTo("active");
        verify(employeeRepository).save(employee);
        assertThrows(IllegalStateException.class, () -> session.getAttribute("otpVerified"));
    }

    @Test
    @DisplayName("TC_SEC_19 | resetPassword | replaying the same session for a 2nd reset after success → " +
            "throws IllegalStateException instead of a handled error (session was invalidated by the 1st call)")
    void resetPassword_sessionReplayedAfterSuccess_throwsIllegalState() {
        // FINDING: because resetPassword() invalidates the HttpSession on success, a client that
        // double-submits (e.g. a retried request after a slow/lost response) will hit a raw
        // IllegalStateException rather than a clean "please request a new OTP" message. At the
        // controller layer this currently surfaces as an unhandled 500 — see
        // ForgotPasswordControllerIntegrationTest for the HTTP-level consequence.
        Employee employee = buildEmployee(EMAIL);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("otpVerified", true);
        session.setAttribute("otpEmail", EMAIL);
        when(employeeRepository.findByEmail(EMAIL)).thenReturn(Optional.of(employee));
        when(passwordEncoder.encode(STRONG_PASSWORD)).thenReturn("bcrypt-encoded-value");

        service.resetPassword(EMAIL, STRONG_PASSWORD, session);

        assertThrows(IllegalStateException.class,
                () -> service.resetPassword(EMAIL, STRONG_PASSWORD, session));
    }

    // ── helpers ────────────────────────────────────────────────────────────

    private static VerifyOtpRequest verifyOtpRequest(String email, String otp) {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail(email);
        request.setOtp(otp);
        return request;
    }

    private static MockHttpSession seedOtpSession(String email, String otp, LocalDateTime expiry) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("otp", otp);
        session.setAttribute("otpEmail", email);
        session.setAttribute("otpExpiry", expiry);
        return session;
    }

    private static Employee buildEmployee(String email) {
        Employee employee = new Employee();
        employee.setId("EMP001");
        employee.setName("Test User");
        employee.setEmail(email);
        employee.setPassword("old-encoded-password");
        employee.setPosition("Engineer");
        employee.setStatus("active");
        employee.setEmpStatus("active");
        employee.setIsCorePersonnel(false);
        employee.setHasJapanBusinessTrip(false);
        employee.setNotiSetting(false);
        employee.setIsDeleted(false);
        return employee;
    }
}