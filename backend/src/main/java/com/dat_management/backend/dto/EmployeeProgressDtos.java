package com.dat_management.backend.dto;

import java.util.List;

public final class EmployeeProgressDtos {

    private EmployeeProgressDtos() {
    }

    public record EmployeeProgressResponseDTO(
            String employeeId,
            String employeeName,
            List<EmployeeCourseProgressDTO> courses,
            Double averageAttendance,
            EmployeeTargetLevelDTO employeeTargetLevel
    ) {}

    public record EmployeeCourseProgressDTO(
            String courseName,
            String courseType,
            String status,
            Double attendance,
            String groupName
    ) {}
}