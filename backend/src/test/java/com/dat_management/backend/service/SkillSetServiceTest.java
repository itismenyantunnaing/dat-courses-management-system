package com.dat_management.backend.service;

import com.dat_management.backend.dto.skillset.DevelopmentSkillDto;
import com.dat_management.backend.dto.skillset.LanguageSkillDto;
import com.dat_management.backend.dto.skillset.ManagementSkillDto;
import com.dat_management.backend.entity.DevelopmentType;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeDevelopmentExperience;
import com.dat_management.backend.entity.EmployeeJapaneseProfile;
import com.dat_management.backend.entity.ManagementScore;
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
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// ─────────────────────────────────────────────────────────────────────────────
// Unit Tests for SkillSetService
//
// Zero prior coverage. This is the largest service in the codebase (36 public
// methods across four skill domains: Language, Management, Development, and
// Technical, plus employee-aggregate views) — the team's own
// skillset-regression-test-cases.md lists 31 cases against it, all marked
// "Planned" / not yet automated. Given the size, this class is being built up
// incrementally, one domain section at a time.
//
// This pass: LANGUAGE SKILLS, MANAGEMENT SKILLS, and DEVELOPMENT SKILLS
// (including the standalone createDevelopmentType / getAllActiveDevelopmentTypes
// admin methods, since they share the DevelopmentType entity and reuse logic).
//
// Behavioral findings worth the team's attention:
//
// 1. (see TC-SKILL-LANG-010) saveBulkLanguageSkills (and the equivalent bulk
//    methods for the other three domains) is @Transactional, but it catches
//    RuntimeException per item inside the loop and only throws the
//    aggregated error *after* the loop finishes. Against a mocked repository
//    the "successful" entries really do get saved before the throw. Against
//    a real database, Spring's default rollback-on-RuntimeException would
//    undo the whole transaction anyway — so a caller who gets an exception
//    back can't tell whether *nothing* was persisted (real DB) or whether
//    some rows silently went in before the failure (anything
//    non-transactional reading mid-batch). Worth confirming this is the
//    intended semantics for a bulk import.
//
// 2. (see TC-SKILL-MGMT-011) The four bulk-save methods don't even agree on
//    their own error text: saveBulkLanguageSkills and
//    saveBulkCategoriesWithSkills throw "Bulk operation failed: ...", while
//    saveBulkManagementSkills, saveBulkDevelopmentSkills, and
//    saveBulkTechnicalSkills throw "All bulk operations failed: ...". Cosmetic
//    on its own, but if the frontend ever pattern-matches on this message
//    (e.g. to show a specific banner), it will only catch two of the four.
//
// 3. (see TC-SKILL-DEV-009) updateDevelopmentSkill calls
//    getOrCreateDevelopmentType(...) BEFORE checking whether
//    dto.getId() actually refers to an existing experience. A failed update
//    with a bad id but a brand-new development type name still permanently
//    creates that DevelopmentType row before the "not found" exception is
//    thrown. Not a crash, but a real side effect from a call that ultimately
//    fails — worth deciding if that's acceptable.
//
// 4. (see TC-SKILL-DEV-005) getOrCreateDevelopmentType looks up the existing
//    type using the RAW, untrimmed name (findByDevelopmentTypeNameIgnoreCase)
//    but creates new types with the TRIMMED name. So a caller who accidentally
//    sends "  Frontend  " when "Frontend" already exists will miss the
//    existing row on lookup and attempt to insert "Frontend" again — which a
//    real database will reject via the entity's unique constraint on
//    developmentTypeName. This surfaces as an unhandled
//    DataIntegrityViolationException instead of the service's normal
//    RuntimeException-based error handling. Notably, the sibling method
//    createDevelopmentType (the standalone admin endpoint) gets this right —
//    it trims BEFORE checking existence — which suggests the untrimmed
//    lookup in getOrCreateDevelopmentType is an oversight, not a deliberate
//    difference between the two entry points.
// ─────────────────────────────────────────────────────────────────────────────

@ExtendWith(MockitoExtension.class)
class SkillSetServiceTest {

    @Mock private EmployeeRepository employeeRepository;
    @Mock private EmployeeJapaneseProfileRepository languageProfileRepository;
    @Mock private ManagementScoreRepository managementScoreRepository;
    @Mock private DevelopmentTypeRepository developmentTypeRepository;
    @Mock private EmployeeDevelopmentExperienceRepository devExperienceRepository;
    @Mock private SkillCategoryRepository categoryRepository;
    @Mock private SkillSubCategoryRepository subCategoryRepository;
    @Mock private SkillRepository skillRepository;
    @Mock private EmployeeSkillRepository employeeSkillRepository;

    private SkillSetService service;

    @BeforeEach
    void setUp() {
        service = new SkillSetService(
                employeeRepository,
                languageProfileRepository,
                managementScoreRepository,
                developmentTypeRepository,
                devExperienceRepository,
                categoryRepository,
                subCategoryRepository,
                skillRepository,
                employeeSkillRepository);
        // Echo back whatever profile is passed to save(), assigning an id if it doesn't
        // have one yet. Tests that need a specific saved instance returned unchanged
        // (e.g. update) override this with a more specific stub on that exact instance.
        lenient().when(languageProfileRepository.save(any(EmployeeJapaneseProfile.class))).thenAnswer(invocation -> {
            EmployeeJapaneseProfile profile = invocation.getArgument(0);
            if (profile.getId() == null) {
                profile.setId(100);
            }
            return profile;
        });
        // Same echo-back pattern for management scores.
        lenient().when(managementScoreRepository.save(any(ManagementScore.class))).thenAnswer(invocation -> {
            ManagementScore score = invocation.getArgument(0);
            if (score.getId() == null) {
                score.setId(200);
            }
            return score;
        });
        // Same echo-back pattern for development types and development experiences.
        lenient().when(developmentTypeRepository.save(any(DevelopmentType.class))).thenAnswer(invocation -> {
            DevelopmentType type = invocation.getArgument(0);
            if (type.getId() == null) {
                type.setId(300);
            }
            return type;
        });
        lenient().when(devExperienceRepository.save(any(EmployeeDevelopmentExperience.class))).thenAnswer(invocation -> {
            EmployeeDevelopmentExperience experience = invocation.getArgument(0);
            if (experience.getId() == null) {
                experience.setId(400);
            }
            return experience;
        });
    }

    // ── saveLanguageSkill ──────────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-LANG-001 | saveLanguageSkill | new employee, no existing profile → profile created and returned with generated id")
    void saveLanguageSkill_newEmployee_savesAndReturnsDto() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(languageProfileRepository.findByEmployeeId("EMP001")).thenReturn(Optional.empty());

        LanguageSkillDto result = service.saveLanguageSkill(buildLanguageSkillDto(null, "EMP001", (short) 3));

        assertThat(result.getId()).isEqualTo(100);
        assertThat(result.getEmployeeId()).isEqualTo("EMP001");
        assertThat(result.getLanguageSkillLevel()).isEqualTo((short) 3);
    }

    @Test
    @DisplayName("TC-SKILL-LANG-002 | saveLanguageSkill | employee does not exist → throws, nothing saved")
    void saveLanguageSkill_employeeNotFound_throwsAndDoesNotSave() {
        when(employeeRepository.findById("EMP999")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.saveLanguageSkill(buildLanguageSkillDto(null, "EMP999", (short) 3)));

        assertThat(ex.getMessage()).isEqualTo("Employee not found with id: EMP999");
        verify(languageProfileRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-SKILL-LANG-003 | saveLanguageSkill | employee already has a language profile → throws duplicate error, nothing saved")
    void saveLanguageSkill_profileAlreadyExists_throwsAndDoesNotSave() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(languageProfileRepository.findByEmployeeId("EMP001"))
                .thenReturn(Optional.of(buildLanguageProfile(1, employee, (short) 2)));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.saveLanguageSkill(buildLanguageSkillDto(null, "EMP001", (short) 3)));

        assertThat(ex.getMessage()).isEqualTo("Language profile already exists for employee: EMP001");
        verify(languageProfileRepository, never()).save(any());
    }

    // ── updateLanguageSkill ────────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-LANG-004 | updateLanguageSkill | existing profile → level updated on the same row")
    void updateLanguageSkill_existingProfile_updatesLevelAndReturnsDto() {
        Employee employee = buildEmployee("EMP001");
        EmployeeJapaneseProfile existing = buildLanguageProfile(1, employee, (short) 2);
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(languageProfileRepository.findByEmployeeId("EMP001")).thenReturn(Optional.of(existing));
        when(languageProfileRepository.save(existing)).thenReturn(existing);

        LanguageSkillDto result = service.updateLanguageSkill(buildLanguageSkillDto(1, "EMP001", (short) 4));

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getLanguageSkillLevel()).isEqualTo((short) 4);
        assertThat(existing.getLanguageSkillLevel()).isEqualTo((short) 4);
        verify(languageProfileRepository).save(existing);
    }

    @Test
    @DisplayName("TC-SKILL-LANG-005 | updateLanguageSkill | employee does not exist → throws, nothing saved")
    void updateLanguageSkill_employeeNotFound_throwsAndDoesNotSave() {
        when(employeeRepository.findById("EMP999")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.updateLanguageSkill(buildLanguageSkillDto(1, "EMP999", (short) 4)));

        assertThat(ex.getMessage()).isEqualTo("Employee not found with id: EMP999");
        verify(languageProfileRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-SKILL-LANG-006 | updateLanguageSkill | employee has no language profile yet → throws, nothing saved")
    void updateLanguageSkill_profileNotFound_throwsAndDoesNotSave() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(languageProfileRepository.findByEmployeeId("EMP001")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.updateLanguageSkill(buildLanguageSkillDto(1, "EMP001", (short) 4)));

        assertThat(ex.getMessage()).isEqualTo("Language profile not found for employee: EMP001");
        verify(languageProfileRepository, never()).save(any());
    }

    // ── deleteLanguageSkill ────────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-LANG-007 | deleteLanguageSkill | existing profile → deleted")
    void deleteLanguageSkill_existingProfile_deletesProfile() {
        Employee employee = buildEmployee("EMP001");
        EmployeeJapaneseProfile existing = buildLanguageProfile(1, employee, (short) 2);
        when(languageProfileRepository.findById(1)).thenReturn(Optional.of(existing));

        service.deleteLanguageSkill(1);

        verify(languageProfileRepository).delete(existing);
    }

    @Test
    @DisplayName("TC-SKILL-LANG-008 | deleteLanguageSkill | id does not exist → throws, nothing deleted")
    void deleteLanguageSkill_notFound_throwsAndDoesNotDelete() {
        when(languageProfileRepository.findById(999)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.deleteLanguageSkill(999));

        assertThat(ex.getMessage()).isEqualTo("Language profile not found with id: 999");
        verify(languageProfileRepository, never()).delete(any());
    }

    // ── saveBulkLanguageSkills ─────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-LANG-009 | saveBulkLanguageSkills | every entry valid → all saved")
    void saveBulkLanguageSkills_allValid_savesEveryEntry() {
        Employee emp1 = buildEmployee("EMP001");
        Employee emp2 = buildEmployee("EMP002");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(emp1));
        when(employeeRepository.findById("EMP002")).thenReturn(Optional.of(emp2));
        when(languageProfileRepository.findByEmployeeId("EMP001")).thenReturn(Optional.empty());
        when(languageProfileRepository.findByEmployeeId("EMP002")).thenReturn(Optional.empty());

        List<LanguageSkillDto> result = service.saveBulkLanguageSkills(List.of(
                buildLanguageSkillDto(null, "EMP001", (short) 3),
                buildLanguageSkillDto(null, "EMP002", (short) 4)));

        assertThat(result).hasSize(2);
        verify(languageProfileRepository, times(2)).save(any(EmployeeJapaneseProfile.class));
    }

    @Test
    @DisplayName("TC-SKILL-LANG-010 | saveBulkLanguageSkills | one entry fails → valid entries are still saved, then an aggregated error is thrown "
            + "(BEHAVIORAL NOTE: see class-level banner — partial saves happen before the throw)")
    void saveBulkLanguageSkills_oneEntryFails_savesValidOnesThenThrowsAggregatedError() {
        Employee emp1 = buildEmployee("EMP001");
        Employee emp2 = buildEmployee("EMP002");
        EmployeeJapaneseProfile existingForEmp2 = buildLanguageProfile(5, emp2, (short) 1);
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(emp1));
        when(employeeRepository.findById("EMP002")).thenReturn(Optional.of(emp2));
        when(languageProfileRepository.findByEmployeeId("EMP001")).thenReturn(Optional.empty());
        when(languageProfileRepository.findByEmployeeId("EMP002")).thenReturn(Optional.of(existingForEmp2));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.saveBulkLanguageSkills(List.of(
                buildLanguageSkillDto(null, "EMP001", (short) 3),
                buildLanguageSkillDto(null, "EMP002", (short) 4))));

        assertThat(ex.getMessage()).contains("Bulk operation failed").contains("EMP002");
        verify(languageProfileRepository, times(1)).save(any(EmployeeJapaneseProfile.class));
    }

    // ── getLanguageSkill (by employeeId) ───────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-LANG-011 | getLanguageSkill | profile exists → returns mapped dto")
    void getLanguageSkill_existingProfile_returnsDto() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(languageProfileRepository.findByEmployeeId("EMP001"))
                .thenReturn(Optional.of(buildLanguageProfile(1, employee, (short) 3)));

        LanguageSkillDto result = service.getLanguageSkill("EMP001");

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getEmployeeId()).isEqualTo("EMP001");
        assertThat(result.getLanguageSkillLevel()).isEqualTo((short) 3);
    }

    @Test
    @DisplayName("TC-SKILL-LANG-012 | getLanguageSkill | employee does not exist → throws")
    void getLanguageSkill_employeeNotFound_throws() {
        when(employeeRepository.findById("EMP999")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.getLanguageSkill("EMP999"));

        assertThat(ex.getMessage()).isEqualTo("Employee not found with id: EMP999");
    }

    @Test
    @DisplayName("TC-SKILL-LANG-013 | getLanguageSkill | employee exists but has no language profile → throws")
    void getLanguageSkill_profileNotFound_throws() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(languageProfileRepository.findByEmployeeId("EMP001")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.getLanguageSkill("EMP001"));

        assertThat(ex.getMessage()).isEqualTo("Language profile not found for employee: EMP001");
    }

    // ── getAllLanguageSkills ───────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-LANG-014 | getAllLanguageSkills | profiles exist → returns full mapped list")
    void getAllLanguageSkills_returnsMappedList() {
        Employee emp1 = buildEmployee("EMP001");
        Employee emp2 = buildEmployee("EMP002");
        when(languageProfileRepository.findAll()).thenReturn(List.of(
                buildLanguageProfile(1, emp1, (short) 3),
                buildLanguageProfile(2, emp2, (short) 5)));

        List<LanguageSkillDto> result = service.getAllLanguageSkills();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getEmployeeId()).isEqualTo("EMP001");
        assertThat(result.get(1).getEmployeeId()).isEqualTo("EMP002");
    }

    @Test
    @DisplayName("TC-SKILL-LANG-015 | getAllLanguageSkills | no profiles → returns empty list")
    void getAllLanguageSkills_noProfiles_returnsEmptyList() {
        when(languageProfileRepository.findAll()).thenReturn(List.of());

        assertThat(service.getAllLanguageSkills()).isEmpty();
    }

    // ── getLanguageSkillById ───────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-LANG-016 | getLanguageSkillById | profile exists → returns mapped dto")
    void getLanguageSkillById_existingProfile_returnsDto() {
        Employee employee = buildEmployee("EMP001");
        when(languageProfileRepository.findById(1)).thenReturn(Optional.of(buildLanguageProfile(1, employee, (short) 3)));

        LanguageSkillDto result = service.getLanguageSkillById(1);

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getEmployeeId()).isEqualTo("EMP001");
        assertThat(result.getLanguageSkillLevel()).isEqualTo((short) 3);
    }

    @Test
    @DisplayName("TC-SKILL-LANG-017 | getLanguageSkillById | id does not exist → throws")
    void getLanguageSkillById_notFound_throws() {
        when(languageProfileRepository.findById(999)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.getLanguageSkillById(999));

        assertThat(ex.getMessage()).isEqualTo("Language profile not found with id: 999");
    }

    // ── saveManagementSkill ────────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-MGMT-001 | saveManagementSkill | new employee, no existing score → score saved with server-calculated totalLevel")
    void saveManagementSkill_newEmployee_savesAndReturnsDtoWithCalculatedTotalLevel() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(managementScoreRepository.findByEmployeeId("EMP001")).thenReturn(Optional.empty());

        // qcd=2, reportConsult=2, education=2 → sum=6 → totalLevel 2 (">=5" bracket)
        ManagementSkillDto result = service.saveManagementSkill(
                buildManagementSkillDto(null, "EMP001", (short) 3, (short) 2, (short) 2, (short) 2, null));

        assertThat(result.getId()).isEqualTo(200);
        assertThat(result.getEmployeeId()).isEqualTo("EMP001");
        assertThat(result.getTotalLevel()).isEqualTo((short) 2);
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-002 | saveManagementSkill | employee does not exist → throws, nothing saved")
    void saveManagementSkill_employeeNotFound_throwsAndDoesNotSave() {
        when(employeeRepository.findById("EMP999")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.saveManagementSkill(
                buildManagementSkillDto(null, "EMP999", (short) 3, (short) 2, (short) 2, (short) 2, null)));

        assertThat(ex.getMessage()).isEqualTo("Employee not found with id: EMP999");
        verify(managementScoreRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-003 | saveManagementSkill | employee already has a management score → throws duplicate error, nothing saved")
    void saveManagementSkill_scoreAlreadyExists_throwsAndDoesNotSave() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(managementScoreRepository.findByEmployeeId("EMP001"))
                .thenReturn(Optional.of(buildManagementScore(1, employee, (short) 2, (short) 2, (short) 2, (short) 2, (short) 2)));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.saveManagementSkill(
                buildManagementSkillDto(null, "EMP001", (short) 3, (short) 2, (short) 2, (short) 2, null)));

        assertThat(ex.getMessage()).isEqualTo("Management score already exists for employee: EMP001");
        verify(managementScoreRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-004 | saveManagementSkill | caller supplies a totalLevel → ignored, server always derives it from the component scores")
    void saveManagementSkill_clientSuppliedTotalLevel_isIgnoredAndRecalculated() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(managementScoreRepository.findByEmployeeId("EMP001")).thenReturn(Optional.empty());

        // Caller claims totalLevel=5, but qcd=0,reportConsult=0,education=0 → sum=0 → real totalLevel is 0.
        ManagementSkillDto result = service.saveManagementSkill(
                buildManagementSkillDto(null, "EMP001", (short) 0, (short) 0, (short) 0, (short) 0, (short) 5));

        assertThat(result.getTotalLevel()).isEqualTo((short) 0);
    }

    // ── updateManagementSkill ──────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-MGMT-005 | updateManagementSkill | existing score → fields and totalLevel recalculated on the same row")
    void updateManagementSkill_existingScore_updatesFieldsAndRecalculatesTotalLevel() {
        Employee employee = buildEmployee("EMP001");
        ManagementScore existing = buildManagementScore(1, employee, (short) 1, (short) 1, (short) 1, (short) 1, (short) 1);
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(managementScoreRepository.findByEmployeeId("EMP001")).thenReturn(Optional.of(existing));
        when(managementScoreRepository.save(existing)).thenReturn(existing);

        // qcd=4, reportConsult=4, education=4 → sum=12 → totalLevel 5 (max)
        ManagementSkillDto result = service.updateManagementSkill(
                buildManagementSkillDto(1, "EMP001", (short) 5, (short) 4, (short) 4, (short) 4, null));

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getTotalLevel()).isEqualTo((short) 5);
        assertThat(existing.getQcdScore()).isEqualTo((short) 4);
        assertThat(existing.getTotalLevel()).isEqualTo((short) 5);
        verify(managementScoreRepository).save(existing);
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-006 | updateManagementSkill | employee does not exist → throws, nothing saved")
    void updateManagementSkill_employeeNotFound_throwsAndDoesNotSave() {
        when(employeeRepository.findById("EMP999")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.updateManagementSkill(
                buildManagementSkillDto(1, "EMP999", (short) 3, (short) 2, (short) 2, (short) 2, null)));

        assertThat(ex.getMessage()).isEqualTo("Employee not found with id: EMP999");
        verify(managementScoreRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-007 | updateManagementSkill | employee has no management score yet → throws, nothing saved")
    void updateManagementSkill_scoreNotFound_throwsAndDoesNotSave() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(managementScoreRepository.findByEmployeeId("EMP001")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.updateManagementSkill(
                buildManagementSkillDto(1, "EMP001", (short) 3, (short) 2, (short) 2, (short) 2, null)));

        assertThat(ex.getMessage()).isEqualTo("Management score not found for employee: EMP001");
        verify(managementScoreRepository, never()).save(any());
    }

    // ── deleteManagementSkill ──────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-MGMT-008 | deleteManagementSkill | existing score → deleted")
    void deleteManagementSkill_existingScore_deletesScore() {
        Employee employee = buildEmployee("EMP001");
        ManagementScore existing = buildManagementScore(1, employee, (short) 2, (short) 2, (short) 2, (short) 2, (short) 2);
        when(managementScoreRepository.findById(1)).thenReturn(Optional.of(existing));

        service.deleteManagementSkill(1);

        verify(managementScoreRepository).delete(existing);
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-009 | deleteManagementSkill | id does not exist → throws, nothing deleted")
    void deleteManagementSkill_notFound_throwsAndDoesNotDelete() {
        when(managementScoreRepository.findById(999)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.deleteManagementSkill(999));

        assertThat(ex.getMessage()).isEqualTo("Management score not found with id: 999");
        verify(managementScoreRepository, never()).delete(any());
    }

    // ── saveBulkManagementSkills ───────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-MGMT-010 | saveBulkManagementSkills | every entry valid → all saved")
    void saveBulkManagementSkills_allValid_savesEveryEntry() {
        Employee emp1 = buildEmployee("EMP001");
        Employee emp2 = buildEmployee("EMP002");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(emp1));
        when(employeeRepository.findById("EMP002")).thenReturn(Optional.of(emp2));
        when(managementScoreRepository.findByEmployeeId("EMP001")).thenReturn(Optional.empty());
        when(managementScoreRepository.findByEmployeeId("EMP002")).thenReturn(Optional.empty());

        List<ManagementSkillDto> result = service.saveBulkManagementSkills(List.of(
                buildManagementSkillDto(null, "EMP001", (short) 3, (short) 2, (short) 2, (short) 2, null),
                buildManagementSkillDto(null, "EMP002", (short) 3, (short) 2, (short) 2, (short) 2, null)));

        assertThat(result).hasSize(2);
        verify(managementScoreRepository, times(2)).save(any(ManagementScore.class));
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-011 | saveBulkManagementSkills | one entry fails → valid entries still saved, then \"All bulk operations failed\" is thrown "
            + "(BEHAVIORAL NOTE: see class-level banner finding #2 — wording differs from the language domain's \"Bulk operation failed\")")
    void saveBulkManagementSkills_oneEntryFails_savesValidOnesThenThrowsAggregatedError() {
        Employee emp1 = buildEmployee("EMP001");
        Employee emp2 = buildEmployee("EMP002");
        ManagementScore existingForEmp2 = buildManagementScore(5, emp2, (short) 1, (short) 1, (short) 1, (short) 1, (short) 1);
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(emp1));
        when(employeeRepository.findById("EMP002")).thenReturn(Optional.of(emp2));
        when(managementScoreRepository.findByEmployeeId("EMP001")).thenReturn(Optional.empty());
        when(managementScoreRepository.findByEmployeeId("EMP002")).thenReturn(Optional.of(existingForEmp2));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.saveBulkManagementSkills(List.of(
                buildManagementSkillDto(null, "EMP001", (short) 3, (short) 2, (short) 2, (short) 2, null),
                buildManagementSkillDto(null, "EMP002", (short) 3, (short) 2, (short) 2, (short) 2, null))));

        assertThat(ex.getMessage()).contains("All bulk operations failed").contains("EMP002");
        verify(managementScoreRepository, times(1)).save(any(ManagementScore.class));
    }

    // ── getManagementSkill (by employeeId) ─────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-MGMT-012 | getManagementSkill | score exists → returns mapped dto")
    void getManagementSkill_existingScore_returnsDto() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(managementScoreRepository.findByEmployeeId("EMP001"))
                .thenReturn(Optional.of(buildManagementScore(1, employee, (short) 2, (short) 2, (short) 2, (short) 2, (short) 2)));

        ManagementSkillDto result = service.getManagementSkill("EMP001");

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getTotalLevel()).isEqualTo((short) 2);
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-013 | getManagementSkill | employee does not exist → throws")
    void getManagementSkill_employeeNotFound_throws() {
        when(employeeRepository.findById("EMP999")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.getManagementSkill("EMP999"));

        assertThat(ex.getMessage()).isEqualTo("Employee not found with id: EMP999");
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-014 | getManagementSkill | employee exists but has no management score → throws")
    void getManagementSkill_scoreNotFound_throws() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(managementScoreRepository.findByEmployeeId("EMP001")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.getManagementSkill("EMP001"));

        assertThat(ex.getMessage()).isEqualTo("Management score not found for employee: EMP001");
    }

    // ── getAllManagementSkills ─────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-MGMT-015 | getAllManagementSkills | scores exist → returns full mapped list")
    void getAllManagementSkills_returnsMappedList() {
        Employee emp1 = buildEmployee("EMP001");
        Employee emp2 = buildEmployee("EMP002");
        when(managementScoreRepository.findAll()).thenReturn(List.of(
                buildManagementScore(1, emp1, (short) 2, (short) 2, (short) 2, (short) 2, (short) 2),
                buildManagementScore(2, emp2, (short) 4, (short) 4, (short) 4, (short) 4, (short) 5)));

        List<ManagementSkillDto> result = service.getAllManagementSkills();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getEmployeeId()).isEqualTo("EMP001");
        assertThat(result.get(1).getEmployeeId()).isEqualTo("EMP002");
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-016 | getAllManagementSkills | no scores → returns empty list")
    void getAllManagementSkills_noScores_returnsEmptyList() {
        when(managementScoreRepository.findAll()).thenReturn(List.of());

        assertThat(service.getAllManagementSkills()).isEmpty();
    }

    // ── getManagementSkillById ─────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-MGMT-017 | getManagementSkillById | score exists → returns mapped dto")
    void getManagementSkillById_existingScore_returnsDto() {
        Employee employee = buildEmployee("EMP001");
        when(managementScoreRepository.findById(1))
                .thenReturn(Optional.of(buildManagementScore(1, employee, (short) 2, (short) 2, (short) 2, (short) 2, (short) 2)));

        ManagementSkillDto result = service.getManagementSkillById(1);

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getEmployeeId()).isEqualTo("EMP001");
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-018 | getManagementSkillById | id does not exist → throws")
    void getManagementSkillById_notFound_throws() {
        when(managementScoreRepository.findById(999)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.getManagementSkillById(999));

        assertThat(ex.getMessage()).isEqualTo("Management score not found with id: 999");
    }

    // ── calculateTotalLevel (private — exercised through saveManagementSkill) ──
    // Directly maps to TC-SKILL-REG-006 in skillset-regression-test-cases.md,
    // which calls out these exact boundary sums: 0, 3, 5, 7, 9, 11.

    @Test
    @DisplayName("TC-SKILL-MGMT-019 | calculateTotalLevel | sum=2 (just below the first threshold) → level 0")
    void calculateTotalLevel_sumTwo_isLevelZero() {
        assertThat(saveWithScores((short) 1, (short) 1, (short) 0).getTotalLevel()).isEqualTo((short) 0);
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-020 | calculateTotalLevel | sum=3 (lower boundary) → level 1")
    void calculateTotalLevel_sumThree_isLevelOne() {
        assertThat(saveWithScores((short) 1, (short) 1, (short) 1).getTotalLevel()).isEqualTo((short) 1);
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-021 | calculateTotalLevel | sum=5 (lower boundary) → level 2")
    void calculateTotalLevel_sumFive_isLevelTwo() {
        assertThat(saveWithScores((short) 2, (short) 2, (short) 1).getTotalLevel()).isEqualTo((short) 2);
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-022 | calculateTotalLevel | sum=7 (lower boundary) → level 3")
    void calculateTotalLevel_sumSeven_isLevelThree() {
        assertThat(saveWithScores((short) 3, (short) 2, (short) 2).getTotalLevel()).isEqualTo((short) 3);
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-023 | calculateTotalLevel | sum=9 (lower boundary) → level 4")
    void calculateTotalLevel_sumNine_isLevelFour() {
        assertThat(saveWithScores((short) 3, (short) 3, (short) 3).getTotalLevel()).isEqualTo((short) 4);
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-024 | calculateTotalLevel | sum=11 (lower boundary) → level 5")
    void calculateTotalLevel_sumEleven_isLevelFive() {
        assertThat(saveWithScores((short) 4, (short) 4, (short) 3).getTotalLevel()).isEqualTo((short) 5);
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-025 | calculateTotalLevel | sum=12 (max possible: 4+4+4) → still level 5, no overflow beyond the top bracket")
    void calculateTotalLevel_maxSum_isLevelFiveWithNoOverflow() {
        assertThat(saveWithScores((short) 4, (short) 4, (short) 4).getTotalLevel()).isEqualTo((short) 5);
    }

    @Test
    @DisplayName("TC-SKILL-MGMT-026 | calculateTotalLevel | qcd/reportConsult/education left null → treated as 0 in the sum, not an NPE")
    void calculateTotalLevel_nullComponentScores_treatedAsZero() {
        assertThat(saveWithScores(null, null, null).getTotalLevel()).isEqualTo((short) 0);
    }

    // ── saveDevelopmentSkill ───────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-DEV-001 | saveDevelopmentSkill | new employee, brand-new development type name → type created, experience saved")
    void saveDevelopmentSkill_newEmployeeAndNewType_createsTypeAndSavesExperience() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("Backend")).thenReturn(Optional.empty());
        when(devExperienceRepository.findByEmployeeIdAndDevelopmentTypeIdAndProcessName("EMP001", 300, "Checkout API"))
                .thenReturn(Optional.empty());

        DevelopmentSkillDto result = service.saveDevelopmentSkill(
                buildDevelopmentSkillDto(null, "EMP001", "Backend", "Checkout API", new BigDecimal("2.5")));

        assertThat(result.getId()).isEqualTo(400);
        assertThat(result.getEmployeeId()).isEqualTo("EMP001");
        assertThat(result.getDevelopmentTypeName()).isEqualTo("Backend");
        verify(developmentTypeRepository).save(any(DevelopmentType.class));
    }

    @Test
    @DisplayName("TC-SKILL-DEV-002 | saveDevelopmentSkill | employee does not exist → throws, nothing saved")
    void saveDevelopmentSkill_employeeNotFound_throwsAndDoesNotSave() {
        when(employeeRepository.findById("EMP999")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.saveDevelopmentSkill(
                buildDevelopmentSkillDto(null, "EMP999", "Backend", "Checkout API", new BigDecimal("2.5"))));

        assertThat(ex.getMessage()).isEqualTo("Employee not found with id: EMP999");
        verify(devExperienceRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-SKILL-DEV-003 | saveDevelopmentSkill | development type name matches an existing type case-insensitively → reused, no new type row created")
    void saveDevelopmentSkill_typeMatchesExistingCaseInsensitively_reusesType() {
        Employee employee = buildEmployee("EMP001");
        DevelopmentType existingType = buildDevelopmentType(10, "Backend", true);
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("backend")).thenReturn(Optional.of(existingType));
        when(devExperienceRepository.findByEmployeeIdAndDevelopmentTypeIdAndProcessName("EMP001", 10, "API"))
                .thenReturn(Optional.empty());

        DevelopmentSkillDto result = service.saveDevelopmentSkill(
                buildDevelopmentSkillDto(null, "EMP001", "backend", "API", new BigDecimal("1.0")));

        assertThat(result.getDevelopmentTypeName()).isEqualTo("backend");
        verify(developmentTypeRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-SKILL-DEV-004 | saveDevelopmentSkill | employee+type+process combo already exists → throws duplicate, nothing saved")
    void saveDevelopmentSkill_duplicateExperience_throwsAndDoesNotSave() {
        Employee employee = buildEmployee("EMP001");
        DevelopmentType existingType = buildDevelopmentType(10, "Backend", true);
        EmployeeDevelopmentExperience existingExperience = buildDevelopmentExperience(99, employee, existingType, "API", new BigDecimal("1.0"));
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("Backend")).thenReturn(Optional.of(existingType));
        when(devExperienceRepository.findByEmployeeIdAndDevelopmentTypeIdAndProcessName("EMP001", 10, "API"))
                .thenReturn(Optional.of(existingExperience));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.saveDevelopmentSkill(
                buildDevelopmentSkillDto(null, "EMP001", "Backend", "API", new BigDecimal("2.0"))));

        assertThat(ex.getMessage()).isEqualTo(
                "Development experience already exists for employee: EMP001 with development type: Backend and process: API");
        verify(devExperienceRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-SKILL-DEV-005 | saveDevelopmentSkill | type name has surrounding whitespace and a trimmed-equivalent type already exists → "
            + "lookup misses it (untrimmed) and creation collides with the DB's unique constraint (BEHAVIORAL NOTE: see class banner finding #4)")
    void saveDevelopmentSkill_typeNameHasWhitespace_lookupMissesTrimmedDuplicateAndCollidesOnSave() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        // "Frontend" (no padding) already exists in the DB, but the case-insensitive
        // lookup is never trimmed, so a padded input misses it entirely.
        when(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("  Frontend  ")).thenReturn(Optional.empty());
        // Creation DOES trim before saving, so it attempts to insert "Frontend" again -
        // a real database would reject this via the unique constraint on the column.
        when(developmentTypeRepository.save(any(DevelopmentType.class)))
                .thenThrow(new DataIntegrityViolationException("Duplicate entry 'Frontend' for key 'development_type_name'"));

        assertThrows(DataIntegrityViolationException.class, () -> service.saveDevelopmentSkill(
                buildDevelopmentSkillDto(null, "EMP001", "  Frontend  ", "UI Work", null)));
    }

    // ── updateDevelopmentSkill ─────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-DEV-006 | updateDevelopmentSkill | happy path, uniqueness key unchanged → fields updated on the same row "
            + "(also proves the duplicate-check correctly recognizes the record finding itself)")
    void updateDevelopmentSkill_keyUnchanged_updatesFieldsInPlace() {
        Employee employee = buildEmployee("EMP001");
        DevelopmentType existingType = buildDevelopmentType(10, "Backend", true);
        EmployeeDevelopmentExperience existing = buildDevelopmentExperience(5, employee, existingType, "API", new BigDecimal("2.0"));
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("Backend")).thenReturn(Optional.of(existingType));
        when(devExperienceRepository.findById(5)).thenReturn(Optional.of(existing));
        when(devExperienceRepository.findByEmployeeIdAndDevelopmentTypeIdAndProcessName("EMP001", 10, "API"))
                .thenReturn(Optional.of(existing));

        DevelopmentSkillDto result = service.updateDevelopmentSkill(
                buildDevelopmentSkillDto(5, "EMP001", "Backend", "API", new BigDecimal("3.5")));

        assertThat(result.getId()).isEqualTo(5);
        assertThat(existing.getYearsOfExperience()).isEqualByComparingTo("3.5");
        verify(devExperienceRepository).save(existing);
    }

    @Test
    @DisplayName("TC-SKILL-DEV-007 | updateDevelopmentSkill | employee does not exist → throws, nothing saved")
    void updateDevelopmentSkill_employeeNotFound_throwsAndDoesNotSave() {
        when(employeeRepository.findById("EMP999")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.updateDevelopmentSkill(
                buildDevelopmentSkillDto(5, "EMP999", "Backend", "API", new BigDecimal("3.5"))));

        assertThat(ex.getMessage()).isEqualTo("Employee not found with id: EMP999");
        verify(devExperienceRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-SKILL-DEV-008 | updateDevelopmentSkill | experience id does not exist, type name already exists → throws, no side effect")
    void updateDevelopmentSkill_idNotFoundWithExistingTypeName_throwsWithNoSideEffect() {
        Employee employee = buildEmployee("EMP001");
        DevelopmentType existingType = buildDevelopmentType(10, "Backend", true);
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("Backend")).thenReturn(Optional.of(existingType));
        when(devExperienceRepository.findById(999)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.updateDevelopmentSkill(
                buildDevelopmentSkillDto(999, "EMP001", "Backend", "API", new BigDecimal("1.0"))));

        assertThat(ex.getMessage()).isEqualTo("Development experience not found with id: 999");
        verify(developmentTypeRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-SKILL-DEV-009 | updateDevelopmentSkill | experience id does not exist AND type name is new → the type is still created before "
            + "the not-found error is thrown (BEHAVIORAL NOTE: see class banner finding #3)")
    void updateDevelopmentSkill_idNotFoundWithNewTypeName_stillCreatesTypeBeforeThrowing() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("BrandNewType")).thenReturn(Optional.empty());
        when(devExperienceRepository.findById(999)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.updateDevelopmentSkill(
                buildDevelopmentSkillDto(999, "EMP001", "BrandNewType", "API", new BigDecimal("1.0"))));

        assertThat(ex.getMessage()).isEqualTo("Development experience not found with id: 999");
        // The type row was already persisted before the failure was even discovered.
        verify(developmentTypeRepository).save(any(DevelopmentType.class));
    }

    @Test
    @DisplayName("TC-SKILL-DEV-010 | updateDevelopmentSkill | renaming to a combo that belongs to a DIFFERENT existing experience → throws duplicate")
    void updateDevelopmentSkill_renameCollidesWithDifferentExperience_throws() {
        Employee employee = buildEmployee("EMP001");
        DevelopmentType oldType = buildDevelopmentType(10, "Backend", true);
        DevelopmentType newType = buildDevelopmentType(20, "Frontend", true);
        EmployeeDevelopmentExperience beingEdited = buildDevelopmentExperience(5, employee, oldType, "API", new BigDecimal("2.0"));
        EmployeeDevelopmentExperience conflicting = buildDevelopmentExperience(77, employee, newType, "API", new BigDecimal("1.0"));
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("Frontend")).thenReturn(Optional.of(newType));
        when(devExperienceRepository.findById(5)).thenReturn(Optional.of(beingEdited));
        when(devExperienceRepository.findByEmployeeIdAndDevelopmentTypeIdAndProcessName("EMP001", 20, "API"))
                .thenReturn(Optional.of(conflicting));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.updateDevelopmentSkill(
                buildDevelopmentSkillDto(5, "EMP001", "Frontend", "API", new BigDecimal("2.0"))));

        assertThat(ex.getMessage()).isEqualTo(
                "Development experience already exists for employee: EMP001 with development type: Frontend and process: API");
        verify(devExperienceRepository, never()).save(any());
    }

    // ── deleteDevelopmentSkill ─────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-DEV-011 | deleteDevelopmentSkill | existing experience → deleted")
    void deleteDevelopmentSkill_existingExperience_deletesExperience() {
        Employee employee = buildEmployee("EMP001");
        DevelopmentType type = buildDevelopmentType(10, "Backend", true);
        EmployeeDevelopmentExperience existing = buildDevelopmentExperience(5, employee, type, "API", new BigDecimal("2.0"));
        when(devExperienceRepository.findById(5)).thenReturn(Optional.of(existing));

        service.deleteDevelopmentSkill(5);

        verify(devExperienceRepository).delete(existing);
    }

    @Test
    @DisplayName("TC-SKILL-DEV-012 | deleteDevelopmentSkill | id does not exist → throws, nothing deleted")
    void deleteDevelopmentSkill_notFound_throwsAndDoesNotDelete() {
        when(devExperienceRepository.findById(999)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.deleteDevelopmentSkill(999));

        assertThat(ex.getMessage()).isEqualTo("Development experience not found with id: 999");
        verify(devExperienceRepository, never()).delete(any());
    }

    // ── saveBulkDevelopmentSkills ──────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-DEV-013 | saveBulkDevelopmentSkills | every entry valid → all saved")
    void saveBulkDevelopmentSkills_allValid_savesEveryEntry() {
        Employee emp1 = buildEmployee("EMP001");
        Employee emp2 = buildEmployee("EMP002");
        DevelopmentType type = buildDevelopmentType(10, "Backend", true);
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(emp1));
        when(employeeRepository.findById("EMP002")).thenReturn(Optional.of(emp2));
        when(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("Backend")).thenReturn(Optional.of(type));
        when(devExperienceRepository.findByEmployeeIdAndDevelopmentTypeIdAndProcessName("EMP001", 10, "API-Design"))
                .thenReturn(Optional.empty());
        when(devExperienceRepository.findByEmployeeIdAndDevelopmentTypeIdAndProcessName("EMP002", 10, "Testing"))
                .thenReturn(Optional.empty());

        List<DevelopmentSkillDto> result = service.saveBulkDevelopmentSkills(List.of(
                buildDevelopmentSkillDto(null, "EMP001", "Backend", "API-Design", new BigDecimal("1.0")),
                buildDevelopmentSkillDto(null, "EMP002", "Backend", "Testing", new BigDecimal("2.0"))));

        assertThat(result).hasSize(2);
        verify(devExperienceRepository, times(2)).save(any(EmployeeDevelopmentExperience.class));
    }

    @Test
    @DisplayName("TC-SKILL-DEV-014 | saveBulkDevelopmentSkills | one entry fails → valid entries still saved, then an aggregated error is thrown")
    void saveBulkDevelopmentSkills_oneEntryFails_savesValidOnesThenThrowsAggregatedError() {
        Employee emp1 = buildEmployee("EMP001");
        Employee emp2 = buildEmployee("EMP002");
        DevelopmentType type = buildDevelopmentType(10, "Backend", true);
        EmployeeDevelopmentExperience conflicting = buildDevelopmentExperience(50, emp2, type, "API-Design", new BigDecimal("1.0"));
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(emp1));
        when(employeeRepository.findById("EMP002")).thenReturn(Optional.of(emp2));
        when(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("Backend")).thenReturn(Optional.of(type));
        when(devExperienceRepository.findByEmployeeIdAndDevelopmentTypeIdAndProcessName("EMP001", 10, "API-Design"))
                .thenReturn(Optional.empty());
        when(devExperienceRepository.findByEmployeeIdAndDevelopmentTypeIdAndProcessName("EMP002", 10, "API-Design"))
                .thenReturn(Optional.of(conflicting));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.saveBulkDevelopmentSkills(List.of(
                buildDevelopmentSkillDto(null, "EMP001", "Backend", "API-Design", new BigDecimal("1.0")),
                buildDevelopmentSkillDto(null, "EMP002", "Backend", "API-Design", new BigDecimal("2.0")))));

        assertThat(ex.getMessage()).contains("All bulk operations failed").contains("EMP002");
        verify(devExperienceRepository, times(1)).save(any(EmployeeDevelopmentExperience.class));
    }

    // ── getDevelopmentSkillsByEmployee ─────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-DEV-015 | getDevelopmentSkillsByEmployee | employee has experiences → returns mapped list")
    void getDevelopmentSkillsByEmployee_hasExperiences_returnsMappedList() {
        Employee employee = buildEmployee("EMP001");
        DevelopmentType type = buildDevelopmentType(10, "Backend", true);
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(devExperienceRepository.findByEmployeeId("EMP001")).thenReturn(List.of(
                buildDevelopmentExperience(1, employee, type, "API", new BigDecimal("1.0")),
                buildDevelopmentExperience(2, employee, type, "Testing", new BigDecimal("2.0"))));

        List<DevelopmentSkillDto> result = service.getDevelopmentSkillsByEmployee("EMP001");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getProcessName()).isEqualTo("API");
        assertThat(result.get(1).getProcessName()).isEqualTo("Testing");
    }

    @Test
    @DisplayName("TC-SKILL-DEV-016 | getDevelopmentSkillsByEmployee | employee does not exist → throws")
    void getDevelopmentSkillsByEmployee_employeeNotFound_throws() {
        when(employeeRepository.findById("EMP999")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.getDevelopmentSkillsByEmployee("EMP999"));

        assertThat(ex.getMessage()).isEqualTo("Employee not found with id: EMP999");
    }

    @Test
    @DisplayName("TC-SKILL-DEV-017 | getDevelopmentSkillsByEmployee | employee exists but has no experiences → returns empty list")
    void getDevelopmentSkillsByEmployee_noExperiences_returnsEmptyList() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(devExperienceRepository.findByEmployeeId("EMP001")).thenReturn(List.of());

        assertThat(service.getDevelopmentSkillsByEmployee("EMP001")).isEmpty();
    }

    // ── getAllDevelopmentSkills ────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-DEV-018 | getAllDevelopmentSkills | experiences exist → returns full mapped list")
    void getAllDevelopmentSkills_returnsMappedList() {
        Employee emp1 = buildEmployee("EMP001");
        Employee emp2 = buildEmployee("EMP002");
        DevelopmentType type = buildDevelopmentType(10, "Backend", true);
        when(devExperienceRepository.findAll()).thenReturn(List.of(
                buildDevelopmentExperience(1, emp1, type, "API", new BigDecimal("1.0")),
                buildDevelopmentExperience(2, emp2, type, "Testing", new BigDecimal("2.0"))));

        List<DevelopmentSkillDto> result = service.getAllDevelopmentSkills();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getEmployeeId()).isEqualTo("EMP001");
        assertThat(result.get(1).getEmployeeId()).isEqualTo("EMP002");
    }

    @Test
    @DisplayName("TC-SKILL-DEV-019 | getAllDevelopmentSkills | no experiences → returns empty list")
    void getAllDevelopmentSkills_noExperiences_returnsEmptyList() {
        when(devExperienceRepository.findAll()).thenReturn(List.of());

        assertThat(service.getAllDevelopmentSkills()).isEmpty();
    }

    // ── getDevelopmentSkillById ────────────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-DEV-020 | getDevelopmentSkillById | experience exists → returns mapped dto")
    void getDevelopmentSkillById_existingExperience_returnsDto() {
        Employee employee = buildEmployee("EMP001");
        DevelopmentType type = buildDevelopmentType(10, "Backend", true);
        when(devExperienceRepository.findById(1))
                .thenReturn(Optional.of(buildDevelopmentExperience(1, employee, type, "API", new BigDecimal("1.0"))));

        DevelopmentSkillDto result = service.getDevelopmentSkillById(1);

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getEmployeeId()).isEqualTo("EMP001");
        assertThat(result.getDevelopmentTypeName()).isEqualTo("Backend");
    }

    @Test
    @DisplayName("TC-SKILL-DEV-021 | getDevelopmentSkillById | id does not exist → throws")
    void getDevelopmentSkillById_notFound_throws() {
        when(devExperienceRepository.findById(999)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.getDevelopmentSkillById(999));

        assertThat(ex.getMessage()).isEqualTo("Development experience not found with id: 999");
    }

    // ── getOrCreateDevelopmentType (private — exercised through saveDevelopmentSkill) ──

    @Test
    @DisplayName("TC-SKILL-DEV-022 | getOrCreateDevelopmentType | name does not exist yet → new type created, name trimmed, isActive=true")
    void getOrCreateDevelopmentType_newName_createsTrimmedActiveType() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("  Frontend  ")).thenReturn(Optional.empty());
        when(devExperienceRepository.findByEmployeeIdAndDevelopmentTypeIdAndProcessName("EMP001", 300, "UI Work"))
                .thenReturn(Optional.empty());

        service.saveDevelopmentSkill(buildDevelopmentSkillDto(null, "EMP001", "  Frontend  ", "UI Work", null));

        ArgumentCaptor<DevelopmentType> captor = ArgumentCaptor.forClass(DevelopmentType.class);
        verify(developmentTypeRepository).save(captor.capture());
        assertThat(captor.getValue().getDevelopmentTypeName()).isEqualTo("Frontend");
        assertThat(captor.getValue().getIsActive()).isTrue();
    }

    // ── createDevelopmentType (standalone admin method) ────────────────────

    @Test
    @DisplayName("TC-SKILL-DEV-023 | createDevelopmentType | valid new name → created with isActive=true")
    void createDevelopmentType_validName_createsActiveType() {
        when(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("DevOps")).thenReturn(Optional.empty());

        DevelopmentType result = service.createDevelopmentType("DevOps");

        assertThat(result.getId()).isEqualTo(300);
        assertThat(result.getDevelopmentTypeName()).isEqualTo("DevOps");
        assertThat(result.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("TC-SKILL-DEV-024 | createDevelopmentType | null name → throws, nothing saved")
    void createDevelopmentType_nullName_throws() {
        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.createDevelopmentType(null));

        assertThat(ex.getMessage()).isEqualTo("Development type name cannot be null or empty");
        verify(developmentTypeRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-SKILL-DEV-025 | createDevelopmentType | blank/whitespace-only name → throws, nothing saved")
    void createDevelopmentType_blankName_throws() {
        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.createDevelopmentType("   "));

        assertThat(ex.getMessage()).isEqualTo("Development type name cannot be null or empty");
        verify(developmentTypeRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-SKILL-DEV-026 | createDevelopmentType | name already exists case-insensitively → throws, nothing saved")
    void createDevelopmentType_nameAlreadyExists_throws() {
        when(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("devops")).thenReturn(Optional.of(buildDevelopmentType(1, "DevOps", true)));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.createDevelopmentType("devops"));

        assertThat(ex.getMessage()).isEqualTo("Development type already exists: devops");
        verify(developmentTypeRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-SKILL-DEV-027 | createDevelopmentType | name has surrounding whitespace → trimmed before both the existence check and the save")
    void createDevelopmentType_whitespacePadded_trimsBeforeCheckAndSave() {
        when(developmentTypeRepository.findByDevelopmentTypeNameIgnoreCase("DevOps")).thenReturn(Optional.empty());

        DevelopmentType result = service.createDevelopmentType("  DevOps  ");

        assertThat(result.getDevelopmentTypeName()).isEqualTo("DevOps");
    }

    // ── getAllActiveDevelopmentTypes ───────────────────────────────────────

    @Test
    @DisplayName("TC-SKILL-DEV-028 | getAllActiveDevelopmentTypes | active types exist → returns them")
    void getAllActiveDevelopmentTypes_returnsActiveTypes() {
        when(developmentTypeRepository.findByIsActiveTrue()).thenReturn(List.of(
                buildDevelopmentType(1, "Backend", true),
                buildDevelopmentType(2, "Frontend", true)));

        List<DevelopmentType> result = service.getAllActiveDevelopmentTypes();

        assertThat(result).hasSize(2);
    }

    @Test
    @DisplayName("TC-SKILL-DEV-029 | getAllActiveDevelopmentTypes | no active types → returns empty list")
    void getAllActiveDevelopmentTypes_noneActive_returnsEmptyList() {
        when(developmentTypeRepository.findByIsActiveTrue()).thenReturn(List.of());

        assertThat(service.getAllActiveDevelopmentTypes()).isEmpty();
    }

    // ── helpers ────────────────────────────────────────────────────────────

    private static Employee buildEmployee(String id) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName("Test Employee " + id);
        employee.setEmail(id.toLowerCase() + "@dat.com");
        employee.setDoorlog("door-" + id);
        employee.setPosition("Engineer");
        employee.setEmpStatus("active");
        employee.setStatus("default");
        return employee;
    }

    private static EmployeeJapaneseProfile buildLanguageProfile(Integer id, Employee employee, Short level) {
        EmployeeJapaneseProfile profile = new EmployeeJapaneseProfile();
        profile.setId(id);
        profile.setEmployee(employee);
        profile.setLanguageSkillLevel(level);
        return profile;
    }

    private static LanguageSkillDto buildLanguageSkillDto(Integer id, String employeeId, Short level) {
        LanguageSkillDto dto = new LanguageSkillDto();
        dto.setId(id);
        dto.setEmployeeId(employeeId);
        dto.setLanguageSkillLevel(level);
        return dto;
    }

    private static ManagementScore buildManagementScore(Integer id, Employee employee, Short experienceLevel,
                                                        Short qcd, Short reportConsult, Short education, Short totalLevel) {
        ManagementScore score = new ManagementScore();
        score.setId(id);
        score.setEmployee(employee);
        score.setManagementExperienceLevel(experienceLevel);
        score.setQcdScore(qcd);
        score.setReportConsultScore(reportConsult);
        score.setEducationScore(education);
        score.setTotalLevel(totalLevel);
        return score;
    }

    private static ManagementSkillDto buildManagementSkillDto(Integer id, String employeeId, Short experienceLevel,
                                                              Short qcd, Short reportConsult, Short education, Short totalLevel) {
        ManagementSkillDto dto = new ManagementSkillDto();
        dto.setId(id);
        dto.setEmployeeId(employeeId);
        dto.setManagementExperienceLevel(experienceLevel);
        dto.setQcdScore(qcd);
        dto.setReportConsultScore(reportConsult);
        dto.setEducationScore(education);
        dto.setTotalLevel(totalLevel);
        return dto;
    }

    /**
     * Shortcut for the calculateTotalLevel boundary tests: wires up a fresh "EMP001"
     * with no existing management score, then saves a management skill with the given
     * component scores so the resulting dto's totalLevel can be asserted directly.
     */
    private ManagementSkillDto saveWithScores(Short qcd, Short reportConsult, Short education) {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(managementScoreRepository.findByEmployeeId("EMP001")).thenReturn(Optional.empty());
        return service.saveManagementSkill(
                buildManagementSkillDto(null, "EMP001", (short) 3, qcd, reportConsult, education, null));
    }

    private static DevelopmentType buildDevelopmentType(Integer id, String name, Boolean isActive) {
        DevelopmentType type = new DevelopmentType();
        type.setId(id);
        type.setDevelopmentTypeName(name);
        type.setIsActive(isActive);
        return type;
    }

    private static EmployeeDevelopmentExperience buildDevelopmentExperience(Integer id, Employee employee,
                                                                            DevelopmentType type, String processName, BigDecimal yearsOfExperience) {
        EmployeeDevelopmentExperience experience = new EmployeeDevelopmentExperience();
        experience.setId(id);
        experience.setEmployee(employee);
        experience.setDevelopmentType(type);
        experience.setProcessName(processName);
        experience.setYearsOfExperience(yearsOfExperience);
        return experience;
    }

    private static DevelopmentSkillDto buildDevelopmentSkillDto(Integer id, String employeeId, String typeName,
                                                                String processName, BigDecimal yearsOfExperience) {
        DevelopmentSkillDto dto = new DevelopmentSkillDto();
        dto.setId(id);
        dto.setEmployeeId(employeeId);
        dto.setDevelopmentTypeName(typeName);
        dto.setProcessName(processName);
        dto.setYearsOfExperience(yearsOfExperience);
        return dto;
    }
}