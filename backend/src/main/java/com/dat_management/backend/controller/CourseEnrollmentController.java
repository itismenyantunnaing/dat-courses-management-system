package com.dat_management.backend.controller;

import com.dat_management.backend.dto.*;
import com.dat_management.backend.service.CourseEnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class CourseEnrollmentController {

    private final CourseEnrollmentService service;

    @GetMapping("/{id}/enrollments")
    public ResponseEntity<List<EnrollmentResponseDTO>> getEnrollments(
            @PathVariable Integer id) {

        return ResponseEntity.ok(service.getEnrollments(id));
    }

    @PostMapping("/{id}/enroll")
    public ResponseEntity<EnrollmentResponseDTO> enroll(
            @PathVariable Integer id,
            @RequestBody EnrollmentRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.enroll(id, dto));
    }

    @PutMapping("/{id}/enrollments/{enrollmentId}")
    public ResponseEntity<EnrollmentResponseDTO> updateEnrollment(
            @PathVariable Integer id,
            @PathVariable Integer enrollmentId,
            @RequestBody EnrollmentUpdateDTO dto) {

        return ResponseEntity.ok(
                service.updateEnrollment(id, enrollmentId, dto));
    }

    @DeleteMapping("/{id}/enrollments/{enrollmentId}")
    public ResponseEntity<Map<String, Object>> cancelEnrollment(
            @PathVariable Integer id,
            @PathVariable Integer enrollmentId) {

        service.cancelEnrollment(id, enrollmentId);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "Enrollment cancelled successfully"
                ));
    }
}