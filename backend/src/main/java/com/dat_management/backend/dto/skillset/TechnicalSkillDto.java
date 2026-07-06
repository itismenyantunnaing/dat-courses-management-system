package com.dat_management.backend.dto.skillset;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Data
public class TechnicalSkillDto {
    private Integer id;
    
    @NotBlank(message = "Employee ID is required")
    private String employeeId;
    
    @NotBlank(message = "Skill name is required")
    private String skillName;
    
    private String categoryName;
    
    private String subCategoryName;
    
    @DecimalMin(value = "0.00", message = "Years of experience must be at least 0")
    private BigDecimal yearsOfExperience;
    
    private String experienceLevel;
}