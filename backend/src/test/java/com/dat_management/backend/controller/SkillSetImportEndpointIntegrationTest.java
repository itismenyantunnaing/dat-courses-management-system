package com.dat_management.backend.controller;

import com.dat_management.backend.entity.DevelopmentType;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeDevelopmentExperience;
import com.dat_management.backend.entity.EmployeeJapaneseProfile;
import com.dat_management.backend.entity.EmployeeSkill;
import com.dat_management.backend.entity.ManagementScore;
import com.dat_management.backend.entity.Skill;
import com.dat_management.backend.entity.SkillCategory;
import com.dat_management.backend.entity.SkillSubCategory;
import com.dat_management.backend.repository.DevelopmentTypeRepository;
import com.dat_management.backend.repository.EmployeeDevelopmentExperienceRepository;
import com.dat_management.backend.repository.EmployeeJapaneseProfileRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.EmployeeSkillRepository;
import com.dat_management.backend.repository.ManagementScoreRepository;
import com.dat_management.backend.repository.SkillCategoryRepository;
import com.dat_management.backend.repository.SkillRepository;
import com.dat_management.backend.repository.SkillSubCategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Import endpoint integration test for Skill Set
 *
 * Skill Set isn't one endpoint -- the frontend importer (tabs-config.ts "skills" tab)
 * calls four separate bulk endpoints, one per skill type, each backed by its own table:
 *   - POST /api/skills/language/bulk    -> EmployeeJapaneseProfile.languageSkillLevel
 *   - POST /api/skills/management/bulk  -> ManagementScore
 *   - POST /api/skills/development/bulk -> EmployeeDevelopmentExperience (+ auto-created DevelopmentType)
 *   - POST /api/skills/technical/bulk   -> EmployeeSkill (+ auto-created SkillCategory/SkillSubCategory/Skill)
 *
 * All four share the same all-or-nothing transaction behavior as Holiday and Current
 * Target: a single @Transactional service method wraps the whole batch, so one bad row
 * rolls back everything else in the same request -- including any lookup rows (dev
 * types, skill categories) that were auto-created earlier in that same call.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SkillSetImportEndpointIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private EmployeeJapaneseProfileRepository languageProfileRepository;

    @Autowired
    private ManagementScoreRepository managementScoreRepository;

    @Autowired
    private EmployeeDevelopmentExperienceRepository devExperienceRepository;

    @Autowired
    private DevelopmentTypeRepository developmentTypeRepository;

    @Autowired
    private EmployeeSkillRepository employeeSkillRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private SkillSubCategoryRepository skillSubCategoryRepository;

    @Autowired
    private SkillCategoryRepository skillCategoryRepository;

    @BeforeEach
    void cleanDatabase() {
        // Children first to satisfy FK constraints.
        employeeSkillRepository.deleteAll();
        skillRepository.deleteAll();
        skillSubCategoryRepository.deleteAll();
        skillCategoryRepository.deleteAll();
        devExperienceRepository.deleteAll();
        developmentTypeRepository.deleteAll();
        managementScoreRepository.deleteAll();
        languageProfileRepository.deleteAll();
        employeeRepository.deleteAll();
    }

    private Employee createEmployee(String id, String name, String email) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(name);
        employee.setEmail(email);
        employee.setPassword("Password1!");
        employee.setPosition("Engineer");
        employee.setEmpStatus("active");
        employee.setStatus("default");
        return employeeRepository.saveAndFlush(employee);
    }

    // =============================================== LANGUAGE SKILLS ===============================================

    @Test
    @DisplayName("TC_SKILL_LANG_IMPORT_001 | POST bulk valid language skills -> persists languageSkillLevel per employee")
    void importLanguageSkills_validBulkPayload_persistsSkills() throws Exception {
        createEmployee("EMP901", "Lang Employee One", "lang.one@dat.com");
        createEmployee("EMP902", "Lang Employee Two", "lang.two@dat.com");

        mockMvc.perform(post("/api/skills/language/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "employeeId": "EMP901", "languageSkillLevel": 4 },
                                  { "employeeId": "EMP902", "languageSkillLevel": 2 }
                                ]
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].employeeId").value("EMP901"));

        EmployeeJapaneseProfile emp901Profile = languageProfileRepository.findByEmployeeId("EMP901").orElseThrow();
        assertEquals((short) 4, emp901Profile.getLanguageSkillLevel());

        EmployeeJapaneseProfile emp902Profile = languageProfileRepository.findByEmployeeId("EMP902").orElseThrow();
        assertEquals((short) 2, emp902Profile.getLanguageSkillLevel());
    }

    @Test
    @DisplayName("TC_SKILL_LANG_IMPORT_002 | POST bulk with one row referencing an unknown employee -> 404, entire batch rolled back")
    void importLanguageSkills_batchContainsUnknownEmployee_rollsBackEntireBatch() throws Exception {
        createEmployee("EMP903", "Lang Employee Three", "lang.three@dat.com");

        mockMvc.perform(post("/api/skills/language/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "employeeId": "EMP903", "languageSkillLevel": 3 },
                                  { "employeeId": "EMP_DOES_NOT_EXIST", "languageSkillLevel": 3 }
                                ]
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        assertTrue(languageProfileRepository.findAll().isEmpty());
    }

    @Test
    @DisplayName("TC_SKILL_LANG_IMPORT_003 | POST bulk where one employee already has a language profile -> 400, entire batch rolled back")
    void importLanguageSkills_batchContainsExistingProfile_rollsBackEntireBatch() throws Exception {
        Employee existing = createEmployee("EMP904", "Lang Employee Four", "lang.four@dat.com");
        EmployeeJapaneseProfile preExisting = new EmployeeJapaneseProfile();
        preExisting.setEmployee(existing);
        preExisting.setLanguageSkillLevel((short) 1);
        languageProfileRepository.saveAndFlush(preExisting);

        createEmployee("EMP905", "Lang Employee Five", "lang.five@dat.com");

        mockMvc.perform(post("/api/skills/language/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "employeeId": "EMP905", "languageSkillLevel": 5 },
                                  { "employeeId": "EMP904", "languageSkillLevel": 3 }
                                ]
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        // EMP905 is a brand-new, otherwise-valid row -- it must NOT be persisted either.
        assertTrue(languageProfileRepository.findByEmployeeId("EMP905").isEmpty());

        // EMP904's original profile must be untouched.
        EmployeeJapaneseProfile unchanged = languageProfileRepository.findByEmployeeId("EMP904").orElseThrow();
        assertEquals((short) 1, unchanged.getLanguageSkillLevel());
        assertEquals(1, languageProfileRepository.count());
    }

    // ======================================== MANAGEMENT SKILLS ========================================

    @Test
    @DisplayName("TC_SKILL_MGMT_IMPORT_001 | POST bulk valid management skills -> persists scores with server-computed totalLevel")
    void importManagementSkills_validBulkPayload_persistsScoresWithComputedTotalLevel() throws Exception {
        createEmployee("EMP910", "Mgmt Employee One", "mgmt.one@dat.com");
        createEmployee("EMP911", "Mgmt Employee Two", "mgmt.two@dat.com");

        mockMvc.perform(post("/api/skills/management/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "employeeId": "EMP910", "managementExperienceLevel": 3, "qcdScore": 3, "reportConsultScore": 3, "educationScore": 3 },
                                  { "employeeId": "EMP911", "managementExperienceLevel": 1, "qcdScore": 1, "reportConsultScore": 1, "educationScore": 1 }
                                ]
                                """))
                .andExpect(status().isCreated());

        // sum = 9 (qcd 3 + report 3 + education 3) -> bucket 4
        ManagementScore emp910Score = managementScoreRepository.findByEmployeeId("EMP910").orElseThrow();
        assertEquals((short) 4, emp910Score.getTotalLevel());

        // sum = 3 (1 + 1 + 1) -> bucket 1
        ManagementScore emp911Score = managementScoreRepository.findByEmployeeId("EMP911").orElseThrow();
        assertEquals((short) 1, emp911Score.getTotalLevel());
    }

    @Test
    @DisplayName("TC_SKILL_MGMT_IMPORT_002 | POST bulk with one row referencing an unknown employee -> 404, entire batch rolled back")
    void importManagementSkills_batchContainsUnknownEmployee_rollsBackEntireBatch() throws Exception {
        createEmployee("EMP912", "Mgmt Employee Three", "mgmt.three@dat.com");

        mockMvc.perform(post("/api/skills/management/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "employeeId": "EMP912", "qcdScore": 2, "reportConsultScore": 2, "educationScore": 2 },
                                  { "employeeId": "EMP_DOES_NOT_EXIST", "qcdScore": 2, "reportConsultScore": 2, "educationScore": 2 }
                                ]
                                """))
                .andExpect(status().isNotFound());

        assertTrue(managementScoreRepository.findAll().isEmpty());
    }

    @Test
    @DisplayName("TC_SKILL_MGMT_IMPORT_003 | POST bulk where one employee already has a management score -> 400, entire batch rolled back")
    void importManagementSkills_batchContainsExistingScore_rollsBackEntireBatch() throws Exception {
        Employee existing = createEmployee("EMP913", "Mgmt Employee Four", "mgmt.four@dat.com");
        ManagementScore preExisting = new ManagementScore();
        preExisting.setEmployee(existing);
        preExisting.setQcdScore((short) 1);
        preExisting.setReportConsultScore((short) 1);
        preExisting.setEducationScore((short) 1);
        preExisting.setTotalLevel((short) 1);
        managementScoreRepository.saveAndFlush(preExisting);

        createEmployee("EMP914", "Mgmt Employee Five", "mgmt.five@dat.com");

        mockMvc.perform(post("/api/skills/management/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "employeeId": "EMP914", "qcdScore": 4, "reportConsultScore": 4, "educationScore": 4 },
                                  { "employeeId": "EMP913", "qcdScore": 2, "reportConsultScore": 2, "educationScore": 2 }
                                ]
                                """))
                .andExpect(status().isBadRequest());

        assertTrue(managementScoreRepository.findByEmployeeId("EMP914").isEmpty());
        assertEquals(1, managementScoreRepository.count());
    }

    // =========================================== DEVELOPMENT SKILLS ===========================================

    @Test
    @DisplayName("TC_SKILL_DEV_IMPORT_001 | POST bulk valid development skills with a brand-new type -> auto-creates the type and persists the experience")
    void importDevelopmentSkills_validBulkPayloadWithNewType_createsTypeAndPersistsExperience() throws Exception {
        createEmployee("EMP920", "Dev Employee One", "dev.one@dat.com");

        mockMvc.perform(post("/api/skills/development/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "employeeId": "EMP920", "developmentTypeName": "Cloud Migration", "processName": "AWS Rehost", "yearsOfExperience": 2.5 }
                                ]
                                """))
                .andExpect(status().isCreated());

        DevelopmentType type = developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("Cloud Migration").orElseThrow();
        EmployeeDevelopmentExperience experience = devExperienceRepository
                .findByEmployeeIdAndDevelopmentTypeIdAndProcessName("EMP920", type.getId(), "AWS Rehost")
                .orElseThrow();
        assertEquals(0, new BigDecimal("2.5").compareTo(experience.getYearsOfExperience()));
    }

    @Test
    @DisplayName("TC_SKILL_DEV_IMPORT_002 | POST bulk with one row referencing an unknown employee -> 404, entire batch rolled back including auto-created type")
    void importDevelopmentSkills_batchContainsUnknownEmployee_rollsBackEntireBatchAndLookupRows() throws Exception {
        createEmployee("EMP921", "Dev Employee Two", "dev.two@dat.com");

        mockMvc.perform(post("/api/skills/development/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "employeeId": "EMP921", "developmentTypeName": "Brand New Type", "processName": "Some Process", "yearsOfExperience": 1.0 },
                                  { "employeeId": "EMP_DOES_NOT_EXIST", "developmentTypeName": "Brand New Type", "processName": "Some Process", "yearsOfExperience": 1.0 }
                                ]
                                """))
                .andExpect(status().isNotFound());

        assertTrue(devExperienceRepository.findAll().isEmpty());
        // The lookup row created earlier in the same transaction must be rolled back too.
        assertTrue(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("Brand New Type").isEmpty());
    }

    @Test
    @DisplayName("TC_SKILL_DEV_IMPORT_003 | POST bulk where employee+type+process combination already exists -> 400, entire batch rolled back")
    void importDevelopmentSkills_batchContainsExistingCombination_rollsBackEntireBatch() throws Exception {
        Employee existing = createEmployee("EMP922", "Dev Employee Three", "dev.three@dat.com");
        DevelopmentType existingType = new DevelopmentType();
        existingType.setDevelopmentTypeName("Process Improvement");
        existingType.setIsActive(true);
        existingType = developmentTypeRepository.saveAndFlush(existingType);

        EmployeeDevelopmentExperience existingExperience = new EmployeeDevelopmentExperience();
        existingExperience.setEmployee(existing);
        existingExperience.setDevelopmentType(existingType);
        existingExperience.setProcessName("Kaizen");
        existingExperience.setYearsOfExperience(new BigDecimal("1.0"));
        devExperienceRepository.saveAndFlush(existingExperience);

        createEmployee("EMP923", "Dev Employee Four", "dev.four@dat.com");

        mockMvc.perform(post("/api/skills/development/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "employeeId": "EMP923", "developmentTypeName": "Process Improvement", "processName": "5S", "yearsOfExperience": 3.0 },
                                  { "employeeId": "EMP922", "developmentTypeName": "Process Improvement", "processName": "Kaizen", "yearsOfExperience": 4.0 }
                                ]
                                """))
                .andExpect(status().isBadRequest());

        assertTrue(devExperienceRepository.findByEmployeeId("EMP923").isEmpty());
        assertEquals(1, devExperienceRepository.count());
    }

    // ============================================ TECHNICAL SKILLS ============================================

    @Test
    @DisplayName("TC_SKILL_TECH_IMPORT_001 | POST bulk valid technical skills with brand-new skill/category -> auto-creates lookup rows and persists the skill")
    void importTechnicalSkills_validBulkPayloadWithNewSkill_createsLookupRowsAndPersistsSkill() throws Exception {
        createEmployee("EMP930", "Tech Employee One", "tech.one@dat.com");

        mockMvc.perform(post("/api/skills/technical/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "employeeId": "EMP930", "skillName": "Kubernetes", "categoryName": "Infrastructure", "subCategoryName": "Container Orchestration", "yearsOfExperience": 3.25, "experienceLevel": "Advanced" }
                                ]
                                """))
                .andExpect(status().isCreated());

        SkillCategory category = skillCategoryRepository.findByCategoryNameIgnoreCase("Infrastructure").orElseThrow();
        SkillSubCategory subCategory = skillSubCategoryRepository
                .findBySubCategoryNameIgnoreCaseAndCategoryId("Container Orchestration", category.getId())
                .orElseThrow();
        Skill skill = skillRepository.findBySkillNameIgnoreCaseAndSubCategoryId("Kubernetes", subCategory.getId())
                .orElseThrow();

        EmployeeSkill saved = employeeSkillRepository.findByEmployeeIdAndSkillId("EMP930", skill.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("3.25").compareTo(saved.getYearsOfExperience()));
        assertEquals("Advanced", saved.getExperienceLevel());
    }

    @Test
    @DisplayName("TC_SKILL_TECH_IMPORT_002 | POST bulk with one row referencing an unknown employee -> 404, entire batch rolled back including auto-created lookup rows")
    void importTechnicalSkills_batchContainsUnknownEmployee_rollsBackEntireBatchAndLookupRows() throws Exception {
        createEmployee("EMP931", "Tech Employee Two", "tech.two@dat.com");

        mockMvc.perform(post("/api/skills/technical/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "employeeId": "EMP931", "skillName": "Terraform", "categoryName": "Infrastructure", "subCategoryName": "IaC", "yearsOfExperience": 2.0, "experienceLevel": "Intermediate" },
                                  { "employeeId": "EMP_DOES_NOT_EXIST", "skillName": "Terraform", "categoryName": "Infrastructure", "subCategoryName": "IaC", "yearsOfExperience": 2.0, "experienceLevel": "Intermediate" }
                                ]
                                """))
                .andExpect(status().isNotFound());

        assertTrue(employeeSkillRepository.findAll().isEmpty());
        assertTrue(skillRepository.findBySkillNameIgnoreCase("Terraform").isEmpty());
        assertTrue(skillCategoryRepository.findByCategoryNameIgnoreCase("Infrastructure").isEmpty());
    }

    @Test
    @DisplayName("TC_SKILL_TECH_IMPORT_003 | POST bulk where employee already has the same skill/category/sub-category -> 400, entire batch rolled back")
    void importTechnicalSkills_batchContainsExistingSkill_rollsBackEntireBatch() throws Exception {
        Employee existing = createEmployee("EMP932", "Tech Employee Three", "tech.three@dat.com");

        SkillCategory category = new SkillCategory();
        category.setCategoryName("Programming");
        category.setIsActive(true);
        category = skillCategoryRepository.saveAndFlush(category);

        SkillSubCategory subCategory = new SkillSubCategory();
        subCategory.setCategory(category);
        subCategory.setSubCategoryName("Backend");
        subCategory.setIsActive(true);
        subCategory = skillSubCategoryRepository.saveAndFlush(subCategory);

        Skill skill = new Skill();
        skill.setSubCategory(subCategory);
        skill.setSkillName("Java");
        skill.setIsActive(true);
        skill = skillRepository.saveAndFlush(skill);

        EmployeeSkill existingSkill = new EmployeeSkill();
        existingSkill.setEmployee(existing);
        existingSkill.setSkill(skill);
        existingSkill.setYearsOfExperience(new BigDecimal("5.00"));
        existingSkill.setExperienceLevel("Expert");
        employeeSkillRepository.saveAndFlush(existingSkill);

        createEmployee("EMP933", "Tech Employee Four", "tech.four@dat.com");

        mockMvc.perform(post("/api/skills/technical/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "employeeId": "EMP933", "skillName": "Python", "categoryName": "Programming", "subCategoryName": "Backend", "yearsOfExperience": 1.50, "experienceLevel": "Beginner" },
                                  { "employeeId": "EMP932", "skillName": "Java", "categoryName": "Programming", "subCategoryName": "Backend", "yearsOfExperience": 6.00, "experienceLevel": "Expert" }
                                ]
                                """))
                .andExpect(status().isBadRequest());

        assertTrue(employeeSkillRepository.findByEmployeeId("EMP933").isEmpty());
        assertEquals(1, employeeSkillRepository.count());
    }
}