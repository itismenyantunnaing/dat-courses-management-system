package com.dat_management.backend.controller;

import com.dat_management.backend.dto.CertificateStatisticsDtos.OverallCertificateStatisticsDTO;
import com.dat_management.backend.dto.CertificateStatisticsDtos.TeamCertificateStatisticsDTO;
import com.dat_management.backend.service.CertificateStatisticsService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CertificateStatisticsControllerTest {

    @Mock
    private CertificateStatisticsService statisticsService;

    @Test
    void getOverallStatistics_returnsStatisticsFromService() {
        CertificateStatisticsController controller = new CertificateStatisticsController(statisticsService);
        OverallCertificateStatisticsDTO dto =
                new OverallCertificateStatisticsDTO(Map.of("JLPT", Map.of("N2", 25.0)));
        when(statisticsService.getOverallStatistics()).thenReturn(dto);

        ResponseEntity<OverallCertificateStatisticsDTO> response = controller.getOverallStatistics();

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(dto, response.getBody());
    }

    @Test
    void getTeamStatistics_returnsStatisticsFromService() {
        CertificateStatisticsController controller = new CertificateStatisticsController(statisticsService);
        TeamCertificateStatisticsDTO dto =
                new TeamCertificateStatisticsDTO(Map.of("Team A", Map.of("JLPT", Map.of("N1", 50.0))));
        when(statisticsService.getTeamStatistics()).thenReturn(dto);

        ResponseEntity<TeamCertificateStatisticsDTO> response = controller.getTeamStatistics();

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(dto, response.getBody());
    }
}
