package com.dat_management.backend.controller;

import com.dat_management.backend.dto.EmployeeJapaneseProfileRequest;
import com.dat_management.backend.dto.EmployeeJapaneseProfileResponse;
import com.dat_management.backend.service.EmployeeJapaneseProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employee-japanese-profiles")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class EmployeeJapaneseProfileController {

    private final EmployeeJapaneseProfileService profileService;

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
        return ResponseEntity.status(HttpStatus.CREATED).body(profileService.create(request));
    }

    @PutMapping("/{id}")
    public EmployeeJapaneseProfileResponse update(
            @PathVariable Integer id,
            @RequestBody EmployeeJapaneseProfileRequest request
    ) {
        return profileService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        profileService.delete(id);
    }

    @PostMapping("/import-list")
    public ResponseEntity<List<EmployeeJapaneseProfileResponse>> importList(
            @RequestBody List<EmployeeJapaneseProfileRequest> requests
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(profileService.importList(requests));
    }

    @PostMapping("/import")
    public ResponseEntity<List<EmployeeJapaneseProfileResponse>> importProfiles(
            @RequestBody List<EmployeeJapaneseProfileRequest> requests
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(profileService.importList(requests));
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteList(@RequestBody List<Integer> ids) {
        profileService.deleteList(ids);
    }
}
