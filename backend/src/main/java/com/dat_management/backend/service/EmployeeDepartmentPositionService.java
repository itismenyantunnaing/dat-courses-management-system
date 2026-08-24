package com.dat_management.backend.service;

import com.dat_management.backend.dto.EmployeeDepartmentPositionRequestDTO;
import com.dat_management.backend.dto.EmployeeDepartmentPositionResponseDTO;
import com.dat_management.backend.entity.DepartmentDir;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.DepartmentDirRepository;
import com.dat_management.backend.repository.EmployeeRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmployeeDepartmentPositionService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentDirRepository departmentDirRepository;

    @Transactional
    public EmployeeDepartmentPositionResponseDTO updateDepartmentPosition(
            EmployeeDepartmentPositionRequestDTO request) {

        // 1. Find employee
        Employee employee = employeeRepository
                .findById(request.getEmployeeId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Employee not found: " + request.getEmployeeId()
                        )
                );

        // 2. Find existing department or create a new one
        DepartmentDir departmentDir = departmentDirRepository
                .findByDeptNameAndIsDeletedFalse(
                        request.getDepartmentDirName()
                )
                .orElseGet(() -> {

                    DepartmentDir newDepartment = new DepartmentDir();

                    newDepartment.setDeptName(
                            request.getDepartmentDirName()
                    );

                    newDepartment.setIsDeleted(false);

                    return departmentDirRepository.save(newDepartment);
                });

        // 3. Update employee
        employee.setDepartmentDir(departmentDir);
        employee.setPosition(request.getPosition());
        employee.setIsCorePersonnel(request.getIsCorePersonnel());
        employee.setHasJapanBusinessTrip(
                request.getHasJapanBusinessTrip()
        );

        // 4. Save employee
        Employee savedEmployee = employeeRepository.save(employee);

        // 5. Return response
        return toResponseDTO(savedEmployee);
    }

    @Transactional
    public EmployeeDepartmentPositionResponseDTO getDepartmentPosition(
            String employeeId) {

        // 1. Find employee
        Employee employee = employeeRepository
                .findById(employeeId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Employee not found: " + employeeId
                        )
                );

        // 2. Convert entity to response DTO
        return toResponseDTO(employee);
    }

    private EmployeeDepartmentPositionResponseDTO toResponseDTO(
            Employee employee) {

        return EmployeeDepartmentPositionResponseDTO.builder()
                .employeeId(employee.getId())
                .departmentDirName(
                        employee.getDepartmentDir() != null
                                ? employee.getDepartmentDir().getDeptName()
                                : null
                )
                .position(employee.getPosition())
                .isCorePersonnel(employee.getIsCorePersonnel())
                .hasJapanBusinessTrip(
                        employee.getHasJapanBusinessTrip()
                )
                .build();
    }

    public List<String> getAllDepartmentName(){
        return departmentDirRepository.findAllDepartmentNames();
    }
}