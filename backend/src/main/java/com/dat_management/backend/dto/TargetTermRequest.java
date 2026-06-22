package com.dat_management.backend.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class TargetTermRequest {
    private LocalDate target1Date;
    private LocalDate target2Date;
    private LocalDate examDate;
    private Boolean isActive;
}