package com.dat_management.backend.service;

import java.time.LocalDateTime;
import java.util.Random;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.dat_management.backend.dto.VerifyOtpRequest;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.EmployeeRepository;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ForgotPasswordService {

    private final EmployeeRepository employeeRepository;

    private final PasswordEncoder passwordEncoder;

    private final  EmailService emailService;

   
    // STEP 1: SEND OTP
    public String sendOtp(String email, HttpSession session) {

        Employee employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // generate OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // store in session
        session.setAttribute("otp", otp);
        session.setAttribute("otpEmail", email);
        session.setAttribute("otpExpiry", LocalDateTime.now().plusMinutes(1));

        // send email
        emailService.sendOtp(email, otp);

        return "OTP sent to email";
    }

 // STEP 2: VERIFY OTP ONLY
    public String verifyOtpOnly(VerifyOtpRequest request,
                                HttpSession session) {

        String sessionOtp =
                (String) session.getAttribute("otp");

        String sessionEmail =
                (String) session.getAttribute("otpEmail");

        LocalDateTime expiry =
                (LocalDateTime) session.getAttribute("otpExpiry");

        // SESSION CHECK
        if (sessionOtp == null
                || sessionEmail == null
                || expiry == null) {

            return "OTP not generated";
        }

        // OTP EXPIRED
        if (expiry.isBefore(LocalDateTime.now())) {

            session.invalidate();

            return "OTP expired";
        }

        // EMAIL CHECK
        if (!sessionEmail.equals(request.getEmail())) {

            return "Email mismatch";
        }

        // OTP CHECK
        if (!sessionOtp.equals(request.getOtp())) {

            return "Invalid OTP";
        }
     // OTP verified
        session.setAttribute("otpVerified", true);

        return "OTP verified successfully";
    }
    
    public String resetPassword(String email,
            String newPassword,
            HttpSession session) {

Boolean verified =
(Boolean) session.getAttribute("otpVerified");

String sessionEmail =
(String) session.getAttribute("otpEmail");

// 1. OTP verification check
if (verified == null || !verified) {
return "Please verify OTP first";
}

// 2. Email match check
if (!email.equals(sessionEmail)) {
return "Invalid email";
}

// 3. PASSWORD POLICY VALIDATION
String pattern =
"^(?=.*[a-z])" +        // lowercase
"(?=.*[A-Z])" +         // uppercase
"(?=.*\\d)" +           // number
"(?=.*[@$!%*?&])" +     // special char
".{8,}$";               // min length 8

if (!newPassword.matches(pattern)) {
return "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character";
}

// 4. Find user
Employee employee = employeeRepository.findByEmail(email)
.orElseThrow(() ->
    new RuntimeException("User not found"));

// 5. Update password
employee.setPassword(passwordEncoder.encode(newPassword));

employee.setStatus("active");

employeeRepository.save(employee);

// 6. Clear session
session.invalidate();

return "Password reset successful";
}
}