package com.dat_management.backend.repository;

import com.dat_management.backend.entity.SelfStudySessionProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SelfStudySessionProgressRepository
                extends JpaRepository<SelfStudySessionProgress, Integer> {

        List<SelfStudySessionProgress> findByEnrollment_Course_Id(Integer courseId);

        Optional<SelfStudySessionProgress> findByIdAndEnrollment_Course_Id(
                        Integer progressId,
                        Integer courseId);

        // Check duplicate (because enrollment_id + self_study_session_id is unique)
        boolean existsByEnrollment_IdAndSelfStudySession_Id(
                        Integer enrollmentId,
                        Integer selfStudySessionId);

        // Optional: retrieve the progress directly by enrollment and session
        Optional<SelfStudySessionProgress> findByEnrollment_IdAndSelfStudySession_Id(
                        Integer enrollmentId,
                        Integer selfStudySessionId);

        List<SelfStudySessionProgress> findByEnrollment_Id(Integer enrollmentId);

        void deleteByenrollment_id(Integer id);

        List<SelfStudySessionProgress> findByEnrollmentId(Integer enrollmentId);

        @Query("SELECT p FROM SelfStudySessionProgress p WHERE p.enrollment.id = :enrollmentId " +
                        "AND p.selfStudySession.id = :sessionId")
        SelfStudySessionProgress findByEnrollmentIdAndSessionId(@Param("enrollmentId") Integer enrollmentId,
                        @Param("sessionId") Integer sessionId);

        // ADD THIS - Find the maximum deadline for a student's enrollment
        @Query("SELECT MAX(p.sessionDeadline) FROM SelfStudySessionProgress p WHERE p.enrollment.id = :enrollmentId")
        Optional<LocalDateTime> findMaxDeadlineByEnrollmentId(@Param("enrollmentId") Integer enrollmentId);
}