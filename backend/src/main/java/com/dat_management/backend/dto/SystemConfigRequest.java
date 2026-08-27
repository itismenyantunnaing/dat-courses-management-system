package com.dat_management.backend.dto;

import com.dat_management.backend.entity.SystemConfig.SmtpProvider;

import lombok.Data;

@Data
public class SystemConfigRequest {

    private Double fileUploadSizeMb;
    private Integer sessionTimeoutMinutes;
    private Integer jwtExpiryHours;
    private Integer maxLoginAttempts;

    private SmtpProvider activeSmtpProvider;

    private String gmailHost;
    private Integer gmailPort;
    private String gmailUsername;
    private String gmailPassword;

    private String outlookHost;
    private Integer outlookPort;
    private String outlookUsername;
    private String outlookPassword;
}