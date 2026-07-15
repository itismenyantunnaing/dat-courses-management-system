package com.dat_management.backend.controller;

import com.dat_management.backend.dto.HolidayDto;
import com.dat_management.backend.entity.Holiday;
import com.dat_management.backend.repository.HolidayRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")      // activates application-test.properties (H2 database)
@Transactional               // rolls back all DB changes after each test → clean slate
class HolidayControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private HolidayRepository holidayRepository;

    // ── Helper:
    private HolidayDto buildDto(String date, String name) {
        HolidayDto dto = new HolidayDto();
        dto.setHolidayDate(date);
        dto.setHolidayName(name);
        return dto;
    }

    // ── Helper: insert a Holiday directly into DB (bypasses controller) ───────
    private Holiday insertHoliday(String date, String name) {
        Holiday h = new Holiday();
        h.setHolidayDate(LocalDate.parse(date));
        h.setHolidayName(name);
        return holidayRepository.save(h);
    }

    @BeforeEach
    void setUp() {
        // Ensure a clean holiday table before each test. Some tests may run outside
        // transactional context and seed data; clearing here keeps each test deterministic.
        holidayRepository.deleteAll();

    }

    @Test
    @DisplayName("TC_HOL_GET_ALL_01 | GET all holidays → 200 with list")
    void getAllHolidays_withData_returns200AndList() throws Exception {
        insertHoliday("2025-12-25", "Christmas Day");
        insertHoliday("2026-01-01", "New Year");

        mockMvc.perform(get("/api/holidays"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].holidayName").exists())
                .andExpect(jsonPath("$[0].holidayDate").exists());
    }

    @Test
    @DisplayName("TC_HOL_GET_ALL_02 | GET all holidays when DB empty → 200 with empty list")
    void getAllHolidays_emptyDatabase_returns200AndEmptyList() throws Exception {
        // No data inserted — DB is clean thanks to @Transactional
        mockMvc.perform(get("/api/holidays"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("TC_HOL_GET_01 | GET holiday by valid ID → 200 with correct data")
    void getHolidayById_validId_returns200() throws Exception {
        Holiday saved = insertHoliday("2025-12-25", "Christmas Day");

        mockMvc.perform(get("/api/holidays/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.holidayName").value("Christmas Day"))
                .andExpect(jsonPath("$.holidayDate").value("2025-12-25"));
    }

    @Test
    @DisplayName("TC_HOL_GET_02 | GET holiday by non-existent ID → 404 with error message")
    void getHolidayById_nonExistentId_returns404() throws Exception {
        mockMvc.perform(get("/api/holidays/{id}", 99999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("not found")));
    }

    @Test
    @DisplayName("TC_HOL_CREATE_01 | POST valid holiday → 201 Created, success true")
    void createHoliday_validRequest_returns201() throws Exception {
        HolidayDto dto = buildDto("2025-12-25", "Christmas Day");

        mockMvc.perform(post("/api/holidays")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Holiday created successfully"));
    }

    @Test
    @DisplayName("TC_HOL_CREATE_02 | POST duplicate date → 409 Conflict, success false")
    void createHoliday_duplicateDate_returns409() throws Exception {
        // Pre-insert a holiday for this date
        insertHoliday("2025-12-25", "Christmas Day");

        // Try to create another holiday on the same date
        HolidayDto dto = buildDto("2025-12-25", "Another Holiday");

        mockMvc.perform(post("/api/holidays")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @DisplayName("TC_HOL_CREATE_03 | POST missing holidayDate → 400 Bad Request")
    void createHoliday_missingDate_returns400() throws Exception {
        // @NotBlank on holidayDate triggers validation failure
        HolidayDto dto = buildDto("", "Christmas Day");

        mockMvc.perform(post("/api/holidays")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC_HOL_CREATE_04 | POST missing holidayName → 400 Bad Request")
    void createHoliday_missingName_returns400() throws Exception {
        // @NotBlank on holidayName triggers validation failure
        HolidayDto dto = buildDto("2025-12-25", "");

        mockMvc.perform(post("/api/holidays")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC_HOL_CREATE_05 | POST invalid date format → 409 with format error message")
    void createHoliday_invalidDateFormat_returns409() throws Exception {
        // Service throws RuntimeException for bad format → controller returns 409
        // NOTE: This is a potential bug — see review notes at bottom of file
        HolidayDto dto = buildDto("25-12-2025", "Christmas Day"); // wrong format: DD-MM-YYYY

        mockMvc.perform(post("/api/holidays")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())  // currently returns 409 — see bug note
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Invalid date format")));
    }

    @Test
    @DisplayName("TC_HOL_CREATE_06 | POST null body → 400 Bad Request")
    void createHoliday_nullBody_returns400() throws Exception {
        mockMvc.perform(post("/api/holidays")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC_HOL_MULTI_01 | POST list of valid holidays → 201 Created")
    void createMultipleHolidays_allValid_returns201() throws Exception {
        List<HolidayDto> dtos = List.of(
                buildDto("2025-12-25", "Christmas Day"),
                buildDto("2026-01-01", "New Year"),
                buildDto("2026-04-13", "Thingyan")
        );

        mockMvc.perform(post("/api/holidays/list")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dtos)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Holidays created successfully"));
    }

    @Test
    @DisplayName("TC_HOL_MULTI_02 | POST list with one duplicate → 409, no holidays saved")
    void createMultipleHolidays_oneDuplicate_returns409AndSavesNothing() throws Exception {
        // Pre-insert one holiday that will cause a conflict
        insertHoliday("2025-12-25", "Christmas Day");

        List<HolidayDto> dtos = List.of(
                buildDto("2026-01-01", "New Year"),      // valid
                buildDto("2025-12-25", "Christmas Day")  // duplicate → causes full rejection
        );

        mockMvc.perform(post("/api/holidays/list")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dtos)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @DisplayName("TC_HOL_MULTI_03 | POST empty list → 201 with success (edge case)")
    void createMultipleHolidays_emptyList_returns201() throws Exception {
        // Service receives empty list → saves nothing → no error thrown → 201
        List<HolidayDto> dtos = List.of();

        mockMvc.perform(post("/api/holidays/list")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dtos)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("TC_HOL_UPDATE_01 | PUT valid update → 200 OK, success true")
    void updateHoliday_validRequest_returns200() throws Exception {
        Holiday saved = insertHoliday("2025-12-25", "Christmas Day");
        HolidayDto updated = buildDto("2025-12-26", "Boxing Day");

        mockMvc.perform(put("/api/holidays/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Holiday updated successfully"));
    }

    @Test
    @DisplayName("TC_HOL_UPDATE_02 | PUT update with same date (no-op) → 200 OK")
    void updateHoliday_sameDate_returns200() throws Exception {
        // Updating name only, same date — service allows this (date unchanged = no conflict)
        Holiday saved = insertHoliday("2025-12-25", "Christmas Day");
        HolidayDto updated = buildDto("2025-12-25", "Christmas Day (Updated Name)");

        mockMvc.perform(put("/api/holidays/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("TC_HOL_UPDATE_03 | PUT update to existing date of ANOTHER holiday → 409 Conflict")
    void updateHoliday_dateConflictWithOtherHoliday_returns409() throws Exception {
        insertHoliday("2025-12-25", "Christmas Day");
        Holiday second = insertHoliday("2026-01-01", "New Year");

        // Try to move 'New Year' to Christmas date — conflict
        HolidayDto updated = buildDto("2025-12-25", "New Year");

        mockMvc.perform(put("/api/holidays/{id}", second.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @DisplayName("TC_HOL_UPDATE_04 | PUT non-existent ID → 404 Not Found")
    void updateHoliday_nonExistentId_returns404() throws Exception {
        HolidayDto dto = buildDto("2025-12-25", "Christmas Day");

        mockMvc.perform(put("/api/holidays/{id}", 99999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("not found")));
    }

    @Test
    @DisplayName("TC_HOL_DELETE_01 | DELETE existing holiday -> 200 OK, success true")
    void deleteHoliday_validId_returns200() throws Exception {
        Holiday saved = insertHoliday("2025-12-25", "Christmas Day");

        mockMvc.perform(delete("/api/holidays/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("All holidays deleted successfully"))
                .andExpect(jsonPath("$.deletedIds[0]").value(saved.getId()));
    }

    @Test
    @DisplayName("TC_HOL_DELETE_02 | DELETE non-existent ID -> 404 Not Found")
    void deleteHoliday_nonExistentId_returns404() throws Exception {
        mockMvc.perform(delete("/api/holidays/{id}", 99999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Failed to delete any holidays"))
                .andExpect(jsonPath("$.errors.99999").value(containsString("not found")));
    }

    @Test
    @DisplayName("TC_HOL_DELETE_03 | DELETE mixed existing and non-existent IDs -> 206 Partial Content")
    void deleteHoliday_mixedIds_returns206() throws Exception {
        Holiday saved = insertHoliday("2025-12-25", "Christmas Day");

        mockMvc.perform(delete("/api/holidays/{ids}", saved.getId() + ",99999"))
                .andExpect(status().isPartialContent())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Some holidays deleted successfully, some failed"))
                .andExpect(jsonPath("$.deletedIds[0]").value(saved.getId()))
                .andExpect(jsonPath("$.failedIds[0]").value(99999))
                .andExpect(jsonPath("$.errors.99999").value(containsString("not found")));
    }

}
