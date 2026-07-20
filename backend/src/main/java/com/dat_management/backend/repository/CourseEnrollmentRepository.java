package com.dat_management.backend.repository;

import com.dat_management.backend.entity.CourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Integer> {

    // Enrollments per group — used in API 2 to build enrollments[] inside each
    // group
    List<CourseEnrollment> findByCourseGroupId(Integer courseGroupId);

    Long countByCourseId(Integer courseId);

    List<CourseEnrollment> findByCourseId(Integer courseId);

    // Duplicate-enroll guard
    boolean existsByEmployeeIdAndCourseId(String employeeId, Integer courseId);

    @Query("""
                SELECT COUNT(ce) > 0
                FROM CourseEnrollment ce
                WHERE ce.employee.id = :employeeId
                AND ce.course.id = :courseId
            """)
    boolean existsEnrollment(
            @Param("employeeId") String employeeId,
            @Param("courseId") Integer courseId);

    @Query("SELECT e FROM CourseEnrollment e WHERE e.courseGroup.id = :groupId ORDER BY e.enrolledAt ASC")
    List<CourseEnrollment> findByCourseGroupIdOrderByEnrolledAtAsc(@Param("groupId") Integer groupId);

    @Modifying
    @Query("UPDATE CourseEnrollment e SET e.courseGroup.id = :newGroupId WHERE e.id = :enrollmentId")
    void updateEnrollmentGroup(@Param("enrollmentId") Integer enrollmentId,
            @Param("newGroupId") Integer newGroupId);

    // ADD THIS METHOD - Get all approved enrollments
    @Query("SELECT ce FROM CourseEnrollment ce WHERE ce.enrollmentStatus = 'APPROVED' " +
            "AND ce.employee.isDeleted = false " +
            "AND ce.employee.empStatus = 'active' " +
            "AND ce.course.isDeleted = false")
    List<CourseEnrollment> findAllApprovedActiveEnrollments();
}