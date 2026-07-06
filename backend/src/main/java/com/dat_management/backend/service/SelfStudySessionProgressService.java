package com.dat_management.backend.service;

import com.dat_management.backend.dto.SelfStudySessionProgressRequest;
import com.dat_management.backend.dto.SelfStudySessionProgressResponse;
import com.dat_management.backend.dto.EnrollmentSessionWithCarryOverDto;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.repository.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SelfStudySessionProgressService {

    private final SelfStudySessionProgressRepository progressRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final SelfStudySessionRepository selfStudySessionRepository;

    public List<EnrollmentSessionWithCarryOverDto> getEnrollmentSessionsWithLeftover(Integer enrollmentId) {
        // Get the enrollment
        CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        
        // Get the course
        Integer courseId = enrollment.getCourse().getId();
        
        // Get all sessions for this course ordered by session number
        List<SelfStudySession> sessions = selfStudySessionRepository
                .findByCourseIdOrderBySessionNoAsc(courseId);
        
        // Get existing progress for this enrollment
        List<SelfStudySessionProgress> existingProgress = progressRepository
                .findByEnrollmentId(enrollmentId);
        
        Map<Integer, SelfStudySessionProgress> progressMap = existingProgress.stream()
                .collect(Collectors.toMap(
                        p -> p.getSelfStudySession().getId(),
                        p -> p
                ));
        
        List<EnrollmentSessionWithCarryOverDto> result = new ArrayList<>();
        
        // Track leftovers from previous sessions
        Integer leftoverKanji = 0;
        Integer leftoverVocab = 0;
        Integer leftoverGrammar = 0;
        Integer leftoverReading = 0;
        Integer leftoverListening = 0;
        
        for (SelfStudySession session : sessions) {
            SelfStudySessionProgress progress = progressMap.get(session.getId());
            
            // Get current progress values
            Integer currentKanji = progress != null && progress.getKanjiCount() != null ? progress.getKanjiCount() : 0;
            Integer currentVocab = progress != null && progress.getVocabularyCount() != null ? progress.getVocabularyCount() : 0;
            Integer currentGrammar = progress != null && progress.getGrammarCount() != null ? progress.getGrammarCount() : 0;
            Integer currentReading = progress != null && progress.getReadingMinutes() != null ? progress.getReadingMinutes() : 0;
            Integer currentListening = progress != null && progress.getListeningMinutes() != null ? progress.getListeningMinutes() : 0;
            
            String completionStatus = progress != null && progress.getCompletionStatus() != null 
                    ? progress.getCompletionStatus() : "NOT_STARTED";
            
            // Check if deadline passed - convert LocalDateTime to LocalDate for comparison
            boolean isDeadlinePassed = true;
            if (session.getSessionDeadline() != null) {
                LocalDate deadlineDate = session.getSessionDeadline().toLocalDate();
                isDeadlinePassed = deadlineDate.isBefore(LocalDate.of(2026, 7, 10));
            }
            
            // Original targets
            Integer originalKanjiTarget = session.getKanjiTarget() != null ? session.getKanjiTarget() : 0;
            Integer originalVocabTarget = session.getVocabularyTarget() != null ? session.getVocabularyTarget() : 0;
            Integer originalGrammarTarget = session.getGrammarTarget() != null ? session.getGrammarTarget() : 0;
            Integer originalReadingTarget = session.getReadingTargetMinutes() != null ? session.getReadingTargetMinutes() : 0;
            Integer originalListeningTarget = session.getListeningTargetMinutes() != null ? session.getListeningTargetMinutes() : 0;
            
            // Targets (original + leftover from previous sessions)
            Integer kanjiTarget = originalKanjiTarget + leftoverKanji;
            Integer vocabTarget = originalVocabTarget + leftoverVocab;
            Integer grammarTarget = originalGrammarTarget + leftoverGrammar;
            Integer readingTarget = originalReadingTarget + leftoverReading;
            Integer listeningTarget = originalListeningTarget + leftoverListening;
            
            // Calculate total completed
            Integer totalKanjiCompleted = currentKanji;
            Integer totalVocabCompleted = currentVocab;
            Integer totalGrammarCompleted = currentGrammar;
            Integer totalReadingCompleted = currentReading;
            Integer totalListeningCompleted = currentListening;
            
            // Calculate percentages based on effective targets
            Double kanjiPercent = calc(totalKanjiCompleted, kanjiTarget);
            Double vocabPercent = calc(totalVocabCompleted, vocabTarget);
            Double grammarPercent = calc(totalGrammarCompleted, grammarTarget);
            Double readingPercent = calc(totalReadingCompleted, readingTarget);
            Double listeningPercent = calc(totalListeningCompleted, listeningTarget);
            
            // Convert LocalDateTime to LocalDate for sessionDeadline
            LocalDate sessionDeadlineDate = session.getSessionDeadline() != null 
                    ? session.getSessionDeadline().toLocalDate() 
                    : null;
            
            // Build DTO
            EnrollmentSessionWithCarryOverDto dto = EnrollmentSessionWithCarryOverDto.builder()
                    .enrollmentId(enrollment.getId())
                    .employeeId(enrollment.getEmployee().getId())
                    .employeeName(enrollment.getEmployee().getName())
                    .sessionId(session.getId())
                    .sessionNo(session.getSessionNo())
                    .sessionDeadline(sessionDeadlineDate)
                    .sessionStatus(session.getSessionStatus())
                    .originalKanjiTarget(originalKanjiTarget)
                    .originalVocabularyTarget(originalVocabTarget)
                    .originalGrammarTarget(originalGrammarTarget)
                    .originalReadingTargetMinutes(originalReadingTarget)
                    .originalListeningTargetMinutes(originalListeningTarget)
                    .leftoverKanji(leftoverKanji)
                    .leftoverVocabulary(leftoverVocab)
                    .leftoverGrammar(leftoverGrammar)
                    .leftoverReadingMinutes(leftoverReading)
                    .leftoverListeningMinutes(leftoverListening)
                    .KanjiTarget(kanjiTarget)
                    .VocabularyTarget(vocabTarget)
                    .GrammarTarget(grammarTarget)
                    .ReadingTargetMinutes(readingTarget)
                    .ListeningTargetMinutes(listeningTarget)
                    .kanjiCount(currentKanji)
                    .vocabularyCount(currentVocab)
                    .grammarCount(currentGrammar)
                    .readingMinutes(currentReading)
                    .listeningMinutes(currentListening)
                    .kanjiProgressPercent(kanjiPercent)
                    .vocabularyProgressPercent(vocabPercent)
                    .grammarProgressPercent(grammarPercent)
                    .readingProgressPercent(readingPercent)
                    .listeningProgressPercent(listeningPercent)
                    .completionStatus(completionStatus)
                    .isDeadlinePassed(isDeadlinePassed)
                    .filePath(session.getFilepath())
                    .createdAt(session.getCreatedAt())
                    .updatedAt(session.getUpdatedAt())
                    .build();
            
            result.add(dto);
            
            // Calculate leftovers for next session ONLY if deadline passed
            if (isDeadlinePassed) {
                // Calculate what's left to complete
                leftoverKanji = Math.max(0, kanjiTarget - totalKanjiCompleted);
                leftoverVocab = Math.max(0, vocabTarget - totalVocabCompleted);
                leftoverGrammar = Math.max(0, grammarTarget - totalGrammarCompleted);
                leftoverReading = Math.max(0, readingTarget - totalReadingCompleted);
                leftoverListening = Math.max(0, listeningTarget - totalListeningCompleted);
            } else {
                // If deadline not passed, no leftovers carry forward
                leftoverKanji = 0;
                leftoverVocab = 0;
                leftoverGrammar = 0;
                leftoverReading = 0;
                leftoverListening = 0;
            }
        }
        
        return result;
    }

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
                .sessionDeadline(session.getSessionDeadline())

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