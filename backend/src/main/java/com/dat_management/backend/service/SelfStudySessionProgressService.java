package com.dat_management.backend.service;

import com.dat_management.backend.dto.SelfStudySessionProgressRequest;
import com.dat_management.backend.dto.SelfStudySessionProgressResponse;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.repository.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SelfStudySessionProgressService {

    private final SelfStudySessionProgressRepository progressRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final SelfStudySessionRepository selfStudySessionRepository;

    // =========================
    // FETCH PROGRESS
    // =========================
    public SelfStudySessionProgressResponse getProgressByCourseId(Integer courseId) {

        List<SelfStudySessionProgressResponse> progressList =
                progressRepository.findByEnrollment_Course_Id(courseId)
                        .stream()
                        .map(this::mapToProgressItem)
                        .toList();

        return SelfStudySessionProgressResponse.builder()
                .progress(progressList)
                .build();
    }

    // =========================
    // CREATE PROGRESS
    // =========================
    public SelfStudySessionProgressResponse createProgress(
            Integer courseId,
            SelfStudySessionProgressRequest request) {

        CourseEnrollment enrollment = enrollmentRepository
                .findById(request.getEnrollmentId())
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        if (!enrollment.getCourse().getId().equals(courseId)) {
            throw new RuntimeException("Enrollment does not belong to course");
        }

        SelfStudySession session = selfStudySessionRepository
                .findById(request.getSelfStudySessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        boolean exists = progressRepository
                .existsByEnrollment_IdAndSelfStudySession_Id(
                        enrollment.getId(),
                        session.getId());

        if (exists) {
            throw new RuntimeException("Progress already exists for this enrollment and session");
        }

        SelfStudySessionProgress progress = new SelfStudySessionProgress();

        progress.setEnrollment(enrollment);
        progress.setSelfStudySession(session);

        progress.setKanjiCount(nvl(request.getKanjiCount()));
        progress.setVocabularyCount(nvl(request.getVocabularyCount()));
        progress.setGrammarCount(nvl(request.getGrammarCount()));
        progress.setReadingMinutes(nvl(request.getReadingMinutes()));
        progress.setListeningMinutes(nvl(request.getListeningMinutes()));

        progress.setCompletionStatus(
                request.getCompletionStatus() != null
                        ? request.getCompletionStatus()
                        : "NOT_STARTED"
        );

        progress.setRemark(request.getRemark());

        if ("IN_PROGRESS".equalsIgnoreCase(progress.getCompletionStatus())) {
            progress.setStartedAt(LocalDateTime.now());
        }

        if ("COMPLETED".equalsIgnoreCase(progress.getCompletionStatus())) {
            progress.setStartedAt(LocalDateTime.now());
            progress.setCompletedAt(LocalDateTime.now());
        }

        progress.setUpdatedAt(LocalDateTime.now());

        SelfStudySessionProgress saved = progressRepository.save(progress);

        return SelfStudySessionProgressResponse.builder()
                .success(true)
                .progress(mapToProgressItem(saved))
                .build();
    }

    // =========================
    // UPDATE PROGRESS
    // =========================
    public SelfStudySessionProgressResponse updateProgress(
            Integer courseId,
            Integer progressId,
            SelfStudySessionProgressRequest request) {

        SelfStudySessionProgress progress = progressRepository
                .findByIdAndEnrollment_Course_Id(progressId, courseId)
                .orElseThrow(() -> new RuntimeException("Progress not found"));

        if (request.getKanjiCount() != null)
            progress.setKanjiCount(request.getKanjiCount());

        if (request.getVocabularyCount() != null)
            progress.setVocabularyCount(request.getVocabularyCount());

        if (request.getGrammarCount() != null)
            progress.setGrammarCount(request.getGrammarCount());

        if (request.getReadingMinutes() != null)
            progress.setReadingMinutes(request.getReadingMinutes());

        if (request.getListeningMinutes() != null)
            progress.setListeningMinutes(request.getListeningMinutes());

        if (request.getCompletionStatus() != null) {
            progress.setCompletionStatus(request.getCompletionStatus());

            if ("IN_PROGRESS".equalsIgnoreCase(request.getCompletionStatus())
                    && progress.getStartedAt() == null) {
                progress.setStartedAt(LocalDateTime.now());
            }

            if ("COMPLETED".equalsIgnoreCase(request.getCompletionStatus())) {
                if (progress.getStartedAt() == null) {
                    progress.setStartedAt(LocalDateTime.now());
                }
                progress.setCompletedAt(LocalDateTime.now());
            }
        }

        progress.setUpdatedAt(LocalDateTime.now());

        SelfStudySessionProgress saved = progressRepository.save(progress);

        return SelfStudySessionProgressResponse.builder()
                .success(true)
                .progress(mapToProgressItem(saved))
                .build();
    }
     
    public SelfStudySessionProgressResponse getProgressByEnrollmentId(Integer enrollmentId) {
    // Verify enrollment exists
    enrollmentRepository.findById(enrollmentId)
            .orElseThrow(() -> new RuntimeException("Enrollment not found"));

    List<SelfStudySessionProgressResponse> progressList =
            progressRepository.findByEnrollment_Id(enrollmentId)
                    .stream()
                    .map(this::mapToProgressItem)
                    .toList();

    return SelfStudySessionProgressResponse.builder()
            .progress(progressList)
            .build();
}

    // =========================
    // MAPPING WITH PERCENTAGE
    // =========================
    private SelfStudySessionProgressResponse mapToProgressItem(SelfStudySessionProgress progress) {

        SelfStudySession session = progress.getSelfStudySession();

        Integer kanjiTarget = session.getKanjiTarget();
        Integer vocabularyTarget = session.getVocabularyTarget();
        Integer grammarTarget = session.getGrammarTarget();
        Integer readingTarget = session.getReadingTargetMinutes();
        Integer listeningTarget = session.getListeningTargetMinutes();

        return SelfStudySessionProgressResponse.builder()
                .id(progress.getId())
                .enrollmentId(progress.getEnrollment().getId())
                .employeeId(progress.getEnrollment().getEmployee().getId())
                .employeeName(progress.getEnrollment().getEmployee().getName())
                .selfStudySessionId(session.getId())
                .sessionNo(session.getSessionNo())
                .sessionDeadline(progress.getSessionDeadline())

                .kanjiCount(progress.getKanjiCount())
                .vocabularyCount(progress.getVocabularyCount())
                .grammarCount(progress.getGrammarCount())
                .readingMinutes(progress.getReadingMinutes())
                .listeningMinutes(progress.getListeningMinutes())

                // =========================
                // PERCENTAGES
                // =========================
                .kanjiProgressPercent(calc(progress.getKanjiCount(), kanjiTarget))
                .vocabularyProgressPercent(calc(progress.getVocabularyCount(), vocabularyTarget))
                .grammarProgressPercent(calc(progress.getGrammarCount(), grammarTarget))
                .readingProgressPercent(calc(progress.getReadingMinutes(), readingTarget))
                .listeningProgressPercent(calc(progress.getListeningMinutes(), listeningTarget))

                .completionStatus(progress.getCompletionStatus())
                .remark(progress.getRemark())
                .startedAt(progress.getStartedAt())
                .completedAt(progress.getCompletedAt())
                .updatedAt(progress.getUpdatedAt())
                .build();
    }

    // =========================
    // SAFE DIVISION HELPER
    // =========================
    private double calc(Integer current, Integer target) {
        if (target == null || target == 0) return 0.0;
        if (current == null) return 0.0;
        return (current * 100.0) / target;
    }

    private Integer nvl(Integer value) {
        return value != null ? value : 0;
    }
}