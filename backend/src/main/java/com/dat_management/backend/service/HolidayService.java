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

@Service
@RequiredArgsConstructor
public class HolidayService {

    private final HolidayRepository holidayRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public List<Holiday> getAllHolidays() {
        return holidayRepository.findAll();
    }

    public Holiday getHolidayById(Integer id) {
        return holidayRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Holiday not found with id: " + id));
    }

    public Holiday createHoliday(HolidayDto dto) {
        LocalDate holidayDate = validateAndParseDate(dto.getHolidayDate());
        
        if (holidayRepository.existsByHolidayDate(holidayDate)) {
            throw new RuntimeException("Holiday already exists for date: " + dto.getHolidayDate());
        }
        
        Holiday holiday = new Holiday();
        holiday.setHolidayDate(holidayDate);
        holiday.setHolidayName(dto.getHolidayName());
        
        return holidayRepository.save(holiday);
    }

    public List<Holiday> createMultipleHolidays(List<HolidayDto> dtos) {
        List<Holiday> holidaysToSave = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        
        // Validate All holidays and collect All errors
        for (HolidayDto dto : dtos) {
            try {
                LocalDate holidayDate = validateAndParseDate(dto.getHolidayDate());
                
                // Check if holiday already exists
                if (holidayRepository.existsByHolidayDate(holidayDate)) {
                    errors.add("Holiday already exists for date: " + dto.getHolidayDate());
                    continue;
                }
                
                Holiday holiday = new Holiday();
                holiday.setHolidayDate(holidayDate);
                holiday.setHolidayName(dto.getHolidayName());
                holidaysToSave.add(holiday);
                
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
        
        Holiday existing = holidayRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Holiday not found with id: " + id));
        
        if (!existing.getHolidayDate().equals(holidayDate) && 
            holidayRepository.existsByHolidayDate(holidayDate)) {
            throw new RuntimeException("Holiday already exists for date: " + dto.getHolidayDate());
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

    private LocalDate validateAndParseDate(String dateStr) {
        try {
            return LocalDate.parse(dateStr.trim(), DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Invalid date format. Please use yyyy-MM-dd format (e.g., 2026-12-25)");
        }
    }
}
