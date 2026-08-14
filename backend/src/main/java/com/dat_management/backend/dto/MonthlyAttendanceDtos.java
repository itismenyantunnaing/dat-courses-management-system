package com.dat_management.backend.dto;

import java.util.List;

public final class MonthlyAttendanceDtos {

    private MonthlyAttendanceDtos() {
    }

    // NEW: Division level DTO (top level)
    public record DivisionMonthlyAttendanceDTO(
            String divisionName,
            Double averageAttendance,  // Added
            List<DepartmentMonthlyAttendanceDTO> departments
    ) {}

    public record DepartmentMonthlyAttendanceDTO(
            String departmentName,
            Double averageAttendance,  // Added
            List<TeamMonthlyAttendanceDTO> teams
    ) {}

    public record TeamMonthlyAttendanceDTO(
            String teamName,
            Double averageAttendance,  // Added
            List<CourseMonthlyAttendanceDTO> courses
    ) {}

    public record CourseMonthlyAttendanceDTO(
            String courseName,
            Double averageAttendance,  // Added
            List<GroupMonthlyAttendanceDTO> groups
    ) {}

    public record GroupMonthlyAttendanceDTO(
            String groupName,
            Double averageAttendance,  // Added (average of all daily attendance)
            List<DailyAttendanceDetailDTO> dailyAttendance
    ) {}

    public record DailyAttendanceDetailDTO(
            String date,
            Double presentPercentage,
            Double absentPercentage,
            Double latePercentage,
            Double excusedPercentage,
            Integer presentCount,
            Integer absentCount,
            Integer lateCount,
            Integer excusedCount,
            Integer totalStudents
    ) {}
}