package com.dat_management.backend.dto;

import lombok.Data;
@Data
public class VerifyOtpRequest {
    private String email;
    private String otp;
  
}