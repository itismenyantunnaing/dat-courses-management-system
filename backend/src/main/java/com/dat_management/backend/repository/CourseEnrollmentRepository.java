package com.dat_management.backend.repository;

import com.dat_management.backend.entity.CourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Integer> {

    // Enrollments per group — used in API 2 to build enrollments[] inside each group
    List<CourseEnrollment> findByCourseGroupId(Integer courseGroupId);

    List<CourseEnrollment> findByCourseId(Integer courseId);

    // Duplicate-enroll guard
    boolean existsByEmployeeIdAndCourseId(String employeeId, Integer courseId);
}