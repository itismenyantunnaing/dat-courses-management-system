package com.dat_management.backend.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.dat_management.backend.dto.OtpData;

@Service
public class OtpService {

    private final Map<String, OtpData> otpStore = new HashMap<>();

    // generate OTP
    public String generateOtp(String email) {

        String otp = String.valueOf((int)(Math.random() * 900000) + 100000);

        otpStore.put(email,
                new OtpData(otp, LocalDateTime.now().plusMinutes(30)));

        System.out.println("OTP for " + email + " = " + otp);

        return otp;
    }

    // verify OTP
    public boolean verifyOtp(String email, String otp) {

        if (!otpStore.containsKey(email)) return false;

        OtpData data = otpStore.get(email);

        if (LocalDateTime.now().isAfter(data.getExpiryTime())) {
            otpStore.remove(email);
            return false;
        }

        return data.getOtp().equals(otp);
    }

    // clear after success
    public void clearOtp(String email) {
        otpStore.remove(email);
    }
}