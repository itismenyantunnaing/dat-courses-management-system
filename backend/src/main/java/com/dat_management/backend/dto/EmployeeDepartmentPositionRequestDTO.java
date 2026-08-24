package com.dat_management.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDepartmentPositionRequestDTO {

    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    private String departmentDirName;

    private String position;

    private Boolean isCorePersonnel;

    private Boolean hasJapanBusinessTrip;
}