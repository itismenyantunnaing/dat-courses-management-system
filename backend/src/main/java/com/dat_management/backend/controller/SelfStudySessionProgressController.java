package com.dat_management.backend.controller;

import com.dat_management.backend.dto.SelfStudySessionProgressRequest;
import com.dat_management.backend.dto.SelfStudySessionProgressResponse;
import com.dat_management.backend.service.SelfStudySessionProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class SelfStudySessionProgressController {

    private final SelfStudySessionProgressService progressService;

    @GetMapping("/{id}/progress")
    public SelfStudySessionProgressResponse getProgressByCourse(@PathVariable Integer id) {
        return progressService.getProgressByCourseId(id);
    }

    @PutMapping("/{id}/progress/{progressId}")
    public SelfStudySessionProgressResponse updateProgress(
            @PathVariable Integer id,
            @PathVariable Integer progressId,
            @RequestBody SelfStudySessionProgressRequest request) {
        return progressService.updateProgress(id, progressId, request);
    }

    @PostMapping("/{id}/progress")
    public SelfStudySessionProgressResponse createProgress(
            @PathVariable Integer id,
            @RequestBody SelfStudySessionProgressRequest request) {
        return progressService.createProgress(id, request);
    }

    @GetMapping("/progress/enrollment/{enrollmentId}")
    public SelfStudySessionProgressResponse getProgressByEnrollment(@PathVariable Integer enrollmentId) {
        return progressService.getProgressByEnrollmentId(enrollmentId);
    }
}