package com.dat_management.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CourseDto {

    private Integer id;

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

    @JsonProperty("is_deleted")
    private Boolean isDeleted;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    private CategoryDto category;

    private List<GroupDto> groups;

    @JsonProperty("self_study_sessions")
    private List<SelfStudySessionDto> selfStudySessions;

    @JsonProperty("image_path")
    private String imagePath;
}