// EmployeeExportDto.java
package com.dat_management.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class EmployeeExportDto {
    // Basic Information
    private String id;
    private String name;
    private String departmentDirName;
    private String teamName;
    private String rank;
    private String isCorePersonnel;
    private String hasJapanBusinessTrip;
    
    // Management
    private String managementExperienceLevel;
    private String qcdScore;
    private String reportConsultScore;
    private String educationScore;
    private String totalLevel;
    
    // Language
    private String languageLevel;
    private String jlptLevel;
    
    // Development Experiences grouped by system
    private Map<String, List<ProcessExport>> developmentExperiences;
    
    // Technical Skills
    private List<SkillExport> technicalSkills;
    
    @Data
    @Builder
    public static class ProcessExport {
        private String systemName;
        private String hostDistributed;
        private String onlineBatch;
        private String yearsOfExperience;
        private String processName;
    }
    
    @Data
    @Builder
    public static class SkillExport {
        private String skillName;
        private String subCategory;
        private String category;
        private String yearsOfExperience;
        private String experienceType;
        private String position;
        private String numberOfManagers;
    }
}