package com.dat_management.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class HolidayDto {
    
    @NotBlank(message = "Holiday date is required")
    private String holidayDate;
    
    @NotBlank(message = "Holiday name is required")
    private String holidayName;
}
