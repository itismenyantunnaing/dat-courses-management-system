package com.dat_management.backend.repository;

import com.dat_management.backend.entity.CourseGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CourseGroupRepository extends JpaRepository<CourseGroup, Integer> {

    // Groups for a course, ordered by name
    List<CourseGroup> findByCourseIdOrderByGroupNameAsc(Integer courseId);
    
    // Add this method for findByCourseId
    List<CourseGroup> findByCourseId(Integer courseId);

    // Delete groups when replacing in PUT
    void deleteByCourseId(Integer courseId);

    // registered_count per group
    @Query("SELECT COUNT(e) FROM CourseEnrollment e WHERE e.courseGroup.id = :groupId")
    long countEnrollmentsByGroupId(@Param("groupId") Integer groupId);
    
    @Query("SELECT g FROM CourseGroup g WHERE g.course.id = :courseId AND g.capacity IS NULL")
    Optional<CourseGroup> findUnlimitedCapacityGroupByCourseId(@Param("courseId") Integer courseId);
    
    @Query("SELECT g FROM CourseGroup g WHERE g.course.id = :courseId AND g.capacity IS NOT NULL AND " +
           "(SELECT COUNT(e) FROM CourseEnrollment e WHERE e.courseGroup.id = g.id) < g.capacity")
    List<CourseGroup> findAvailableGroupsByCourseId(@Param("courseId") Integer courseId);
}