package com.dat_management.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EnrollmentSummaryDto {

    private Integer id;

    @JsonProperty("employee_id")
    private String employeeId;

    @JsonProperty("employee_name")
    private String employeeName;

    private String email;
    private String position;

    @JsonProperty("enrollment_status")
    private String enrollmentStatus;

    @JsonProperty("enrolled_at")
    private LocalDateTime enrolledAt;
}