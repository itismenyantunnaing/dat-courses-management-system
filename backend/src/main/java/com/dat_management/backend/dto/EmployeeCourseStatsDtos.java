package com.dat_management.backend.dto;

import java.util.List;

public final class EmployeeCourseStatsDtos {

    private EmployeeCourseStatsDtos() {
    }

    public record EmployeeCourseStatsResponseDTO(
            String employeeId,
            String employeeName,
            Integer totalCourses,
            Integer completedCourses,
            Integer inProgressCourses,
            Double completionRate,
            Integer totalSessions,
            Integer activeSessions,
            List<EmployeeCourseDetailDTO> courses
    ) {}

    public record EmployeeCourseDetailDTO(
            String courseName,
            String courseType,
            String status,
            Double attendance,          // For TRAINER: attendance %, For SELF_STUDY: progress %
            Integer totalSessions,
            String groupName
    ) {}
}