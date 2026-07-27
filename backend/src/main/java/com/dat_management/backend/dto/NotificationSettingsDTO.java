package com.dat_management.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsDTO {
    private String employeeId;
    private Boolean courseAnnouncements;
    private Boolean examAnnouncements;
    private Boolean certificateUpdates;
    private Boolean emailNotifications;
}