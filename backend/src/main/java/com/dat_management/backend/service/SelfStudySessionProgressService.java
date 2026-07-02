package com.dat_management.backend.service;

import com.dat_management.backend.dto.SelfStudySessionProgressRequest;
import com.dat_management.backend.dto.SelfStudySessionProgressResponse;
import com.dat_management.backend.entity.SelfStudySessionProgress;
import com.dat_management.backend.repository.SelfStudySessionProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SelfStudySessionProgressService {

    private final SelfStudySessionProgressRepository progressRepository;

    public SelfStudySessionProgressResponse getProgressByCourseId(Integer courseId) {
        List<SelfStudySessionProgressResponse> progressList = progressRepository
                .findByEnrollment_Course_Id(courseId)
                .stream()
                .map(this::mapToProgressItem)
                .toList();

        return SelfStudySessionProgressResponse.builder()
                .progress(progressList)
                .build();
    }

    public SelfStudySessionProgressResponse updateProgress(
            Integer courseId,
            Integer progressId,
            SelfStudySessionProgressRequest request
    ) {
        SelfStudySessionProgress progress = progressRepository
                .findByIdAndEnrollment_Course_Id(progressId, courseId)
                .orElseThrow(() -> new RuntimeException("Progress not found with id: " + progressId));

        if (request.getKanjiCount() != null) {
            progress.setKanjiCount(request.getKanjiCount());
        }

        if (request.getVocabularyCount() != null) {
            progress.setVocabularyCount(request.getVocabularyCount());
        }

        if (request.getGrammarCount() != null) {
            progress.setGrammarCount(request.getGrammarCount());
        }

        if (request.getReadingMinutes() != null) {
            progress.setReadingMinutes(request.getReadingMinutes());
        }

        if (request.getListeningMinutes() != null) {
            progress.setListeningMinutes(request.getListeningMinutes());
        }

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
                .progress(mapToProgressItemForUpdate(saved))
                .build();
    }

    private SelfStudySessionProgressResponse mapToProgressItem(SelfStudySessionProgress progress) {
        return SelfStudySessionProgressResponse.builder()
                .id(progress.getId())
                .enrollmentId(progress.getEnrollment().getId())
                .employeeId(progress.getEnrollment().getEmployee().getId())
                .employeeName(progress.getEnrollment().getEmployee().getName())
                .selfStudySessionId(progress.getSelfStudySession().getId())
                .sessionNo(progress.getSelfStudySession().getSessionNo())
                .sessionDeadline(progress.getSelfStudySession().getSessionDeadline())
                .kanjiCount(progress.getKanjiCount())
                .vocabularyCount(progress.getVocabularyCount())
                .grammarCount(progress.getGrammarCount())
                .readingMinutes(progress.getReadingMinutes())
                .listeningMinutes(progress.getListeningMinutes())
                .completionStatus(progress.getCompletionStatus())
                .startedAt(progress.getStartedAt())
                .completedAt(progress.getCompletedAt())
                .updatedAt(progress.getUpdatedAt())
                .build();
    }

    private SelfStudySessionProgressResponse mapToProgressItemForUpdate(SelfStudySessionProgress progress) {
        return SelfStudySessionProgressResponse.builder()
                .id(progress.getId())
                .enrollmentId(progress.getEnrollment().getId())
                .selfStudySessionId(progress.getSelfStudySession().getId())
                .completionStatus(progress.getCompletionStatus())
                .updatedAt(progress.getUpdatedAt())
                .build();
    }
}