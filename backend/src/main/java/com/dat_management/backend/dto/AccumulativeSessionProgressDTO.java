package com.dat_management.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccumulativeSessionProgressDTO {
    private Short sessionNo;
    private LocalDateTime sessionDeadline;
    private String memberName;
    private String certifiedLevel;
    private String examTarget;
    private Integer currentGrammar;
    private Integer targetGrammar;
    private Integer currentVocabulary;
    private Integer targetVocabulary;
    private Integer currentKanji;
    private Integer targetKanji;
    private Integer currentReadingMin;
    private Integer targetReadingMin;
    private Integer currentListeningMin;
    private Integer targetListeningMin;
    private Double actualPercentage;
    private Double targetPercentage;
    private String status;
}