package com.dat_management.backend.service;

import com.dat_management.backend.dto.FeedbackSuggestionDto;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.FeedbackCategory;
import com.dat_management.backend.entity.FeedbackSuggestion;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.FeedbackSuggestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackSuggestionService {

    private final FeedbackSuggestionRepository feedbackRepository;
    private final EmployeeRepository employeeRepository;

    private FeedbackSuggestionDto convertToDto(FeedbackSuggestion feedback) {
        FeedbackSuggestionDto dto = new FeedbackSuggestionDto();
        dto.setId(feedback.getId());
        dto.setEmployeeId(feedback.getEmployee().getId());
        dto.setSubject(feedback.getSubject());
        dto.setCategory(feedback.getCategory().name());
        dto.setDescription(feedback.getDescription());
        dto.setStatus(feedback.getStatus());

        // Set timestamps
        dto.setCreatedAt(feedback.getCreatedAt() != null ? feedback.getCreatedAt().toString() : null);
        dto.setUpdatedAt(feedback.getUpdatedAt() != null ? feedback.getUpdatedAt().toString() : null);

        // Set employee details
        Employee employee = feedback.getEmployee();
        if (employee != null) {
            dto.setEmployeeName(employee.getName());

            // Get department from Team -> DepartmentDat
            if (employee.getTeam() != null) {
                if (employee.getTeam().getDepartmentDat() != null) {
                    dto.setDepartment(employee.getTeam().getDepartmentDat().getDeptName());
                }
                dto.setTeam(employee.getTeam().getTeamName());
            }

            dto.setProfilePhotoPath(employee.getProfilePhotoPath());
        }

        return dto;
    }

    private List<FeedbackSuggestionDto> convertToDtoList(List<FeedbackSuggestion> feedbacks) {
        return feedbacks.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public FeedbackSuggestionDto create(FeedbackSuggestionDto dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + dto.getEmployeeId()));

        FeedbackSuggestion feedback = new FeedbackSuggestion();
        feedback.setEmployee(employee);
        feedback.setSubject(dto.getSubject());
        feedback.setCategory(FeedbackCategory.valueOf(dto.getCategory()));
        feedback.setDescription(dto.getDescription());
        feedback.setStatus(dto.getStatus() != null ? dto.getStatus() : "Pending");

        FeedbackSuggestion saved = feedbackRepository.save(feedback);
        return convertToDto(saved);
    }

    public List<FeedbackSuggestionDto> getAll() {
        return convertToDtoList(feedbackRepository.findAll());
    }

    public List<FeedbackSuggestionDto> getByEmployeeId(String employeeId) {
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        return convertToDtoList(feedbackRepository.findByEmployeeId(employeeId));
    }

    @Transactional
    public FeedbackSuggestionDto update(Integer id, FeedbackSuggestionDto dto) {
        // Verify employee exists
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + dto.getEmployeeId()));

        FeedbackSuggestion feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback not found with id: " + id));

        feedback.setEmployee(employee);
        feedback.setSubject(dto.getSubject());
        feedback.setCategory(FeedbackCategory.valueOf(dto.getCategory()));
        feedback.setDescription(dto.getDescription());
        feedback.setStatus(dto.getStatus());

        // The @PreUpdate will automatically set updatedAt
        FeedbackSuggestion updated = feedbackRepository.save(feedback);
        return convertToDto(updated);
    }

    @Transactional
    public void delete(Integer id) {
        FeedbackSuggestion feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback not found with id: " + id));
        feedbackRepository.delete(feedback);
    }
}