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
    name = "self_study_sessions",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"course_id", "session_no"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SelfStudySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false)
    private Short sessionNo;

    @Column(name = "duration_per_session")
    private Integer durationPerSession; // in days
    
    private String filepath;
    private Integer kanjiTarget;
    private Integer vocabularyTarget;
    private Integer grammarTarget;

    private Integer readingTargetMinutes;
    private Integer listeningTargetMinutes;

    private String sessionStatus;
    // PLANNED, ACTIVE, CLOSED

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


