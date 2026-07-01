package com.dat_management.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseRequestDto {

    @NotBlank(message = "course_name is required")
    @JsonProperty("course_name")
    private String courseName;

    @JsonProperty("trainer_name")
    private String trainerName;

    // null for trainer course. "JLPT" or "NAT" for self-study
    @JsonProperty("self_study_type")
    private String selfStudyType;

    @NotNull(message = "course_category_id is required")
    @JsonProperty("course_category_id")
    private Integer courseCategoryId;

    @JsonProperty("target_level")
    private String targetLevel;

    @JsonProperty("total_sessions")
    private Short totalSessions;

    @JsonProperty("start_date")
    private LocalDate startDate;

    @JsonProperty("end_date")
    private LocalDate endDate;

    @JsonProperty("registration_deadline")
    private LocalDate registrationDeadline;

    // "DRAFT" | "OPEN" | "CLOSED" | "COMPLETED"
    private String status;

    // Trainer course: groups with nested sessions
    private List<GroupRequestDto> groups;

    // Self-study course: flat list of self-study sessions
    @JsonProperty("self_study_sessions")
    private List<SelfStudySessionDto> selfStudySessions;
}