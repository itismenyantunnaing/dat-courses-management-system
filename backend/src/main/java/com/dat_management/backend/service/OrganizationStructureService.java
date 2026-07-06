package com.dat_management.backend.service;

import com.dat_management.backend.dto.OrganizationDtos.DepartmentDatRequestDTO;
import com.dat_management.backend.dto.OrganizationDtos.DepartmentDatResponseDTO;
import com.dat_management.backend.dto.OrganizationDtos.DivisionRequestDTO;
import com.dat_management.backend.dto.OrganizationDtos.DivisionResponseDTO;
import com.dat_management.backend.dto.OrganizationDtos.TeamRequestDTO;
import com.dat_management.backend.dto.OrganizationDtos.TeamResponseDTO;
import com.dat_management.backend.entity.DepartmentDat;
import com.dat_management.backend.entity.Division;
import com.dat_management.backend.entity.Team;
import com.dat_management.backend.repository.DepartmentDatRepository;
import com.dat_management.backend.repository.DivisionRepository;
import com.dat_management.backend.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationStructureService {

    private final DivisionRepository divisionRepository;
    private final DepartmentDatRepository departmentDatRepository;
    private final TeamRepository teamRepository;

    @Transactional(readOnly = true)
    public List<DivisionResponseDTO> getAllDivisions() {
        return divisionRepository.findAllByIsDeletedFalse().stream()
                .map(this::toDivisionDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public DivisionResponseDTO getDivisionById(Integer id) {
        return toDivisionDto(getActiveDivision(id));
    }

    public DivisionResponseDTO createDivision(DivisionRequestDTO dto) {
        String divisionName = normalize(dto.divisionName());
        Division existing = divisionRepository.findByDivisionNameIgnoreCase(divisionName).orElse(null);
        if (existing != null) {
            if (Boolean.TRUE.equals(existing.getIsDeleted())) {
                existing.setIsDeleted(false);
                existing.setDivisionName(divisionName);
                return toDivisionDto(divisionRepository.save(existing));
            }
            throw new RuntimeException("Division already exists: " + divisionName);
        }

        Division division = new Division();
        division.setDivisionName(divisionName);
        division.setIsDeleted(false);
        return toDivisionDto(divisionRepository.save(division));
    }

    public DivisionResponseDTO updateDivision(Integer id, DivisionRequestDTO dto) {
        Division division = getActiveDivision(id);
        String divisionName = normalize(dto.divisionName());

        divisionRepository.findByDivisionNameIgnoreCase(divisionName)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new RuntimeException("Division already exists: " + divisionName);
                });

        division.setDivisionName(divisionName);
        return toDivisionDto(divisionRepository.save(division));
    }

    public void deleteDivision(Integer id) {
        Division division = getActiveDivision(id);
        division.setIsDeleted(true);
        divisionRepository.save(division);
    }

    @Transactional(readOnly = true)
    public List<DepartmentDatResponseDTO> getAllDepartmentDats() {
        return departmentDatRepository.findAllByIsDeletedFalse().stream()
                .map(this::toDepartmentDatDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public DepartmentDatResponseDTO getDepartmentDatById(Integer id) {
        return toDepartmentDatDto(getActiveDepartmentDat(id));
    }

    @Transactional(readOnly = true)
    public List<DepartmentDatResponseDTO> getDepartmentDatsByDivision(Integer divisionId) {
        Division division = getActiveDivision(divisionId);
        return departmentDatRepository.findAllByDivisionAndIsDeletedFalse(division).stream()
                .map(this::toDepartmentDatDto)
                .toList();
    }

    public DepartmentDatResponseDTO createDepartmentDat(DepartmentDatRequestDTO dto) {
        Division division = getActiveDivision(dto.divisionId());
        String deptName = normalize(dto.deptName());
        DepartmentDat existing = departmentDatRepository.findByDeptNameIgnoreCaseAndDivision(deptName, division)
                .orElse(null);
        if (existing != null) {
            if (Boolean.TRUE.equals(existing.getIsDeleted())) {
                existing.setIsDeleted(false);
                existing.setDeptName(deptName);
                existing.setDivision(division);
                return toDepartmentDatDto(departmentDatRepository.save(existing));
            }
            throw new RuntimeException("Department DAT already exists under division: " + deptName);
        }

        DepartmentDat departmentDat = new DepartmentDat();
        departmentDat.setDivision(division);
        departmentDat.setDeptName(deptName);
        departmentDat.setIsDeleted(false);
        return toDepartmentDatDto(departmentDatRepository.save(departmentDat));
    }

    public DepartmentDatResponseDTO updateDepartmentDat(Integer id, DepartmentDatRequestDTO dto) {
        DepartmentDat departmentDat = getActiveDepartmentDat(id);
        Division division = getActiveDivision(dto.divisionId());
        String deptName = normalize(dto.deptName());

        departmentDatRepository.findByDeptNameIgnoreCaseAndDivision(deptName, division)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new RuntimeException("Department DAT already exists under division: " + deptName);
                });

        departmentDat.setDivision(division);
        departmentDat.setDeptName(deptName);
        return toDepartmentDatDto(departmentDatRepository.save(departmentDat));
    }

    public void deleteDepartmentDat(Integer id) {
        DepartmentDat departmentDat = getActiveDepartmentDat(id);
        departmentDat.setIsDeleted(true);
        departmentDatRepository.save(departmentDat);
    }

    @Transactional(readOnly = true)
    public List<TeamResponseDTO> getAllTeams() {
        return teamRepository.findAllByIsDeletedFalse().stream()
                .map(this::toTeamDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeamResponseDTO getTeamById(Integer id) {
        return toTeamDto(getActiveTeam(id));
    }

    @Transactional(readOnly = true)
    public List<TeamResponseDTO> getTeamsByDepartmentDat(Integer departmentDatId) {
        DepartmentDat departmentDat = getActiveDepartmentDat(departmentDatId);
        return teamRepository.findAllByDepartmentDatAndIsDeletedFalse(departmentDat).stream()
                .map(this::toTeamDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TeamResponseDTO> getTeamsByDivision(Integer divisionId) {
        Division division = getActiveDivision(divisionId);
        return teamRepository.findAllByDepartmentDatDivisionAndIsDeletedFalse(division).stream()
                .map(this::toTeamDto)
                .toList();
    }

    public TeamResponseDTO createTeam(TeamRequestDTO dto) {
        DepartmentDat departmentDat = getActiveDepartmentDat(dto.departmentDatId());
        String teamName = normalize(dto.teamName());
        Team existing = teamRepository.findByTeamNameIgnoreCaseAndDepartmentDat(teamName, departmentDat)
                .orElse(null);
        if (existing != null) {
            if (Boolean.TRUE.equals(existing.getIsDeleted())) {
                existing.setIsDeleted(false);
                existing.setTeamName(teamName);
                existing.setDepartmentDat(departmentDat);
                return toTeamDto(teamRepository.save(existing));
            }
            throw new RuntimeException("Team already exists under department DAT: " + teamName);
        }

        Team team = new Team();
        team.setDepartmentDat(departmentDat);
        team.setTeamName(teamName);
        team.setIsDeleted(false);
        return toTeamDto(teamRepository.save(team));
    }

    public TeamResponseDTO updateTeam(Integer id, TeamRequestDTO dto) {
        Team team = getActiveTeam(id);
        DepartmentDat departmentDat = getActiveDepartmentDat(dto.departmentDatId());
        String teamName = normalize(dto.teamName());

        teamRepository.findByTeamNameIgnoreCaseAndDepartmentDat(teamName, departmentDat)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new RuntimeException("Team already exists under department DAT: " + teamName);
                });

        team.setDepartmentDat(departmentDat);
        team.setTeamName(teamName);
        return toTeamDto(teamRepository.save(team));
    }

    public void deleteTeam(Integer id) {
        Team team = getActiveTeam(id);
        team.setIsDeleted(true);
        teamRepository.save(team);
    }

    private Division getActiveDivision(Integer id) {
        return divisionRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Division not found: " + id));
    }

    private DepartmentDat getActiveDepartmentDat(Integer id) {
        return departmentDatRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Department DAT not found: " + id));
    }

    private Team getActiveTeam(Integer id) {
        return teamRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Team not found: " + id));
    }

    private DivisionResponseDTO toDivisionDto(Division division) {
        return new DivisionResponseDTO(
                division.getId(),
                division.getDivisionName(),
                division.getIsDeleted());
    }

    private DepartmentDatResponseDTO toDepartmentDatDto(DepartmentDat departmentDat) {
        Division division = departmentDat.getDivision();
        return new DepartmentDatResponseDTO(
                departmentDat.getId(),
                division.getId(),
                division.getDivisionName(),
                departmentDat.getDeptName(),
                departmentDat.getIsDeleted());
    }

    private TeamResponseDTO toTeamDto(Team team) {
        DepartmentDat departmentDat = team.getDepartmentDat();
        Division division = departmentDat.getDivision();
        return new TeamResponseDTO(
                team.getId(),
                departmentDat.getId(),
                departmentDat.getDeptName(),
                division.getId(),
                division.getDivisionName(),
                team.getTeamName(),
                team.getIsDeleted());
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        return value.trim();
    }
}
