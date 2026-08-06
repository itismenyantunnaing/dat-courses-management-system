package com.dat_management.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.dat_management.backend.dto.TargetTermRequest;
import com.dat_management.backend.dto.TargetTermResponse;
import com.dat_management.backend.entity.Notification.NotificationType;
import com.dat_management.backend.entity.TargetTerm;
import com.dat_management.backend.repository.TargetTermRepository;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TargetTermService {

    private final TargetTermRepository targetTermRepository;
    private final NotificationService notificationService;
    private final HttpServletRequest httpServletRequest;

    public List<TargetTermResponse> getAll() {
        return targetTermRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<TargetTermResponse> getActiveTerms() {
        return targetTermRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TargetTermResponse getById(Integer id) {
        TargetTerm targetTerm = targetTermRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Target term not found with id: " + id));

        return toResponse(targetTerm);
    }

    public TargetTermResponse create(TargetTermRequest request) {
        TargetTerm targetTerm = new TargetTerm();
        setFields(targetTerm, request);

        if (targetTerm.getIsActive() == null) {
            targetTerm.setIsActive(true);
        }

        return toResponse(targetTermRepository.save(targetTerm));
    }

    public TargetTermResponse update(Integer id, TargetTermRequest request) {
        TargetTerm targetTerm = targetTermRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Target term not found with id: " + id));

        java.time.LocalDate oldExamDate = targetTerm.getExamDate();
        setFields(targetTerm, request);
        TargetTerm saved = targetTermRepository.save(targetTerm);

        if (oldExamDate != null && saved.getExamDate() != null && !oldExamDate.equals(saved.getExamDate())) {
            notificationService.sendToAllActive(
                    NotificationType.JLPT_EXAM,
                    "Exam date updated",
                    "The exam date has been changed from " + oldExamDate + " to " + saved.getExamDate() + ".",
                    saved.getId(),
                    httpServletRequest);
        }

        return toResponse(saved);
    }

    public void delete(Integer id) {
        TargetTerm targetTerm = targetTermRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Target term not found with id: " + id));

        targetTermRepository.delete(targetTerm);
    }

    public void deleteList(List<Integer> ids) {
        targetTermRepository.deleteAllById(ids);
    }

    private void setFields(TargetTerm targetTerm, TargetTermRequest request) {
        targetTerm.setTarget1Date(request.getTarget1Date());
        targetTerm.setTarget2Date(request.getTarget2Date());
        targetTerm.setExamDate(request.getExamDate());

        if (request.getIsActive() != null) {
            targetTerm.setIsActive(request.getIsActive());
        }
    }

    private TargetTermResponse toResponse(TargetTerm targetTerm) {
        return TargetTermResponse.builder()
                .id(targetTerm.getId())
                .target1Date(targetTerm.getTarget1Date())
                .target2Date(targetTerm.getTarget2Date())
                .examDate(targetTerm.getExamDate())
                .isActive(targetTerm.getIsActive())
                .build();
    }
}