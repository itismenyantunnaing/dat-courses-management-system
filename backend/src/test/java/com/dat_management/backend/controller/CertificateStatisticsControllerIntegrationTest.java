package com.dat_management.backend.controller;

import com.dat_management.backend.entity.*;
import com.dat_management.backend.entity.EmployeeCertificate.CertificateType;
import com.dat_management.backend.entity.EmployeeCertificate.VerificationStatus;
import com.dat_management.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.sql.init.mode=never"
})
@Transactional
class CertificateStatisticsControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EmployeeCertificateRepository certificateRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private DepartmentDatRepository departmentRepository;

    @Autowired
    private DivisionRepository divisionRepository;

    @BeforeEach
    void setUp() {
        certificateRepository.deleteAll();
        employeeRepository.deleteAll();
        teamRepository.deleteAll();
        departmentRepository.deleteAll();
        divisionRepository.deleteAll();
    }

    @Test
    @DisplayName("TC_DASH_INT_006 | GET /api/certificate-statistics/overall -> percentage of all employees with a verified certificate")
    void getOverallStatistics_twoEmployeesOneVerifiedCertificate_returnsFiftyPercent() throws Exception {
        Division division = divisionRepository.save(division("Technology"));

        DepartmentDat department =
                departmentRepository.save(department("Engineering", division));
        Team team = teamRepository.save(team(department, "Team A"));
        Employee holder = employeeRepository.save(employee("EMP001", "Alice", team));
        employeeRepository.save(employee("EMP002", "Bob", team));

        certificateRepository.save(certificate(holder, CertificateType.JLPT, "N2", VerificationStatus.APPROVED));

        mockMvc.perform(get("/api/certificate-statistics/overall"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statistics.JLPT.N2").value(50.0));
    }

    @Test
    @DisplayName("TC_DASH_INT_007 | GET /api/certificate-statistics/overall -> unverified certificates are excluded")
    void getOverallStatistics_unverifiedCertificate_isExcludedFromStatistics() throws Exception {
        Division division = divisionRepository.save(division("Technology"));

        DepartmentDat department =
                departmentRepository.save(department("Engineering", division));
        Team team = teamRepository.save(team(department, "Team A"));
        Employee holder = employeeRepository.save(employee("EMP001", "Alice", team));

        certificateRepository.save(certificate(holder, CertificateType.JLPT, "N2", VerificationStatus.PENDING));

        mockMvc.perform(get("/api/certificate-statistics/overall"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statistics").isEmpty());
    }

    @Test
    @DisplayName("TC_DASH_INT_008 | GET /api/certificate-statistics/teams -> percentage scoped to each team")
    void getTeamStatistics_certificateHolderInOneTeam_returnsTeamScopedPercentage() throws Exception {
        Division division = divisionRepository.save(division("Technology"));

        DepartmentDat department =
                departmentRepository.save(department("Engineering", division));
        Team teamA = teamRepository.save(team(department, "Team A"));
        Team teamB = teamRepository.save(team(department, "Team B"));
        Employee holder = employeeRepository.save(employee("EMP001", "Alice", teamA));
        employeeRepository.save(employee("EMP002", "Bob", teamA));
        employeeRepository.save(employee("EMP003", "Carol", teamB));

        certificateRepository.save(certificate(holder, CertificateType.JLPT, "N1", VerificationStatus.APPROVED));

        mockMvc.perform(get("/api/certificate-statistics/teams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statistics['Team A'].JLPT.N1").value(50.0))
                .andExpect(jsonPath("$.statistics['Team B']").doesNotExist());
    }

    private static DepartmentDat department(String name, Division division) {
        DepartmentDat department = new DepartmentDat();
        department.setDeptName(name);
        department.setDivision(division);
        department.setIsDeleted(false);
        return department;
    }

    private static Division division(String name) {
        Division division = new Division();
        division.setDivisionName(name);
        division.setIsDeleted(false);
        return division;
    }

    private static Team team(DepartmentDat department, String name) {
        Team team = new Team();
        team.setDepartmentDat(department);
        team.setTeamName(name);
        team.setIsDeleted(false);
        return team;
    }

    private static Employee employee(String id, String name, Team team) {
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
        employee.setIsDeleted(false);
        return employee;
    }

    private static EmployeeCertificate certificate(Employee employee, CertificateType type, String level,
                                                     VerificationStatus status) {
        EmployeeCertificate certificate = new EmployeeCertificate();
        certificate.setEmployee(employee);
        certificate.setCertificateType(type);
        certificate.setJapaneseLevel(level);
        certificate.setVerificationStatus(status);
        return certificate;
    }
}
