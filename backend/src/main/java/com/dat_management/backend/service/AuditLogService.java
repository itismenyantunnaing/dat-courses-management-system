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
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
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
                    .oldValue(toJson(oldValue))
                    .newValue(toJson(newValue))
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
            if (auth == null || !auth.isAuthenticated()
                    || auth instanceof AnonymousAuthenticationToken
                    || "anonymousUser".equals(auth.getName())) {
                return "SYSTEM";
            }
            return auth.getName();
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
                .oldValue(toJson(dto.getOldValue()))
                .newValue(toJson(dto.getNewValue()))
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
                .oldValue(toJson(dto.getOldValue()))
                .newValue(toJson(dto.getNewValue()))
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

        // Store the current state as old value
        String beforeSnapshot = toJson(entry);
        
        // Update the entry with new values
        entry.setEmployeeId(dto.getEmployeeId());
        entry.setAction(dto.getAction());
        entry.setModule(dto.getModule());
        entry.setDescription(dto.getDescription());
        if (dto.getIpAddress() != null) {
            entry.setIpAddress(dto.getIpAddress());
        }

        // Store the new state as new value
        String afterSnapshot = toJson(entry);

        entry.setOldValue(beforeSnapshot);
        entry.setNewValue(afterSnapshot);

        return toDTO(auditLogRepository.save(entry));
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

    // ==================== JSON Serialization Methods ====================

    /**
     * Convert any object to JSON string without external libraries
     */
    private String toJson(Object value) {
        if (value == null) {
            return "null";
        }

        // Handle String
        if (value instanceof String) {
            return "\"" + escapeJson((String) value) + "\"";
        }

        // Handle primitive wrappers
        if (value instanceof Number || value instanceof Boolean) {
            return String.valueOf(value);
        }

        // Handle Enum
        if (value instanceof Enum<?>) {
            return "\"" + escapeJson(((Enum<?>) value).name()) + "\"";
        }

        // Handle Map
        if (value instanceof Map) {
            return mapToJson((Map<?, ?>) value);
        }

        // Handle List
        if (value instanceof List) {
            return listToJson((List<?>) value);
        }

        // Handle Array
        if (value.getClass().isArray()) {
            return arrayToJson(value);
        }

        // Handle LocalDateTime and other date types
        if (value instanceof LocalDateTime) {
            return "\"" + escapeJson(((LocalDateTime) value).toString()) + "\"";
        }

        // For other objects, use reflection to create JSON
        try {
            return objectToJson(value);
        } catch (Exception e) {
            // Fallback to toString with escaping
            return "\"" + escapeJson(value.toString()) + "\"";
        }
    }

    /**
     * Convert Map to JSON
     */
    private String mapToJson(Map<?, ?> map) {
        if (map == null) {
            return "null";
        }

        StringBuilder json = new StringBuilder("{");
        int count = 0;
        for (Map.Entry<?, ?> entry : map.entrySet()) {
            if (count > 0) {
                json.append(",");
            }
            String key = entry.getKey() != null ? escapeJson(entry.getKey().toString()) : "null";
            json.append("\"").append(key).append("\":").append(toJson(entry.getValue()));
            count++;
        }
        json.append("}");
        return json.toString();
    }

    /**
     * Convert List to JSON
     */
    private String listToJson(List<?> list) {
        if (list == null) {
            return "null";
        }

        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) {
                json.append(",");
            }
            json.append(toJson(list.get(i)));
        }
        json.append("]");
        return json.toString();
    }

    /**
     * Convert Array to JSON
     */
    private String arrayToJson(Object array) {
        if (array == null) {
            return "null";
        }

        int length = java.lang.reflect.Array.getLength(array);
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < length; i++) {
            if (i > 0) {
                json.append(",");
            }
            Object element = java.lang.reflect.Array.get(array, i);
            json.append(toJson(element));
        }
        json.append("]");
        return json.toString();
    }

    /**
     * Convert any object to JSON using reflection
     */
    private String objectToJson(Object obj) throws IllegalAccessException {
        if (obj == null) {
            return "null";
        }

        Class<?> clazz = obj.getClass();
        Field[] fields = clazz.getDeclaredFields();

        StringBuilder json = new StringBuilder("{");
        int count = 0;

        for (Field field : fields) {
            // Skip synthetic and static fields
            if (field.isSynthetic() || Modifier.isStatic(field.getModifiers())) {
                continue;
            }

            field.setAccessible(true);
            Object value = field.get(obj);

            if (count > 0) {
                json.append(",");
            }

            String fieldName = escapeJson(field.getName());
            json.append("\"").append(fieldName).append("\":").append(toJson(value));
            count++;
        }

        json.append("}");
        return json.toString();
    }

    /**
     * Escape special characters for JSON
     */
    private String escapeJson(String input) {
        if (input == null) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        for (char c : input.toCharArray()) {
            switch (c) {
                case '"':
                    sb.append("\\\"");
                    break;
                case '\\':
                    sb.append("\\\\");
                    break;
                case '/':
                    sb.append("\\/");
                    break;
                case '\b':
                    sb.append("\\b");
                    break;
                case '\f':
                    sb.append("\\f");
                    break;
                case '\n':
                    sb.append("\\n");
                    break;
                case '\r':
                    sb.append("\\r");
                    break;
                case '\t':
                    sb.append("\\t");
                    break;
                default:
                    // Handle other control characters
                    if (c < 32 || c == 127) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                    break;
            }
        }
        return sb.toString();
    }
}