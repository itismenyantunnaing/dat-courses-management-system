package com.dat_management.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseEnrollmentDto {
    private Integer id;

    @JsonProperty("employee_id")
    private String employeeId;

    @JsonProperty("employee_name")
    private String employeeName;

    private String email;

    private String position;

    @JsonProperty("team_id")
    private Integer teamId;

    @JsonProperty("team_name")
    private String teamName;

    @JsonProperty("department_id")
    private Integer departmentId;

    @JsonProperty("department_name")
    private String departmentName;

    @JsonProperty("course_group_id")
    private Integer courseGroupId;

    @JsonProperty("course_group_name")
    private String courseGroupName;

    @JsonProperty("enrollment_status")
    private String enrollmentStatus;

    @JsonProperty("enrolled_at")
    private LocalDateTime enrolledAt;
}