package com.dat_management.backend.service;

import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dat_management.backend.dto.NotificationResponse;
import com.dat_management.backend.entity.Course;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeCertificate;
import com.dat_management.backend.entity.Notification;
import com.dat_management.backend.entity.Notification.NotificationType;
import com.dat_management.backend.repository.CourseRepository;
import com.dat_management.backend.repository.EmployeeCertificateRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final EmployeeRepository employeeRepository;
    private final CourseRepository courseRepository;
    private final EmployeeCertificateRepository employeeCertificateRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Notification send(Employee recipient, NotificationType type, String title, String message, Object referenceId) {
        if (!shouldSendTo(recipient, type)) {
            return null;
        }

        Notification.NotificationBuilder builder = Notification.builder()
                .employee(recipient)
                .notificationType(type)
                .message(message)
                .isRead(false);

        if (type == NotificationType.COURSE) {
            Course course = resolveCourse(referenceId);
            builder.course(course);
        } else if (type == NotificationType.CERTIFICATE) {
            EmployeeCertificate certificate = resolveCertificate(referenceId);
            builder.certificate(certificate);
        }

        Notification notification = notificationRepository.save(builder.build());

        // Real-time notification for the connected employee.
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + recipient.getId(),
                NotificationResponse.from(notification)
        );

        return notification;
    }

    private boolean shouldSendTo(Employee employee, NotificationType type) {
        if (employee == null || type == null) {
            return false;
        }

        if (type == NotificationType.COURSE) {
            return employee.getCourseAnnounce() == null || Boolean.TRUE.equals(employee.getCourseAnnounce());
        }
        if (type == NotificationType.JLPT_EXAM) {
            return employee.getJlptExamAnnounce() == null || Boolean.TRUE.equals(employee.getJlptExamAnnounce());
        }
        if (type == NotificationType.CERTIFICATE) {
            return employee.getCertificateUpdates() == null || Boolean.TRUE.equals(employee.getCertificateUpdates());
        }
        if (type == NotificationType.SYSTEM) {
            return employee.getEmailNoti() == null || Boolean.TRUE.equals(employee.getEmailNoti());
        }

        return true;
    }

    private Course resolveCourse(Object referenceId) {
        if (referenceId instanceof Integer courseId) {
            return courseRepository.findById(courseId)
                    .orElse(null);
        }
        return null;
    }

    private EmployeeCertificate resolveCertificate(Object referenceId) {
        if (referenceId instanceof Integer certificateId) {
            return employeeCertificateRepository.findById(certificateId)
                    .orElse(null);
        }
        return null;
    }

    @Transactional
    public int sendToAllActive(NotificationType type, String title, String message, Object referenceId) {
        List<Employee> employees = employeeRepository.findAllByIsDeletedFalse();
        int sentCount = 0;

        for (Employee employee : employees) {
            if (send(employee, type, title, message, referenceId) != null) {
                sentCount++;
            }
        }

        return sentCount;
    }

    @Transactional
    public int sendToAdmins(NotificationType type, String title, String message, Object referenceId) {
        List<Employee> admins = employeeRepository.findAllByIsDeletedFalse().stream()
                .filter(e -> e.getRole() != null && e.getRole().getRoleName() != null)
                .filter(e -> {
                    String role = e.getRole().getRoleName().trim();
                    return role.equalsIgnoreCase("admin") || role.equalsIgnoreCase("PMO");
                }).toList();

        int sentCount = 0;
        for (Employee admin : admins) {
            if (send(admin, type, title, message, referenceId) != null) {
                sentCount++;
            }
        }

        return sentCount;
    }

    public List<Notification> getForEmployee(Employee employee, boolean unreadOnly) {
        return unreadOnly
                ? notificationRepository.findByEmployeeAndIsReadFalseOrderByCreatedAtDesc(employee)
                : notificationRepository.findByEmployeeOrderByCreatedAtDesc(employee);
    }

    public long unreadCount(Employee employee) {
        return notificationRepository.countByEmployeeAndIsReadFalse(employee);
    }

    @Transactional
    public void markRead(Integer id, Employee employee) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!n.getEmployee().getId().equals(employee.getId())) {
            throw new RuntimeException("You can only update your own notifications");
        }
        n.setIsRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead(Employee employee) {
        notificationRepository.findByEmployeeAndIsReadFalseOrderByCreatedAtDesc(employee)
                .forEach(n -> n.setIsRead(true));
    }
    
}
