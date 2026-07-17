package com.dat_management.backend.dto.skillset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.dat_management.backend.dto.EmployeeJapaneseProfileResponse;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeWithSkillsResponseDTO {
    private String id;
    private String name;
    private String email;
    private String doorlog;
    private String position;
    private String empStatus;
    private String status;
    private Boolean isCorePersonnel;
    private Boolean hasJapanBusinessTrip;
    private Boolean notiSetting;
    private String divName;
    private String deptDir;
    private String deptDat;
    private String team;
    private String role;
    private LocalDate dob;
    private String profilePhotoPath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Skills (without employeeId)
    private LanguageSkillInfo languageSkill;
    private ManagementSkillInfo managementSkill;
    private List<DevelopmentSkillInfo> developmentSkills;
    private List<TechnicalSkillGroup> technicalSkills;
    private EmployeeJapaneseProfileResponse japaneseProfile;
    
    // ==================== LANGUAGE SKILL (without employeeId) ====================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LanguageSkillInfo {
        private Integer id;
        private Short languageSkillLevel;
        private String jlptHighestLevel;
    }
    
    // ==================== MANAGEMENT SKILL (without employeeId) ====================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManagementSkillInfo {
        private Integer id;
        private Short managementExperienceLevel;
        private Short qcdScore;
        private Short reportConsultScore;
        private Short educationScore;
        private Short totalLevel;
    }
    
    // ==================== DEVELOPMENT SKILL (without employeeId) ====================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DevelopmentSkillInfo {
        private Integer id;
        private String developmentTypeName;
        private String processName;
        private BigDecimal yearsOfExperience;
    }
    
    // ==================== TECHNICAL SKILL GROUP (without employeeId) ====================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TechnicalSkillGroup {
        private String categoryName;
        private List<TechnicalSubCategoryGroup> subCategories;
    }
    
    // ==================== TECHNICAL SUB-CATEGORY GROUP ====================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TechnicalSubCategoryGroup {
        private String subCategoryName;
        private List<TechnicalSkillInfo> skills;
    }
    
    // ==================== TECHNICAL SKILL INFO (without employeeId) ====================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TechnicalSkillInfo {
        private String skillName;
        private BigDecimal yearsOfExperience;
        private String experienceLevel;
    }
}