package com.dat_management.backend.dto.skillset;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class ManagementSkillDto {
    private Integer id;
    
    @NotBlank(message = "Employee ID is required")
    private String employeeId;
    
    @Min(value = 0, message = "Management experience level must be at least 0")
    @Max(value = 5, message = "Management experience level must be at most 5")
    private Short managementExperienceLevel;
    
    @Min(value = 0, message = "QCD score must be at least 0")
    @Max(value = 5, message = "QCD score must be at most 5")
    private Short qcdScore;
    
    @Min(value = 0, message = "Report consult score must be at least 0")
    @Max(value = 5, message = "Report consult score must be at most 5")
    private Short reportConsultScore;
    
    @Min(value = 0, message = "Education score must be at least 0")
    @Max(value = 5, message = "Education score must be at most 5")
    private Short educationScore;
    
    @DecimalMin(value = "0.0", message = "Total level must be at least 0")
    @DecimalMax(value = "5.0", message = "Total level must be at most 5")
    private Float totalLevel;
}