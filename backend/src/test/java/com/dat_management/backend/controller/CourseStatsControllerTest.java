package com.dat_management.backend.controller;

import com.dat_management.backend.dto.ActiveLearnerResponseDTO;
import com.dat_management.backend.dto.CourseStatsDTO;
import com.dat_management.backend.dto.MonthlyAttendanceDtos.DepartmentMonthlyAttendanceDTO;
import com.dat_management.backend.dto.RiskDtos.DepartmentBreakdownDTO;
import com.dat_management.backend.dto.RiskDtos.IssueBreakdownDTO;
import com.dat_management.backend.dto.RiskDtos.RiskLevelDTO;
import com.dat_management.backend.dto.RiskDtos.RiskResponseDTO;
import com.dat_management.backend.dto.RiskDtos.RiskSummaryDTO;
import com.dat_management.backend.service.ActiveLearnerService;
import com.dat_management.backend.service.CourseAttendanceService;
import com.dat_management.backend.service.CourseStatsService;
import com.dat_management.backend.service.RiskService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseStatsControllerTest {

    @Mock
    private CourseStatsService courseStatsService;

    @Mock
    private CourseAttendanceService courseAttendanceService;

    @Mock
    private RiskService riskService;

    @Mock
    private ActiveLearnerService activeLearnerService;

    @Test
    void getCourseStats_returnsStatsFromService() {
        CourseStatsController controller = controller();
        CourseStatsDTO dto = new CourseStatsDTO("JLPT N2", 10L, 5L, "Trainer", 50.0, "TRAINER_PROVIDED");
        when(courseStatsService.getCourseStats()).thenReturn(List.of(dto));

        ResponseEntity<List<CourseStatsDTO>> response = controller.getCourseStats();

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(List.of(dto), response.getBody());
    }

    @Test
    void getDailyAttendanceByDepartment_returnsAttendanceFromService() {
        CourseStatsController controller = controller();
        DepartmentMonthlyAttendanceDTO dto = new DepartmentMonthlyAttendanceDTO("Engineering", List.of());
        when(courseAttendanceService.getDailyAttendanceByDepartment()).thenReturn(List.of(dto));

        ResponseEntity<List<DepartmentMonthlyAttendanceDTO>> response = controller.getDailyAttendanceByDepartment();

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(List.of(dto), response.getBody());
    }

    @Test
    void getAtRiskStudents_returnsRiskResponseFromService() {
        CourseStatsController controller = controller();
        RiskSummaryDTO summary = new RiskSummaryDTO(0,
                new IssueBreakdownDTO(0, 0),
                new DepartmentBreakdownDTO(List.of()),
                new RiskLevelDTO(0, 0, 0));
        RiskResponseDTO dto = new RiskResponseDTO(List.of(), 0, summary);
        when(riskService.getAtRiskStudents()).thenReturn(dto);

        ResponseEntity<RiskResponseDTO> response = controller.getAtRiskStudents();

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(dto, response.getBody());
    }

    @Test
    void getActiveLearners_returnsActiveLearnerResponseFromService() {
        CourseStatsController controller = controller();
        ActiveLearnerResponseDTO dto = new ActiveLearnerResponseDTO(7, "success");
        when(activeLearnerService.getTotalActiveLearners()).thenReturn(dto);

        ResponseEntity<ActiveLearnerResponseDTO> response = controller.getActiveLearners();

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(dto, response.getBody());
    }

    private CourseStatsController controller() {
        return new CourseStatsController(courseStatsService, courseAttendanceService, riskService, activeLearnerService);
    }
}
