package com.dat_management.backend.dto.skillset;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class LanguageSkillDto {
    private Integer id;
    
    @NotBlank(message = "Employee ID is required")
    private String employeeId;
    
    @Min(value = 1, message = "Language skill level must be at least 1")
    @Max(value = 5, message = "Language skill level must be at most 5")
    private Short languageSkillLevel;
    
    @Pattern(regexp = "N[1-5]", message = "JLPT level must be N1, N2, N3, N4, or N5")
    private String jlptHighestLevel;
}