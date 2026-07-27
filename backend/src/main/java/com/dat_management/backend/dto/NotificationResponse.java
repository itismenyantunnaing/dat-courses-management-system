package com.dat_management.backend.dto;

import com.dat_management.backend.entity.Notification;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class NotificationResponse {
    Integer id;
    Integer courseId;
    Integer certificateId;
    String type;
    String message;
    boolean read;
    LocalDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .courseId(n.getCourse() != null ? n.getCourse().getId() : null)
                .certificateId(n.getCertificate() != null ? n.getCertificate().getId() : null)
                .type(n.getNotificationType() != null ? n.getNotificationType().name() : null)
                .message(n.getMessage())
                .read(Boolean.TRUE.equals(n.getIsRead()))
                .createdAt(n.getCreatedAt())
                .build();
    }
}