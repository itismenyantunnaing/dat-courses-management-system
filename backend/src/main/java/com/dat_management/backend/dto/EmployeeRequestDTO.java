package com.dat_management.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeRequestDTO {

    @NotBlank(message = "ID (Staff ID) is required")
    private String id;

    @NotBlank(message = "Name is required")
    private String name;

    private String email;
    private String doorlog;
    private String position;
    private String password;

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
    private String divisionName;

    @JsonProperty("dept_dat")
    private String departmentDatName;

    @JsonProperty("team")
    private String teamName;

    @JsonProperty("role")
    private String roleName;

    private LocalDate dob;

    @JsonProperty("profile_photo_path")
    private String profilePhotoPath;
}