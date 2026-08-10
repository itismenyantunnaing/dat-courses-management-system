package com.dat_management.backend.service;

import com.dat_management.backend.dto.ActiveLearnerResponseDTO;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActiveLearnerService {

    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseSessionRepository sessionRepository;
    private final SelfStudySessionProgressRepository progressRepository;
    private final EmployeeRepository employeeRepository;

    private static final String STATUS_SUCCESS = "success";

    @Transactional(readOnly = true)
    public ActiveLearnerResponseDTO getTotalActiveLearners() {
        log.info("========== STARTING ACTIVE LEARNER CALCULATION ==========");
        LocalDate today = LocalDate.now();
        // LocalDate today = LocalDate.of(2026, 8, 25); // For testing
        log.info("Using TODAY: {}", today);

        // Get all approved active enrollments
        List<CourseEnrollment> enrollments = enrollmentRepository.findAllApprovedActiveEnrollments();
        log.info("Found {} approved enrollments", enrollments.size());

        // Set to store unique employee IDs
        Set<String> activeEmployeeIds = new HashSet<>();

        for (CourseEnrollment enrollment : enrollments) {
            Course course = enrollment.getCourse();
            if (course == null) {
                log.debug("Enrollment {} has no course, skipping", enrollment.getId());
                continue;
            }

            CourseCategory.CourseType courseType = course.getCourseCategory().getCourseType();
            String employeeId = enrollment.getEmployee().getId();
            String employeeName = enrollment.getEmployee().getName();

            boolean isActive = false;
            String reason = "";

            if (courseType == CourseCategory.CourseType.TRAINER_PROVIDED) {
                // Trainer-Provided Logic: Check group's last session date
                isActive = isTrainerCourseActive(enrollment, today);
                reason = isActive ? "Group has future sessions" : "All group sessions ended";
            } else if (courseType == CourseCategory.CourseType.SELF_STUDY) {
                // Self-Study Logic: Check student's latest deadline
                isActive = isSelfStudyCourseActive(enrollment, today);
                reason = isActive ? "Has active deadlines or no tracking" : "All deadlines passed";
            }

            if (isActive) {
                activeEmployeeIds.add(employeeId);
                log.info("✅ Employee {} ({}) is ACTIVE - {} - Course: {} (Type: {})", 
                    employeeId, employeeName, reason, course.getCourseName(), courseType);
            } else {
                log.info("❌ Employee {} ({}) is NOT ACTIVE - {} - Course: {} (Type: {})", 
                    employeeId, employeeName, reason, course.getCourseName(), courseType);
            }
        }

        int totalActiveLearners = activeEmployeeIds.size();
        log.info("========== RESULTS ==========");
        log.info("Total active learners found: {}", totalActiveLearners);

        return new ActiveLearnerResponseDTO(totalActiveLearners, STATUS_SUCCESS);
    }

    private boolean isTrainerCourseActive(CourseEnrollment enrollment, LocalDate today) {
        CourseGroup group = enrollment.getCourseGroup();
        if (group == null) {
            log.debug("Enrollment {} has no group, skipping", enrollment.getId());
            return false;
        }

        Integer groupId = group.getId();
        LocalDate maxSessionDate = sessionRepository.findMaxSessionDateByGroupId(groupId).orElse(null);

        if (maxSessionDate == null) {
            log.debug("Group {} has no sessions, skipping enrollment {}", groupId, enrollment.getId());
            return false;
        }

        // Active if the last session date is today or in the future
        boolean isActive = !maxSessionDate.isBefore(today);
        log.debug("Trainer Course - Group {} last session: {}, Today: {}, Active: {}", 
            groupId, maxSessionDate, today, isActive);
        
        return isActive;
    }

    private boolean isSelfStudyCourseActive(CourseEnrollment enrollment, LocalDate today) {
        Integer enrollmentId = enrollment.getId();
        Course course = enrollment.getCourse();
        
        // Check if this is "Other" type self-study (no progress tracking)
        if (course.getSelfStudyType() != null && course.getSelfStudyType().equals("Other")) {
            log.debug("Self-Study 'Other' type - Enrollment {} has no progress tracking, considered ACTIVE", enrollmentId);
            return true;
        }
        
        // For JLPT type self-study with progress tracking
        // Find the maximum deadline for this student's enrollment
        LocalDateTime maxDeadline = progressRepository.findMaxDeadlineByEnrollmentId(enrollmentId).orElse(null);
        
        if (maxDeadline == null) {
            // No progress records found, but student is enrolled and course is active
            // Check if course has any sessions with deadlines
            // If no sessions, consider ACTIVE (just enrolled)
            log.debug("Self-Study - Enrollment {} has no progress records yet, but course may have sessions", enrollmentId);
            
            // Check if there are any self-study sessions for this course
            // If there are sessions but no progress, the student is still active
            // (they just haven't started yet)
            return true; // Enrolled students are active until proven otherwise
        }

        LocalDate maxDeadlineDate = maxDeadline.toLocalDate();
        
        // Active if the latest deadline is today or in the future
        boolean isActive = !maxDeadlineDate.isBefore(today);
        log.debug("Self-Study - Enrollment {} latest deadline: {}, Today: {}, Active: {}", 
            enrollmentId, maxDeadlineDate, today, isActive);
        
        return isActive;
    }

    @Transactional(readOnly = true)
public ActiveLearnerResponseDTO getTotalActiveLearnersByEmployeeId(String employeeId) {
    log.info("========== STARTING ACTIVE LEARNER CALCULATION FOR EMPLOYEE: {} ==========", employeeId);
    LocalDate today = LocalDate.now();
    log.info("Using TODAY: {}", today);

    // Get the employee's team ID
    String teamId = getEmployeeTeamId(employeeId);
    if (teamId == null) {
        log.warn("Employee {} not found or has no team", employeeId);
        return new ActiveLearnerResponseDTO(0, STATUS_SUCCESS);
    }
    log.info("Employee {} belongs to Team: {}", employeeId, teamId);

    // Get all approved active enrollments for this team
    List<CourseEnrollment> enrollments = enrollmentRepository.findAllApprovedActiveEnrollmentsByTeamId(teamId);
    log.info("Found {} approved enrollments for team {}", enrollments.size(), teamId);

    // Set to store unique employee IDs
    Set<String> activeEmployeeIds = new HashSet<>();

    for (CourseEnrollment enrollment : enrollments) {
        Course course = enrollment.getCourse();
        if (course == null) {
            log.debug("Enrollment {} has no course, skipping", enrollment.getId());
            continue;
        }

        CourseCategory.CourseType courseType = course.getCourseCategory().getCourseType();
        String empId = enrollment.getEmployee().getId();
        String employeeName = enrollment.getEmployee().getName();

        boolean isActive = false;
        String reason = "";

        if (courseType == CourseCategory.CourseType.TRAINER_PROVIDED) {
            // Trainer-Provided Logic: Check group's last session date
            isActive = isTrainerCourseActive(enrollment, today);
            reason = isActive ? "Group has future sessions" : "All group sessions ended";
        } else if (courseType == CourseCategory.CourseType.SELF_STUDY) {
            // Self-Study Logic: Check student's latest deadline
            isActive = isSelfStudyCourseActive(enrollment, today);
            reason = isActive ? "Has active deadlines or no tracking" : "All deadlines passed";
        }

        if (isActive) {
            activeEmployeeIds.add(empId);
            log.info("✅ Employee {} ({}) is ACTIVE - {} - Course: {} (Type: {})", 
                empId, employeeName, reason, course.getCourseName(), courseType);
        } else {
            log.info("❌ Employee {} ({}) is NOT ACTIVE - {} - Course: {} (Type: {})", 
                empId, employeeName, reason, course.getCourseName(), courseType);
        }
    }

    int totalActiveLearners = activeEmployeeIds.size();
    log.info("========== RESULTS ==========");
    log.info("Total active learners in team {}: {}", teamId, totalActiveLearners);

    return new ActiveLearnerResponseDTO(totalActiveLearners, STATUS_SUCCESS);
}

private String getEmployeeTeamId(String employeeId) {
    // You need to implement this based on your Employee entity/repository
    // Assuming you have an EmployeeRepository
    return employeeRepository.findTeamIdByEmployeeId(employeeId).orElse(null);
}
}