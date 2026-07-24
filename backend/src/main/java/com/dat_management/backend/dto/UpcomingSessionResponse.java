package com.dat_management.backend.dto;

//import com.dat_management.backend.entity.CourseCategory.CourseType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingSessionResponse {

    private Integer courseId;
    private Integer groupId;
    private Integer sessionId;
    private Integer attendanceId;
    private Integer progressId;

    private String courseName;
    private String courseType;

    private Short sessionNo;

    // Trainer
    private LocalDate sessionDate;
    private LocalTime startTime;
    private LocalTime endTime;

    // Self Study
    private LocalDateTime sessionDeadline;
    private Integer durationPerSession;

    private String status;
    private String attendanceStatus;
    private String completionStatus;

    private Integer grammarCount;
    private Integer vocabularyCount;
    private Integer kanjiCount;
    private Integer readingMinutes;
    private Integer listeningMinutes;

    private Integer grammarTarget;
    private Integer vocabularyTarget;
    private Integer kanjiTarget;
    private Integer readingTargetMinutes;
    private Integer listeningTargetMinutes;
}