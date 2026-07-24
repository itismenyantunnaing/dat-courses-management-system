package com.dat_management.backend.repository;

import com.dat_management.backend.entity.SelfStudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SelfStudySessionRepository extends JpaRepository<SelfStudySession, Integer> {

    // Self-study sessions for a course, ordered by session number
    List<SelfStudySession> findByCourseIdOrderBySessionNoAsc(Integer courseId);

    // Delete when replacing in PUT
    void deleteByCourseId(Integer courseId);

    List<SelfStudySession> findByCourseId(Integer courseId);

    @Query("SELECT COUNT(s) FROM SelfStudySession s WHERE s.course.id = :courseId")
    long countSessionsByCourseId(@Param("courseId") Integer courseId);

}