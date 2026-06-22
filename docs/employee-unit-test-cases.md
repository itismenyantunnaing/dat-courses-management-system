# Employee Unit Test Cases

## Scope

These test cases cover unit testing for `EmployeeController` and `EmployeeService` in the backend employee module.

## Test Environment

| Item | Value |
| --- | --- |
| Date recorded | 2026-06-18 |
| Backend test command | `./mvnw.cmd '-Dtest=EmployeeControllerTest,EmployeeServiceTest' test` |
| Test type | Unit tests |
| Database required | No |
| Spring application context required | No |

## EmployeeController Test Cases

| ID | Test case | Expected result | Status |
| --- | --- | --- | --- |
| TC-EMP-CTRL-001 | Get all employees without filters | Calls `service.getAll()` and returns `200 OK` | Passed |
| TC-EMP-CTRL-002 | Get employees by name filter | Calls `service.searchByName(name)` and returns `200 OK` | Passed |
| TC-EMP-CTRL-003 | Get employees by status filter | Calls `service.getByStatus(status)` and returns `200 OK` | Passed |
| TC-EMP-CTRL-004 | Get employee by ID | Calls `service.getById(id)` and returns `200 OK` | Passed |
| TC-EMP-CTRL-005 | Get deleted employees | Calls `service.getDeleted()` and returns `200 OK` | Passed |
| TC-EMP-CTRL-006 | Create employee | Calls `service.create(dto)` and returns `201 Created` | Passed |
| TC-EMP-CTRL-007 | Bulk create employees | Returns created employee list with `201 Created` | Passed |
| TC-EMP-CTRL-008 | Update employee | Calls `service.update(id, dto)` and returns `200 OK` | Passed |
| TC-EMP-CTRL-009 | Resign employee | Calls `service.resign(id)` and returns inactive employee | Passed |
| TC-EMP-CTRL-010 | Delete employee | Calls `service.softDelete(id)` and returns `204 No Content` | Passed |
| TC-EMP-CTRL-011 | Restore employee | Calls `service.restore(id)` and returns `200 OK` | Passed |

## EmployeeService Test Cases

| ID | Test case | Expected result | Status |
| --- | --- | --- | --- |
| TC-EMP-SVC-001 | Get all active employees | Maps active employee entities to response DTOs | Passed |
| TC-EMP-SVC-002 | Get missing employee by ID | Throws `Employee not found: <id>` | Passed |
| TC-EMP-SVC-003 | Create duplicate active Staff ID | Throws duplicate Staff ID error and does not save | Passed |
| TC-EMP-SVC-004 | Create employee with default values | Applies default password/status/boolean values and saves | Passed |
| TC-EMP-SVC-005 | Create employee with existing team chain and role | Resolves division, department, team, role, and maps response | Passed |
| TC-EMP-SVC-006 | Update employee with blank password | Updates fields and keeps existing password | Passed |
| TC-EMP-SVC-007 | Resign employee | Sets employee status to inactive | Passed |
| TC-EMP-SVC-008 | Soft delete employee | Sets `isDeleted` to true and saves | Passed |
| TC-EMP-SVC-009 | Restore employee | Sets `isDeleted` to false and saves | Passed |
| TC-EMP-SVC-010 | Bulk create mixed valid/invalid rows | Separates created and failed rows with correct counts | Passed |

## Result Summary

Executed on 2026-06-18.

| Metric | Result |
| --- | --- |
| EmployeeController tests | 11 passed, 0 failed, 0 errors, 0 skipped |
| EmployeeService tests | 10 passed, 0 failed, 0 errors, 0 skipped |
| Total | 21 passed, 0 failed, 0 errors, 0 skipped |
| Build result | Success |

## Notes

- Tests are unit-level and use Mockito mocks for service and repository dependencies.
- Tests do not require MySQL or a running Spring Boot application.
- Maven emitted Mockito/JDK dynamic-agent warnings during the run; these warnings did not affect the test result.
