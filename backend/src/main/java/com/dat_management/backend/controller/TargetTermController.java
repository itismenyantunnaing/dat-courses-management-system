package com.dat_management.backend.controller;

import com.dat_management.backend.dto.TargetTermRequest;
import com.dat_management.backend.dto.TargetTermResponse;
import com.dat_management.backend.service.TargetTermService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/target-terms")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class TargetTermController {

    private final TargetTermService targetTermService;

    @GetMapping
    public List<TargetTermResponse> getAll() {
        return targetTermService.getAll();
    }
 
    @GetMapping("/active")
    public List<TargetTermResponse> getActiveTerms() {
        return targetTermService.getActiveTerms();
    }

    @GetMapping("/{id}")
    public TargetTermResponse getById(@PathVariable Integer id) {
        return targetTermService.getById(id);
    }

    @PostMapping
    public ResponseEntity<TargetTermResponse> create(@RequestBody TargetTermRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(targetTermService.create(request));
    }

    @PutMapping("/{id}")
    public TargetTermResponse update(
            @PathVariable Integer id,
            @RequestBody TargetTermRequest request
    ) {
        return targetTermService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        targetTermService.delete(id);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteList(@RequestBody List<Integer> ids) {
        targetTermService.deleteList(ids);
    }
}