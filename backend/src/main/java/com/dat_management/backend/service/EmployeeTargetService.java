package com.dat_management.backend.service;

import com.dat_management.backend.dto.EmployeeTargetLevelDTO;
import com.dat_management.backend.entity.EmployeeJapaneseProfile;
import com.dat_management.backend.entity.TargetTerm;
import com.dat_management.backend.repository.EmployeeJapaneseProfileRepository;
import com.dat_management.backend.repository.TargetTermRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class EmployeeTargetService {

    private static final Logger log = LoggerFactory.getLogger(EmployeeTargetService.class);

    private final EmployeeJapaneseProfileRepository profileRepository;
    private final TargetTermRepository targetTermRepository;

    @Transactional(readOnly = true)
    public EmployeeTargetLevelDTO getTargetLevelForEmployee(String employeeId) {
        try {
            // Get the employee's Japanese profile
            EmployeeJapaneseProfile profile = profileRepository.findByEmployeeId(employeeId)
                    .orElse(null);
            
            if (profile == null) {
                log.warn("Employee profile not found for employeeId: {}", employeeId);
                return null;
            }

            // Get the target terms (assuming there's only one row in target_terms table)
            TargetTerm targetTerm = targetTermRepository.findAll().stream()
                    .findFirst()
                    .orElse(null);
            
            if (targetTerm == null) {
                log.warn("Target terms not configured");
                return null;
            }

            EmployeeTargetLevelDTO dto = getTargetLevel(profile, targetTerm);
            
            // Set the highest JLPT level from the profile
            dto.setJlptHighestLevel(profile.getJlptHighestLevel());
            
            return dto;
            
        } catch (Exception e) {
            log.error("Error getting target level for employee {}: {}", employeeId, e.getMessage(), e);
            return null;
        }
    }

    private EmployeeTargetLevelDTO getTargetLevel(EmployeeJapaneseProfile profile, TargetTerm targetTerm) {
        LocalDate today = LocalDate.now();
        boolean isTarget1Passed = today.isAfter(targetTerm.getTarget1Date()) || 
                                 today.isEqual(targetTerm.getTarget1Date());

        EmployeeTargetLevelDTO dto = new EmployeeTargetLevelDTO();
        dto.setEmployeeId(profile.getEmployee().getId());

        if (isTarget1Passed) {
            // Target1 date has passed or is today, return target2
            dto.setTargetJlptNatLevel(profile.getTarget2JlptNatLevel());
            dto.setTargetDate(targetTerm.getTarget2Date());
        } else {
            // Target1 date hasn't passed yet, return target1
            dto.setTargetJlptNatLevel(profile.getTarget1JlptNatLevel());
            dto.setTargetDate(targetTerm.getTarget1Date());
        }

        return dto;
    }
}