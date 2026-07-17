package com.dat_management.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseStatsDTO {
    private String name;
    private Long enrolled;
    private Long completed;
    private String category;
    private Double completionRate;  // (completed / enrolled) * 100
    private String courseType;      // TRAINER_PROVIDED or SELF_STUDY
}