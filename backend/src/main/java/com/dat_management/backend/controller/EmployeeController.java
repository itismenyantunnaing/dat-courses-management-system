package com.dat_management.backend.controller;

import com.dat_management.backend.dto.EmployeeRequestDTO;
import com.dat_management.backend.dto.EmployeeResponseDTO;
import com.dat_management.backend.dto.skillset.EmployeeWithSkillsResponseDTO;
import com.dat_management.backend.service.AuditLogService;
import com.dat_management.backend.service.EmployeeService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class EmployeeController {

    private static final String MODULE = "EMPLOYEES";

    private final EmployeeService service;
    private final AuditLogService auditLogService;
    private final HttpServletRequest httpServletRequest;

    @GetMapping("/{id}/profile")
    public ResponseEntity<EmployeeWithSkillsResponseDTO> getEmployeeProfile(@PathVariable String id) {
        return ResponseEntity.ok(service.getEmployeeProfile(id));
    }

    @GetMapping
    public ResponseEntity<List<EmployeeResponseDTO>> getAll(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String status) {

        if (name != null && !name.isBlank())
            return ResponseEntity.ok(service.searchByName(name));
        if (status != null && !status.isBlank())
            return ResponseEntity.ok(service.getByStatus(status));

        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponseDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/deleted")
    public ResponseEntity<List<EmployeeResponseDTO>> getDeleted() {
        return ResponseEntity.ok(service.getDeleted());
    }

    @PostMapping
    public ResponseEntity<EmployeeResponseDTO> create(@Valid @RequestBody EmployeeRequestDTO dto) {
        EmployeeResponseDTO created = service.create(dto);
        auditLogService.log("Create", MODULE,
                "Created new employee profile - " + created.getId(),
                null, created, httpServletRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<EmployeeResponseDTO>> createBulk(
            @Valid @RequestBody List<@jakarta.validation.Valid EmployeeRequestDTO> dtos) {
        Map<String, Object> result = service.createBulk(dtos);
        @SuppressWarnings("unchecked")
        List<EmployeeResponseDTO> created = (List<EmployeeResponseDTO>) result.get("created");
        auditLogService.log("Create", MODULE,
                "Bulk employee import - " + created.size() + " employees added",
                null, Map.of("count", created.size()), httpServletRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponseDTO> update(
            @PathVariable String id,
            @Valid @RequestBody EmployeeRequestDTO dto) {
        EmployeeResponseDTO oldValue = service.getById(id);
        EmployeeResponseDTO updated = service.update(id, dto);
        auditLogService.log("Update", MODULE,
                "Employee profile updated - " + id,
                oldValue, updated, httpServletRequest);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/resign")
    public ResponseEntity<EmployeeResponseDTO> resign(@PathVariable String id) {
        EmployeeResponseDTO oldValue = service.getById(id);
        EmployeeResponseDTO updated = service.resign(id);
        auditLogService.log("Update", MODULE,
                "Employee marked as resigned - " + id,
                oldValue, updated, httpServletRequest);
        return ResponseEntity.ok(updated);
    }

    // @DeleteMapping("/{id}")
    // public ResponseEntity<Void> delete(@PathVariable String id) {
    //     service.softDelete(id);
    //     return ResponseEntity.noContent().build();
    // }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<EmployeeResponseDTO> restore(@PathVariable String id) {
        // When restoring, the existing record is soft-deleted so getById() will not find it.
        // Fetch the deleted record representation and then restore it.
        EmployeeResponseDTO oldValue = service.getDeletedById(id);
        EmployeeResponseDTO restored = service.restore(id);
        auditLogService.log("Update", MODULE,
                "Employee restored - " + id,
                oldValue, restored, httpServletRequest);
        return ResponseEntity.ok(restored);
    }

    @DeleteMapping("/{ids}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable List<String> ids) {
        List<String> successfullyDeleted = new ArrayList<>();
        List<String> failedDeletions = new ArrayList<>();
        Map<String, String> errors = new HashMap<>();

        for (String id : ids) {
            try {
                EmployeeResponseDTO oldValue = service.getById(id);
                service.softDelete(id);
                successfullyDeleted.add(id);
                auditLogService.log("Delete", MODULE,
                        "Removed employee from system - " + id,
                        oldValue, null, httpServletRequest);
            } catch (RuntimeException e) {
                failedDeletions.add(id);
                errors.put(id, e.getMessage());
            }
        }

        Map<String, Object> response = new HashMap<>();

        if (failedDeletions.isEmpty()) {
            response.put("success", true);
            response.put("message", "All employee deleted successfully");
            response.put("deletedIds", successfullyDeleted);
            response.put("totalDeleted", successfullyDeleted.size());
            return ResponseEntity.ok(response);
        } else if (successfullyDeleted.isEmpty()) {
            response.put("success", false);
            response.put("message", "Failed to delete any employees");
            response.put("errors", errors);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } else {
            response.put("success", true);
            response.put("message", "Some employees deleted successfully, some failed");
            response.put("deletedIds", successfullyDeleted);
            response.put("failedIds", failedDeletions);
            response.put("errors", errors);
            response.put("totalDeleted", successfullyDeleted.size());
            response.put("totalFailed", failedDeletions.size());
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).body(response);
        }
    }
}