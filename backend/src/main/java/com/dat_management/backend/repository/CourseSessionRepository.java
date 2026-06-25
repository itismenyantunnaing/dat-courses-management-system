package com.dat_management.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dat_management.backend.entity.CourseSession;

public interface CourseSessionRepository extends JpaRepository<CourseSession, Integer> {
}