package com.dat_management.backend.service;

import com.dat_management.backend.dto.EmployeeRequestDTO;
import com.dat_management.backend.dto.EmployeeResponseDTO;
import com.dat_management.backend.dto.skillset.EmployeeWithSkillsResponseDTO;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeService {

    private final EmployeeRepository      employeeRepository;
    private final TeamRepository          teamRepository;
    private final DepartmentDirRepository departmentDirRepository;
    private final DepartmentDatRepository departmentDatRepository;
    private final DivisionRepository      divisionRepository;
    private final RoleRepository          roleRepository;
    private final PasswordEncoder         passwordEncoder;
    private final SkillSetService         skillSetService;

    // ── Mapping ──────────────────────────────────────────────────────────────
    public Employee getEmployeeById(String id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
    }

    private EmployeeResponseDTO toDTO(Employee e) {
        String divName = null;
        String deptDat = null;
        if (e.getTeam() != null && e.getTeam().getDepartmentDat() != null) {
            deptDat = e.getTeam().getDepartmentDat().getDeptName();
            if (e.getTeam().getDepartmentDat().getDivision() != null) {
                divName = e.getTeam().getDepartmentDat().getDivision().getDivisionName();
            }
        }

        return EmployeeResponseDTO.builder()
                .id(e.getId())
                .name(e.getName())
                .email(e.getEmail())
                .doorlog(e.getDoorlog())
                .position(e.getPosition())
                .empStatus(e.getEmpStatus())
                .status(e.getStatus())
                .isCorePersonnel(e.getIsCorePersonnel())
                .hasJapanBusinessTrip(e.getHasJapanBusinessTrip())
                .notiSetting(e.getNotiSetting())
                .divName(divName)
                .deptDir(e.getDepartmentDir() != null ? e.getDepartmentDir().getDeptName() : null)
                .deptDat(deptDat)
                .team(e.getTeam() != null ? e.getTeam().getTeamName() : null)
                .role(e.getRole() != null ? e.getRole().getRoleName() : null)
                .dob(e.getDob())
                .profilePhotoPath(e.getProfilePhotoPath())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    // ── FETCH ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<EmployeeResponseDTO> getAll() {
        return employeeRepository.findAllByIsDeletedFalse()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeResponseDTO getById(String id) {
        Employee e = employeeRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        return toDTO(e);
    }

    @Transactional(readOnly = true)
    public EmployeeWithSkillsResponseDTO getEmployeeWithAllSkills(String id) {
        Employee e = employeeRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        return skillSetService.getEmployeeWithAllSkills(id);
    }

    @Transactional(readOnly = true)
    public List<EmployeeWithSkillsResponseDTO> getAllEmployeesWithSkills() {
        return skillSetService.getAllEmployeesWithSkills();
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponseDTO> getByStatus(String empStatus) {
        return employeeRepository.findByEmpStatusAndIsDeletedFalse(empStatus)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponseDTO> searchByName(String name) {
        return employeeRepository.searchByName(name)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponseDTO> getDeleted() {
        return employeeRepository.findByIsDeletedTrue()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeResponseDTO getDeletedById(String id) {
        Employee e = employeeRepository.findByIdAndIsDeletedTrue(id)
                .orElseThrow(() -> new RuntimeException("Deleted employee not found: " + id));
        return toDTO(e);
    }
@Transactional(readOnly = true)
public EmployeeWithSkillsResponseDTO getEmployeeProfile(String id) {

    Employee employee = employeeRepository.findByIdAndIsDeletedFalse(id)
            .orElseThrow(() -> new RuntimeException("Employee not found: " + id));

    // basic employee info
    EmployeeWithSkillsResponseDTO dto = EmployeeWithSkillsResponseDTO.builder()
            .id(employee.getId())
            .name(employee.getName())
            .email(employee.getEmail())
            .doorlog(employee.getDoorlog())
            .position(employee.getPosition())
            .empStatus(employee.getEmpStatus())
            .status(employee.getStatus())
            .isCorePersonnel(employee.getIsCorePersonnel())
            .hasJapanBusinessTrip(employee.getHasJapanBusinessTrip())
            .notiSetting(employee.getNotiSetting())
            .dob(employee.getDob())
            .profilePhotoPath(employee.getProfilePhotoPath())
            .createdAt(employee.getCreatedAt())
            .updatedAt(employee.getUpdatedAt())
            .role(employee.getRole() != null ? employee.getRole().getRoleName() : null)
            .deptDir(employee.getDepartmentDir() != null
                    ? employee.getDepartmentDir().getDeptName()
                    : null)
            .team(employee.getTeam() != null
                    ? employee.getTeam().getTeamName()
                    : null)
            .deptDat(employee.getTeam() != null
                    ? employee.getTeam().getDepartmentDat().getDeptName()
                    : null)
            .divName(employee.getTeam() != null
                    ? employee.getTeam().getDepartmentDat().getDivision().getDivisionName()
                    : null)
            .build();

   EmployeeWithSkillsResponseDTO skillInfo =
        skillSetService.getEmployeeWithAllSkills(employee.getId());

    dto.setLanguageSkill(skillInfo.getLanguageSkill());
    dto.setManagementSkill(skillInfo.getManagementSkill());
    dto.setDevelopmentSkills(skillInfo.getDevelopmentSkills());
    dto.setTechnicalSkills(skillInfo.getTechnicalSkills());
    dto.setJapaneseProfile(skillInfo.getJapaneseProfile());

    return dto;
} 
    // ── CREATE (single) ──────────────────────────────────────────────────────

    public EmployeeResponseDTO create(EmployeeRequestDTO dto) {
        if (employeeRepository.existsByIdAndIsDeletedFalse(dto.getId())) {
            throw new RuntimeException("Staff ID already exists: " + dto.getId());
        }
        Employee e = new Employee();
        e.setId(dto.getId());
        applyDTO(e, dto);

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            e.setPassword(passwordEncoder.encode(dto.getPassword()));
        } else {
            e.setPassword(passwordEncoder.encode("changeme123"));
        }

        return toDTO(employeeRepository.save(e));
    }

    // ── CREATE (bulk) ────────────────────────────────────────────────────────

    public Map<String, Object> createBulk(List<EmployeeRequestDTO> dtos) {
        List<EmployeeResponseDTO> created = new ArrayList<>();
        List<Map<String, String>> failed = new ArrayList<>();

        for (EmployeeRequestDTO dto : dtos) {
            try {
                EmployeeResponseDTO result = createSingleInNewTransaction(dto);
                created.add(result);
            } catch (Exception ex) {
                failed.add(Map.of(
                        "id", dto.getId() != null ? dto.getId() : "(unknown)",
                        "reason", ex.getMessage() != null ? ex.getMessage() : "Unknown error"
                ));
            }
        }

        return Map.of(
                "totalReceived", dtos.size(),
                "successCount", created.size(),
                "failedCount", failed.size(),
                "created", created,
                "failed", failed
        );
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public EmployeeResponseDTO createSingleInNewTransaction(EmployeeRequestDTO dto) {
        if (dto.getId() == null || dto.getId().isBlank()) {
            throw new IllegalArgumentException("Missing staff ID");
        }
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new IllegalArgumentException("Missing name");
        }
        // if (employeeRepository.existsByIdAndIsDeletedFalse(dto.getId())) {
        //     throw new IllegalArgumentException("Staff ID already exists");
        // }

        Employee e = new Employee();
        e.setId(dto.getId());
        applyDTO(e, dto);

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            e.setPassword(passwordEncoder.encode(dto.getPassword()));
        } else {
            e.setPassword(passwordEncoder.encode("changeme123"));
        }

        Employee saved = employeeRepository.saveAndFlush(e);
        return toDTO(saved);
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    public EmployeeResponseDTO update(String id, EmployeeRequestDTO dto) {
        Employee e = employeeRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        applyDTO(e, dto);
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            e.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        return toDTO(employeeRepository.save(e));
    }

    // ── RESIGN / SOFT DELETE / RESTORE ──────────────────────────────────────────

    public EmployeeResponseDTO resign(String id) {
        Employee e = employeeRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        e.setEmpStatus("inactive");
        return toDTO(employeeRepository.save(e));
    }

    public void softDelete(String id) {
        Employee e = employeeRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        e.setIsDeleted(true);
        employeeRepository.save(e);
    }

    public EmployeeResponseDTO restore(String id) {
        Employee e = employeeRepository.findByIdAndIsDeletedTrue(id)
                .orElseThrow(() -> new RuntimeException("Deleted employee not found: " + id));
        e.setIsDeleted(false);
        return toDTO(employeeRepository.save(e));
    }

    // ── Role Resolution ──────────────────────────────────────────────────────

    private Role resolveOrCreateRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return null;
        }

        return roleRepository.findByRoleName(roleName)
                .orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setRoleName(roleName);
                    // You might want to set additional fields like description
                    // newRole.setDescription("Auto-created role: " + roleName);
                    return roleRepository.saveAndFlush(newRole);
                });
    }

    // ── Apply DTO fields to entity ───────────────────────────────────────────

    private void applyDTO(Employee e, EmployeeRequestDTO dto) {
        e.setName(dto.getName());
        e.setEmail(dto.getEmail());
        e.setDoorlog(dto.getDoorlog());
        e.setPosition(dto.getPosition() != null ? dto.getPosition() : "");
        e.setEmpStatus(dto.getEmpStatus() != null ? dto.getEmpStatus() : "active");
        e.setStatus(dto.getStatus() != null ? dto.getStatus() : "default");
        e.setIsCorePersonnel(dto.getIsCorePersonnel() != null ? dto.getIsCorePersonnel() : false);
        e.setHasJapanBusinessTrip(dto.getHasJapanBusinessTrip() != null ? dto.getHasJapanBusinessTrip() : false);
        e.setNotiSetting(dto.getNotiSetting() != null ? dto.getNotiSetting() : false);
        e.setDob(dto.getDob());
        e.setProfilePhotoPath(dto.getProfilePhotoPath());

        // Team resolution: prefer name-based cascade, fallback to raw team_id
        if (dto.getTeamName() != null && !dto.getTeamName().isBlank()) {
            Team resolvedTeam = resolveOrCreateTeamChain(
                    dto.getDivisionName(),
                    dto.getDepartmentDatName(),
                    dto.getTeamName()
            );
            if (resolvedTeam != null) {
                e.setTeam(resolvedTeam);
            }
        }

        // Role resolution using name (with auto-creation)
        if (dto.getRoleName() != null && !dto.getRoleName().isBlank()) {
            Role resolvedRole = resolveOrCreateRole(dto.getRoleName());
            if (resolvedRole != null) {
                e.setRole(resolvedRole);
            }
        }
    }

    // ── Cascade find-or-create ───────────────────────────────────────────────

    private Team resolveOrCreateTeamChain(String divisionName, String departmentDatName, String teamName) {
        if (teamName == null || teamName.isBlank()) {
            return null;
        }
        if (departmentDatName == null || departmentDatName.isBlank()) {
            throw new IllegalArgumentException(
                    "department_dat_name is required when team_name is provided (team: " + teamName + ")");
        }
        if (divisionName == null || divisionName.isBlank()) {
            throw new IllegalArgumentException(
                    "division_name is required when team_name is provided (team: " + teamName + ")");
        }

        Division division = divisionRepository.findByDivisionName(divisionName)
                .orElseGet(() -> {
                    Division newDivision = new Division();
                    newDivision.setDivisionName(divisionName);
                    newDivision.setIsDeleted(false);
                    return divisionRepository.saveAndFlush(newDivision);
                });

        DepartmentDat departmentDat = departmentDatRepository
                .findByDeptNameAndDivision(departmentDatName, division)
                .orElseGet(() -> {
                    DepartmentDat newDept = new DepartmentDat();
                    newDept.setDeptName(departmentDatName);
                    newDept.setDivision(division);
                    newDept.setIsDeleted(false);
                    return departmentDatRepository.saveAndFlush(newDept);
                });

        return teamRepository.findByTeamNameAndDepartmentDat(teamName, departmentDat)
                .orElseGet(() -> {
                    Team newTeam = new Team();
                    newTeam.setTeamName(teamName);
                    newTeam.setDepartmentDat(departmentDat);
                    newTeam.setIsDeleted(false);
                    return teamRepository.saveAndFlush(newTeam);
                });
    }
}