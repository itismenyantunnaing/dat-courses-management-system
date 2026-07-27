package com.dat_management.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dat_management.backend.dto.NotificationSettingsDTO;
import com.dat_management.backend.service.NotificationSettingsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notificationSettings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationSettingsController {

    private final NotificationSettingsService notificationService;

    @PutMapping("/settings")
    public ResponseEntity<NotificationSettingsDTO> updateNotificationSettings(
            @RequestBody NotificationSettingsDTO settingsDTO) {
        NotificationSettingsDTO updatedSettings = notificationService.updateNotificationSettings(settingsDTO);
        return ResponseEntity.ok(updatedSettings);
    }

    @GetMapping("/settings/{employeeId}")
    public ResponseEntity<NotificationSettingsDTO> getNotificationSettings(
            @PathVariable String employeeId) {
        NotificationSettingsDTO settings = notificationService.getNotificationSettings(employeeId);
        return ResponseEntity.ok(settings);
    }
}