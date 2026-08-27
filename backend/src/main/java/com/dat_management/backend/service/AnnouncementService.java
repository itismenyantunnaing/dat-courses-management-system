package com.dat_management.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dat_management.backend.dto.AnnouncementDto;
import com.dat_management.backend.entity.Announcement;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.AnnouncementCategory;
import com.dat_management.backend.repository.AnnouncementRepository;
import com.dat_management.backend.repository.EmployeeRepository;

@Service
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    private final EmployeeRepository employeeRepository;

    public AnnouncementService(AnnouncementRepository announcementRepository,EmployeeRepository employeeRepository) {
        this.announcementRepository = announcementRepository;
        this.employeeRepository= employeeRepository;
    }

    private AnnouncementDto convertToDto(Announcement announcement) {
        Employee employee = employeeRepository.findById(announcement.getCreatedBy()).orElse(null);
        AnnouncementDto dto = new AnnouncementDto();
        dto.setId(announcement.getId());
        dto.setTitle(announcement.getTitle());
        dto.setText(announcement.getText());
        dto.setCategory(announcement.getCategory().name());
        dto.setCreatedBy(employee != null ? employee.getName() : announcement.getCreatedBy());
        dto.setCreatedAt(announcement.getCreatedAt() != null ? announcement.getCreatedAt().toString() : null);
        dto.setUpdatedAt(announcement.getUpdatedAt() != null ? announcement.getUpdatedAt().toString() : null);
        if (employee != null && employee.getTeam() != null) {
            dto.setTeamName(employee.getTeam().getTeamName());
            if (employee.getTeam().getDepartmentDat() != null) {
                dto.setDepartmentName(employee.getTeam().getDepartmentDat().getDeptName());
                if (employee.getTeam().getDepartmentDat().getDivision() != null) {
                    dto.setDivisionName(employee.getTeam().getDepartmentDat().getDivision().getDivisionName());
                }
            }
        }
        return dto;
    }

    private List<AnnouncementDto> convertToDtoList(List<Announcement> announcements) {
        return announcements.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // Create
    @Transactional
    public AnnouncementDto create(AnnouncementDto dto) {
        Announcement announcement = new Announcement();
        announcement.setTitle(dto.getTitle());
        announcement.setText(dto.getText());
        announcement.setCategory(AnnouncementCategory.valueOf(dto.getCategory()));
        announcement.setCreatedBy(dto.getCreatedBy());  //  Just set the string
        Announcement saved = announcementRepository.save(announcement);
        return convertToDto(saved);
    }

    // Read all
    public List<AnnouncementDto> getAll() {
        return convertToDtoList(announcementRepository.findAll());
    }

    // Read by ID
    public AnnouncementDto getById(Integer id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found with id: " + id));
        return convertToDto(announcement);
    }

    // Update
    @Transactional
    public AnnouncementDto update(Integer id, AnnouncementDto dto) {
        Announcement existing = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found with id: " + id));

        existing.setTitle(dto.getTitle());
        existing.setText(dto.getText());
        existing.setCategory(AnnouncementCategory.valueOf(dto.getCategory()));
        // Don't update createdBy - it should stay as the original creator

        Announcement updated = announcementRepository.save(existing);
        return convertToDto(updated);
    }

    // Delete
    @Transactional
    public void delete(Integer id) {
        Announcement existing = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found with id: " + id));
        announcementRepository.delete(existing);
    }
}