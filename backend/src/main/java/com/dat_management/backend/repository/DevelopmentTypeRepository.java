package com.dat_management.backend.repository;

import com.dat_management.backend.entity.DevelopmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DevelopmentTypeRepository extends JpaRepository<DevelopmentType, Integer> {
}
