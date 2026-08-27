package com.dat_management.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dat_management.backend.dto.NotificationResponse;
import com.dat_management.backend.entity.Course;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeCertificate;
import com.dat_management.backend.entity.Notification;
import com.dat_management.backend.entity.Notification.NotificationType;
import com.dat_management.backend.entity.NotificationRecipient;
import com.dat_management.backend.repository.CourseRepository;
import com.dat_management.backend.repository.EmployeeCertificateRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.NotificationRecipientRepository;
import com.dat_management.backend.repository.NotificationRepository;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmployeeRepository employeeRepository;
    private final CourseRepository courseRepository;
    private final EmployeeCertificateRepository certificateRepository;
    private final NotificationRecipientRepository recipientRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ================================================================
    // ORIGINAL METHOD - Send notification with reference
    // ================================================================
    @Transactional
public Notification send(NotificationType type,
                         String message,
                         Object referenceId,
                         HttpServletRequest request) {

    Notification.NotificationBuilder builder = Notification.builder()
            .notificationType(type)
            .message(message);

    if (type == NotificationType.COURSE && referenceId instanceof Integer courseId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        builder.course(course);
    }

    if (type == NotificationType.CERTIFICATE && referenceId instanceof Integer certificateId) {
        EmployeeCertificate certificate =
                certificateRepository.findById(certificateId).orElse(null);
        builder.certificate(certificate);
    }

    Notification notification = notificationRepository.save(builder.build());
    log.info(" Notification saved with ID: {}", notification.getId());

    List<Employee> employees = employeeRepository.findAllByIsDeletedFalse();
    log.info("📋 Found {} active employees", employees.size());

    // Get the current employee ID from the request/authentication
    String currentEmployeeId = getCurrentEmployeeId();
    log.info("🔑 Current employee ID: {}", currentEmployeeId);

    int recipientCount = 0;
    int skippedCount = 0;
    
    for (Employee employee : employees) {
        // Skip the employee who created the course (the one from the token)
        if (currentEmployeeId != null && currentEmployeeId.equals(employee.getId())) {
            log.debug("⏭️ Skipping notification for creator: {}", employee.getId());
            skippedCount++;
            continue;
        }

        if (!shouldSendTo(employee, type)) {
            log.debug("⏭️ Skipping employee: {} (preferences disabled)", employee.getId());
            continue;
        }

        log.debug(" Creating recipient for employee: {}", employee.getId());
        
        // Create recipient record
        NotificationRecipient recipient = new NotificationRecipient();
        recipient.setNotification(notification);
        recipient.setEmployee(employee);
        recipient.setIsRead(false);
        recipient.setReadAt(null);
        recipientRepository.save(recipient);
        recipientCount++;

        // Create response with recipient
        NotificationResponse response = NotificationResponse.from(notification, recipient);

        // Send via WebSocket
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + employee.getId(),
                response
        );
    }

    log.info("📨 Created {} notification recipients, skipped {} (creator)", recipientCount, skippedCount);
    return notification;
}

    // ================================================================
    // METHOD 1: Send to all active employees (with title)
    // Called by: TargetTermService, CourseService
    // ================================================================
    @Transactional
    public Notification sendToAllActive(NotificationType type, 
                                        String title, 
                                        String message, 
                                        Object referenceId,
                                    HttpServletRequest request) {
        String fullMessage = title + ": " + message;
        return send(type, fullMessage, referenceId,request);
    }

    // ================================================================
    // METHOD 2: Send to administrators only
    // Called by: CertificateService
    // ================================================================
    @Transactional
    public Notification sendToAdmins(NotificationType type, 
                                     String title, 
                                     String message, 
                                     Object referenceId) {
        String fullMessage = title + ": " + message;
        
        Notification.NotificationBuilder builder = Notification.builder()
                .notificationType(type)
                .message(fullMessage);

        if (type == NotificationType.COURSE && referenceId instanceof Integer courseId) {
            Course course = courseRepository.findById(courseId).orElse(null);
            builder.course(course);
        }

        if (type == NotificationType.CERTIFICATE && referenceId instanceof Integer certificateId) {
            EmployeeCertificate certificate =
                    certificateRepository.findById(certificateId).orElse(null);
            builder.certificate(certificate);
        }

        Notification notification = notificationRepository.save(builder.build());
        log.info(" Admin notification saved with ID: {}", notification.getId());

        List<Employee> admins = employeeRepository.findAllByIsDeletedFalse().stream()
                .filter(this::isAdmin)
                .collect(Collectors.toList());
        
        log.info("📋 Found {} admin employees", admins.size());

        for (Employee employee : admins) {
            // Create recipient record
            NotificationRecipient recipient = new NotificationRecipient();
            recipient.setNotification(notification);
            recipient.setEmployee(employee);
            recipient.setIsRead(false);
            recipient.setReadAt(null);
            recipientRepository.save(recipient);

            // Create response with recipient
            NotificationResponse response = NotificationResponse.from(notification, recipient);

            // Send via WebSocket
            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + employee.getId(),
                    response
            );
        }

        return notification;
    }

    // ================================================================
    // METHOD 3: Send to a specific employee
    // Called by: CertificateService
    // ================================================================
    @Transactional
    public Notification send(Employee employee, 
                             NotificationType type, 
                             String title, 
                             String message, 
                             Object referenceId) {
        String fullMessage = title + ": " + message;
        
        Notification.NotificationBuilder builder = Notification.builder()
                .notificationType(type)
                .message(fullMessage);

        if (type == NotificationType.COURSE && referenceId instanceof Integer courseId) {
            Course course = courseRepository.findById(courseId).orElse(null);
            builder.course(course);
        }

        if (type == NotificationType.CERTIFICATE && referenceId instanceof Integer certificateId) {
            EmployeeCertificate certificate =
                    certificateRepository.findById(certificateId).orElse(null);
            builder.certificate(certificate);
        }

        Notification notification = notificationRepository.save(builder.build());
        log.info(" Personal notification saved with ID: {} for employee: {}", notification.getId(), employee.getId());

        // Create recipient record for the specific employee
        NotificationRecipient recipient = new NotificationRecipient();
        recipient.setNotification(notification);
        recipient.setEmployee(employee);
        recipient.setIsRead(false);
        recipient.setReadAt(null);
        recipientRepository.save(recipient);

        // Create response with recipient
        NotificationResponse response = NotificationResponse.from(notification, recipient);

        // Send only to the specified employee
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + employee.getId(),
                response
        );

        return notification;
    }

    // ================================================================
    // METHOD 4: Get notifications for a specific employee with responses
    // Called by: NotificationController
    // ================================================================
    @Transactional(readOnly = true)
    public List<NotificationResponse> getForEmployee(Employee employee, boolean unreadOnly) {
        List<NotificationRecipient> recipients;
        
        if (unreadOnly) {
            recipients = recipientRepository.findByEmployeeAndIsReadFalse(employee);
        } else {
            recipients = recipientRepository.findByEmployeeOrderByNotificationCreatedAtDesc(employee);
        }
        
        return recipients.stream()
                .map(recipient -> NotificationResponse.from(recipient.getNotification(), recipient))
                .collect(Collectors.toList());
    }

    // ================================================================
    // METHOD 5: Get unread count for an employee
    // Called by: NotificationController
    // ================================================================
    @Transactional(readOnly = true)
    public long unreadCount(Employee employee) {
        return recipientRepository.countByEmployeeAndIsReadFalse(employee);
    }

    // ================================================================
    // METHOD 6: Mark a specific notification as read
    // Called by: NotificationController
    // ================================================================
    @Transactional
    public void markRead(Integer notificationId, Employee employee) {
        NotificationRecipient recipient = recipientRepository
                .findByNotificationIdAndEmployee(notificationId, employee)
                .orElseThrow(() -> new RuntimeException(
                        "Notification not found for this employee: " + notificationId));
        
        recipient.setIsRead(true);
        recipient.setReadAt(LocalDateTime.now());
        recipientRepository.save(recipient);
    }

    // ================================================================
    // METHOD 7: Mark all notifications as read for an employee
    // Called by: NotificationController
    // ================================================================
    @Transactional
    public void markAllRead(Employee employee) {
        List<NotificationRecipient> unreadRecipients = 
                recipientRepository.findByEmployeeAndIsReadFalse(employee);
        
        for (NotificationRecipient recipient : unreadRecipients) {
            recipient.setIsRead(true);
            recipient.setReadAt(LocalDateTime.now());
        }
        
        recipientRepository.saveAll(unreadRecipients);
    }

    // ================================================================
    // METHOD 8: Get all notifications (admin only)
    // ================================================================
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }

    // ================================================================
    // HELPER METHODS
    // ================================================================
    
    private boolean shouldSendTo(Employee employee, NotificationType type) {
        return switch (type) {
            case COURSE ->
                    employee.getCourseAnnounce() == null ||
                    employee.getCourseAnnounce();

            case JLPT_EXAM ->
                    employee.getJlptExamAnnounce() == null ||
                    employee.getJlptExamAnnounce();

            case CERTIFICATE ->
                    employee.getCertificateUpdates() == null ||
                    employee.getCertificateUpdates();

            case SYSTEM ->
                    employee.getEmailNoti() == null ||
                    employee.getEmailNoti();
        };
    }

    private boolean isAdmin(Employee employee) {
        if (employee.getRole() != null && employee.getRole().getRoleName() != null) {
            String roleName = employee.getRole().getRoleName().trim().toUpperCase();
            return "ADMIN".equalsIgnoreCase(roleName) || 
                   "ROLE_ADMIN".equalsIgnoreCase(roleName);
        }
        return false;
    }

     private String getCurrentEmployeeId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()
                    || auth instanceof AnonymousAuthenticationToken
                    || "anonymousUser".equals(auth.getName())) {
                return null;
            }
            return auth.getName();
        } catch (Exception e) {
            return null;
        }
    }
}