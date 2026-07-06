package com.dat_management.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class OrganizationDtos {

    private OrganizationDtos() {
    }

    public record DivisionRequestDTO(
            @NotBlank(message = "divisionName is required")
            String divisionName) {
    }

    public record DivisionResponseDTO(
            Integer id,
            String divisionName,
            Boolean isDeleted) {
    }

    public record DepartmentDatRequestDTO(
            @NotNull(message = "divisionId is required")
            Integer divisionId,
            @NotBlank(message = "deptName is required")
            String deptName) {
    }

    public record DepartmentDatResponseDTO(
            Integer id,
            Integer divisionId,
            String divisionName,
            String deptName,
            Boolean isDeleted) {
    }

    public record TeamRequestDTO(
            @NotNull(message = "departmentDatId is required")
            Integer departmentDatId,
            @NotBlank(message = "teamName is required")
            String teamName) {
    }

    public record TeamResponseDTO(
            Integer id,
            Integer departmentDatId,
            String departmentDatName,
            Integer divisionId,
            String divisionName,
            String teamName,
            Boolean isDeleted) {
    }
}
