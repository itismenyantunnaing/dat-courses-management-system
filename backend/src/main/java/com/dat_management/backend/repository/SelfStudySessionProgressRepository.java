package com.dat_management.backend.repository;

import com.dat_management.backend.entity.SelfStudySessionProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SelfStudySessionProgressRepository extends JpaRepository<SelfStudySessionProgress, Integer> {

    List<SelfStudySessionProgress> findByEnrollment_Course_Id(Integer courseId);

    Optional<SelfStudySessionProgress> findByIdAndEnrollment_Course_Id(Integer progressId, Integer courseId);
}