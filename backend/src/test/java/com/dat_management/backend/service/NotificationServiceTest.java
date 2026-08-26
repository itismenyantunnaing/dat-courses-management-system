package com.dat_management.backend.service;

import com.dat_management.backend.dto.NotificationResponse;
import com.dat_management.backend.entity.Course;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeCertificate;
import com.dat_management.backend.entity.Notification;
import com.dat_management.backend.entity.Notification.NotificationType;
import com.dat_management.backend.entity.NotificationRecipient;
import com.dat_management.backend.entity.Role;
import com.dat_management.backend.repository.CourseRepository;
import com.dat_management.backend.repository.EmployeeCertificateRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.NotificationRecipientRepository;
import com.dat_management.backend.repository.NotificationRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// ─────────────────────────────────────────────────────────────────────────────
// Unit Tests for NotificationService
//
// Zero prior coverage. This service has 4 different "send" entry points that
// don't all apply the same rules (creator-skip, per-employee preference
// checks) — that's worth pinning down explicitly rather than assumed
// consistent. See TC_NOTI_10 and TC_NOTI_12 for where they diverge.
// ─────────────────────────────────────────────────────────────────────────────

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private EmployeeCertificateRepository certificateRepository;
    @Mock private NotificationRecipientRepository recipientRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;

    private NotificationService service;

    @BeforeEach
    void setUp() {
        service = new NotificationService(notificationRepository, employeeRepository, courseRepository,
                certificateRepository, recipientRepository, messagingTemplate);
        // Echo back whatever Notification is passed to save(), with an id assigned — the service
        // keeps using the returned reference for everything downstream (attaching recipients,
        // building the WebSocket payload, and its own return value).
        lenient().when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification n = invocation.getArgument(0);
            n.setId(100);
            return n;
        });
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ── send(type, message, referenceId, request) ────────────────────────────

    @Test
    @DisplayName("TC_NOTI_01 | send | COURSE type with a valid course reference → course attached, creator skipped, everyone else notified")
    void send_courseType_attachesCourseAndSkipsCreator() {
        authenticateAs("EMP001");
        Employee creator = buildEmployee("EMP001");
        Employee other1 = buildEmployee("EMP002");
        Employee other2 = buildEmployee("EMP003");
        when(employeeRepository.findAllByIsDeletedFalse()).thenReturn(List.of(creator, other1, other2));
        Course course = new Course();
        course.setId(5);
        when(courseRepository.findById(5)).thenReturn(Optional.of(course));

        Notification result = service.send(NotificationType.COURSE, "New course available", 5, null);

        assertThat(result.getCourse()).isNotNull();
        assertThat(result.getCourse().getId()).isEqualTo(5);

        ArgumentCaptor<NotificationRecipient> captor = ArgumentCaptor.forClass(NotificationRecipient.class);
        verify(recipientRepository, times(2)).save(captor.capture());
        assertThat(captor.getAllValues().stream().map(r -> r.getEmployee().getId()))
                .containsExactlyInAnyOrder("EMP002", "EMP003");

        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        verify(messagingTemplate, times(2)).convertAndSend(topicCaptor.capture(), any(NotificationResponse.class));
        assertThat(topicCaptor.getAllValues())
                .containsExactlyInAnyOrder("/topic/notifications/EMP002", "/topic/notifications/EMP003");
    }

    @Test
    @DisplayName("TC_NOTI_02 | send | CERTIFICATE type with a valid certificate reference → certificate attached, course left null")
    void send_certificateType_attachesCertificate() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findAllByIsDeletedFalse()).thenReturn(List.of(employee));
        EmployeeCertificate certificate = new EmployeeCertificate();
        certificate.setId(7);
        when(certificateRepository.findById(7)).thenReturn(Optional.of(certificate));

        Notification result = service.send(NotificationType.CERTIFICATE, "Certificate approved", 7, null);

        assertThat(result.getCertificate()).isNotNull();
        assertThat(result.getCertificate().getId()).isEqualTo(7);
        assertThat(result.getCourse()).isNull();
    }

    @Test
    @DisplayName("TC_NOTI_03 | send | COURSE type but the referenced course no longer exists → saved with a null course, no exception")
    void send_courseNotFound_savesWithNullCourse() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findAllByIsDeletedFalse()).thenReturn(List.of(employee));
        when(courseRepository.findById(99)).thenReturn(Optional.empty());

        Notification result = service.send(NotificationType.COURSE, "msg", 99, null);

        assertThat(result.getCourse()).isNull();
        verify(recipientRepository, times(1)).save(any(NotificationRecipient.class));
    }

    @Test
    @DisplayName("TC_NOTI_04 | send | SYSTEM type → never touches course/certificate lookups even if a referenceId is given")
    void send_systemType_ignoresReferenceId() {
        Employee employee = buildEmployee("EMP001");
        when(employeeRepository.findAllByIsDeletedFalse()).thenReturn(List.of(employee));

        Notification result = service.send(NotificationType.SYSTEM, "System maintenance", 5, null);

        assertThat(result.getCourse()).isNull();
        assertThat(result.getCertificate()).isNull();
        verifyNoInteractions(courseRepository, certificateRepository);
    }

    @Test
    @DisplayName("TC_NOTI_05 | send | no authenticated user in this session → nobody is skipped as \"the creator\"")
    void send_noAuthenticatedUser_notifiesEveryone() {
        // SecurityContextHolder is left empty (no authenticateAs call) to simulate a system-triggered
        // notification with no request-bound user.
        Employee emp1 = buildEmployee("EMP001");
        Employee emp2 = buildEmployee("EMP002");
        when(employeeRepository.findAllByIsDeletedFalse()).thenReturn(List.of(emp1, emp2));

        service.send(NotificationType.SYSTEM, "msg", null, null);

        verify(recipientRepository, times(2)).save(any(NotificationRecipient.class));
    }

    @Test
    @DisplayName("TC_NOTI_06 | send | employee has disabled this notification type → skipped, others still notified")
    void send_preferenceDisabled_skipsThatEmployeeOnly() {
        Employee optedOut = buildEmployee("EMP001");
        optedOut.setCourseAnnounce(false);
        Employee optedIn = buildEmployee("EMP002");
        when(employeeRepository.findAllByIsDeletedFalse()).thenReturn(List.of(optedOut, optedIn));

        service.send(NotificationType.COURSE, "msg", null, null);

        ArgumentCaptor<NotificationRecipient> captor = ArgumentCaptor.forClass(NotificationRecipient.class);
        verify(recipientRepository, times(1)).save(captor.capture());
        assertThat(captor.getValue().getEmployee().getId()).isEqualTo("EMP002");
    }

    @Test
    @DisplayName("TC_NOTI_07 | send | preference field is null (never set) → treated as opted-in, not skipped")
    void send_nullPreferenceField_treatedAsOptedIn() {
        Employee employee = buildEmployee("EMP001");
        employee.setCourseAnnounce(null);
        when(employeeRepository.findAllByIsDeletedFalse()).thenReturn(List.of(employee));

        service.send(NotificationType.COURSE, "msg", null, null);

        verify(recipientRepository, times(1)).save(any(NotificationRecipient.class));
    }

    @Test
    @DisplayName("TC_NOTI_08 | send | SYSTEM notifications are gated by the emailNoti flag specifically (not a dedicated system-notice flag)")
    void send_systemType_gatedByEmailNotiPreference() {
        // Worth knowing for anyone tweaking the notification settings UI: there's no separate
        // "system announcements" toggle — SYSTEM-type messages piggyback on emailNoti.
        Employee optedOut = buildEmployee("EMP001");
        optedOut.setEmailNoti(false);
        Employee optedIn = buildEmployee("EMP002");
        when(employeeRepository.findAllByIsDeletedFalse()).thenReturn(List.of(optedOut, optedIn));

        service.send(NotificationType.SYSTEM, "Downtime notice", null, null);

        ArgumentCaptor<NotificationRecipient> captor = ArgumentCaptor.forClass(NotificationRecipient.class);
        verify(recipientRepository, times(1)).save(captor.capture());
        assertThat(captor.getValue().getEmployee().getId()).isEqualTo("EMP002");
    }

    // ── sendToAdmins(type, title, message, referenceId) ───────────────────────

    @Test
    @DisplayName("TC_NOTI_09 | sendToAdmins | only ADMIN / ROLE_ADMIN employees (case-insensitive) receive it")
    void sendToAdmins_onlyNotifiesAdmins() {
        Employee admin1 = buildEmployee("EMP001", roleNamed("admin"));
        Employee staff = buildEmployee("EMP002", roleNamed("staff"));
        Employee admin2 = buildEmployee("EMP003", roleNamed("ROLE_ADMIN"));
        when(employeeRepository.findAllByIsDeletedFalse()).thenReturn(List.of(admin1, staff, admin2));

        service.sendToAdmins(NotificationType.SYSTEM, "Title", "Body", null);

        ArgumentCaptor<NotificationRecipient> captor = ArgumentCaptor.forClass(NotificationRecipient.class);
        verify(recipientRepository, times(2)).save(captor.capture());
        assertThat(captor.getAllValues().stream().map(r -> r.getEmployee().getId()))
                .containsExactlyInAnyOrder("EMP001", "EMP003");
    }

    @Test
    @DisplayName("TC_NOTI_10 | sendToAdmins | the creator IS still notified even if they're an admin " +
            "(INCONSISTENCY: unlike send()/sendToAllActive(), this method has no creator-skip logic)")
    void sendToAdmins_doesNotSkipTheCreator() {
        authenticateAs("EMP001");
        Employee adminCreator = buildEmployee("EMP001", roleNamed("admin"));
        when(employeeRepository.findAllByIsDeletedFalse()).thenReturn(List.of(adminCreator));

        service.sendToAdmins(NotificationType.SYSTEM, "Title", "Body", null);

        verify(recipientRepository, times(1)).save(any(NotificationRecipient.class));
    }

    @Test
    @DisplayName("TC_NOTI_11 | sendToAdmins | employee with no role assigned is safely excluded, no NPE")
    void sendToAdmins_nullRole_excludedWithoutError() {
        Employee noRole = buildEmployee("EMP001", null);
        Employee admin = buildEmployee("EMP002", roleNamed("admin"));
        when(employeeRepository.findAllByIsDeletedFalse()).thenReturn(List.of(noRole, admin));

        service.sendToAdmins(NotificationType.SYSTEM, "Title", "Body", null);

        ArgumentCaptor<NotificationRecipient> captor = ArgumentCaptor.forClass(NotificationRecipient.class);
        verify(recipientRepository, times(1)).save(captor.capture());
        assertThat(captor.getValue().getEmployee().getId()).isEqualTo("EMP002");
    }

    // ── send(employee, type, title, message, referenceId) — direct to one ────

    @Test
    @DisplayName("TC_NOTI_12 | send(employee,...) | targets a specific employee regardless of their preference toggle " +
            "(INCONSISTENCY: this overload never calls the shouldSendTo() preference check at all)")
    void sendDirect_bypassesPreferenceCheck() {
        Employee employee = buildEmployee("EMP001");
        employee.setCourseAnnounce(false); // would be skipped by send()/sendToAllActive()

        service.send(employee, NotificationType.COURSE, "Title", "Body", null);

        verify(recipientRepository, times(1)).save(any(NotificationRecipient.class));
        verify(messagingTemplate, times(1))
                .convertAndSend(eq("/topic/notifications/EMP001"), any(NotificationResponse.class));
    }

    // ── getForEmployee ─────────────────────────────────────────────────────

    @Test
    @DisplayName("TC_NOTI_13 | getForEmployee | unreadOnly=true → queries only unread recipients")
    void getForEmployee_unreadOnly_usesUnreadQuery() {
        Employee employee = buildEmployee("EMP001");
        Notification notification = buildNotification(1, NotificationType.SYSTEM, "msg");
        NotificationRecipient recipient = buildRecipient(employee, notification, false);
        when(recipientRepository.findByEmployeeAndIsReadFalse(employee)).thenReturn(List.of(recipient));

        List<NotificationResponse> result = service.getForEmployee(employee, true);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1);
        verify(recipientRepository, never()).findByEmployeeOrderByNotificationCreatedAtDesc(any());
    }

    @Test
    @DisplayName("TC_NOTI_14 | getForEmployee | unreadOnly=false → queries the full history, newest first")
    void getForEmployee_allNotifications_usesFullHistoryQuery() {
        Employee employee = buildEmployee("EMP001");
        when(recipientRepository.findByEmployeeOrderByNotificationCreatedAtDesc(employee)).thenReturn(List.of());

        List<NotificationResponse> result = service.getForEmployee(employee, false);

        assertThat(result).isEmpty();
        verify(recipientRepository, never()).findByEmployeeAndIsReadFalse(any());
    }

    // ── unreadCount ────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC_NOTI_15 | unreadCount | delegates straight to the repository count")
    void unreadCount_delegatesToRepository() {
        Employee employee = buildEmployee("EMP001");
        when(recipientRepository.countByEmployeeAndIsReadFalse(employee)).thenReturn(4L);

        long result = service.unreadCount(employee);

        assertThat(result).isEqualTo(4L);
    }

    // ── markRead ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC_NOTI_16 | markRead | happy path → recipient flagged read with a readAt timestamp, then saved")
    void markRead_validRecipient_marksReadAndSaves() {
        Employee employee = buildEmployee("EMP001");
        NotificationRecipient recipient = new NotificationRecipient();
        recipient.setIsRead(false);
        when(recipientRepository.findByNotificationIdAndEmployee(10, employee)).thenReturn(Optional.of(recipient));

        service.markRead(10, employee);

        assertThat(recipient.getIsRead()).isTrue();
        assertThat(recipient.getReadAt()).isBetween(LocalDateTime.now().minusSeconds(5), LocalDateTime.now().plusSeconds(5));
        verify(recipientRepository).save(recipient);
    }

    @Test
    @DisplayName("TC_NOTI_17 | markRead | no recipient record for this notification+employee → throws with a descriptive message")
    void markRead_noMatchingRecipient_throws() {
        Employee employee = buildEmployee("EMP001");
        when(recipientRepository.findByNotificationIdAndEmployee(999, employee)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.markRead(999, employee));

        assertThat(ex.getMessage()).contains("Notification not found for this employee").contains("999");
        verify(recipientRepository, never()).save(any());
    }

    // ── markAllRead ────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC_NOTI_18 | markAllRead | every unread recipient is flagged read and saved in one batch")
    void markAllRead_marksEveryUnreadRecipient() {
        Employee employee = buildEmployee("EMP001");
        NotificationRecipient r1 = new NotificationRecipient();
        r1.setIsRead(false);
        NotificationRecipient r2 = new NotificationRecipient();
        r2.setIsRead(false);
        when(recipientRepository.findByEmployeeAndIsReadFalse(employee)).thenReturn(List.of(r1, r2));

        service.markAllRead(employee);

        assertThat(r1.getIsRead()).isTrue();
        assertThat(r2.getIsRead()).isTrue();
        assertThat(r1.getReadAt()).isNotNull();
        assertThat(r2.getReadAt()).isNotNull();
        verify(recipientRepository).saveAll(List.of(r1, r2));
    }

    @Test
    @DisplayName("TC_NOTI_19 | markAllRead | no unread notifications → still calls saveAll with an empty list, no error")
    void markAllRead_noUnreadNotifications_savesEmptyListWithoutError() {
        Employee employee = buildEmployee("EMP001");
        when(recipientRepository.findByEmployeeAndIsReadFalse(employee)).thenReturn(List.of());

        service.markAllRead(employee);

        verify(recipientRepository).saveAll(List.of());
    }

    // ── helpers ────────────────────────────────────────────────────────────

    private static void authenticateAs(String employeeId) {
        Authentication auth = new UsernamePasswordAuthenticationToken(employeeId, "N/A", List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private static Employee buildEmployee(String id) {
        return buildEmployee(id, null);
    }

    private static Employee buildEmployee(String id, Role role) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setRole(role);
        // courseAnnounce / jlptExamAnnounce / certificateUpdates / emailNoti default to true via
        // the entity's own field initializers unless a test overrides one explicitly.
        return employee;
    }

    private static Role roleNamed(String name) {
        Role role = new Role();
        role.setRoleName(name);
        return role;
    }

    private static Notification buildNotification(Integer id, NotificationType type, String message) {
        return Notification.builder()
                .id(id)
                .notificationType(type)
                .message(message)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private static NotificationRecipient buildRecipient(Employee employee, Notification notification, boolean isRead) {
        NotificationRecipient recipient = new NotificationRecipient();
        recipient.setEmployee(employee);
        recipient.setNotification(notification);
        recipient.setIsRead(isRead);
        return recipient;
    }
}