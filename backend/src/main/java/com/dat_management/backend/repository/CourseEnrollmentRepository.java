package com.dat_management.backend.repository;

import com.dat_management.backend.entity.CourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Integer> {

    // Enrollments per group — used in API 2 to build enrollments[] inside each group
    List<CourseEnrollment> findByCourseGroupId(Integer courseGroupId);

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
}