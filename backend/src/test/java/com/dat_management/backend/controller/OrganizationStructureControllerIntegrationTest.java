package com.dat_management.backend.controller;

import com.dat_management.backend.dto.OrganizationDtos.DepartmentDatRequestDTO;
import com.dat_management.backend.dto.OrganizationDtos.DivisionRequestDTO;
import com.dat_management.backend.dto.OrganizationDtos.TeamRequestDTO;
import com.dat_management.backend.entity.DepartmentDat;
import com.dat_management.backend.entity.Division;
import com.dat_management.backend.entity.Team;
import com.dat_management.backend.repository.DepartmentDatRepository;
import com.dat_management.backend.repository.DivisionRepository;
import com.dat_management.backend.repository.TeamRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers /api/divisions, /api/departments-dat and /api/teams: soft-delete
 * (isDeleted flag, never a hard row removal), the revive-on-create behaviour
 * when a name matches a previously soft-deleted row, name uniqueness scoped
 * to the parent (division for departments, department for teams), and the
 * hierarchy listing endpoints. Full CRUD + uniqueness + revive is exercised
 * in depth once at the Division level; Department and Team repeat only the
 * behaviour that differs at their level (parent-scoped uniqueness, FK
 * validation, hierarchy children).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OrganizationStructureControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DivisionRepository divisionRepository;

    @Autowired
    private DepartmentDatRepository departmentDatRepository;

    @Autowired
    private TeamRepository teamRepository;

    @BeforeEach
    void setUp() {
        teamRepository.deleteAll();
        departmentDatRepository.deleteAll();
        divisionRepository.deleteAll();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private Division insertDivision(String name, boolean deleted) {
        Division division = new Division();
        division.setDivisionName(name);
        division.setIsDeleted(deleted);
        return divisionRepository.save(division);
    }

    private DepartmentDat insertDept(String name, Division division, boolean deleted) {
        DepartmentDat dept = new DepartmentDat();
        dept.setDeptName(name);
        dept.setDivision(division);
        dept.setIsDeleted(deleted);
        return departmentDatRepository.save(dept);
    }

    private Team insertTeam(String name, DepartmentDat dept, boolean deleted) {
        Team team = new Team();
        team.setTeamName(name);
        team.setDepartmentDat(dept);
        team.setIsDeleted(deleted);
        return teamRepository.save(team);
    }

    private String divisionJson(String name) throws Exception {
        return objectMapper.writeValueAsString(new DivisionRequestDTO(name));
    }

    private String deptJson(Integer divisionId, String name) throws Exception {
        return objectMapper.writeValueAsString(new DepartmentDatRequestDTO(divisionId, name));
    }

    private String teamJson(Integer departmentDatId, String name) throws Exception {
        return objectMapper.writeValueAsString(new TeamRequestDTO(departmentDatId, name));
    }

    // ══════════════════════════════ DIVISIONS ══════════════════════════════

    @Test
    @DisplayName("TC_ORG_DIV_GETALL_01 | GET all divisions on empty DB -> 200 empty list")
    void getAllDivisions_empty_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/divisions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("TC_ORG_DIV_GETALL_02 | GET all divisions -> excludes soft-deleted rows")
    void getAllDivisions_withSoftDeleted_excludesThem() throws Exception {
        insertDivision("Engineering", false);
        insertDivision("Legacy Division", true);

        mockMvc.perform(get("/api/divisions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].divisionName").value("Engineering"));
    }

    @Test
    @DisplayName("TC_ORG_DIV_GET_01 | GET division by valid id -> 200")
    void getDivisionById_validId_returns200() throws Exception {
        Division saved = insertDivision("Engineering", false);

        mockMvc.perform(get("/api/divisions/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.divisionName").value("Engineering"))
                .andExpect(jsonPath("$.isDeleted").value(false));
    }

    @Test
    @DisplayName("TC_ORG_DIV_GET_02 | GET division by id that never existed -> 404")
    void getDivisionById_neverExisted_returns404() throws Exception {
        mockMvc.perform(get("/api/divisions/{id}", 99999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("not found")));
    }

    @Test
    @DisplayName("TC_ORG_DIV_GET_03 | GET division by soft-deleted id -> 404 (treated as gone)")
    void getDivisionById_softDeletedId_returns404() throws Exception {
        Division deleted = insertDivision("Legacy Division", true);

        mockMvc.perform(get("/api/divisions/{id}", deleted.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TC_ORG_DIV_CREATE_01 | POST valid division -> 201, name trimmed")
    void createDivision_validRequest_returns201AndTrimsName() throws Exception {
        mockMvc.perform(post("/api/divisions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(divisionJson("  Engineering  ")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.divisionName").value("Engineering"))
                .andExpect(jsonPath("$.isDeleted").value(false));

        Assertions.assertEquals(1, divisionRepository.count());
    }

    @Test
    @DisplayName("TC_ORG_DIV_CREATE_02 | POST duplicate active name (case-insensitive) -> 400")
    void createDivision_duplicateActiveName_returns400() throws Exception {
        insertDivision("Engineering", false);

        mockMvc.perform(post("/api/divisions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(divisionJson("engineering")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("already exists")));

        Assertions.assertEquals(1, divisionRepository.count());
    }

    @Test
    @DisplayName("TC_ORG_DIV_CREATE_03 | POST name matching a soft-deleted division -> revives same row")
    void createDivision_nameMatchesSoftDeleted_revivesExistingRow() throws Exception {
        Division deleted = insertDivision("Engineering", true);

        mockMvc.perform(post("/api/divisions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(divisionJson("Engineering")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(deleted.getId()))
                .andExpect(jsonPath("$.isDeleted").value(false));

        Assertions.assertEquals(1, divisionRepository.count());
        Division revived = divisionRepository.findById(deleted.getId()).orElseThrow();
        Assertions.assertFalse(revived.getIsDeleted());
    }

    @Test
    @DisplayName("TC_ORG_DIV_CREATE_04 | POST blank divisionName -> 400 Bad Request")
    void createDivision_blankName_returns400() throws Exception {
        mockMvc.perform(post("/api/divisions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(divisionJson("")))
                .andExpect(status().isBadRequest());

        Assertions.assertEquals(0, divisionRepository.count());
    }

    @Test
    @DisplayName("TC_ORG_DIV_UPDATE_01 | PUT valid rename -> 200 and persists")
    void updateDivision_validRequest_returns200AndPersists() throws Exception {
        Division saved = insertDivision("Engineering", false);

        mockMvc.perform(put("/api/divisions/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(divisionJson("Platform Engineering")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.divisionName").value("Platform Engineering"));

        Division updated = divisionRepository.findById(saved.getId()).orElseThrow();
        Assertions.assertEquals("Platform Engineering", updated.getDivisionName());
    }

    @Test
    @DisplayName("TC_ORG_DIV_UPDATE_02 | PUT rename to a name owned by ANOTHER active division -> 400")
    void updateDivision_nameConflictWithAnotherDivision_returns400() throws Exception {
        insertDivision("Engineering", false);
        Division second = insertDivision("Sales", false);

        mockMvc.perform(put("/api/divisions/{id}", second.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(divisionJson("Engineering")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @DisplayName("TC_ORG_DIV_UPDATE_03 | PUT rename to own current name in different case -> 200 (no self-conflict)")
    void updateDivision_ownNameDifferentCase_returns200() throws Exception {
        Division saved = insertDivision("Engineering", false);

        mockMvc.perform(put("/api/divisions/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(divisionJson("ENGINEERING")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.divisionName").value("ENGINEERING"));
    }

    @Test
    @DisplayName("TC_ORG_DIV_UPDATE_04 | PUT non-existent id -> 404")
    void updateDivision_nonExistentId_returns404() throws Exception {
        mockMvc.perform(put("/api/divisions/{id}", 99999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(divisionJson("Engineering")))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TC_ORG_DIV_DELETE_01 | DELETE division -> 204, row soft-deleted (not removed)")
    void deleteDivision_validId_returns204AndSoftDeletes() throws Exception {
        Division saved = insertDivision("Engineering", false);

        mockMvc.perform(delete("/api/divisions/{id}", saved.getId()))
                .andExpect(status().isNoContent());

        Division stillInDb = divisionRepository.findById(saved.getId()).orElseThrow();
        Assertions.assertTrue(stillInDb.getIsDeleted());
    }

    @Test
    @DisplayName("TC_ORG_DIV_DELETE_02 | DELETE non-existent division -> 404")
    void deleteDivision_nonExistentId_returns404() throws Exception {
        mockMvc.perform(delete("/api/divisions/{id}", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TC_ORG_DIV_CHILDREN_01 | GET /divisions/{id}/departments-dat -> 200 scoped to that division")
    void getDepartmentDatsByDivision_validDivision_returnsScopedList() throws Exception {
        Division engineering = insertDivision("Engineering", false);
        Division sales = insertDivision("Sales", false);
        insertDept("Backend", engineering, false);
        insertDept("Frontend", engineering, false);
        insertDept("Sales Ops", sales, false);

        mockMvc.perform(get("/api/divisions/{id}/departments-dat", engineering.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].deptName", containsInAnyOrder("Backend", "Frontend")));
    }

    @Test
    @DisplayName("TC_ORG_DIV_CHILDREN_02 | GET departments-dat for non-existent division -> 404")
    void getDepartmentDatsByDivision_nonExistentDivision_returns404() throws Exception {
        mockMvc.perform(get("/api/divisions/{id}/departments-dat", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TC_ORG_DIV_CHILDREN_03 | GET /divisions/{id}/teams -> 200 aggregated across all its departments")
    void getTeamsByDivision_validDivision_returnsTeamsAcrossDepartments() throws Exception {
        Division engineering = insertDivision("Engineering", false);
        DepartmentDat backend = insertDept("Backend", engineering, false);
        DepartmentDat frontend = insertDept("Frontend", engineering, false);
        insertTeam("API Team", backend, false);
        insertTeam("UI Team", frontend, false);

        Division sales = insertDivision("Sales", false);
        DepartmentDat salesOps = insertDept("Sales Ops", sales, false);
        insertTeam("Enterprise Sales", salesOps, false);

        mockMvc.perform(get("/api/divisions/{id}/teams", engineering.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].teamName", containsInAnyOrder("API Team", "UI Team")));
    }

    @Test
    @DisplayName("TC_ORG_DIV_CHILDREN_04 | GET teams for non-existent division -> 404")
    void getTeamsByDivision_nonExistentDivision_returns404() throws Exception {
        mockMvc.perform(get("/api/divisions/{id}/teams", 99999))
                .andExpect(status().isNotFound());
    }

    // ═══════════════════════════ DEPARTMENTS (DAT) ═════════════════════════

    @Test
    @DisplayName("TC_ORG_DEPT_GETALL_01 | GET all departments -> excludes deleted, includes division info")
    void getAllDepartmentDats_withData_returnsActiveWithDivisionInfo() throws Exception {
        Division division = insertDivision("Engineering", false);
        insertDept("Backend", division, false);
        insertDept("Legacy Dept", division, true);

        mockMvc.perform(get("/api/departments-dat"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].deptName").value("Backend"))
                .andExpect(jsonPath("$[0].divisionId").value(division.getId()))
                .andExpect(jsonPath("$[0].divisionName").value("Engineering"));
    }

    @Test
    @DisplayName("TC_ORG_DEPT_GET_01 | GET department by valid id -> 200")
    void getDepartmentDatById_validId_returns200() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat dept = insertDept("Backend", division, false);

        mockMvc.perform(get("/api/departments-dat/{id}", dept.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deptName").value("Backend"))
                .andExpect(jsonPath("$.divisionName").value("Engineering"));
    }

    @Test
    @DisplayName("TC_ORG_DEPT_GET_02 | GET department by non-existent id -> 404")
    void getDepartmentDatById_nonExistentId_returns404() throws Exception {
        mockMvc.perform(get("/api/departments-dat/{id}", 99999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("not found")));
    }

    @Test
    @DisplayName("TC_ORG_DEPT_CREATE_01 | POST valid department -> 201")
    void createDepartmentDat_validRequest_returns201() throws Exception {
        Division division = insertDivision("Engineering", false);

        mockMvc.perform(post("/api/departments-dat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deptJson(division.getId(), "Backend")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.deptName").value("Backend"))
                .andExpect(jsonPath("$.divisionId").value(division.getId()));
    }

    @Test
    @DisplayName("TC_ORG_DEPT_CREATE_02 | POST with unknown divisionId -> 404 Division not found")
    void createDepartmentDat_unknownDivision_returns404() throws Exception {
        mockMvc.perform(post("/api/departments-dat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deptJson(99999, "Backend")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("Division not found")));

        Assertions.assertEquals(0, departmentDatRepository.count());
    }

    @Test
    @DisplayName("TC_ORG_DEPT_CREATE_03 | POST duplicate name within same division -> 400")
    void createDepartmentDat_duplicateNameSameDivision_returns400() throws Exception {
        Division division = insertDivision("Engineering", false);
        insertDept("Backend", division, false);

        mockMvc.perform(post("/api/departments-dat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deptJson(division.getId(), "backend")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @DisplayName("TC_ORG_DEPT_CREATE_04 | POST same dept name under a DIFFERENT division -> 201 (scoped, no conflict)")
    void createDepartmentDat_sameNameDifferentDivision_returns201() throws Exception {
        Division engineering = insertDivision("Engineering", false);
        Division sales = insertDivision("Sales", false);
        insertDept("Operations", engineering, false);

        mockMvc.perform(post("/api/departments-dat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deptJson(sales.getId(), "Operations")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.deptName").value("Operations"))
                .andExpect(jsonPath("$.divisionId").value(sales.getId()));

        Assertions.assertEquals(2, departmentDatRepository.count());
    }

    @Test
    @DisplayName("TC_ORG_DEPT_CREATE_05 | POST name matching a soft-deleted dept in same division -> revives it")
    void createDepartmentDat_nameMatchesSoftDeleted_revivesExistingRow() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat deleted = insertDept("Backend", division, true);

        mockMvc.perform(post("/api/departments-dat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deptJson(division.getId(), "Backend")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(deleted.getId()))
                .andExpect(jsonPath("$.isDeleted").value(false));

        Assertions.assertEquals(1, departmentDatRepository.count());
    }

    @Test
    @DisplayName("TC_ORG_DEPT_CREATE_06 | POST blank deptName -> 400 Bad Request")
    void createDepartmentDat_blankName_returns400() throws Exception {
        Division division = insertDivision("Engineering", false);

        mockMvc.perform(post("/api/departments-dat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deptJson(division.getId(), "")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC_ORG_DEPT_UPDATE_01 | PUT valid rename and move to a different division -> 200")
    void updateDepartmentDat_renameAndMove_returns200() throws Exception {
        Division engineering = insertDivision("Engineering", false);
        Division sales = insertDivision("Sales", false);
        DepartmentDat dept = insertDept("Backend", engineering, false);

        mockMvc.perform(put("/api/departments-dat/{id}", dept.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deptJson(sales.getId(), "Backend Ops")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deptName").value("Backend Ops"))
                .andExpect(jsonPath("$.divisionId").value(sales.getId()));
    }

    @Test
    @DisplayName("TC_ORG_DEPT_UPDATE_02 | PUT rename to a duplicate under the same division -> 400")
    void updateDepartmentDat_duplicateInSameDivision_returns400() throws Exception {
        Division division = insertDivision("Engineering", false);
        insertDept("Backend", division, false);
        DepartmentDat frontend = insertDept("Frontend", division, false);

        mockMvc.perform(put("/api/departments-dat/{id}", frontend.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deptJson(division.getId(), "Backend")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @DisplayName("TC_ORG_DEPT_UPDATE_03 | PUT non-existent department id -> 404")
    void updateDepartmentDat_nonExistentId_returns404() throws Exception {
        Division division = insertDivision("Engineering", false);

        mockMvc.perform(put("/api/departments-dat/{id}", 99999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deptJson(division.getId(), "Backend")))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TC_ORG_DEPT_UPDATE_04 | PUT with unknown target divisionId -> 404 Division not found")
    void updateDepartmentDat_unknownTargetDivision_returns404() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat dept = insertDept("Backend", division, false);

        mockMvc.perform(put("/api/departments-dat/{id}", dept.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deptJson(99999, "Backend")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("Division not found")));
    }

    @Test
    @DisplayName("TC_ORG_DEPT_DELETE_01 | DELETE department -> 204, soft-deleted (not removed)")
    void deleteDepartmentDat_validId_returns204AndSoftDeletes() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat dept = insertDept("Backend", division, false);

        mockMvc.perform(delete("/api/departments-dat/{id}", dept.getId()))
                .andExpect(status().isNoContent());

        DepartmentDat stillInDb = departmentDatRepository.findById(dept.getId()).orElseThrow();
        Assertions.assertTrue(stillInDb.getIsDeleted());
    }

    @Test
    @DisplayName("TC_ORG_DEPT_DELETE_02 | DELETE non-existent department -> 404")
    void deleteDepartmentDat_nonExistentId_returns404() throws Exception {
        mockMvc.perform(delete("/api/departments-dat/{id}", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TC_ORG_DEPT_CHILDREN_01 | GET /departments-dat/{id}/teams -> 200 scoped to that department")
    void getTeamsByDepartmentDat_validDepartment_returnsScopedList() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat backend = insertDept("Backend", division, false);
        DepartmentDat frontend = insertDept("Frontend", division, false);
        insertTeam("API Team", backend, false);
        insertTeam("UI Team", frontend, false);

        mockMvc.perform(get("/api/departments-dat/{id}/teams", backend.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].teamName").value("API Team"));
    }

    @Test
    @DisplayName("TC_ORG_DEPT_CHILDREN_02 | GET teams for non-existent department -> 404")
    void getTeamsByDepartmentDat_nonExistentDepartment_returns404() throws Exception {
        mockMvc.perform(get("/api/departments-dat/{id}/teams", 99999))
                .andExpect(status().isNotFound());
    }

    // ══════════════════════════════ TEAMS ═════════════════════════════════

    @Test
    @DisplayName("TC_ORG_TEAM_GETALL_01 | GET all teams -> excludes deleted, includes department/division info")
    void getAllTeams_withData_returnsActiveWithHierarchyInfo() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat backend = insertDept("Backend", division, false);
        insertTeam("API Team", backend, false);
        insertTeam("Legacy Team", backend, true);

        mockMvc.perform(get("/api/teams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].teamName").value("API Team"))
                .andExpect(jsonPath("$[0].departmentDatName").value("Backend"))
                .andExpect(jsonPath("$[0].divisionName").value("Engineering"));
    }

    @Test
    @DisplayName("TC_ORG_TEAM_GET_01 | GET team by valid id -> 200")
    void getTeamById_validId_returns200() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat backend = insertDept("Backend", division, false);
        Team team = insertTeam("API Team", backend, false);

        mockMvc.perform(get("/api/teams/{id}", team.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamName").value("API Team"))
                .andExpect(jsonPath("$.departmentDatId").value(backend.getId()))
                .andExpect(jsonPath("$.divisionId").value(division.getId()));
    }

    @Test
    @DisplayName("TC_ORG_TEAM_GET_02 | GET team by non-existent id -> 404")
    void getTeamById_nonExistentId_returns404() throws Exception {
        mockMvc.perform(get("/api/teams/{id}", 99999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("not found")));
    }

    @Test
    @DisplayName("TC_ORG_TEAM_CREATE_01 | POST valid team -> 201")
    void createTeam_validRequest_returns201() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat backend = insertDept("Backend", division, false);

        mockMvc.perform(post("/api/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teamJson(backend.getId(), "API Team")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.teamName").value("API Team"))
                .andExpect(jsonPath("$.departmentDatId").value(backend.getId()));
    }

    @Test
    @DisplayName("TC_ORG_TEAM_CREATE_02 | POST with unknown departmentDatId -> 404 Department DAT not found")
    void createTeam_unknownDepartment_returns404() throws Exception {
        mockMvc.perform(post("/api/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teamJson(99999, "API Team")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("Department DAT not found")));

        Assertions.assertEquals(0, teamRepository.count());
    }

    @Test
    @DisplayName("TC_ORG_TEAM_CREATE_03 | POST duplicate team name within same department -> 400")
    void createTeam_duplicateNameSameDepartment_returns400() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat backend = insertDept("Backend", division, false);
        insertTeam("API Team", backend, false);

        mockMvc.perform(post("/api/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teamJson(backend.getId(), "api team")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @DisplayName("TC_ORG_TEAM_CREATE_04 | POST same team name under a DIFFERENT department -> 201 (scoped, no conflict)")
    void createTeam_sameNameDifferentDepartment_returns201() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat backend = insertDept("Backend", division, false);
        DepartmentDat frontend = insertDept("Frontend", division, false);
        insertTeam("Core Team", backend, false);

        mockMvc.perform(post("/api/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teamJson(frontend.getId(), "Core Team")))
                .andExpect(status().isCreated());

        Assertions.assertEquals(2, teamRepository.count());
    }

    @Test
    @DisplayName("TC_ORG_TEAM_CREATE_05 | POST name matching a soft-deleted team in same department -> revives it")
    void createTeam_nameMatchesSoftDeleted_revivesExistingRow() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat backend = insertDept("Backend", division, false);
        Team deleted = insertTeam("API Team", backend, true);

        mockMvc.perform(post("/api/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teamJson(backend.getId(), "API Team")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(deleted.getId()))
                .andExpect(jsonPath("$.isDeleted").value(false));

        Assertions.assertEquals(1, teamRepository.count());
    }

    @Test
    @DisplayName("TC_ORG_TEAM_CREATE_06 | POST blank teamName -> 400 Bad Request")
    void createTeam_blankName_returns400() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat backend = insertDept("Backend", division, false);

        mockMvc.perform(post("/api/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teamJson(backend.getId(), "")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC_ORG_TEAM_UPDATE_01 | PUT valid rename and move to a different department -> 200")
    void updateTeam_renameAndMove_returns200() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat backend = insertDept("Backend", division, false);
        DepartmentDat frontend = insertDept("Frontend", division, false);
        Team team = insertTeam("API Team", backend, false);

        mockMvc.perform(put("/api/teams/{id}", team.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teamJson(frontend.getId(), "UI Team")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamName").value("UI Team"))
                .andExpect(jsonPath("$.departmentDatId").value(frontend.getId()));
    }

    @Test
    @DisplayName("TC_ORG_TEAM_UPDATE_02 | PUT rename to a duplicate under the same department -> 400")
    void updateTeam_duplicateInSameDepartment_returns400() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat backend = insertDept("Backend", division, false);
        insertTeam("API Team", backend, false);
        Team secondTeam = insertTeam("QA Team", backend, false);

        mockMvc.perform(put("/api/teams/{id}", secondTeam.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teamJson(backend.getId(), "API Team")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @DisplayName("TC_ORG_TEAM_UPDATE_03 | PUT non-existent team id -> 404")
    void updateTeam_nonExistentId_returns404() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat backend = insertDept("Backend", division, false);

        mockMvc.perform(put("/api/teams/{id}", 99999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teamJson(backend.getId(), "API Team")))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TC_ORG_TEAM_DELETE_01 | DELETE team -> 204, soft-deleted (not removed)")
    void deleteTeam_validId_returns204AndSoftDeletes() throws Exception {
        Division division = insertDivision("Engineering", false);
        DepartmentDat backend = insertDept("Backend", division, false);
        Team team = insertTeam("API Team", backend, false);

        mockMvc.perform(delete("/api/teams/{id}", team.getId()))
                .andExpect(status().isNoContent());

        Team stillInDb = teamRepository.findById(team.getId()).orElseThrow();
        Assertions.assertTrue(stillInDb.getIsDeleted());
    }

    @Test
    @DisplayName("TC_ORG_TEAM_DELETE_02 | DELETE non-existent team -> 404")
    void deleteTeam_nonExistentId_returns404() throws Exception {
        mockMvc.perform(delete("/api/teams/{id}", 99999))
                .andExpect(status().isNotFound());
    }
}