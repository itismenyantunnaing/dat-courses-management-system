package com.dat_management.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GroupDto {

    private Integer id;

    @JsonProperty("group_name")
    private String groupName;

    private Integer capacity;

    @JsonProperty("group_status")
    private String groupStatus;

    // Only included in GET /api/courses/:id — null means omitted
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    private List<SessionDto> sessions;

    // Only included in GET /api/courses/:id — null means omitted
    private List<EnrollmentSummaryDto> enrollments;

    @JsonProperty("registered_count")
    private Long registeredCount;
}