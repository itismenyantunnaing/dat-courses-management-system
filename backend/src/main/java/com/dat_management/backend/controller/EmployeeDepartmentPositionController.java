package com.dat_management.backend.controller;

import com.dat_management.backend.dto.EmployeeDepartmentPositionRequestDTO;
import com.dat_management.backend.dto.EmployeeDepartmentPositionResponseDTO;
import com.dat_management.backend.service.EmployeeDepartmentPositionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeDepartmentPositionController {

    private final EmployeeDepartmentPositionService service;

    @GetMapping("/{employeeId}/department-position")
    public ResponseEntity<EmployeeDepartmentPositionResponseDTO>
    getDepartmentPosition(
            @PathVariable String employeeId) {

        return ResponseEntity.ok(
                service.getDepartmentPosition(employeeId)
        );
    }

    @PutMapping("/department-position")
    public ResponseEntity<EmployeeDepartmentPositionResponseDTO>
    updateDepartmentPosition(
            @Valid @RequestBody
            EmployeeDepartmentPositionRequestDTO request) {

        return ResponseEntity.ok(
                service.updateDepartmentPosition(request)
        );
    }
}