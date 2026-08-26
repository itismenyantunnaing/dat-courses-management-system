package com.dat_management.backend.repository;

import com.dat_management.backend.entity.EmployeeDevelopmentExperience;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeDevelopmentExperienceRepository extends JpaRepository<EmployeeDevelopmentExperience, Integer> {
    List<EmployeeDevelopmentExperience> findByEmployeeId(String employeeId);
    Optional<EmployeeDevelopmentExperience> findByEmployeeIdAndDevelopmentTypeIdAndProcessName(
        String employeeId, Integer developmentTypeId, String processName
    );
    
    @Query("SELECT e FROM EmployeeDevelopmentExperience e WHERE e.employee.id = :employeeId AND e.developmentType.id = :developmentTypeId")
    List<EmployeeDevelopmentExperience> findByEmployeeAndDevelopmentType(
        @Param("employeeId") String employeeId, 
        @Param("developmentTypeId") Integer developmentTypeId
    );
}
