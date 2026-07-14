package com.dat_management.backend.controller;

import com.dat_management.backend.entity.DepartmentDat;
import com.dat_management.backend.entity.Division;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeJapaneseProfile;
import com.dat_management.backend.entity.TargetTerm;
import com.dat_management.backend.entity.Team;
import com.dat_management.backend.repository.DepartmentDatRepository;
import com.dat_management.backend.repository.DivisionRepository;
import com.dat_management.backend.repository.EmployeeJapaneseProfileRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.TargetTermRepository;
import com.dat_management.backend.repository.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class JapaneseDashboardControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EmployeeJapaneseProfileRepository profileRepository;

    @Autowired
    private TargetTermRepository targetTermRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private DepartmentDatRepository departmentDatRepository;

    @Autowired
    private DivisionRepository divisionRepository;

    @BeforeEach
    void cleanDatabase() {
        profileRepository.deleteAll();
        targetTermRepository.deleteAll();
        employeeRepository.deleteAll();
        teamRepository.deleteAll();
        departmentDatRepository.deleteAll();
        divisionRepository.deleteAll();
    }

    @Test
    @DisplayName("TC_JD_INT_001 | GET dashboard when DB empty -> 200 with empty totals")
    void getDashboard_emptyDatabase_returns200WithGrandTotals() throws Exception {
        mockMvc.perform(get("/api/japanese-dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.byDepartment", hasSize(1)))
                .andExpect(jsonPath("$.byDepartment[0].department").value("Grand Total"))
                .andExpect(jsonPath("$.byDepartment[0].total").value(0))
                .andExpect(jsonPath("$.byTeam", hasSize(1)))
                .andExpect(jsonPath("$.byTeam[0].team").value("Grand Total"))
                .andExpect(jsonPath("$.byTeamComm", hasSize(1)))
                .andExpect(jsonPath("$.byTeamComm[0].team").value("Grand Total"))
                .andExpect(jsonPath("$.commCapability", hasSize(8)))
                .andExpect(jsonPath("$.noCertMembers", hasSize(1)))
                .andExpect(jsonPath("$.noCertMembers[0].team").value("Grand Total"));
    }

    @Test
    @DisplayName("TC_JD_INT_002 | GET dashboard with active target term and profiles -> 200 with calculated totals")
    void getDashboard_withProfiles_returnsCalculatedDashboard() throws Exception {
        TargetTerm targetTerm = targetTerm("2026-07-01", "2026-09-01");
        targetTermRepository.save(targetTerm);

        Team coreTeam = createTeam("Digital Division", "DIG", "Platform Department", "PLT", "Core Team");
        Employee alice = employeeRepository.save(employee("EMP001", "Alice Admin", coreTeam, false));
        Employee bob = employeeRepository.save(employee("EMP002", "Bob Staff", coreTeam, false));
        profileRepository.save(profile(alice, "N2", "N1", "N3", "Level 1 | G1", "Level 2 | G2", "Level 3"));
        profileRepository.save(profile(bob, "None", "None", "N4", "None", "Level 1 | G2", "Level 2 | G1"));

        mockMvc.perform(get("/api/japanese-dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.target1Date").value("Jul-2026"))
                .andExpect(jsonPath("$.target2Date").value("Sep-2026"))
                .andExpect(jsonPath("$.byDepartment[0].department").value("Platform Department"))
                .andExpect(jsonPath("$.byDepartment[0].n2").value(1))
                .andExpect(jsonPath("$.byDepartment[0].none").value(1))
                .andExpect(jsonPath("$.byDepartment[0].total").value(2))
                .andExpect(jsonPath("$.byDepartment[1].department").value("Grand Total"))
                .andExpect(jsonPath("$.byDepartment[1].n2").value(1))
                .andExpect(jsonPath("$.byDepartment[1].none").value(1))
                .andExpect(jsonPath("$.byDepartment[1].total").value(2))
                .andExpect(jsonPath("$.byTeam[0].team").value("Core Team"))
                .andExpect(jsonPath("$.byTeam[0].current.N2").value(1))
                .andExpect(jsonPath("$.byTeam[0].target1.N1").value(1))
                .andExpect(jsonPath("$.byTeam[0].target2.N3").value(1))
                .andExpect(jsonPath("$.byTeam[0].target2.N4").value(1))
                .andExpect(jsonPath("$.noCertMembers[0].team").value("Core Team"))
                .andExpect(jsonPath("$.noCertMembers[0].current").value(1))
                .andExpect(jsonPath("$.noCertMembers[0].target1").value(1))
                .andExpect(jsonPath("$.commCapability[0].level").value("Level 0 | None"))
                .andExpect(jsonPath("$.commCapability[0].current").value(1));
    }

    @Test
    @DisplayName("TC_JD_INT_003 | GET dashboard excludes deleted employees")
    void getDashboard_deletedEmployeesAreExcluded() throws Exception {
        Team coreTeam = createTeam("Digital Division", "DIG", "Platform Department", "PLT", "Core Team");
        Employee active = employeeRepository.save(employee("EMP001", "Alice Admin", coreTeam, false));
        Employee deleted = employeeRepository.save(employee("EMP002", "Deleted User", coreTeam, true));
        profileRepository.save(profile(active, "N2", "N1", "N3", "Level 1 | G1", "Level 2 | G2", "Level 3"));
        profileRepository.save(profile(deleted, "N1", "N1", "N1", "Level 3", "Level 3", "Level 3"));

        mockMvc.perform(get("/api/japanese-dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.byDepartment[0].department").value("Platform Department"))
                .andExpect(jsonPath("$.byDepartment[0].n1").value(0))
                .andExpect(jsonPath("$.byDepartment[0].n2").value(1))
                .andExpect(jsonPath("$.byDepartment[0].total").value(1))
                .andExpect(jsonPath("$.byTeam[0].current.N1").value(0))
                .andExpect(jsonPath("$.byTeam[0].current.N2").value(1));
    }

    @Test
    @DisplayName("TC_JD_INT_004 | GET dashboard maps communication buckets")
    void getDashboard_communicationLevelsAreBucketed() throws Exception {
        Team coreTeam = createTeam("Digital Division", "DIG", "Platform Department", "PLT", "Core Team");
        Employee alice = employeeRepository.save(employee("EMP001", "Alice Admin", coreTeam, false));
        profileRepository.save(profile(alice, "N2", "N1", "N3", "Level 2 | G1", "Level 2 | G2", "Level 2 | G3"));

        mockMvc.perform(get("/api/japanese-dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.byTeamComm[0].team").value("Core Team"))
                .andExpect(jsonPath("$.byTeamComm[0].current['Level 2 | G1:Email reading/writing/MS team chat, Daily team conversation']").value(1))
                .andExpect(jsonPath("$.byTeamComm[0].target1['Level 2 | G2:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese']").value(1))
                .andExpect(jsonPath("$.byTeamComm[0].target2['Level 2 | G3:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese, can Participate/discuss with Japanese Customers']").value(1))
                .andExpect(jsonPath("$.commCapability[4].level", startsWith("Level 2 | G1")))
                .andExpect(jsonPath("$.commCapability[4].current").value(1))
                .andExpect(jsonPath("$.commCapability[5].target1").value(1))
                .andExpect(jsonPath("$.commCapability[6].target2").value(1));
    }

    private TargetTerm targetTerm(String target1Date, String target2Date) {
        TargetTerm targetTerm = new TargetTerm();
        targetTerm.setTarget1Date(LocalDate.parse(target1Date));
        targetTerm.setTarget2Date(LocalDate.parse(target2Date));
        targetTerm.setExamDate(LocalDate.parse("2026-12-06"));
        targetTerm.setIsActive(true);
        return targetTerm;
    }

    private Team createTeam(String divisionName, String divisionCode, String deptName, String deptCode, String teamName) {
        Division division = new Division();
        division.setDivisionName(divisionName);
        division.setIsDeleted(false);
        Division savedDivision = divisionRepository.save(division);

        DepartmentDat departmentDat = new DepartmentDat();
        departmentDat.setDivision(savedDivision);
        departmentDat.setDeptName(deptName);
        departmentDat.setIsDeleted(false);
        DepartmentDat savedDepartment = departmentDatRepository.save(departmentDat);

        Team team = new Team();
        team.setDepartmentDat(savedDepartment);
        team.setTeamName(teamName);
        team.setIsDeleted(false);
        return teamRepository.save(team);
    }

    private Employee employee(String id, String name, Team team, boolean deleted) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(name);
        employee.setEmail(id.toLowerCase() + "@dat.com");
        employee.setPassword("encoded-password");
        employee.setDoorlog("door-" + id);
        employee.setPosition("Engineer");
        employee.setEmpStatus("active");
        employee.setStatus("default");
        employee.setTeam(team);
        employee.setIsCorePersonnel(false);
        employee.setHasJapanBusinessTrip(false);
        employee.setNotiSetting(false);
        employee.setIsDeleted(deleted);
        return employee;
    }

    private EmployeeJapaneseProfile profile(
            Employee employee,
            String jlptHighestLevel,
            String target1,
            String target2,
            String currentCommunication,
            String target1Communication,
            String target2Communication
    ) {
        EmployeeJapaneseProfile profile = new EmployeeJapaneseProfile();
        profile.setEmployee(employee);
        profile.setJlptHighestLevel(jlptHighestLevel);
        profile.setTarget1JlptNatLevel(target1);
        profile.setTarget2JlptNatLevel(target2);
        profile.setCurrentCommunicationLevel(currentCommunication);
        profile.setTarget1CommunicationLevel(target1Communication);
        profile.setTarget2CommunicationLevel(target2Communication);
        return profile;
    }
}
