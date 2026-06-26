package com.dat_management.backend.service;

import com.dat_management.backend.dto.JapaneseDashboardDTO;
import com.dat_management.backend.dto.JapaneseDashboardDTO.CommCapabilityRow;
import com.dat_management.backend.dto.JapaneseDashboardDTO.DeptCertifiedRow;
import com.dat_management.backend.dto.JapaneseDashboardDTO.NoCertMemberRow;
import com.dat_management.backend.dto.JapaneseDashboardDTO.TeamLevelRow;
import com.dat_management.backend.entity.DepartmentDat;
import com.dat_management.backend.entity.Division;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeJapaneseProfile;
import com.dat_management.backend.entity.TargetTerm;
import com.dat_management.backend.entity.Team;
import com.dat_management.backend.repository.EmployeeJapaneseProfileRepository;
import com.dat_management.backend.repository.TargetTermRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JapaneseDashboardServiceTest {

    @Mock
    private EmployeeJapaneseProfileRepository profileRepository;

    @Mock
    private TargetTermRepository targetTermRepository;

    @Test
    void buildDashboard_withProfilesAndActiveTargetTerm_buildsAllDashboardSections() {
        JapaneseDashboardService service = service();
        DepartmentDat department = departmentDat(101, "Platform Department");
        Team team = team("Core Team", department);
        EmployeeJapaneseProfile alice = profile(
                employee("EMP001", "Alice Admin", team),
                "N2",
                "N1",
                "N3",
                "Level 1 | G1",
                "Level 2 | G2",
                "Level 3");
        EmployeeJapaneseProfile bob = profile(
                employee("EMP002", "Bob Staff", team),
                "None",
                "None",
                "N4",
                "None",
                "Level 1 | G2",
                "Level 2 | G1");

        when(profileRepository.findAllWithEmployee()).thenReturn(List.of(alice, bob));
        when(targetTermRepository.findByIsActiveTrue()).thenReturn(List.of(targetTerm("2026-07-01", "2026-09-01")));

        JapaneseDashboardDTO result = service.buildDashboard();

        Assertions.assertEquals("Jul-2026", result.getTarget1Date());
        Assertions.assertEquals("Sep-2026", result.getTarget2Date());

        DeptCertifiedRow departmentRow = result.getByDepartment().get(0);
        Assertions.assertEquals("Platform Department", departmentRow.getDepartment());
        Assertions.assertEquals(101, departmentRow.getId());
        Assertions.assertEquals(1, departmentRow.getN2());
        Assertions.assertEquals(1, departmentRow.getNone());
        Assertions.assertEquals(2, departmentRow.getTotal());

        DeptCertifiedRow grandTotal = result.getByDepartment().get(1);
        Assertions.assertEquals("Grand Total", grandTotal.getDepartment());
        Assertions.assertEquals(1, grandTotal.getN2());
        Assertions.assertEquals(1, grandTotal.getNone());
        Assertions.assertEquals(2, grandTotal.getTotal());

        TeamLevelRow teamRow = result.getByTeam().get(0);
        Assertions.assertEquals("Core Team", teamRow.getTeam());
        Assertions.assertEquals(101, teamRow.getDeptId());
        Assertions.assertEquals(1, teamRow.getCurrent().getN2());
        Assertions.assertEquals(1, teamRow.getTarget1().getN1());
        Assertions.assertEquals(1, teamRow.getTarget2().getN3());
        Assertions.assertEquals(1, teamRow.getTarget2().getN4());

        NoCertMemberRow noCertRow = result.getNoCertMembers().get(0);
        Assertions.assertEquals("Core Team", noCertRow.getTeam());
        Assertions.assertEquals(1, noCertRow.getCurrent());
        Assertions.assertEquals(1, noCertRow.getTarget1());
        Assertions.assertEquals(0, noCertRow.getTarget2());

        CommCapabilityRow level0 = findComm(result, "Level 0 | None");
        Assertions.assertEquals(1, level0.getCurrent());
        CommCapabilityRow level1g1 = findComm(result, "Level 1 | G1");
        Assertions.assertEquals(1, level1g1.getCurrent());
        CommCapabilityRow level1g2 = findComm(result, "Level 1 | G2");
        Assertions.assertEquals(1, level1g2.getTarget1());
        CommCapabilityRow level3 = findComm(result, "Level 3");
        Assertions.assertEquals(1, level3.getTarget2());

        verify(profileRepository).findAllWithEmployee();
        verify(targetTermRepository).findByIsActiveTrue();
    }

    @Test
    void buildDashboard_withoutActiveTargetTerm_leavesTargetDatesNull() {
        JapaneseDashboardService service = service();

        when(profileRepository.findAllWithEmployee()).thenReturn(List.of());
        when(targetTermRepository.findByIsActiveTrue()).thenReturn(List.of());

        JapaneseDashboardDTO result = service.buildDashboard();

        Assertions.assertNull(result.getTarget1Date());
        Assertions.assertNull(result.getTarget2Date());
        Assertions.assertEquals("Grand Total", result.getByDepartment().get(0).getDepartment());
        Assertions.assertEquals(0, result.getByDepartment().get(0).getTotal());
        Assertions.assertEquals("Grand Total", result.getByTeam().get(0).getTeam());
        Assertions.assertEquals("Grand Total", result.getByTeamComm().get(0).getTeam());
        Assertions.assertEquals("Grand Total", result.getNoCertMembers().get(0).getTeam());
        Assertions.assertEquals(8, result.getCommCapability().size());
    }

    @Test
    void buildDashboard_profileWithoutTeam_usesUnknownDepartmentAndSkipsTeamSections() {
        JapaneseDashboardService service = service();
        EmployeeJapaneseProfile profile = profile(
                employee("EMP001", "Alice Admin", null),
                "N1",
                "N2",
                "N3",
                "Level 2 | G1",
                "Level 2 | G2",
                "Level 2 | G3");

        when(profileRepository.findAllWithEmployee()).thenReturn(List.of(profile));
        when(targetTermRepository.findByIsActiveTrue()).thenReturn(List.of());

        JapaneseDashboardDTO result = service.buildDashboard();

        Assertions.assertEquals("Unknown", result.getByDepartment().get(0).getDepartment());
        Assertions.assertNull(result.getByDepartment().get(0).getId());
        Assertions.assertEquals(1, result.getByDepartment().get(0).getN1());
        Assertions.assertEquals(1, result.getByDepartment().get(0).getTotal());
        Assertions.assertEquals(1, result.getByTeam().size());
        Assertions.assertEquals("Grand Total", result.getByTeam().get(0).getTeam());
        Assertions.assertEquals(1, result.getNoCertMembers().size());
        Assertions.assertEquals("Grand Total", result.getNoCertMembers().get(0).getTeam());
    }

    @Test
    void buildDashboard_invalidAndBlankJlptValuesAreIgnoredExceptExplicitNone() {
        JapaneseDashboardService service = service();
        DepartmentDat department = departmentDat(101, "Platform Department");
        Team team = team("Core Team", department);
        EmployeeJapaneseProfile invalid = profile(
                employee("EMP001", "Alice Admin", team),
                "N6",
                "",
                null,
                "Unknown",
                "Unknown",
                "Unknown");
        EmployeeJapaneseProfile explicitNone = profile(
                employee("EMP002", "Bob Staff", team),
                "None",
                "None",
                "None",
                "None",
                "None",
                "None");

        when(profileRepository.findAllWithEmployee()).thenReturn(List.of(invalid, explicitNone));
        when(targetTermRepository.findByIsActiveTrue()).thenReturn(List.of());

        JapaneseDashboardDTO result = service.buildDashboard();

        DeptCertifiedRow departmentRow = result.getByDepartment().get(0);
        Assertions.assertEquals(0, departmentRow.getN1());
        Assertions.assertEquals(0, departmentRow.getN2());
        Assertions.assertEquals(1, departmentRow.getNone());
        Assertions.assertEquals(2, departmentRow.getTotal());

        NoCertMemberRow noCertRow = result.getNoCertMembers().get(0);
        Assertions.assertEquals(1, noCertRow.getCurrent());
        Assertions.assertEquals(1, noCertRow.getTarget1());
        Assertions.assertEquals(1, noCertRow.getTarget2());

        TeamLevelRow teamRow = result.getByTeam().get(0);
        Assertions.assertEquals(0, teamRow.getCurrent().getN1());
        Assertions.assertEquals(0, teamRow.getCurrent().getN2());
        Assertions.assertEquals(0, teamRow.getTarget1().getN1());
        Assertions.assertEquals(0, teamRow.getTarget2().getN1());
    }

    private JapaneseDashboardService service() {
        return new JapaneseDashboardService(profileRepository, targetTermRepository);
    }

    private static CommCapabilityRow findComm(JapaneseDashboardDTO dto, String prefix) {
        return dto.getCommCapability().stream()
                .filter(row -> row.getLevel().startsWith(prefix))
                .findFirst()
                .orElseThrow();
    }

    private static TargetTerm targetTerm(String target1Date, String target2Date) {
        TargetTerm targetTerm = new TargetTerm();
        targetTerm.setTarget1Date(LocalDate.parse(target1Date));
        targetTerm.setTarget2Date(LocalDate.parse(target2Date));
        targetTerm.setExamDate(LocalDate.parse("2026-12-06"));
        targetTerm.setIsActive(true);
        return targetTerm;
    }

    private static EmployeeJapaneseProfile profile(
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

    private static Team team(String name, DepartmentDat departmentDat) {
        Team team = new Team();
        team.setId(201);
        team.setTeamName(name);
        team.setDepartmentDat(departmentDat);
        team.setIsDeleted(false);
        return team;
    }

    private static DepartmentDat departmentDat(Integer id, String name) {
        Division division = new Division();
        division.setId(301);
        division.setDivisionName("Digital Division");
        division.setDivisionCode("DIG");
        division.setIsDeleted(false);

        DepartmentDat departmentDat = new DepartmentDat();
        departmentDat.setId(id);
        departmentDat.setDeptName(name);
        departmentDat.setDeptCode("PLT");
        departmentDat.setDivision(division);
        departmentDat.setIsDeleted(false);
        return departmentDat;
    }
}
