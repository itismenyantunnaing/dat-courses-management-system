package com.dat_management.backend.controller;

import com.dat_management.backend.entity.TargetTerm;
import com.dat_management.backend.repository.TargetTermRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TargetTermControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TargetTermRepository targetTermRepository;

    @Test
    @DisplayName("TC_TT_GET_ALL_01 | GET all target terms when DB empty -> 200 with empty list")
    void getAllTargetTerms_emptyDatabase_returns200AndEmptyList() throws Exception {
        mockMvc.perform(get("/api/target-terms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("TC_TT_CREATE_01 | POST target term without isActive -> 201 with default active true")
    void createTargetTerm_withoutIsActive_returns201AndDefaultsActiveTrue() throws Exception {
        mockMvc.perform(post("/api/target-terms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "target1Date": "2026-07-01",
                                  "target2Date": "2026-09-01",
                                  "examDate": "2026-12-06"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.target1Date").value("2026-07-01"))
                .andExpect(jsonPath("$.target2Date").value("2026-09-01"))
                .andExpect(jsonPath("$.examDate").value("2026-12-06"))
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    @DisplayName("TC_TT_CREATE_02 | POST inactive target term -> 201 with active false")
    void createTargetTerm_withInactiveFlag_returns201AndInactiveResponse() throws Exception {
        mockMvc.perform(post("/api/target-terms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(targetTermJson("2026-07-01", "2026-09-01", "2026-12-06", false)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.isActive").value(false));
    }

    @Test
    @DisplayName("TC_TT_GET_ALL_02 | GET all target terms with data -> 200 with list")
    void getAllTargetTerms_withData_returns200AndList() throws Exception {
        insertTargetTerm("2026-07-01", "2026-09-01", "2026-12-06", true);
        insertTargetTerm("2027-01-01", "2027-03-01", "2027-07-05", false);

        mockMvc.perform(get("/api/target-terms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].target1Date").exists())
                .andExpect(jsonPath("$[0].target2Date").exists())
                .andExpect(jsonPath("$[0].examDate").exists())
                .andExpect(jsonPath("$[0].isActive").exists());
    }

    @Test
    @DisplayName("TC_TT_GET_ACTIVE_01 | GET active target terms -> 200 with active terms only")
    void getActiveTargetTerms_returnsOnlyActiveTerms() throws Exception {
        insertTargetTerm("2026-07-01", "2026-09-01", "2026-12-06", true);
        insertTargetTerm("2027-01-01", "2027-03-01", "2027-07-05", false);

        mockMvc.perform(get("/api/target-terms/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].isActive").value(true))
                .andExpect(jsonPath("$[0].target1Date").value("2026-07-01"));
    }

    @Test
    @DisplayName("TC_TT_GET_BY_ID_01 | GET target term by valid ID -> 200 with matching data")
    void getTargetTermById_validId_returns200AndData() throws Exception {
        TargetTerm saved = insertTargetTerm("2026-07-01", "2026-09-01", "2026-12-06", true);

        mockMvc.perform(get("/api/target-terms/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.target1Date").value("2026-07-01"))
                .andExpect(jsonPath("$.target2Date").value("2026-09-01"))
                .andExpect(jsonPath("$.examDate").value("2026-12-06"))
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    @DisplayName("TC_TT_UPDATE_01 | PUT target term with new values -> 200 with updated data")
    void updateTargetTerm_validRequest_returns200AndUpdatedData() throws Exception {
        TargetTerm saved = insertTargetTerm("2026-07-01", "2026-09-01", "2026-12-06", true);

        mockMvc.perform(put("/api/target-terms/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(targetTermJson("2026-08-01", "2026-10-01", "2026-12-13", false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.target1Date").value("2026-08-01"))
                .andExpect(jsonPath("$.target2Date").value("2026-10-01"))
                .andExpect(jsonPath("$.examDate").value("2026-12-13"))
                .andExpect(jsonPath("$.isActive").value(false));
    }

    @Test
    @DisplayName("TC_TT_UPDATE_02 | PUT target term without isActive -> 200 and keeps existing active flag")
    void updateTargetTerm_withoutIsActive_keepsExistingActiveFlag() throws Exception {
        TargetTerm saved = insertTargetTerm("2026-07-01", "2026-09-01", "2026-12-06", false);

        mockMvc.perform(put("/api/target-terms/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "target1Date": "2026-08-01",
                                  "target2Date": "2026-10-01",
                                  "examDate": "2026-12-13"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.target1Date").value("2026-08-01"))
                .andExpect(jsonPath("$.target2Date").value("2026-10-01"))
                .andExpect(jsonPath("$.examDate").value("2026-12-13"))
                .andExpect(jsonPath("$.isActive").value(false));
    }

    @Test
    @DisplayName("TC_TT_DELETE_01 | DELETE target term by valid ID -> 204 and removes record")
    void deleteTargetTerm_validId_returns204AndRemovesRecord() throws Exception {
        TargetTerm saved = insertTargetTerm("2026-07-01", "2026-09-01", "2026-12-06", true);

        mockMvc.perform(delete("/api/target-terms/{id}", saved.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/target-terms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("TC_TT_DELETE_LIST_01 | DELETE target term list -> 204 and removes all requested records")
    void deleteTargetTermList_validIds_returns204AndRemovesRecords() throws Exception {
        TargetTerm first = insertTargetTerm("2026-07-01", "2026-09-01", "2026-12-06", true);
        TargetTerm second = insertTargetTerm("2027-01-01", "2027-03-01", "2027-07-05", false);

        mockMvc.perform(delete("/api/target-terms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[%d,%d]".formatted(first.getId(), second.getId())))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/target-terms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    private TargetTerm insertTargetTerm(String target1Date, String target2Date, String examDate, boolean isActive) {
        TargetTerm targetTerm = new TargetTerm();
        targetTerm.setTarget1Date(LocalDate.parse(target1Date));
        targetTerm.setTarget2Date(LocalDate.parse(target2Date));
        targetTerm.setExamDate(LocalDate.parse(examDate));
        targetTerm.setIsActive(isActive);
        return targetTermRepository.save(targetTerm);
    }

    private static String targetTermJson(
            String target1Date,
            String target2Date,
            String examDate,
            boolean isActive
    ) {
        return """
                {
                  "target1Date": "%s",
                  "target2Date": "%s",
                  "examDate": "%s",
                  "isActive": %s
                }
                """.formatted(target1Date, target2Date, examDate, isActive);
    }
}
