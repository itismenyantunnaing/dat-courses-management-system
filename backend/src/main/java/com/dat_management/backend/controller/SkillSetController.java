package com.dat_management.backend.controller;

import com.dat_management.backend.dto.skillset.*;
import com.dat_management.backend.entity.DevelopmentType;
import com.dat_management.backend.service.AuditLogService;
import com.dat_management.backend.service.SkillSetService;
import jakarta.servlet.http.HttpServletRequest;
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

    private static final String MODULE = "SKILLS";

    private final SkillSetService skillSetService;
    private final AuditLogService auditLogService;
    private final HttpServletRequest httpServletRequest;

    // =============================================== LANGUAGE SKILLS
    // ===============================================

    @PostMapping("/language")
    public ResponseEntity<?> saveLanguageSkill(@Valid @RequestBody LanguageSkillDto dto, BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            LanguageSkillDto savedSkill = skillSetService.saveLanguageSkill(dto);
            auditLogService.log("Create", MODULE,
                    "New language skill added for employee " + savedSkill.getEmployeeId(),
                    null, savedSkill, httpServletRequest);
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

    @PostMapping("/language/bulk")
    public ResponseEntity<?> saveBulkLanguageSkills(@Valid @RequestBody List<LanguageSkillDto> dtos,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            List<LanguageSkillDto> savedSkills = skillSetService.saveBulkLanguageSkills(dtos);
            auditLogService.log("Create", MODULE,
                    "Bulk language skill import - " + savedSkills.size() + " added",
                    null, Map.of("count", savedSkills.size()), httpServletRequest);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Bulk language skills created successfully",
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

    @PutMapping("/language/{id}")
    public ResponseEntity<?> updateLanguageSkill(
            @PathVariable Integer id,
            @Valid @RequestBody LanguageSkillDto dto,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            LanguageSkillDto oldValue = skillSetService.getLanguageSkillById(id);
            dto.setId(id);
            LanguageSkillDto updatedSkill = skillSetService.updateLanguageSkill(dto);
            auditLogService.log("Update", MODULE,
                    "Language skill updated at ID " + id,
                    oldValue, updatedSkill, httpServletRequest);
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

    @DeleteMapping("/language/{id}")
    public ResponseEntity<?> deleteLanguageSkill(@PathVariable Integer id) {
        try {
            LanguageSkillDto oldValue = skillSetService.getLanguageSkillById(id);
            skillSetService.deleteLanguageSkill(id);
            auditLogService.log("Delete", MODULE,
                    "Language skill removed at ID " + id,
                    oldValue, null, httpServletRequest);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

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

    @GetMapping("/language")
    public ResponseEntity<List<LanguageSkillDto>> getAllLanguageSkills() {
        return ResponseEntity.ok(skillSetService.getAllLanguageSkills());
    }

    // ======================================== MANAGEMENT SKILLS
    // ================================================

    @PostMapping("/management")
    public ResponseEntity<?> saveManagementSkill(@Valid @RequestBody ManagementSkillDto dto, BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            ManagementSkillDto savedSkill = skillSetService.saveManagementSkill(dto);
            auditLogService.log("Create", MODULE,
                    "New management skill added for employee " + savedSkill.getEmployeeId(),
                    null, savedSkill, httpServletRequest);
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

    @PostMapping("/management/bulk")
    public ResponseEntity<?> saveBulkManagementSkills(@Valid @RequestBody List<ManagementSkillDto> dtos,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            List<ManagementSkillDto> savedSkills = skillSetService.saveBulkManagementSkills(dtos);
            auditLogService.log("Create", MODULE,
                    "Bulk management skill import - " + savedSkills.size() + " added",
                    null, Map.of("count", savedSkills.size()), httpServletRequest);
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

    @PutMapping("/management/{id}")
    public ResponseEntity<?> updateManagementSkill(
            @PathVariable Integer id,
            @Valid @RequestBody ManagementSkillDto dto,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            ManagementSkillDto oldValue = skillSetService.getManagementSkillById(id);
            dto.setId(id);
            ManagementSkillDto updatedSkill = skillSetService.updateManagementSkill(dto);
            auditLogService.log("Update", MODULE,
                    "Management skill updated at ID " + id,
                    oldValue, updatedSkill, httpServletRequest);
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

    @DeleteMapping("/management/{id}")
    public ResponseEntity<?> deleteManagementSkill(@PathVariable Integer id) {
        try {
            ManagementSkillDto oldValue = skillSetService.getManagementSkillById(id);
            skillSetService.deleteManagementSkill(id);
            auditLogService.log("Delete", MODULE,
                    "Management skill removed at ID " + id,
                    oldValue, null, httpServletRequest);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

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

    @GetMapping("/management")
    public ResponseEntity<List<ManagementSkillDto>> getAllManagementSkills() {
        return ResponseEntity.ok(skillSetService.getAllManagementSkills());
    }

    // =========================================== DEVELOPMENT SKILLS
    // ======================================

    @PostMapping("/development")
    public ResponseEntity<?> saveDevelopmentSkill(@Valid @RequestBody DevelopmentSkillDto dto, BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            DevelopmentSkillDto savedSkill = skillSetService.saveDevelopmentSkill(dto);
            auditLogService.log("Create", MODULE,
                    "New development skill added for employee " + savedSkill.getEmployeeId(),
                    null, savedSkill, httpServletRequest);
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

    @PostMapping("/development/bulk")
    public ResponseEntity<?> saveBulkDevelopmentSkills(@Valid @RequestBody List<DevelopmentSkillDto> dtos,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            List<DevelopmentSkillDto> savedSkills = skillSetService.saveBulkDevelopmentSkills(dtos);
            auditLogService.log("Create", MODULE,
                    "Bulk development skill import - " + savedSkills.size() + " added",
                    null, Map.of("count", savedSkills.size()), httpServletRequest);
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
            if (createdTypes.isEmpty()) {
                throw new RuntimeException("All bulk operations failed: " + String.join("; ", errors));
            }
            System.err.println("Partial success - errors: " + String.join("; ", errors));
        }

        auditLogService.log("Create", MODULE,
                "Bulk development types created - " + createdTypes.size() + " added",
                null, Map.of("count", createdTypes.size()), httpServletRequest);

        return new ResponseEntity<>(createdTypes, HttpStatus.CREATED);
    }

    @GetMapping("/development/types/active")
    public ResponseEntity<List<DevelopmentType>> getAllActiveDevelopmentTypes() {
        List<DevelopmentType> activeTypes = skillSetService.getAllActiveDevelopmentTypes();
        return ResponseEntity.ok(activeTypes);
    }

    @PutMapping("/development/{id}")
    public ResponseEntity<?> updateDevelopmentSkill(
            @PathVariable Integer id,
            @Valid @RequestBody DevelopmentSkillDto dto,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            DevelopmentSkillDto oldValue = skillSetService.getDevelopmentSkillById(id);
            dto.setId(id);
            DevelopmentSkillDto updatedSkill = skillSetService.updateDevelopmentSkill(dto);
            auditLogService.log("Update", MODULE,
                    "Development skill updated at ID " + id,
                    oldValue, updatedSkill, httpServletRequest);
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

    @DeleteMapping("/development/{id}")
    public ResponseEntity<?> deleteDevelopmentSkill(@PathVariable Integer id) {
        try {
            DevelopmentSkillDto oldValue = skillSetService.getDevelopmentSkillById(id);
            skillSetService.deleteDevelopmentSkill(id);
            auditLogService.log("Delete", MODULE,
                    "Development skill removed at ID " + id,
                    oldValue, null, httpServletRequest);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

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

    @GetMapping("/development")
    public ResponseEntity<List<DevelopmentSkillDto>> getAllDevelopmentSkills() {
        return ResponseEntity.ok(skillSetService.getAllDevelopmentSkills());
    }

    // ============================================ TECHNICAL SKILLS
    // =================================================

    @PostMapping("/technical")
    public ResponseEntity<?> saveTechnicalSkill(@Valid @RequestBody TechnicalSkillDto dto, BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            TechnicalSkillDto savedSkill = skillSetService.saveTechnicalSkill(dto);
            auditLogService.log("Create", MODULE,
                    "New technical skill added for employee " + savedSkill.getEmployeeId(),
                    null, savedSkill, httpServletRequest);
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

    @PostMapping("/technical/bulk")
    public ResponseEntity<?> saveBulkTechnicalSkills(@Valid @RequestBody List<TechnicalSkillDto> dtos,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            List<TechnicalSkillDto> savedSkills = skillSetService.saveBulkTechnicalSkills(dtos);
            auditLogService.log("Create", MODULE,
                    "Bulk technical skill import - " + savedSkills.size() + " added",
                    null, Map.of("count", savedSkills.size()), httpServletRequest);
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

    @PutMapping("/technical/{id}")
    public ResponseEntity<?> updateTechnicalSkill(
            @PathVariable Integer id,
            @Valid @RequestBody TechnicalSkillDto dto,
            BindingResult result) {
        if (result.hasErrors()) {
            return getErrorResponse(result);
        }
        try {
            TechnicalSkillDto oldValue = skillSetService.getTechnicalSkillById(id);
            dto.setId(id);
            TechnicalSkillDto updatedSkill = skillSetService.updateTechnicalSkill(dto);
            auditLogService.log("Update", MODULE,
                    "Technical skill updated at ID " + id,
                    oldValue, updatedSkill, httpServletRequest);
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

    @DeleteMapping("/technical/{id}")
    public ResponseEntity<?> deleteTechnicalSkill(@PathVariable Integer id) {
        try {
            TechnicalSkillDto oldValue = skillSetService.getTechnicalSkillById(id);
            skillSetService.deleteTechnicalSkill(id);
            auditLogService.log("Delete", MODULE,
                    "Technical skill removed at ID " + id,
                    oldValue, null, httpServletRequest);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

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
            auditLogService.log("Create", MODULE,
                    "Technical skill category saved",
                    null, saved, httpServletRequest);
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
            auditLogService.log("Create", MODULE,
                    "Bulk technical skill categories saved - " + savedCategories.size() + " added",
                    null, Map.of("count", savedCategories.size()), httpServletRequest);
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

    @GetMapping("/technical")
    public ResponseEntity<List<TechnicalSkillDto>> getAllTechnicalSkills() {
        return ResponseEntity.ok(skillSetService.getAllTechnicalSkills());
    }

    @GetMapping("/technical/categories")
    public ResponseEntity<List<TechnicalSkillCategoryResponseDto>> getAllTechnicalSkillsWithCategoryStructure() {
        return ResponseEntity.ok(skillSetService.getAllTechnicalSkillsWithCategoryStructure());
    }

    // ==================== HELPER METHODS ====================

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