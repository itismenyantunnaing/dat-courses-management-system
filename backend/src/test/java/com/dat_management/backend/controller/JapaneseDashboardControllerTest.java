package com.dat_management.backend.controller;

import com.dat_management.backend.dto.JapaneseDashboardDTO;
import com.dat_management.backend.service.JapaneseDashboardService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JapaneseDashboardControllerTest {

    @Mock
    private JapaneseDashboardService dashboardService;

    @Test
    void getDashboard_returnsOkResponseWithDashboardBody() {
        JapaneseDashboardController controller = new JapaneseDashboardController(dashboardService);
        JapaneseDashboardDTO dashboard = new JapaneseDashboardDTO();
        dashboard.setTarget1Date("Jul-2026");
        dashboard.setTarget2Date("Sep-2026");

        when(dashboardService.buildDashboard()).thenReturn(dashboard);

        ResponseEntity<JapaneseDashboardDTO> response = controller.getDashboard();

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(dashboard, response.getBody());
        Assertions.assertEquals("Jul-2026", response.getBody().getTarget1Date());
        Assertions.assertEquals("Sep-2026", response.getBody().getTarget2Date());
        verify(dashboardService).buildDashboard();
    }
}
