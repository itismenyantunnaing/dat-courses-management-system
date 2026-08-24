package com.dat_management.backend.controller;

import com.dat_management.backend.dto.EmployeeDepartmentPositionRequestDTO;
import com.dat_management.backend.dto.EmployeeDepartmentPositionResponseDTO;
import com.dat_management.backend.service.EmployeeDepartmentPositionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeDepartmentPositionController {

    private final EmployeeDepartmentPositionService service;

    @GetMapping("/{employeeId}/department-position")
    public ResponseEntity<EmployeeDepartmentPositionResponseDTO> getDepartmentPosition(
            @PathVariable String employeeId) {

        return ResponseEntity.ok(
                service.getDepartmentPosition(employeeId));
    }

    @PutMapping("/department-position")
    public ResponseEntity<EmployeeDepartmentPositionResponseDTO> updateDepartmentPosition(
            @Valid @RequestBody EmployeeDepartmentPositionRequestDTO request) {

        return ResponseEntity.ok(
                service.updateDepartmentPosition(request));
    }

    @PutMapping("/department-position/bulk")
    public ResponseEntity<List<EmployeeDepartmentPositionResponseDTO>> BulkUpdateDepartmentPosition(
            @Valid @RequestBody List<EmployeeDepartmentPositionRequestDTO> requests) {
        if (requests == null || requests.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        List<EmployeeDepartmentPositionResponseDTO> responses = requests.stream()
                .map(request -> service.updateDepartmentPosition(request))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/dir-departments")
    public ResponseEntity<List<String>> getDepartmentNames() {
        return ResponseEntity.ok(service.getAllDepartmentName());
    }

}