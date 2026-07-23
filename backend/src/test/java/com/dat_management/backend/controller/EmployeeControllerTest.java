package com.dat_management.backend.controller;

import com.dat_management.backend.dto.EmployeeRequestDTO;
import com.dat_management.backend.dto.EmployeeResponseDTO;
import com.dat_management.backend.service.AuditLogService;
import com.dat_management.backend.service.EmployeeService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeControllerTest {

    @Mock
    private EmployeeService service;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private HttpServletRequest httpServletRequest;

    @Test
    void getAllWithoutFiltersReturnsAllEmployees() {
        EmployeeController controller = new EmployeeController(service, auditLogService, httpServletRequest);
        List<EmployeeResponseDTO> employees = List.of(response("EMP001", "Alice Admin"));

        when(service.getAll()).thenReturn(employees);

        ResponseEntity<List<EmployeeResponseDTO>> response = controller.getAll(null, null);

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(employees, response.getBody());
        verify(service).getAll();
    }

    @Test
    void getAllWithNameFilterSearchesByName() {
        EmployeeController controller = new EmployeeController(service, auditLogService, httpServletRequest);
        List<EmployeeResponseDTO> employees = List.of(response("EMP001", "Alice Admin"));

        when(service.searchByName("Alice")).thenReturn(employees);

        ResponseEntity<List<EmployeeResponseDTO>> response = controller.getAll("Alice", null);

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(employees, response.getBody());
        verify(service).searchByName("Alice");
    }

    @Test
    void getAllWithStatusFilterReturnsEmployeesByStatus() {
        EmployeeController controller = new EmployeeController(service, auditLogService, httpServletRequest);
        List<EmployeeResponseDTO> employees = List.of(response("EMP002", "Bob Staff"));

        when(service.getByStatus("inactive")).thenReturn(employees);

        ResponseEntity<List<EmployeeResponseDTO>> response = controller.getAll(null, "inactive");

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(employees, response.getBody());
        verify(service).getByStatus("inactive");
    }

    @Test
    void getByIdReturnsEmployee() {
        EmployeeController controller = new EmployeeController(service, auditLogService, httpServletRequest);
        EmployeeResponseDTO employee = response("EMP001", "Alice Admin");

        when(service.getById("EMP001")).thenReturn(employee);

        ResponseEntity<EmployeeResponseDTO> response = controller.getById("EMP001");

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(employee, response.getBody());
    }

    @Test
    void getDeletedReturnsDeletedEmployees() {
        EmployeeController controller = new EmployeeController(service, auditLogService, httpServletRequest);
        List<EmployeeResponseDTO> employees = List.of(response("EMP003", "Deleted User"));

        when(service.getDeleted()).thenReturn(employees);

        ResponseEntity<List<EmployeeResponseDTO>> response = controller.getDeleted();

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(employees, response.getBody());
    }

    @Test
    void createReturnsCreatedEmployee() {
        EmployeeController controller = new EmployeeController(service, auditLogService, httpServletRequest);
        EmployeeRequestDTO request = request("EMP001", "Alice Admin");
        EmployeeResponseDTO employee = response("EMP001", "Alice Admin");

        when(service.create(request)).thenReturn(employee);

        ResponseEntity<EmployeeResponseDTO> response = controller.create(request);

        Assertions.assertEquals(HttpStatus.CREATED, response.getStatusCode());
        Assertions.assertEquals(employee, response.getBody());
    }

    @Test
    void createBulkReturnsCreatedEmployeesOnly() {
        EmployeeController controller = new EmployeeController(service, auditLogService, httpServletRequest);
        List<EmployeeRequestDTO> requests = List.of(request("EMP001", "Alice Admin"));
        List<EmployeeResponseDTO> created = List.of(response("EMP001", "Alice Admin"));

        when(service.createBulk(requests)).thenReturn(Map.of("created", created));

        ResponseEntity<List<EmployeeResponseDTO>> response = controller.createBulk(requests);

        Assertions.assertEquals(HttpStatus.CREATED, response.getStatusCode());
        Assertions.assertEquals(created, response.getBody());
    }

    @Test
    void updateReturnsUpdatedEmployee() {
        EmployeeController controller = new EmployeeController(service, auditLogService, httpServletRequest);
        EmployeeRequestDTO request = request("EMP001", "Alice Updated");
        EmployeeResponseDTO employee = response("EMP001", "Alice Updated");

        when(service.update("EMP001", request)).thenReturn(employee);

        ResponseEntity<EmployeeResponseDTO> response = controller.update("EMP001", request);

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(employee, response.getBody());
    }

    @Test
    void resignReturnsInactiveEmployee() {
        EmployeeController controller = new EmployeeController(service, auditLogService, httpServletRequest);
        EmployeeResponseDTO employee = response("EMP001", "Alice Admin");
        employee.setEmpStatus("inactive");

        when(service.resign("EMP001")).thenReturn(employee);

        ResponseEntity<EmployeeResponseDTO> response = controller.resign("EMP001");

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals("inactive", response.getBody().getEmpStatus());
    }

    @Test
    void deleteSoftDeletesEmployeeAndReturnsSuccessResponse() {
        EmployeeController controller = new EmployeeController(service, auditLogService, httpServletRequest);

        ResponseEntity<Map<String, Object>> response = controller.delete(List.of("EMP001"));

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(true, response.getBody().get("success"));
        Assertions.assertEquals(List.of("EMP001"), response.getBody().get("deletedIds"));
        Assertions.assertEquals(1, response.getBody().get("totalDeleted"));
        verify(service).softDelete("EMP001");
    }

    @Test
    void restoreReturnsRestoredEmployee() {
        EmployeeController controller = new EmployeeController(service, auditLogService, httpServletRequest);
        EmployeeResponseDTO employee = response("EMP001", "Alice Admin");

        when(service.restore("EMP001")).thenReturn(employee);

        ResponseEntity<EmployeeResponseDTO> response = controller.restore("EMP001");

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(employee, response.getBody());
    }

    private static EmployeeRequestDTO request(String id, String name) {
        return EmployeeRequestDTO.builder()
                .id(id)
                .name(name)
                .build();
    }

    private static EmployeeResponseDTO response(String id, String name) {
        return EmployeeResponseDTO.builder()
                .id(id)
                .name(name)
                .empStatus("active")
                .status("default")
                .build();
    }
}
