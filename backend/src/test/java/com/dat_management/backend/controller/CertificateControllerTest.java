package com.dat_management.backend.controller;

import com.dat_management.backend.dto.CertificateResponseDto;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.service.CertificateFileStorageService;
import com.dat_management.backend.service.CertificateService;
import com.dat_management.backend.service.EmployeeService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CertificateControllerTest {

    @Mock
    private CertificateService certificateService;

    @Mock
    private EmployeeService employeeService;

    @Mock
    private CertificateFileStorageService certificateFileStorageService;

    @Test
    void uploadCertificate_validRequest_returnsCreatedSuccessResponse() throws IOException {
        CertificateController controller = controller();
        Employee employee = employee("EMP001", "Alice Admin");
        CertificateResponseDto certificate = certificateDto(10, "EMP001", "JLPT", "N2", "PENDING");
        MockMultipartFile file = imageFile();

        when(employeeService.getEmployeeById("EMP001")).thenReturn(employee);
        when(certificateService.uploadCertificate(employee, "JLPT", "N2", file)).thenReturn(certificate);

        ResponseEntity<Map<String, Object>> response = controller.uploadCertificate("EMP001", "JLPT", "N2", file);

        Assertions.assertEquals(HttpStatus.CREATED, response.getStatusCode());
        Assertions.assertEquals(true, response.getBody().get("success"));
        Assertions.assertEquals("Certificate uploaded successfully", response.getBody().get("message"));
        Assertions.assertEquals(certificate, response.getBody().get("data"));
    }

    @Test
    void uploadCertificate_missingEmployee_returnsBadRequest() throws IOException {
        CertificateController controller = controller();
        MockMultipartFile file = imageFile();

        when(employeeService.getEmployeeById("UNKNOWN"))
                .thenThrow(new RuntimeException("Employee not found with ID: UNKNOWN"));

        ResponseEntity<Map<String, Object>> response = controller.uploadCertificate("UNKNOWN", "JLPT", "N2", file);

        Assertions.assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Assertions.assertEquals(false, response.getBody().get("success"));
        Assertions.assertEquals("Employee not found with ID: UNKNOWN", response.getBody().get("message"));
    }

    @Test
    void getMyCertificates_validEmployee_returnsCertificateList() {
        CertificateController controller = controller();
        Employee employee = employee("EMP001", "Alice Admin");
        List<CertificateResponseDto> certificates = List.of(certificateDto(10, "EMP001", "JLPT", "N2", "PENDING"));

        when(employeeService.getEmployeeById("EMP001")).thenReturn(employee);
        when(certificateService.getCertificatesByEmployee(employee)).thenReturn(certificates);

        ResponseEntity<Map<String, Object>> response = controller.getMyCertificates("EMP001");

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(true, response.getBody().get("success"));
        Assertions.assertEquals(certificates, response.getBody().get("data"));
    }

    @Test
    void getCertificateById_serviceThrows_returnsNotFound() {
        CertificateController controller = controller();
        Employee employee = employee("EMP001", "Alice Admin");

        when(employeeService.getEmployeeById("EMP001")).thenReturn(employee);
        when(certificateService.getCertificateById(99, employee))
                .thenThrow(new RuntimeException("Certificate not found with ID: 99"));

        ResponseEntity<Map<String, Object>> response = controller.getCertificateById(99, "EMP001");

        Assertions.assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        Assertions.assertEquals(false, response.getBody().get("success"));
        Assertions.assertEquals("Certificate not found with ID: 99", response.getBody().get("message"));
    }

    @Test
    void getCertificateImage_pngCertificate_returnsImageBytes() throws IOException {
        CertificateController controller = controller();
        Employee employee = employee("EMP001", "Alice Admin");
        CertificateResponseDto certificate = certificateDto(10, "EMP001", "JLPT", "N2", "PENDING");
        certificate.setFilePath("uploads/certificates/certificate.png");
        byte[] imageBytes = new byte[] {1, 2, 3};

        when(employeeService.getEmployeeById("EMP001")).thenReturn(employee);
        when(certificateService.getCertificateById(10, employee)).thenReturn(certificate);
        when(certificateFileStorageService.getFile("uploads/certificates/certificate.png")).thenReturn(imageBytes);

        ResponseEntity<byte[]> response = controller.getCertificateImage(10, "EMP001");

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(MediaType.IMAGE_PNG, response.getHeaders().getContentType());
        Assertions.assertArrayEquals(imageBytes, response.getBody());
        Assertions.assertTrue(response.getHeaders().getFirst("Content-Disposition").contains("certificate.png"));
    }

    @Test
    void updateCertificate_storageFailure_returnsInternalServerError() throws IOException {
        CertificateController controller = controller();
        Employee employee = employee("EMP001", "Alice Admin");
        MockMultipartFile file = imageFile();

        when(employeeService.getEmployeeById("EMP001")).thenReturn(employee);
        when(certificateService.updateCertificate(10, employee, "JLPT", "N2", file))
                .thenThrow(new IOException("disk full"));

        ResponseEntity<Map<String, Object>> response = controller.updateCertificate(10, "EMP001", "JLPT", "N2", file);

        Assertions.assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        Assertions.assertEquals(false, response.getBody().get("success"));
        Assertions.assertEquals("Error saving file: disk full", response.getBody().get("message"));
    }

    @Test
    void deleteCertificate_validOwner_returnsSuccessResponse() throws IOException {
        CertificateController controller = controller();
        Employee employee = employee("EMP001", "Alice Admin");

        when(employeeService.getEmployeeById("EMP001")).thenReturn(employee);

        ResponseEntity<Map<String, Object>> response = controller.deleteCertificate(10, "EMP001");

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(true, response.getBody().get("success"));
        Assertions.assertEquals("Certificate deleted successfully", response.getBody().get("message"));
        verify(certificateService).deleteCertificate(10, employee);
    }

    @Test
    void verifyCertificate_validRequest_returnsSuccessResponse() {
        CertificateController controller = controller();
        Employee verifier = employee("EMP999", "Verifier User");
        CertificateResponseDto certificate = certificateDto(10, "EMP001", "JLPT", "N2", "VERIFIED");

        when(employeeService.getEmployeeById("EMP999")).thenReturn(verifier);
        when(certificateService.verifyCertificate(10, verifier, "")).thenReturn(certificate);

        ResponseEntity<Map<String, Object>> response = controller.verifyCertificate(10, "EMP999", "");

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(true, response.getBody().get("success"));
        Assertions.assertEquals("Certificate verified successfully", response.getBody().get("message"));
        Assertions.assertEquals(certificate, response.getBody().get("data"));
    }

    @Test
    void getPendingCertificates_validEmployee_returnsPendingList() {
        CertificateController controller = controller();
        Employee verifier = employee("EMP999", "Verifier User");
        List<CertificateResponseDto> certificates = List.of(certificateDto(10, "EMP001", "JLPT", "N2", "PENDING"));

        when(employeeService.getEmployeeById("EMP999")).thenReturn(verifier);
        when(certificateService.getPendingCertificates()).thenReturn(certificates);

        ResponseEntity<Map<String, Object>> response = controller.getPendingCertificates("EMP999");

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(true, response.getBody().get("success"));
        Assertions.assertEquals(certificates, response.getBody().get("data"));
    }

    private CertificateController controller() {
        return new CertificateController(certificateService, employeeService, certificateFileStorageService);
    }

    private static MockMultipartFile imageFile() {
        return new MockMultipartFile("file", "certificate.png", "image/png", new byte[] {1, 2, 3});
    }

    private static Employee employee(String id, String name) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(name);
        return employee;
    }

    private static CertificateResponseDto certificateDto(
            Integer id,
            String employeeId,
            String certificateType,
            String japaneseLevel,
            String status
    ) {
        CertificateResponseDto dto = new CertificateResponseDto();
        dto.setId(id);
        dto.setEmployeeId(employeeId);
        dto.setEmployeeName("Alice Admin");
        dto.setCertificateType(certificateType);
        dto.setJapaneseLevel(japaneseLevel);
        dto.setFilePath("uploads/certificates/certificate.png");
        dto.setVerificationStatus(status);
        return dto;
    }
}
