package com.dat_management.backend.controller;

import com.dat_management.backend.dto.NotificationResponse;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.NotificationRecipientRepository;
import com.dat_management.backend.service.EmployeeService;
import com.dat_management.backend.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

// ─────────────────────────────────────────────────────────────────────────────
// Unit Tests for NotificationController
//
// Thin pass-through controller, tested the same way as
// AuthRestControllerLoginTest — direct instantiation with mocked
// collaborators, no Spring context needed.
// ─────────────────────────────────────────────────────────────────────────────

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock private NotificationService notificationService;
    @Mock private EmployeeService employeeService;
    @Mock private NotificationRecipientRepository recipientRepository;

    private NotificationController controller;

    @BeforeEach
    void setUp() {
        controller = new NotificationController(notificationService, employeeService, recipientRepository);
    }

    @Test
    @DisplayName("TC_NOTI_20 | getNotifications | blank employeeId → empty list, service never called")
    void getNotifications_blankEmployeeId_returnsEmptyListWithoutCallingService() {
        ResponseEntity<List<NotificationResponse>> response = controller.getNotifications("", false);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEmpty();
        verifyNoInteractions(employeeService, notificationService);
    }

    @Test
    @DisplayName("TC_NOTI_21 | getNotifications | valid employeeId → resolves the employee and delegates to the service")
    void getNotifications_validEmployeeId_delegatesToService() {
        Employee employee = new Employee();
        employee.setId("EMP001");
        when(employeeService.getEmployeeById("EMP001")).thenReturn(employee);
        when(notificationService.getForEmployee(employee, true)).thenReturn(List.of());

        ResponseEntity<List<NotificationResponse>> response = controller.getNotifications("EMP001", true);

        assertThat(response.getBody()).isEmpty();
        verify(notificationService).getForEmployee(employee, true);
    }

    @Test
    @DisplayName("TC_NOTI_22 | unreadCount | blank employeeId → returns 0 without calling the service")
    void unreadCount_blankEmployeeId_returnsZeroWithoutCallingService() {
        ResponseEntity<Map<String, Long>> response = controller.unreadCount(null);

        assertThat(response.getBody()).containsEntry("count", 0L);
        verifyNoInteractions(notificationService);
    }

    @Test
    @DisplayName("TC_NOTI_23 | unreadCount | valid employeeId → delegates to the service")
    void unreadCount_validEmployeeId_delegatesToService() {
        Employee employee = new Employee();
        employee.setId("EMP001");
        when(employeeService.getEmployeeById("EMP001")).thenReturn(employee);
        when(notificationService.unreadCount(employee)).thenReturn(3L);

        ResponseEntity<Map<String, Long>> response = controller.unreadCount("EMP001");

        assertThat(response.getBody()).containsEntry("count", 3L);
    }

    @Test
    @DisplayName("TC_NOTI_24 | markRead | blank employeeId → throws (unlike the GET endpoints, there's no graceful blank check here)")
    void markRead_blankEmployeeId_throws() {
        // Same systemic gap found in ForgotPasswordController: this throws a plain RuntimeException
        // that GlobalExceptionHandler won't catch, so in a running app it likely reaches the client
        // as an empty 200 rather than a clean 4xx — same pattern, different endpoint.
        RuntimeException ex = assertThrows(RuntimeException.class, () -> controller.markRead(1, ""));

        assertThat(ex.getMessage()).isEqualTo("Employee ID is required");
        verifyNoInteractions(notificationService);
    }

    @Test
    @DisplayName("TC_NOTI_25 | markRead | unknown employeeId → propagates EmployeeService's own \"not found\" message " +
            "(the controller's own null-check for this case is dead code: getEmployeeById() always throws before it could ever return null)")
    void markRead_unknownEmployeeId_propagatesServiceException() {
        when(employeeService.getEmployeeById("GHOST"))
                .thenThrow(new RuntimeException("Employee not found with id: GHOST"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> controller.markRead(1, "GHOST"));

        assertThat(ex.getMessage()).isEqualTo("Employee not found with id: GHOST");
    }

    @Test
    @DisplayName("TC_NOTI_26 | markRead | happy path → delegates to the service and returns 204 No Content")
    void markRead_validRequest_returnsNoContent() {
        Employee employee = new Employee();
        employee.setId("EMP001");
        when(employeeService.getEmployeeById("EMP001")).thenReturn(employee);

        ResponseEntity<Void> response = controller.markRead(10, "EMP001");

        assertThat(response.getStatusCode().value()).isEqualTo(204);
        verify(notificationService).markRead(10, employee);
    }

    @Test
    @DisplayName("TC_NOTI_27 | markAllRead | happy path → delegates to the service and returns 204 No Content")
    void markAllRead_validRequest_returnsNoContent() {
        Employee employee = new Employee();
        employee.setId("EMP001");
        when(employeeService.getEmployeeById("EMP001")).thenReturn(employee);

        ResponseEntity<Void> response = controller.markAllRead("EMP001");

        assertThat(response.getStatusCode().value()).isEqualTo(204);
        verify(notificationService).markAllRead(employee);
    }
}