package com.dat_management.backend.controller;

import com.dat_management.backend.dto.CourseRequestDto;
import com.dat_management.backend.dto.GroupRequestDto;
import com.dat_management.backend.dto.SessionDto;
import com.dat_management.backend.dto.SelfStudySessionDto;
import com.dat_management.backend.entity.AttendanceRecord.AttendanceStatus;
import com.dat_management.backend.entity.Course;
import com.dat_management.backend.entity.Course.CourseStatus;
import com.dat_management.backend.entity.CourseCategory;
import com.dat_management.backend.entity.CourseCategory.CourseType;
import com.dat_management.backend.entity.CourseEnrollment;
import com.dat_management.backend.entity.CourseGroup;
import com.dat_management.backend.entity.CourseGroup.GroupStatus;
import com.dat_management.backend.entity.CourseSession;
import com.dat_management.backend.entity.CourseSession.SessionStatus;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.SystemConfig;
import com.dat_management.backend.entity.SelfStudySession;
import com.dat_management.backend.repository.AttendanceRecordRepository;
import com.dat_management.backend.repository.CourseCategoryRepository;
import com.dat_management.backend.repository.CourseEnrollmentRepository;
import com.dat_management.backend.repository.CourseGroupRepository;
import com.dat_management.backend.repository.CourseRepository;
import com.dat_management.backend.repository.CourseSessionRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.SystemConfigRepository;
import com.dat_management.backend.repository.SelfStudySessionProgressRepository;
import com.dat_management.backend.repository.SelfStudySessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "file.upload-dir=target/course-test-uploads"
})
@Transactional
class CourseControllerIntegrationTest {

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
    private SelfStudySessionRepository selfStudySessionRepository;

    @Autowired
    private SelfStudySessionProgressRepository progressRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @BeforeEach
    void setUp() {

        // Clean dependent tables first
        attendanceRepository.deleteAll();
        progressRepository.deleteAll();
        enrollmentRepository.deleteAll();
        sessionRepository.deleteAll();
        selfStudySessionRepository.deleteAll();
        groupRepository.deleteAll();
        sessionRepository.deleteAll();
        courseRepository.deleteAll();
        categoryRepository.deleteAll();
        employeeRepository.deleteAll();

        // Clean system config
        systemConfigRepository.deleteAll();

        // Create test configuration
        SystemConfig config = new SystemConfig();
        config.setActiveSmtpProvider(SystemConfig.SmtpProvider.GMAIL);
        config.setGmailHost("smtp.gmail.com");
        config.setGmailPort(587);
        config.setGmailUsername("test@gmail.com");
        config.setGmailPassword("password");
        config.setFileUploadSizeMb(5);
        config.setSessionTimeoutMinutes(30);
        config.setJwtExpiryHours(24);
        config.setMaxLoginAttempts(5);

        systemConfigRepository.save(config);
    }

    @Test
    @DisplayName("TC_COURSE_INT_001 | POST create trainer course -> persists course, group, and sessions")
    void createTrainerCourse_validMultipartRequest_returns201AndPersistsCourseStructure() throws Exception {
        CourseCategory category = categoryRepository.save(category("JLPT Trainer", CourseType.TRAINER_PROVIDED));

        CourseRequestDto request = CourseRequestDto.builder()
                .courseName("JLPT N2 Trainer")
                .trainerName("Tanaka")
                .courseCategoryId(category.getId())
                .targetLevel("N2")
                .totalSessions((short) 2)
                .registrationDeadline(LocalDate.of(2026, 7, 31))
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 8, 8))
                .status("OPEN")
                .groups(List.of(GroupRequestDto.builder()
                        .groupName("G1")
                        .capacity(20)
                        .groupStatus("OPEN")
                        .sessions(List.of(
                                SessionDto.builder()
                                        .sessionNo((short) 1)
                                        .sessionDate(LocalDate.of(2026, 8, 1))
                                        .startTime(LocalTime.of(9, 0))
                                        .endTime(LocalTime.of(10, 0))
                                        .sessionStatus("PLANNED")
                                        .build(),
                                SessionDto.builder()
                                        .sessionNo((short) 2)
                                        .sessionDate(LocalDate.of(2026, 8, 8))
                                        .startTime(LocalTime.of(9, 0))
                                        .endTime(LocalTime.of(10, 0))
                                        .sessionStatus("PLANNED")
                                        .build()))
                        .build()))
                .build();

        MockMultipartFile data = new MockMultipartFile(
                "data",
                "course.json",
                MediaType.APPLICATION_JSON_VALUE,
                courseRequestJson(request).getBytes());

        mockMvc.perform(multipart("/api/courses").file(data))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.course.course_name").value("JLPT N2 Trainer"))
                .andExpect(jsonPath("$.course.status").value("OPEN"));

        org.junit.jupiter.api.Assertions.assertEquals(1, courseRepository.count());
        org.junit.jupiter.api.Assertions.assertEquals(1, groupRepository.count());
        org.junit.jupiter.api.Assertions.assertEquals(2, sessionRepository.count());
    }

    @Test
    @DisplayName("TC_COURSE_INT_002 | GET course detail -> returns groups and sessions")
    void getCourseById_existingTrainerCourse_returnsNestedGroupsAndSessions() throws Exception {
        Course course = trainerCourseWithGroupAndSession();

        mockMvc.perform(get("/api/courses/{id}", course.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.course.id").value(course.getId()))
                .andExpect(jsonPath("$.course.course_name").value("JLPT N2 Trainer"))
                .andExpect(jsonPath("$.course.groups", hasSize(1)))
                .andExpect(jsonPath("$.course.groups[0].sessions", hasSize(1)))
                .andExpect(jsonPath("$.course.groups[0].registered_count").value(0));
    }

    @Test
    @DisplayName("TC_COURSE_INT_003 | POST enroll JLPT self-study course -> creates progress records")
    void enrollSelfStudyCourse_validRequest_returnsCreatedAndCreatesProgressRecords() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        Course course = selfStudyCourseWithSessions();
        CourseGroup group = groupRepository.save(group(course, "Self Study", null));

        mockMvc.perform(post("/api/courses/{id}/enroll", course.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(enrollmentJson(employee.getId(), group.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employeeId").value("EMP001"))
                .andExpect(jsonPath("$.courseGroupId").value(group.getId()))
                .andExpect(jsonPath("$.enrollmentStatus").value("APPROVED"));

        org.junit.jupiter.api.Assertions.assertEquals(1, enrollmentRepository.count());
        org.junit.jupiter.api.Assertions.assertEquals(2, progressRepository.count());
    }

    @Test
    @DisplayName("TC_COURSE_INT_004 | POST attendance -> creates attendance for enrollment and session")
    void createAttendance_validEnrollmentAndSession_returnsAttendanceRecord() throws Exception {
        Course course = trainerCourseWithGroupAndSession();
        CourseGroup group = groupRepository.findByCourseIdOrderByGroupNameAsc(course.getId()).get(0);
        CourseSession session = sessionRepository.findByCourseGroupIdOrderBySessionNoAsc(group.getId()).get(0);
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        CourseEnrollment enrollment = enrollmentRepository.save(enrollment(employee, course, group));

        mockMvc.perform(post("/api/courses/{courseId}/groups/{groupId}/attendance", course.getId(), group.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(attendanceJson(enrollment.getId(), session.getId(), "PRESENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.attendance.employeeId").value("EMP001"))
                .andExpect(jsonPath("$.attendance.attendanceStatus").value("PRESENT"));

        org.junit.jupiter.api.Assertions.assertEquals(1, attendanceRepository.count());
    }

    @Test
    @DisplayName("TC_COURSE_INT_005 | PUT group change request and approve -> moves enrollment")
    void approveGroupChange_pendingRequest_movesEnrollmentToRequestedGroup() throws Exception {
        Course course = trainerCourseWithGroupAndSession();
        CourseGroup currentGroup = groupRepository.findByCourseIdOrderByGroupNameAsc(course.getId()).get(0);
        CourseGroup requestedGroup = groupRepository.save(group(course, "G2", 20));
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        CourseEnrollment enrollment = enrollmentRepository.save(enrollment(employee, course, currentGroup));

        mockMvc.perform(put("/api/groupchange/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(groupChangeJson(enrollment.getId(), requestedGroup.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is("Request submitted.")));

        mockMvc.perform(put("/api/groupchange/{enrollmentId}/approve", enrollment.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is("Request approved.")));

        CourseEnrollment updated = enrollmentRepository.findById(enrollment.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(requestedGroup.getId(), updated.getCourseGroup().getId());
        org.junit.jupiter.api.Assertions.assertEquals(CourseEnrollment.GroupChangeStatus.NONE, updated.getGroupChangeStatus());
    }

    private Course trainerCourseWithGroupAndSession() {
        CourseCategory category = categoryRepository.save(category("JLPT Trainer", CourseType.TRAINER_PROVIDED));
        Course course = courseRepository.save(course("JLPT N2 Trainer", category, "N2", null));
        CourseGroup group = groupRepository.save(group(course, "G1", 20));

        CourseSession session = new CourseSession();
        session.setCourse(course);
        session.setCourseGroup(group);
        session.setSessionNo((short) 1);
        session.setSessionDate(LocalDate.of(2026, 8, 1));
        session.setStartTime(LocalTime.of(9, 0));
        session.setEndTime(LocalTime.of(10, 0));
        session.setSessionStatus(SessionStatus.PLANNED);
        sessionRepository.save(session);

        return course;
    }

    private Course selfStudyCourseWithSessions() {
        CourseCategory category = categoryRepository.save(category("JLPT Self Study", CourseType.SELF_STUDY));
        Course course = courseRepository.save(course("JLPT N2 Self Study", category, "N2", "jlpt"));
        selfStudySessionRepository.save(selfStudySession(course, (short) 1, 7));
        selfStudySessionRepository.save(selfStudySession(course, (short) 2, 14));
        return course;
    }

    private static CourseCategory category(String name, CourseType type) {
        CourseCategory category = new CourseCategory();
        category.setCourseCategoryName(name);
        category.setCourseType(type);
        category.setIsDeleted(false);
        return category;
    }

    private static Course course(String name, CourseCategory category, String targetLevel, String selfStudyType) {
        Course course = new Course();
        course.setCourseName(name);
        course.setCourseCategory(category);
        course.setTargetLevel(targetLevel);
        course.setSelfStudyType(selfStudyType);
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

    private static SelfStudySession selfStudySession(Course course, Short sessionNo, Integer duration) {
        SelfStudySession session = new SelfStudySession();
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

    private static CourseEnrollment enrollment(Employee employee, Course course, CourseGroup group) {
        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setEmployee(employee);
        enrollment.setCourse(course);
        enrollment.setCourseGroup(group);
        enrollment.setEnrollmentStatus("APPROVED");
        enrollment.setGroupChangeStatus(CourseEnrollment.GroupChangeStatus.NONE);
        return enrollment;
    }

    private static Employee employee(String id, String name) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(name);
        employee.setEmail(id.toLowerCase() + "@dat.com");
        employee.setPassword("encoded-password");
        employee.setDoorlog("door-" + id);
        employee.setPosition("Engineer");
        employee.setEmpStatus("active");
        employee.setStatus("default");
        employee.setIsCorePersonnel(false);
        employee.setHasJapanBusinessTrip(false);
        employee.setNotiSetting(false);
        employee.setIsDeleted(false);
        return employee;
    }

    private static String courseRequestJson(CourseRequestDto request) {
        GroupRequestDto group = request.getGroups().get(0);
        SessionDto first = group.getSessions().get(0);
        SessionDto second = group.getSessions().get(1);

        return "{"
                + "\"course_name\":\"" + request.getCourseName() + "\","
                + "\"trainer_name\":\"" + request.getTrainerName() + "\","
                + "\"course_category_id\":" + request.getCourseCategoryId() + ","
                + "\"target_level\":\"" + request.getTargetLevel() + "\","
                + "\"total_sessions\":" + request.getTotalSessions() + ","
                + "\"registration_deadline\":\"" + request.getRegistrationDeadline() + "\","
                + "\"start_date\":\"" + request.getStartDate() + "\","
                + "\"end_date\":\"" + request.getEndDate() + "\","
                + "\"status\":\"" + request.getStatus() + "\","
                + "\"groups\":[{"
                + "\"group_name\":\"" + group.getGroupName() + "\","
                + "\"capacity\":" + group.getCapacity() + ","
                + "\"group_status\":\"" + group.getGroupStatus() + "\","
                + "\"sessions\":["
                + sessionJson(first) + ","
                + sessionJson(second)
                + "]}]"
                + "}";
    }

    private static String sessionJson(SessionDto session) {
        return "{"
                + "\"session_no\":" + session.getSessionNo() + ","
                + "\"session_date\":\"" + session.getSessionDate() + "\","
                + "\"start_time\":\"" + session.getStartTime() + "\","
                + "\"end_time\":\"" + session.getEndTime() + "\","
                + "\"session_status\":\"" + session.getSessionStatus() + "\""
                + "}";
    }

    private static String enrollmentJson(String employeeId, Integer groupId) {
        return "{"
                + "\"employeeId\":\"" + employeeId + "\","
                + "\"courseGroupId\":" + groupId
                + "}";
    }

    private static String attendanceJson(Integer enrollmentId, Integer sessionId, String status) {
        return "{"
                + "\"enrollmentId\":" + enrollmentId + ","
                + "\"courseSessionId\":" + sessionId + ","
                + "\"attendanceStatus\":\"" + status + "\""
                + "}";
    }

    private static String groupChangeJson(Integer enrollmentId, Integer groupId) {
        return "{"
                + "\"enrollmentId\":" + enrollmentId + ","
                + "\"groupId\":" + groupId
                + "}";
    }
}
