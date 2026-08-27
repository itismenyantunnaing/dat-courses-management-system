package com.dat_management.backend.controller;

import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.Notification;
import com.dat_management.backend.entity.Notification.NotificationType;
import com.dat_management.backend.entity.NotificationRecipient;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.NotificationRecipientRepository;
import com.dat_management.backend.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// ─────────────────────────────────────────────────────────────────────────────
// Integration Tests for NotificationController
//
// Replaces a pure-Mockito controller unit test: this controller is thin
// enough, and NotificationRecipientRepository's derived/JPQL queries had zero
// real-database coverage either way, so one integration suite covers both
// layers at once rather than mocking the repository away and testing nothing
// about whether its queries are actually correct.
//
// Test data is seeded directly via the repositories (not through
// NotificationService.send()), since this controller only reads/marks-read —
// it never triggers notification creation itself, so there's no WebSocket
// side effect to worry about mocking here.
// ─────────────────────────────────────────────────────────────────────────────

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class NotificationControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationRecipientRepository recipientRepository;

    private Employee employee;
    private Employee otherEmployee;

    @BeforeEach
    void setUp() {
        recipientRepository.deleteAll();
        notificationRepository.deleteAll();
        employeeRepository.deleteAll();
        employee = employeeRepository.save(buildEmployee("EMP-NOTI-1"));
        otherEmployee = employeeRepository.save(buildEmployee("EMP-NOTI-2"));
    }

    @Test
    @DisplayName("TC_NOTI_20 | GET /notifications | missing employeeId → 200 OK with an empty list")
    void getNotifications_missingEmployeeId_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    @DisplayName("TC_NOTI_21 | GET /notifications | valid employeeId → returns that employee's notifications only")
    void getNotifications_validEmployeeId_returnsOwnNotificationsOnly() throws Exception {
        seedNotification(employee, NotificationType.SYSTEM, "First", true);
        seedNotification(employee, NotificationType.SYSTEM, "Second", false);
        seedNotification(otherEmployee, NotificationType.SYSTEM, "Not yours", false);

        mockMvc.perform(get("/api/notifications").param("employeeId", employee.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[*].message", containsInAnyOrder("First", "Second")));
    }

    @Test
    @DisplayName("TC_NOTI_22 | GET /notifications?unreadOnly=true | returns only that employee's unread notifications")
    void getNotifications_unreadOnly_filtersToUnreadOnly() throws Exception {
        seedNotification(employee, NotificationType.SYSTEM, "Already read", true);
        seedNotification(employee, NotificationType.SYSTEM, "Still unread", false);

        mockMvc.perform(get("/api/notifications")
                        .param("employeeId", employee.getId())
                        .param("unreadOnly", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].message").value("Still unread"));
    }

    @Test
    @DisplayName("TC_NOTI_23 | GET /notifications/unread-count | missing employeeId → count 0")
    void unreadCount_missingEmployeeId_returnsZero() throws Exception {
        mockMvc.perform(get("/api/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
    }

    @Test
    @DisplayName("TC_NOTI_24 | GET /notifications/unread-count | valid employeeId → correct unread count")
    void unreadCount_validEmployeeId_returnsCorrectCount() throws Exception {
        seedNotification(employee, NotificationType.SYSTEM, "Unread 1", false);
        seedNotification(employee, NotificationType.SYSTEM, "Unread 2", false);
        seedNotification(employee, NotificationType.SYSTEM, "Read", true);

        mockMvc.perform(get("/api/notifications/unread-count").param("employeeId", employee.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2));
    }

    @Test
    @DisplayName("TC_NOTI_25 | PUT /notifications/{id}/read | blank employeeId → silent empty 200 " +
            "(same swallowed-RuntimeException pattern seen in ForgotPasswordController; nothing actually gets marked read)")
    void markRead_blankEmployeeId_silentlyReturnsEmptyOkAndChangesNothing() throws Exception {
        NotificationRecipient recipient = seedNotification(employee, NotificationType.SYSTEM, "msg", false);

        mockMvc.perform(put("/api/notifications/{id}/read", recipient.getNotification().getId())
                        .param("employeeId", ""))
                .andExpect(status().isOk())
                .andExpect(content().string(""));

        assertThat(recipientRepository.findById(recipient.getId()).orElseThrow().getIsRead()).isFalse();
    }

    @Test
    @DisplayName("TC_NOTI_26 | PUT /notifications/{id}/read | unknown employeeId → same silent empty 200")
    void markRead_unknownEmployeeId_silentlyReturnsEmptyOk() throws Exception {
        NotificationRecipient recipient = seedNotification(employee, NotificationType.SYSTEM, "msg", false);

        mockMvc.perform(put("/api/notifications/{id}/read", recipient.getNotification().getId())
                        .param("employeeId", "GHOST-EMPLOYEE"))
                .andExpect(status().isOk())
                .andExpect(content().string(""));
    }

    @Test
    @DisplayName("TC_NOTI_27 | PUT /notifications/{id}/read | happy path → 204 No Content, recipient flagged read in the DB")
    void markRead_validRequest_marksReadInDatabase() throws Exception {
        NotificationRecipient recipient = seedNotification(employee, NotificationType.SYSTEM, "msg", false);

        mockMvc.perform(put("/api/notifications/{id}/read", recipient.getNotification().getId())
                        .param("employeeId", employee.getId()))
                .andExpect(status().isNoContent());

        NotificationRecipient reloaded = recipientRepository.findById(recipient.getId()).orElseThrow();
        assertThat(reloaded.getIsRead()).isTrue();
        assertThat(reloaded.getReadAt()).isNotNull();
    }

    @Test
    @DisplayName("TC_NOTI_28 | PUT /notifications/{id}/read | notification belongs to a different employee → " +
            "silently no-ops and does NOT mark the other employee's copy as read")
    void markRead_notYourNotification_doesNotAffectOtherEmployeesRecipient() throws Exception {
        NotificationRecipient othersRecipient = seedNotification(otherEmployee, NotificationType.SYSTEM, "not yours", false);

        mockMvc.perform(put("/api/notifications/{id}/read", othersRecipient.getNotification().getId())
                        .param("employeeId", employee.getId()))
                .andExpect(status().isOk())
                .andExpect(content().string(""));

        assertThat(recipientRepository.findById(othersRecipient.getId()).orElseThrow().getIsRead()).isFalse();
    }

    @Test
    @DisplayName("TC_NOTI_29 | PUT /notifications/read-all | marks only the calling employee's unread notifications, leaves others untouched")
    void markAllRead_marksOnlyCallingEmployeesNotifications() throws Exception {
        seedNotification(employee, NotificationType.SYSTEM, "mine 1", false);
        seedNotification(employee, NotificationType.SYSTEM, "mine 2", false);
        NotificationRecipient othersRecipient = seedNotification(otherEmployee, NotificationType.SYSTEM, "not mine", false);

        mockMvc.perform(put("/api/notifications/read-all").param("employeeId", employee.getId()))
                .andExpect(status().isNoContent());

        List<NotificationRecipient> mine = recipientRepository.findByEmployee(employee);
        assertThat(mine).allMatch(NotificationRecipient::getIsRead);
        assertThat(recipientRepository.findById(othersRecipient.getId()).orElseThrow().getIsRead()).isFalse();
    }

    // ── helpers ────────────────────────────────────────────────────────────

    private Employee buildEmployee(String id) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName("Test " + id);
        employee.setEmail(id.toLowerCase() + "@dat.com");
        employee.setPassword("encoded-password");
        employee.setPosition("Engineer");
        employee.setStatus("active");
        employee.setEmpStatus("active");
        employee.setIsCorePersonnel(false);
        employee.setHasJapanBusinessTrip(false);
        employee.setNotiSetting(false);
        employee.setIsDeleted(false);
        return employee;
    }

    private NotificationRecipient seedNotification(Employee recipientEmployee, NotificationType type,
                                                   String message, boolean isRead) {
        Notification notification = notificationRepository.save(Notification.builder()
                .notificationType(type)
                .message(message)
                .createdAt(LocalDateTime.now())
                .build());

        NotificationRecipient recipient = new NotificationRecipient();
        recipient.setNotification(notification);
        recipient.setEmployee(recipientEmployee);
        recipient.setIsRead(isRead);
        recipient.setReadAt(isRead ? LocalDateTime.now() : null);
        return recipientRepository.save(recipient);
    }
}