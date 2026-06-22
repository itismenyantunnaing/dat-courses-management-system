package com.dat_management.backend.service;

import com.dat_management.backend.dto.EmployeeRequestDTO;
import com.dat_management.backend.dto.EmployeeResponseDTO;
import com.dat_management.backend.entity.DepartmentDat;
import com.dat_management.backend.entity.DepartmentDir;
import com.dat_management.backend.entity.Division;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.Role;
import com.dat_management.backend.entity.Team;
import com.dat_management.backend.repository.DepartmentDatRepository;
import com.dat_management.backend.repository.DepartmentDirRepository;
import com.dat_management.backend.repository.DivisionRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.RoleRepository;
import com.dat_management.backend.repository.TeamRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private DepartmentDirRepository departmentDirRepository;

    @Mock
    private DepartmentDatRepository departmentDatRepository;

    @Mock
    private DivisionRepository divisionRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void getAllReturnsMappedActiveEmployees() {
        EmployeeService service = service();
        Employee employee = employee("EMP001", "Alice Admin");
        employee.setDepartmentDir(departmentDir("DIR"));
        employee.setTeam(team("Platform", departmentDat("DAT", division("Digital"))));
        employee.setRole(new Role(1L, "admin"));

        when(employeeRepository.findAllByIsDeletedFalse()).thenReturn(List.of(employee));

        List<EmployeeResponseDTO> result = service.getAll();

        Assertions.assertEquals(1, result.size());
        EmployeeResponseDTO dto = result.get(0);
        Assertions.assertEquals("EMP001", dto.getId());
        Assertions.assertEquals("Alice Admin", dto.getName());
        Assertions.assertEquals("Digital", dto.getDivName());
        Assertions.assertEquals("DIR", dto.getDeptDir());
        Assertions.assertEquals("DAT", dto.getDeptDat());
        Assertions.assertEquals("Platform", dto.getTeam());
        Assertions.assertEquals("admin", dto.getRole());
    }

    @Test
    void getByIdThrowsWhenEmployeeIsMissing() {
        EmployeeService service = service();

        when(employeeRepository.findByIdAndIsDeletedFalse("MISSING")).thenReturn(Optional.empty());

        RuntimeException ex = Assertions.assertThrows(
                RuntimeException.class,
                () -> service.getById("MISSING"));

        Assertions.assertEquals("Employee not found: MISSING", ex.getMessage());
    }

    @Test
    void createRejectsDuplicateActiveStaffId() {
        EmployeeService service = service();
        EmployeeRequestDTO request = request("EMP001", "Alice Admin");

        when(employeeRepository.existsByIdAndIsDeletedFalse("EMP001")).thenReturn(true);

        RuntimeException ex = Assertions.assertThrows(
                RuntimeException.class,
                () -> service.create(request));

        Assertions.assertEquals("Staff ID already exists: EMP001", ex.getMessage());
        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    void createUsesDefaultsAndEncodesDefaultPassword() {
        EmployeeService service = service();
        EmployeeRequestDTO request = request("EMP001", "Alice Admin");

        when(employeeRepository.existsByIdAndIsDeletedFalse("EMP001")).thenReturn(false);
        when(passwordEncoder.encode("changeme123")).thenReturn("encoded-default");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EmployeeResponseDTO result = service.create(request);

        ArgumentCaptor<Employee> employeeCaptor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(employeeCaptor.capture());
        Employee saved = employeeCaptor.getValue();
        Assertions.assertEquals("EMP001", saved.getId());
        Assertions.assertEquals("Alice Admin", saved.getName());
        Assertions.assertEquals("encoded-default", saved.getPassword());
        Assertions.assertEquals("active", saved.getEmpStatus());
        Assertions.assertEquals("default", saved.getStatus());
        Assertions.assertFalse(saved.getIsCorePersonnel());
        Assertions.assertFalse(saved.getHasJapanBusinessTrip());
        Assertions.assertFalse(saved.getNotiSetting());
        Assertions.assertEquals("EMP001", result.getId());
    }

    @Test
    void createResolvesExistingTeamChainAndRole() {
        EmployeeService service = service();
        Division division = division("Digital");
        DepartmentDat departmentDat = departmentDat("DAT", division);
        Team team = team("Platform", departmentDat);
        Role role = new Role(1L, "staff");
        EmployeeRequestDTO request = request("EMP002", "Bob Staff");
        request.setDivisionName("Digital");
        request.setDepartmentDatName("DAT");
        request.setTeamName("Platform");
        request.setRoleName("");
        request.setPassword("Initial1!");

        when(employeeRepository.existsByIdAndIsDeletedFalse("EMP002")).thenReturn(false);
        when(divisionRepository.findByDivisionName("Digital")).thenReturn(Optional.of(division));
        when(departmentDatRepository.findByDeptNameAndDivision("DAT", division)).thenReturn(Optional.of(departmentDat));
        when(teamRepository.findByTeamNameAndDepartmentDat("Platform", departmentDat)).thenReturn(Optional.of(team));
        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(passwordEncoder.encode("Initial1!")).thenReturn("encoded-custom");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EmployeeResponseDTO result = service.create(request);

        Assertions.assertEquals("Platform", result.getTeam());
        Assertions.assertEquals("DAT", result.getDeptDat());
        Assertions.assertEquals("Digital", result.getDivName());
        Assertions.assertEquals("staff", result.getRole());
    }

    @Test
    void updateChangesFieldsAndKeepsPasswordWhenBlank() {
        EmployeeService service = service();
        Employee existing = employee("EMP001", "Alice Admin");
        existing.setPassword("existing-encoded");
        EmployeeRequestDTO request = request("EMP001", "Alice Updated");
        request.setPassword(" ");

        when(employeeRepository.findByIdAndIsDeletedFalse("EMP001")).thenReturn(Optional.of(existing));
        when(employeeRepository.save(existing)).thenReturn(existing);

        EmployeeResponseDTO result = service.update("EMP001", request);

        Assertions.assertEquals("Alice Updated", result.getName());
        Assertions.assertEquals("existing-encoded", existing.getPassword());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void resignMarksEmployeeInactive() {
        EmployeeService service = service();
        Employee employee = employee("EMP001", "Alice Admin");

        when(employeeRepository.findByIdAndIsDeletedFalse("EMP001")).thenReturn(Optional.of(employee));
        when(employeeRepository.save(employee)).thenReturn(employee);

        EmployeeResponseDTO result = service.resign("EMP001");

        Assertions.assertEquals("inactive", result.getEmpStatus());
        Assertions.assertEquals("inactive", employee.getEmpStatus());
    }

    @Test
    void softDeleteMarksEmployeeDeleted() {
        EmployeeService service = service();
        Employee employee = employee("EMP001", "Alice Admin");

        when(employeeRepository.findByIdAndIsDeletedFalse("EMP001")).thenReturn(Optional.of(employee));

        service.softDelete("EMP001");

        Assertions.assertTrue(employee.getIsDeleted());
        verify(employeeRepository).save(employee);
    }

    @Test
    void restoreMarksDeletedEmployeeActiveAgain() {
        EmployeeService service = service();
        Employee employee = employee("EMP001", "Alice Admin");
        employee.setIsDeleted(true);

        when(employeeRepository.findByIdAndIsDeletedTrue("EMP001")).thenReturn(Optional.of(employee));
        when(employeeRepository.save(employee)).thenReturn(employee);

        EmployeeResponseDTO result = service.restore("EMP001");

        Assertions.assertFalse(employee.getIsDeleted());
        Assertions.assertEquals("EMP001", result.getId());
    }

    @Test
    void createBulkSeparatesCreatedAndFailedRows() {
        EmployeeService service = service();
        EmployeeRequestDTO valid = request("EMP001", "Alice Admin");
        EmployeeRequestDTO invalid = request(null, "Missing Id");

        when(employeeRepository.existsByIdAndIsDeletedFalse("EMP001")).thenReturn(false);
        when(passwordEncoder.encode("changeme123")).thenReturn("encoded-default");
        when(employeeRepository.saveAndFlush(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> result = service.createBulk(List.of(valid, invalid));

        Assertions.assertEquals(2, result.get("totalReceived"));
        Assertions.assertEquals(1, result.get("successCount"));
        Assertions.assertEquals(1, result.get("failedCount"));
        Assertions.assertEquals(1, ((List<?>) result.get("created")).size());
        Assertions.assertEquals(1, ((List<?>) result.get("failed")).size());
    }

    private EmployeeService service() {
        return new EmployeeService(
                employeeRepository,
                teamRepository,
                departmentDirRepository,
                departmentDatRepository,
                divisionRepository,
                roleRepository,
                passwordEncoder);
    }

    private static EmployeeRequestDTO request(String id, String name) {
        return EmployeeRequestDTO.builder()
                .id(id)
                .name(name)
                .email(id == null ? null : id.toLowerCase() + "@dat.com")
                .doorlog(id == null ? null : "door-" + id)
                .dob(LocalDate.of(1990, 1, 1))
                .build();
    }

    private static Employee employee(String id, String name) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(name);
        employee.setEmail(id.toLowerCase() + "@dat.com");
        employee.setDoorlog("door-" + id);
        employee.setPosition("Engineer");
        employee.setPassword("encoded-password");
        employee.setEmpStatus("active");
        employee.setStatus("default");
        employee.setIsCorePersonnel(false);
        employee.setHasJapanBusinessTrip(false);
        employee.setNotiSetting(false);
        employee.setIsDeleted(false);
        employee.setDob(LocalDate.of(1990, 1, 1));
        return employee;
    }

    private static Division division(String name) {
        Division division = new Division();
        division.setDivisionName(name);
        division.setDivisionCode(name.toUpperCase());
        division.setIsDeleted(false);
        return division;
    }

    private static DepartmentDat departmentDat(String name, Division division) {
        DepartmentDat departmentDat = new DepartmentDat();
        departmentDat.setDeptName(name);
        departmentDat.setDeptCode(name.toUpperCase());
        departmentDat.setDivision(division);
        departmentDat.setIsDeleted(false);
        return departmentDat;
    }

    private static DepartmentDir departmentDir(String name) {
        DepartmentDir departmentDir = new DepartmentDir();
        departmentDir.setDeptName(name);
        departmentDir.setIsDeleted(false);
        return departmentDir;
    }

    private static Team team(String name, DepartmentDat departmentDat) {
        Team team = new Team();
        team.setTeamName(name);
        team.setDepartmentDat(departmentDat);
        team.setIsDeleted(false);
        return team;
    }
}
