package com.dat_management.backend.service;

import com.dat_management.backend.dto.AuditLogDto.AuditLogRequestDTO;
import com.dat_management.backend.dto.AuditLogDto.AuditLogResponseDTO;
import com.dat_management.backend.entity.AuditLog;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.AuditLogRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final EmployeeRepository employeeRepository;

    // ==================== INTERNAL HELPER — call this from other controllers ====================

    public void log(String action, String module, String description,
                     Object oldValue, Object newValue, HttpServletRequest request) {
        log(currentEmployeeId(), action, module, description, oldValue, newValue, request);
    }

    public void log(String employeeId, String action, String module, String description,
                     Object oldValue, Object newValue, HttpServletRequest request) {
        try {
            AuditLog entry = AuditLog.builder()
                    .employeeId(employeeId != null ? employeeId : "SYSTEM")
                    .action(action)
                    .module(module)
                    .description(description)
                    .oldValue(oldValue != null ? String.valueOf(oldValue) : null)
                    .newValue(newValue != null ? String.valueOf(newValue) : null)
                    .ipAddress(extractIp(request))
                    .createdAt(LocalDateTime.now())
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            System.err.println("⚠️ Failed to write audit log: " + e.getMessage());
        }
    }

    private String currentEmployeeId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return (auth != null && auth.getName() != null) ? auth.getName() : "SYSTEM";
        } catch (Exception e) {
            return "SYSTEM";
        }
    }

    // ==================== CRUD API ====================

    public AuditLogResponseDTO create(AuditLogRequestDTO dto, HttpServletRequest request) {
        AuditLog entry = AuditLog.builder()
                .employeeId(dto.getEmployeeId())
                .action(dto.getAction())
                .module(dto.getModule())
                .oldValue(dto.getOldValue())
                .newValue(dto.getNewValue())
                .description(dto.getDescription())
                .ipAddress(extractIp(request))
                .createdAt(LocalDateTime.now())
                .build();
        return toDTO(auditLogRepository.save(entry));
    }

    public AuditLogResponseDTO create(AuditLogRequestDTO dto) {
        AuditLog entry = AuditLog.builder()
                .employeeId(dto.getEmployeeId())
                .action(dto.getAction())
                .module(dto.getModule())
                .oldValue(dto.getOldValue())
                .newValue(dto.getNewValue())
                .description(dto.getDescription())
                .ipAddress(dto.getIpAddress())
                .createdAt(LocalDateTime.now())
                .build();
        return toDTO(auditLogRepository.save(entry));
    }

    public Page<AuditLogResponseDTO> getAll(String employeeId, String module, String action,
                                             LocalDateTime from, LocalDateTime to, Pageable pageable) {
        Specification<AuditLog> spec = buildSpecification(employeeId, module, action, from, to);
        return auditLogRepository.findAll(spec, pageable).map(this::toDTO);
    }

    public AuditLogResponseDTO getById(Integer id) {
        AuditLog entry = auditLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Audit log not found with id: " + id));
        return toDTO(entry);
    }

    public AuditLogResponseDTO update(Integer id, AuditLogRequestDTO dto) {
    AuditLog entry = auditLogRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Audit log not found with id: " + id));

    String beforeSnapshot = snapshot(entry);

    entry.setEmployeeId(dto.getEmployeeId());
    entry.setAction(dto.getAction());
    entry.setModule(dto.getModule());
    entry.setDescription(dto.getDescription());
    if (dto.getIpAddress() != null) {
        entry.setIpAddress(dto.getIpAddress());
    }

    String afterSnapshot = snapshot(entry);

    entry.setOldValue(beforeSnapshot);
    entry.setNewValue(afterSnapshot);

    return toDTO(auditLogRepository.save(entry));
}

private String snapshot(AuditLog entry) {
    return String.format(
            "{employeeId=%s, action=%s, module=%s, description=%s, ipAddress=%s}",
            entry.getEmployeeId(), entry.getAction(), entry.getModule(),
            entry.getDescription(), entry.getIpAddress());
}

    public void delete(Integer id) {
        if (!auditLogRepository.existsById(id)) {
            throw new RuntimeException("Audit log not found with id: " + id);
        }
        auditLogRepository.deleteById(id);
    }

    public Map<String, Object> deleteBulk(List<Integer> ids) {
        List<Integer> deleted = new ArrayList<>();
        List<Integer> failed = new ArrayList<>();
        for (Integer id : ids) {
            if (auditLogRepository.existsById(id)) {
                auditLogRepository.deleteById(id);
                deleted.add(id);
            } else {
                failed.add(id);
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("deletedIds", deleted);
        result.put("failedIds", failed);
        result.put("totalDeleted", deleted.size());
        result.put("totalFailed", failed.size());
        return result;
    }

    private Specification<AuditLog> buildSpecification(String employeeId, String module, String action,
                                                         LocalDateTime from, LocalDateTime to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (employeeId != null && !employeeId.isBlank()) {
                predicates.add(cb.equal(root.get("employeeId"), employeeId));
            }
            if (module != null && !module.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("module")), module.toUpperCase()));
            }
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("action")), action.toUpperCase()));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String extractIp(HttpServletRequest request) {
        if (request == null) return null;
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private AuditLogResponseDTO toDTO(AuditLog entry) {
        String employeeName = null;
        String employeeRole = null;

        if (entry.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(entry.getEmployeeId()).orElse(null);
            if (employee != null) {
                employeeName = employee.getName();
                if (employee.getRole() != null) {
                    employeeRole = employee.getRole().getRoleName();
                }
            }
        }

        return AuditLogResponseDTO.builder()
                .id(entry.getId())
                .employeeId(entry.getEmployeeId())
                .employeeName(employeeName)
                .employeeRole(employeeRole)
                .action(entry.getAction())
                .module(entry.getModule())
                .oldValue(entry.getOldValue())
                .newValue(entry.getNewValue())
                .description(entry.getDescription())
                .ipAddress(entry.getIpAddress())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}