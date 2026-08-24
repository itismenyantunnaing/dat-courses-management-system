package com.dat_management.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EnrollmentResponseDTO {

    private Integer id;

    private String employeeId;
    private String employeeName;
    private String email;
    private String position;
    private String profilePhotoPath;

    private Integer teamId;
    private String teamName;

    private Integer departmentId;
    private String departmentName;

    private Integer divisionId;
    private String divisionName;

    private Integer courseGroupId;
    private String courseGroupName;

    private String enrollmentStatus;
    private LocalDateTime enrolledAt;

    private Integer mockTestAttempt;

    private String groupChangeStatus;     
    private Integer requestedCourseGroupId;
    private String requestedCourseGroupName;
}