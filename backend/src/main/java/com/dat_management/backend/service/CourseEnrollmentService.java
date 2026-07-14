package com.dat_management.backend.service;

import com.dat_management.backend.dto.*;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.entity.CourseEnrollment.GroupChangeStatus;
import com.dat_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CourseEnrollmentService {

        private final CourseEnrollmentRepository enrollmentRepository;
        private final EmployeeRepository employeeRepository;
        private final CourseRepository courseRepository;
        private final CourseGroupRepository courseGroupRepository;
        private final SelfStudySessionRepository selfStudySessionRepository;
        private final SelfStudySessionProgressRepository progressRepository;

        public List<EnrollmentResponseDTO> getEnrollments(Integer courseId) {

                return enrollmentRepository.findByCourseId(courseId)
                                .stream()
                                .map(this::toDTO)
                                .toList();
        }

        public EnrollmentResponseDTO enroll(
                        Integer courseId,
                        EnrollmentRequestDTO dto) {

                if (enrollmentRepository.existsEnrollment(
                                dto.getEmployeeId(),
                                courseId)) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Employee already enrolled in this course");
                }

                Employee employee = employeeRepository.findById(dto.getEmployeeId())
                                .orElseThrow(() -> new RuntimeException("Employee not found"));

                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new RuntimeException("Course not found"));

                CourseGroup group = courseGroupRepository.findById(dto.getCourseGroupId())
                                .orElseThrow(() -> new RuntimeException("Course group not found"));

                CourseEnrollment enrollment = new CourseEnrollment();
                enrollment.setEmployee(employee);
                enrollment.setCourse(course);
                enrollment.setCourseGroup(group);
                enrollment.setEnrollmentStatus("APPROVED");
                enrollment.setGroupChangeStatus(GroupChangeStatus.NONE);

                enrollment = enrollmentRepository.save(enrollment);

                // Auto-create progress records for self-study courses
                if (course.getCourseCategory() != null
                                && course.getCourseCategory()
                                                .getCourseType() == com.dat_management.backend.entity.CourseCategory.CourseType.SELF_STUDY
                                && "jlpt".equals(course.getSelfStudyType())) {

                        List<com.dat_management.backend.entity.SelfStudySession> sessions = selfStudySessionRepository
                                        .findByCourseIdOrderBySessionNoAsc(course.getId());

                        LocalDateTime enrollDate = enrollment.getEnrolledAt();
                        long cumulativeDays = 0;

                        for (com.dat_management.backend.entity.SelfStudySession session : sessions) {
                                Integer durationPerSession = session.getDurationPerSession() != null
                                                ? session.getDurationPerSession()
                                                : 0;

                                // Add current session's duration to cumulative
                                cumulativeDays += durationPerSession;

                                // Calculate deadline based on cumulative days
                                LocalDateTime deadline = enrollDate.plusDays(cumulativeDays);

                                com.dat_management.backend.entity.SelfStudySessionProgress progress = new com.dat_management.backend.entity.SelfStudySessionProgress();
                                progress.setEnrollment(enrollment);
                                progress.setSelfStudySession(session);
                                progress.setSessionDeadline(deadline);
                                progress.setCompletionStatus("NOT_STARTED");
                                progress.setKanjiCount(0);
                                progress.setVocabularyCount(0);
                                progress.setGrammarCount(0);
                                progress.setReadingMinutes(0);
                                progress.setListeningMinutes(0);
                                progress.setUpdatedAt(LocalDateTime.now());

                                progressRepository.save(progress);
                        }
                }

                return toDTO(enrollment);
        }

        public EnrollmentResponseDTO updateEnrollment(
                        Integer courseId,
                        Integer enrollmentId,
                        EnrollmentUpdateDTO dto) {

                CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Enrollment not found"));

                enrollment.setEnrollmentStatus(dto.getEnrollmentStatus());

                return toDTO(
                                enrollmentRepository.save(enrollment));
        }

        public void cancelEnrollment(
                        Integer courseId,
                        Integer enrollmentId) {

                CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Enrollment not found"));

                enrollmentRepository.deleteById(enrollmentId);
        }

        private EnrollmentResponseDTO toDTO(
                        CourseEnrollment enrollment) {

                Employee employee = enrollment.getEmployee();

                Integer teamId = null;
                String teamName = null;

                Integer departmentId = null;
                String departmentName = null;

                if (employee.getTeam() != null) {

                        teamId = employee.getTeam().getId();
                        teamName = employee.getTeam().getTeamName();

                        if (employee.getTeam().getDepartmentDat() != null) {

                                departmentId = employee.getTeam()
                                                .getDepartmentDat()
                                                .getId();

                                departmentName = employee.getTeam()
                                                .getDepartmentDat()
                                                .getDeptName();
                        }
                }

                // Get requested course group info
                Integer requestedGroupId = null;
                String requestedGroupName = null;
                if (enrollment.getRequestedCourseGroup() != null) {
                        requestedGroupId = enrollment.getRequestedCourseGroup().getId();
                        requestedGroupName = enrollment.getRequestedCourseGroup().getGroupName();
                }

                return EnrollmentResponseDTO.builder()
                                .id(enrollment.getId())
                                .employeeId(employee.getId())
                                .employeeName(employee.getName())
                                .email(employee.getEmail())
                                .position(employee.getPosition())
                                .teamId(teamId)
                                .teamName(teamName)
                                .departmentId(departmentId)
                                .departmentName(departmentName)
                                .courseGroupId(
                                                enrollment.getCourseGroup() != null
                                                                ? enrollment.getCourseGroup().getId()
                                                                : null)
                                .courseGroupName(
                                                enrollment.getCourseGroup() != null
                                                                ? enrollment.getCourseGroup().getGroupName()
                                                                : null)
                                .enrollmentStatus(enrollment.getEnrollmentStatus())
                                .enrolledAt(enrollment.getEnrolledAt())
                                // === ADD GROUP CHANGE FIELDS ===
                                .groupChangeStatus(enrollment.getGroupChangeStatus() != null 
                                                ? enrollment.getGroupChangeStatus().name() 
                                                : "NONE")
                                .requestedCourseGroupId(requestedGroupId)
                                .requestedCourseGroupName(requestedGroupName)
                                .build();
        }

        // Employee requests a group change
        public void requestGroupChange(Integer enrollmentId, Integer groupId) {
                log.info("Requesting group change for enrollment {} to group {}", enrollmentId, groupId);

                CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Enrollment not found with id: " + enrollmentId));

                CourseGroup newGroup = courseGroupRepository.findById(groupId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Course group not found with id: " + groupId));

                // Check if the requested group is the same as current
                if (enrollment.getCourseGroup() != null && 
                    enrollment.getCourseGroup().getId().equals(groupId)) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Cannot request change to the same group");
                }

                // Check if there's already a pending request
                if (enrollment.getGroupChangeStatus() == GroupChangeStatus.PENDING) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "There is already a pending group change request");
                }

                enrollment.setRequestedCourseGroup(newGroup);
                enrollment.setGroupChangeStatus(GroupChangeStatus.PENDING);

                enrollmentRepository.save(enrollment);
                log.info("Group change request submitted for enrollment {}", enrollmentId);
        }

        // Admin changes immediately
        public void adminChangeGroup(Integer enrollmentId, Integer groupId) {
                log.info("Admin changing group for enrollment {} to group {}", enrollmentId, groupId);

                CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Enrollment not found with id: " + enrollmentId));

                CourseGroup newGroup = courseGroupRepository.findById(groupId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Course group not found with id: " + groupId));

                // Check if the requested group is the same as current
                if (enrollment.getCourseGroup() != null && 
                    enrollment.getCourseGroup().getId().equals(groupId)) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Cannot change to the same group");
                }

                // Store old group for logging
                Integer oldGroupId = enrollment.getCourseGroup() != null ? 
                                enrollment.getCourseGroup().getId() : null;

                // Update the group
                enrollment.setCourseGroup(newGroup);

                // Clear request
                enrollment.setRequestedCourseGroup(null);
                enrollment.setGroupChangeStatus(GroupChangeStatus.NONE);

                enrollmentRepository.save(enrollment);
                log.info("Group changed successfully for enrollment {} from group {} to group {}", 
                                enrollmentId, oldGroupId, groupId);
        }

        // Admin approves employee request
        public void approveRequest(Integer enrollmentId) {
                log.info("Admin approving group change request for enrollment {}", enrollmentId);

                CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Enrollment not found with id: " + enrollmentId));

                if (enrollment.getGroupChangeStatus() != GroupChangeStatus.PENDING) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "No pending group change request found for this enrollment");
                }

                if (enrollment.getRequestedCourseGroup() == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "No requested group found");
                }

                // Apply the change
                enrollment.setCourseGroup(enrollment.getRequestedCourseGroup());
                enrollment.setRequestedCourseGroup(null);
                enrollment.setGroupChangeStatus(GroupChangeStatus.NONE);

                enrollmentRepository.save(enrollment);
                log.info("Group change request approved for enrollment {}", enrollmentId);
        }

        // Admin rejects employee request
        public void rejectRequest(Integer enrollmentId) {
                log.info("Admin rejecting group change request for enrollment {}", enrollmentId);

                CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Enrollment not found with id: " + enrollmentId));

                if (enrollment.getGroupChangeStatus() != GroupChangeStatus.PENDING) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "No pending group change request found for this enrollment");
                }

                enrollment.setRequestedCourseGroup(null);
                enrollment.setGroupChangeStatus(GroupChangeStatus.REJECTED);

                enrollmentRepository.save(enrollment);
                log.info("Group change request rejected for enrollment {}", enrollmentId);
        }

}