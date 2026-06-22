package com.dat_management.backend.repository;

import com.dat_management.backend.entity.EmployeeSkill;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeSkillRepository extends JpaRepository<EmployeeSkill, Integer> {
    List<EmployeeSkill> findByEmployeeId(String employeeId);
    Optional<EmployeeSkill> findByEmployeeIdAndSkillId(String employeeId, Integer skillId);
    List<EmployeeSkill> findBySkillId(Integer skillId);
}
