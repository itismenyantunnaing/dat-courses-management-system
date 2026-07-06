package com.dat_management.backend.dto.skillset;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DevelopmentTypeDto {
    private Integer id;
    
    @NotBlank(message = "Development type name is required")
    @Size(max = 100, message = "Development type name must not exceed 100 characters")
    private String developmentTypeName;
    
    private Boolean isActive;
}