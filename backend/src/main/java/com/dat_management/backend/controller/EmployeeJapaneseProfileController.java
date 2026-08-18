package com.dat_management.backend.controller;

import com.dat_management.backend.dto.EmployeeJapaneseProfileRequest;
import com.dat_management.backend.dto.EmployeeJapaneseProfileResponse;
import com.dat_management.backend.service.AuditLogService;
import com.dat_management.backend.service.EmployeeJapaneseProfileService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employee-japanese-profiles")
@RequiredArgsConstructor
public class EmployeeJapaneseProfileController {

    private static final String MODULE = "EMPLOYEE_JAPANESE_PROFILES";

    private final EmployeeJapaneseProfileService profileService;
    private final AuditLogService auditLogService;
    private final HttpServletRequest httpServletRequest;

    @GetMapping
    public List<EmployeeJapaneseProfileResponse> getAll() {
        return profileService.getAll();
    }

    @GetMapping("/{id}")
    public EmployeeJapaneseProfileResponse getById(@PathVariable Integer id) {
        return profileService.getById(id);
    }

    @GetMapping("/employee/{employeeId}")
    public EmployeeJapaneseProfileResponse getByEmployeeId(@PathVariable String employeeId) {
        return profileService.getByEmployeeId(employeeId);
    }

    @PostMapping
    public ResponseEntity<EmployeeJapaneseProfileResponse> create(@RequestBody EmployeeJapaneseProfileRequest request) {
        EmployeeJapaneseProfileResponse created = profileService.create(request);
        auditLogService.log("Create", MODULE,
                "Created Japanese profile - " + created.getId(),
                null, created, httpServletRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public EmployeeJapaneseProfileResponse update(
            @PathVariable Integer id,
            @RequestBody EmployeeJapaneseProfileRequest request
    ) {
        EmployeeJapaneseProfileResponse oldValue = profileService.getById(id);
        EmployeeJapaneseProfileResponse updated = profileService.update(id, request);
        auditLogService.log("Update", MODULE,
                "Japanese profile updated - " + id,
                oldValue, updated, httpServletRequest);
        return updated;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        EmployeeJapaneseProfileResponse oldValue = profileService.getById(id);
        profileService.delete(id);
        auditLogService.log("Delete", MODULE,
                "Removed Japanese profile - " + id,
                oldValue, null, httpServletRequest);
    }

    @PostMapping("/import-list")
    public ResponseEntity<List<EmployeeJapaneseProfileResponse>> importList(
            @RequestBody List<EmployeeJapaneseProfileRequest> requests
    ) {
        List<EmployeeJapaneseProfileResponse> created = profileService.importList(requests);
        auditLogService.log("Import", MODULE,
                "Japanese profile import - " + created.size() + " profiles added",
                null, Map.of("count", created.size()), httpServletRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/import")
    public ResponseEntity<List<EmployeeJapaneseProfileResponse>> importProfiles(
            @RequestBody List<EmployeeJapaneseProfileRequest> requests
    ) {
        List<EmployeeJapaneseProfileResponse> created = profileService.importList(requests);
        auditLogService.log("Import", MODULE,
                "Japanese profile import - " + created.size() + " profiles added",
                null, Map.of("count", created.size()), httpServletRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteList(@RequestBody List<Integer> ids) {
        profileService.deleteList(ids);
        auditLogService.log("Delete", MODULE,
                "Bulk deleted Japanese profiles - " + ids.size() + " removed",
                ids, null, httpServletRequest);
    }
}