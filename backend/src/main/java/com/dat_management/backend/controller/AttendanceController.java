package com.dat_management.backend.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.dat_management.backend.dto.AttendanceRequest;
import com.dat_management.backend.service.AttendanceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/{courseId}/groups/{groupId}/attendance")
    public Map<String, Object> getGroupAttendance(
            @PathVariable Integer courseId,
            @PathVariable Integer groupId) {

        return Map.of(
                "attendance",
                attendanceService.getAttendanceByCourseAndGroup(courseId, groupId)
        );
    }

    @PostMapping("/{courseId}/groups/{groupId}/attendance")
    public Map<String, Object> createAttendance(
            @PathVariable Integer courseId,
            @PathVariable Integer groupId,
            @RequestBody AttendanceRequest request) {

        return Map.of(
                "success", true,
                "attendance",
                attendanceService.createAttendance(
                        courseId,
                        groupId,
                        request)
        );
    }

    @PutMapping("/{courseId}/groups/{groupId}/attendance/{attendanceId}")
    public Map<String, Object> updateAttendance(
            @PathVariable Integer courseId,
            @PathVariable Integer groupId,
            @PathVariable Integer attendanceId,
            @RequestBody AttendanceRequest request) {

        return Map.of(
                "success", true,
                "attendance",
                attendanceService.updateAttendance(
                        courseId,
                        groupId,
                        attendanceId,
                        request)
        );
    }
}
