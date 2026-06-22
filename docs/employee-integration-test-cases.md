# Employee Integration Test Cases

## Scope

These test cases cover backend integration testing for the Employee module. They exercise the HTTP controller, validation layer, service logic, JPA repositories, entity mappings, and the H2 test database through `MockMvc`.

## Test Environment

| Item | Value |
| --- | --- |
| Date recorded | 2026-06-22 |
| Backend test command | `./mvnw.cmd '-Dtest=EmployeeControllerIntegrationTest' test` |
| Test type | Backend integration tests |
| Test database | H2 in-memory database via `application-test.properties` |
| Spring context | `@SpringBootTest` with `@AutoConfigureMockMvc` |

## Test Cases Matrix

| Test Case ID | Feature | Description | Expected Result | Status(Pass/Fail) |
| --- | --- | --- | --- | --- |
| TC-EMP-INT-001 | Employee Create | Create employee with valid payload and organization fields | Returns `201 Created`; employee is persisted and response contains mapped division, department, team, and role | Pass |
| TC-EMP-INT-002 | Employee Validation | Create employee without Staff ID | Returns `400 Bad Request` | Pass |
| TC-EMP-INT-003 | Employee List | Get all non-deleted employees | Returns `200 OK` with employee list | Pass |
| TC-EMP-INT-004 | Employee Detail | Get employee by existing Staff ID | Returns `200 OK` with matching employee data | Pass |
| TC-EMP-INT-005 | Employee Search | Search employees by name query parameter | Returns `200 OK` with matching employees only | Pass |
| TC-EMP-INT-006 | Employee Status Filter | Filter employees by `empStatus` | Returns `200 OK` with matching status only | Pass |
| TC-EMP-INT-007 | Employee Update | Update existing employee fields | Returns `200 OK` with updated name and role | Pass |
| TC-EMP-INT-008 | Employee Resign | Resign existing employee | Returns `200 OK`; employee `emp_status` becomes `inactive` | Pass |
| TC-EMP-INT-009 | Employee Delete | Soft delete one existing employee | Returns `200 OK`; response contains deleted ID and count | Pass |
| TC-EMP-INT-010 | Employee Bulk Delete | Delete mixed existing and missing IDs | Returns `206 Partial Content`; response contains deleted ID, failed ID, and error message | Pass |
| TC-EMP-INT-011 | Deleted Employee List | Get deleted employees after soft delete | Returns `200 OK` with deleted employee list | Pass |
| TC-EMP-INT-012 | Employee Restore | Restore deleted employee | Returns `200 OK`; employee appears again in active list | Pass |

## Result Summary

Executed on 2026-06-22.

| Metric | Result |
| --- | --- |
| Employee integration tests | 12 passed, 0 failed, 0 errors, 0 skipped |
| Build result | Success |

## Notes

- Tests use `@SpringBootTest`, `@AutoConfigureMockMvc`, and `@ActiveProfiles("test")`.
- Tests run against the H2 in-memory database from `backend/src/test/resources/application-test.properties`.
- `com.h2database:h2` was added with test scope so the existing H2 test profile can start successfully.
- Maven emitted Mockito/JDK and SQL debug output during the run; these messages did not affect the test result.
