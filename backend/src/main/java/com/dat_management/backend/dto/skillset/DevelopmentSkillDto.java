package com.dat_management.backend.dto.skillset;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Data
public class DevelopmentSkillDto {
    private Integer id;
    
    @NotBlank(message = "Employee ID is required")
    private String employeeId;
    
    @NotBlank(message = "Development type name is required")
    private String developmentTypeName;
    
    @NotBlank(message = "Process name is required")
    private String processName;
    
    @DecimalMin(value = "0.0", message = "Years of experience must be at least 0")
    private BigDecimal yearsOfExperience;
}