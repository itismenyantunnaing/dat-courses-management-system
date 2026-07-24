package com.dat_management.backend.service;

import com.dat_management.backend.dto.CourseStatsDTO;
import com.dat_management.backend.entity.AttendanceRecord;
import com.dat_management.backend.entity.Course;
import com.dat_management.backend.entity.Course.CourseStatus;
import com.dat_management.backend.entity.CourseCategory;
import com.dat_management.backend.entity.CourseCategory.CourseType;
import com.dat_management.backend.entity.CourseEnrollment;
import com.dat_management.backend.entity.CourseGroup;
import com.dat_management.backend.entity.CourseSession;
import com.dat_management.backend.entity.SelfStudySession;
import com.dat_management.backend.entity.SelfStudySessionProgress;
import com.dat_management.backend.repository.AttendanceRecordRepository;
import com.dat_management.backend.repository.CourseEnrollmentRepository;
import com.dat_management.backend.repository.CourseGroupRepository;
import com.dat_management.backend.repository.CourseRepository;
import com.dat_management.backend.repository.CourseSessionRepository;
import com.dat_management.backend.repository.SelfStudySessionProgressRepository;
import com.dat_management.backend.repository.SelfStudySessionRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseStatsServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseEnrollmentRepository enrollmentRepository;

    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;

    @Mock
    private SelfStudySessionProgressRepository progressRepository;

    @Mock
    private SelfStudySessionRepository sessionRepository;

    @Mock
    private CourseSessionRepository courseSessionRepository;

    @Mock
    private CourseGroupRepository courseGroupRepository;

    @Test
    void getCourseStats_trainerCourseAboveThreshold_countsAsCompleted() {
        CourseStatsService service = service();
        Course course = course(100, category(1, "Trainer Course", CourseType.TRAINER_PROVIDED));
        CourseGroup group = group(course, 10);
        CourseEnrollment enrollment = enrollment(1, course, group);

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(enrollmentRepository.countByCourseId(100)).thenReturn(1L);
        when(enrollmentRepository.findByCourseId(100)).thenReturn(List.of(enrollment));
        when(courseSessionRepository.findByCourseGroupIdOrderBySessionNoAsc(10))
                .thenReturn(List.of(session(1), session(2)));
        // 1/2 present = 50% >= 0.5 threshold -> completed
        when(attendanceRecordRepository.countByEnrollmentIdAndAttendanceStatus(1, AttendanceRecord.AttendanceStatus.PRESENT))
                .thenReturn(1L);

        List<CourseStatsDTO> result = service.getCourseStats();

        Assertions.assertEquals(1, result.size());
        CourseStatsDTO dto = result.get(0);
        Assertions.assertEquals("Trainer Course Name", dto.getName());
        Assertions.assertEquals(1L, dto.getEnrolled());
        Assertions.assertEquals(1L, dto.getCompleted());
        Assertions.assertEquals(100.0, dto.getCompletionRate());
        Assertions.assertEquals("TRAINER_PROVIDED", dto.getCourseType());
    }

    @Test
    void getCourseStats_trainerCourseBelowThreshold_notCompleted() {
        CourseStatsService service = service();
        Course course = course(100, category(1, "Trainer Course", CourseType.TRAINER_PROVIDED));
        CourseGroup group = group(course, 10);
        CourseEnrollment enrollment = enrollment(1, course, group);

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(enrollmentRepository.countByCourseId(100)).thenReturn(1L);
        when(enrollmentRepository.findByCourseId(100)).thenReturn(List.of(enrollment));
        when(courseSessionRepository.findByCourseGroupIdOrderBySessionNoAsc(10))
                .thenReturn(List.of(session(1), session(2), session(3), session(4)));
        // 1/4 present = 25% < 50% threshold -> not completed
        when(attendanceRecordRepository.countByEnrollmentIdAndAttendanceStatus(1, AttendanceRecord.AttendanceStatus.PRESENT))
                .thenReturn(1L);

        List<CourseStatsDTO> result = service.getCourseStats();

        Assertions.assertEquals(0L, result.get(0).getCompleted());
        Assertions.assertEquals(0.0, result.get(0).getCompletionRate());
    }

    @Test
    void getCourseStats_noEnrollments_completionRateIsZero() {
        CourseStatsService service = service();
        Course course = course(100, category(1, "Trainer Course", CourseType.TRAINER_PROVIDED));

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(enrollmentRepository.countByCourseId(100)).thenReturn(0L);
        when(enrollmentRepository.findByCourseId(100)).thenReturn(List.of());

        List<CourseStatsDTO> result = service.getCourseStats();

        Assertions.assertEquals(0L, result.get(0).getEnrolled());
        Assertions.assertEquals(0L, result.get(0).getCompleted());
        Assertions.assertEquals(0.0, result.get(0).getCompletionRate());
    }

    @Test
    void getCourseStats_selfStudyAllTargetsMet_countsAsCompleted() {
        CourseStatsService service = service();
        Course course = course(200, category(2, "Self Study Course", CourseType.SELF_STUDY));
        CourseEnrollment enrollment = enrollment(2, course, null);
        SelfStudySession session = selfStudySession(1);
        SelfStudySessionProgress progress = progress(session, 100, 100, 50, 60, 60);

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(enrollmentRepository.countByCourseId(200)).thenReturn(1L);
        when(enrollmentRepository.findByCourseId(200)).thenReturn(List.of(enrollment));
        when(sessionRepository.findByCourseId(200)).thenReturn(List.of(session));
        when(progressRepository.findByEnrollmentId(2)).thenReturn(List.of(progress));

        List<CourseStatsDTO> result = service.getCourseStats();

        Assertions.assertEquals(1L, result.get(0).getCompleted());
        Assertions.assertEquals(100.0, result.get(0).getCompletionRate());
        Assertions.assertEquals("SELF_STUDY", result.get(0).getCourseType());
    }

    @Test
    void getCourseStats_selfStudyNoProgress_notCompleted() {
        CourseStatsService service = service();
        Course course = course(200, category(2, "Self Study Course", CourseType.SELF_STUDY));
        CourseEnrollment enrollment = enrollment(2, course, null);
        SelfStudySession session = selfStudySession(1);

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(enrollmentRepository.countByCourseId(200)).thenReturn(1L);
        when(enrollmentRepository.findByCourseId(200)).thenReturn(List.of(enrollment));
        when(sessionRepository.findByCourseId(200)).thenReturn(List.of(session));
        when(progressRepository.findByEnrollmentId(2)).thenReturn(List.of());

        List<CourseStatsDTO> result = service.getCourseStats();

        Assertions.assertEquals(0L, result.get(0).getCompleted());
    }

    private CourseStatsService service() {
        return new CourseStatsService(
                courseRepository,
                enrollmentRepository,
                attendanceRecordRepository,
                progressRepository,
                sessionRepository,
                courseSessionRepository,
                courseGroupRepository);
    }

    private static CourseCategory category(Integer id, String name, CourseType type) {
        CourseCategory category = new CourseCategory();
        category.setId(id);
        category.setCourseCategoryName(name);
        category.setCourseType(type);
        category.setIsDeleted(false);
        return category;
    }

    private static Course course(Integer id, CourseCategory category) {
        Course course = new Course();
        course.setId(id);
        course.setCourseCategory(category);
        course.setCourseName("Trainer Course Name");
        course.setStatus(CourseStatus.OPEN);
        course.setIsDeleted(false);
        return course;
    }

    private static CourseGroup group(Course course, Integer id) {
        CourseGroup group = new CourseGroup();
        group.setId(id);
        group.setCourse(course);
        group.setGroupName("G1");
        return group;
    }

    private static CourseSession session(Integer id) {
        CourseSession session = new CourseSession();
        session.setId(id);
        session.setSessionNo(id.shortValue());
        return session;
    }

    private static CourseEnrollment enrollment(Integer id, Course course, CourseGroup group) {
        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setId(id);
        enrollment.setCourse(course);
        enrollment.setCourseGroup(group);
        enrollment.setEnrollmentStatus("APPROVED");
        return enrollment;
    }

    private static SelfStudySession selfStudySession(Integer id) {
        SelfStudySession session = new SelfStudySession();
        session.setId(id);
        session.setSessionNo((short) 1);
        session.setKanjiTarget(100);
        session.setVocabularyTarget(100);
        session.setGrammarTarget(50);
        session.setReadingTargetMinutes(60);
        session.setListeningTargetMinutes(60);
        return session;
    }

    private static SelfStudySessionProgress progress(SelfStudySession session, Integer kanji, Integer vocab,
                                                       Integer grammar, Integer reading, Integer listening) {
        SelfStudySessionProgress progress = new SelfStudySessionProgress();
        progress.setSelfStudySession(session);
        progress.setKanjiCount(kanji);
        progress.setVocabularyCount(vocab);
        progress.setGrammarCount(grammar);
        progress.setReadingMinutes(reading);
        progress.setListeningMinutes(listening);
        return progress;
    }
}
