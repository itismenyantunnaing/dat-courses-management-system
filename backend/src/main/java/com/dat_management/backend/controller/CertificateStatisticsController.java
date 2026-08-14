package com.dat_management.backend.controller;

import com.dat_management.backend.dto.CertificateStatisticsDtos.DepartmentCertificateStatisticsDTO;
import com.dat_management.backend.dto.CertificateStatisticsDtos.DivisionCertificateStatisticsDTO;
import com.dat_management.backend.dto.CertificateStatisticsDtos.OverallCertificateStatisticsDTO;
import com.dat_management.backend.dto.CertificateStatisticsDtos.TeamCertificateStatisticsDTO;
import com.dat_management.backend.service.CertificateStatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/certificate-statistics")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class CertificateStatisticsController {
    
    private final CertificateStatisticsService statisticsService;
    
    @GetMapping("/overall")
    public ResponseEntity<OverallCertificateStatisticsDTO> getOverallStatistics() {
        log.info("Received request for overall certificate statistics");
        OverallCertificateStatisticsDTO response = statisticsService.getOverallStatistics();
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/teams")
    public ResponseEntity<TeamCertificateStatisticsDTO> getTeamStatistics() {
        log.info("Received request for team-wise certificate statistics");
        TeamCertificateStatisticsDTO response = statisticsService.getTeamStatistics();
        return ResponseEntity.ok(response);
    }

     @GetMapping("/departments")
    public ResponseEntity<DepartmentCertificateStatisticsDTO> getDepartmentStatistics() {
        log.info("Received request for department-wise certificate statistics");
        DepartmentCertificateStatisticsDTO response = statisticsService.getDepartmentStatistics();
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/divisions")
    public ResponseEntity<DivisionCertificateStatisticsDTO> getDivisionStatistics() {
        log.info("Received request for division-wise certificate statistics");
        DivisionCertificateStatisticsDTO response = statisticsService.getDivisionStatistics();
        return ResponseEntity.ok(response);
    }
}