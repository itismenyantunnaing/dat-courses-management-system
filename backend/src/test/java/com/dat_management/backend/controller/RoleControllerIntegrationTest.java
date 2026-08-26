package com.dat_management.backend.controller;

import com.dat_management.backend.entity.Role;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RoleController is a single pass-through GET endpoint with no service
 * layer and had zero coverage. Small controller, small test file.
 *
 * NOTE: data.sql seeds 5 roles (Admin, Approver, Division_Head,
 * Department_Head, Learner) plus an EMP001 employee referencing one of
 * them, all at context startup (outside any test's transaction, so it
 * survives every test's rollback). Employees must be cleared before roles
 * here, or deleting the seeded roles trips the role_id foreign key on that
 * seeded employee row.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RoleControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @BeforeEach
    void setUp() {
        employeeRepository.deleteAll();
        roleRepository.deleteAll();
    }

    @Test
    @DisplayName("TC_ROLE_INT_001 | GET all roles -> 200 empty array when none exist")
    void getAllRoles_noRoles_returnsEmptyArray() throws Exception {
        mockMvc.perform(get("/api/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("TC_ROLE_INT_002 | GET all roles -> 200 with every persisted role")
    void getAllRoles_multipleRoles_returnsAll() throws Exception {
        roleRepository.save(role("admin"));
        roleRepository.save(role("staff"));
        roleRepository.save(role("PMO"));

        mockMvc.perform(get("/api/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[*].roleName", containsInAnyOrder("admin", "staff", "PMO")));
    }

    private static Role role(String roleName) {
        Role role = new Role();
        role.setRoleName(roleName);
        return role;
    }
}