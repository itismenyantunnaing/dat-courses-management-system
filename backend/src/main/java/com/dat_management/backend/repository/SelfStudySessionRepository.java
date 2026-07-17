package com.dat_management.backend.repository;

import com.dat_management.backend.entity.SelfStudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SelfStudySessionRepository extends JpaRepository<SelfStudySession, Integer> {

    // Self-study sessions for a course, ordered by session number
    List<SelfStudySession> findByCourseIdOrderBySessionNoAsc(Integer courseId);

    // Delete when replacing in PUT
    void deleteByCourseId(Integer courseId);

     List<SelfStudySession> findByCourseId(Integer courseId);

}