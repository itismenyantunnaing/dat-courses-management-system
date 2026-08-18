package com.dat_management.backend.controller;

import com.dat_management.backend.dto.JapaneseDashboardDTO;
import com.dat_management.backend.service.JapaneseDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/japanese-dashboard")
@RequiredArgsConstructor
public class JapaneseDashboardController {

    private final JapaneseDashboardService dashboardService;

    @GetMapping
    public ResponseEntity<JapaneseDashboardDTO> getDashboard() {
        return ResponseEntity.ok(dashboardService.buildDashboard());
    }
}