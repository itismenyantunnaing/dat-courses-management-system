package com.dat_management.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SelfStudySessionProgressResponse {

    private Boolean success;

    private Object progress;

    private Integer id;

    @JsonProperty("enrollment_id")
    private Integer enrollmentId;

    @JsonProperty("employee_id")
    private String employeeId;

    @JsonProperty("employee_name")
    private String employeeName;

    @JsonProperty("self_study_session_id")
    private Integer selfStudySessionId;

    @JsonProperty("session_no")
    private Short sessionNo;

    @JsonProperty("session_deadline")
    private LocalDateTime sessionDeadline;

    @JsonProperty("kanji_count")
    private Integer kanjiCount;

    @JsonProperty("vocabulary_count")
    private Integer vocabularyCount;

    @JsonProperty("grammar_count")
    private Integer grammarCount;

    @JsonProperty("reading_minutes")
    private Integer readingMinutes;

    @JsonProperty("listening_minutes")
    private Integer listeningMinutes;

    @JsonProperty("completion_status")
    private String completionStatus;

    @JsonProperty("started_at")
    private LocalDateTime startedAt;

    @JsonProperty("completed_at")
    private LocalDateTime completedAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
}