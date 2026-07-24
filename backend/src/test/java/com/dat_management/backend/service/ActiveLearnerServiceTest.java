package com.dat_management.backend.service;

import com.dat_management.backend.dto.ActiveLearnerResponseDTO;
import com.dat_management.backend.entity.Course;
import com.dat_management.backend.entity.CourseCategory;
import com.dat_management.backend.entity.CourseCategory.CourseType;
import com.dat_management.backend.entity.CourseEnrollment;
import com.dat_management.backend.entity.CourseGroup;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.CourseEnrollmentRepository;
import com.dat_management.backend.repository.CourseSessionRepository;
import com.dat_management.backend.repository.SelfStudySessionProgressRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActiveLearnerServiceTest {

    @Mock
    private CourseEnrollmentRepository enrollmentRepository;

    @Mock
    private CourseSessionRepository sessionRepository;

    @Mock
    private SelfStudySessionProgressRepository progressRepository;

    @Test
    void getTotalActiveLearners_trainerCourseWithFutureSession_isActive() {
        ActiveLearnerService service = service();
        Course course = course(1, CourseType.TRAINER_PROVIDED, null);
        CourseGroup group = group(course, 10);
        CourseEnrollment enrollment = enrollment(1, "EMP001", course, group);

        when(enrollmentRepository.findAllApprovedActiveEnrollments()).thenReturn(List.of(enrollment));
        when(sessionRepository.findMaxSessionDateByGroupId(10))
                .thenReturn(Optional.of(LocalDate.now().plusDays(3)));

        ActiveLearnerResponseDTO result = service.getTotalActiveLearners();

        Assertions.assertEquals(1, result.getTotalActiveLearners());
        Assertions.assertEquals("success", result.getStatus());
    }

    @Test
    void getTotalActiveLearners_trainerCourseAllSessionsEnded_notActive() {
        ActiveLearnerService service = service();
        Course course = course(1, CourseType.TRAINER_PROVIDED, null);
        CourseGroup group = group(course, 10);
        CourseEnrollment enrollment = enrollment(1, "EMP001", course, group);

        when(enrollmentRepository.findAllApprovedActiveEnrollments()).thenReturn(List.of(enrollment));
        when(sessionRepository.findMaxSessionDateByGroupId(10))
                .thenReturn(Optional.of(LocalDate.now().minusDays(1)));

        ActiveLearnerResponseDTO result = service.getTotalActiveLearners();

        Assertions.assertEquals(0, result.getTotalActiveLearners());
    }

    @Test
    void getTotalActiveLearners_trainerCourseNoGroup_notActive() {
        ActiveLearnerService service = service();
        Course course = course(1, CourseType.TRAINER_PROVIDED, null);
        CourseEnrollment enrollment = enrollment(1, "EMP001", course, null);

        when(enrollmentRepository.findAllApprovedActiveEnrollments()).thenReturn(List.of(enrollment));

        ActiveLearnerResponseDTO result = service.getTotalActiveLearners();

        Assertions.assertEquals(0, result.getTotalActiveLearners());
    }

    @Test
    void getTotalActiveLearners_selfStudyOtherType_alwaysActive() {
        ActiveLearnerService service = service();
        Course course = course(2, CourseType.SELF_STUDY, "Other");
        CourseEnrollment enrollment = enrollment(2, "EMP002", course, null);

        when(enrollmentRepository.findAllApprovedActiveEnrollments()).thenReturn(List.of(enrollment));

        ActiveLearnerResponseDTO result = service.getTotalActiveLearners();

        Assertions.assertEquals(1, result.getTotalActiveLearners());
    }

    @Test
    void getTotalActiveLearners_selfStudyJlptFutureDeadline_isActive() {
        ActiveLearnerService service = service();
        Course course = course(2, CourseType.SELF_STUDY, "JLPT");
        CourseEnrollment enrollment = enrollment(2, "EMP002", course, null);

        when(enrollmentRepository.findAllApprovedActiveEnrollments()).thenReturn(List.of(enrollment));
        when(progressRepository.findMaxDeadlineByEnrollmentId(2))
                .thenReturn(Optional.of(LocalDateTime.now().plusDays(5)));

        ActiveLearnerResponseDTO result = service.getTotalActiveLearners();

        Assertions.assertEquals(1, result.getTotalActiveLearners());
    }

    @Test
    void getTotalActiveLearners_selfStudyJlptPastDeadline_notActive() {
        ActiveLearnerService service = service();
        Course course = course(2, CourseType.SELF_STUDY, "JLPT");
        CourseEnrollment enrollment = enrollment(2, "EMP002", course, null);

        when(enrollmentRepository.findAllApprovedActiveEnrollments()).thenReturn(List.of(enrollment));
        when(progressRepository.findMaxDeadlineByEnrollmentId(2))
                .thenReturn(Optional.of(LocalDateTime.now().minusDays(1)));

        ActiveLearnerResponseDTO result = service.getTotalActiveLearners();

        Assertions.assertEquals(0, result.getTotalActiveLearners());
    }

    @Test
    void getTotalActiveLearners_selfStudyJlptNoProgressYet_isActive() {
        ActiveLearnerService service = service();
        Course course = course(2, CourseType.SELF_STUDY, "JLPT");
        CourseEnrollment enrollment = enrollment(2, "EMP002", course, null);

        when(enrollmentRepository.findAllApprovedActiveEnrollments()).thenReturn(List.of(enrollment));
        when(progressRepository.findMaxDeadlineByEnrollmentId(2)).thenReturn(Optional.empty());

        ActiveLearnerResponseDTO result = service.getTotalActiveLearners();

        Assertions.assertEquals(1, result.getTotalActiveLearners());
    }

    @Test
    void getTotalActiveLearners_sameEmployeeMultipleActiveEnrollments_countedOnce() {
        ActiveLearnerService service = service();
        Course courseA = course(1, CourseType.SELF_STUDY, "Other");
        Course courseB = course(2, CourseType.SELF_STUDY, "Other");
        CourseEnrollment enrollmentA = enrollment(1, "EMP001", courseA, null);
        CourseEnrollment enrollmentB = enrollment(2, "EMP001", courseB, null);

        when(enrollmentRepository.findAllApprovedActiveEnrollments())
                .thenReturn(List.of(enrollmentA, enrollmentB));

        ActiveLearnerResponseDTO result = service.getTotalActiveLearners();

        Assertions.assertEquals(1, result.getTotalActiveLearners());
    }

    @Test
    void getTotalActiveLearners_enrollmentWithNoCourse_isSkipped() {
        ActiveLearnerService service = service();
        CourseEnrollment enrollment = enrollment(1, "EMP001", null, null);

        when(enrollmentRepository.findAllApprovedActiveEnrollments()).thenReturn(List.of(enrollment));

        ActiveLearnerResponseDTO result = service.getTotalActiveLearners();

        Assertions.assertEquals(0, result.getTotalActiveLearners());
    }

    private ActiveLearnerService service() {
        return new ActiveLearnerService(enrollmentRepository, sessionRepository, progressRepository);
    }

    private static Course course(Integer id, CourseType type, String selfStudyType) {
        Course course = new Course();
        course.setId(id);
        course.setCourseName("Course " + id);
        course.setSelfStudyType(selfStudyType);
        CourseCategory category = new CourseCategory();
        category.setCourseType(type);
        course.setCourseCategory(category);
        return course;
    }

    private static CourseGroup group(Course course, Integer id) {
        CourseGroup group = new CourseGroup();
        group.setId(id);
        group.setCourse(course);
        return group;
    }

    private static CourseEnrollment enrollment(Integer id, String employeeId, Course course, CourseGroup group) {
        Employee employee = new Employee();
        employee.setId(employeeId);
        employee.setName("Employee " + employeeId);

        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setId(id);
        enrollment.setEmployee(employee);
        enrollment.setCourse(course);
        enrollment.setCourseGroup(group);
        enrollment.setEnrollmentStatus("APPROVED");
        return enrollment;
    }
}
