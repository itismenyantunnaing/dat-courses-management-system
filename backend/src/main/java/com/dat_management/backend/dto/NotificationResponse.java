package com.dat_management.backend.dto;

import java.time.LocalDateTime;

import com.dat_management.backend.entity.Notification;
import com.dat_management.backend.entity.NotificationRecipient;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class NotificationResponse {

    Integer id;
    Integer courseId;
    Integer certificateId;
    String employeeId;
    Boolean isRead;
    String type;
    String message;
    LocalDateTime createdAt;

    public static NotificationResponse from(Notification notification , NotificationRecipient recipient) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .employeeId(recipient.getEmployee().getId())
                .isRead(Boolean.TRUE.equals(recipient.getIsRead()))
                .courseId(notification.getCourse() != null
                        ? notification.getCourse().getId()
                        : null)
                .certificateId(notification.getCertificate() != null
                        ? notification.getCertificate().getId()
                        : null)
                .type(notification.getNotificationType().name())
                .message(notification.getMessage())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}