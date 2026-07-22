package com.dat_management.backend.dto;

import java.util.List;

public final class MonthlyAttendanceDtos {

    private MonthlyAttendanceDtos() {
    }

    public record DepartmentMonthlyAttendanceDTO(
            String departmentName,
            List<TeamMonthlyAttendanceDTO> teams
    ) {}

    public record TeamMonthlyAttendanceDTO(
            String teamName,
            List<CourseMonthlyAttendanceDTO> courses
    ) {}

    public record CourseMonthlyAttendanceDTO(
            String courseName,
            List<GroupMonthlyAttendanceDTO> groups
    ) {}

    public record GroupMonthlyAttendanceDTO(
            String groupName,
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