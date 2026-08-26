// ExcelDataService.java
package com.dat_management.backend.service;

import com.dat_management.backend.dto.EmployeeImportDto;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExcelDataService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final EmployeeDevelopmentExperienceRepository employeeDevelopmentExperienceRepository;
    private final ManagementScoreRepository managementScoreRepository;
    private final SkillRepository skillRepository;
    private final SkillSubCategoryRepository skillSubCategoryRepository;
    private final DepartmentDirRepository departmentDirRepository;
    private final TeamRepository teamRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getEmployeeDataSummary(String employeeId) {
        Map<String, Object> summary = new LinkedHashMap<>();
        
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));
        
        summary.put("employee", employee);
        
        // Get management score
        managementScoreRepository.findByEmployeeId(employeeId)
            .ifPresent(score -> summary.put("managementScore", score));
        
        // Get development experiences
        List<EmployeeDevelopmentExperience> devExperiences = 
            employeeDevelopmentExperienceRepository.findByEmployeeId(employeeId);
        summary.put("developmentExperiences", devExperiences);
        
        // Get technical skills
        List<EmployeeSkill> skills = employeeSkillRepository.findByEmployeeId(employeeId);
        summary.put("technicalSkills", skills);
        
        return summary;
    }

    @Transactional(readOnly = true)
    public List<Employee> findEmployeesBySkill(String skillName) {
        return employeeSkillRepository.findByEmployeeId(null).stream()
            .filter(es -> es.getSkill() != null && 
                          skillName.equalsIgnoreCase(es.getSkill().getSkillName()))
            .map(EmployeeSkill::getEmployee)
            .distinct()
            .toList();
    }

    @Transactional(readOnly = true)
    public List<Employee> findEmployeesByProcess(String processName) {
        return employeeDevelopmentExperienceRepository.findByEmployeeId(null).stream()
            .filter(exp -> processName.equalsIgnoreCase(exp.getProcessName()))
            .map(EmployeeDevelopmentExperience::getEmployee)
            .distinct()
            .toList();
    }

    @Transactional
    public void updateEmployeeTechnicalSkills(String employeeId, List<EmployeeImportDto.SkillExperience> skills) {
        // Delete existing skills
        employeeSkillRepository.deleteByEmployeeId(employeeId);
        
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));
        
        for (EmployeeImportDto.SkillExperience skillDto : skills) {
            // Find or create skill
            Skill skill = findOrCreateSkill(skillDto.getSkillName(), skillDto.getSubCategory());
            
            EmployeeSkill employeeSkill = new EmployeeSkill();
            employeeSkill.setEmployee(employee);
            employeeSkill.setSkill(skill);
            employeeSkill.setYearsOfExperience(skillDto.getYearsOfExperience());
            employeeSkill.setExperienceLevel(skillDto.getExperienceType());
            
            employeeSkillRepository.save(employeeSkill);
        }
    }

    private Skill findOrCreateSkill(String skillName, String subCategoryName) {
        // Find or create sub-category
        SkillSubCategory subCategory = skillSubCategoryRepository.findBySubCategoryName(subCategoryName)
            .orElseGet(() -> {
                SkillSubCategory newSubCategory = new SkillSubCategory();
                newSubCategory.setSubCategoryName(subCategoryName);
                newSubCategory.setIsActive(true);
                return skillSubCategoryRepository.save(newSubCategory);
            });
        
        // Find or create skill
        return skillRepository.findBySkillNameAndSubCategory(skillName, subCategory)
            .orElseGet(() -> {
                Skill newSkill = new Skill();
                newSkill.setSkillName(skillName);
                newSkill.setSubCategory(subCategory);
                newSkill.setIsActive(true);
                return skillRepository.save(newSkill);
            });
    }

    @Transactional(readOnly = true)
    public List<Employee> getEmployeesByDepartment(String departmentName) {
        DepartmentDir department = departmentDirRepository.findByDeptName(departmentName)
            .orElse(null);
        
        if (department == null) {
            return Collections.emptyList();
        }
        
        return employeeRepository.findByDepartmentDirId(department.getId());
    }

    @Transactional(readOnly = true)
    public List<Employee> getEmployeesByTeam(String teamName) {
        // Find teams with this name
        List<Team> teams = teamRepository.findByIsDeletedFalse().stream()
            .filter(t -> teamName.equalsIgnoreCase(t.getTeamName()))
            .toList();
        
        if (teams.isEmpty()) {
            return Collections.emptyList();
        }
        
        List<Employee> employees = new ArrayList<>();
        for (Team team : teams) {
            employees.addAll(employeeRepository.findByTeamId(team.getId()));
        }
        return employees;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new LinkedHashMap<>();
        
        long totalEmployees = employeeRepository.count();
        stats.put("totalEmployees", totalEmployees);
        
        long activeEmployees = employeeRepository.findByIsDeletedFalse().size();
        stats.put("activeEmployees", activeEmployees);
        
        // Management score statistics
        List<ManagementScore> scores = managementScoreRepository.findAll();
        if (!scores.isEmpty()) {
            double avgManagementLevel = scores.stream()
                .mapToInt(s -> s.getManagementExperienceLevel() != null ? s.getManagementExperienceLevel() : 0)
                .average()
                .orElse(0);
            stats.put("averageManagementLevel", Math.round(avgManagementLevel * 10) / 10.0);
            
            double avgTotalLevel = scores.stream()
                .mapToInt(s -> s.getTotalLevel() != null ? s.getTotalLevel() : 0)
                .average()
                .orElse(0);
            stats.put("averageTotalLevel", Math.round(avgTotalLevel * 10) / 10.0);
        }
        
        // Skill statistics
        long totalSkills = employeeSkillRepository.count();
        stats.put("totalSkillRecords", totalSkills);
        
        return stats;
    }
}