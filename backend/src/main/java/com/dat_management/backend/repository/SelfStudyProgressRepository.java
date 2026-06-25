package com.dat_management.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dat_management.backend.entity.SelfStudySessionProgress;

public interface SelfStudyProgressRepository extends JpaRepository<SelfStudySessionProgress, Integer> {
}

