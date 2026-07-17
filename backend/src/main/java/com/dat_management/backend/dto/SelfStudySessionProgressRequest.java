package com.dat_management.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SelfStudySessionProgressRequest {

    @JsonProperty("enrollment_id")
    private Integer enrollmentId;

    @JsonProperty("self_study_session_id")
    private Integer selfStudySessionId;

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

    @JsonProperty("remark")
    private String remark;
}