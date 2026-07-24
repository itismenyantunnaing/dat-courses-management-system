package com.dat_management.backend.controller;

import com.dat_management.backend.dto.AuditLogDto.AuditLogRequestDTO;
import com.dat_management.backend.dto.AuditLogDto.AuditLogResponseDTO;
import com.dat_management.backend.service.AuditLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuditLogController {

    private final AuditLogService auditLogService;
    private final HttpServletRequest httpServletRequest;

    @GetMapping
    public ResponseEntity<Page<AuditLogResponseDTO>> getAll(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(auditLogService.getAll(employeeId, module, action, from, to, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        return handle(() -> ResponseEntity.ok(auditLogService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody AuditLogRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auditLogService.create(dto, httpServletRequest));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @Valid @RequestBody AuditLogRequestDTO dto) {
        return handle(() -> ResponseEntity.ok(auditLogService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        return handle(() -> {
            auditLogService.delete(id);
            return ResponseEntity.noContent().build();
        });
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> deleteBulk(@RequestBody List<Integer> ids) {
        return ResponseEntity.ok(auditLogService.deleteBulk(ids));
    }

    private ResponseEntity<?> handle(ResponseSupplier supplier) {
        try {
            return supplier.get();
        } catch (RuntimeException e) {
            HttpStatus status = e.getMessage() != null && e.getMessage().contains("not found")
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @FunctionalInterface
    private interface ResponseSupplier {
        ResponseEntity<?> get();
    }
}