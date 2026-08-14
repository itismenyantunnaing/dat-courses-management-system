package com.dat_management.backend.dto;

import java.util.List;

public final class RiskDtos {

    private RiskDtos() {
    }

    public record RiskDTO(
            String name,
            String issue,
            Double risk,  // Stores percentage
            String division,  // Division field
            String department,
            String team,
            String course
    ) {}

    public record RiskSummaryDTO(
            Integer totalAtRisk,
            IssueBreakdownDTO byIssue,
            DivisionBreakdownDTO byDivision,  // ← NEW: Division breakdown
            DepartmentBreakdownDTO byDepartment,
            RiskLevelDTO byRiskLevel
    ) {}

    public record IssueBreakdownDTO(
            Integer lowAttendance,
            Integer lowProgress
    ) {}

    public record DivisionBreakdownDTO(  // ← NEW: Division breakdown DTO
            List<DivisionRiskDTO> divisions
    ) {}

    public record DivisionRiskDTO(  // ← NEW: Division risk DTO
            String divisionName,
            Integer atRiskCount
    ) {}

    public record DepartmentBreakdownDTO(
            List<DepartmentRiskDTO> departments
    ) {}

    public record DepartmentRiskDTO(
            String departmentName,
            Integer atRiskCount
    ) {}

    public record RiskLevelDTO(
            Integer highRisk,
            Integer mediumRisk,
            Integer lowRisk
    ) {}

    public record RiskResponseDTO(
            List<RiskDTO> atRiskStudents,
            Integer totalAtRisk,
            RiskSummaryDTO summary
    ) {}
}