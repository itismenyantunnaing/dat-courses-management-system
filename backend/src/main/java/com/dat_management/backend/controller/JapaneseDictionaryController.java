package com.dat_management.backend.controller;

import com.dat_management.backend.entity.JapaneseDictionary;
import com.dat_management.backend.service.JapaneseDictionaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/japanese_dictionary")
public class JapaneseDictionaryController {

    private final JapaneseDictionaryService japaneseDictionaryService;

    // GET ALL
    @GetMapping
    public ResponseEntity<List<JapaneseDictionary>> getAllEntries() {
        try {
            List<JapaneseDictionary> entries = japaneseDictionaryService.getAll();
            return ResponseEntity.ok(entries);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // CREATE
    @PostMapping
    public ResponseEntity<Map<String, Object>> createEntry(@RequestBody JapaneseDictionary entry) {
        try {
            JapaneseDictionary createdEntry = japaneseDictionaryService.createEntry(entry);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Entry created successfully");
            response.put("data", createdEntry);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());

            if (e.getMessage().contains("already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
            }
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "An error occurred while creating the entry");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateEntry(
            @PathVariable Integer id,
            @RequestBody JapaneseDictionary entryDetails) {
        try {
            JapaneseDictionary updatedEntry = japaneseDictionaryService.updateEntry(id, entryDetails);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Entry updated successfully");
            response.put("data", updatedEntry);
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
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "An error occurred while updating the entry");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // DELETE SINGLE
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteEntry(@PathVariable Integer id) {
        try {
            if (japaneseDictionaryService.entryExists(id)) {
                japaneseDictionaryService.deleteEntry(id);
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Entry deleted successfully");
                return ResponseEntity.ok(response);
            }
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Entry not found with id: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "An error occurred while deleting the entry");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}