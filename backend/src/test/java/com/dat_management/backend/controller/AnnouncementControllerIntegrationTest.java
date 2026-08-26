package com.dat_management.backend.controller;

import com.dat_management.backend.entity.Announcement;
import com.dat_management.backend.entity.AnnouncementCategory;
import com.dat_management.backend.repository.AnnouncementRepository;
import org.junit.jupiter.api.Assertions;
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

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * AnnouncementController had zero test coverage of any kind. Full CRUD is
 * covered here.
 *
 * Worth noting for the team: create() and update() handle an invalid
 * `category` value inconsistently. AnnouncementCategory.valueOf(...) throws
 * IllegalArgumentException (a RuntimeException) in both places. create()
 * only has a generic catch(Exception) block, so it correctly surfaces as
 * 500. update() has catch(RuntimeException) BEFORE catch(Exception), and
 * since IllegalArgumentException matches the RuntimeException branch first,
 * a bad category on an *existing* id comes back as 404 Not Found with the
 * IllegalArgumentException's message — same bug class, different (and
 * misleading) status code depending on which endpoint you hit. Test 009
 * documents the current behavior.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AnnouncementControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @BeforeEach
    void setUp() {
        announcementRepository.deleteAll();
    }

    @Test
    @DisplayName("TC_ANNOUNCE_INT_001 | POST create -> 201 with populated data")
    void create_validAnnouncement_returns201WithData() throws Exception {
        mockMvc.perform(post("/api/announcements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(announcementJson("New JLPT Session", "Sign ups open now", "COURSE", "Alice Admin")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("New JLPT Session"))
                .andExpect(jsonPath("$.data.text").value("Sign ups open now"))
                .andExpect(jsonPath("$.data.category").value("COURSE"))
                .andExpect(jsonPath("$.data.createdBy").value("Alice Admin"))
                .andExpect(jsonPath("$.data.createdAt").exists());

        Assertions.assertEquals(1, announcementRepository.count());
    }

    @Test
    @DisplayName("TC_ANNOUNCE_INT_002 | POST create with invalid category -> 500 (falls into the generic catch block)")
    void create_invalidCategory_returns500() throws Exception {
        mockMvc.perform(post("/api/announcements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(announcementJson("Bad Category", "text", "NOT_A_CATEGORY", "Alice Admin")))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false));

        Assertions.assertEquals(0, announcementRepository.count());
    }

    @Test
    @DisplayName("TC_ANNOUNCE_INT_003 | GET all -> 200 empty array when none exist")
    void getAll_noAnnouncements_returnsEmptyArray() throws Exception {
        mockMvc.perform(get("/api/announcements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("TC_ANNOUNCE_INT_004 | GET all -> 200 with every persisted announcement")
    void getAll_multipleAnnouncements_returnsAll() throws Exception {
        announcementRepository.save(announcement("Exam Reminder", "N2 exam is next week", AnnouncementCategory.EXAM, "Bob PMO"));
        announcementRepository.save(announcement("Office Closed", "Closed for holiday", AnnouncementCategory.OTHER, "Bob PMO"));

        mockMvc.perform(get("/api/announcements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("TC_ANNOUNCE_INT_005 | GET by id -> 200 with the matching announcement")
    void getById_existingAnnouncement_returnsIt() throws Exception {
        Announcement saved = announcementRepository.save(
                announcement("Exam Reminder", "N2 exam is next week", AnnouncementCategory.EXAM, "Bob PMO"));

        mockMvc.perform(get("/api/announcements/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.title").value("Exam Reminder"))
                .andExpect(jsonPath("$.category").value("EXAM"));
    }

    @Test
    @DisplayName("TC_ANNOUNCE_INT_006 | GET by unknown id -> 404 Not Found")
    void getById_unknownId_returns404() throws Exception {
        mockMvc.perform(get("/api/announcements/{id}", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TC_ANNOUNCE_INT_007 | PUT update -> 200, persists new title/text/category, keeps original createdBy")
    void update_validChanges_persistsAndKeepsOriginalCreator() throws Exception {
        Announcement saved = announcementRepository.save(
                announcement("Old Title", "Old text", AnnouncementCategory.OTHER, "Bob PMO"));

        mockMvc.perform(put("/api/announcements/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(announcementJson("New Title", "New text", "COURSE", "Someone Else")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("New Title"))
                .andExpect(jsonPath("$.data.category").value("COURSE"))
                .andExpect(jsonPath("$.data.createdBy").value("Bob PMO"));

        Announcement updated = announcementRepository.findById(saved.getId()).orElseThrow();
        Assertions.assertEquals("New Title", updated.getTitle());
        Assertions.assertEquals(AnnouncementCategory.COURSE, updated.getCategory());
        Assertions.assertEquals("Bob PMO", updated.getCreatedBy());
    }

    @Test
    @DisplayName("TC_ANNOUNCE_INT_008 | PUT update on unknown id -> 404 Not Found")
    void update_unknownId_returns404() throws Exception {
        mockMvc.perform(put("/api/announcements/{id}", 99999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(announcementJson("Title", "Text", "COURSE", "Alice Admin")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("TC_ANNOUNCE_INT_009 | PUT update with invalid category on an existing id -> current behavior is 404 (see class-level note)")
    void update_invalidCategoryOnExistingId_currentlyReturns404() throws Exception {
        Announcement saved = announcementRepository.save(
                announcement("Old Title", "Old text", AnnouncementCategory.OTHER, "Bob PMO"));

        mockMvc.perform(put("/api/announcements/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(announcementJson("Old Title", "Old text", "NOT_A_CATEGORY", "Bob PMO")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        Announcement unchanged = announcementRepository.findById(saved.getId()).orElseThrow();
        Assertions.assertEquals(AnnouncementCategory.OTHER, unchanged.getCategory());
    }

    @Test
    @DisplayName("TC_ANNOUNCE_INT_010 | DELETE existing announcement -> 200, removed from the DB")
    void delete_existingAnnouncement_removesIt() throws Exception {
        Announcement saved = announcementRepository.save(
                announcement("Exam Reminder", "N2 exam is next week", AnnouncementCategory.EXAM, "Bob PMO"));

        mockMvc.perform(delete("/api/announcements/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Assertions.assertTrue(announcementRepository.findById(saved.getId()).isEmpty());
    }

    @Test
    @DisplayName("TC_ANNOUNCE_INT_011 | DELETE unknown id -> 404 Not Found")
    void delete_unknownId_returns404() throws Exception {
        mockMvc.perform(delete("/api/announcements/{id}", 99999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    private static Announcement announcement(String title, String text, AnnouncementCategory category, String createdBy) {
        Announcement announcement = new Announcement();
        announcement.setTitle(title);
        announcement.setText(text);
        announcement.setCategory(category);
        announcement.setCreatedBy(createdBy);
        return announcement;
    }

    private static String announcementJson(String title, String text, String category, String createdBy) {
        return "{"
                + "\"title\":\"" + title + "\","
                + "\"text\":\"" + text + "\","
                + "\"category\":\"" + category + "\","
                + "\"createdBy\":\"" + createdBy + "\""
                + "}";
    }
}