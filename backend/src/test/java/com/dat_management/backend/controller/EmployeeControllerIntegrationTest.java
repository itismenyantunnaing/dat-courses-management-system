package com.dat_management.backend.controller;

import com.dat_management.backend.repository.DepartmentDatRepository;
import com.dat_management.backend.repository.DivisionRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.RoleRepository;
import com.dat_management.backend.repository.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EmployeeControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private DepartmentDatRepository departmentDatRepository;

    @Autowired
    private DivisionRepository divisionRepository;

    @BeforeEach
    void cleanDatabase() {
        employeeRepository.deleteAll();
        teamRepository.deleteAll();
        departmentDatRepository.deleteAll();
        divisionRepository.deleteAll();
        roleRepository.deleteAll();
    }

    @Test
    @DisplayName("TC_EMP_INT_001 | POST valid employee -> 201 Created")
    void createEmployee_validRequest_returns201AndPersistsEmployee() throws Exception {
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(employeeJson("EMP001", "Alice Admin", "active", "Admin")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("EMP001"))
                .andExpect(jsonPath("$.name").value("Alice Admin"))
                .andExpect(jsonPath("$.emp_status").value("active"))
                .andExpect(jsonPath("$.div_name").value("Digital"))
                .andExpect(jsonPath("$.dept_dat").value("Platform"))
                .andExpect(jsonPath("$.team").value("Core"))
                .andExpect(jsonPath("$.role").value("Admin"));

        org.junit.jupiter.api.Assertions.assertTrue(employeeRepository.existsByIdAndIsDeletedFalse("EMP001"));
    }

    @Test
    @DisplayName("TC_EMP_INT_002 | POST missing Staff ID -> 400 Bad Request")
    void createEmployee_missingStaffId_returns400() throws Exception {
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Missing Id",
                                  "email": "missing.id@dat.com"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC_EMP_INT_003 | GET all employees -> 200 with active non-deleted list")
    void getAllEmployees_returns200AndList() throws Exception {
        createEmployee("EMP001", "Alice Admin", "active", "Admin");
        createEmployee("EMP002", "Bob Staff", "inactive", "Staff");

        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].name").exists());
    }

    @Test
    @DisplayName("TC_EMP_INT_004 | GET employee by ID -> 200 with matching employee")
    void getEmployeeById_validId_returns200() throws Exception {
        createEmployee("EMP001", "Alice Admin", "active", "Admin");

        mockMvc.perform(get("/api/employees/{id}", "EMP001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("EMP001"))
                .andExpect(jsonPath("$.name").value("Alice Admin"));
    }

    @Test
    @DisplayName("TC_EMP_INT_005 | GET employees by name filter -> 200 with matching employees")
    void searchEmployeesByName_returnsMatchingEmployees() throws Exception {
        createEmployee("EMP001", "Alice Admin", "active", "Admin");
        createEmployee("EMP002", "Bob Staff", "active", "Staff");

        mockMvc.perform(get("/api/employees").param("name", "Alice"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value("EMP001"));
    }

    @Test
    @DisplayName("TC_EMP_INT_006 | GET employees by status filter -> 200 with matching employees")
    void filterEmployeesByStatus_returnsMatchingEmployees() throws Exception {
        createEmployee("EMP001", "Alice Admin", "active", "Admin");
        createEmployee("EMP002", "Bob Staff", "inactive", "Staff");

        mockMvc.perform(get("/api/employees").param("status", "inactive"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value("EMP002"))
                .andExpect(jsonPath("$[0].emp_status").value("inactive"));
    }

    @Test
    @DisplayName("TC_EMP_INT_007 | PUT existing employee -> 200 with updated fields")
    void updateEmployee_validRequest_returns200AndUpdatedEmployee() throws Exception {
        createEmployee("EMP001", "Alice Admin", "active", "Admin");

        mockMvc.perform(put("/api/employees/{id}", "EMP001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(employeeJson("EMP001", "Alice Updated", "active", "PMO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("EMP001"))
                .andExpect(jsonPath("$.name").value("Alice Updated"))
                .andExpect(jsonPath("$.role").value("PMO"));
    }

    @Test
    @DisplayName("TC_EMP_INT_008 | PATCH resign employee -> 200 and inactive status")
    void resignEmployee_validId_returnsInactiveEmployee() throws Exception {
        createEmployee("EMP001", "Alice Admin", "active", "Admin");

        mockMvc.perform(patch("/api/employees/{id}/resign", "EMP001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("EMP001"))
                .andExpect(jsonPath("$.emp_status").value("inactive"));
    }

    @Test
    @DisplayName("TC_EMP_INT_009 | DELETE one existing employee -> 200 success response")
    void deleteEmployee_existingId_returnsSuccessResponse() throws Exception {
        createEmployee("EMP001", "Alice Admin", "active", "Admin");

        mockMvc.perform(delete("/api/employees/{ids}", "EMP001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.deletedIds[0]").value("EMP001"))
                .andExpect(jsonPath("$.totalDeleted").value(1));
    }

    @Test
    @DisplayName("TC_EMP_INT_010 | DELETE mixed existing/missing IDs -> 206 partial content")
    void deleteEmployee_mixedIds_returnsPartialContent() throws Exception {
        createEmployee("EMP001", "Alice Admin", "active", "Admin");

        mockMvc.perform(delete("/api/employees/{ids}", "EMP001,UNKNOWN"))
                .andExpect(status().isPartialContent())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.deletedIds[0]").value("EMP001"))
                .andExpect(jsonPath("$.failedIds[0]").value("UNKNOWN"))
                .andExpect(jsonPath("$.errors.UNKNOWN", containsString("Employee not found")));
    }

    @Test
    @DisplayName("TC_EMP_INT_011 | GET deleted employees after delete -> 200 with deleted list")
    void getDeletedEmployees_afterSoftDelete_returnsDeletedList() throws Exception {
        createEmployee("EMP001", "Alice Admin", "active", "Admin");
        mockMvc.perform(delete("/api/employees/{ids}", "EMP001"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/employees/deleted"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value("EMP001"));
    }

    @Test
    @DisplayName("TC_EMP_INT_012 | PATCH restore deleted employee -> 200 and employee returns to active list")
    void restoreEmployee_deletedId_returnsRestoredEmployee() throws Exception {
        createEmployee("EMP001", "Alice Admin", "active", "Admin");
        mockMvc.perform(delete("/api/employees/{ids}", "EMP001"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/employees/{id}/restore", "EMP001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("EMP001"));

        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value("EMP001"));
    }

    private void createEmployee(String id, String name, String empStatus, String role) throws Exception {
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(employeeJson(id, name, empStatus, role)))
                .andExpect(status().isCreated());
    }

    private static String employeeJson(String id, String name, String empStatus, String role) {
        String suffix = id.toLowerCase();
        return """
                {
                  "id": "%s",
                  "name": "%s",
                  "email": "%s@dat.com",
                  "doorlog": "door-%s",
                  "position": "Engineer",
                  "password": "Password1!",
                  "emp_status": "%s",
                  "status": "default",
                  "is_core_personnel": false,
                  "has_japan_business_trip": false,
                  "noti_setting": true,
                  "div_name": "Digital",
                  "dept_dat": "Platform",
                  "team": "Core",
                  "role": "%s",
                  "dob": "1990-01-01",
                  "profile_photo_path": "/profiles/%s.png"
                }
                """.formatted(id, name, suffix, id, empStatus, role, suffix);
    }
}
