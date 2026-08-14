package com.dat_management.backend.service;

import com.dat_management.backend.dto.CertificateStatisticsDtos.*;
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
        
        List<Object[]> certificateCounts = certificateRepository.countVerifiedCertificatesByTypeAndLevel();
        log.debug("Found {} certificate type-level combinations", certificateCounts.size());
        
        for (Object[] row : certificateCounts) {
            CertificateType type = (CertificateType) row[0];
            String level = (String) row[1];
            Long count = (Long) row[2];
            
            double countValue = count.doubleValue();
            
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
        
        List<Object[]> teamCertificateCounts = certificateRepository.countVerifiedCertificatesByTeamTypeAndLevel();
        log.debug("Found {} certificate entries across teams", teamCertificateCounts.size());
        
        for (Object[] row : teamCertificateCounts) {
            String teamName = (String) row[0];
            CertificateType type = (CertificateType) row[1];
            String level = (String) row[2];
            Long count = (Long) row[3];
            
            double countValue = count.doubleValue();
            
            String typeKey = type.name();
            result.computeIfAbsent(teamName, k -> new HashMap<>())
                  .computeIfAbsent(typeKey, k -> new HashMap<>())
                  .put(level != null ? level : "UNSPECIFIED", countValue);
                  
            log.debug("Added team statistics: {} - {} - {}: {}", 
                      teamName, typeKey, level, countValue);
        }
        
        return new TeamCertificateStatisticsDTO(result);
    }
    
    @Transactional(readOnly = true)
    public DepartmentCertificateStatisticsDTO getDepartmentStatistics() {
        log.info("Calculating department-wise certificate statistics with teams breakdown");
        Map<String, Map<String, Map<String, Map<String, Double>>>> result = new HashMap<>();
        
        List<Object[]> deptTeamCounts = certificateRepository.countVerifiedCertificatesByDepartmentTeamTypeAndLevel();
        log.debug("Found {} certificate entries across departments and teams", deptTeamCounts.size());
        
        for (Object[] row : deptTeamCounts) {
            String departmentName = (String) row[0];
            String teamName = (String) row[1];
            CertificateType type = (CertificateType) row[2];
            String level = (String) row[3];
            Long count = (Long) row[4];
            
            double countValue = count.doubleValue();
            
            String typeKey = type.name();
            result.computeIfAbsent(departmentName, k -> new HashMap<>())
                  .computeIfAbsent(teamName, k -> new HashMap<>())
                  .computeIfAbsent(typeKey, k -> new HashMap<>())
                  .put(level != null ? level : "UNSPECIFIED", countValue);
                  
            log.debug("Added department-team statistics: {} - {} - {} - {}: {}", 
                      departmentName, teamName, typeKey, level, countValue);
        }
        
        return new DepartmentCertificateStatisticsDTO(result);
    }
    
    @Transactional(readOnly = true)
    public DivisionCertificateStatisticsDTO getDivisionStatistics() {
        log.info("Calculating division-wise certificate statistics with departments and teams breakdown");
        Map<String, Map<String, Map<String, Map<String, Map<String, Double>>>>> result = new HashMap<>();
        
        List<Object[]> divDeptTeamCounts = certificateRepository.countVerifiedCertificatesByDivisionDepartmentTeamTypeAndLevel();
        log.debug("Found {} certificate entries across divisions, departments and teams", divDeptTeamCounts.size());
        
        for (Object[] row : divDeptTeamCounts) {
            String divisionName = (String) row[0];
            String departmentName = (String) row[1];
            String teamName = (String) row[2];
            CertificateType type = (CertificateType) row[3];
            String level = (String) row[4];
            Long count = (Long) row[5];
            
            double countValue = count.doubleValue();
            
            String typeKey = type.name();
            result.computeIfAbsent(divisionName, k -> new HashMap<>())
                  .computeIfAbsent(departmentName, k -> new HashMap<>())
                  .computeIfAbsent(teamName, k -> new HashMap<>())
                  .computeIfAbsent(typeKey, k -> new HashMap<>())
                  .put(level != null ? level : "UNSPECIFIED", countValue);
                  
            log.debug("Added division-department-team statistics: {} - {} - {} - {} - {}: {}", 
                      divisionName, departmentName, teamName, typeKey, level, countValue);
        }
        
        return new DivisionCertificateStatisticsDTO(result);
    }
}