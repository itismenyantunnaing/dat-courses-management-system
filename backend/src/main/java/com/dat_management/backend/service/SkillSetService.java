// SkillSetService.java
package com.dat_management.backend.service;

import com.dat_management.backend.dto.skillset.*;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillSetService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeJapaneseProfileRepository languageProfileRepository;
    private final ManagementScoreRepository managementScoreRepository;
    private final DevelopmentTypeRepository developmentTypeRepository;
    private final EmployeeDevelopmentExperienceRepository devExperienceRepository;
    private final SkillCategoryRepository categoryRepository;
    private final SkillSubCategoryRepository subCategoryRepository;
    private final SkillRepository skillRepository;
    private final EmployeeSkillRepository employeeSkillRepository;

// ========================================== LANGUAGE SKILLS ===========================================
    
    @Transactional
    public LanguageSkillDto saveLanguageSkill(LanguageSkillDto dto) {
        Employee employee = getEmployee(dto.getEmployeeId());

        languageProfileRepository.findByEmployeeId(dto.getEmployeeId())
            .ifPresent(profile -> {
                throw new RuntimeException("Language profile already exists for employee: " + dto.getEmployeeId());
            });

        EmployeeJapaneseProfile profile = new EmployeeJapaneseProfile();
        profile.setEmployee(employee);
        profile.setLanguageSkillLevel(dto.getLanguageSkillLevel());

        EmployeeJapaneseProfile saved = languageProfileRepository.save(profile);
        dto.setId(saved.getId());
        return dto;
    }

    @Transactional
    public LanguageSkillDto updateLanguageSkill(LanguageSkillDto dto) {
        getEmployee(dto.getEmployeeId());

        EmployeeJapaneseProfile profile = languageProfileRepository
            .findByEmployeeId(dto.getEmployeeId())
            .orElseThrow(() -> new RuntimeException("Language profile not found for employee: " + dto.getEmployeeId()));

        profile.setLanguageSkillLevel(dto.getLanguageSkillLevel());

        EmployeeJapaneseProfile saved = languageProfileRepository.save(profile);
        dto.setId(saved.getId());
        return dto;
    }

   @Transactional
    public List<LanguageSkillDto> saveBulkLanguageSkills(List<LanguageSkillDto> dtos) {
        List<LanguageSkillDto> savedSkills = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        
        for (LanguageSkillDto dto : dtos) {
            try {
                savedSkills.add(saveLanguageSkill(dto));
            } catch (RuntimeException e) {
                errors.add("Error for employee " + dto.getEmployeeId() + ": " + e.getMessage());
            }
        }
        
        if (!errors.isEmpty()) {
            throw new RuntimeException("Bulk operation failed: " + String.join("; ", errors));
        }
        
        return savedSkills;
    }

    public LanguageSkillDto getLanguageSkill(String employeeId) {
        getEmployee(employeeId);
        
        EmployeeJapaneseProfile profile = languageProfileRepository.findByEmployeeId(employeeId)
            .orElseThrow(() -> new RuntimeException("Language profile not found for employee: " + employeeId));
        
        LanguageSkillDto dto = new LanguageSkillDto();
        dto.setId(profile.getId());
        dto.setEmployeeId(profile.getEmployee().getId());
        dto.setLanguageSkillLevel(profile.getLanguageSkillLevel());
        return dto;
    }

    public List<LanguageSkillDto> getAllLanguageSkills() {
        return languageProfileRepository.findAll().stream()
            .map(profile -> {
                LanguageSkillDto dto = new LanguageSkillDto();
                dto.setId(profile.getId());
                dto.setEmployeeId(profile.getEmployee().getId());
                dto.setLanguageSkillLevel(profile.getLanguageSkillLevel());
                return dto;
            })
            .collect(Collectors.toList());
    }

    public LanguageSkillDto getLanguageSkillById(Integer id) {
        EmployeeJapaneseProfile profile = languageProfileRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Language profile not found with id: " + id));
        
        LanguageSkillDto dto = new LanguageSkillDto();
        dto.setId(profile.getId());
        dto.setEmployeeId(profile.getEmployee().getId());
        dto.setLanguageSkillLevel(profile.getLanguageSkillLevel());
        return dto;
    }

// =========================================== MANAGEMENT SKILLS ===========================================
    
    @Transactional
    public ManagementSkillDto saveManagementSkill(ManagementSkillDto dto) {
        Employee employee = getEmployee(dto.getEmployeeId());

        managementScoreRepository.findByEmployeeId(dto.getEmployeeId())
            .ifPresent(score -> {
                throw new RuntimeException("Management score already exists for employee: " + dto.getEmployeeId());
            });

        Short totalLevel = calculateTotalLevel(dto);

        ManagementScore managementScore = new ManagementScore();
        managementScore.setEmployee(employee);
        managementScore.setManagementExperienceLevel(dto.getManagementExperienceLevel());
        managementScore.setQcdScore(dto.getQcdScore());
        managementScore.setReportConsultScore(dto.getReportConsultScore());
        managementScore.setEducationScore(dto.getEducationScore());
        managementScore.setTotalLevel(totalLevel);

        ManagementScore saved = managementScoreRepository.save(managementScore);
        dto.setId(saved.getId());
        dto.setTotalLevel(totalLevel);
        return dto;
    }

    @Transactional
    public ManagementSkillDto updateManagementSkill(ManagementSkillDto dto) {
        getEmployee(dto.getEmployeeId());

        ManagementScore managementScore = managementScoreRepository
            .findByEmployeeId(dto.getEmployeeId())
            .orElseThrow(() -> new RuntimeException("Management score not found for employee: " + dto.getEmployeeId()));

        Short totalLevel = calculateTotalLevel(dto);

        managementScore.setManagementExperienceLevel(dto.getManagementExperienceLevel());
        managementScore.setQcdScore(dto.getQcdScore());
        managementScore.setReportConsultScore(dto.getReportConsultScore());
        managementScore.setEducationScore(dto.getEducationScore());
        managementScore.setTotalLevel(totalLevel);

        ManagementScore saved = managementScoreRepository.save(managementScore);
        dto.setId(saved.getId());
        dto.setTotalLevel(totalLevel);
        return dto;
    }

    @Transactional
    public List<ManagementSkillDto> saveBulkManagementSkills(List<ManagementSkillDto> dtos) {
        List<ManagementSkillDto> savedSkills = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        
        for (ManagementSkillDto dto : dtos) {
            try {
                savedSkills.add(saveManagementSkill(dto));
            } catch (RuntimeException e) {
                errors.add("Error for employee " + dto.getEmployeeId() + ": " + e.getMessage());
            }
        }
        
        if (!errors.isEmpty()) {
            throw new RuntimeException("All bulk operations failed: " + String.join("; ", errors));
        }
        
        return savedSkills;
    }

    private Short calculateTotalLevel(ManagementSkillDto dto) {
        int sum = 0;

        if (dto.getQcdScore() != null) sum += dto.getQcdScore();
        if (dto.getReportConsultScore() != null) sum += dto.getReportConsultScore();
        if (dto.getEducationScore() != null) sum += dto.getEducationScore();

        if (sum >= 11) return 5;
        if (sum >= 9) return 4;
        if (sum >= 7) return 3;
        if (sum >= 5) return 2;
        if (sum >= 3) return 1;
        if (sum < 2) return 0;
        return 0;
    }


    public ManagementSkillDto getManagementSkill(String employeeId) {
        getEmployee(employeeId);
        
        ManagementScore score = managementScoreRepository.findByEmployeeId(employeeId)
            .orElseThrow(() -> new RuntimeException("Management score not found for employee: " + employeeId));
        
        ManagementSkillDto dto = new ManagementSkillDto();
        dto.setId(score.getId());
        dto.setEmployeeId(score.getEmployee().getId());
        dto.setManagementExperienceLevel(score.getManagementExperienceLevel());
        dto.setQcdScore(score.getQcdScore());
        dto.setReportConsultScore(score.getReportConsultScore());
        dto.setEducationScore(score.getEducationScore());
        dto.setTotalLevel(score.getTotalLevel());
        return dto;
    }

    public List<ManagementSkillDto> getAllManagementSkills() {
        return managementScoreRepository.findAll().stream()
            .map(score -> {
                ManagementSkillDto dto = new ManagementSkillDto();
                dto.setId(score.getId());
                dto.setEmployeeId(score.getEmployee().getId());
                dto.setManagementExperienceLevel(score.getManagementExperienceLevel());
                dto.setQcdScore(score.getQcdScore());
                dto.setReportConsultScore(score.getReportConsultScore());
                dto.setEducationScore(score.getEducationScore());
                dto.setTotalLevel(score.getTotalLevel());
                return dto;
            })
            .collect(Collectors.toList());
    }

    public ManagementSkillDto getManagementSkillById(Integer id) {
        ManagementScore score = managementScoreRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Management score not found with id: " + id));
        
        ManagementSkillDto dto = new ManagementSkillDto();
        dto.setId(score.getId());
        dto.setEmployeeId(score.getEmployee().getId());
        dto.setManagementExperienceLevel(score.getManagementExperienceLevel());
        dto.setQcdScore(score.getQcdScore());
        dto.setReportConsultScore(score.getReportConsultScore());
        dto.setEducationScore(score.getEducationScore());
        dto.setTotalLevel(score.getTotalLevel());
        return dto;
    }

// =========================================== DEVELOPMENT SKILLS ===========================================
    
    @Transactional
    public DevelopmentSkillDto saveDevelopmentSkill(DevelopmentSkillDto dto) {
        Employee employee = getEmployee(dto.getEmployeeId());

        DevelopmentType developmentType = getOrCreateDevelopmentType(dto.getDevelopmentTypeName());

        devExperienceRepository.findByEmployeeIdAndDevelopmentTypeIdAndProcessName(
            dto.getEmployeeId(), 
            developmentType.getId(), 
            dto.getProcessName()
        ).ifPresent(exp -> {
            throw new RuntimeException("Development experience already exists for employee: " + dto.getEmployeeId() + 
                " with development type: " + dto.getDevelopmentTypeName() + " and process: " + dto.getProcessName());
        });

        EmployeeDevelopmentExperience experience = new EmployeeDevelopmentExperience();
        experience.setEmployee(employee);
        experience.setDevelopmentType(developmentType);
        experience.setProcessName(dto.getProcessName());
        experience.setYearsOfExperience(dto.getYearsOfExperience());

        EmployeeDevelopmentExperience saved = devExperienceRepository.save(experience);
        dto.setId(saved.getId());
        return dto;
    }

    @Transactional
    public DevelopmentSkillDto updateDevelopmentSkill(DevelopmentSkillDto dto) {
        Employee employee = getEmployee(dto.getEmployeeId());

        DevelopmentType developmentType = getOrCreateDevelopmentType(dto.getDevelopmentTypeName());

        EmployeeDevelopmentExperience experience = devExperienceRepository
            .findById(dto.getId())
            .orElseThrow(() -> new RuntimeException("Development experience not found with id: " + dto.getId()));

        devExperienceRepository.findByEmployeeIdAndDevelopmentTypeIdAndProcessName(
            dto.getEmployeeId(), 
            developmentType.getId(), 
            dto.getProcessName()
        ).ifPresent(existing -> {
            if (!existing.getId().equals(dto.getId())) {
                throw new RuntimeException("Development experience already exists for employee: " + dto.getEmployeeId() + 
                    " with development type: " + dto.getDevelopmentTypeName() + " and process: " + dto.getProcessName());
            }
        });

        experience.setEmployee(employee);
        experience.setDevelopmentType(developmentType);
        experience.setProcessName(dto.getProcessName());
        experience.setYearsOfExperience(dto.getYearsOfExperience());

        EmployeeDevelopmentExperience saved = devExperienceRepository.save(experience);
        dto.setId(saved.getId());
        return dto;
    }

    @Transactional
    public List<DevelopmentSkillDto> saveBulkDevelopmentSkills(List<DevelopmentSkillDto> dtos) {
        List<DevelopmentSkillDto> savedSkills = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        
        for (DevelopmentSkillDto dto : dtos) {
            try {
                savedSkills.add(saveDevelopmentSkill(dto));
            } catch (RuntimeException e) {
                errors.add("Error for employee " + dto.getEmployeeId() + ": " + e.getMessage());
            }
        }
        
        if (!errors.isEmpty()) {
            throw new RuntimeException("All bulk operations failed: " + String.join("; ", errors));
        }
        
        return savedSkills;
    }

    public List<DevelopmentSkillDto> getDevelopmentSkillsByEmployee(String employeeId) {
        getEmployee(employeeId);
        
        return devExperienceRepository.findByEmployeeId(employeeId).stream()
            .map(exp -> {
                DevelopmentSkillDto dto = new DevelopmentSkillDto();
                dto.setId(exp.getId());
                dto.setEmployeeId(exp.getEmployee().getId());
                dto.setDevelopmentTypeName(exp.getDevelopmentType().getDevelopmentTypeName());
                dto.setProcessName(exp.getProcessName());
                dto.setYearsOfExperience(exp.getYearsOfExperience());
                return dto;
            })
            .collect(Collectors.toList());
    }

    public List<DevelopmentSkillDto> getAllDevelopmentSkills() {
        return devExperienceRepository.findAll().stream()
            .map(exp -> {
                DevelopmentSkillDto dto = new DevelopmentSkillDto();
                dto.setId(exp.getId());
                dto.setEmployeeId(exp.getEmployee().getId());
                dto.setDevelopmentTypeName(exp.getDevelopmentType().getDevelopmentTypeName());
                dto.setProcessName(exp.getProcessName());
                dto.setYearsOfExperience(exp.getYearsOfExperience());
                return dto;
            })
            .collect(Collectors.toList());
    }

    public DevelopmentSkillDto getDevelopmentSkillById(Integer id) {
        EmployeeDevelopmentExperience exp = devExperienceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Development experience not found with id: " + id));
        
        DevelopmentSkillDto dto = new DevelopmentSkillDto();
        dto.setId(exp.getId());
        dto.setEmployeeId(exp.getEmployee().getId());
        dto.setDevelopmentTypeName(exp.getDevelopmentType().getDevelopmentTypeName());
        dto.setProcessName(exp.getProcessName());
        dto.setYearsOfExperience(exp.getYearsOfExperience());
        return dto;
    }

    private DevelopmentType getOrCreateDevelopmentType(String developmentTypeName) {
        return developmentTypeRepository
            .findByDevelopmentTypeNameIgnoreCase(developmentTypeName)
            .orElseGet(() -> {
                DevelopmentType newType = new DevelopmentType();
                newType.setDevelopmentTypeName(developmentTypeName.trim());
                newType.setIsActive(true);
                return developmentTypeRepository.save(newType);
            });
    }

// =========================================== TECHNICAL SKILLS ===========================================

    @Transactional
    public TechnicalSkillDto saveTechnicalSkill(TechnicalSkillDto dto) {
        Employee employee = getEmployee(dto.getEmployeeId());

        // Handle null/empty values - use empty string for null
        String categoryName = dto.getCategoryName() != null ? dto.getCategoryName().trim() : "";
        String subCategoryName = dto.getSubCategoryName() != null ? dto.getSubCategoryName().trim() : "";

        SkillCategory category = getOrCreateCategory(categoryName);
        SkillSubCategory subCategory = getOrCreateSubCategory(subCategoryName, category);
        Skill skill = getOrCreateSkill(dto.getSkillName().trim(), subCategory);

        // Check for duplicate - check if employee already has a skill with the same skillName, categoryName, subCategoryName
        List<EmployeeSkill> existingSkills = employeeSkillRepository.findByEmployeeId(dto.getEmployeeId());
        
        for (EmployeeSkill existing : existingSkills) {
            Skill existingSkill = existing.getSkill();
            SkillSubCategory existingSubCategory = existingSkill.getSubCategory();
            SkillCategory existingCategory = existingSubCategory != null ? existingSubCategory.getCategory() : null;
            
            // Get the actual values for comparison (using empty string for null)
            String existingCategoryName = existingCategory != null ? existingCategory.getCategoryName() : "";
            String existingSubCategoryName = existingSubCategory != null ? existingSubCategory.getSubCategoryName() : "";
            String existingSkillName = existingSkill.getSkillName();
            
            // Check if skillName, categoryName, and subCategoryName all match
            if (existingSkillName.equalsIgnoreCase(dto.getSkillName().trim()) &&
                existingCategoryName.equals(categoryName) &&
                existingSubCategoryName.equals(subCategoryName)) {
                throw new RuntimeException("Technical skill already exists for employee: " + dto.getEmployeeId() + 
                    " with skill: " + dto.getSkillName() + 
                    (categoryName.isEmpty() ? "" : ", category: " + categoryName) +
                    (subCategoryName.isEmpty() ? "" : ", sub-category: " + subCategoryName));
            }
        }

        EmployeeSkill employeeSkill = new EmployeeSkill();
        employeeSkill.setEmployee(employee);
        employeeSkill.setSkill(skill);
        employeeSkill.setYearsOfExperience(dto.getYearsOfExperience());
        employeeSkill.setExperienceLevel(dto.getExperienceLevel());

        EmployeeSkill saved = employeeSkillRepository.save(employeeSkill);
        dto.setId(saved.getId());
        return dto;
    }

    @Transactional
    public TechnicalSkillDto updateTechnicalSkill(TechnicalSkillDto dto) {
        Employee employee = getEmployee(dto.getEmployeeId());

        // Handle null/empty values - use empty string for null
        String categoryName = dto.getCategoryName() != null ? dto.getCategoryName().trim() : "";
        String subCategoryName = dto.getSubCategoryName() != null ? dto.getSubCategoryName().trim() : "";

        SkillCategory category = getOrCreateCategory(categoryName);
        SkillSubCategory subCategory = getOrCreateSubCategory(subCategoryName, category);
        Skill skill = getOrCreateSkill(dto.getSkillName().trim(), subCategory);

        // Check for duplicate - exclude current record
        List<EmployeeSkill> existingSkills = employeeSkillRepository.findByEmployeeId(dto.getEmployeeId());
        
        for (EmployeeSkill existing : existingSkills) {
            // Skip the current record being updated
            if (existing.getId().equals(dto.getId())) {
                continue;
            }
            
            Skill existingSkill = existing.getSkill();
            SkillSubCategory existingSubCategory = existingSkill.getSubCategory();
            SkillCategory existingCategory = existingSubCategory != null ? existingSubCategory.getCategory() : null;
            
            // Get the actual values for comparison (using empty string for null)
            String existingCategoryName = existingCategory != null ? existingCategory.getCategoryName() : "";
            String existingSubCategoryName = existingSubCategory != null ? existingSubCategory.getSubCategoryName() : "";
            String existingSkillName = existingSkill.getSkillName();
            
            // Check if skillName, categoryName, and subCategoryName all match
            if (existingSkillName.equalsIgnoreCase(dto.getSkillName().trim()) &&
                existingCategoryName.equals(categoryName) &&
                existingSubCategoryName.equals(subCategoryName)) {
                throw new RuntimeException("Technical skill already exists for employee: " + dto.getEmployeeId() + 
                    " with skill: " + dto.getSkillName() + 
                    (categoryName.isEmpty() ? "" : ", category: " + categoryName) +
                    (subCategoryName.isEmpty() ? "" : ", sub-category: " + subCategoryName));
            }
        }

        EmployeeSkill employeeSkill = employeeSkillRepository
            .findById(dto.getId())
            .orElseThrow(() -> new RuntimeException("Technical skill not found with id: " + dto.getId()));

        employeeSkill.setEmployee(employee);
        employeeSkill.setSkill(skill);
        employeeSkill.setYearsOfExperience(dto.getYearsOfExperience());
        employeeSkill.setExperienceLevel(dto.getExperienceLevel());

        EmployeeSkill saved = employeeSkillRepository.save(employeeSkill);
        dto.setId(saved.getId());
        return dto;
    }

    @Transactional
    public List<TechnicalSkillDto> saveBulkTechnicalSkills(List<TechnicalSkillDto> dtos) {
        List<TechnicalSkillDto> savedSkills = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        
        for (TechnicalSkillDto dto : dtos) {
            try {
                savedSkills.add(saveTechnicalSkill(dto));
            } catch (RuntimeException e) {
                errors.add("Error for skill '" + dto.getSkillName() + "' for employee " + dto.getEmployeeId() + ": " + e.getMessage());
            }
        }
        
        if (!errors.isEmpty()) {
            throw new RuntimeException("All bulk operations failed: " + String.join("; ", errors));
        }
        
        return savedSkills;
    }

   @Transactional
    public TechnicalSkillCategoryResponseDto saveCategoryWithSkills(TechnicalSkillCategoryResponseDto dto) {
        // Get or create category
        SkillCategory category;
        if (dto.getId() != null) {
            category = categoryRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + dto.getId()));
            category.setCategoryName(dto.getCategoryName());
            category = categoryRepository.save(category);
        } else {
            category = getOrCreateCategory(dto.getCategoryName());
        }
        
        // Process subcategories
        List<SkillSubCategoryResponseDto> subCategoryDtos = new ArrayList<>();
        
        if (dto.getSkillSubCategories() != null) {
            for (SkillSubCategoryResponseDto subDto : dto.getSkillSubCategories()) {
                SkillSubCategory subCategory;
                if (subDto.getId() != null) {
                    // Update existing subcategory
                    subCategory = subCategoryRepository.findById(subDto.getId())
                        .orElseThrow(() -> new RuntimeException("SubCategory not found with id: " + subDto.getId()));
                    subCategory.setSubCategoryName(subDto.getSubCategoryName());
                    subCategory = subCategoryRepository.save(subCategory);
                } else {
                    // Create new subcategory
                    subCategory = getOrCreateSubCategory(subDto.getSubCategoryName(), category);
                }
                
                // Process skills
                List<SkillResponseDto> skillDtos = new ArrayList<>();
                if (subDto.getSkills() != null) {
                    for (SkillResponseDto skillDto : subDto.getSkills()) {
                        Skill skill;
                        if (skillDto.getId() != null) {
                            // Update existing skill
                            skill = skillRepository.findById(skillDto.getId())
                                .orElseThrow(() -> new RuntimeException("Skill not found with id: " + skillDto.getId()));
                            skill.setSkillName(skillDto.getSkillName());
                            skill = skillRepository.save(skill);
                        } else {
                            // Create new skill
                            skill = getOrCreateSkill(skillDto.getSkillName(), subCategory);
                        }
                        
                        SkillResponseDto savedSkillDto = new SkillResponseDto();
                        savedSkillDto.setId(skill.getId());
                        savedSkillDto.setSkillName(skill.getSkillName());
                        skillDtos.add(savedSkillDto);
                    }
                }
                
                SkillSubCategoryResponseDto savedSubDto = new SkillSubCategoryResponseDto();
                savedSubDto.setId(subCategory.getId());
                savedSubDto.setSubCategoryName(subCategory.getSubCategoryName());
                savedSubDto.setSkills(skillDtos);
                subCategoryDtos.add(savedSubDto);
            }
        }
        
        TechnicalSkillCategoryResponseDto response = new TechnicalSkillCategoryResponseDto();
        response.setId(category.getId());
        response.setCategoryName(category.getCategoryName());
        response.setSkillSubCategories(subCategoryDtos);
        
        return response;
    }

    @Transactional
    public List<TechnicalSkillCategoryResponseDto> saveBulkCategoriesWithSkills(List<TechnicalSkillCategoryResponseDto> dtos) {
        List<TechnicalSkillCategoryResponseDto> savedCategories = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        
        for (TechnicalSkillCategoryResponseDto dto : dtos) {
            try {
                TechnicalSkillCategoryResponseDto saved = saveCategoryWithSkills(dto);
                savedCategories.add(saved);
            } catch (RuntimeException e) {
                errors.add("Error for category '" + dto.getCategoryName() + "': " + e.getMessage());
            }
        }
        
        if (!errors.isEmpty()) {
            throw new RuntimeException("Bulk operation failed: " + String.join("; ", errors));
        }
        
        return savedCategories;
    }

    public List<TechnicalSkillDto> getTechnicalSkillsByEmployee(String employeeId) {
        getEmployee(employeeId);
        
        List<EmployeeSkill> employeeSkills = employeeSkillRepository.findByEmployeeId(employeeId);
        List<TechnicalSkillDto> result = new ArrayList<>();
        
        for (EmployeeSkill es : employeeSkills) {
            Skill skill = es.getSkill();
            SkillSubCategory subCategory = skill.getSubCategory();
            SkillCategory category = subCategory != null ? subCategory.getCategory() : null;
            
            TechnicalSkillDto dto = new TechnicalSkillDto();
            dto.setId(es.getId());
            dto.setEmployeeId(es.getEmployee().getId());
            dto.setSkillName(skill.getSkillName());
            dto.setCategoryName(category != null ? category.getCategoryName() : null);
            dto.setSubCategoryName(subCategory != null ? subCategory.getSubCategoryName() : null);
            dto.setYearsOfExperience(es.getYearsOfExperience());
            dto.setExperienceLevel(es.getExperienceLevel());
            result.add(dto);
        }
        
        return result;
    }

    public List<TechnicalSkillDto> getAllTechnicalSkills() {
        List<EmployeeSkill> employeeSkills = employeeSkillRepository.findAll();
        List<TechnicalSkillDto> result = new ArrayList<>();
        
        for (EmployeeSkill es : employeeSkills) {
            Skill skill = es.getSkill();
            SkillSubCategory subCategory = skill.getSubCategory();
            SkillCategory category = subCategory != null ? subCategory.getCategory() : null;
            
            TechnicalSkillDto dto = new TechnicalSkillDto();
            dto.setId(es.getId());
            dto.setEmployeeId(es.getEmployee().getId());
            dto.setSkillName(skill.getSkillName());
            dto.setCategoryName(category != null ? category.getCategoryName() : null);
            dto.setSubCategoryName(subCategory != null ? subCategory.getSubCategoryName() : null);
            dto.setYearsOfExperience(es.getYearsOfExperience());
            dto.setExperienceLevel(es.getExperienceLevel());
            result.add(dto);
        }
        
        return result;
    }

    public TechnicalSkillDto getTechnicalSkillById(Integer id) {
        EmployeeSkill es = employeeSkillRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Technical skill not found with id: " + id));
        
        Skill skill = es.getSkill();
        SkillSubCategory subCategory = skill.getSubCategory();
        SkillCategory category = subCategory != null ? subCategory.getCategory() : null;
        
        TechnicalSkillDto dto = new TechnicalSkillDto();
        dto.setId(es.getId());
        dto.setEmployeeId(es.getEmployee().getId());
        dto.setSkillName(skill.getSkillName());
        dto.setCategoryName(category != null ? category.getCategoryName() : null);
        dto.setSubCategoryName(subCategory != null ? subCategory.getSubCategoryName() : null);
        dto.setYearsOfExperience(es.getYearsOfExperience());
        dto.setExperienceLevel(es.getExperienceLevel());
        return dto;
    }

    public List<TechnicalSkillCategoryResponseDto> getAllTechnicalSkillsWithCategoryStructure() {
        List<SkillCategory> categories = categoryRepository.findAll();
        List<TechnicalSkillCategoryResponseDto> result = new ArrayList<>();
        
        for (SkillCategory category : categories) {
            TechnicalSkillCategoryResponseDto categoryDto = new TechnicalSkillCategoryResponseDto();
            categoryDto.setId(category.getId());
            categoryDto.setCategoryName(category.getCategoryName());
            
            List<SkillSubCategory> subCategories = subCategoryRepository.findByCategoryId(category.getId());
            List<SkillSubCategoryResponseDto> subCategoryDtos = new ArrayList<>();
            
            for (SkillSubCategory subCategory : subCategories) {
                SkillSubCategoryResponseDto subCategoryDto = new SkillSubCategoryResponseDto();
                subCategoryDto.setId(subCategory.getId());
                subCategoryDto.setSubCategoryName(subCategory.getSubCategoryName());
                
                List<Skill> skills = skillRepository.findBySubCategoryId(subCategory.getId());
                List<SkillResponseDto> skillDtos = new ArrayList<>();
                
                for (Skill skill : skills) {
                    SkillResponseDto skillDto = new SkillResponseDto();
                    skillDto.setId(skill.getId());
                    skillDto.setSkillName(skill.getSkillName());
                    // REMOVED: employee fetching and adding
                    skillDtos.add(skillDto);
                }
                
                subCategoryDto.setSkills(skillDtos);
                subCategoryDtos.add(subCategoryDto);
            }
            
            categoryDto.setSkillSubCategories(subCategoryDtos);
            result.add(categoryDto);
        }
        
        return result;
    }

    private SkillCategory getOrCreateCategory(String categoryName) {
        // Use empty string if categoryName is null or empty
        String name = categoryName != null ? categoryName.trim() : "";
        
        // First try to find existing category with this name (including empty string)
        return categoryRepository
            .findByCategoryNameIgnoreCase(name)
            .orElseGet(() -> {
                SkillCategory newCategory = new SkillCategory();
                newCategory.setCategoryName(name);
                newCategory.setIsActive(true);
                return categoryRepository.save(newCategory);
            });
    }

    private SkillSubCategory getOrCreateSubCategory(String subCategoryName, SkillCategory category) {
        // Use empty string if subCategoryName is null or empty
        String name = subCategoryName != null ? subCategoryName.trim() : "";
        
        // First try to find existing subCategory with this name and category
        return subCategoryRepository
            .findBySubCategoryNameIgnoreCaseAndCategoryId(name, category.getId())
            .orElseGet(() -> {
                // Check if subCategory exists with same name but different category
                SkillSubCategory existingSubCategory = subCategoryRepository
                    .findBySubCategoryNameIgnoreCase(name)
                    .orElse(null);
                
                if (existingSubCategory != null) {
                    // If found, update its category to the new one (if different)
                    if (!existingSubCategory.getCategory().getId().equals(category.getId())) {
                        // Check if the combination with this category already exists
                        subCategoryRepository
                            .findBySubCategoryNameIgnoreCaseAndCategoryId(name, category.getId())
                            .ifPresent(existing -> {
                                // If exists, use that one instead
                            });
                        
                        existingSubCategory.setCategory(category);
                        return subCategoryRepository.save(existingSubCategory);
                    }
                    return existingSubCategory;
                } else {
                    // Create new subCategory
                    SkillSubCategory newSubCategory = new SkillSubCategory();
                    newSubCategory.setCategory(category);
                    newSubCategory.setSubCategoryName(name);
                    newSubCategory.setIsActive(true);
                    return subCategoryRepository.save(newSubCategory);
                }
            });
    }

    private Skill getOrCreateSkill(String skillName, SkillSubCategory subCategory) {
        // First try to find by skill name and subCategory
        return skillRepository
            .findBySkillNameIgnoreCaseAndSubCategoryId(skillName.trim(), subCategory.getId())
            .orElseGet(() -> {
                // Check if skill exists with same name (any subCategory)
                Skill existingSkill = skillRepository
                    .findBySkillNameIgnoreCase(skillName.trim())
                    .orElse(null);
                
                if (existingSkill != null) {
                    // If skill exists with a different subCategory, create a new skill with the new subCategory
                    // This allows the same skill name with different categories/subCategories
                    Skill newSkill = new Skill();
                    newSkill.setSkillName(skillName.trim());
                    newSkill.setSubCategory(subCategory);
                    newSkill.setIsActive(true);
                    return skillRepository.save(newSkill);
                } else {
                    // Create new skill
                    Skill newSkill = new Skill();
                    newSkill.setSkillName(skillName.trim());
                    newSkill.setSubCategory(subCategory);
                    newSkill.setIsActive(true);
                    return skillRepository.save(newSkill);
                }
            });
    }

    private Employee getEmployee(String employeeId) {
        return employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employeeId));
    }

    public EmployeeWithSkillsResponseDTO getEmployeeWithAllSkills(String employeeId) {
        Employee employee = getEmployee(employeeId);
        
        EmployeeWithSkillsResponseDTO response = EmployeeWithSkillsResponseDTO.builder()
            .id(employee.getId())
            .name(employee.getName())
            .email(employee.getEmail())
            .doorlog(employee.getDoorlog())
            .position(employee.getPosition())
            .empStatus(employee.getEmpStatus())
            .status(employee.getStatus())
            .isCorePersonnel(employee.getIsCorePersonnel())
            .hasJapanBusinessTrip(employee.getHasJapanBusinessTrip())
            .notiSetting(employee.getNotiSetting())
            .dob(employee.getDob())
            .profilePhotoPath(employee.getProfilePhotoPath())
            .createdAt(employee.getCreatedAt())
            .updatedAt(employee.getUpdatedAt())
            .build();
        
        // Get team info
        if (employee.getTeam() != null) {
            response.setTeam(employee.getTeam().getTeamName());
            if (employee.getTeam().getDepartmentDat() != null) {
                response.setDeptDat(employee.getTeam().getDepartmentDat().getDeptName());
                if (employee.getTeam().getDepartmentDat().getDivision() != null) {
                    response.setDivName(employee.getTeam().getDepartmentDat().getDivision().getDivisionName());
                }
            }
        }
        
        // Get department dir info
        if (employee.getDepartmentDir() != null) {
            response.setDeptDir(employee.getDepartmentDir().getDeptName());
        }
        
        // Get role info
        if (employee.getRole() != null) {
            response.setRole(employee.getRole().getRoleName());
        }
        
        // Get Language Skill (without employeeId)
        try {
            EmployeeWithSkillsResponseDTO.LanguageSkillInfo languageSkill = getLanguageSkillInfo(employeeId);
            response.setLanguageSkill(languageSkill);
        } catch (RuntimeException e) {
            response.setLanguageSkill(null);
        }
        
        // Get Management Skill (without employeeId)
        try {
            EmployeeWithSkillsResponseDTO.ManagementSkillInfo managementSkill = getManagementSkillInfo(employeeId);
            response.setManagementSkill(managementSkill);
        } catch (RuntimeException e) {
            response.setManagementSkill(null);
        }
        
        // Get Development Skills (without employeeId)
        try {
            List<EmployeeWithSkillsResponseDTO.DevelopmentSkillInfo> developmentSkills = getDevelopmentSkillInfo(employeeId);
            response.setDevelopmentSkills(developmentSkills);
        } catch (RuntimeException e) {
            response.setDevelopmentSkills(new ArrayList<>());
        }
        
        // Get Technical Skills (grouped)
        try {
            List<EmployeeWithSkillsResponseDTO.TechnicalSkillGroup> technicalSkills = getTechnicalSkillsGrouped(employeeId);
            response.setTechnicalSkills(technicalSkills);
        } catch (RuntimeException e) {
            response.setTechnicalSkills(new ArrayList<>());
        }
        
        return response;
    }

    /**
     * Get language skill info without employeeId
     */
    private EmployeeWithSkillsResponseDTO.LanguageSkillInfo getLanguageSkillInfo(String employeeId) {
        EmployeeJapaneseProfile profile = languageProfileRepository.findByEmployeeId(employeeId)
            .orElseThrow(() -> new RuntimeException("Language profile not found for employee: " + employeeId));
        
        return EmployeeWithSkillsResponseDTO.LanguageSkillInfo.builder()
            .id(profile.getId())
            .languageSkillLevel(profile.getLanguageSkillLevel())
            .jlptHighestLevel(profile.getJlptHighestLevel())
            .build();
    }

    // Get management skill info without employeeId
    private EmployeeWithSkillsResponseDTO.ManagementSkillInfo getManagementSkillInfo(String employeeId) {
        ManagementScore score = managementScoreRepository.findByEmployeeId(employeeId)
            .orElseThrow(() -> new RuntimeException("Management score not found for employee: " + employeeId));
        
        return EmployeeWithSkillsResponseDTO.ManagementSkillInfo.builder()
            .id(score.getId())
            .managementExperienceLevel(score.getManagementExperienceLevel())
            .qcdScore(score.getQcdScore())
            .reportConsultScore(score.getReportConsultScore())
            .educationScore(score.getEducationScore())
            .totalLevel(score.getTotalLevel())
            .build();
    }

    // Get development skills info without employeeId
    private List<EmployeeWithSkillsResponseDTO.DevelopmentSkillInfo> getDevelopmentSkillInfo(String employeeId) {
        return devExperienceRepository.findByEmployeeId(employeeId).stream()
            .map(exp -> EmployeeWithSkillsResponseDTO.DevelopmentSkillInfo.builder()
                .id(exp.getId())
                .developmentTypeName(exp.getDevelopmentType().getDevelopmentTypeName())
                .processName(exp.getProcessName())
                .yearsOfExperience(exp.getYearsOfExperience())
                .build())
            .collect(Collectors.toList());
    }

    // Get technical skills grouped by category -> subCategory -> skills
    private List<EmployeeWithSkillsResponseDTO.TechnicalSkillGroup> getTechnicalSkillsGrouped(String employeeId) {
        List<EmployeeSkill> employeeSkills = employeeSkillRepository.findByEmployeeId(employeeId);
        
        // Map to group by categoryName -> subCategoryName -> list of skills
        Map<String, Map<String, List<EmployeeWithSkillsResponseDTO.TechnicalSkillInfo>>> groupedMap = new LinkedHashMap<>();
        
        for (EmployeeSkill es : employeeSkills) {
            Skill skill = es.getSkill();
            SkillSubCategory subCategory = skill.getSubCategory();
            SkillCategory category = subCategory != null ? subCategory.getCategory() : null;
            
            String categoryName = category != null ? category.getCategoryName() : "";
            String subCategoryName = subCategory != null ? subCategory.getSubCategoryName() : "";
            
            EmployeeWithSkillsResponseDTO.TechnicalSkillInfo skillInfo = 
                EmployeeWithSkillsResponseDTO.TechnicalSkillInfo.builder()
                    .skillName(skill.getSkillName())
                    .yearsOfExperience(es.getYearsOfExperience())
                    .experienceLevel(es.getExperienceLevel())
                    .build();
            
            // Group by category
            groupedMap.computeIfAbsent(categoryName, k -> new LinkedHashMap<>())
                    .computeIfAbsent(subCategoryName, k -> new ArrayList<>())
                    .add(skillInfo);
        }
        
        // Convert to response DTOs
        List<EmployeeWithSkillsResponseDTO.TechnicalSkillGroup> result = new ArrayList<>();
        for (Map.Entry<String, Map<String, List<EmployeeWithSkillsResponseDTO.TechnicalSkillInfo>>> categoryEntry : groupedMap.entrySet()) {
            EmployeeWithSkillsResponseDTO.TechnicalSkillGroup categoryGroup = 
                EmployeeWithSkillsResponseDTO.TechnicalSkillGroup.builder()
                    .categoryName(categoryEntry.getKey())
                    .build();
            
            List<EmployeeWithSkillsResponseDTO.TechnicalSubCategoryGroup> subCategoryGroups = new ArrayList<>();
            for (Map.Entry<String, List<EmployeeWithSkillsResponseDTO.TechnicalSkillInfo>> subCategoryEntry : categoryEntry.getValue().entrySet()) {
                EmployeeWithSkillsResponseDTO.TechnicalSubCategoryGroup subCategoryGroup = 
                    EmployeeWithSkillsResponseDTO.TechnicalSubCategoryGroup.builder()
                        .subCategoryName(subCategoryEntry.getKey())
                        .skills(subCategoryEntry.getValue())
                        .build();
                subCategoryGroups.add(subCategoryGroup);
            }
            
            categoryGroup.setSubCategories(subCategoryGroups);
            result.add(categoryGroup);
        }
        
        return result;
    }

    @Transactional
public DevelopmentType createDevelopmentType(String developmentTypeName) {
    // Validate input
    if (developmentTypeName == null || developmentTypeName.trim().isEmpty()) {
        throw new RuntimeException("Development type name cannot be null or empty");
    }
    
    String trimmedName = developmentTypeName.trim();
    
    // Check if development type already exists (case-insensitive)
    if (developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase(trimmedName).isPresent()) {
        throw new RuntimeException("Development type already exists: " + trimmedName);
    }
    
    // Create new development type with isActive = true
    DevelopmentType newType = new DevelopmentType();
    newType.setDevelopmentTypeName(trimmedName);
    newType.setIsActive(true);
    
    return developmentTypeRepository.save(newType);
       }

/**
 * Gets all active development types
 * @return List of active DevelopmentType entities
 */
public List<DevelopmentType> getAllActiveDevelopmentTypes() {
    return developmentTypeRepository.findByIsActiveTrue();
}

    // Get all employees with their skills
    public List<EmployeeWithSkillsResponseDTO> getAllEmployeesWithSkills() {
        List<Employee> employees = employeeRepository.findAll();
        List<EmployeeWithSkillsResponseDTO> result = new ArrayList<>();
        
        for (Employee employee : employees) {
            try {
                EmployeeWithSkillsResponseDTO employeeWithSkills = getEmployeeWithAllSkills(employee.getId());
                result.add(employeeWithSkills);
            } catch (Exception e) {
                // Log error and continue with next employee
                System.err.println("Error fetching skills for employee: " + employee.getId() + " - " + e.getMessage());
                // Still add employee with null skills
                EmployeeWithSkillsResponseDTO basicDto = EmployeeWithSkillsResponseDTO.builder()
                    .id(employee.getId())
                    .name(employee.getName())
                    .email(employee.getEmail())
                    .doorlog(employee.getDoorlog())
                    .position(employee.getPosition())
                    .empStatus(employee.getEmpStatus())
                    .status(employee.getStatus())
                    .isCorePersonnel(employee.getIsCorePersonnel())
                    .hasJapanBusinessTrip(employee.getHasJapanBusinessTrip())
                    .notiSetting(employee.getNotiSetting())
                    .dob(employee.getDob())
                    .profilePhotoPath(employee.getProfilePhotoPath())
                    .createdAt(employee.getCreatedAt())
                    .updatedAt(employee.getUpdatedAt())
                    .languageSkill(null)
                    .managementSkill(null)
                    .developmentSkills(new ArrayList<>())
                    .technicalSkills(new ArrayList<>())
                    .build();
                
                // Get team info
                if (employee.getTeam() != null) {
                    basicDto.setTeam(employee.getTeam().getTeamName());
                    if (employee.getTeam().getDepartmentDat() != null) {
                        basicDto.setDeptDat(employee.getTeam().getDepartmentDat().getDeptName());
                        if (employee.getTeam().getDepartmentDat().getDivision() != null) {
                            basicDto.setDivName(employee.getTeam().getDepartmentDat().getDivision().getDivisionName());
                        }
                    }
                }
                
                if (employee.getDepartmentDir() != null) {
                    basicDto.setDeptDir(employee.getDepartmentDir().getDeptName());
                }
                
                if (employee.getRole() != null) {
                    basicDto.setRole(employee.getRole().getRoleName());
                }
                
                result.add(basicDto);
            }
        }
        
        return result;
    }
}