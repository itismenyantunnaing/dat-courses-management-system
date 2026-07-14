package com.dat_management.backend.controller;

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

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Import endpoint integration test for Holiday
 *
 * Endpoint under test: POST /api/holidays/list
 *
 * Note: HolidayControllerIntegrationTest already covers this endpoint's HTTP-response
 * behavior lightly (TC_HOL_MULTI_01/02/03). This class focuses specifically on the
 * import scenario and the resulting DB state, including the all-or-nothing rollback
 * behavior and the soft-delete reactivation path, which weren't covered there.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HolidayImportEndpointIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private HolidayRepository holidayRepository;

    @BeforeEach
    void cleanDatabase() {
        holidayRepository.deleteAll();
    }

    //Helpers
    private Holiday insertActiveHoliday(String date, String name) {
        Holiday h = new Holiday();
        h.setHolidayDate(LocalDate.parse(date));
        h.setHolidayName(name);
        h.setDeleted(false);
        return holidayRepository.saveAndFlush(h);
    }

    private Holiday insertSoftDeletedHoliday(String date, String name) {
        Holiday h = new Holiday();
        h.setHolidayDate(LocalDate.parse(date));
        h.setHolidayName(name);
        h.setDeleted(true);
        return holidayRepository.saveAndFlush(h);
    }

    @Test
    @DisplayName("TC_HOL_IMPORT_001 | POST bulk valid holidays -> persists all rows")
    void importHolidays_validBulkPayload_persistsAllHolidays() throws Exception {
        mockMvc.perform(post("/api/holidays/list")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "holidayDate": "2026-12-25", "holidayName": "Christmas Day" },
                                  { "holidayDate": "2027-01-01", "holidayName": "New Year" }
                                ]
                                """))
                .andExpect(status().isCreated());

        List<Holiday> holidays = holidayRepository.findAll();
        assertEquals(2, holidays.size());

        Holiday christmas = holidayRepository.findByHolidayDate(LocalDate.parse("2026-12-25")).orElseThrow();
        assertEquals("Christmas Day", christmas.getHolidayName());
        assertFalse(christmas.isDeleted());

        Holiday newYear = holidayRepository.findByHolidayDate(LocalDate.parse("2027-01-01")).orElseThrow();
        assertEquals("New Year", newYear.getHolidayName());
        assertFalse(newYear.isDeleted());
    }

    @Test
    @DisplayName("TC_HOL_IMPORT_002 | POST bulk with one date colliding with an existing active holiday -> entire batch rejected, no new rows persisted")
    void importHolidays_batchContainsExistingActiveDate_rejectsEntireBatch() throws Exception {
        insertActiveHoliday("2026-12-25", "Christmas Day");

        mockMvc.perform(post("/api/holidays/list")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "holidayDate": "2026-12-25", "holidayName": "Christmas Day (duplicate)" },
                                  { "holidayDate": "2027-03-15", "holidayName": "Valid New Holiday" }
                                ]
                                """))
                .andExpect(status().isConflict());

        // Neither the duplicate nor the otherwise-valid sibling row should be persisted --
        // the batch is validated as a whole before anything is saved.
        List<Holiday> holidays = holidayRepository.findAll();
        assertEquals(1, holidays.size());
        assertEquals("Christmas Day", holidays.get(0).getHolidayName());
    }

    @Test
    @DisplayName("TC_HOL_IMPORT_003 | POST bulk containing a soft-deleted holiday's date -> reactivates the existing row instead of creating a duplicate")
    void importHolidays_batchContainsSoftDeletedDate_reactivatesExistingRow() throws Exception {
        Holiday deleted = insertSoftDeletedHoliday("2026-11-05", "Old Name");

        mockMvc.perform(post("/api/holidays/list")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "holidayDate": "2026-11-05", "holidayName": "Reactivated Holiday" }
                                ]
                                """))
                .andExpect(status().isCreated());

        // Still exactly one row for that date -- reactivated, not duplicated.
        List<Holiday> holidays = holidayRepository.findAll();
        assertEquals(1, holidays.size());

        Holiday reactivated = holidayRepository.findById(deleted.getId()).orElseThrow();
        assertEquals("Reactivated Holiday", reactivated.getHolidayName());
        assertFalse(reactivated.isDeleted());
    }

    @Test
    @DisplayName("TC_HOL_IMPORT_004 | POST bulk with an invalid date format among valid rows -> entire batch rejected, DB unchanged")
    void importHolidays_batchContainsInvalidDateFormat_rejectsEntireBatch() throws Exception {
        mockMvc.perform(post("/api/holidays/list")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  { "holidayDate": "2026-06-01", "holidayName": "Valid Holiday" },
                                  { "holidayDate": "not-a-date", "holidayName": "Broken Holiday" }
                                ]
                                """))
                .andExpect(status().isConflict());

        assertTrue(holidayRepository.findAll().isEmpty());
    }
}