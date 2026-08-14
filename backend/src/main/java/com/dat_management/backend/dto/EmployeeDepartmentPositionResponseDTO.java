package com.dat_management.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDepartmentPositionResponseDTO {

    private String employeeId;
    private String departmentDirName;
    private String position;
    private Boolean isCorePersonnel;
    private Boolean hasJapanBusinessTrip;
}