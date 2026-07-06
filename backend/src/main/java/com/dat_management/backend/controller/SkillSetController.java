package com.dat_management.backend.controller;

import com.dat_management.backend.dto.skillset.*;
import com.dat_management.backend.entity.DevelopmentType;
import com.dat_management.backend.service.SkillSetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class SkillSetController {

    private final SkillSetService skillSetService;

    // =============================================== LANGUAGE SKILLS
    // ===============================================

    // Create a new language skill for an employee
    @PostMapping("/language")
    public ResponseEntity<?> saveLanguageSkill(@Valid @RequestBody LanguageSkillDto dto, BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            LanguageSkillDto savedSkill = skillSetService.saveLanguageSkill(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Language skill created successfully",
                            "data", savedSkill));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Create multiple language skills for multiple employees
    @PostMapping("/language/bulk")
    public ResponseEntity<?> saveBulkLanguageSkills(@Valid @RequestBody List<LanguageSkillDto> dtos,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            List<LanguageSkillDto> savedSkills = skillSetService.saveBulkLanguageSkills(dtos);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Bulk language skills created successfully",
                            "data", savedSkills));
        } catch (RuntimeException e) {
            // Check if it's an employee not found error
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", "Bulk operation failed",
                            "errors", e.getMessage()));
        }
    }

    // Update an existing language skill by its ID
    @PutMapping("/language/{id}")
    public ResponseEntity<?> updateLanguageSkill(
            @PathVariable Integer id,
            @Valid @RequestBody LanguageSkillDto dto,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            dto.setId(id);
            LanguageSkillDto updatedSkill = skillSetService.updateLanguageSkill(dto);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Language skill updated successfully",
                    "data", updatedSkill));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Language profile not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Get a specific language skill by its ID
    @GetMapping("/language/{id}")
    public ResponseEntity<?> getLanguageSkillById(@PathVariable Integer id) {
        try {
            LanguageSkillDto skill = skillSetService.getLanguageSkillById(id);
            return ResponseEntity.ok(skill);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Get a language skill by employee ID
    @GetMapping("/language/employee/{employeeId}")
    public ResponseEntity<?> getLanguageSkill(@PathVariable String employeeId) {
        try {
            LanguageSkillDto skill = skillSetService.getLanguageSkill(employeeId);
            return ResponseEntity.ok(skill);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Get all language skills
    @GetMapping("/language")
    public ResponseEntity<List<LanguageSkillDto>> getAllLanguageSkills() {
        return ResponseEntity.ok(skillSetService.getAllLanguageSkills());
    }

    // ======================================== MANAGEMENT SKILLS
    // ================================================

    // Create a new management skill for an employee
    @PostMapping("/management")
    public ResponseEntity<?> saveManagementSkill(@Valid @RequestBody ManagementSkillDto dto, BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            ManagementSkillDto savedSkill = skillSetService.saveManagementSkill(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Management skill created successfully",
                            "data", savedSkill));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Create multiple management skills for multiple employees
    @PostMapping("/management/bulk")
    public ResponseEntity<?> saveBulkManagementSkills(@Valid @RequestBody List<ManagementSkillDto> dtos,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            List<ManagementSkillDto> savedSkills = skillSetService.saveBulkManagementSkills(dtos);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Bulk management skills created successfully",
                            "data", savedSkills));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", "Bulk operation failed",
                            "errors", e.getMessage()));
        }
    }

    // Update an existing management skill by its ID
    @PutMapping("/management/{id}")
    public ResponseEntity<?> updateManagementSkill(
            @PathVariable Integer id,
            @Valid @RequestBody ManagementSkillDto dto,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            dto.setId(id);
            ManagementSkillDto updatedSkill = skillSetService.updateManagementSkill(dto);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Management skill updated successfully",
                    "data", updatedSkill));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Management score not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Get a specific management skill by its ID
    @GetMapping("/management/{id}")
    public ResponseEntity<?> getManagementSkillById(@PathVariable Integer id) {
        try {
            ManagementSkillDto skill = skillSetService.getManagementSkillById(id);
            return ResponseEntity.ok(skill);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Get a management skill by employee ID
    @GetMapping("/management/employee/{employeeId}")
    public ResponseEntity<?> getManagementSkill(@PathVariable String employeeId) {
        try {
            ManagementSkillDto skill = skillSetService.getManagementSkill(employeeId);
            return ResponseEntity.ok(skill);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Get all management skills
    @GetMapping("/management")
    public ResponseEntity<List<ManagementSkillDto>> getAllManagementSkills() {
        return ResponseEntity.ok(skillSetService.getAllManagementSkills());
    }

    // =========================================== DEVELOPMENT SKILLS
    // ======================================

    // Create a new development skill for an employee
    @PostMapping("/development")
    public ResponseEntity<?> saveDevelopmentSkill(@Valid @RequestBody DevelopmentSkillDto dto, BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            DevelopmentSkillDto savedSkill = skillSetService.saveDevelopmentSkill(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Development skill created successfully",
                            "data", savedSkill));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Create multiple development skills for multiple employees
    @PostMapping("/development/bulk")
    public ResponseEntity<?> saveBulkDevelopmentSkills(@Valid @RequestBody List<DevelopmentSkillDto> dtos,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            List<DevelopmentSkillDto> savedSkills = skillSetService.saveBulkDevelopmentSkills(dtos);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Bulk development skills created successfully",
                            "data", savedSkills));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", "Bulk operation failed",
                            "errors", e.getMessage()));
        }
    }

    @PostMapping("/development/types/bulk")
    public ResponseEntity<List<DevelopmentType>> createDevelopmentTypes(
            @RequestBody List<Map<String, String>> requests) {
        List<DevelopmentType> createdTypes = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (Map<String, String> request : requests) {
            try {
                String name = request.get("developmentTypeName");
                DevelopmentType created = skillSetService.createDevelopmentType(name);
                createdTypes.add(created);
            } catch (RuntimeException e) {
                errors.add("Error creating development type '" + request.get("developmentTypeName") + "': "
                        + e.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            // If all failed, throw exception
            if (createdTypes.isEmpty()) {
                throw new RuntimeException("All bulk operations failed: " + String.join("; ", errors));
            }
            // If some succeeded, return partial success with warning (you might want to
            // handle this differently)
            // For now, we'll just return the successful ones and log errors
            System.err.println("Partial success - errors: " + String.join("; ", errors));
        }

        return new ResponseEntity<>(createdTypes, HttpStatus.CREATED);
    }

    @GetMapping("/development/types/active")
    public ResponseEntity<List<DevelopmentType>> getAllActiveDevelopmentTypes() {
        List<DevelopmentType> activeTypes = skillSetService.getAllActiveDevelopmentTypes();
        return ResponseEntity.ok(activeTypes);
    }

    // Update an existing development skill by its ID
    @PutMapping("/development/{id}")
    public ResponseEntity<?> updateDevelopmentSkill(
            @PathVariable Integer id,
            @Valid @RequestBody DevelopmentSkillDto dto,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            dto.setId(id);
            DevelopmentSkillDto updatedSkill = skillSetService.updateDevelopmentSkill(dto);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Development skill updated successfully",
                    "data", updatedSkill));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Development experience not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Get a specific development skill by its ID
    @GetMapping("/development/{id}")
    public ResponseEntity<?> getDevelopmentSkillById(@PathVariable Integer id) {
        try {
            DevelopmentSkillDto skill = skillSetService.getDevelopmentSkillById(id);
            return ResponseEntity.ok(skill);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Get all development skills for a specific employee
    @GetMapping("/development/employee/{employeeId}")
    public ResponseEntity<?> getDevelopmentSkillsByEmployee(@PathVariable String employeeId) {
        try {
            List<DevelopmentSkillDto> skills = skillSetService.getDevelopmentSkillsByEmployee(employeeId);
            return ResponseEntity.ok(skills);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Get all development skills
    @GetMapping("/development")
    public ResponseEntity<List<DevelopmentSkillDto>> getAllDevelopmentSkills() {
        return ResponseEntity.ok(skillSetService.getAllDevelopmentSkills());
    }

    // ============================================ TECHNICAL SKILLS
    // =================================================

    // Create a new technical skill for an employee
    @PostMapping("/technical")
    public ResponseEntity<?> saveTechnicalSkill(@Valid @RequestBody TechnicalSkillDto dto, BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            TechnicalSkillDto savedSkill = skillSetService.saveTechnicalSkill(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Technical skill created successfully",
                            "data", savedSkill));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Create multiple technical skills for multiple employees
    @PostMapping("/technical/bulk")
    public ResponseEntity<?> saveBulkTechnicalSkills(@Valid @RequestBody List<TechnicalSkillDto> dtos,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            List<TechnicalSkillDto> savedSkills = skillSetService.saveBulkTechnicalSkills(dtos);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Bulk technical skills created successfully",
                            "data", savedSkills));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", "Bulk operation failed",
                            "errors", e.getMessage()));
        }
    }

    // Update an existing technical skill by its ID
    @PutMapping("/technical/{id}")
    public ResponseEntity<?> updateTechnicalSkill(
            @PathVariable Integer id,
            @Valid @RequestBody TechnicalSkillDto dto,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            dto.setId(id);
            TechnicalSkillDto updatedSkill = skillSetService.updateTechnicalSkill(dto);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Technical skill updated successfully",
                    "data", updatedSkill));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Technical skill not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Get a specific technical skill by its ID
    @GetMapping("/technical/{id}")
    public ResponseEntity<?> getTechnicalSkillById(@PathVariable Integer id) {
        try {
            TechnicalSkillDto skill = skillSetService.getTechnicalSkillById(id);
            return ResponseEntity.ok(skill);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/technical/categories")
    public ResponseEntity<?> saveCategoryWithSkills(@RequestBody TechnicalSkillCategoryResponseDto dto) {
        try {
            TechnicalSkillCategoryResponseDto saved = skillSetService.saveCategoryWithSkills(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Category structure saved successfully",
                            "data", saved));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/technical/categories/bulk")
    public ResponseEntity<?> saveBulkCategoriesWithSkills(@RequestBody List<TechnicalSkillCategoryResponseDto> dtos) {
        try {
            List<TechnicalSkillCategoryResponseDto> savedCategories = skillSetService
                    .saveBulkCategoriesWithSkills(dtos);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Bulk categories saved successfully",
                            "data", savedCategories));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", "Bulk operation failed",
                            "errors", e.getMessage()));
        }
    }

    // Get all technical skills for a specific employee
    @GetMapping("/technical/employee/{employeeId}")
    public ResponseEntity<?> getTechnicalSkillsByEmployee(@PathVariable String employeeId) {
        try {
            List<TechnicalSkillDto> skills = skillSetService.getTechnicalSkillsByEmployee(employeeId);
            return ResponseEntity.ok(skills);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Employee not found with id:")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Get all technical skills
    @GetMapping("/technical")
    public ResponseEntity<List<TechnicalSkillDto>> getAllTechnicalSkills() {
        return ResponseEntity.ok(skillSetService.getAllTechnicalSkills());
    }

    // Get all technical skills grouped by category and sub-category structure
    @GetMapping("/technical/categories")
    public ResponseEntity<List<TechnicalSkillCategoryResponseDto>> getAllTechnicalSkillsWithCategoryStructure() {
        return ResponseEntity.ok(skillSetService.getAllTechnicalSkillsWithCategoryStructure());
    }

    // ==================== HELPER METHODS ====================

    // Generate error response for validation failures
    private ResponseEntity<Map<String, Object>> getErrorResponse(BindingResult result) {
        Map<String, String> errors = result.getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        FieldError::getDefaultMessage,
                        (existing, replacement) -> existing + "; " + replacement));

        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "Validation failed");
        response.put("errors", errors);
        return ResponseEntity.badRequest().body(response);
    }
}