package com.dat_management.backend.controller;

import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.EmployeeRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Comparator;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * EmployeeProfileController had zero coverage. Follows the same real
 * file-storage pattern CertificateControllerIntegrationTest already
 * established: redirect the upload directory to a target/ folder via
 * @TestPropertySource instead of mocking the storage service, so this
 * actually exercises EmployeeProfileService's real file I/O.
 *
 * NOTE: storeProfileImage() throws a plain RuntimeException for a
 * disallowed file type. The controller's catch order is
 * catch(RuntimeException) BEFORE catch(IOException)/catch(Exception), and
 * since that's the exact same exception type used for "employee not
 * found", an invalid file type on an *existing* employee currently comes
 * back mislabeled as 404 Not Found instead of a 400/422 — same bug shape
 * documented for AnnouncementController.update(). Test 002 documents the
 * current behavior.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "file.profile-upload-dir=target/profile-test-uploads")
@Transactional
class EmployeeProfileControllerIntegrationTest {

    private static final Path UPLOAD_ROOT = Path.of("target/profile-test-uploads");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EmployeeRepository employeeRepository;

    @BeforeEach
    void setUp() throws IOException {
        employeeRepository.deleteAll();
        resetUploadDirectory();
    }

    @Test
    @DisplayName("TC_EMPPROFILE_INT_001 | POST profile/update with a valid image -> 200, file written to disk, path persisted")
    void updateProfile_validImage_savesFileAndPersistsPath() throws Exception {
        employeeRepository.save(employee("EMP001", "Alice Admin"));

        mockMvc.perform(multipart("/api/employees/{employeeId}/profile/update", "EMP001")
                        .file(pngFile("file", "photo.png")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.employeeId").value("EMP001"))
                .andExpect(jsonPath("$.message").value("Employee profile updated successfully"))
                .andExpect(jsonPath("$.profilePhotoPath").exists())
                .andExpect(jsonPath("$.updatedFields.profilePhotoPath").value("Updated"));

        Employee updated = employeeRepository.findById("EMP001").orElseThrow();
        Assertions.assertNotNull(updated.getProfilePhotoPath());
        Assertions.assertTrue(updated.getProfilePhotoPath().startsWith("/profiles/employee_EMP001_"));

        boolean fileExists = Files.list(UPLOAD_ROOT)
                .anyMatch(path -> path.getFileName().toString().matches("employee_EMP001_\\d+\\.png"));
        Assertions.assertTrue(fileExists, "uploaded file should exist on disk");
    }

    @Test
    @DisplayName("TC_EMPPROFILE_INT_002 | POST profile/update with a disallowed file type -> current behavior is 404 (see class-level note)")
    void updateProfile_disallowedFileType_currentlyReturns404() throws Exception {
        employeeRepository.save(employee("EMP001", "Alice Admin"));

        MockMultipartFile pdf = new MockMultipartFile("file", "resume.pdf", "application/pdf", new byte[] {1, 2, 3});

        mockMvc.perform(multipart("/api/employees/{employeeId}/profile/update", "EMP001")
                        .file(pdf))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Only JPG, JPEG and PNG image files are allowed"));

        Employee unchanged = employeeRepository.findById("EMP001").orElseThrow();
        Assertions.assertNull(unchanged.getProfilePhotoPath());
        Assertions.assertEquals(0, countUploadedFiles());
    }

    @Test
    @DisplayName("TC_EMPPROFILE_INT_003 | POST profile/update with isCorePersonnel + hasJapanBusinessTrip + dob (no file) -> 200, persists all three")
    void updateProfile_flagsAndDobWithoutFile_persistsAllThree() throws Exception {
        employeeRepository.save(employee("EMP001", "Alice Admin"));

        mockMvc.perform(multipart("/api/employees/{employeeId}/profile/update", "EMP001")
                        .param("isCorePersonnel", "true")
                        .param("hasJapanBusinessTrip", "true")
                        .param("dob", "1990-05-15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Employee profile updated successfully"))
                .andExpect(jsonPath("$.updatedFields.isCorePersonnel").value(true))
                .andExpect(jsonPath("$.updatedFields.hasJapanBusinessTrip").value(true))
                .andExpect(jsonPath("$.updatedFields.dob").value("1990-05-15"))
                .andExpect(jsonPath("$.employee.profilePhotoPath").value(nullValue()));

        Employee updated = employeeRepository.findById("EMP001").orElseThrow();
        Assertions.assertTrue(updated.getIsCorePersonnel());
        Assertions.assertTrue(updated.getHasJapanBusinessTrip());
        Assertions.assertEquals(LocalDate.of(1990, 5, 15), updated.getDob());
        Assertions.assertEquals(0, countUploadedFiles());
    }

    @Test
    @DisplayName("TC_EMPPROFILE_INT_004 | POST profile/update with no fields at all -> 200, nothing changes")
    void updateProfile_noFieldsProvided_returnsNoFieldsUpdatedMessage() throws Exception {
        Employee saved = employeeRepository.save(employee("EMP001", "Alice Admin"));
        var updatedAtBeforeCall = employeeRepository.findById(saved.getId()).orElseThrow().getUpdatedAt();

        mockMvc.perform(multipart("/api/employees/{employeeId}/profile/update", "EMP001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("No fields were updated. Please provide at least one field to update."));

        Employee unchanged = employeeRepository.findById("EMP001").orElseThrow();
        Assertions.assertEquals(updatedAtBeforeCall, unchanged.getUpdatedAt(),
                "updatedAt should be untouched when no fields were provided");
    }

    @Test
    @DisplayName("TC_EMPPROFILE_INT_005 | POST profile/update for unknown employeeId -> 404 Not Found")
    void updateProfile_unknownEmployeeId_returns404() throws Exception {
        mockMvc.perform(multipart("/api/employees/{employeeId}/profile/update", "UNKNOWN")
                        .param("isCorePersonnel", "true"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Employee not found with id: UNKNOWN"));
    }

    @Test
    @DisplayName("TC_EMPPROFILE_INT_006 | POST profile/update (employeeId as request param) -> 200, delegates correctly")
    void updateProfileByParam_validRequest_delegatesToPathVariantSuccessfully() throws Exception {
        employeeRepository.save(employee("EMP001", "Alice Admin"));

        mockMvc.perform(multipart("/api/employees/profile/update")
                        .param("employeeId", "EMP001")
                        .param("isCorePersonnel", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.employeeId").value("EMP001"))
                .andExpect(jsonPath("$.updatedFields.isCorePersonnel").value(true));

        Employee updated = employeeRepository.findById("EMP001").orElseThrow();
        Assertions.assertTrue(updated.getIsCorePersonnel());
    }

    @Test
    @DisplayName("TC_EMPPROFILE_INT_007 | POST profile/update with a second image -> replaces the first on disk and in the DB")
    void updateProfile_secondImageUpload_replacesFirstOnDiskAndInDb() throws Exception {
        employeeRepository.save(employee("EMP001", "Alice Admin"));

        mockMvc.perform(multipart("/api/employees/{employeeId}/profile/update", "EMP001")
                        .file(pngFile("file", "first.png")))
                .andExpect(status().isOk());
        String firstPath = employeeRepository.findById("EMP001").orElseThrow().getProfilePhotoPath();

        Thread.sleep(5); // ensure the timestamp-based filename actually differs
        mockMvc.perform(multipart("/api/employees/{employeeId}/profile/update", "EMP001")
                        .file(pngFile("file", "second.png")))
                .andExpect(status().isOk());
        String secondPath = employeeRepository.findById("EMP001").orElseThrow().getProfilePhotoPath();

        Assertions.assertNotEquals(firstPath, secondPath);
        Assertions.assertEquals(1, countUploadedFiles(), "old file should have been deleted when the new one was stored");
    }

    @Test
    @DisplayName("TC_EMPPROFILE_INT_008 | DELETE profile image -> 200, removes the file from disk and clears the DB path")
    void deleteProfileImage_existingImage_removesFileAndClearsPath() throws Exception {
        Employee saved = employeeRepository.save(employee("EMP001", "Alice Admin"));
        mockMvc.perform(multipart("/api/employees/{employeeId}/profile/update", "EMP001")
                        .file(pngFile("file", "photo.png")))
                .andExpect(status().isOk());
        Assertions.assertEquals(1, countUploadedFiles());

        mockMvc.perform(delete("/api/employees/{employeeId}/profile/image", "EMP001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Profile image deleted successfully"))
                .andExpect(jsonPath("$.employeeId").value("EMP001"));

        Employee updated = employeeRepository.findById(saved.getId()).orElseThrow();
        Assertions.assertNull(updated.getProfilePhotoPath());
        Assertions.assertEquals(0, countUploadedFiles());
    }

    @Test
    @DisplayName("TC_EMPPROFILE_INT_009 | DELETE profile image when none is set -> 200, graceful no-op")
    void deleteProfileImage_noImageSet_returns200WithoutError() throws Exception {
        employeeRepository.save(employee("EMP001", "Alice Admin"));

        mockMvc.perform(delete("/api/employees/{employeeId}/profile/image", "EMP001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Profile image deleted successfully"));
    }

    @Test
    @DisplayName("TC_EMPPROFILE_INT_010 | DELETE profile image for unknown employeeId -> 404 Not Found")
    void deleteProfileImage_unknownEmployeeId_returns404() throws Exception {
        mockMvc.perform(delete("/api/employees/{employeeId}/profile/image", "UNKNOWN"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Employee not found with id: UNKNOWN"));
    }

    private static long countUploadedFiles() throws IOException {
        try (var paths = Files.list(UPLOAD_ROOT)) {
            return paths.count();
        }
    }

    private static MockMultipartFile pngFile(String fieldName, String originalFilename) {
        return new MockMultipartFile(fieldName, originalFilename, "image/png", new byte[] {7, 8, 9});
    }

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

    private static void resetUploadDirectory() throws IOException {
        if (Files.exists(UPLOAD_ROOT)) {
            try (var paths = Files.walk(UPLOAD_ROOT)) {
                paths.sorted(Comparator.reverseOrder())
                        .forEach(path -> {
                            try {
                                Files.delete(path);
                            } catch (IOException e) {
                                throw new RuntimeException(e);
                            }
                        });
            }
        }
        Files.createDirectories(UPLOAD_ROOT);
    }
}