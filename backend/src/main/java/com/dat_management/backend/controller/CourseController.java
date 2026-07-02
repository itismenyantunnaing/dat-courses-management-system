package com.dat_management.backend.controller;

import com.dat_management.backend.dto.*;
import com.dat_management.backend.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CourseController {

    private final CourseService courseService;

    // =========================================================
    // API 1 — GET /api/courses
    // =========================================================
    @GetMapping("/api/courses")
    public ResponseEntity<Map<String, Object>> getAllCourses() {
        Map<String, Object> res = new HashMap<>();
        res.put("courses", courseService.getAllCourses());
        return ResponseEntity.ok(res);
    }

    // =========================================================
    // API 2 — GET /api/courses/:id
    // =========================================================
    @GetMapping("/api/courses/{id}")
    public ResponseEntity<Map<String, Object>> getCourseById(@PathVariable Integer id) {
        try {
            Map<String, Object> res = new HashMap<>();
            res.put("course", courseService.getCourseById(id));
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    // =========================================================
    // API 3 — POST /api/courses (with optional image)
    // =========================================================
    @PostMapping(value = "/api/courses", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> createCourse(
            @RequestPart("data") @Valid CourseRequestDto req,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            CourseDto created = courseService.createCourse(req, image);
            Map<String, Object> slim = new HashMap<>();
            slim.put("id",          created.getId());
            slim.put("course_name", created.getCourseName());
            slim.put("status",      created.getStatus());
            slim.put("image_path",  created.getImagePath());
            slim.put("created_at",  created.getCreatedAt());
            slim.put("updated_at",  created.getUpdatedAt());
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("course",  slim);
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    // =========================================================
    // API 4 — PUT /api/courses/:id
    // =========================================================
    @PutMapping("/api/courses/{id}")
    public ResponseEntity<Map<String, Object>> updateCourse(
            @PathVariable Integer id,
            @RequestBody CourseUpdateDto req) {
        try {
            CourseDto updated = courseService.updateCourse(id, req);
            Map<String, Object> slim = new HashMap<>();
            slim.put("id",           updated.getId());
            slim.put("course_name",  updated.getCourseName());
            slim.put("trainer_name", updated.getTrainerName() != null ? updated.getTrainerName() : "");
            slim.put("status",       updated.getStatus());
            slim.put("updated_at",   updated.getUpdatedAt());
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("course",  slim);
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    // =========================================================
    // API 5 — DELETE /api/courses/:id
    // =========================================================
    @DeleteMapping("/api/courses/{id}")
    public ResponseEntity<Map<String, Object>> deleteCourse(@PathVariable Integer id) throws IOException {
        try {
            courseService.deleteCourse(id);
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Course deleted successfully");
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    // =========================================================
    // RESTORE — PUT /api/courses/:id/restore
    // =========================================================
    @PutMapping("/api/courses/{id}/restore")
    public ResponseEntity<Map<String, Object>> restoreCourse(@PathVariable Integer id) {
        try {
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("course", courseService.restoreCourse(id));
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    // =========================================================
    // UPLOAD IMAGE — POST /api/courses/:id/image
    // =========================================================
    @PostMapping("/api/courses/{id}/image")
    public ResponseEntity<Map<String, Object>> uploadCourseImage(
            @PathVariable Integer id,
            @RequestParam("image") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                Map<String, Object> err = new HashMap<>();
                err.put("success", false);
                err.put("message", "Please select an image file");
                return ResponseEntity.badRequest().body(err);
            }
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Image uploaded successfully");
            res.put("course", courseService.uploadCourseImage(id, file));
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    // =========================================================
    // DELETE IMAGE — DELETE /api/courses/:id/image
    // =========================================================
    @DeleteMapping("/api/courses/{id}/image")
    public ResponseEntity<Map<String, Object>> deleteCourseImage(@PathVariable Integer id) {
        try {
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Image deleted successfully");
            res.put("course", courseService.deleteCourseImage(id));
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    // =========================================================
    // API 6 — GET /api/course-categories
    // =========================================================
    @GetMapping("/api/course-categories")
    public ResponseEntity<Map<String, Object>> getAllCategories() {
        Map<String, Object> res = new HashMap<>();
        res.put("categories", courseService.getAllCategories());
        return ResponseEntity.ok(res);
    }

    // =========================================================
    // GET /api/course-categories/:id
    // =========================================================
    @GetMapping("/api/course-categories/{id}")
    public ResponseEntity<Map<String, Object>> getCategoryById(@PathVariable Integer id) {
        try {
            Map<String, Object> res = new HashMap<>();
            res.put("category", courseService.getCategoryById(id));
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    // =========================================================
    // API 7 — POST /api/course-categories
    // =========================================================
    @PostMapping("/api/course-categories")
    public ResponseEntity<Map<String, Object>> createCategory(
            @RequestBody Map<String, String> body) {
        try {
            CategoryDto cat = courseService.createCategory(
                    body.get("course_category_name"),
                    body.get("course_type")
            );
            Map<String, Object> res = new HashMap<>();
            res.put("success",  true);
            res.put("category", cat);
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    // =========================================================
    // API 8 — PUT /api/course-categories/:id
    // =========================================================
    @PutMapping("/api/course-categories/{id}")
    public ResponseEntity<Map<String, Object>> updateCategory(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        try {
            CategoryDto cat = courseService.updateCategory(
                    id,
                    body.get("course_category_name"),
                    body.get("course_type")
            );
            Map<String, Object> res = new HashMap<>();
            res.put("success",  true);
            res.put("category", cat);
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    // =========================================================
    // API 9 — DELETE /api/course-categories/:id
    // =========================================================
    @DeleteMapping("/api/course-categories/{id}")
    public ResponseEntity<Map<String, Object>> deleteCategory(@PathVariable Integer id) {
        try {
            courseService.deleteCategory(id);
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Category deleted successfully");
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    // =========================================================
    // RESTORE — PUT /api/course-categories/:id/restore
    // =========================================================
    @PutMapping("/api/course-categories/{id}/restore")
    public ResponseEntity<Map<String, Object>> restoreCategory(@PathVariable Integer id) {
        try {
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("category", courseService.restoreCategory(id));
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    // =========================================================
    // API 10 — GET /api/courses/:id/enrollments
    // =========================================================
    // @GetMapping("/api/courses/{id}/enrollments")
    // public ResponseEntity<Map<String, Object>> getCourseEnrollments(@PathVariable Integer id) {
    //     try {
    //         List<CourseEnrollmentDto> enrollments = courseService.getCourseEnrollments(id);
    //         Map<String, Object> res = new HashMap<>();
    //         res.put("enrollments", enrollments);
    //         return ResponseEntity.ok(res);
    //     } catch (RuntimeException e) {
    //         Map<String, Object> err = new HashMap<>();
    //         err.put("success", false);
    //         err.put("message", e.getMessage());
    //         return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
    //     }
    // }

    // =========================================================
    // API 21 — GET /api/courses/:id/groups/:groupId/sessions
    // =========================================================
    @GetMapping("/api/courses/{courseId}/groups/{groupId}/sessions")
    public ResponseEntity<Map<String, Object>> getGroupSessions(
            @PathVariable Integer courseId,
            @PathVariable Integer groupId) {
        try {
            List<SessionDto> sessions = courseService.getGroupSessions(courseId, groupId);
            Map<String, Object> res = new HashMap<>();
            res.put("sessions", sessions);
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    // =========================================================
    // API 22 — PUT /api/courses/:id/groups/:groupId/sessions/:sessionId
    // =========================================================
    @PutMapping("/api/courses/{courseId}/groups/{groupId}/sessions/{sessionId}")
    public ResponseEntity<Map<String, Object>> updateSessionStatus(
            @PathVariable Integer courseId,
            @PathVariable Integer groupId,
            @PathVariable Integer sessionId,
            @RequestBody Map<String, String> request) {
        try {
            String sessionStatus = request.get("session_status");
            Map<String, Object> updated = courseService.updateSessionStatus(courseId, groupId, sessionId, sessionStatus);
            
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("session", updated);
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}