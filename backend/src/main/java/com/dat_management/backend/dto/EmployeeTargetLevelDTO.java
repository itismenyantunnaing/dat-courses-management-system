package com.dat_management.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTargetLevelDTO {
    private String employeeId;
    private String targetJlptNatLevel;
    private LocalDate targetDate;
    private String jlptHighestLevel;  // New field added
}