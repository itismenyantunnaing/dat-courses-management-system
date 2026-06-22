package com.dat_management.backend.service;

import com.dat_management.backend.dto.HolidayDto;
import com.dat_management.backend.entity.Holiday;
import com.dat_management.backend.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class HolidayService {

    private final HolidayRepository holidayRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public List<Holiday> getAllHolidays() {
        return holidayRepository.findAllByIsDeletedFalse();
    }

   public Holiday getHolidayById(Integer id) {
    return holidayRepository.findByIdAndIsDeletedFalse(id)
        .orElseThrow(() -> new RuntimeException("Holiday not found with id: " + id));
    }

    public Holiday createHoliday(HolidayDto dto) {
        LocalDate holidayDate = validateAndParseDate(dto.getHolidayDate());
        
        if (holidayRepository.existsByHolidayDateAndIsDeletedFalse(holidayDate)) {
            throw new RuntimeException("Holiday already exists for date: " + dto.getHolidayDate());
        }
        
        Optional<Holiday> existingHoliday = holidayRepository.findByHolidayDate(holidayDate);
        
        if (existingHoliday.isPresent()) {
            // Reactivate soft-deleted holiday
            Holiday holiday = existingHoliday.get();
            holiday.setHolidayName(dto.getHolidayName());
            holiday.setDeleted(false);
            return holidayRepository.save(holiday);
        } else {
            // Create new holiday
            Holiday holiday = new Holiday();
            holiday.setHolidayDate(holidayDate);
            holiday.setHolidayName(dto.getHolidayName());
            holiday.setDeleted(false);
            return holidayRepository.save(holiday);
        }
    }

    public List<Holiday> createMultipleHolidays(List<HolidayDto> dtos) {
        List<Holiday> holidaysToSave = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        
        // Validate All holidays and collect All errors
        for (HolidayDto dto : dtos) {
            try {
                LocalDate holidayDate = validateAndParseDate(dto.getHolidayDate());
                
                // Check if holiday already exists
                if (holidayRepository.existsByHolidayDateAndIsDeletedFalse(holidayDate)) {
                    errors.add("Holiday already exists for date: " + dto.getHolidayDate());
                    continue;
                }
                Optional<Holiday> existingHoliday = holidayRepository.findByHolidayDate(holidayDate);
                if (existingHoliday.isPresent()) {
                    // Reactivate soft-deleted holiday
                    Holiday holiday = existingHoliday.get();
                    holiday.setHolidayName(dto.getHolidayName());
                    holiday.setDeleted(false);
                    holidaysToSave.add(holiday);
                } else {
                    Holiday holiday = new Holiday();
                    holiday.setHolidayDate(holidayDate);
                    holiday.setHolidayName(dto.getHolidayName());
                    holiday.setDeleted(false);
                    holidaysToSave.add(holiday);
                }
            } catch (RuntimeException e) {
                errors.add("Error for date " + dto.getHolidayDate() + ": " + e.getMessage());
            }
        }
        
        if (!errors.isEmpty()) {
            throw new RuntimeException(String.join("; ", errors));
        }
        
        return holidayRepository.saveAll(holidaysToSave);
    }
    public Holiday updateHoliday(Integer id, HolidayDto dto) {
        LocalDate holidayDate = validateAndParseDate(dto.getHolidayDate());
        
        // Find existing holiday (including soft-deleted ones to check)
        Holiday existing = holidayRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Holiday not found with id: " + id));
        
        // Check if trying to update a soft-deleted holiday
        if (existing.isDeleted()) {
            throw new RuntimeException("Cannot update a deleted holiday with id: " + id);
        }
        
        // Check if date is being changed
        if (!existing.getHolidayDate().equals(holidayDate)) {
            // Check if NEW date already has an ACTIVE holiday
            if (holidayRepository.existsByHolidayDateAndIsDeletedFalse(holidayDate)) {
                throw new RuntimeException("Holiday already exists for date: " + dto.getHolidayDate());
            }
        }
        
        existing.setHolidayDate(holidayDate);
        existing.setHolidayName(dto.getHolidayName());
        
        return holidayRepository.save(existing);
    }

    public void deleteHoliday(Integer id) {
        Holiday holiday = holidayRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Holiday not found with id: " + id));
        holidayRepository.delete(holiday);
    }

    public Holiday softDeleteHoliday(Integer id) {
        Holiday holiday = holidayRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Holiday not found with id: " + id));
        
        // Check if already deleted
        if (holiday.isDeleted()) {
            throw new RuntimeException("Holiday with id: " + id + " is already deleted");
        }
        
        holiday.setDeleted(true);
        return holidayRepository.save(holiday);
    }

    private LocalDate validateAndParseDate(String dateStr) {
        try {
            return LocalDate.parse(dateStr.trim(), DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Invalid date format. Please use yyyy-MM-dd format (e.g., 2026-12-25)");
        }
    }
}