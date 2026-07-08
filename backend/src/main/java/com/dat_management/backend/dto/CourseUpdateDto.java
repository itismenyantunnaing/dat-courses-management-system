package com.dat_management.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseUpdateDto {

    @JsonProperty("course_name")
    private String courseName;

    @JsonProperty("trainer_name")
    private String trainerName;

    @JsonProperty("self_study_type")
    private String selfStudyType;

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

    private String status;

    // When provided → replaces ALL existing groups + their sessions
    private List<GroupRequestDto> groups;

    // When provided → replaces ALL existing self-study sessions
    @JsonProperty("self_study_sessions")
    private List<SelfStudySessionDto> selfStudySessions;
}