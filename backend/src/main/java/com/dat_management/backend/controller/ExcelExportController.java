// ExcelExportController.java
package com.dat_management.backend.controller;

import com.dat_management.backend.dto.JapaneseDashboardDTO;
import com.dat_management.backend.service.DashboardExcelExportService;
import com.dat_management.backend.service.JapaneseDashboardService;
import com.dat_management.backend.service.SessionProgressExcelExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/excel")
@RequiredArgsConstructor
public class ExcelExportController {

    private final JapaneseDashboardService dashboardService;
    private final DashboardExcelExportService excelExportService;
    private final SessionProgressExcelExportService sessionExcelExportService;

    private static final DateTimeFormatter FILE_NAME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd_HHmmss");

    @GetMapping("/export-dashboard")
    public ResponseEntity<ByteArrayResource> exportDashboard() {
        try {
            // 1. Get data from your service
            JapaneseDashboardDTO dashboardData = dashboardService.buildDashboard();
            
            // 2. Generate Excel
            byte[] excelBytes = excelExportService.generateExcel(dashboardData);
            
            // 3. Create response
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = "japanese_dashboard_report_" + timestamp + ".xlsx";
            
            ByteArrayResource resource = new ByteArrayResource(excelBytes);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(excelBytes.length)
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/export-dashboard/preview")
    public ResponseEntity<JapaneseDashboardDTO> previewDashboard() {
        try {
            JapaneseDashboardDTO dashboardData = dashboardService.buildDashboard();
            return ResponseEntity.ok(dashboardData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/progress/{courseId}")
    public ResponseEntity<byte[]> exportAllProgress(@PathVariable Integer courseId) {
        try {
            ByteArrayInputStream excelStream = sessionExcelExportService
                    .exportAllProgressToExcel(courseId);
            
            byte[] excelBytes = excelStream.readAllBytes();
            
            String timestamp = LocalDateTime.now().format(FILE_NAME_FORMATTER);
            String fileName = String.format("full_progress_report_course_%d_%s.xlsx", courseId, timestamp);
            
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, 
                    "attachment; filename=\"" + fileName + "\"");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(excelBytes);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}