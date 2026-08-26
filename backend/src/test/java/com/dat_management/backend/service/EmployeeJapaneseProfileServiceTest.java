package com.dat_management.backend.service;

import com.dat_management.backend.dto.EmployeeJapaneseProfileRequest;
import com.dat_management.backend.dto.EmployeeJapaneseProfileResponse;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeJapaneseProfile;
import com.dat_management.backend.entity.EmployeeJapaneseProfile.JapaneseExamType;
import com.dat_management.backend.repository.EmployeeJapaneseProfileRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeJapaneseProfileServiceTest {

    @Mock
    private EmployeeJapaneseProfileRepository profileRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    // ─────────────────────────────────────────────────────────────
    // Service creation
    // ─────────────────────────────────────────────────────────────

    private EmployeeJapaneseProfileService service() {
        return new EmployeeJapaneseProfileService(
                profileRepository,
                employeeRepository
        );
    }

    // ─────────────────────────────────────────────────────────────
    // GET ALL
    // ─────────────────────────────────────────────────────────────

    @Test
    void getAllReturnsProfiles() {
        Employee employee = employee("EMP001");
        EmployeeJapaneseProfile profile = profile(1, employee);

        when(profileRepository.findAll())
                .thenReturn(List.of(profile));

        List<EmployeeJapaneseProfileResponse> result =
                service().getAll();

        Assertions.assertEquals(1, result.size());
        Assertions.assertEquals(1, result.get(0).getId());
        Assertions.assertEquals(
                "EMP001",
                result.get(0).getEmployee_id()
        );
    }

    // ─────────────────────────────────────────────────────────────
    // GET BY ID
    // ─────────────────────────────────────────────────────────────

    @Test
    void getByIdReturnsProfile() {
        Employee employee = employee("EMP001");
        EmployeeJapaneseProfile profile = profile(1, employee);

        when(profileRepository.findById(1))
                .thenReturn(Optional.of(profile));

        EmployeeJapaneseProfileResponse result =
                service().getById(1);

        Assertions.assertEquals(1, result.getId());
        Assertions.assertEquals(
                "EMP001",
                result.getEmployee_id()
        );
        Assertions.assertEquals(
                "N3",
                result.getJlptHighestLevel()
        );
    }

    @Test
    void getByIdThrowsWhenProfileIsMissing() {
        when(profileRepository.findById(999))
                .thenReturn(Optional.empty());

        ResponseStatusException ex =
                Assertions.assertThrows(
                        ResponseStatusException.class,
                        () -> service().getById(999)
                );

        Assertions.assertEquals(
                404,
                ex.getStatusCode().value()
        );

        Assertions.assertEquals(
                "Japanese profile not found with id: 999",
                ex.getReason()
        );
    }

    // ─────────────────────────────────────────────────────────────
    // GET BY EMPLOYEE ID
    // ─────────────────────────────────────────────────────────────

    @Test
    void getByEmployeeIdReturnsProfile() {
        Employee employee = employee("EMP001");
        EmployeeJapaneseProfile profile = profile(1, employee);

        when(profileRepository.findByEmployeeId("EMP001"))
                .thenReturn(Optional.of(profile));

        EmployeeJapaneseProfileResponse result =
                service().getByEmployeeId("EMP001");

        Assertions.assertEquals(
                1,
                result.getId()
        );

        Assertions.assertEquals(
                "EMP001",
                result.getEmployee_id()
        );
    }

    @Test
    void getByEmployeeIdThrowsWhenProfileIsMissing() {
        when(profileRepository.findByEmployeeId("EMP001"))
                .thenReturn(Optional.empty());

        ResponseStatusException ex =
                Assertions.assertThrows(
                        ResponseStatusException.class,
                        () -> service().getByEmployeeId("EMP001")
                );

        Assertions.assertEquals(
                404,
                ex.getStatusCode().value()
        );

        Assertions.assertEquals(
                "Japanese profile not found for employee id: EMP001",
                ex.getReason()
        );
    }

    // ─────────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────────

    @Test
    void createCreatesJapaneseProfile() {

        Employee employee = employee("EMP001");
        EmployeeJapaneseProfileRequest request =
                request("EMP001");

        when(profileRepository.existsByEmployeeId("EMP001"))
                .thenReturn(false);

        when(employeeRepository.findById("EMP001"))
                .thenReturn(Optional.of(employee));

        when(profileRepository.save(
                any(EmployeeJapaneseProfile.class)))
                .thenAnswer(invocation -> {
                    EmployeeJapaneseProfile saved =
                            invocation.getArgument(0);

                    saved.setId(1);

                    return saved;
                });

        EmployeeJapaneseProfileResponse result =
                service().create(request);

        ArgumentCaptor<EmployeeJapaneseProfile> captor =
                ArgumentCaptor.forClass(
                        EmployeeJapaneseProfile.class
                );

        verify(profileRepository).save(captor.capture());

        EmployeeJapaneseProfile saved =
                captor.getValue();

        Assertions.assertEquals(
                1,
                saved.getId()
        );

        Assertions.assertEquals(
                employee,
                saved.getEmployee()
        );

        Assertions.assertEquals(
                "N3",
                saved.getJlptHighestLevel()
        );

        Assertions.assertEquals(
                JapaneseExamType.JLPT,
                saved.getJlptNatTest()
        );

        Assertions.assertEquals(
                "EMP001",
                result.getEmployee_id()
        );
    }

    // ─────────────────────────────────────────────────────────────
    // CREATE - DUPLICATE
    // ─────────────────────────────────────────────────────────────

    @Test
    void createRejectsDuplicateEmployeeProfile() {

        EmployeeJapaneseProfileRequest request =
                request("EMP001");

        when(profileRepository.existsByEmployeeId("EMP001"))
                .thenReturn(true);

        ResponseStatusException ex =
                Assertions.assertThrows(
                        ResponseStatusException.class,
                        () -> service().create(request)
                );

        Assertions.assertEquals(
                400,
                ex.getStatusCode().value()
        );

        Assertions.assertEquals(
                "Japanese profile already exists for employee id: EMP001",
                ex.getReason()
        );

        verify(
                profileRepository,
                never()
        ).save(any(EmployeeJapaneseProfile.class));
    }

    // ─────────────────────────────────────────────────────────────
    // CREATE - MISSING EMPLOYEE ID
    // ─────────────────────────────────────────────────────────────

    @Test
    void createRejectsMissingEmployeeId() {

        EmployeeJapaneseProfileRequest request =
                request(null);

        ResponseStatusException ex =
                Assertions.assertThrows(
                        ResponseStatusException.class,
                        () -> service().create(request)
                );

        Assertions.assertEquals(
                400,
                ex.getStatusCode().value()
        );

        Assertions.assertEquals(
                "employeeId is required",
                ex.getReason()
        );

        verify(
                profileRepository,
                never()
        ).save(any(EmployeeJapaneseProfile.class));
    }

    // ─────────────────────────────────────────────────────────────
    // CREATE - EMPLOYEE NOT FOUND
    // ─────────────────────────────────────────────────────────────

    @Test
    void createRejectsWhenEmployeeDoesNotExist() {

        EmployeeJapaneseProfileRequest request =
                request("EMP001");

        when(profileRepository.existsByEmployeeId("EMP001"))
                .thenReturn(false);

        when(employeeRepository.findById("EMP001"))
                .thenReturn(Optional.empty());

        ResponseStatusException ex =
                Assertions.assertThrows(
                        ResponseStatusException.class,
                        () -> service().create(request)
                );

        Assertions.assertEquals(
                404,
                ex.getStatusCode().value()
        );

        Assertions.assertEquals(
                "Employee not found with id: EMP001",
                ex.getReason()
        );

        verify(
                profileRepository,
                never()
        ).save(any(EmployeeJapaneseProfile.class));
    }

    @Test
void updateChangesProfileFields() {

    Employee employee = employee("EMP001");

    EmployeeJapaneseProfile profile =
            profile(1, employee);

    EmployeeJapaneseProfileRequest request =
            request("EMP001");

    request.setJlptHighestLevel("N2");
    request.setConfidenceLevel("High");

    when(profileRepository.findById(1))
            .thenReturn(Optional.of(profile));

    when(profileRepository.findByEmployeeId("EMP001"))
            .thenReturn(Optional.of(profile));

    // ADD THIS
    when(employeeRepository.findById("EMP001"))
            .thenReturn(Optional.of(employee));

    when(profileRepository.save(profile))
            .thenReturn(profile);

    EmployeeJapaneseProfileResponse result =
            service().update(1, request);

    Assertions.assertEquals(
            "N2",
            profile.getJlptHighestLevel()
    );

    Assertions.assertEquals(
            "High",
            profile.getConfidenceLevel()
    );

    Assertions.assertEquals(
            "EMP001",
            result.getEmployee_id()
    );

    verify(profileRepository).save(profile);
}

    
    @Test
    void updateRejectsDuplicateEmployeeAssignment() {

        Employee employee1 = employee("EMP001");
        Employee employee2 = employee("EMP002");

        EmployeeJapaneseProfile profile1 =
                profile(1, employee1);

        EmployeeJapaneseProfile profile2 =
                profile(2, employee2);

        EmployeeJapaneseProfileRequest request =
                request("EMP002");

        when(profileRepository.findById(1))
                .thenReturn(Optional.of(profile1));

        when(profileRepository.findByEmployeeId("EMP002"))
                .thenReturn(Optional.of(profile2));

        ResponseStatusException ex =
                Assertions.assertThrows(
                        ResponseStatusException.class,
                        () -> service().update(1, request)
                );

        Assertions.assertEquals(
                400,
                ex.getStatusCode().value()
        );

        Assertions.assertEquals(
                "Japanese profile already exists for employee id: EMP002",
                ex.getReason()
        );

        verify(
                profileRepository,
                never()
        ).save(any(EmployeeJapaneseProfile.class));
    }

    // ─────────────────────────────────────────────────────────────
    // UPDATE - PROFILE NOT FOUND
    // ─────────────────────────────────────────────────────────────

    @Test
    void updateThrowsWhenProfileIsMissing() {

        EmployeeJapaneseProfileRequest request =
                request("EMP001");

        when(profileRepository.findById(999))
                .thenReturn(Optional.empty());

        ResponseStatusException ex =
                Assertions.assertThrows(
                        ResponseStatusException.class,
                        () -> service().update(999, request)
                );

        Assertions.assertEquals(
                404,
                ex.getStatusCode().value()
        );

        Assertions.assertEquals(
                "Japanese profile not found with id: 999",
                ex.getReason()
        );

        verify(
                profileRepository,
                never()
        ).save(any(EmployeeJapaneseProfile.class));
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────────────

    @Test
    void deleteDeletesExistingProfile() {

        when(profileRepository.existsById(1))
                .thenReturn(true);

        service().delete(1);

        verify(profileRepository)
                .deleteById(1);
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE - NOT FOUND
    // ─────────────────────────────────────────────────────────────

    @Test
    void deleteThrowsWhenProfileDoesNotExist() {

        when(profileRepository.existsById(999))
                .thenReturn(false);

        ResponseStatusException ex =
                Assertions.assertThrows(
                        ResponseStatusException.class,
                        () -> service().delete(999)
                );

        Assertions.assertEquals(
                404,
                ex.getStatusCode().value()
        );

        Assertions.assertEquals(
                "Japanese profile not found with id: 999",
                ex.getReason()
        );

        verify(
                profileRepository,
                never()
        ).deleteById(any());
    }

    // ─────────────────────────────────────────────────────────────
    // IMPORT LIST - EMPTY
    // ─────────────────────────────────────────────────────────────

    @Test
    void importListRejectsEmptyList() {

        ResponseStatusException ex =
                Assertions.assertThrows(
                        ResponseStatusException.class,
                        () -> service().importList(List.of())
                );

        Assertions.assertEquals(
                400,
                ex.getStatusCode().value()
        );

        Assertions.assertEquals(
                "Profile list cannot be empty",
                ex.getReason()
        );
    }

    // ─────────────────────────────────────────────────────────────
    // IMPORT LIST - CREATE
    // ─────────────────────────────────────────────────────────────

    @Test
    void importListCreatesNewProfile() {

        Employee employee = employee("EMP001");

        EmployeeJapaneseProfileRequest request =
                request("EMP001");

        when(profileRepository.findByEmployeeId("EMP001"))
                .thenReturn(Optional.empty());

        when(employeeRepository.findById("EMP001"))
                .thenReturn(Optional.of(employee));

        when(profileRepository.save(
                any(EmployeeJapaneseProfile.class)))
                .thenAnswer(invocation -> {

                    EmployeeJapaneseProfile profile =
                            invocation.getArgument(0);

                    profile.setId(1);

                    return profile;
                });

        List<EmployeeJapaneseProfileResponse> result =
                service().importList(List.of(request));

        Assertions.assertEquals(
                1,
                result.size()
        );

        Assertions.assertEquals(
                1,
                result.get(0).getId()
        );

        Assertions.assertEquals(
                "EMP001",
                result.get(0).getEmployee_id()
        );

        verify(profileRepository)
                .save(any(EmployeeJapaneseProfile.class));
    }

    // ─────────────────────────────────────────────────────────────
    // IMPORT LIST - UPDATE EXISTING
    // ─────────────────────────────────────────────────────────────

    @Test
    void importListUpdatesExistingProfile() {

        Employee employee = employee("EMP001");

        EmployeeJapaneseProfile existingProfile =
                profile(1, employee);

        EmployeeJapaneseProfileRequest request =
                request("EMP001");

        request.setJlptHighestLevel("N2");

        when(profileRepository.findByEmployeeId("EMP001"))
                .thenReturn(Optional.of(existingProfile));

        when(profileRepository.save(existingProfile))
                .thenReturn(existingProfile);

        List<EmployeeJapaneseProfileResponse> result =
                service().importList(List.of(request));

        Assertions.assertEquals(
                1,
                result.size()
        );

        Assertions.assertEquals(
                "N2",
                existingProfile.getJlptHighestLevel()
        );

        verify(profileRepository)
                .save(existingProfile);

        verify(employeeRepository, never())
                .findById(any());
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE LIST - EMPTY
    // ─────────────────────────────────────────────────────────────

    @Test
    void deleteListRejectsEmptyList() {

        ResponseStatusException ex =
                Assertions.assertThrows(
                        ResponseStatusException.class,
                        () -> service().deleteList(List.of())
                );

        Assertions.assertEquals(
                400,
                ex.getStatusCode().value()
        );

        Assertions.assertEquals(
                "Profile id list cannot be empty",
                ex.getReason()
        );

        verify(profileRepository, never())
                .deleteAllById(any());
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE LIST
    // ─────────────────────────────────────────────────────────────

    @Test
    void deleteListDeletesProfiles() {

        List<Integer> ids =
                List.of(1, 2, 3);

        service().deleteList(ids);

        verify(profileRepository)
                .deleteAllById(ids);
    }

    // ─────────────────────────────────────────────────────────────
    // TEST DATA - EMPLOYEE
    // ─────────────────────────────────────────────────────────────

    private static Employee employee(String id) {

        Employee employee = new Employee();

        employee.setId(id);
        employee.setName("Test Employee");
        employee.setEmail(
                id.toLowerCase() + "@dat.com"
        );
        employee.setDoorlog(
                "door-" + id
        );
        employee.setPosition("Engineer");
        employee.setEmpStatus("active");
        employee.setStatus("default");

        return employee;
    }

    // ─────────────────────────────────────────────────────────────
    // TEST DATA - JAPANESE PROFILE
    // ─────────────────────────────────────────────────────────────

    private static EmployeeJapaneseProfile profile(
            Integer id,
            Employee employee) {

        EmployeeJapaneseProfile profile =
                new EmployeeJapaneseProfile();

        profile.setId(id);
        profile.setEmployee(employee);

        profile.setJlptHighestLevel("N3");
        profile.setOtherJapaneseLevel("Basic");
        profile.setCurrentLearningLevel("Intermediate");

        profile.setWantToSitExam(true);
        profile.setExamTargetLevel("N2");

        // IMPORTANT:
        // jlptNatTest is an enum, NOT String.
        profile.setJlptNatTest(
                JapaneseExamType.JLPT
        );

        profile.setCurrentCommunicationLevel(
                "Intermediate"
        );

        profile.setLearningMethod(
                "Self Study"
        );

        profile.setPreferredLearningGroup(
                "Group A"
        );

        profile.setConfidenceLevel(
                "Medium"
        );

        profile.setLanguageSkillLevel(
                (short) 3
        );

        profile.setTarget1JlptNatLevel("N2");
        profile.setTarget1CommunicationLevel(
                "Intermediate"
        );

        profile.setTarget2JlptNatLevel("N1");
        profile.setTarget2CommunicationLevel(
                "Advanced"
        );

        return profile;
    }

    // ─────────────────────────────────────────────────────────────
    // TEST DATA - REQUEST
    // ─────────────────────────────────────────────────────────────

    private static EmployeeJapaneseProfileRequest request(
            String employeeId) {

        EmployeeJapaneseProfileRequest request =
                new EmployeeJapaneseProfileRequest();

        request.setEmployeeId(employeeId);

        request.setJlptHighestLevel("N3");
        request.setOtherJapaneseLevel("Basic");
        request.setCurrentLearningLevel(
                "Intermediate"
        );

        request.setWantToSitExam(true);
        request.setExamTargetLevel("N2");

        // IMPORTANT:
        // This is JapaneseExamType, not String.
        request.setJlptNatTest(
                JapaneseExamType.JLPT
        );

        request.setCurrentCommunicationLevel(
                "Intermediate"
        );

        request.setLearningMethod(
                "Self Study"
        );

        request.setPreferredLearningGroup(
                "Group A"
        );

        request.setConfidenceLevel(
                "Medium"
        );

        
        
        request.setTarget1JlptNatLevel("N2");
        request.setTarget1CommunicationLevel(
                "Intermediate"
        );

        request.setTarget2JlptNatLevel("N1");
        request.setTarget2CommunicationLevel(
                "Advanced"
        );

        return request;
    }
}