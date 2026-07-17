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
            List<MonthlyAttendanceDetailDTO> monthlyAttendance
    ) {}

    public record MonthlyAttendanceDetailDTO(
            String month,
            Integer year,
            Double attendance,
            Integer presentCount,
            Integer totalSessions,
            Integer totalStudents
    ) {}
}
