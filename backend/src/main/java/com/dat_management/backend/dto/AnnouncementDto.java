package com.dat_management.backend.dto;

import lombok.Data;

@Data
public class AnnouncementDto {
    private Integer id;
    private String title;
    private String text;
    private String category;
    private String createdBy;
    private String createdAt;
    private String updatedAt;
}