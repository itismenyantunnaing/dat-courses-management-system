package com.dat_management.backend.controller;

import com.dat_management.backend.dto.AuditLogDto.AuditLogRequestDTO;
import com.dat_management.backend.entity.AuditLog;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.Role;
import com.dat_management.backend.repository.AuditLogRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.RoleRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers /api/audit-logs: filtering/pagination on GET, the request-derived
 * (not body-derived) IP address capture on create, the before/after JSON
 * snapshot behaviour on update, and single/bulk delete.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuditLogControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private RoleRepository roleRepository;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
        employeeRepository.deleteAll();
        roleRepository.deleteAll();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private Role insertRole(String name) {
        Role role = new Role();
        role.setRoleName(name);
        return roleRepository.save(role);
    }

    private Employee insertEmployee(String id, String name, Role role) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(name);
        employee.setEmail(id.toLowerCase() + "@dat.com");
        employee.setPassword("encoded-password");
        employee.setDoorlog("door-" + id);
        employee.setPosition("Engineer");
        employee.setEmpStatus("active");
        employee.setStatus("default");
        employee.setIsCorePersonnel(false);
        employee.setHasJapanBusinessTrip(false);
        employee.setNotiSetting(false);
        employee.setIsDeleted(false);
        employee.setRole(role);
        return employeeRepository.save(employee);
    }

    private AuditLog insertLog(String employeeId, String action, String module,
                               String ipAddress, LocalDateTime createdAt) {
        AuditLog log = AuditLog.builder()
                .employeeId(employeeId)
                .action(action)
                .module(module)
                .description("desc for " + action)
                .oldValue("null")
                .newValue("null")
                .ipAddress(ipAddress)
                .createdAt(createdAt)
                .build();
        return auditLogRepository.save(log);
    }

    private static AuditLogRequestDTO buildDto(String employeeId, String action, String module) {
        return AuditLogRequestDTO.builder()
                .employeeId(employeeId)
                .action(action)
                .module(module)
                .description("test description")
                .build();
    }

    // ── GET /api/audit-logs (list + filters + pagination) ───────────────────

    @Test
    @DisplayName("TC_AUDIT_GETALL_01 | GET all -> 200, newest first, enriched with employee name/role")
    void getAll_noFilters_returnsPageEnrichedAndSortedNewestFirst() throws Exception {
        Role role = insertRole("Admin");
        insertEmployee("EMP001", "Alice Admin", role);
        insertLog("EMP001", "CREATE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 1, 10, 0));
        insertLog("EMP001", "UPDATE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 2, 10, 0));

        mockMvc.perform(get("/api/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].action").value("UPDATE"))
                .andExpect(jsonPath("$.content[0].employeeName").value("Alice Admin"))
                .andExpect(jsonPath("$.content[0].employeeRole").value("Admin"))
                .andExpect(jsonPath("$.content[1].action").value("CREATE"))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @DisplayName("TC_AUDIT_GETALL_02 | GET filtered by employeeId -> only that employee's entries")
    void getAll_filterByEmployeeId_returnsOnlyMatching() throws Exception {
        insertLog("EMP001", "CREATE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 1, 10, 0));
        insertLog("EMP002", "CREATE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 1, 11, 0));

        mockMvc.perform(get("/api/audit-logs").param("employeeId", "EMP002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].employeeId").value("EMP002"));
    }

    @Test
    @DisplayName("TC_AUDIT_GETALL_03 | GET filtered by module -> case-insensitive match")
    void getAll_filterByModule_isCaseInsensitive() throws Exception {
        insertLog("EMP001", "CREATE", "Course", "127.0.0.1", LocalDateTime.of(2025, 6, 1, 10, 0));
        insertLog("EMP001", "CREATE", "Holiday", "127.0.0.1", LocalDateTime.of(2025, 6, 1, 11, 0));

        mockMvc.perform(get("/api/audit-logs").param("module", "course"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].module").value("Course"));
    }

    @Test
    @DisplayName("TC_AUDIT_GETALL_04 | GET filtered by action -> case-insensitive match")
    void getAll_filterByAction_isCaseInsensitive() throws Exception {
        insertLog("EMP001", "Delete", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 1, 10, 0));
        insertLog("EMP001", "Create", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 1, 11, 0));

        mockMvc.perform(get("/api/audit-logs").param("action", "DELETE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].action").value("Delete"));
    }

    @Test
    @DisplayName("TC_AUDIT_GETALL_05 | GET filtered by from/to date range -> excludes out-of-range entries")
    void getAll_filterByDateRange_excludesOutOfRange() throws Exception {
        insertLog("EMP001", "CREATE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 5, 1, 10, 0));  // before range
        insertLog("EMP001", "UPDATE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 15, 10, 0)); // in range
        insertLog("EMP001", "DELETE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 7, 1, 10, 0));  // after range

        mockMvc.perform(get("/api/audit-logs")
                        .param("from", "2025-06-01T00:00:00")
                        .param("to", "2025-06-30T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].action").value("UPDATE"));
    }

    @Test
    @DisplayName("TC_AUDIT_GETALL_06 | GET with page size 1 -> returns 1 item but reports full totals")
    void getAll_withPageSize_paginatesCorrectly() throws Exception {
        insertLog("EMP001", "CREATE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 1, 10, 0));
        insertLog("EMP001", "UPDATE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 2, 10, 0));
        insertLog("EMP001", "DELETE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 3, 10, 0));

        mockMvc.perform(get("/api/audit-logs")
                        .param("page", "0")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].action").value("DELETE")) // newest first
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(3));
    }

    // ── GET /api/audit-logs/{id} ─────────────────────────────────────────────

    @Test
    @DisplayName("TC_AUDIT_GET_01 | GET by valid id -> 200 with enriched employee info")
    void getById_validId_returnsEnrichedEntry() throws Exception {
        Role role = insertRole("PM");
        insertEmployee("EMP001", "Alice Admin", role);
        AuditLog saved = insertLog("EMP001", "CREATE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 1, 10, 0));

        mockMvc.perform(get("/api/audit-logs/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.employeeName").value("Alice Admin"))
                .andExpect(jsonPath("$.employeeRole").value("PM"));
    }

    @Test
    @DisplayName("TC_AUDIT_GET_02 | GET by id referencing a deleted/unknown employee -> 200, employee fields null")
    void getById_employeeNoLongerExists_returnsNullEmployeeFields() throws Exception {
        AuditLog saved = insertLog("GHOST001", "CREATE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 1, 10, 0));

        mockMvc.perform(get("/api/audit-logs/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.employeeId").value("GHOST001"))
                .andExpect(jsonPath("$.employeeName").doesNotExist())
                .andExpect(jsonPath("$.employeeRole").doesNotExist());
    }

    @Test
    @DisplayName("TC_AUDIT_GET_03 | GET by non-existent id -> 404 with error message")
    void getById_nonExistentId_returns404() throws Exception {
        mockMvc.perform(get("/api/audit-logs/{id}", 99999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("not found")));
    }

    // ── POST /api/audit-logs ──────────────────────────────────────────────

    @Test
    @DisplayName("TC_AUDIT_CREATE_01 | POST valid entry -> 201, ipAddress captured from the request, not the body")
    void create_validRequest_capturesIpFromRequestNotBody() throws Exception {
        AuditLogRequestDTO dto = buildDto("EMP001", "LOGIN", "AUTH");
        dto.setIpAddress("1.2.3.4"); // should be ignored: controller always derives IP from the servlet request

        mockMvc.perform(post("/api/audit-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employeeId").value("EMP001"))
                .andExpect(jsonPath("$.action").value("LOGIN"))
                .andExpect(jsonPath("$.ipAddress").value("127.0.0.1"));

        Assertions.assertEquals(1, auditLogRepository.count());
    }

    @Test
    @DisplayName("TC_AUDIT_CREATE_02 | POST honors X-Forwarded-For header over the socket address")
    void create_withForwardedForHeader_usesFirstForwardedIp() throws Exception {
        AuditLogRequestDTO dto = buildDto("EMP001", "LOGIN", "AUTH");

        mockMvc.perform(post("/api/audit-logs")
                        .header("X-Forwarded-For", "203.0.113.5, 70.41.3.18")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ipAddress").value("203.0.113.5"));
    }

    @Test
    @DisplayName("TC_AUDIT_CREATE_03 | POST missing required field (blank action) -> 400 Bad Request")
    void create_blankAction_returns400() throws Exception {
        AuditLogRequestDTO dto = buildDto("EMP001", "", "AUTH");

        mockMvc.perform(post("/api/audit-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());

        Assertions.assertEquals(0, auditLogRepository.count());
    }

    // ── PUT /api/audit-logs/{id} ──────────────────────────────────────────

    @Test
    @DisplayName("TC_AUDIT_UPDATE_01 | PUT valid update -> 200, persists new fields and snapshots old/new state")
    void update_validRequest_persistsChangesAndSnapshots() throws Exception {
        AuditLog saved = insertLog("EMP001", "CREATE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 1, 10, 0));
        AuditLogRequestDTO update = buildDto("EMP002", "UPDATE", "HOLIDAY");

        mockMvc.perform(put("/api/audit-logs/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.employeeId").value("EMP002"))
                .andExpect(jsonPath("$.action").value("UPDATE"))
                .andExpect(jsonPath("$.module").value("HOLIDAY"))
                .andExpect(jsonPath("$.oldValue").value(containsString("EMP001")))
                .andExpect(jsonPath("$.newValue").value(containsString("EMP002")));

        AuditLog updated = auditLogRepository.findById(saved.getId()).orElseThrow();
        Assertions.assertEquals("EMP002", updated.getEmployeeId());
        Assertions.assertEquals("UPDATE", updated.getAction());
    }

    @Test
    @DisplayName("TC_AUDIT_UPDATE_02 | PUT without ipAddress in body -> existing ipAddress is preserved")
    void update_ipAddressOmitted_preservesExistingIp() throws Exception {
        AuditLog saved = insertLog("EMP001", "CREATE", "COURSE", "9.9.9.9", LocalDateTime.of(2025, 6, 1, 10, 0));
        AuditLogRequestDTO update = buildDto("EMP001", "UPDATE", "COURSE"); // ipAddress left null

        mockMvc.perform(put("/api/audit-logs/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ipAddress").value("9.9.9.9"));
    }

    @Test
    @DisplayName("TC_AUDIT_UPDATE_03 | PUT with ipAddress in body -> ipAddress is overwritten")
    void update_ipAddressProvided_overwritesExistingIp() throws Exception {
        AuditLog saved = insertLog("EMP001", "CREATE", "COURSE", "9.9.9.9", LocalDateTime.of(2025, 6, 1, 10, 0));
        AuditLogRequestDTO update = buildDto("EMP001", "UPDATE", "COURSE");
        update.setIpAddress("8.8.8.8");

        mockMvc.perform(put("/api/audit-logs/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ipAddress").value("8.8.8.8"));
    }

    @Test
    @DisplayName("TC_AUDIT_UPDATE_04 | PUT non-existent id -> 404 Not Found")
    void update_nonExistentId_returns404() throws Exception {
        AuditLogRequestDTO update = buildDto("EMP001", "UPDATE", "COURSE");

        mockMvc.perform(put("/api/audit-logs/{id}", 99999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("not found")));
    }

    @Test
    @DisplayName("TC_AUDIT_UPDATE_05 | PUT missing required field (blank module) -> 400 Bad Request")
    void update_blankModule_returns400() throws Exception {
        AuditLog saved = insertLog("EMP001", "CREATE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 1, 10, 0));
        AuditLogRequestDTO update = buildDto("EMP001", "UPDATE", "");

        mockMvc.perform(put("/api/audit-logs/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest());
    }

    // ── DELETE /api/audit-logs/{id} ───────────────────────────────────────

    @Test
    @DisplayName("TC_AUDIT_DELETE_01 | DELETE existing id -> 204 No Content, row removed")
    void delete_validId_returns204AndRemovesRow() throws Exception {
        AuditLog saved = insertLog("EMP001", "CREATE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 1, 10, 0));

        mockMvc.perform(delete("/api/audit-logs/{id}", saved.getId()))
                .andExpect(status().isNoContent());

        Assertions.assertTrue(auditLogRepository.findById(saved.getId()).isEmpty());
    }

    @Test
    @DisplayName("TC_AUDIT_DELETE_02 | DELETE non-existent id -> 404 Not Found")
    void delete_nonExistentId_returns404() throws Exception {
        mockMvc.perform(delete("/api/audit-logs/{id}", 99999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("not found")));
    }

    // ── DELETE /api/audit-logs (bulk) ─────────────────────────────────────

    @Test
    @DisplayName("TC_AUDIT_DELETE_BULK_01 | DELETE bulk with mixed valid/invalid ids -> 200 with per-id results")
    void deleteBulk_mixedIds_returns200WithDeletedAndFailedIds() throws Exception {
        AuditLog saved = insertLog("EMP001", "CREATE", "COURSE", "127.0.0.1", LocalDateTime.of(2025, 6, 1, 10, 0));

        mockMvc.perform(delete("/api/audit-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(saved.getId(), 99999))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deletedIds", hasSize(1)))
                .andExpect(jsonPath("$.deletedIds[0]").value(saved.getId()))
                .andExpect(jsonPath("$.failedIds", hasSize(1)))
                .andExpect(jsonPath("$.failedIds[0]").value(99999))
                .andExpect(jsonPath("$.totalDeleted").value(1))
                .andExpect(jsonPath("$.totalFailed").value(1));

        Assertions.assertTrue(auditLogRepository.findById(saved.getId()).isEmpty());
    }

    @Test
    @DisplayName("TC_AUDIT_DELETE_BULK_02 | DELETE bulk with empty list -> 200, nothing deleted or failed")
    void deleteBulk_emptyList_returns200WithZeroTotals() throws Exception {
        mockMvc.perform(delete("/api/audit-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deletedIds", hasSize(0)))
                .andExpect(jsonPath("$.failedIds", hasSize(0)))
                .andExpect(jsonPath("$.totalDeleted").value(0))
                .andExpect(jsonPath("$.totalFailed").value(0));
    }
}