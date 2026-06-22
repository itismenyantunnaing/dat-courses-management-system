package com.dat_management.backend.controller;

import com.dat_management.backend.dto.HolidayDto;
import com.dat_management.backend.entity.Holiday;
import com.dat_management.backend.service.HolidayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/holidays")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HolidayController {

    private final HolidayService holidayService;

    // Get All Holidays
    @GetMapping
    public ResponseEntity<List<Holiday>> getAllHolidays() {
        List<Holiday> holidays = holidayService.getAllHolidays();
        return ResponseEntity.ok(holidays);
    }

    // Get Holiday by id
    @GetMapping("/{id}")
    public ResponseEntity<?> getHolidayById(@PathVariable Integer id) {
        try {
            Holiday holiday = holidayService.getHolidayById(id);
            return ResponseEntity.ok(holiday);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    // Create Single Holiday
    @PostMapping
    public ResponseEntity<Map<String, Object>> createHoliday(@Valid @RequestBody HolidayDto dto) {
        try {
            holidayService.createHoliday(dto);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Holiday created successfully");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }
    }

    @PostMapping("/list")
    public ResponseEntity<Map<String, Object>> createMultipleHolidays(@Valid @RequestBody List<HolidayDto> dtos) {
        try {
            holidayService.createMultipleHolidays(dtos);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Holidays created successfully");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }
    }

    // Update Holiday By Id
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateHoliday(
            @PathVariable Integer id,
            @Valid @RequestBody HolidayDto dto) {
        try {
            holidayService.updateHoliday(id, dto);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Holiday updated successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());

            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            } else if (e.getMessage().contains("already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
            }
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Delete Holiday By Id
    @DeleteMapping("/{ids}")
    public ResponseEntity<Map<String, Object>> deleteHoliday(@PathVariable List<Integer> ids) {
        List<Integer> successfullyDeleted = new ArrayList<>();
        List<Integer> failedDeletions = new ArrayList<>();
        Map<Integer, String> errors = new HashMap<>();

        for (Integer id : ids) {
            try {
                holidayService.softDeleteHoliday(id);
                successfullyDeleted.add(id);
            } catch (RuntimeException e) {
                failedDeletions.add(id);
                errors.put(id, e.getMessage());
            }
        }

        Map<String, Object> response = new HashMap<>();

        if (failedDeletions.isEmpty()) {
            response.put("success", true);
            response.put("message", "All holidays deleted successfully");
            response.put("deletedIds", successfullyDeleted);
            return ResponseEntity.ok(response);
        } else if (successfullyDeleted.isEmpty()) {
            response.put("success", false);
            response.put("message", "Failed to delete any holidays");
            response.put("errors", errors);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } else {
            response.put("success", true);
            response.put("message", "Some holidays deleted successfully, some failed");
            response.put("deletedIds", successfullyDeleted);
            response.put("failedIds", failedDeletions);
            response.put("errors", errors);
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).body(response);
        }
    }
}
