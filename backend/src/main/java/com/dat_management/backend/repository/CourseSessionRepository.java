package com.dat_management.backend.repository;

import com.dat_management.backend.entity.CourseSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseSessionRepository extends JpaRepository<CourseSession, Integer> {

    // Sessions for one group, ordered by session number
    List<CourseSession> findByCourseGroupIdOrderBySessionNoAsc(Integer courseGroupId);

    // Delete sessions when replacing groups in PUT
    void deleteByCourseGroupId(Integer courseGroupId);

    // Delete all sessions for a course when doing course-level replace
    void deleteByCourseId(Integer courseId);
}