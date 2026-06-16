package com.dat_management.backend.repository;

import com.dat_management.backend.entity.JlptExamPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JlptExamPlanRepository extends JpaRepository<JlptExamPlan, Integer> {
}
