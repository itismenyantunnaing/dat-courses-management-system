package com.dat_management.backend.controller;

import com.dat_management.backend.entity.Course;
import com.dat_management.backend.entity.Course.CourseStatus;
import com.dat_management.backend.entity.CourseCategory;
import com.dat_management.backend.entity.CourseCategory.CourseType;
import com.dat_management.backend.entity.CourseEnrollment;
import com.dat_management.backend.entity.CourseEnrollment.GroupChangeStatus;
import com.dat_management.backend.entity.CourseGroup;
import com.dat_management.backend.entity.CourseGroup.GroupStatus;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.CourseCategoryRepository;
import com.dat_management.backend.repository.CourseEnrollmentRepository;
import com.dat_management.backend.repository.CourseGroupRepository;
import com.dat_management.backend.repository.CourseRepository;
import com.dat_management.backend.repository.EmployeeRepository;
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

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * CourseControllerIntegrationTest already covers the happy-path
 * request -> approve flow. This file covers what it doesn't:
 * adminChangeGroup (entirely untested), reject (entirely untested),
 * and the validation branches of request/approve.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class GroupChangeControllerIntegrationTest {

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

    private Course course;
    private CourseGroup currentGroup;
    private CourseGroup otherGroup;

    @BeforeEach
    void setUp() {
        enrollmentRepository.deleteAll();
        groupRepository.deleteAll();
        courseRepository.deleteAll();
        categoryRepository.deleteAll();
        employeeRepository.deleteAll();

        CourseCategory category = categoryRepository.save(category("JLPT Trainer", CourseType.TRAINER_PROVIDED));
        course = courseRepository.save(course("JLPT N2 Trainer", category));
        currentGroup = groupRepository.save(group(course, "G1", 20));
        otherGroup = groupRepository.save(group(course, "G2", 20));
    }

    @Test
    @DisplayName("TC_GROUPCHANGE_INT_001 | PUT adminchange -> 200, moves enrollment immediately and clears any pending request")
    void adminChangeGroup_pendingRequestExists_movesImmediatelyAndClearsPendingState() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        CourseEnrollment enrollment = enrollmentRepository.save(enrollment(employee, currentGroup));
        enrollment.setGroupChangeStatus(GroupChangeStatus.PENDING);
        enrollment.setRequestedCourseGroup(otherGroup);
        enrollmentRepository.save(enrollment);

        mockMvc.perform(put("/api/groupchange/{enrollmentId}/adminchange/{groupId}",
                        enrollment.getId(), otherGroup.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is("Group changed successfully.")));

        CourseEnrollment updated = enrollmentRepository.findById(enrollment.getId()).orElseThrow();
        Assertions.assertEquals(otherGroup.getId(), updated.getCourseGroup().getId());
        Assertions.assertNull(updated.getRequestedCourseGroup());
        Assertions.assertEquals(GroupChangeStatus.NONE, updated.getGroupChangeStatus());
    }

    @Test
    @DisplayName("TC_GROUPCHANGE_INT_002 | PUT adminchange to same group -> 400 Bad Request")
    void adminChangeGroup_sameGroupAsCurrent_returns400() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        CourseEnrollment enrollment = enrollmentRepository.save(enrollment(employee, currentGroup));

        mockMvc.perform(put("/api/groupchange/{enrollmentId}/adminchange/{groupId}",
                        enrollment.getId(), currentGroup.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Cannot change to the same group"));
    }

    @Test
    @DisplayName("TC_GROUPCHANGE_INT_003 | PUT adminchange for unknown enrollment -> 404 Not Found")
    void adminChangeGroup_unknownEnrollment_returns404() throws Exception {
        mockMvc.perform(put("/api/groupchange/{enrollmentId}/adminchange/{groupId}", 99999, otherGroup.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Enrollment not found with id: 99999"));
    }

    @Test
    @DisplayName("TC_GROUPCHANGE_INT_004 | PUT adminchange to unknown group -> 404 Not Found")
    void adminChangeGroup_unknownGroup_returns404() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        CourseEnrollment enrollment = enrollmentRepository.save(enrollment(employee, currentGroup));

        mockMvc.perform(put("/api/groupchange/{enrollmentId}/adminchange/{groupId}", enrollment.getId(), 99999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Course group not found with id: 99999"));
    }

    @Test
    @DisplayName("TC_GROUPCHANGE_INT_005 | PUT reject on pending request -> 200, marks REJECTED and clears requested group")
    void rejectRequest_pendingRequest_setsRejectedStatusAndClearsRequestedGroup() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        CourseEnrollment enrollment = enrollmentRepository.save(enrollment(employee, currentGroup));
        enrollment.setGroupChangeStatus(GroupChangeStatus.PENDING);
        enrollment.setRequestedCourseGroup(otherGroup);
        enrollmentRepository.save(enrollment);

        mockMvc.perform(put("/api/groupchange/{enrollmentId}/reject", enrollment.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is("Request rejected.")));

        CourseEnrollment updated = enrollmentRepository.findById(enrollment.getId()).orElseThrow();
        Assertions.assertEquals(GroupChangeStatus.REJECTED, updated.getGroupChangeStatus());
        Assertions.assertNull(updated.getRequestedCourseGroup());
        Assertions.assertEquals(currentGroup.getId(), updated.getCourseGroup().getId());
    }

    @Test
    @DisplayName("TC_GROUPCHANGE_INT_006 | PUT reject with no pending request -> 400 Bad Request")
    void rejectRequest_noPendingRequest_returns400() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        CourseEnrollment enrollment = enrollmentRepository.save(enrollment(employee, currentGroup));

        mockMvc.perform(put("/api/groupchange/{enrollmentId}/reject", enrollment.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("No pending group change request found for this enrollment"));
    }

    @Test
    @DisplayName("TC_GROUPCHANGE_INT_007 | PUT reject for unknown enrollment -> 404 Not Found")
    void rejectRequest_unknownEnrollment_returns404() throws Exception {
        mockMvc.perform(put("/api/groupchange/{enrollmentId}/reject", 99999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Enrollment not found with id: 99999"));
    }

    @Test
    @DisplayName("TC_GROUPCHANGE_INT_008 | PUT request for same group as current -> 400 Bad Request")
    void requestGroup_sameGroupAsCurrent_returns400() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        CourseEnrollment enrollment = enrollmentRepository.save(enrollment(employee, currentGroup));

        mockMvc.perform(put("/api/groupchange/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(groupChangeJson(enrollment.getId(), currentGroup.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot request change to the same group"));
    }

    @Test
    @DisplayName("TC_GROUPCHANGE_INT_009 | PUT request while a request is already pending -> 409 Conflict")
    void requestGroup_alreadyPending_returns409() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        CourseEnrollment enrollment = enrollmentRepository.save(enrollment(employee, currentGroup));
        enrollment.setGroupChangeStatus(GroupChangeStatus.PENDING);
        enrollment.setRequestedCourseGroup(otherGroup);
        enrollmentRepository.save(enrollment);

        mockMvc.perform(put("/api/groupchange/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(groupChangeJson(enrollment.getId(), otherGroup.getId())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("There is already a pending group change request"));
    }

    @Test
    @DisplayName("TC_GROUPCHANGE_INT_010 | PUT approve with no pending request -> 400 Bad Request")
    void approveRequest_noPendingRequest_returns400() throws Exception {
        Employee employee = employeeRepository.save(employee("EMP001", "Alice Admin"));
        CourseEnrollment enrollment = enrollmentRepository.save(enrollment(employee, currentGroup));

        mockMvc.perform(put("/api/groupchange/{enrollmentId}/approve", enrollment.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("No pending group change request found for this enrollment"));
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

    private static CourseEnrollment enrollment(Employee employee, CourseGroup group) {
        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setEmployee(employee);
        enrollment.setCourse(group.getCourse());
        enrollment.setCourseGroup(group);
        enrollment.setEnrollmentStatus("APPROVED");
        enrollment.setGroupChangeStatus(GroupChangeStatus.NONE);
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

    private static String groupChangeJson(Integer enrollmentId, Integer groupId) {
        return "{"
                + "\"enrollmentId\":" + enrollmentId + ","
                + "\"groupId\":" + groupId
                + "}";
    }
}