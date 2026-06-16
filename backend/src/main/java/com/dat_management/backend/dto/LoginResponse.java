package com.dat_management.backend.dto;

public class LoginResponse {

    private String token;
    private String userId;
    private String role;
    private String status;

    public LoginResponse(String token,
                         String userId,
                         String role,
                         String status) {

        this.token = token;
        this.userId = userId;
        this.role = role;
        this.status = status;
    }

    public String getToken() {
        return token;
    }

    public String getUserId() {
        return userId;
    }

    public String getRole() {
        return role;
    }

    public String getStatus() {
        return status;
    }
}