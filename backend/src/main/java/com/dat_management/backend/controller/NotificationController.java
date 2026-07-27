package com.dat_management.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.service.EmployeeService;
import com.dat_management.backend.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {
    private final NotificationService notificationService;
    private final EmployeeService employeeService;

    private Employee employee(String employeeId) {
        if (employeeId == null || employeeId.isBlank()) throw new RuntimeException("Employee ID is required");
        Employee e = employeeService.getEmployeeById(employeeId);
        if (e == null) throw new RuntimeException("Employee not found");
        return e;
    }

    @GetMapping
    public List<com.dat_management.backend.dto.NotificationResponse> getNotifications(
            @RequestParam(required = false) String employeeId,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {
        if (employeeId == null || employeeId.isBlank()) {
            return List.of();
        }
        return notificationService.getForEmployee(employee(employeeId), unreadOnly).stream().map(com.dat_management.backend.dto.NotificationResponse::from).toList();
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@RequestParam(required = false) String employeeId) {
        Map<String, Long> result = new HashMap<>();
        if (employeeId == null || employeeId.isBlank()) {
            result.put("count", 0L);
            return result;
        }
        result.put("count", notificationService.unreadCount(employee(employeeId)));
        return result;
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Integer id, @RequestParam String employeeId) {
        notificationService.markRead(id, employee(employeeId));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@RequestParam String employeeId) {
        notificationService.markAllRead(employee(employeeId));
        return ResponseEntity.noContent().build();
    }
}
