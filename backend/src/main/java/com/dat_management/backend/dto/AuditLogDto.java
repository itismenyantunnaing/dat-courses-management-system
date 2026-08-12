package com.dat_management.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public final class AuditLogDto {

    private AuditLogDto() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuditLogRequestDTO {
        @NotBlank(message = "employeeId is required")
        private String employeeId;

        @NotBlank(message = "action is required")
        private String action;

        @NotBlank(message = "module is required")
        private String module;

        private String oldValue;
        private String newValue;
        private String description;
        private String ipAddress;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuditLogResponseDTO {
        private Integer id;
        private String employeeId;
        private String employeeName;
        private String employeeRole;
        private String employeeProfilePhotoPath;
        private String action;
        private String module;
        private String oldValue;
        private String newValue;
        private String description;
        private String ipAddress;
        private LocalDateTime createdAt;
    }
}