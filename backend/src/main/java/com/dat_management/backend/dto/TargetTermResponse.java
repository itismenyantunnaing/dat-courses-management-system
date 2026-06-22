package com.dat_management.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class TargetTermResponse {
    private Integer id;
    private LocalDate target1Date;
    private LocalDate target2Date;
    private LocalDate examDate;
    private Boolean isActive;
}