package com.dat_management.backend.repository;

import com.dat_management.backend.entity.TargetTerm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TargetTermRepository extends JpaRepository<TargetTerm, Integer> {
}
