package com.dat_management.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dat_management.backend.dto.NotificationSettingsDTO;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationSettingsService {

    private final EmployeeRepository employeeRepository;

    @Transactional
    public NotificationSettingsDTO updateNotificationSettings(NotificationSettingsDTO settingsDTO) {
        // Find employee by ID
           Employee employee = employeeRepository.findByIdAndIsDeletedFalse(settingsDTO.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found: " + settingsDTO.getEmployeeId()));

        // Update notification settings
        if (settingsDTO.getCourseAnnouncements() != null) {
            employee.setCourseAnnounce(settingsDTO.getCourseAnnouncements());
        }
        if (settingsDTO.getExamAnnouncements() != null) {
            employee.setJlptExamAnnounce(settingsDTO.getExamAnnouncements());
        }
        if (settingsDTO.getCertificateUpdates() != null) {
            employee.setCertificateUpdates(settingsDTO.getCertificateUpdates());
        }
        if (settingsDTO.getEmailNotifications() != null) {
            employee.setEmailNoti(settingsDTO.getEmailNotifications());
        }

        // Save updated employee
        Employee updatedEmployee = employeeRepository.save(employee);

        // Return updated settings
        return new NotificationSettingsDTO(
                updatedEmployee.getId(),
                updatedEmployee.getCourseAnnounce(),
                updatedEmployee.getJlptExamAnnounce(),
                updatedEmployee.getCertificateUpdates(),
                updatedEmployee.getEmailNoti()
        );
    }

    public NotificationSettingsDTO getNotificationSettings(String employeeId) {
         Employee employee = employeeRepository.findByIdAndIsDeletedFalse(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        return new NotificationSettingsDTO(
                employee.getId(),
                employee.getCourseAnnounce(),
                employee.getJlptExamAnnounce(),
                employee.getCertificateUpdates(),
                employee.getEmailNoti()
        );
    }
}