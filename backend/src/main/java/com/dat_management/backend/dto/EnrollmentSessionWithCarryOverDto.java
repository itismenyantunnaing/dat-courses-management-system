package com.dat_management.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentSessionWithCarryOverDto {
    
    // Enrollment info
    @JsonProperty("enrollment_id")
    private Integer enrollmentId;
    
    @JsonProperty("employee_id")
    private String employeeId;
    
    @JsonProperty("employee_name")
    private String employeeName;
    
    // Session info
    @JsonProperty("session_id")
    private Integer sessionId;
    
    @JsonProperty("session_no")
    private Short sessionNo;
    
    @JsonProperty("session_deadline")
    private LocalDate sessionDeadline;
    
    @JsonProperty("session_status")
    private String sessionStatus;
    
    // Original targets from the session
    @JsonProperty("original_kanji_target")
    private Integer originalKanjiTarget;
    
    @JsonProperty("original_vocabulary_target")
    private Integer originalVocabularyTarget;
    
    @JsonProperty("original_grammar_target")
    private Integer originalGrammarTarget;
    
    @JsonProperty("original_reading_target_minutes")
    private Integer originalReadingTargetMinutes;
    
    @JsonProperty("original_listening_target_minutes")
    private Integer originalListeningTargetMinutes;
    
    // Leftover from previous sessions
    @JsonProperty("leftover_kanji")
    private Integer leftoverKanji;
    
    @JsonProperty("leftover_vocabulary")
    private Integer leftoverVocabulary;
    
    @JsonProperty("leftover_grammar")
    private Integer leftoverGrammar;
    
    @JsonProperty("leftover_reading_minutes")
    private Integer leftoverReadingMinutes;
    
    @JsonProperty("leftover_listening_minutes")
    private Integer leftoverListeningMinutes;
    
    // Effective targets (original + leftover)
    @JsonProperty("kanji_target")
    private Integer KanjiTarget;
    
    @JsonProperty("vocabulary_target")
    private Integer VocabularyTarget;
    
    @JsonProperty("grammar_target")
    private Integer GrammarTarget;
    
    @JsonProperty("reading_target_minutes")
    private Integer ReadingTargetMinutes;
    
    @JsonProperty("listening_target_minutes")
    private Integer ListeningTargetMinutes;
    
    // Current progress
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
    
    // Progress percentages
    @JsonProperty("kanji_progress_percent")
    private Double kanjiProgressPercent;
    
    @JsonProperty("vocabulary_progress_percent")
    private Double vocabularyProgressPercent;
    
    @JsonProperty("grammar_progress_percent")
    private Double grammarProgressPercent;
    
    @JsonProperty("reading_progress_percent")
    private Double readingProgressPercent;
    
    @JsonProperty("listening_progress_percent")
    private Double listeningProgressPercent;
    
    @JsonProperty("completion_status")
    private String completionStatus;
    
    @JsonProperty("is_deadline_passed")
    private Boolean isDeadlinePassed;
    
    @JsonProperty("file_path")
    private String filePath;
    
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
    
    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
}