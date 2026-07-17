package com.dat_management.backend.service;

import com.dat_management.backend.dto.EnrollmentRequestDTO;
import com.dat_management.backend.dto.EnrollmentResponseDTO;
import com.dat_management.backend.entity.Course;
import com.dat_management.backend.entity.CourseCategory;
import com.dat_management.backend.entity.CourseCategory.CourseType;
import com.dat_management.backend.entity.CourseEnrollment;
import com.dat_management.backend.entity.CourseGroup;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.SelfStudySession;
import com.dat_management.backend.entity.SelfStudySessionProgress;
import com.dat_management.backend.repository.CourseEnrollmentRepository;
import com.dat_management.backend.repository.CourseGroupRepository;
import com.dat_management.backend.repository.CourseRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.SelfStudySessionProgressRepository;
import com.dat_management.backend.repository.SelfStudySessionRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseEnrollmentServiceTest {

    @Mock
    private CourseEnrollmentRepository enrollmentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseGroupRepository courseGroupRepository;

    @Mock
    private SelfStudySessionRepository selfStudySessionRepository;

    @Mock
    private SelfStudySessionProgressRepository progressRepository;

    @Test
    void enroll_newTrainerCourseEnrollment_savesApprovedEnrollment() {
        CourseEnrollmentService service = service();
        Employee employee = employee("EMP001", "Alice Admin");
        Course course = course(100, CourseType.TRAINER_PROVIDED, null);
        CourseGroup group = group(10, course, "G1");

        when(enrollmentRepository.existsEnrollment("EMP001", 100)).thenReturn(false);
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(courseRepository.findById(100)).thenReturn(Optional.of(course));
        when(courseGroupRepository.findById(10)).thenReturn(Optional.of(group));
        when(enrollmentRepository.save(any(CourseEnrollment.class))).thenAnswer(invocation -> {
            CourseEnrollment enrollment = invocation.getArgument(0);
            enrollment.setId(500);
            enrollment.setEnrolledAt(LocalDateTime.of(2026, 7, 16, 9, 0));
            return enrollment;
        });

        EnrollmentResponseDTO result = service.enroll(100, enrollmentRequest("EMP001", 10));

        Assertions.assertEquals(500, result.getId());
        Assertions.assertEquals("EMP001", result.getEmployeeId());
        Assertions.assertEquals(10, result.getCourseGroupId());
        Assertions.assertEquals("APPROVED", result.getEnrollmentStatus());
        Assertions.assertEquals("NONE", result.getGroupChangeStatus());
        verify(progressRepository, never()).save(any(SelfStudySessionProgress.class));
    }

    @Test
    void enroll_duplicateEnrollment_throwsConflictAndDoesNotSave() {
        CourseEnrollmentService service = service();

        when(enrollmentRepository.existsEnrollment("EMP001", 100)).thenReturn(true);

        ResponseStatusException ex = Assertions.assertThrows(
                ResponseStatusException.class,
                () -> service.enroll(100, enrollmentRequest("EMP001", 10)));

        Assertions.assertTrue(ex.getReason().contains("already enrolled"));
        verify(enrollmentRepository, never()).save(any(CourseEnrollment.class));
    }

    @Test
    void enroll_jlptSelfStudyCourse_autoCreatesProgressRecordsWithDeadlines() {
        CourseEnrollmentService service = service();
        Employee employee = employee("EMP001", "Alice Admin");
        Course course = course(100, CourseType.SELF_STUDY, "jlpt");
        CourseGroup group = group(10, course, "Self Study");
        SelfStudySession firstSession = selfStudySession(1, course, (short) 1, 7);
        SelfStudySession secondSession = selfStudySession(2, course, (short) 2, 14);
        LocalDateTime enrolledAt = LocalDateTime.of(2026, 7, 16, 9, 0);

        when(enrollmentRepository.existsEnrollment("EMP001", 100)).thenReturn(false);
        when(employeeRepository.findById("EMP001")).thenReturn(Optional.of(employee));
        when(courseRepository.findById(100)).thenReturn(Optional.of(course));
        when(courseGroupRepository.findById(10)).thenReturn(Optional.of(group));
        when(enrollmentRepository.save(any(CourseEnrollment.class))).thenAnswer(invocation -> {
            CourseEnrollment enrollment = invocation.getArgument(0);
            enrollment.setId(500);
            enrollment.setEnrolledAt(enrolledAt);
            return enrollment;
        });
        when(selfStudySessionRepository.findByCourseIdOrderBySessionNoAsc(100))
                .thenReturn(List.of(firstSession, secondSession));

        service.enroll(100, enrollmentRequest("EMP001", 10));

        ArgumentCaptor<SelfStudySessionProgress> captor =
                ArgumentCaptor.forClass(SelfStudySessionProgress.class);
        verify(progressRepository, org.mockito.Mockito.times(2)).save(captor.capture());

        List<SelfStudySessionProgress> savedProgress = captor.getAllValues();
        Assertions.assertEquals(firstSession, savedProgress.get(0).getSelfStudySession());
        Assertions.assertEquals(enrolledAt.plusDays(7), savedProgress.get(0).getSessionDeadline());
        Assertions.assertEquals("NOT_STARTED", savedProgress.get(0).getCompletionStatus());
        Assertions.assertEquals(secondSession, savedProgress.get(1).getSelfStudySession());
        Assertions.assertEquals(enrolledAt.plusDays(21), savedProgress.get(1).getSessionDeadline());
    }

    private CourseEnrollmentService service() {
        return new CourseEnrollmentService(
                enrollmentRepository,
                employeeRepository,
                courseRepository,
                courseGroupRepository,
                selfStudySessionRepository,
                progressRepository);
    }

    private static EnrollmentRequestDTO enrollmentRequest(String employeeId, Integer groupId) {
        EnrollmentRequestDTO dto = new EnrollmentRequestDTO();
        dto.setEmployeeId(employeeId);
        dto.setCourseGroupId(groupId);
        return dto;
    }

    private static Employee employee(String id, String name) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(name);
        employee.setEmail(id.toLowerCase() + "@dat.com");
        employee.setPassword("encoded-password");
        employee.setPosition("Engineer");
        employee.setEmpStatus("active");
        employee.setStatus("default");
        employee.setIsCorePersonnel(false);
        employee.setHasJapanBusinessTrip(false);
        employee.setNotiSetting(false);
        employee.setIsDeleted(false);
        return employee;
    }

    private static Course course(Integer id, CourseType type, String selfStudyType) {
        CourseCategory category = new CourseCategory();
        category.setId(1);
        category.setCourseCategoryName(type == CourseType.SELF_STUDY ? "Self Study" : "Trainer");
        category.setCourseType(type);
        category.setIsDeleted(false);

        Course course = new Course();
        course.setId(id);
        course.setCourseCategory(category);
        course.setCourseName("JLPT Course");
        course.setSelfStudyType(selfStudyType);
        course.setIsDeleted(false);
        return course;
    }

    private static CourseGroup group(Integer id, Course course, String name) {
        CourseGroup group = new CourseGroup();
        group.setId(id);
        group.setCourse(course);
        group.setGroupName(name);
        group.setCapacity(20);
        return group;
    }

    private static SelfStudySession selfStudySession(Integer id, Course course, Short sessionNo, Integer duration) {
        SelfStudySession session = new SelfStudySession();
        session.setId(id);
        session.setCourse(course);
        session.setSessionNo(sessionNo);
        session.setDurationPerSession(duration);
        session.setKanjiTarget(100);
        session.setVocabularyTarget(100);
        session.setGrammarTarget(50);
        session.setReadingTargetMinutes(60);
        session.setListeningTargetMinutes(60);
        session.setSessionStatus("PLANNED");
        return session;
    }
}
