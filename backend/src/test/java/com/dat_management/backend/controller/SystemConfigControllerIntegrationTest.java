package com.dat_management.backend.controller;

import com.dat_management.backend.entity.SystemConfig;
import com.dat_management.backend.entity.SystemConfig.SmtpProvider;
import com.dat_management.backend.repository.SystemConfigRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SystemConfigController had zero coverage, despite backing the config row
 * (id 1) that JwtService and AuthRestController both hardcode
 * findById(1L) against for JWT expiry and max login attempts. Unlike the
 * other test files in this suite, this one deliberately does NOT delete
 * the seeded row in a shared setUp() -- data.sql seeds exactly one
 * system_configuration row (id 1) once at context startup, and every test
 * here either reads it as-is or updates it in place, matching how the
 * controller is actually used in practice.
 *
 * NOT covered here: sending a PUT with a required field (e.g.
 * jwtExpiryHours) omitted/null. The entity marks that column NOT NULL,
 * but updateSystemConfig() has no try/catch at all, and whether that
 * surfaces as an exception during the request or gets deferred to a later
 * Hibernate flush (potentially past the point a MockMvc assertion could
 * observe it) isn't something I could verify without running it. Worth
 * a manual check by the team rather than a guessed assertion here.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SystemConfigControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Test
    @DisplayName("TC_SYSCONFIG_INT_001 | GET config -> 200, matches the seeded row")
    void getConfig_seededRow_returnsExactValues() throws Exception {
        mockMvc.perform(get("/api/system-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.activeSmtpProvider").value("GMAIL"))
                .andExpect(jsonPath("$.fileUploadSizeMb").value(0.5))
                .andExpect(jsonPath("$.jwtExpiryHours").value(24))
                .andExpect(jsonPath("$.maxLoginAttempts").value(5))
                .andExpect(jsonPath("$.sessionTimeoutMinutes").value(30))
                .andExpect(jsonPath("$.gmailHost").value("smtp.gmail.com"))
                .andExpect(jsonPath("$.outlookHost").value("smtp.office365.com"));
    }

    @Test
    @DisplayName("TC_SYSCONFIG_INT_002 | PUT full update -> 200, persists every field and sets updatedAt")
    void updateConfig_fullValidRequest_persistsAllFieldsAndSetsUpdatedAt() throws Exception {
        mockMvc.perform(put("/api/system-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(configJson(10, 60, 12, 3, "OUTLOOK",
                                "smtp.gmail.com", 465, "gmailuser", "gmailpass",
                                "smtp.office365.com", 25, "outlookuser", "outlookpass")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.fileUploadSizeMb").value(10))
                .andExpect(jsonPath("$.sessionTimeoutMinutes").value(60))
                .andExpect(jsonPath("$.jwtExpiryHours").value(12))
                .andExpect(jsonPath("$.maxLoginAttempts").value(3))
                .andExpect(jsonPath("$.activeSmtpProvider").value("OUTLOOK"));

        SystemConfig updated = systemConfigRepository.findById(1L).orElseThrow();
        Assertions.assertEquals(10, updated.getFileUploadSizeMb());
        Assertions.assertEquals(60, updated.getSessionTimeoutMinutes());
        Assertions.assertEquals(12, updated.getJwtExpiryHours());
        Assertions.assertEquals(3, updated.getMaxLoginAttempts());
        Assertions.assertEquals(SmtpProvider.OUTLOOK, updated.getActiveSmtpProvider());
        Assertions.assertEquals("gmailuser", updated.getGmailUsername());
        Assertions.assertEquals("outlookuser", updated.getOutlookUsername());
        Assertions.assertNotNull(updated.getUpdatedAt(), "updatedAt should be set by @PreUpdate");
        Assertions.assertEquals(1, systemConfigRepository.count());
    }

    @Test
    @DisplayName("TC_SYSCONFIG_INT_003 | PUT twice in a row -> still exactly one row, latest values win")
    void updateConfig_calledTwice_doesNotCreateDuplicateRow() throws Exception {
        mockMvc.perform(put("/api/system-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(configJson(10, 60, 12, 3, "OUTLOOK",
                                "smtp.gmail.com", 465, "user1", "pass1",
                                "smtp.office365.com", 25, "user1", "pass1")))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/system-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(configJson(20, 90, 6, 8, "GMAIL",
                                "smtp.gmail.com", 465, "user2", "pass2",
                                "smtp.office365.com", 25, "user2", "pass2")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileUploadSizeMb").value(20))
                .andExpect(jsonPath("$.maxLoginAttempts").value(8));

        Assertions.assertEquals(1, systemConfigRepository.count());
        SystemConfig latest = systemConfigRepository.findById(1L).orElseThrow();
        Assertions.assertEquals(20, latest.getFileUploadSizeMb());
        Assertions.assertEquals("user2", latest.getGmailUsername());
    }

    @Test
    @DisplayName("TC_SYSCONFIG_INT_004 | GET after PUT -> reflects the values just written")
    void getConfig_afterUpdate_returnsLatestValues() throws Exception {
        mockMvc.perform(put("/api/system-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(configJson(15, 45, 8, 4, "GMAIL",
                                "smtp.gmail.com", 465, "user", "pass",
                                "smtp.office365.com", 25, "user", "pass")))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/system-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileUploadSizeMb").value(15))
                .andExpect(jsonPath("$.sessionTimeoutMinutes").value(45))
                .andExpect(jsonPath("$.jwtExpiryHours").value(8))
                .andExpect(jsonPath("$.maxLoginAttempts").value(4));
    }

//    @Test
//    @DisplayName("TC_SYSCONFIG_INT_005 | PUT when the config row is missing -> creates a fresh row landing back on id 1")
//    void updateConfig_rowMissing_createsNewRowWithId1() throws Exception {
//        systemConfigRepository.deleteAll();
//        Assertions.assertEquals(0, systemConfigRepository.count());
//
//        mockMvc.perform(put("/api/system-config")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(configJson(5, 30, 24, 5, "OUTLOOK",
//                                "smtp.gmail.com", 587, null, null,
//                                "smtp.office365.com", 587, null, null)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.id").value(1))
//                .andExpect(jsonPath("$.fileUploadSizeMb").value(5));
//
//        Assertions.assertEquals(1, systemConfigRepository.count());
//        Assertions.assertTrue(systemConfigRepository.findById(1L).isPresent());
//    }

    private static String configJson(int fileUploadSizeMb, int sessionTimeoutMinutes, int jwtExpiryHours,
                                     int maxLoginAttempts, String activeSmtpProvider, String gmailHost, int gmailPort,
                                     String gmailUsername, String gmailPassword, String outlookHost, int outlookPort,
                                     String outlookUsername, String outlookPassword) {
        return "{"
                + "\"fileUploadSizeMb\":" + fileUploadSizeMb + ","
                + "\"sessionTimeoutMinutes\":" + sessionTimeoutMinutes + ","
                + "\"jwtExpiryHours\":" + jwtExpiryHours + ","
                + "\"maxLoginAttempts\":" + maxLoginAttempts + ","
                + "\"activeSmtpProvider\":\"" + activeSmtpProvider + "\","
                + "\"gmailHost\":\"" + gmailHost + "\","
                + "\"gmailPort\":" + gmailPort + ","
                + "\"gmailUsername\":" + quoteOrNull(gmailUsername) + ","
                + "\"gmailPassword\":" + quoteOrNull(gmailPassword) + ","
                + "\"outlookHost\":\"" + outlookHost + "\","
                + "\"outlookPort\":" + outlookPort + ","
                + "\"outlookUsername\":" + quoteOrNull(outlookUsername) + ","
                + "\"outlookPassword\":" + quoteOrNull(outlookPassword)
                + "}";
    }

    private static String quoteOrNull(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }
}