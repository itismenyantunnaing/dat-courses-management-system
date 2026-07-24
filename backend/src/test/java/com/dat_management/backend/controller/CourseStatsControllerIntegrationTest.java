package com.dat_management.backend.controller;

import com.dat_management.backend.entity.*;
import com.dat_management.backend.entity.Course.CourseStatus;
import com.dat_management.backend.entity.CourseCategory.CourseType;
import com.dat_management.backend.entity.CourseGroup.GroupStatus;
import com.dat_management.backend.entity.CourseSession.SessionStatus;
import com.dat_management.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.sql.init.mode=never"
})
@Transactional
class CourseStatsControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CourseCategoryRepository categoryRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseGroupRepository groupRepository;

    @Autowired
    private CourseSessionRepository sessionRepository;

    @Autowired
    private CourseEnrollmentRepository enrollmentRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private DepartmentDatRepository departmentRepository;

    @Autowired
    private DivisionRepository divisionRepository;

    @BeforeEach
    void setUp() {
        attendanceRepository.deleteAll();
        enrollmentRepository.deleteAll();
        sessionRepository.deleteAll();
        groupRepository.deleteAll();
        courseRepository.deleteAll();
        categoryRepository.deleteAll();
        employeeRepository.deleteAll();
        teamRepository.deleteAll();
        departmentRepository.deleteAll();
        divisionRepository.deleteAll();
    }

    @Test
    @DisplayName("TC_DASH_INT_001 | GET /api/course-stats -> returns enrollment/completion stats per course")
    void getCourseStats_withEnrollmentsAndAttendance_returnsCompletionStats() throws Exception {
        Course course = courseWithGroupSessionsAndEnrollment();

        mockMvc.perform(get("/api/course-stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value(course.getCourseName()))
                .andExpect(jsonPath("$[0].enrolled").value(1))
                .andExpect(jsonPath("$[0].courseType").value("TRAINER_PROVIDED"));
    }

    @Test
    @DisplayName("TC_DASH_INT_002 | GET /api/course-stats -> empty when no courses exist")
    void getCourseStats_noCourses_returnsEmptyArray() throws Exception {
        mockMvc.perform(get("/api/course-stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("TC_DASH_INT_003 | GET /api/course-stats/daily-attendance -> groups attendance by department/team")
    void getDailyAttendanceByDepartment_withEnrollments_returnsNestedDepartmentStructure() throws Exception {
        courseWithGroupSessionsAndEnrollment();

        mockMvc.perform(get("/api/course-stats/daily-attendance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].departmentName").value("Engineering"))
                .andExpect(jsonPath("$[0].teams[0].teamName").value("Team A"));
    }

    @Test
    @DisplayName("TC_DASH_INT_004 | GET /api/course-stats/risk -> flags low-attendance students")
    void getAtRiskStudents_lowAttendance_returnsAtRiskStudent() throws Exception {
        courseWithGroupSessionsAndEnrollment();

        mockMvc.perform(get("/api/course-stats/risk"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAtRisk").value(1))
                .andExpect(jsonPath("$.atRiskStudents[0].issue").value("Low attendance"));
    }

    @Test
    @DisplayName("TC_DASH_INT_005 | GET /api/course-stats/active-learners -> counts learners with future sessions")
    void getActiveLearners_courseWithFutureSession_countsAsActive() throws Exception {
        courseWithGroupSessionsAndEnrollment();

        mockMvc.perform(get("/api/course-stats/active-learners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalActiveLearners").value(1))
                .andExpect(jsonPath("$.status").value("success"));
    }

    /**
     * Builds one trainer-provided course with a single group, a past and a future
     * session, one enrollment (no attendance recorded for the past session, so the
     * student is both "at risk" for the risk endpoint and "active" for the
     * active-learners endpoint because the group still has a future session).
     */
    private Course courseWithGroupSessionsAndEnrollment() {
        Division division =
                divisionRepository.save(division("Technology"));

        DepartmentDat department =
                departmentRepository.save(
                        department("Engineering", division)
                );
        Team team = teamRepository.save(team(department, "Team A"));
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin", team));

        CourseCategory category = categoryRepository.save(category("JLPT Trainer", CourseType.TRAINER_PROVIDED));
        Course course = courseRepository.save(course("JLPT N2 Trainer", category));
        CourseGroup group = groupRepository.save(group(course, "G1", 20));

        CourseSession pastSession = sessionRepository.save(
                session(course, group, (short) 1, LocalDate.now().minusDays(2)));
        sessionRepository.save(session(course, group, (short) 2, LocalDate.now().plusDays(5)));

        CourseEnrollment enrollment = enrollmentRepository.save(enrollment(employee, course, group));
        // Intentionally no AttendanceRecord for pastSession -> triggers "Low attendance" risk.

        return course;
    }

    private static DepartmentDat department(String name, Division division) {
        DepartmentDat department = new DepartmentDat();
        department.setDeptName(name);
        department.setDivision(division);
        department.setIsDeleted(false);
        return department;
    }

    private static Division division(String name) {
        Division division = new Division();
        division.setDivisionName(name);
        division.setIsDeleted(false);
        return division;
    }

    private static Team team(DepartmentDat department, String name) {
        Team team = new Team();
        team.setDepartmentDat(department);
        team.setTeamName(name);
        team.setIsDeleted(false);
        return team;
    }

    private static Employee employee(String id, String name, Team team) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(name);
        employee.setEmail(id.toLowerCase() + "@dat.com");
        employee.setPassword("encoded-password");
        employee.setDoorlog("door-" + id);
        employee.setPosition("Engineer");
        employee.setEmpStatus("active");
        employee.setStatus("default");
        employee.setTeam(team);
        employee.setIsCorePersonnel(false);
        employee.setHasJapanBusinessTrip(false);
        employee.setNotiSetting(false);
        employee.setIsDeleted(false);
        return employee;
    }

    private static CourseCategory category(String name, CourseType type) {
        CourseCategory category = new CourseCategory();
        category.setCourseCategoryName(name);
        category.setCourseType(type);
        category.setIsDeleted(false);
        return category;
    }

    private static Course course(String name, CourseCategory category) {
        Course course = new Course();
        course.setCourseName(name);
        course.setCourseCategory(category);
        course.setTargetLevel("N2");
        course.setTotalSessions((short) 2);
        course.setStatus(CourseStatus.OPEN);
        course.setIsDeleted(false);
        return course;
    }

    private static CourseGroup group(Course course, String groupName, Integer capacity) {
        CourseGroup group = new CourseGroup();
        group.setCourse(course);
        group.setGroupName(groupName);
        group.setCapacity(capacity);
        group.setGroupStatus(GroupStatus.OPEN);
        return group;
    }

    private static CourseSession session(Course course, CourseGroup group, Short sessionNo, LocalDate date) {
        CourseSession session = new CourseSession();
        session.setCourse(course);
        session.setCourseGroup(group);
        session.setSessionNo(sessionNo);
        session.setSessionDate(date);
        session.setStartTime(LocalTime.of(9, 0));
        session.setEndTime(LocalTime.of(10, 0));
        session.setSessionStatus(SessionStatus.PLANNED);
        return session;
    }

    private static CourseEnrollment enrollment(Employee employee, Course course, CourseGroup group) {
        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setEmployee(employee);
        enrollment.setCourse(course);
        enrollment.setCourseGroup(group);
        enrollment.setEnrollmentStatus("APPROVED");
        enrollment.setGroupChangeStatus(CourseEnrollment.GroupChangeStatus.NONE);
        return enrollment;
    }
}
