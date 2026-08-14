package com.dat_management.backend.dto;

import java.util.List;

public final class OrganizationalStatsDtos {

    private OrganizationalStatsDtos() {
    }

    // ==================== COURSE STATS DTO ====================
    public record CourseStatDTO(
            String name,
            Integer enrolled,
            Integer completed,
            String category,
            Double completionRate,
            String courseType
    ) {}

    // ==================== TEAM STATS DTO ====================
    public record TeamStatsDTO(
            String teamName,
            String teamId,
            String departmentName,
            String departmentId,
            String divisionName,
            String divisionId,
            Double averageCompletionRate,
            List<CourseStatDTO> courses
    ) {}

    // ==================== DEPARTMENT STATS DTO ====================
    public record DepartmentStatsDTO(
            String departmentName,
            String departmentId,
            String divisionName,
            String divisionId,
            Double averageCompletionRate,
            List<TeamStatsDTO> teams,
            List<CourseStatDTO> courses
    ) {}

    // ==================== DIVISION STATS DTO ====================
    public record DivisionStatsDTO(
            String divisionName,
            String divisionId,
            Double averageCompletionRate,
            List<DepartmentStatsDTO> departments,
            List<CourseStatDTO> courses
    ) {}

    // ==================== RESPONSE DTO ====================
    public record OrganizationalStatsResponseDTO(
            List<DivisionStatsDTO> divisions
    ) {}
}