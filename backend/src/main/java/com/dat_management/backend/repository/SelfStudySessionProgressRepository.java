package com.dat_management.backend.repository;

import com.dat_management.backend.entity.SelfStudySessionProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SelfStudySessionProgressRepository
        extends JpaRepository<SelfStudySessionProgress, Integer> {

    List<SelfStudySessionProgress> findByEnrollment_Course_Id(Integer courseId);

    Optional<SelfStudySessionProgress> findByIdAndEnrollment_Course_Id(
            Integer progressId,
            Integer courseId
    );

    // Check duplicate (because enrollment_id + self_study_session_id is unique)
    boolean existsByEnrollment_IdAndSelfStudySession_Id(
            Integer enrollmentId,
            Integer selfStudySessionId
    );

    // Optional: retrieve the progress directly by enrollment and session
    Optional<SelfStudySessionProgress> findByEnrollment_IdAndSelfStudySession_Id(
            Integer enrollmentId,
            Integer selfStudySessionId
    );

    List<SelfStudySessionProgress> findByEnrollmentId(Integer enrollmentId);
}