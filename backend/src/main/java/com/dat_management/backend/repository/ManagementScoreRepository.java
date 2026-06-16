package com.dat_management.backend.repository;

import com.dat_management.backend.entity.ManagementScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ManagementScoreRepository extends JpaRepository<ManagementScore, Integer> {
}
