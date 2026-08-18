package com.dat_management.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dat_management.backend.dto.NotificationResponse;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.NotificationRecipientRepository;
import com.dat_management.backend.service.EmployeeService;
import com.dat_management.backend.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    private final NotificationService notificationService;
    private final EmployeeService employeeService;
    private final NotificationRecipientRepository recipientRepository;

    private Employee getEmployee(String employeeId) {
        if (employeeId == null || employeeId.isBlank()) {
            throw new RuntimeException("Employee ID is required");
        }
        Employee e = employeeService.getEmployeeById(employeeId);
        if (e == null) {
            throw new RuntimeException("Employee not found");
        }
        return e;
    }

    // ================================================================
    // GET /api/notifications - Get notifications for an employee
    // ================================================================
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestParam(required = false) String employeeId,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {

        if (employeeId == null || employeeId.isBlank()) {
            return ResponseEntity.ok(List.of());
        }

        Employee employee = getEmployee(employeeId);
        List<NotificationResponse> notifications = notificationService.getForEmployee(employee, unreadOnly);
        return ResponseEntity.ok(notifications);
    }

    // ================================================================
    // GET /api/notifications/unread-count - Get unread count
    // ================================================================
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @RequestParam(required = false) String employeeId) {

        Map<String, Long> result = new HashMap<>();
        if (employeeId == null || employeeId.isBlank()) {
            result.put("count", 0L);
            return ResponseEntity.ok(result);
        }

        Employee employee = getEmployee(employeeId);
        result.put("count", notificationService.unreadCount(employee));
        return ResponseEntity.ok(result);
    }

    // ================================================================
    // PUT /api/notifications/{id}/read - Mark a notification as read
    // ================================================================
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable Integer id,
            @RequestParam String employeeId) {

        Employee employee = getEmployee(employeeId);
        notificationService.markRead(id, employee);
        return ResponseEntity.noContent().build();
    }

    // ================================================================
    // PUT /api/notifications/read-all - Mark all as read
    // ================================================================
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@RequestParam String employeeId) {
        Employee employee = getEmployee(employeeId);
        notificationService.markAllRead(employee);
        return ResponseEntity.noContent().build();
    }


}