package com.dat_management.backend.service;

import com.dat_management.backend.dto.MonthlyAttendanceDtos.CourseMonthlyAttendanceDTO;
import com.dat_management.backend.dto.MonthlyAttendanceDtos.DailyAttendanceDetailDTO;
import com.dat_management.backend.dto.MonthlyAttendanceDtos.DepartmentMonthlyAttendanceDTO;
import com.dat_management.backend.dto.MonthlyAttendanceDtos.GroupMonthlyAttendanceDTO;
import com.dat_management.backend.dto.MonthlyAttendanceDtos.TeamMonthlyAttendanceDTO;
import com.dat_management.backend.entity.AttendanceRecord.AttendanceStatus;
import com.dat_management.backend.entity.Course;
import com.dat_management.backend.entity.CourseCategory;
import com.dat_management.backend.entity.CourseCategory.CourseType;
import com.dat_management.backend.entity.CourseEnrollment;
import com.dat_management.backend.entity.CourseGroup;
import com.dat_management.backend.entity.CourseSession;
import com.dat_management.backend.entity.DepartmentDat;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.Team;
import com.dat_management.backend.repository.AttendanceRecordRepository;
import com.dat_management.backend.repository.CourseEnrollmentRepository;
import com.dat_management.backend.repository.CourseGroupRepository;
import com.dat_management.backend.repository.CourseRepository;
import com.dat_management.backend.repository.CourseSessionRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseAttendanceServiceTest {

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

    @Test
    void getDailyAttendanceByDepartment_noTrainerCourses_returnsEmptyList() {
        CourseAttendanceService service = service();
        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of());

        List<DepartmentMonthlyAttendanceDTO> result = service.getDailyAttendanceByDepartment();

        Assertions.assertTrue(result.isEmpty());
    }

    @Test
    void getDailyAttendanceByDepartment_selfStudyCourse_isExcluded() {
        CourseAttendanceService service = service();
        Course selfStudy = course(1, CourseType.SELF_STUDY);
        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(selfStudy));

        List<DepartmentMonthlyAttendanceDTO> result = service.getDailyAttendanceByDepartment();

        Assertions.assertTrue(result.isEmpty());
    }

    @Test
    void getDailyAttendanceByDepartment_groupWithNoSessions_isSkipped() {
        CourseAttendanceService service = service();
        Course course = course(1, CourseType.TRAINER_PROVIDED);
        CourseGroup group = group(course, 10);

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(courseGroupRepository.findByCourseId(1)).thenReturn(List.of(group));
        when(courseSessionRepository.findByCourseGroupIdOrderBySessionNoAsc(10)).thenReturn(List.of());

        List<DepartmentMonthlyAttendanceDTO> result = service.getDailyAttendanceByDepartment();

        Assertions.assertTrue(result.isEmpty());
    }

    @Test
    void getDailyAttendanceByDepartment_employeeWithoutTeam_isSkipped() {
        CourseAttendanceService service = service();
        Course course = course(1, CourseType.TRAINER_PROVIDED);
        CourseGroup group = group(course, 10);
        CourseSession session = session(1, LocalDate.of(2026, 7, 6));
        CourseEnrollment enrollment = enrollment(1, employee("EMP001", null), course, group);

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(courseGroupRepository.findByCourseId(1)).thenReturn(List.of(group));
        when(courseSessionRepository.findByCourseGroupIdOrderBySessionNoAsc(10)).thenReturn(List.of(session));
        when(enrollmentRepository.findByCourseGroupId(10)).thenReturn(List.of(enrollment));

        List<DepartmentMonthlyAttendanceDTO> result = service.getDailyAttendanceByDepartment();

        Assertions.assertTrue(result.isEmpty());
    }

    @Test
    void getDailyAttendanceByDepartment_singleSessionWithAttendance_buildsNestedStructureWithCorrectPercentages() {
        CourseAttendanceService service = service();
        Course course = course(1, CourseType.TRAINER_PROVIDED);
        course.setCourseName("JLPT N2 Trainer");
        CourseGroup group = group(course, 10);
        group.setGroupName("G1");
        LocalDate sessionDate = LocalDate.of(2026, 7, 6);
        CourseSession session = session(1, sessionDate);

        Team team = new Team();
        team.setTeamName("Team A");
        DepartmentDat department = new DepartmentDat();
        department.setDeptName("Engineering");
        team.setDepartmentDat(department);

        CourseEnrollment enrollmentPresent = enrollment(1, employee("EMP001", team), course, group);
        CourseEnrollment enrollmentAbsent = enrollment(2, employee("EMP002", team), course, group);

        when(courseRepository.findByIsDeletedFalse()).thenReturn(List.of(course));
        when(courseGroupRepository.findByCourseId(1)).thenReturn(List.of(group));
        when(courseSessionRepository.findByCourseGroupIdOrderBySessionNoAsc(10)).thenReturn(List.of(session));
        when(enrollmentRepository.findByCourseGroupId(10)).thenReturn(List.of(enrollmentPresent, enrollmentAbsent));
        when(courseSessionRepository.findByCourseGroupIdAndSessionDate(10, sessionDate)).thenReturn(List.of(session));

        when(attendanceRecordRepository.countByEnrollmentIdAndAttendanceStatusAndSessionId(1, AttendanceStatus.PRESENT, 1))
                .thenReturn(1L);
        when(attendanceRecordRepository.countByEnrollmentIdAndAttendanceStatusAndSessionId(1, AttendanceStatus.ABSENT, 1))
                .thenReturn(0L);
        when(attendanceRecordRepository.countByEnrollmentIdAndAttendanceStatusAndSessionId(1, AttendanceStatus.LATE, 1))
                .thenReturn(0L);
        when(attendanceRecordRepository.countByEnrollmentIdAndAttendanceStatusAndSessionId(1, AttendanceStatus.EXCUSED, 1))
                .thenReturn(0L);

        when(attendanceRecordRepository.countByEnrollmentIdAndAttendanceStatusAndSessionId(2, AttendanceStatus.PRESENT, 1))
                .thenReturn(0L);
        when(attendanceRecordRepository.countByEnrollmentIdAndAttendanceStatusAndSessionId(2, AttendanceStatus.ABSENT, 1))
                .thenReturn(1L);
        when(attendanceRecordRepository.countByEnrollmentIdAndAttendanceStatusAndSessionId(2, AttendanceStatus.LATE, 1))
                .thenReturn(0L);
        when(attendanceRecordRepository.countByEnrollmentIdAndAttendanceStatusAndSessionId(2, AttendanceStatus.EXCUSED, 1))
                .thenReturn(0L);

        List<DepartmentMonthlyAttendanceDTO> result = service.getDailyAttendanceByDepartment();

        Assertions.assertEquals(1, result.size());
        DepartmentMonthlyAttendanceDTO deptDto = result.get(0);
        Assertions.assertEquals("Engineering", deptDto.departmentName());

        TeamMonthlyAttendanceDTO teamDto = deptDto.teams().get(0);
        Assertions.assertEquals("Team A", teamDto.teamName());

        CourseMonthlyAttendanceDTO courseDto = teamDto.courses().get(0);
        Assertions.assertEquals("JLPT N2 Trainer", courseDto.courseName());

        GroupMonthlyAttendanceDTO groupDto = courseDto.groups().get(0);
        Assertions.assertEquals("G1", groupDto.groupName());

        DailyAttendanceDetailDTO daily = groupDto.dailyAttendance().get(0);
        Assertions.assertEquals("Jul 6", daily.date());
        Assertions.assertEquals(2, daily.totalStudents());
        Assertions.assertEquals(1, daily.presentCount());
        Assertions.assertEquals(1, daily.absentCount());
        // 1 present out of (2 students * 1 session) = 50%
        Assertions.assertEquals(50.0, daily.presentPercentage());
        Assertions.assertEquals(50.0, daily.absentPercentage());
        Assertions.assertEquals(0.0, daily.latePercentage());
        Assertions.assertEquals(0.0, daily.excusedPercentage());
    }

    private CourseAttendanceService service() {
        return new CourseAttendanceService(
                courseRepository,
                enrollmentRepository,
                attendanceRecordRepository,
                courseSessionRepository,
                courseGroupRepository);
    }

    private static Course course(Integer id, CourseType type) {
        Course course = new Course();
        course.setId(id);
        course.setCourseName("Course " + id);
        CourseCategory category = new CourseCategory();
        category.setCourseType(type);
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

    private static CourseSession session(Integer id, LocalDate date) {
        CourseSession session = new CourseSession();
        session.setId(id);
        session.setSessionNo((short) 1);
        session.setSessionDate(date);
        return session;
    }

    private static Employee employee(String id, Team team) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName("Employee " + id);
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
}
