package com.dat_management.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class SelfStudySessionDto {

    private Integer id;

    @JsonProperty("session_no")
    private Short sessionNo;

    @JsonProperty("session_deadline")
    private LocalDate sessionDeadline;

    @JsonProperty("file_path")
    private String filePath;

    @JsonProperty("filepath")
    public void setFilepath(String filepath) {
        this.filePath = filepath;
    }

    @JsonProperty("kanji_target")
    private Integer kanjiTarget;

    @JsonProperty("vocabulary_target")
    private Integer vocabularyTarget;

    @JsonProperty("grammar_target")
    private Integer grammarTarget;

    @JsonProperty("reading_target_minutes")
    private Integer readingTargetMinutes;

    @JsonProperty("listening_target_minutes")
    private Integer listeningTargetMinutes;

    @JsonProperty("study_time_target_minutes")
    private Integer studyTimeTargetMinutes;

    @JsonProperty("session_status")
    private String sessionStatus;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
}