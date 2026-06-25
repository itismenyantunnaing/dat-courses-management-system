package com.dat_management.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dat_management.backend.entity.SelfStudySession;

public interface SelfStudySessionRepository extends JpaRepository<SelfStudySession, Integer> {
}
