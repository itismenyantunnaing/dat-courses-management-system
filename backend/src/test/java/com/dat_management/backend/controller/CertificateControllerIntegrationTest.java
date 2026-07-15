package com.dat_management.backend.controller;

import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeCertificate;
import com.dat_management.backend.entity.EmployeeCertificate.CertificateType;
import com.dat_management.backend.entity.EmployeeCertificate.VerificationStatus;
import com.dat_management.backend.repository.EmployeeCertificateRepository;
import com.dat_management.backend.repository.EmployeeJapaneseProfileRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "file.upload-dir=target/certificate-test-uploads")
@Transactional
class CertificateControllerIntegrationTest {

    private static final Path UPLOAD_ROOT = Path.of("target/certificate-test-uploads");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private EmployeeCertificateRepository certificateRepository;

    @Autowired
    private EmployeeJapaneseProfileRepository japaneseProfileRepository;

    @BeforeEach
    void setUp() throws IOException {
        certificateRepository.deleteAll();
        japaneseProfileRepository.deleteAll();
        employeeRepository.deleteAll();
        resetUploadDirectory();
    }

    @Test
    @DisplayName("TC_CERT_INT_001 | POST upload valid certificate -> 201 Created")
    void uploadCertificate_validRequest_returns201AndPersistsCertificate() throws Exception {
        employeeRepository.save(employee("EMP001", "Alice Admin"));

        mockMvc.perform(multipart("/api/certificates/upload")
                        .file(pngFile("file", "jlpt.png"))
                        .param("employeeId", "EMP001")
                        .param("certificateType", "JLPT")
                        .param("japaneseLevel", "N2"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Certificate uploaded successfully"))
                .andExpect(jsonPath("$.data.employeeId").value("EMP001"))
                .andExpect(jsonPath("$.data.certificateType").value("JLPT"))
                .andExpect(jsonPath("$.data.japaneseLevel").value("N2"))
                .andExpect(jsonPath("$.data.verificationStatus").value("PENDING"));

        org.junit.jupiter.api.Assertions.assertEquals(1, certificateRepository.count());
        org.junit.jupiter.api.Assertions.assertTrue(Files.exists(UPLOAD_ROOT.resolve("EMP001_JLPT_N2.png")));
    }

    @Test
    @DisplayName("TC_CERT_INT_002 | POST upload duplicate certificate -> 400 Bad Request")
    void uploadCertificate_duplicateTypeAndLevel_returns400() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        insertCertificate(employee, CertificateType.JLPT, "N2", VerificationStatus.PENDING);

        mockMvc.perform(multipart("/api/certificates/upload")
                        .file(pngFile("file", "jlpt.png"))
                        .param("employeeId", "EMP001")
                        .param("certificateType", "JLPT")
                        .param("japaneseLevel", "N2"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @DisplayName("TC_CERT_INT_003 | POST upload PDF certificate -> 400 Bad Request")
    void uploadCertificate_pdfFile_returns400() throws Exception {
        employeeRepository.save(employee("EMP001", "Alice Admin"));

        MockMultipartFile pdf = new MockMultipartFile(
                "file",
                "certificate.pdf",
                "application/pdf",
                new byte[] {1, 2, 3});

        mockMvc.perform(multipart("/api/certificates/upload")
                        .file(pdf)
                        .param("employeeId", "EMP001")
                        .param("certificateType", "JLPT")
                        .param("japaneseLevel", "N2"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Only JPG and PNG")));
    }

    @Test
    @DisplayName("TC_CERT_INT_004 | GET my certificates -> 200 with employee certificate list")
    void getMyCertificates_existingEmployee_returnsCertificateList() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        insertCertificate(employee, CertificateType.JLPT, "N2", VerificationStatus.PENDING);

        mockMvc.perform(get("/api/certificates/my").param("employeeId", "EMP001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].employeeId").value("EMP001"))
                .andExpect(jsonPath("$.data[0].certificateType").value("JLPT"));
    }

    @Test
    @DisplayName("TC_CERT_INT_005 | GET certificate by owner -> 200 with matching certificate")
    void getCertificateById_owner_returns200() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        EmployeeCertificate certificate = insertCertificate(employee, CertificateType.JLPT, "N2", VerificationStatus.PENDING);

        mockMvc.perform(get("/api/certificates/{id}", certificate.getId()).param("employeeId", "EMP001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(certificate.getId()))
                .andExpect(jsonPath("$.data.employeeId").value("EMP001"));
    }

    @Test
    @DisplayName("TC_CERT_INT_006 | GET certificate by non-owner -> 404 Not Found")
    void getCertificateById_nonOwner_returns404() throws Exception {
        Employee owner = employeeRepository.save(employee("EMP001", "Alice Admin"));
        employeeRepository.save(employee("EMP002", "Other User"));
        EmployeeCertificate certificate = insertCertificate(owner, CertificateType.JLPT, "N2", VerificationStatus.PENDING);

        mockMvc.perform(get("/api/certificates/{id}", certificate.getId()).param("employeeId", "EMP002"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("permission")));
    }

    @Test
    @DisplayName("TC_CERT_INT_007 | GET certificate image -> 200 with PNG bytes")
    void getCertificateImage_existingImage_returnsImageBytes() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        EmployeeCertificate certificate = insertCertificate(employee, CertificateType.JLPT, "N2", VerificationStatus.PENDING);

        mockMvc.perform(get("/api/certificates/image/{id}", certificate.getId()).param("employeeId", "EMP001"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(header().string("Content-Disposition", containsString("EMP001_JLPT_N2.png")))
                .andExpect(content().bytes(new byte[] {7, 8, 9}));
    }

    @Test
    @DisplayName("TC_CERT_INT_008 | PUT metadata update without file -> 200 OK")
    void updateCertificate_metadataOnly_returns200AndUpdatesFields() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        EmployeeCertificate certificate = insertCertificate(employee, CertificateType.JLPT, "N2", VerificationStatus.PENDING);

        mockMvc.perform(multipart("/api/certificates/{id}", certificate.getId())
                        .param("employeeId", "EMP001")
                        .param("certificateType", "NAT_TEST")
                        .param("japaneseLevel", "N3")
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Certificate updated successfully"))
                .andExpect(jsonPath("$.data.certificateType").value("NAT_TEST"))
                .andExpect(jsonPath("$.data.japaneseLevel").value("N3"));
    }

    @Test
    @DisplayName("TC_CERT_INT_009 | DELETE own certificate -> 200 and removes certificate")
    void deleteCertificate_owner_returns200AndDeletesRecord() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        EmployeeCertificate certificate = insertCertificate(employee, CertificateType.JLPT, "N2", VerificationStatus.PENDING);

        mockMvc.perform(delete("/api/certificates/{id}", certificate.getId()).param("employeeId", "EMP001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Certificate deleted successfully"));

        org.junit.jupiter.api.Assertions.assertEquals(0, certificateRepository.count());
    }

    @Test
    @DisplayName("TC_CERT_INT_010 | DELETE another employee certificate -> 400 Bad Request")
    void deleteCertificate_nonOwner_returns400() throws Exception {
        Employee owner = employeeRepository.save(employee("EMP001", "Alice Admin"));
        employeeRepository.save(employee("EMP002", "Other User"));
        EmployeeCertificate certificate = insertCertificate(owner, CertificateType.JLPT, "N2", VerificationStatus.PENDING);

        mockMvc.perform(delete("/api/certificates/{id}", certificate.getId()).param("employeeId", "EMP002"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("You can only delete your own certificates."));
    }

    @Test
    @DisplayName("TC_CERT_INT_011 | PUT verify certificate -> 200, verified status, profile updated")
    void verifyCertificate_validRequest_returns200AndUpdatesProfile() throws Exception {
        Employee owner = employeeRepository.save(employee("EMP001", "Alice Admin"));
        employeeRepository.save(employee("EMP999", "Verifier User"));
        EmployeeCertificate certificate = insertCertificate(owner, CertificateType.JLPT, "N2", VerificationStatus.PENDING);

        mockMvc.perform(put("/api/certificates/{id}/verify", certificate.getId()).param("employeeId", "EMP999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Certificate verified successfully"))
                .andExpect(jsonPath("$.data.verificationStatus").value("APPROVED"))
                .andExpect(jsonPath("$.data.verifiedByEmployeeId").value("EMP999"));

        org.junit.jupiter.api.Assertions.assertTrue(japaneseProfileRepository.existsByEmployeeId("EMP001"));
        org.junit.jupiter.api.Assertions.assertEquals(
                "N2",
                japaneseProfileRepository.findByEmployeeId("EMP001").orElseThrow().getJlptHighestLevel());
    }

    @Test
    @DisplayName("TC_CERT_INT_012 | PUT reject certificate -> 200 and rejected status")
    void rejectCertificate_validRequest_returns200AndRejectedStatus() throws Exception {
        Employee owner = employeeRepository.save(employee("EMP001", "Alice Admin"));
        employeeRepository.save(employee("EMP999", "Verifier User"));
        EmployeeCertificate certificate = insertCertificate(owner, CertificateType.JLPT, "N2", VerificationStatus.PENDING);

        mockMvc.perform(put("/api/certificates/{id}/reject", certificate.getId()).param("employeeId", "EMP999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Certificate rejected successfully"))
                .andExpect(jsonPath("$.data.verificationStatus").value("REJECTED"))
                .andExpect(jsonPath("$.data.verifiedByEmployeeId").value("EMP999"));
    }

    @Test
    @DisplayName("TC_CERT_INT_013 | GET pending certificates -> 200 with pending list")
    void getPendingCertificates_returnsPendingList() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        employeeRepository.save(employee("EMP999", "Verifier User"));
        insertCertificate(employee, CertificateType.JLPT, "N2", VerificationStatus.PENDING);

        mockMvc.perform(get("/api/certificates/pending").param("employeeId", "EMP999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].verificationStatus").value("PENDING"));
    }

    @Test
    @DisplayName("TC_CERT_INT_014 | GET all certificates -> 200 with all certificate list")
    void getAllCertificates_returnsAllCertificates() throws Exception {
        Employee first = employeeRepository.save(employee("EMP001", "Alice Admin"));
        Employee second = employeeRepository.save(employee("EMP002", "Bob Staff"));
        employeeRepository.save(employee("EMP999", "Verifier User"));
        insertCertificate(first, CertificateType.JLPT, "N2", VerificationStatus.PENDING);
        insertCertificate(second, CertificateType.NAT_TEST, "N3", VerificationStatus.REJECTED);

        mockMvc.perform(get("/api/certificates/all").param("employeeId", "EMP999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(2)));
    }

    private static MockMultipartFile pngFile(String fieldName, String originalFilename) {
        return new MockMultipartFile(fieldName, originalFilename, "image/png", new byte[] {7, 8, 9});
    }

    private EmployeeCertificate insertCertificate(
            Employee employee,
            CertificateType type,
            String japaneseLevel,
            VerificationStatus status
    ) throws IOException {
        Files.createDirectories(UPLOAD_ROOT);
        String fileName = employee.getId() + "_" + type.name() + "_" + japaneseLevel + ".png";
        Files.write(UPLOAD_ROOT.resolve(fileName), new byte[] {7, 8, 9});

        EmployeeCertificate certificate = new EmployeeCertificate();
        certificate.setEmployee(employee);
        certificate.setCertificateType(type);
        certificate.setJapaneseLevel(japaneseLevel);
        certificate.setFilePath("uploads/certificates/" + fileName);
        certificate.setVerificationStatus(status);
        return certificateRepository.save(certificate);
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
