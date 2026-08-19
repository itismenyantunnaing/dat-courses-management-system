package com.dat_management.backend.dto;

import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FeedbackSuggestionDto {
    
    private Integer id;

    @NotBlank(message = "Employee ID is required")
    private String employeeId; 

    @NotBlank(message = "Feedback category is required")
    private String  category;

    
    @Column(nullable = false)
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