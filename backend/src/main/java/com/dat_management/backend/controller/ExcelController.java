// ExcelController.java
package com.dat_management.backend.controller;

import com.dat_management.backend.service.ExcelExportService;
import com.dat_management.backend.service.ExcelDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("api/excel")
@RequiredArgsConstructor
@Slf4j
public class ExcelController {

    private final ExcelExportService excelExportService;
    private final ExcelDataService excelDataService;

    /**
     * Export all employees - English.
     *
     * GET /excel/export/all/english
     */
    @GetMapping("/export/all/english")
    public ResponseEntity<InputStreamResource> exportAllEmployeesEnglish() {
        return exportAllEmployeesByLanguage("en", "english");
    }

    /**
     * Export all employees - Japanese.
     *
     * GET /excel/export/all/japanese
     */
    @GetMapping("/export/all/japanese")
    public ResponseEntity<InputStreamResource> exportAllEmployeesJapanese() {
        return exportAllEmployeesByLanguage("ja", "japanese");
    }

    private ResponseEntity<InputStreamResource> exportAllEmployeesByLanguage(
            String language, String languageName) {
        try {
            ByteArrayInputStream bis = excelExportService.exportAllEmployees(language);
            String timestamp = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));

            HttpHeaders headers = new HttpHeaders();
            headers.add(
                HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=employees_export_" + languageName
                    + "_" + timestamp + ".xlsx"
            );
            headers.add(
                HttpHeaders.CONTENT_TYPE,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );

            return ResponseEntity.ok()
                .headers(headers)
                .body(new InputStreamResource(bis));

        } catch (Exception e) {
            log.error(
                "Error exporting all employees in {}: {}",
                language, e.getMessage(), e
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

   

   
}
