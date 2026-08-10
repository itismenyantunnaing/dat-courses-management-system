package com.dat_management.backend.service;

import com.dat_management.backend.dto.CertificateStatisticsDtos.OverallCertificateStatisticsDTO;
import com.dat_management.backend.dto.CertificateStatisticsDtos.TeamCertificateStatisticsDTO;
import com.dat_management.backend.entity.EmployeeCertificate.CertificateType;
import com.dat_management.backend.repository.EmployeeCertificateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateStatisticsService {
    
    private final EmployeeCertificateRepository certificateRepository;
    
    @Transactional(readOnly = true)
    public OverallCertificateStatisticsDTO getOverallStatistics() {
        log.info("Calculating overall certificate statistics");
        Map<String, Map<String, Double>> result = new HashMap<>();
        
        // Get certificate counts
        List<Object[]> certificateCounts = certificateRepository.countVerifiedCertificatesByTypeAndLevel();
        log.debug("Found {} certificate type-level combinations", certificateCounts.size());
        
        for (Object[] row : certificateCounts) {
            CertificateType type = (CertificateType) row[0];
            String level = (String) row[1];
            Long count = (Long) row[2];
            
            // Use count directly as Double
            double countValue = count.doubleValue();
            
            // Add to result map
            String typeKey = type.name();
            result.computeIfAbsent(typeKey, k -> new HashMap<>())
                  .put(level != null ? level : "UNSPECIFIED", countValue);
                  
            log.debug("Added statistics: {} - {}: {}", typeKey, level, countValue);
        }
        
        return new OverallCertificateStatisticsDTO(result);
    }
    
    @Transactional(readOnly = true)
    public TeamCertificateStatisticsDTO getTeamStatistics() {
        log.info("Calculating team-wise certificate statistics");
        Map<String, Map<String, Map<String, Double>>> result = new HashMap<>();
        
        // Get certificate counts by team
        List<Object[]> teamCertificateCounts = certificateRepository.countVerifiedCertificatesByTeamTypeAndLevel();
        log.debug("Found {} certificate entries across teams", teamCertificateCounts.size());
        
        for (Object[] row : teamCertificateCounts) {
            String teamName = (String) row[0];
            CertificateType type = (CertificateType) row[1];
            String level = (String) row[2];
            Long count = (Long) row[3];
            
            // Use count directly as Double
            double countValue = count.doubleValue();
            
            // Add to result map
            String typeKey = type.name();
            result.computeIfAbsent(teamName, k -> new HashMap<>())
                  .computeIfAbsent(typeKey, k -> new HashMap<>())
                  .put(level != null ? level : "UNSPECIFIED", countValue);
                  
            log.debug("Added team statistics: {} - {} - {}: {}", 
                      teamName, typeKey, level, countValue);
        }
        
        return new TeamCertificateStatisticsDTO(result);
    }
    
    // Optional: Get statistics for a specific team
    @Transactional(readOnly = true)
    public Map<String, Map<String, Double>> getTeamStatisticsByTeamName(String teamName) {
        log.info("Calculating certificate statistics for team: {}", teamName);
        Map<String, Map<String, Double>> result = new HashMap<>();
        
        // Get specific team's certificate counts
        List<Object[]> teamCertificateCounts = certificateRepository.countVerifiedCertificatesByTeamTypeAndLevel();
        
        for (Object[] row : teamCertificateCounts) {
            String currentTeamName = (String) row[0];
            if (!currentTeamName.equals(teamName)) continue;
            
            CertificateType type = (CertificateType) row[1];
            String level = (String) row[2];
            Long count = (Long) row[3];
            
            // Use count directly as Double
            double countValue = count.doubleValue();
            
            String typeKey = type.name();
            result.computeIfAbsent(typeKey, k -> new HashMap<>())
                  .put(level != null ? level : "UNSPECIFIED", countValue);
        }
        
        return result;
    }
}