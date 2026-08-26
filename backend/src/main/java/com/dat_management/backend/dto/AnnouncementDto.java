package com.dat_management.backend.dto;

import lombok.Data;

@Data
public class AnnouncementDto {
    private Integer id;
    private String title;
    private String text;
    private String category;
    private String createdBy;
    private String teamName;
    private String departmentName;
    private String divisionName;
    private String createdAt;
    private String updatedAt;
}