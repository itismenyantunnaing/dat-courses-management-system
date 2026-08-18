package com.dat_management.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.dat_management.backend.dto.SystemConfigRequest;
import com.dat_management.backend.entity.SystemConfig;
import com.dat_management.backend.repository.SystemConfigRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/system-config")
@RequiredArgsConstructor

public class SystemConfigController {

    private final SystemConfigRepository systemConfigRepository;

    @GetMapping
    public ResponseEntity<SystemConfig> getSystemConfig() {

        SystemConfig config = systemConfigRepository.findById(1L)
                .orElseThrow(() ->
                        new RuntimeException("System configuration not found"));

        return ResponseEntity.ok(config);
    }

    @PutMapping
    public ResponseEntity<SystemConfig> updateSystemConfig(
            @RequestBody SystemConfigRequest request) {

        SystemConfig config = systemConfigRepository.findById(1L)
                .orElseGet(() -> {
                    SystemConfig newConfig = new SystemConfig();
                    newConfig.setId(1L);
                    return newConfig;
                });

        config.setFileUploadSizeMb(request.getFileUploadSizeMb());
        config.setSessionTimeoutMinutes(request.getSessionTimeoutMinutes());
        config.setJwtExpiryHours(request.getJwtExpiryHours());
        config.setMaxLoginAttempts(request.getMaxLoginAttempts());

        config.setActiveSmtpProvider(request.getActiveSmtpProvider());

        config.setGmailHost(request.getGmailHost());
        config.setGmailPort(request.getGmailPort());
        config.setGmailUsername(request.getGmailUsername());
        config.setGmailPassword(request.getGmailPassword());

        config.setOutlookHost(request.getOutlookHost());
        config.setOutlookPort(request.getOutlookPort());
        config.setOutlookUsername(request.getOutlookUsername());
        config.setOutlookPassword(request.getOutlookPassword());

        SystemConfig savedConfig =
                systemConfigRepository.save(config);

        return ResponseEntity.ok(savedConfig);
    }
}