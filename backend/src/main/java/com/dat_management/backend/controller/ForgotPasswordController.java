package com.dat_management.backend.controller;

import com.dat_management.backend.dto.EmailDto;
import com.dat_management.backend.dto.ResetPasswordRequest;
import com.dat_management.backend.dto.VerifyOtpRequest;

import com.dat_management.backend.service.ForgotPasswordService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class ForgotPasswordController {

    private final ForgotPasswordService service;

    private final ForgotPasswordService forgotPasswordService;

    // STEP 1: Send OTP
    @PostMapping("/forgot-password")
    public ResponseEntity<?> sendOtp(
            @RequestBody EmailDto request,
            HttpSession session
    ) {
        String response = service.sendOtp(request.getEmail(), session);
        return ResponseEntity.ok(response);
    }

    // STEP 2: Verify OTP + Reset Password
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(
            @RequestBody VerifyOtpRequest request,
            HttpSession session
    ) {
        String response = service.verifyOtpOnly(request, session);
        return ResponseEntity.ok(response);
    }
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestBody ResetPasswordRequest request,
            HttpSession session) {

        String response = forgotPasswordService.resetPassword(
                request.getEmail(),
                request.getNewPassword(),
                session);

        return ResponseEntity.ok(response);
    }
}