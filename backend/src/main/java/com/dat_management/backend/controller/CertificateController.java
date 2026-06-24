package com.dat_management.backend.controller;

import com.dat_management.backend.dto.CertificateResponseDto;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.service.CertificateFileStorageService;
import com.dat_management.backend.service.CertificateService;
import com.dat_management.backend.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CertificateController {

    private final CertificateService certificateService;
    private final EmployeeService employeeService;
    private final CertificateFileStorageService certificateFileStorageService;

    private Employee getEmployee(String employeeId) {
        if (employeeId == null || employeeId.isEmpty()) {
            throw new RuntimeException("Employee ID is required");
        }
        Employee employee = employeeService.getEmployeeById(employeeId);
        if (employee == null) {
            throw new RuntimeException("Employee not found with ID: " + employeeId);
        }
        return employee;
    }

    // ==================== EMPLOYEE ENDPOINTS ====================

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadCertificate(
            @RequestParam("employeeId") String employeeId,
            @RequestParam("certificateType") String certificateType,
            @RequestParam("japaneseLevel") String japaneseLevel,
            @RequestParam("file") MultipartFile file) {
        try {
            Employee employee = getEmployee(employeeId);
            CertificateResponseDto certificate = certificateService.uploadCertificate(
                employee, certificateType, japaneseLevel, file
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Certificate uploaded successfully");
            response.put("data", certificate);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error saving file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyCertificates(
            @RequestParam("employeeId") String employeeId) {
        try {
            Employee employee = getEmployee(employeeId);
            List<CertificateResponseDto> certificates = certificateService.getCertificatesByEmployee(employee);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", certificates);
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCertificateById(
            @PathVariable Integer id,
            @RequestParam("employeeId") String employeeId) {
        try {
            Employee employee = getEmployee(employeeId);
            CertificateResponseDto certificate = certificateService.getCertificateById(id, employee);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", certificate);
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @GetMapping("/image/{id}")
    public ResponseEntity<byte[]> getCertificateImage(
            @PathVariable Integer id,
            @RequestParam("employeeId") String employeeId) {
        try {
            Employee employee = getEmployee(employeeId);
            CertificateResponseDto certificate = certificateService.getCertificateById(id, employee);
            
            byte[] imageData = certificateFileStorageService.getFile(certificate.getFilePath());
            
            // Determine content type based on file extension
            String filePath = certificate.getFilePath();
            String contentType = "image/jpeg"; // default
            if (filePath.toLowerCase().endsWith(".png")) {
                contentType = "image/png";
            } else if (filePath.toLowerCase().endsWith(".jpg") || filePath.toLowerCase().endsWith(".jpeg")) {
                contentType = "image/jpeg";
            }
            
            // Extract filename
            String filename = Paths.get(filePath).getFileName().toString();
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(imageData);
                    
        } catch (Exception e) {
            throw new RuntimeException("Error retrieving image: " + e.getMessage());
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> updateCertificate(
            @PathVariable Integer id,
            @RequestParam("employeeId") String employeeId,
            @RequestParam("certificateType") String certificateType,
            @RequestParam("japaneseLevel") String japaneseLevel,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            Employee employee = getEmployee(employeeId);
            CertificateResponseDto certificate = certificateService.updateCertificate(
                id, employee, certificateType, japaneseLevel, file
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Certificate updated successfully");
            response.put("data", certificate);
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error saving file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteCertificate(
            @PathVariable Integer id,
            @RequestParam("employeeId") String employeeId) {
        try {
            Employee employee = getEmployee(employeeId);
            certificateService.deleteCertificate(id, employee);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Certificate deleted successfully");
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error deleting file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ==================== APPROVER ENDPOINTS ====================

    @PutMapping("/{id}/verify")
    public ResponseEntity<Map<String, Object>> verifyCertificate(
            @PathVariable Integer id,
            @RequestParam("employeeId") String employeeId) {
        try {
            Employee employee = getEmployee(employeeId);
            CertificateResponseDto certificate = certificateService.verifyCertificate(id, employee);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Certificate verified successfully");
            response.put("data", certificate);
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectCertificate(
            @PathVariable Integer id,
            @RequestParam("employeeId") String employeeId) {
        try {
            Employee employee = getEmployee(employeeId);
            CertificateResponseDto certificate = certificateService.rejectCertificate(id, employee);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Certificate rejected successfully");
            response.put("data", certificate);
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<Map<String, Object>> getPendingCertificates(
            @RequestParam("employeeId") String employeeId) {
        try {
            getEmployee(employeeId); // Just to validate employee exists
            List<CertificateResponseDto> certificates = certificateService.getPendingCertificates();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", certificates);
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllCertificates(
            @RequestParam("employeeId") String employeeId) {
        try {
            getEmployee(employeeId); // Just to validate employee exists
            List<CertificateResponseDto> certificates = certificateService.getAllCertificates();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", certificates);
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

}
