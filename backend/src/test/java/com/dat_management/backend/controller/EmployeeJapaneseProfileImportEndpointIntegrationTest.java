package com.dat_management.backend.controller;

import com.dat_management.backend.dto.EmployeeJapaneseProfileRequest;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeJapaneseProfile;
import com.dat_management.backend.entity.EmployeeJapaneseProfile.JapaneseExamType;
import com.dat_management.backend.repository.EmployeeJapaneseProfileRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers the bulk "Current Target" import endpoints on
 * {@link EmployeeJapaneseProfileController}.
 *
 * <p>This is what the frontend's Excel-import flow for "Current Target" data
 * actually calls (see {@code Excel-extractor-currentTarget.tsx} and
 * {@code store.bulkCreate_CurrentTargetData}) once it has parsed the uploaded
 * spreadsheet client-side into a plain JSON array — the backend never
 * receives a file, only the array below.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EmployeeJapaneseProfileImportEndpointIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private EmployeeJapaneseProfileRepository profileRepository;

    @BeforeEach
    void cleanDatabase() {
        profileRepository.deleteAll();
        employeeRepository.deleteAll();
    }

    @Test
    @DisplayName("TC_TARGET_IMPORT_001 | POST import new profiles → 201, persists full and partial field sets correctly")
    void importProfiles_newEmployees_returns201AndPersistsProfiles() throws Exception {
        employeeRepository.save(employee("EMP001", "Alice Admin"));
        employeeRepository.save(employee("EMP002", "Bob Staff"));

        List<EmployeeJapaneseProfileRequest> requests = List.of(
                fullProfileRequest("EMP001"),
                minimalProfileRequest("EMP002", "N4")
        );

        mockMvc.perform(post("/api/employee-japanese-profiles/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requests)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].employee_id").value("EMP001"))
                .andExpect(jsonPath("$[0].jlptHighestLevel").value("N2"))
                .andExpect(jsonPath("$[0].target1JlptNatLevel").value("N1"))
                .andExpect(jsonPath("$[0].target1CommunicationLevel").value("Fluent"))
                .andExpect(jsonPath("$[0].target2JlptNatLevel").value("N1"))
                .andExpect(jsonPath("$[0].wantToSitExam").value(true))
                .andExpect(jsonPath("$[0].jlptNatTest").value("JLPT"))
                .andExpect(jsonPath("$[1].employee_id").value("EMP002"))
                .andExpect(jsonPath("$[1].jlptHighestLevel").value("N4"));

        assertEquals(2, profileRepository.count());

        EmployeeJapaneseProfile emp001Profile = profileRepository.findByEmployeeId("EMP001").orElseThrow();
        assertEquals("N2", emp001Profile.getJlptHighestLevel());
        assertEquals("N1", emp001Profile.getTarget1JlptNatLevel());
        assertEquals("Fluent", emp001Profile.getTarget1CommunicationLevel());
        assertEquals(JapaneseExamType.JLPT, emp001Profile.getJlptNatTest());
        assertEquals("EMP001", emp001Profile.getEmployee().getId());

        // EMP002 only sent jlptHighestLevel — every other field should stay
        // genuinely null, not silently defaulted.
        EmployeeJapaneseProfile emp002Profile = profileRepository.findByEmployeeId("EMP002").orElseThrow();
        assertEquals("N4", emp002Profile.getJlptHighestLevel());
        assertNull(emp002Profile.getTarget1JlptNatLevel());
        assertNull(emp002Profile.getWantToSitExam());
    }

    @Test
    @DisplayName("TC_TARGET_IMPORT_002 | POST import for an employee who already has a profile → updates the existing row instead of duplicating it")
    void importProfiles_existingProfile_updatesInPlace() throws Exception {
        employeeRepository.save(employee("EMP001", "Alice Admin"));

        mockMvc.perform(post("/api/employee-japanese-profiles/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(minimalProfileRequest("EMP001", "N4")))))
                .andExpect(status().isCreated());

        Integer originalId = profileRepository.findByEmployeeId("EMP001").orElseThrow().getId();

        mockMvc.perform(post("/api/employee-japanese-profiles/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(minimalProfileRequest("EMP001", "N2")))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].id").value(originalId))
                .andExpect(jsonPath("$[0].jlptHighestLevel").value("N2"));

        assertEquals(1, profileRepository.count());
        assertEquals("N2", profileRepository.findByEmployeeId("EMP001").orElseThrow().getJlptHighestLevel());
    }

    @Test
    @DisplayName("TC_TARGET_IMPORT_003 | POST import with a missing employeeId partway through the batch → 400, whole batch rolled back")
    void importProfiles_missingEmployeeIdInBatch_returns400AndPersistsNothing() throws Exception {
        employeeRepository.save(employee("EMP001", "Alice Admin"));

        List<EmployeeJapaneseProfileRequest> requests = List.of(
                minimalProfileRequest("EMP001", "N2"), // would succeed on its own
                minimalProfileRequest(null, "N3")       // fails validation → aborts the whole batch
        );

        mockMvc.perform(post("/api/employee-japanese-profiles/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requests)))
                .andExpect(status().isBadRequest());

        // importList() is @Transactional, so the EMP001 row that was already
        // saved before the failing row is rolled back too — unlike the
        // Employee bulk importer, this endpoint does not skip bad rows.
        assertEquals(0, profileRepository.count());
    }

    @Test
    @DisplayName("TC_TARGET_IMPORT_004 | POST import referencing an employeeId that doesn't exist → 404, whole batch rolled back")
    void importProfiles_unknownEmployeeId_returns404AndPersistsNothing() throws Exception {
        employeeRepository.save(employee("EMP001", "Alice Admin"));

        List<EmployeeJapaneseProfileRequest> requests = List.of(
                minimalProfileRequest("EMP001", "N2"),   // would succeed on its own
                minimalProfileRequest("GHOST999", "N2")  // no such employee → aborts the whole batch
        );

        mockMvc.perform(post("/api/employee-japanese-profiles/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requests)))
                .andExpect(status().isNotFound());

        assertEquals(0, profileRepository.count());
    }

    @Test
    @DisplayName("TC_TARGET_IMPORT_005 | POST import with an empty list → 400 Bad Request")
    void importProfiles_emptyList_returns400() throws Exception {
        mockMvc.perform(post("/api/employee-japanese-profiles/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of())))
                .andExpect(status().isBadRequest());

        assertEquals(0, profileRepository.count());
    }

    @Test
    @DisplayName("TC_TARGET_IMPORT_006 | POST import with the same employeeId twice in one payload → only one profile persisted, last row wins")
    void importProfiles_duplicateEmployeeIdInSameBatch_persistsSingleRowWithLastValues() throws Exception {
        employeeRepository.save(employee("EMP001", "Alice Admin"));

        List<EmployeeJapaneseProfileRequest> requests = List.of(
                minimalProfileRequest("EMP001", "N4"),
                minimalProfileRequest("EMP001", "N2") // same employee again, later in the same batch
        );

        mockMvc.perform(post("/api/employee-japanese-profiles/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requests)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(2)));

        assertEquals(1, profileRepository.count());
        assertEquals("N2", profileRepository.findByEmployeeId("EMP001").orElseThrow().getJlptHighestLevel());
    }

    @Test
    @DisplayName("TC_TARGET_IMPORT_007 | POST /import-list (alias route) → same behavior as /import")
    void importListAliasEndpoint_validPayload_returns201AndPersistsProfile() throws Exception {
        // /import and /import-list both route to the same
        // EmployeeJapaneseProfileService#importList — flagging this for the
        // team since it looks like a leftover duplicate mapping rather than
        // an intentional second endpoint.
        employeeRepository.save(employee("EMP001", "Alice Admin"));

        mockMvc.perform(post("/api/employee-japanese-profiles/import-list")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(minimalProfileRequest("EMP001", "N3")))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].employee_id").value("EMP001"))
                .andExpect(jsonPath("$[0].jlptHighestLevel").value("N3"));

        assertEquals(1, profileRepository.count());
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private static Employee employee(String id, String name) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(name);
        employee.setEmail(id.toLowerCase() + "@dat.com");
        employee.setPassword("encoded-password");
        employee.setDoorlog("door-" + id);
        employee.setPosition("Engineer");
        employee.setEmpStatus("active");
        employee.setStatus("default");
        employee.setIsCorePersonnel(false);
        employee.setHasJapanBusinessTrip(false);
        employee.setNotiSetting(false);
        employee.setIsDeleted(false);
        return employee;
    }

    private static EmployeeJapaneseProfileRequest fullProfileRequest(String employeeId) {
        EmployeeJapaneseProfileRequest request = new EmployeeJapaneseProfileRequest();
        request.setEmployeeId(employeeId);
        request.setJlptHighestLevel("N2");
        request.setOtherJapaneseLevel("Business Japanese");
        request.setPreferredLearningGroup("Group A");
        request.setCurrentCommunicationLevel("Intermediate");
        request.setTarget1JlptNatLevel("N1");
        request.setTarget1CommunicationLevel("Fluent");
        request.setTarget2JlptNatLevel("N1");
        request.setTarget2CommunicationLevel("Native");
        request.setCurrentLearningLevel("N3");
        request.setLearningMethod("Self-study");
        request.setWantToSitExam(true);
        request.setExamTargetLevel("N1");
        request.setJlptNatTest(JapaneseExamType.JLPT);
        request.setConfidenceLevel("High");
        return request;
    }

    private static EmployeeJapaneseProfileRequest minimalProfileRequest(String employeeId, String jlptHighestLevel) {
        EmployeeJapaneseProfileRequest request = new EmployeeJapaneseProfileRequest();
        request.setEmployeeId(employeeId);
        request.setJlptHighestLevel(jlptHighestLevel);
        return request;
    }
}