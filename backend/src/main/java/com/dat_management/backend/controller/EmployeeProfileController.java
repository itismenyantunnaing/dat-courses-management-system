package com.dat_management.backend.controller;

import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.service.EmployeeProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EmployeeProfileController {

    private final EmployeeProfileService employeeProfileService;
    private final EmployeeRepository employeeRepository;

    /**
     * Combined endpoint to update employee profile including:
     * - Profile image
     * - isCorePersonnel
     * - hasJapanBusinessTrip
     * - dob
     */
    @PostMapping(value = "/{employeeId}/profile/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateEmployeeProfile(
            @PathVariable String employeeId,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "isCorePersonnel", required = false) Boolean isCorePersonnel,
            @RequestParam(value = "hasJapanBusinessTrip", required = false) Boolean hasJapanBusinessTrip,
            @RequestParam(value = "dob", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dob) {
        
        try {
            // Find existing employee
            Employee employee = employeeRepository.findByIdAndIsDeletedFalse(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employeeId));

            Map<String, Object> response = new HashMap<>();
            Map<String, Object> updatedFields = new HashMap<>(); // FIX: Create a separate map instead of casting
            
            response.put("employeeId", employeeId);
            response.put("updatedFields", updatedFields);

            // 1. Update profile image if file is provided
            if (file != null && !file.isEmpty()) {
                String imagePath = employeeProfileService.storeProfileImage(file, employeeId);
                response.put("profilePhotoPath", imagePath);
                updatedFields.put("profilePhotoPath", "Updated"); // FIX: Use the map directly
            }

            // 2. Update isCorePersonnel if provided
            if (isCorePersonnel != null) {
                employee.setIsCorePersonnel(isCorePersonnel);
                updatedFields.put("isCorePersonnel", isCorePersonnel);
            }

            // 3. Update hasJapanBusinessTrip if provided
            if (hasJapanBusinessTrip != null) {
                employee.setHasJapanBusinessTrip(hasJapanBusinessTrip);
                updatedFields.put("hasJapanBusinessTrip", hasJapanBusinessTrip);
            }

            // 4. Update dob if provided
            if (dob != null) {
                employee.setDob(dob);
                updatedFields.put("dob", dob);
            }

            // Save employee if any fields were updated
            if (!updatedFields.isEmpty()) { // FIX: Check the map directly
                employee.setUpdatedAt(LocalDateTime.now());
                Employee updatedEmployee = employeeRepository.save(employee);
                response.put("updatedAt", updatedEmployee.getUpdatedAt());
                response.put("message", "Employee profile updated successfully");
            } else {
                response.put("message", "No fields were updated. Please provide at least one field to update.");
            }

            // Return full employee data
            response.put("employee", getEmployeeMap(employee));
            
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (IOException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to upload image: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update employee profile: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Alternative combined endpoint using POST without employeeId in path
     */
    @PostMapping(value = "/profile/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateEmployeeProfileByParam(
            @RequestParam("employeeId") String employeeId,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "isCorePersonnel", required = false) Boolean isCorePersonnel,
            @RequestParam(value = "hasJapanBusinessTrip", required = false) Boolean hasJapanBusinessTrip,
            @RequestParam(value = "dob", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dob) {
        
        return updateEmployeeProfile(employeeId, file, isCorePersonnel, hasJapanBusinessTrip, dob);
    }


    /**
     * Delete employee profile image (separate endpoint for clarity)
     */
    @DeleteMapping("/{employeeId}/profile/image")
    public ResponseEntity<?> deleteProfileImage(@PathVariable String employeeId) {
        try {
            Employee employee = employeeRepository.findByIdAndIsDeletedFalse(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employeeId));
            
            if (employee.getProfilePhotoPath() != null && !employee.getProfilePhotoPath().isEmpty()) {
                employeeProfileService.deleteImage(employee.getProfilePhotoPath());
            }
            
            employee.setProfilePhotoPath(null);
            employee.setUpdatedAt(LocalDateTime.now());
            employeeRepository.save(employee);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile image deleted successfully");
            response.put("employeeId", employeeId);
            response.put("updatedAt", employee.getUpdatedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (IOException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to delete image: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Helper method to convert Employee to Map
     */
    private Map<String, Object> getEmployeeMap(Employee employee) {
        Map<String, Object> response = new HashMap<>();
        response.put("employeeId", employee.getId());
        response.put("profilePhotoPath", employee.getProfilePhotoPath());
        response.put("isCorePersonnel", employee.getIsCorePersonnel());
        response.put("hasJapanBusinessTrip", employee.getHasJapanBusinessTrip());
        response.put("dob", employee.getDob());
        return response;
    }
}