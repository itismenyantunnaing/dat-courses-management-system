package com.dat_management.backend.repository;

import com.dat_management.backend.entity.EmployeeDevelopmentExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeDevelopmentExperienceRepository extends JpaRepository<EmployeeDevelopmentExperience, Integer> {
}
