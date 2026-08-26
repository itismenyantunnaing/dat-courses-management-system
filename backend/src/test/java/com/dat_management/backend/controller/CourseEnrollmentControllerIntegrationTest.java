package com.dat_management.backend.controller;

import com.dat_management.backend.entity.Course;
import com.dat_management.backend.entity.Course.CourseStatus;
import com.dat_management.backend.entity.CourseCategory;
import com.dat_management.backend.entity.CourseCategory.CourseType;
import com.dat_management.backend.entity.CourseEnrollment;
import com.dat_management.backend.entity.CourseGroup;
import com.dat_management.backend.entity.CourseGroup.GroupStatus;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.SelfStudySession;
import com.dat_management.backend.repository.CourseCategoryRepository;
import com.dat_management.backend.repository.CourseEnrollmentRepository;
import com.dat_management.backend.repository.CourseGroupRepository;
import com.dat_management.backend.repository.CourseRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.SelfStudySessionProgressRepository;
import com.dat_management.backend.repository.SelfStudySessionRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers the enrollment lifecycle endpoints that {@link CourseControllerIntegrationTest}
 * does not exercise: listing, updating, cancelling, and the duplicate-enroll guard.
 * POST /api/courses/{id}/enroll happy path is already covered there, so it is only
 * retested here for the 409 conflict branch.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CourseEnrollmentControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CourseCategoryRepository categoryRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseGroupRepository groupRepository;

    @Autowired
    private CourseEnrollmentRepository enrollmentRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private SelfStudySessionRepository selfStudySessionRepository;

    @Autowired
    private SelfStudySessionProgressRepository progressRepository;

    @BeforeEach
    void setUp() {
        progressRepository.deleteAll();
        enrollmentRepository.deleteAll();
        selfStudySessionRepository.deleteAll();
        groupRepository.deleteAll();
        courseRepository.deleteAll();
        categoryRepository.deleteAll();
        employeeRepository.deleteAll();
    }

    @Test
    @DisplayName("TC_ENROLL_INT_001 | GET enrollments -> 200 and full DTO for each enrollment")
    void getEnrollments_courseWithEnrollment_returnsPopulatedDto() throws Exception {
        Course course = trainerCourseWithGroup();
        CourseGroup group = groupRepository.findByCourseIdOrderByGroupNameAsc(course.getId()).get(0);
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        enrollmentRepository.save(enrollment(employee, course, group));

        mockMvc.perform(get("/api/courses/{id}/enrollments", course.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].employeeId").value("EMP001"))
                .andExpect(jsonPath("$[0].employeeName").value("Alice Admin"))
                .andExpect(jsonPath("$[0].courseGroupId").value(group.getId()))
                .andExpect(jsonPath("$[0].courseGroupName").value("G1"))
                .andExpect(jsonPath("$[0].enrollmentStatus").value("APPROVED"))
                .andExpect(jsonPath("$[0].groupChangeStatus").value("NONE"));
    }

    @Test
    @DisplayName("TC_ENROLL_INT_002 | GET enrollments -> 200 empty array when course has none")
    void getEnrollments_courseWithoutEnrollments_returnsEmptyArray() throws Exception {
        Course course = trainerCourseWithGroup();

        mockMvc.perform(get("/api/courses/{id}/enrollments", course.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("TC_ENROLL_INT_003 | POST enroll duplicate employee -> 409 Conflict, no second row persisted")
    void enroll_employeeAlreadyEnrolledInCourse_returns409AndDoesNotDuplicate() throws Exception {
        Course course = trainerCourseWithGroup();
        CourseGroup group = groupRepository.findByCourseIdOrderByGroupNameAsc(course.getId()).get(0);
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        enrollmentRepository.save(enrollment(employee, course, group));

        mockMvc.perform(post("/api/courses/{id}/enroll", course.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(enrollmentJson("EMP001", group.getId())))
                .andExpect(status().isConflict());

        Assertions.assertEquals(1, enrollmentRepository.findByCourseId(course.getId()).size());
    }

    @Test
    @DisplayName("TC_ENROLL_INT_004 | POST enroll into self-study JLPT course -> auto-creates session progress with deadlines")
    void enroll_selfStudyJlptCourse_autoCreatesProgressRecords() throws Exception {
        Course course = selfStudyJlptCourseWithSessions();
        CourseGroup group = groupRepository.save(group(course, "G1", null));
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));

        mockMvc.perform(post("/api/courses/{id}/enroll", course.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(enrollmentJson("EMP001", group.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employeeId").value("EMP001"))
                .andExpect(jsonPath("$.enrollmentStatus").value("APPROVED"));

        CourseEnrollment enrollment = enrollmentRepository.findByCourseId(course.getId()).get(0);
        List<com.dat_management.backend.entity.SelfStudySessionProgress> progress =
                progressRepository.findByEnrollment_Id(enrollment.getId());
        Assertions.assertEquals(2, progress.size());
        progress.forEach(p -> Assertions.assertEquals("NOT_STARTED", p.getCompletionStatus()));
    }

    @Test
    @DisplayName("TC_ENROLL_INT_005 | PUT update enrollment -> 200 and persists mock test attempt")
    void updateEnrollment_validMockTestAttempt_persistsChange() throws Exception {
        Course course = trainerCourseWithGroup();
        CourseGroup group = groupRepository.findByCourseIdOrderByGroupNameAsc(course.getId()).get(0);
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        CourseEnrollment enrollment = enrollmentRepository.save(enrollment(employee, course, group));

        mockMvc.perform(put("/api/courses/{id}/enrollments/{enrollmentId}", course.getId(), enrollment.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateEnrollmentJson(2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(enrollment.getId()))
                .andExpect(jsonPath("$.mockTestAttempt").value(2));

        CourseEnrollment updated = enrollmentRepository.findById(enrollment.getId()).orElseThrow();
        Assertions.assertEquals(2, updated.getMockTestAttempt());
    }

    @Test
    @DisplayName("TC_ENROLL_INT_006 | PUT update enrollment for unknown id -> 404 Not Found")
    void updateEnrollment_unknownEnrollmentId_returns404() throws Exception {
        Course course = trainerCourseWithGroup();

        mockMvc.perform(put("/api/courses/{id}/enrollments/{enrollmentId}", course.getId(), 99999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateEnrollmentJson(1)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TC_ENROLL_INT_007 | DELETE cancel enrollment -> 200, removes enrollment and its progress rows")
    void cancelEnrollment_existingSelfStudyEnrollment_deletesEnrollmentAndProgress() throws Exception {
        Course course = selfStudyJlptCourseWithSessions();
        CourseGroup group = groupRepository.save(group(course, "G1", null));
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));

        mockMvc.perform(post("/api/courses/{id}/enroll", course.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(enrollmentJson("EMP001", group.getId())))
                .andExpect(status().isCreated());

        CourseEnrollment enrollment = enrollmentRepository.findByCourseId(course.getId()).get(0);
        Assertions.assertEquals(2, progressRepository.findByEnrollment_Id(enrollment.getId()).size());

        mockMvc.perform(delete("/api/courses/{id}/enrollments/{enrollmentId}", course.getId(), enrollment.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Enrollment cancelled successfully"));

        Optional<CourseEnrollment> deleted = enrollmentRepository.findById(enrollment.getId());
        Assertions.assertTrue(deleted.isEmpty());
        Assertions.assertEquals(0, progressRepository.findByEnrollment_Id(enrollment.getId()).size());
    }

    @Test
    @DisplayName("TC_ENROLL_INT_008 | DELETE cancel enrollment for unknown id -> 404 Not Found")
    void cancelEnrollment_unknownEnrollmentId_returns404() throws Exception {
        Course course = trainerCourseWithGroup();

        mockMvc.perform(delete("/api/courses/{id}/enrollments/{enrollmentId}", course.getId(), 99999))
                .andExpect(status().isNotFound());
    }

    private Course trainerCourseWithGroup() {
        CourseCategory category = categoryRepository.save(category("JLPT Trainer", CourseType.TRAINER_PROVIDED));
        Course course = courseRepository.save(course("JLPT N2 Trainer", category, "N2", null));
        groupRepository.save(group(course, "G1", 20));
        return course;
    }

    private Course selfStudyJlptCourseWithSessions() {
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

    private static String enrollmentJson(String employeeId, Integer groupId) {
        return "{"
                + "\"employeeId\":\"" + employeeId + "\","
                + "\"courseGroupId\":" + groupId
                + "}";
    }

    private static String updateEnrollmentJson(Integer mockTestAttempt) {
        return "{\"mockTestAttempt\":" + mockTestAttempt + "}";
    }
}