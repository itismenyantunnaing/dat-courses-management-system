package com.dat_management.backend.controller;

import com.dat_management.backend.dto.EnrollmentSessionWithCarryOverDto;
import com.dat_management.backend.dto.SelfStudySessionProgressRequest;
import com.dat_management.backend.dto.SelfStudySessionProgressResponse;
import com.dat_management.backend.service.SelfStudySessionProgressService;
import lombok.RequiredArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SelfStudySessionProgressController {

    private final SelfStudySessionProgressService progressService;

    @GetMapping("/{enrollmentId}/sessions-progress")
    public ResponseEntity<Map<String, Object>> getEnrollmentSessionsWithLeftover(
            @PathVariable Integer enrollmentId) {
        try {
            List<EnrollmentSessionWithCarryOverDto> sessions = 
                    progressService.getEnrollmentSessionsWithLeftover(enrollmentId);
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("data", sessions);
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

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
}