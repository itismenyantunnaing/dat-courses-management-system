package com.dat_management.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeResponseDTO {

    private String id;
    private String name;
    private String email;
    private String doorlog;
    private String position;

    @JsonProperty("emp_status")
    private String empStatus;

    private String status;

    @JsonProperty("is_core_personnel")
    private Boolean isCorePersonnel;

    @JsonProperty("has_japan_business_trip")
    private Boolean hasJapanBusinessTrip;

    @JsonProperty("noti_setting")
    private Boolean notiSetting;

    @JsonProperty("div_name")
    private String divName;

    @JsonProperty("dept_dir")
    private String deptDir;

    @JsonProperty("dept_dat")
    private String deptDat;

    private String team;
    private String role;

    private LocalDate dob;
    private LocalDate joinedDate;
    private String serviceYear;

    @JsonProperty("profile_photo_path")
    private String profilePhotoPath;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
}