package com.dat_management.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "system_configuration")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_upload_size_mb", nullable = false)
    private Integer fileUploadSizeMb = 5;

    @Column(name = "session_timeout_minutes", nullable = false)
    private Integer sessionTimeoutMinutes = 30;

    @Column(name = "jwt_expiry_hours", nullable = false)
    private Integer jwtExpiryHours = 24;

    @Column(name = "max_login_attempts", nullable = false)
    private Integer maxLoginAttempts = 5;

    @Enumerated(EnumType.STRING)
    @Column(name = "active_smtp_provider", nullable = false)
    private SmtpProvider activeSmtpProvider = SmtpProvider.OUTLOOK;

    // Gmail Configuration
    @Column(name = "gmail_host")
    private String gmailHost = "smtp.gmail.com";

    @Column(name = "gmail_port")
    private Integer gmailPort = 587;

    @Column(name = "gmail_username")
    private String gmailUsername;

    @Column(name = "gmail_password")
    private String gmailPassword;

    // Outlook Configuration
    @Column(name = "outlook_host")
    private String outlookHost = "smtp.office365.com";

    @Column(name = "outlook_port")
    private Integer outlookPort = 587;

    @Column(name = "outlook_username")
    private String outlookUsername;

    @Column(name = "outlook_password")
    private String outlookPassword;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum SmtpProvider {
    GMAIL,
    OUTLOOK
}
}