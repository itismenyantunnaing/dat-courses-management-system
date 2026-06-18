package com.dat_management.backend.dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {

    private String email;
    private String newPassword;
    private String confirmPassword;
}