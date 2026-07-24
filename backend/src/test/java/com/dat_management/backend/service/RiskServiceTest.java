package com.dat_management.backend.service;

import com.dat_management.backend.dto.RiskDtos.RiskDTO;
import com.dat_management.backend.dto.RiskDtos.RiskResponseDTO;
import com.dat_management.backend.entity.AttendanceRecord;
import com.dat_management.backend.entity.AttendanceRecord.AttendanceStatus;
import com.dat_management.backend.entity.Course;
import com.dat_management.backend.entity.CourseCategory;
import com.dat_management.backend.entity.CourseCategory.CourseType;
import com.dat_management.backend.entity.CourseEnrollment;
import com.dat_management.backend.entity.CourseGroup;
import com.dat_management.backend.entity.CourseSession;
import com.dat_management.backend.entity.DepartmentDat;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.SelfStudySession;
import com.dat_management.backend.entity.SelfStudySessionProgress;
import com.dat_management.backend.entity.Team;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RiskServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseEnrollmentRepository enrollmentRepository;

    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;

    @Mock
    private CourseSessionRepository courseSessionRepository;

    @Mock
    private CourseGroupRepository courseGroupRepository;

    @Mock
    private SelfStudySessionRepository selfStudySessionRepository;

    @Mock
    private SelfStudySessionProgressRepository progressRepository;

    // ==================== TRAINER-PROVIDED ====================

    @Test
    void getAtRiskStudents_trainerCourseNotStarted_returnsNoRisks() {
        RiskService service = service();
        Course course = trainerCourse(1);

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(courseSessionRepository.hasAnySessionStarted(1, LocalDate.now())).thenReturn(false);

        RiskResponseDTO result = service.getAtRiskStudents();

        Assertions.assertEquals(0, result.totalAtRisk());
        Assertions.assertTrue(result.atRiskStudents().isEmpty());
    }

    @Test
    void getAtRiskStudents_noAttendanceDataButSessionPassed_atRiskZeroPercent() {
        RiskService service = service();
        Course course = trainerCourse(1);
        CourseGroup group = group(course, 10);
        Employee employee = employee("EMP001", "Alice", "Team A", "Engineering");
        CourseEnrollment enrollment = enrollment(1, employee, course, group);
        CourseSession session = courseSession(1, (short) 1, LocalDate.now().minusDays(1));

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(courseSessionRepository.hasAnySessionStarted(1, LocalDate.now())).thenReturn(true);
        when(courseGroupRepository.findByCourseId(1)).thenReturn(List.of(group));
        when(enrollmentRepository.findByCourseGroupId(10)).thenReturn(List.of(enrollment));
        when(courseSessionRepository.findByCourseGroupIdOrderBySessionNoAsc(10)).thenReturn(List.of(session));
        when(attendanceRecordRepository.findByEnrollmentId(1)).thenReturn(List.of());

        RiskResponseDTO result = service.getAtRiskStudents();

        Assertions.assertEquals(1, result.totalAtRisk());
        RiskDTO risk = result.atRiskStudents().get(0);
        Assertions.assertEquals("Alice", risk.name());
        Assertions.assertEquals("Low attendance", risk.issue());
        Assertions.assertEquals(0.0, risk.risk());
        Assertions.assertEquals("Engineering", risk.department());
        Assertions.assertEquals("Team A", risk.team());
    }

    @Test
    void getAtRiskStudents_attendanceBelowThreshold_isAtRisk() {
        RiskService service = service();
        Course course = trainerCourse(1);
        CourseGroup group = group(course, 10);
        Employee employee = employee("EMP001", "Bob", "Team A", "Engineering");
        CourseEnrollment enrollment = enrollment(1, employee, course, group);

        List<CourseSession> sessions = List.of(
                courseSession(1, (short) 1, LocalDate.now().minusDays(4)),
                courseSession(2, (short) 2, LocalDate.now().minusDays(3)),
                courseSession(3, (short) 3, LocalDate.now().minusDays(2)),
                courseSession(4, (short) 4, LocalDate.now().minusDays(1)));

        List<AttendanceRecord> records = List.of(
                attendanceRecord(sessions.get(0), AttendanceStatus.PRESENT),
                attendanceRecord(sessions.get(1), AttendanceStatus.ABSENT),
                attendanceRecord(sessions.get(2), AttendanceStatus.PRESENT),
                attendanceRecord(sessions.get(3), AttendanceStatus.ABSENT));

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(courseSessionRepository.hasAnySessionStarted(1, LocalDate.now())).thenReturn(true);
        when(courseGroupRepository.findByCourseId(1)).thenReturn(List.of(group));
        when(enrollmentRepository.findByCourseGroupId(10)).thenReturn(List.of(enrollment));
        when(courseSessionRepository.findByCourseGroupIdOrderBySessionNoAsc(10)).thenReturn(sessions);
        when(attendanceRecordRepository.findByEnrollmentId(1)).thenReturn(records);

        RiskResponseDTO result = service.getAtRiskStudents();

        Assertions.assertEquals(1, result.totalAtRisk());
        RiskDTO risk = result.atRiskStudents().get(0);
        Assertions.assertEquals("Low attendance", risk.issue());
        Assertions.assertEquals(50.0, risk.risk());
    }

    @Test
    void getAtRiskStudents_attendanceAtThreshold_isNotAtRisk() {
        RiskService service = service();
        Course course = trainerCourse(1);
        CourseGroup group = group(course, 10);
        Employee employee = employee("EMP001", "Carol", "Team A", "Engineering");
        CourseEnrollment enrollment = enrollment(1, employee, course, group);

        List<CourseSession> sessions = List.of(
                courseSession(1, (short) 1, LocalDate.now().minusDays(4)),
                courseSession(2, (short) 2, LocalDate.now().minusDays(3)),
                courseSession(3, (short) 3, LocalDate.now().minusDays(2)),
                courseSession(4, (short) 4, LocalDate.now().minusDays(1)));

        List<AttendanceRecord> records = List.of(
                attendanceRecord(sessions.get(0), AttendanceStatus.PRESENT),
                attendanceRecord(sessions.get(1), AttendanceStatus.PRESENT),
                attendanceRecord(sessions.get(2), AttendanceStatus.PRESENT),
                attendanceRecord(sessions.get(3), AttendanceStatus.PRESENT));

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(courseSessionRepository.hasAnySessionStarted(1, LocalDate.now())).thenReturn(true);
        when(courseGroupRepository.findByCourseId(1)).thenReturn(List.of(group));
        when(enrollmentRepository.findByCourseGroupId(10)).thenReturn(List.of(enrollment));
        when(courseSessionRepository.findByCourseGroupIdOrderBySessionNoAsc(10)).thenReturn(sessions);
        when(attendanceRecordRepository.findByEnrollmentId(1)).thenReturn(records);

        RiskResponseDTO result = service.getAtRiskStudents();

        Assertions.assertEquals(0, result.totalAtRisk());
    }

    @Test
    void getAtRiskStudents_enrollmentBelongsToDifferentCourse_isFilteredOut() {
        RiskService service = service();
        Course course = trainerCourse(1);
        Course otherCourse = trainerCourse(2);
        CourseGroup group = group(course, 10);
        Employee employee = employee("EMP001", "Dan", "Team A", "Engineering");
        CourseEnrollment enrollment = enrollment(1, employee, otherCourse, group);

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(courseSessionRepository.hasAnySessionStarted(1, LocalDate.now())).thenReturn(true);
        when(courseGroupRepository.findByCourseId(1)).thenReturn(List.of(group));
        when(enrollmentRepository.findByCourseGroupId(10)).thenReturn(List.of(enrollment));

        RiskResponseDTO result = service.getAtRiskStudents();

        Assertions.assertEquals(0, result.totalAtRisk());
    }

    // ==================== SELF-STUDY ====================

    @Test
    void getAtRiskStudents_selfStudyOtherType_isSkippedEntirely() {
        RiskService service = service();
        Course course = selfStudyCourse(1, "Other");

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));

        RiskResponseDTO result = service.getAtRiskStudents();

        Assertions.assertEquals(0, result.totalAtRisk());
    }

    @Test
    void getAtRiskStudents_selfStudyJlptBelowThreshold_isAtRiskLowProgress() {
        RiskService service = service();
        Course course = selfStudyCourse(1, "JLPT");
        CourseGroup group = group(course, 10);
        Employee employee = employee("EMP002", "Erin", "Team B", "Sales");
        CourseEnrollment enrollment = enrollment(2, employee, course, group);

        SelfStudySession session = selfStudySession(1, (short) 1, 100, 100, 50, 60, 60);
        SelfStudySessionProgress progress = progress(session, 30, 30, 15, 18, 18,
                LocalDateTime.now().minusDays(1));

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(courseGroupRepository.findByCourseId(1)).thenReturn(List.of(group));
        when(enrollmentRepository.findByCourseGroupId(10)).thenReturn(List.of(enrollment));
        when(selfStudySessionRepository.findByCourseIdOrderBySessionNoAsc(1)).thenReturn(List.of(session));
        when(progressRepository.findByEnrollmentId(2)).thenReturn(List.of(progress));

        RiskResponseDTO result = service.getAtRiskStudents();

        Assertions.assertEquals(1, result.totalAtRisk());
        RiskDTO risk = result.atRiskStudents().get(0);
        Assertions.assertEquals("Low progress", risk.issue());
        Assertions.assertEquals(30.0, risk.risk());
    }

    @Test
    void getAtRiskStudents_selfStudyJlptAboveThreshold_isNotAtRisk() {
        RiskService service = service();
        Course course = selfStudyCourse(1, "JLPT");
        CourseGroup group = group(course, 10);
        Employee employee = employee("EMP002", "Frank", "Team B", "Sales");
        CourseEnrollment enrollment = enrollment(2, employee, course, group);

        SelfStudySession session = selfStudySession(1, (short) 1, 100, 100, 50, 60, 60);
        SelfStudySessionProgress progress = progress(session, 100, 100, 50, 60, 60,
                LocalDateTime.now().minusDays(1));

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(courseGroupRepository.findByCourseId(1)).thenReturn(List.of(group));
        when(enrollmentRepository.findByCourseGroupId(10)).thenReturn(List.of(enrollment));
        when(selfStudySessionRepository.findByCourseIdOrderBySessionNoAsc(1)).thenReturn(List.of(session));
        when(progressRepository.findByEnrollmentId(2)).thenReturn(List.of(progress));

        RiskResponseDTO result = service.getAtRiskStudents();

        Assertions.assertEquals(0, result.totalAtRisk());
    }

    @Test
    void getAtRiskStudents_selfStudyJlptNoProgressRecords_isSkipped() {
        RiskService service = service();
        Course course = selfStudyCourse(1, "JLPT");
        CourseGroup group = group(course, 10);
        Employee employee = employee("EMP002", "Grace", "Team B", "Sales");
        CourseEnrollment enrollment = enrollment(2, employee, course, group);

        SelfStudySession session = selfStudySession(1, (short) 1, 100, 100, 50, 60, 60);

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(courseGroupRepository.findByCourseId(1)).thenReturn(List.of(group));
        when(enrollmentRepository.findByCourseGroupId(10)).thenReturn(List.of(enrollment));
        when(selfStudySessionRepository.findByCourseIdOrderBySessionNoAsc(1)).thenReturn(List.of(session));
        when(progressRepository.findByEnrollmentId(2)).thenReturn(List.of());

        RiskResponseDTO result = service.getAtRiskStudents();

        Assertions.assertEquals(0, result.totalAtRisk());
    }

    // ==================== SUMMARY AGGREGATION ====================

    @Test
    void getAtRiskStudents_mixedRisks_buildsCorrectSummaryBreakdown() {
        // Note: the `risk` field on RiskDTO holds the raw attendance/completion
        // percentage, so buildSummary's ">= 70 / >= 40" bucketing keys off that
        // percentage value directly -- a student with 0% attendance (worst case)
        // lands in the *lowRisk* bucket, not highRisk. This test locks in that
        // actual behavior rather than the more "intuitive" inverse reading.
        RiskService service = service();
        Course trainerCourse = trainerCourse(1);
        CourseGroup group = group(trainerCourse, 10);
        Employee zeroAttendanceEmployee = employee("EMP001", "Hank", "Team A", "Engineering");
        CourseEnrollment zeroAttendanceEnrollment = enrollment(1, zeroAttendanceEmployee, trainerCourse, group);

        Course selfStudy = selfStudyCourse(2, "JLPT");
        CourseGroup group2 = group(selfStudy, 20);
        Employee halfProgressEmployee = employee("EMP002", "Ivy", "Team B", "Sales");
        CourseEnrollment halfProgressEnrollment = enrollment(2, halfProgressEmployee, selfStudy, group2);

        // 0% attendance (no data, session passed) -> risk = 0.0 -> lowRisk bucket
        CourseSession session = courseSession(1, (short) 1, LocalDate.now().minusDays(1));
        when(courseSessionRepository.hasAnySessionStarted(1, LocalDate.now())).thenReturn(true);
        when(courseGroupRepository.findByCourseId(1)).thenReturn(List.of(group));
        when(enrollmentRepository.findByCourseGroupId(10)).thenReturn(List.of(zeroAttendanceEnrollment));
        when(courseSessionRepository.findByCourseGroupIdOrderBySessionNoAsc(10)).thenReturn(List.of(session));
        when(attendanceRecordRepository.findByEnrollmentId(1)).thenReturn(List.of());

        // 50% self-study progress -> risk = 50.0 -> mediumRisk bucket
        SelfStudySession sSession = selfStudySession(1, (short) 1, 100, 100, 50, 60, 60);
        SelfStudySessionProgress progress = progress(sSession, 50, 50, 25, 30, 30,
                LocalDateTime.now().minusDays(1));
        when(courseGroupRepository.findByCourseId(2)).thenReturn(List.of(group2));
        when(enrollmentRepository.findByCourseGroupId(20)).thenReturn(List.of(halfProgressEnrollment));
        when(selfStudySessionRepository.findByCourseIdOrderBySessionNoAsc(2)).thenReturn(List.of(sSession));
        when(progressRepository.findByEnrollmentId(2)).thenReturn(List.of(progress));

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(trainerCourse, selfStudy));

        RiskResponseDTO result = service.getAtRiskStudents();

        Assertions.assertEquals(2, result.totalAtRisk());
        Assertions.assertEquals(1, result.summary().byIssue().lowAttendance());
        Assertions.assertEquals(1, result.summary().byIssue().lowProgress());
        Assertions.assertEquals(0, result.summary().byRiskLevel().highRisk());
        Assertions.assertEquals(1, result.summary().byRiskLevel().mediumRisk());
        Assertions.assertEquals(1, result.summary().byRiskLevel().lowRisk());
        Assertions.assertEquals(2, result.summary().byDepartment().departments().size());
    }

    private RiskService service() {
        return new RiskService(
                courseRepository,
                enrollmentRepository,
                attendanceRecordRepository,
                courseSessionRepository,
                courseGroupRepository,
                selfStudySessionRepository,
                progressRepository);
    }

    private static Course trainerCourse(Integer id) {
        Course course = new Course();
        course.setId(id);
        course.setCourseName("Trainer Course " + id);
        CourseCategory category = new CourseCategory();
        category.setCourseType(CourseType.TRAINER_PROVIDED);
        course.setCourseCategory(category);
        return course;
    }

    private static Course selfStudyCourse(Integer id, String selfStudyType) {
        Course course = new Course();
        course.setId(id);
        course.setCourseName("Self Study Course " + id);
        course.setSelfStudyType(selfStudyType);
        CourseCategory category = new CourseCategory();
        category.setCourseType(CourseType.SELF_STUDY);
        course.setCourseCategory(category);
        return course;
    }

    private static CourseGroup group(Course course, Integer id) {
        CourseGroup group = new CourseGroup();
        group.setId(id);
        group.setCourse(course);
        group.setGroupName("G1");
        return group;
    }

    private static CourseSession courseSession(Integer id, Short sessionNo, LocalDate date) {
        CourseSession session = new CourseSession();
        session.setId(id);
        session.setSessionNo(sessionNo);
        session.setSessionDate(date);
        return session;
    }

    private static AttendanceRecord attendanceRecord(CourseSession session, AttendanceStatus status) {
        AttendanceRecord record = new AttendanceRecord();
        record.setCourseSession(session);
        record.setAttendanceStatus(status);
        return record;
    }

    private static Employee employee(String id, String name, String teamName, String deptName) {
        DepartmentDat department = new DepartmentDat();
        department.setDeptName(deptName);
        Team team = new Team();
        team.setTeamName(teamName);
        team.setDepartmentDat(department);

        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(name);
        employee.setTeam(team);
        return employee;
    }

    private static CourseEnrollment enrollment(Integer id, Employee employee, Course course, CourseGroup group) {
        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setId(id);
        enrollment.setEmployee(employee);
        enrollment.setCourse(course);
        enrollment.setCourseGroup(group);
        return enrollment;
    }

    private static SelfStudySession selfStudySession(Integer id, Short sessionNo, Integer kanji, Integer vocab,
                                                       Integer grammar, Integer reading, Integer listening) {
        SelfStudySession session = new SelfStudySession();
        session.setId(id);
        session.setSessionNo(sessionNo);
        session.setKanjiTarget(kanji);
        session.setVocabularyTarget(vocab);
        session.setGrammarTarget(grammar);
        session.setReadingTargetMinutes(reading);
        session.setListeningTargetMinutes(listening);
        return session;
    }

    private static SelfStudySessionProgress progress(SelfStudySession session, Integer kanji, Integer vocab,
                                                       Integer grammar, Integer reading, Integer listening,
                                                       LocalDateTime deadline) {
        SelfStudySessionProgress progress = new SelfStudySessionProgress();
        progress.setSelfStudySession(session);
        progress.setKanjiCount(kanji);
        progress.setVocabularyCount(vocab);
        progress.setGrammarCount(grammar);
        progress.setReadingMinutes(reading);
        progress.setListeningMinutes(listening);
        progress.setSessionDeadline(deadline);
        return progress;
    }
}
