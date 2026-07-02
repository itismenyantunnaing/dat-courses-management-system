package com.dat_management.backend.service;

import com.dat_management.backend.dto.*;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.repository.*;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseEnrollmentService {

        private final CourseEnrollmentRepository enrollmentRepository;
        private final EmployeeRepository employeeRepository;
        private final CourseRepository courseRepository;
        private final CourseGroupRepository courseGroupRepository;

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

                return toDTO(
                                enrollmentRepository.save(enrollment));
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

                enrollment.setEnrollmentStatus("CANCELLED");

                enrollmentRepository.save(enrollment);
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
                                .build();
        }
}