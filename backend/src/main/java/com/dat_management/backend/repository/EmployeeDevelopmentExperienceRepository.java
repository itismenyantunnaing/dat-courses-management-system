package com.dat_management.backend.repository;

import com.dat_management.backend.entity.EmployeeDevelopmentExperience;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeDevelopmentExperienceRepository extends JpaRepository<EmployeeDevelopmentExperience, Integer> {
    List<EmployeeDevelopmentExperience> findByEmployeeId(String employeeId);
    Optional<EmployeeDevelopmentExperience> findByEmployeeIdAndDevelopmentTypeIdAndProcessName(
        String employeeId, Integer developmentTypeId, String processName
    );
}
