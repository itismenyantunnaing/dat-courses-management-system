# TargetTerm Integration Test Cases

## Scope

These test cases cover backend integration testing for the TargetTerm module through `TargetTermControllerIntegrationTest`. They exercise controller endpoints, service behavior, repository access, entity persistence, active filtering, update semantics, delete behavior, and the H2 test database through `MockMvc`.

## Test Environment

| Item | Value |
| --- | --- |
| Date recorded | 2026-06-22 |
| Backend test command | `./mvnw.cmd '-Dtest=TargetTermControllerIntegrationTest' test` |
| Test type | Backend integration tests |
| Test database | H2 in-memory database via `application-test.properties` |
| Spring context | `@SpringBootTest` with `@AutoConfigureMockMvc` |

## Test Cases Matrix

| Test Case ID | Feature | Description | Expected Result | Status(Pass/Fail) |
| --- | --- | --- | --- | --- |
| TC-TT-GET-ALL-01 | TargetTerm List | Get all target terms when database is empty | Returns `200 OK` with an empty list | Pass |
| TC-TT-CREATE-01 | TargetTerm Create | Create target term without `isActive` | Returns `201 Created`; `isActive` defaults to `true` | Pass |
| TC-TT-CREATE-02 | TargetTerm Create | Create inactive target term with `isActive=false` | Returns `201 Created`; response contains `isActive=false` | Pass |
| TC-TT-GET-ALL-02 | TargetTerm List | Get all target terms when records exist | Returns `200 OK` with all target term records | Pass |
| TC-TT-GET-ACTIVE-01 | TargetTerm Active Filter | Get active target terms | Returns `200 OK` with active records only | Pass |
| TC-TT-GET-BY-ID-01 | TargetTerm Detail | Get target term by valid ID | Returns `200 OK` with matching date fields and active flag | Pass |
| TC-TT-UPDATE-01 | TargetTerm Update | Update target term dates and active flag | Returns `200 OK` with updated dates and `isActive=false` | Pass |
| TC-TT-UPDATE-02 | TargetTerm Update | Update target term without `isActive` | Returns `200 OK`; existing active flag is preserved | Pass |
| TC-TT-DELETE-01 | TargetTerm Delete | Delete target term by valid ID | Returns `204 No Content`; record is removed from list | Pass |
| TC-TT-DELETE-LIST-01 | TargetTerm Delete List | Delete multiple target terms by request body ID list | Returns `204 No Content`; requested records are removed | Pass |

## Result Summary

Executed on 2026-06-22.

| Metric | Result |
| --- | --- |
| TargetTerm integration tests | 10 passed, 0 failed, 0 errors, 0 skipped |
| Build result | Success |

## Notes

- Tests use `@SpringBootTest`, `@AutoConfigureMockMvc`, `@ActiveProfiles("test")`, and transactional rollback.
- Tests run against the H2 in-memory database from `backend/src/test/resources/application-test.properties`.
- TargetTerm request validation is not implemented yet, so these integration cases focus on currently supported successful API behavior.
- Maven emitted SQL/debug output during the run; these messages did not affect the test result.
