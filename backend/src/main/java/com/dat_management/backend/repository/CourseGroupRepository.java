package com.dat_management.backend.repository;

import com.dat_management.backend.entity.CourseGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CourseGroupRepository extends JpaRepository<CourseGroup, Integer> {

    // Groups for a course, ordered by name
    List<CourseGroup> findByCourseIdOrderByGroupNameAsc(Integer courseId);

    // Delete groups when replacing in PUT
    void deleteByCourseId(Integer courseId);

    // registered_count per group
    @Query("SELECT COUNT(e) FROM CourseEnrollment e WHERE e.courseGroup.id = :groupId")
    long countEnrollmentsByGroupId(@Param("groupId") Integer groupId);
}