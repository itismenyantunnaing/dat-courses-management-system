// EmployeeImportDto.java
package com.dat_management.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
public class EmployeeImportDto {
    // Basic Information
    private String id;
    private String name;
    private String departmentDirName;
    private String teamName;
    private String rank;
    private Boolean isCorePersonnel = false;
    private Boolean hasJapanBusinessTrip = false;
    
    // Management Data
    private Short managementExperienceLevel;
    private Short qcdScore;
    private Short reportConsultScore;
    private Short educationScore;
    private Short totalLevel;
    
    // Language Skills
    private Short languageLevel;
    private String jlptLevel;
    
    // Development Experiences - Map of system type to list of process experiences
    private Map<String, List<ProcessExperience>> developmentExperiences = new HashMap<>();
    
    // Technical Skills
    private List<SkillExperience> technicalSkills = new ArrayList<>();
    private boolean technicalSkillsSectionPresent = false;
    
    @Data
    public static class ProcessExperience {
        private String systemName;
        private String hostDistributed;
        private String onlineBatch;
        private BigDecimal yearsOfExperience;
        private String processName;
    }
    
    @Data
    public static class SkillExperience {
        private String skillName;
        private String category;
        private String subCategory;
        private BigDecimal yearsOfExperience;
        private String experienceType;
        private String position;
        private Integer numberOfManagers;
    }
}