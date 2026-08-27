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
                log.info(" Employee {} ({}) is ACTIVE - {} - Course: {} (Type: {})", 
                    employeeId, employeeName, reason, course.getCourseName(), courseType);
            } else {
                log.info("❌ Employee {} ({}) is NOT ACTIVE - {} - Course: {} (Type: {})", 
                    employeeId, employeeName, reason, course.getCourseName(), courseType);
            }
        }

        int totalActiveLearners = activeEmployeeIds.size();
        log.info("========== RESULTS ==========");
        log.info("Total active learners found: {}", totalActiveLearners);

        // For admin (no employeeId provided), get all employees
        long totalEmployees = employeeRepository.countActiveEmployees();
        log.info("Total employees in system: {}", totalEmployees);

        return new ActiveLearnerResponseDTO(totalActiveLearners, (int) totalEmployees, STATUS_SUCCESS);
    }

    @Transactional(readOnly = true)
    public ActiveLearnerResponseDTO getTotalActiveLearnersByEmployeeId(String employeeId) {
        log.info("========== STARTING ACTIVE LEARNER CALCULATION FOR EMPLOYEE: {} ==========", employeeId);
        LocalDate today = LocalDate.now();
        log.info("Using TODAY: {}", today);

        // Get the employee with their role and organizational relationships
        Employee employee = employeeRepository.findByIdWithRelationships(employeeId).orElse(null);
        if (employee == null) {
            log.warn("Employee {} not found", employeeId);
            return new ActiveLearnerResponseDTO(0, 0, STATUS_SUCCESS);
        }

        String roleName = employee.getRole().getRoleName();
        log.info("Employee {} has role: {}", employeeId, roleName);

        List<CourseEnrollment> enrollments;
        String scopeDescription;
        Long totalEmployees = 0L;

        // Determine which enrollments to fetch based on role
        if ("Division_Head".equalsIgnoreCase(roleName)) {
            // Get division ID through Team -> DepartmentDat -> Division
            Integer divisionId = getDivisionIdFromEmployee(employee);
            if (divisionId == null) {
                log.warn("Division Head {} has no division assigned", employeeId);
                return new ActiveLearnerResponseDTO(0, 0, STATUS_SUCCESS);
            }
            enrollments = enrollmentRepository.findAllApprovedActiveEnrollmentsByDivisionId(divisionId);
            scopeDescription = "Division: " + divisionId;
            log.info("Division Head - Fetching enrollments for division: {}", divisionId);
            
            // Get total employees in this division
            totalEmployees = employeeRepository.countActiveEmployeesByDivisionId(divisionId);
            log.info("Total employees in division {}: {}", divisionId, totalEmployees);
            
        } else if ("Department_Head".equalsIgnoreCase(roleName)) {
            // Get department ID through Team -> DepartmentDat
            Integer departmentId = getDepartmentIdFromEmployee(employee);
            if (departmentId == null) {
                log.warn("Department Head {} has no department assigned", employeeId);
                return new ActiveLearnerResponseDTO(0, 0, STATUS_SUCCESS);
            }
            enrollments = enrollmentRepository.findAllApprovedActiveEnrollmentsByDepartmentId(departmentId);
            scopeDescription = "Department: " + departmentId;
            log.info("Department Head - Fetching enrollments for department: {}", departmentId);
            
            // Get total employees in this department
            totalEmployees = employeeRepository.countActiveEmployeesByDepartmentId(departmentId);
            log.info("Total employees in department {}: {}", departmentId, totalEmployees);
            
        } else if ("Approver".equalsIgnoreCase(roleName) || "Team_Lead".equalsIgnoreCase(roleName)) {
            // Get team ID
            Integer teamId = getTeamIdFromEmployee(employee);
            if (teamId == null) {
                log.warn("Approver/Team Lead {} has no team assigned", employeeId);
                return new ActiveLearnerResponseDTO(0, 0, STATUS_SUCCESS);
            }
            enrollments = enrollmentRepository.findAllApprovedActiveEnrollmentsByTeamId(teamId);
            scopeDescription = "Team: " + teamId;
            log.info("Approver/Team Lead - Fetching enrollments for team: {}", teamId);
            
            // Get total employees in this team
            totalEmployees = employeeRepository.countActiveEmployeesByTeamId(teamId);
            log.info("Total employees in team {}: {}", teamId, totalEmployees);
            
        } else {
            // For regular employees, just get their own enrollments
            enrollments = enrollmentRepository.findAllApprovedActiveEnrollmentsByEmployeeId(employeeId);
            scopeDescription = "Employee: " + employeeId;
            log.info("Regular Employee - Fetching enrollments for employee: {}", employeeId);
            
            // For regular employees, total is just 1 (themselves)
            totalEmployees = 1L;
        }

        log.info("Found {} approved enrollments for {}", enrollments.size(), scopeDescription);

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
                log.info(" Employee {} ({}) is ACTIVE - {} - Course: {} (Type: {})", 
                    empId, employeeName, reason, course.getCourseName(), courseType);
            } else {
                log.info("❌ Employee {} ({}) is NOT ACTIVE - {} - Course: {} (Type: {})", 
                    empId, employeeName, reason, course.getCourseName(), courseType);
            }
        }

        int totalActiveLearners = activeEmployeeIds.size();
        log.info("========== RESULTS ==========");
        log.info("Total active learners for {}: {}", scopeDescription, totalActiveLearners);
        log.info("Total employees in scope: {}", totalEmployees);

        return new ActiveLearnerResponseDTO(totalActiveLearners, totalEmployees.intValue(), STATUS_SUCCESS);
    }

    // Helper methods to get IDs from Employee
    private Integer getDivisionIdFromEmployee(Employee employee) {
        if (employee.getTeam() != null && employee.getTeam().getDepartmentDat() != null) {
            Division division = employee.getTeam().getDepartmentDat().getDivision();
            if (division != null) {
                return division.getId();
            }
        }
        return null;
    }

    private Integer getDepartmentIdFromEmployee(Employee employee) {
        if (employee.getTeam() != null) {
            DepartmentDat departmentDat = employee.getTeam().getDepartmentDat();
            if (departmentDat != null) {
                return departmentDat.getId();
            }
        }
        return null;
    }

    private Integer getTeamIdFromEmployee(Employee employee) {
        if (employee.getTeam() != null) {
            return employee.getTeam().getId();
        }
        return null;
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
            log.debug("Self-Study - Enrollment {} has no progress records yet, considering ACTIVE", enrollmentId);
            return true;
        }

        LocalDate maxDeadlineDate = maxDeadline.toLocalDate();
        
        // Active if the latest deadline is today or in the future
        boolean isActive = !maxDeadlineDate.isBefore(today);
        log.debug("Self-Study - Enrollment {} latest deadline: {}, Today: {}, Active: {}", 
            enrollmentId, maxDeadlineDate, today, isActive);
        
        return isActive;
    }
}