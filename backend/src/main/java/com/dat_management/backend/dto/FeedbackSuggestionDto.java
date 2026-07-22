package com.dat_management.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FeedbackSuggestionDto {
    
    private Integer id;

    @NotBlank(message = "Employee ID is required")
    private String employeeId; 

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Description is required")
    private String description;

    private String status;
    
    // Employee details fields
    private String employeeName;
    private String department;
    private String team;
    private String profilePhotoPath;
    private String createdAt;
    private String updatedAt; 
}