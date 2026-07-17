package com.dat_management.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "self_study_session_progress",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"enrollment_id", "self_study_session_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SelfStudySessionProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "enrollment_id", nullable = false)
    private CourseEnrollment enrollment;

    @ManyToOne
    @JoinColumn(name = "self_study_session_id", nullable = false)
    private SelfStudySession selfStudySession;

    private Integer kanjiCount = 0;
    private Integer vocabularyCount = 0;
    private Integer grammarCount = 0;

    private Integer readingMinutes = 0;
    private Integer listeningMinutes = 0;

    private LocalDateTime sessionDeadline;

    private String completionStatus;
    // NOT_STARTED, IN_PROGRESS, COMPLETED

    @Column(columnDefinition = "TEXT")
    private String remark;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime updatedAt;
}