package com.dat_management.backend.controller;

import com.dat_management.backend.dto.OrganizationDtos.DepartmentDatRequestDTO;
import com.dat_management.backend.dto.OrganizationDtos.DepartmentDatResponseDTO;
import com.dat_management.backend.dto.OrganizationDtos.DivisionRequestDTO;
import com.dat_management.backend.dto.OrganizationDtos.DivisionResponseDTO;
import com.dat_management.backend.dto.OrganizationDtos.TeamRequestDTO;
import com.dat_management.backend.dto.OrganizationDtos.TeamResponseDTO;
import com.dat_management.backend.service.AuditLogService;
import com.dat_management.backend.service.OrganizationStructureService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrganizationStructureController {

    private static final String DIVISIONS_MODULE = "DIVISIONS";
    private static final String DEPARTMENTS_MODULE = "DEPARTMENTS";
    private static final String TEAMS_MODULE = "TEAMS";

    private final OrganizationStructureService service;
    private final AuditLogService auditLogService;
    private final HttpServletRequest httpServletRequest;

    @GetMapping("/divisions")
    public ResponseEntity<List<DivisionResponseDTO>> getAllDivisions() {
        return ResponseEntity.ok(service.getAllDivisions());
    }

    @GetMapping("/divisions/{id}")
    public ResponseEntity<?> getDivisionById(@PathVariable Integer id) {
        return handle(() -> ResponseEntity.ok(service.getDivisionById(id)));
    }

    @GetMapping("/divisions/{id}/departments-dat")
    public ResponseEntity<?> getDepartmentDatsByDivision(@PathVariable Integer id) {
        return handle(() -> ResponseEntity.ok(service.getDepartmentDatsByDivision(id)));
    }

    @GetMapping("/divisions/{id}/teams")
    public ResponseEntity<?> getTeamsByDivision(@PathVariable Integer id) {
        return handle(() -> ResponseEntity.ok(service.getTeamsByDivision(id)));
    }

    @PostMapping("/divisions")
    public ResponseEntity<?> createDivision(@Valid @RequestBody DivisionRequestDTO dto) {
        return handle(() -> {
            DivisionResponseDTO created = service.createDivision(dto);
            auditLogService.log("Create", DIVISIONS_MODULE,
                    "New division created - " + created.divisionName(),
                    null, created, httpServletRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        });
    }

    @PutMapping("/divisions/{id}")
    public ResponseEntity<?> updateDivision(@PathVariable Integer id, @Valid @RequestBody DivisionRequestDTO dto) {
        return handle(() -> {
            DivisionResponseDTO oldValue = service.getDivisionById(id);
            DivisionResponseDTO updated = service.updateDivision(id, dto);
            auditLogService.log("Update", DIVISIONS_MODULE,
                    "Division updated - " + id, oldValue, updated, httpServletRequest);
            return ResponseEntity.ok(updated);
        });
    }

    @DeleteMapping("/divisions/{id}")
    public ResponseEntity<?> deleteDivision(@PathVariable Integer id) {
        return handle(() -> {
            DivisionResponseDTO oldValue = service.getDivisionById(id);
            service.deleteDivision(id);
            auditLogService.log("Delete", DIVISIONS_MODULE,
                    "Division removed - " + id, oldValue, null, httpServletRequest);
            return ResponseEntity.noContent().build();
        });
    }

    @GetMapping("/departments-dat")
    public ResponseEntity<List<DepartmentDatResponseDTO>> getAllDepartmentDats() {
        return ResponseEntity.ok(service.getAllDepartmentDats());
    }

    @GetMapping("/departments-dat/{id}")
    public ResponseEntity<?> getDepartmentDatById(@PathVariable Integer id) {
        return handle(() -> ResponseEntity.ok(service.getDepartmentDatById(id)));
    }

    @GetMapping("/departments-dat/{id}/teams")
    public ResponseEntity<?> getTeamsByDepartmentDat(@PathVariable Integer id) {
        return handle(() -> ResponseEntity.ok(service.getTeamsByDepartmentDat(id)));
    }

    @PostMapping("/departments-dat")
    public ResponseEntity<?> createDepartmentDat(@Valid @RequestBody DepartmentDatRequestDTO dto) {
        return handle(() -> {
            DepartmentDatResponseDTO created = service.createDepartmentDat(dto);
            auditLogService.log("Create", DEPARTMENTS_MODULE,
                    "New department created - " + created.deptName(),
                    null, created, httpServletRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        });
    }

    @PutMapping("/departments-dat/{id}")
    public ResponseEntity<?> updateDepartmentDat(@PathVariable Integer id,
                                                 @Valid @RequestBody DepartmentDatRequestDTO dto) {
        return handle(() -> {
            DepartmentDatResponseDTO oldValue = service.getDepartmentDatById(id);
            DepartmentDatResponseDTO updated = service.updateDepartmentDat(id, dto);
            auditLogService.log("Update", DEPARTMENTS_MODULE,
                    "Department updated - " + id, oldValue, updated, httpServletRequest);
            return ResponseEntity.ok(updated);
        });
    }

    @DeleteMapping("/departments-dat/{id}")
    public ResponseEntity<?> deleteDepartmentDat(@PathVariable Integer id) {
        return handle(() -> {
            DepartmentDatResponseDTO oldValue = service.getDepartmentDatById(id);
            service.deleteDepartmentDat(id);
            auditLogService.log("Delete", DEPARTMENTS_MODULE,
                    "Department removed - " + id, oldValue, null, httpServletRequest);
            return ResponseEntity.noContent().build();
        });
    }

    @GetMapping("/teams")
    public ResponseEntity<List<TeamResponseDTO>> getAllTeams() {
        return ResponseEntity.ok(service.getAllTeams());
    }

    @GetMapping("/teams/{id}")
    public ResponseEntity<?> getTeamById(@PathVariable Integer id) {
        return handle(() -> ResponseEntity.ok(service.getTeamById(id)));
    }

    @PostMapping("/teams")
    public ResponseEntity<?> createTeam(@Valid @RequestBody TeamRequestDTO dto) {
        return handle(() -> {
            TeamResponseDTO created = service.createTeam(dto);
            auditLogService.log("Create", TEAMS_MODULE,
                    "New team created - " + created.teamName(),
                    null, created, httpServletRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        });
    }

    @PutMapping("/teams/{id}")
    public ResponseEntity<?> updateTeam(@PathVariable Integer id, @Valid @RequestBody TeamRequestDTO dto) {
        return handle(() -> {
            TeamResponseDTO oldValue = service.getTeamById(id);
            TeamResponseDTO updated = service.updateTeam(id, dto);
            auditLogService.log("Update", TEAMS_MODULE,
                    "Team updated - " + id, oldValue, updated, httpServletRequest);
            return ResponseEntity.ok(updated);
        });
    }

    @DeleteMapping("/teams/{id}")
    public ResponseEntity<?> deleteTeam(@PathVariable Integer id) {
        return handle(() -> {
            TeamResponseDTO oldValue = service.getTeamById(id);
            service.deleteTeam(id);
            auditLogService.log("Delete", TEAMS_MODULE,
                    "Team removed - " + id, oldValue, null, httpServletRequest);
            return ResponseEntity.noContent().build();
        });
    }

    private ResponseEntity<?> handle(ResponseSupplier supplier) {
        try {
            return supplier.get();
        } catch (RuntimeException e) {
            HttpStatus status = isNotFound(e.getMessage()) ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    private boolean isNotFound(String message) {
        return message != null && message.contains("not found");
    }

    @FunctionalInterface
    private interface ResponseSupplier {
        ResponseEntity<?> get();
    }
}