package com.dat_management.backend.repository;

import com.dat_management.backend.entity.TargetTerm;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TargetTermRepository extends JpaRepository<TargetTerm, Integer> {
    List<TargetTerm> findByIsActiveTrue();
}