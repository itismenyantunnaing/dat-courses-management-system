package com.dat_management.backend.controller;

import com.dat_management.backend.dto.CategoryDto;
import com.dat_management.backend.dto.CourseDto;
import com.dat_management.backend.service.AuditLogService;
import com.dat_management.backend.service.CourseService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseControllerTest {

    @Mock
    private CourseService courseService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private HttpServletRequest httpServletRequest;

    @Test
    void getAllCourses_returnsCoursesPayload() {
        CourseController controller = new CourseController(courseService, auditLogService, httpServletRequest);
        CourseDto course = CourseDto.builder()
                .id(100)
                .courseName("JLPT N2 Trainer")
                .status("OPEN")
                .build();

        when(courseService.getAllCourses()).thenReturn(List.of(course));

        ResponseEntity<Map<String, Object>> response = controller.getAllCourses();

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(List.of(course), response.getBody().get("courses"));
    }

    @Test
    void getCourseById_missingCourse_returnsNotFoundResponse() {
        CourseController controller = new CourseController(courseService, auditLogService, httpServletRequest);

        when(courseService.getCourseById(99)).thenThrow(new RuntimeException("Course not found with id: 99"));

        ResponseEntity<Map<String, Object>> response = controller.getCourseById(99);

        Assertions.assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        Assertions.assertEquals(false, response.getBody().get("success"));
        Assertions.assertEquals("Course not found with id: 99", response.getBody().get("message"));
    }

    @Test
    void createCategory_validRequest_returnsCreatedCategory() {
        CourseController controller = new CourseController(courseService, auditLogService, httpServletRequest);
        CategoryDto category = CategoryDto.builder()
                .id(1)
                .courseCategoryName("JLPT Exam Target Course")
                .courseType("TRAINER_PROVIDED")
                .isDeleted(false)
                .build();

        when(courseService.createCategory("JLPT Exam Target Course", "TRAINER_PROVIDED")).thenReturn(category);

        ResponseEntity<Map<String, Object>> response = controller.createCategory(Map.of(
                "course_category_name", "JLPT Exam Target Course",
                "course_type", "TRAINER_PROVIDED"));

        Assertions.assertEquals(HttpStatus.CREATED, response.getStatusCode());
        Assertions.assertEquals(true, response.getBody().get("success"));
        Assertions.assertEquals(category, response.getBody().get("category"));
    }
}
