package com.dat_management.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dat_management.backend.dto.AttendanceRequest;
import com.dat_management.backend.dto.AttendanceResponse;
import com.dat_management.backend.entity.AttendanceRecord;
import com.dat_management.backend.entity.CourseEnrollment;
import com.dat_management.backend.entity.CourseSession;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.AttendanceRecordRepository;
import com.dat_management.backend.repository.CourseEnrollmentRepository;
import com.dat_management.backend.repository.CourseSessionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseSessionRepository sessionRepository;

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendanceByCourseAndGroup(
            Integer courseId,
            Integer groupId) {

        return attendanceRecordRepository
                .findByCourseSession_Course_IdAndCourseSession_CourseGroup_Id(
                        courseId,
                        groupId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public AttendanceResponse createAttendance(
            Integer courseId,
            Integer groupId,
            AttendanceRequest request) {

        CourseEnrollment enrollment =
                enrollmentRepository.findById(request.getEnrollmentId())
                        .orElseThrow(() ->
                                new RuntimeException("Enrollment not found"));

        CourseSession session =
                sessionRepository.findById(request.getCourseSessionId())
                        .orElseThrow(() ->
                                new RuntimeException("Session not found"));

        validateCourseAndGroup(
                courseId,
                groupId,
                enrollment,
                session);

        attendanceRecordRepository
                .findByEnrollment_IdAndCourseSession_Id(
                        request.getEnrollmentId(),
                        request.getCourseSessionId())
                .ifPresent(record -> {
                    throw new RuntimeException(
                            "Attendance already recorded");
                });

        AttendanceRecord attendance = new AttendanceRecord();
        attendance.setEnrollment(enrollment);
        attendance.setCourseSession(session);
        attendance.setAttendanceStatus(
                request.getAttendanceStatus());

        attendance = attendanceRecordRepository.save(attendance);

        return mapToResponse(attendance);
    }

    @Transactional
    public AttendanceResponse updateAttendance(
            Integer courseId,
            Integer groupId,
            Integer attendanceId,
            AttendanceRequest request) {

        AttendanceRecord attendance =
                attendanceRecordRepository.findById(attendanceId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Attendance not found"));

        CourseEnrollment enrollment = attendance.getEnrollment();
        CourseSession session = attendance.getCourseSession();

        validateCourseAndGroup(
                courseId,
                groupId,
                enrollment,
                session);

        attendance.setAttendanceStatus(
                request.getAttendanceStatus());

        attendance = attendanceRecordRepository.save(attendance);

        return mapToResponse(attendance);
    }


    private void validateCourseAndGroup(
            Integer courseId,
            Integer groupId,
            CourseEnrollment enrollment,
            CourseSession session) {

        if (!enrollment.getCourse().getId().equals(courseId)) {
            throw new RuntimeException(
                    "Enrollment does not belong to course");
        }

        if (enrollment.getCourseGroup() == null ||
                !enrollment.getCourseGroup().getId().equals(groupId)) {
            throw new RuntimeException(
                    "Enrollment does not belong to group");
        }

        if (!session.getCourse().getId().equals(courseId)) {
            throw new RuntimeException(
                    "Session does not belong to course");
        }

        if (session.getCourseGroup() == null ||
                !session.getCourseGroup().getId().equals(groupId)) {
            throw new RuntimeException(
                    "Session does not belong to group");
        }
    }

    private AttendanceResponse mapToResponse(
            AttendanceRecord attendance) {

        CourseEnrollment enrollment = attendance.getEnrollment();
        CourseSession session = attendance.getCourseSession();
        Employee employee = enrollment.getEmployee();

        return AttendanceResponse.builder()
                .id(attendance.getId())
                .enrollmentId(enrollment.getId())
                .employeeId(employee.getId())
                .employeeName(employee.getName())
                .courseSessionId(session.getId())
                .sessionNo(session.getSessionNo())
                .sessionDate(session.getSessionDate())
                .attendanceStatus(attendance.getAttendanceStatus())
                .registeredAt(attendance.getRegisteredAt())
                .build();
    }
}