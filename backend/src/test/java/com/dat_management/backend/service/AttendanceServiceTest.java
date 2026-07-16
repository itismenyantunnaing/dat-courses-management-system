package com.dat_management.backend.service;

import com.dat_management.backend.dto.AttendanceRequest;
import com.dat_management.backend.dto.AttendanceResponse;
import com.dat_management.backend.entity.AttendanceRecord;
import com.dat_management.backend.entity.AttendanceRecord.AttendanceStatus;
import com.dat_management.backend.entity.Course;
import com.dat_management.backend.entity.CourseEnrollment;
import com.dat_management.backend.entity.CourseGroup;
import com.dat_management.backend.entity.CourseSession;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.AttendanceRecordRepository;
import com.dat_management.backend.repository.CourseEnrollmentRepository;
import com.dat_management.backend.repository.CourseSessionRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;

    @Mock
    private CourseEnrollmentRepository enrollmentRepository;

    @Mock
    private CourseSessionRepository sessionRepository;

    @Test
    void createAttendance_validCourseGroupAndSession_savesAttendance() {
        AttendanceService service = service();
        Course course = course(100);
        CourseGroup group = group(10, course);
        CourseEnrollment enrollment = enrollment(500, course, group, employee("EMP001", "Alice Admin"));
        CourseSession session = session(700, course, group);

        when(enrollmentRepository.findById(500)).thenReturn(Optional.of(enrollment));
        when(sessionRepository.findById(700)).thenReturn(Optional.of(session));
        when(attendanceRecordRepository.findByEnrollment_IdAndCourseSession_Id(500, 700))
                .thenReturn(Optional.empty());
        when(attendanceRecordRepository.save(any(AttendanceRecord.class))).thenAnswer(invocation -> {
            AttendanceRecord attendance = invocation.getArgument(0);
            attendance.setId(900);
            return attendance;
        });

        AttendanceResponse result = service.createAttendance(100, 10, request(500, 700, AttendanceStatus.PRESENT));

        Assertions.assertEquals(900, result.getId());
        Assertions.assertEquals("EMP001", result.getEmployeeId());
        Assertions.assertEquals((short) 1, result.getSessionNo());
        Assertions.assertEquals(AttendanceStatus.PRESENT, result.getAttendanceStatus());
    }

    @Test
    void createAttendance_duplicateEnrollmentAndSession_throwsAndDoesNotSave() {
        AttendanceService service = service();
        Course course = course(100);
        CourseGroup group = group(10, course);
        CourseEnrollment enrollment = enrollment(500, course, group, employee("EMP001", "Alice Admin"));
        CourseSession session = session(700, course, group);

        when(enrollmentRepository.findById(500)).thenReturn(Optional.of(enrollment));
        when(sessionRepository.findById(700)).thenReturn(Optional.of(session));
        when(attendanceRecordRepository.findByEnrollment_IdAndCourseSession_Id(500, 700))
                .thenReturn(Optional.of(new AttendanceRecord()));

        RuntimeException ex = Assertions.assertThrows(
                RuntimeException.class,
                () -> service.createAttendance(100, 10, request(500, 700, AttendanceStatus.PRESENT)));

        Assertions.assertEquals("Attendance already recorded", ex.getMessage());
        verify(attendanceRecordRepository, never()).save(any(AttendanceRecord.class));
    }

    @Test
    void createAttendance_enrollmentFromDifferentGroup_throwsValidationError() {
        AttendanceService service = service();
        Course course = course(100);
        CourseGroup enrollmentGroup = group(10, course);
        CourseGroup requestGroup = group(11, course);
        CourseEnrollment enrollment = enrollment(500, course, enrollmentGroup, employee("EMP001", "Alice Admin"));
        CourseSession session = session(700, course, requestGroup);

        when(enrollmentRepository.findById(500)).thenReturn(Optional.of(enrollment));
        when(sessionRepository.findById(700)).thenReturn(Optional.of(session));

        RuntimeException ex = Assertions.assertThrows(
                RuntimeException.class,
                () -> service.createAttendance(100, 11, request(500, 700, AttendanceStatus.PRESENT)));

        Assertions.assertEquals("Enrollment does not belong to group", ex.getMessage());
        verify(attendanceRecordRepository, never()).save(any(AttendanceRecord.class));
    }

    private AttendanceService service() {
        return new AttendanceService(attendanceRecordRepository, enrollmentRepository, sessionRepository);
    }

    private static AttendanceRequest request(Integer enrollmentId, Integer sessionId, AttendanceStatus status) {
        AttendanceRequest request = new AttendanceRequest();
        request.setEnrollmentId(enrollmentId);
        request.setCourseSessionId(sessionId);
        request.setAttendanceStatus(status);
        return request;
    }

    private static Course course(Integer id) {
        Course course = new Course();
        course.setId(id);
        course.setCourseName("JLPT N2 Trainer");
        course.setIsDeleted(false);
        return course;
    }

    private static CourseGroup group(Integer id, Course course) {
        CourseGroup group = new CourseGroup();
        group.setId(id);
        group.setCourse(course);
        group.setGroupName("G" + id);
        return group;
    }

    private static CourseSession session(Integer id, Course course, CourseGroup group) {
        CourseSession session = new CourseSession();
        session.setId(id);
        session.setCourse(course);
        session.setCourseGroup(group);
        session.setSessionNo((short) 1);
        session.setSessionDate(LocalDate.of(2026, 8, 1));
        return session;
    }

    private static CourseEnrollment enrollment(Integer id, Course course, CourseGroup group, Employee employee) {
        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setId(id);
        enrollment.setCourse(course);
        enrollment.setCourseGroup(group);
        enrollment.setEmployee(employee);
        enrollment.setEnrollmentStatus("APPROVED");
        return enrollment;
    }

    private static Employee employee(String id, String name) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(name);
        employee.setEmail(id.toLowerCase() + "@dat.com");
        employee.setPassword("encoded-password");
        employee.setPosition("Engineer");
        return employee;
    }
}
