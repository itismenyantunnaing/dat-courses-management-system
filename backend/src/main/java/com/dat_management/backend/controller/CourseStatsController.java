package com.dat_management.backend.controller;

import com.dat_management.backend.dto.CourseStatsDTO;
import com.dat_management.backend.dto.MonthlyAttendanceDtos.DepartmentMonthlyAttendanceDTO;
import com.dat_management.backend.dto.RiskDtos.RiskResponseDTO;
import com.dat_management.backend.service.CourseStatsService;
import com.dat_management.backend.service.CourseAttendanceService;
import com.dat_management.backend.service.RiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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

    @GetMapping
    public ResponseEntity<List<CourseStatsDTO>> getCourseStats() {
        List<CourseStatsDTO> stats = courseStatsService.getCourseStats();
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/monthly-attendance")
    public ResponseEntity<List<DepartmentMonthlyAttendanceDTO>> getMonthlyAttendanceByDepartment() {
        List<DepartmentMonthlyAttendanceDTO> attendance = courseAttendanceService.getMonthlyAttendanceByDepartment();
        return ResponseEntity.ok(attendance);
    }

    @GetMapping("/risk")
    public ResponseEntity<RiskResponseDTO> getAtRiskStudents() {
        RiskResponseDTO riskStudents = riskService.getAtRiskStudents();
        return ResponseEntity.ok(riskStudents);
    }
}