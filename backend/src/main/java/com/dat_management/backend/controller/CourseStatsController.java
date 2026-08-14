package com.dat_management.backend.controller;

import com.dat_management.backend.dto.ActiveLearnerResponseDTO;
import com.dat_management.backend.dto.CourseStatsDTO;
import com.dat_management.backend.dto.EmployeeCourseStatsDtos.EmployeeCourseStatsResponseDTO;
import com.dat_management.backend.dto.EmployeeCourseSummaryDtos.EmployeeCourseSummaryResponseDTO;
import com.dat_management.backend.dto.EmployeeProgressDtos.EmployeeProgressResponseDTO;
import com.dat_management.backend.dto.EmployeeTargetLevelDTO;
import com.dat_management.backend.dto.MonthlyAttendanceDtos.DepartmentMonthlyAttendanceDTO;
import com.dat_management.backend.dto.MonthlyAttendanceDtos.DivisionMonthlyAttendanceDTO;
import com.dat_management.backend.dto.OrganizationalStatsDtos.OrganizationalStatsResponseDTO;
import com.dat_management.backend.dto.RiskDtos.RiskResponseDTO;
import com.dat_management.backend.dto.UpcomingSessionResponse;
import com.dat_management.backend.service.CourseStatsService;
import com.dat_management.backend.service.DashboardService;
import com.dat_management.backend.service.EmployeeProgressService;
import com.dat_management.backend.service.ActiveLearnerService;
import com.dat_management.backend.service.CourseAttendanceService;
import com.dat_management.backend.service.EmployeeTargetService;
import com.dat_management.backend.service.OrganizationalStatsService;
import com.dat_management.backend.service.RiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/course-stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CourseStatsController {

    private final CourseStatsService courseStatsService;
    private final CourseAttendanceService courseAttendanceService;
    private final RiskService riskService;
    private final ActiveLearnerService activeLearnerService;
    private final EmployeeProgressService employeeProgressService;
    private final DashboardService dashboardService;
    private final EmployeeTargetService employeeTargetService;

    private final OrganizationalStatsService statsService;

	@GetMapping
    public ResponseEntity<List<CourseStatsDTO>> getCourseStats() {
        List<CourseStatsDTO> stats = courseStatsService.getCourseStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/organizational")
    public ResponseEntity<OrganizationalStatsResponseDTO> getOrganizationalStats() {
        return ResponseEntity.ok(statsService.getOrganizationalStats());
    }

   @GetMapping("/daily-attendance")
public ResponseEntity<List<DivisionMonthlyAttendanceDTO>> getDailyAttendanceByDivision() {
    List<DivisionMonthlyAttendanceDTO> attendance = courseAttendanceService.getDailyAttendanceByDivision();
    return ResponseEntity.ok(attendance);
}

    @GetMapping("/risk")
    public ResponseEntity<RiskResponseDTO> getAtRiskStudents() {
        RiskResponseDTO riskStudents = riskService.getAtRiskStudents();
        return ResponseEntity.ok(riskStudents);
    }

    @GetMapping("/active-learners")
    public ResponseEntity<ActiveLearnerResponseDTO> getActiveLearners(
            @RequestParam(value = "employeeId", required = false) String employeeId) {
        ActiveLearnerResponseDTO response;

        if (employeeId != null && !employeeId.isEmpty()) {
            // Get active learners for specific employee's team
            response = activeLearnerService.getTotalActiveLearnersByEmployeeId(employeeId);
        } else {
            // Get all active learners (existing behavior)
            response = activeLearnerService.getTotalActiveLearners();
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<EmployeeCourseStatsResponseDTO> getEmployeeCourseStats(
            @PathVariable String employeeId) {
        EmployeeCourseStatsResponseDTO response = courseStatsService.getEmployeeCourseStats(employeeId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/employee/progress/{employeeId}")
    public ResponseEntity<EmployeeProgressResponseDTO> getEmployeeProgress(
            @PathVariable String employeeId) {
        EmployeeProgressResponseDTO response = employeeProgressService.getEmployeeProgress(employeeId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/employee-summary")
    public ResponseEntity<List<EmployeeCourseSummaryResponseDTO>> getAllEmployeesCourseSummary() {
        List<EmployeeCourseSummaryResponseDTO> response = courseStatsService.getAllEmployeesCourseSummary();
        return ResponseEntity.ok(response);
    }

    @GetMapping("targetTerm/{employeeId}")
    public ResponseEntity<EmployeeTargetLevelDTO> getEmployeeTargetLevel(@PathVariable String employeeId) {
        EmployeeTargetLevelDTO targetLevel = employeeTargetService.getTargetLevelForEmployee(employeeId);
        return ResponseEntity.ok(targetLevel);
    }

    @GetMapping("/upcoming-sessions/{employeeId}")
    public ResponseEntity<List<UpcomingSessionResponse>> getUpcomingSessions(
            @PathVariable String employeeId) {

        return ResponseEntity.ok(
                dashboardService.getUpcomingSessions(employeeId));
    }

    @GetMapping("/highlight-sessions/{employeeId}")
    public ResponseEntity<List<UpcomingSessionResponse>> getHighlightSessions(
            @PathVariable String employeeId) {

        return ResponseEntity.ok(
                dashboardService
                        .getHighlightSessions(
                                employeeId));
    }
}