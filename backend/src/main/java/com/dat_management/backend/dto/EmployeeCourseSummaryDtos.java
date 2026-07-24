package com.dat_management.backend.dto;

import java.util.List;

public final class EmployeeCourseSummaryDtos {

    private EmployeeCourseSummaryDtos() {
    }

    public record CourseSummaryDTO(
            Integer count,
            List<String> courses
    ) {}

    public record EmployeeCourseSummaryResponseDTO(
            String employeeId,
            String employeeName,
            String departmentName,
            String teamName,
            CourseSummaryDTO completedCourses,
            CourseSummaryDTO attendingCourses
    ) {}
}