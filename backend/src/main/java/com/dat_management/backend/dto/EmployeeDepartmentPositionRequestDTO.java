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

    @NotBlank(message = "Department DIR name is required")
    private String departmentDirName;

    @NotBlank(message = "Position is required")
    private String position;

    @NotNull(message = "Core personnel status is required")
    private Boolean isCorePersonnel;

    @NotNull(message = "Japan business trip status is required")
    private Boolean hasJapanBusinessTrip;
}