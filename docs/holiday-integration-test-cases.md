# Holiday Integration Test Cases

## Scope

These test cases cover backend integration testing for the Holiday module through `HolidayControllerIntegrationTest`. They exercise controller endpoints, validation, service logic, repository access, soft delete behavior, and the H2 test database through `MockMvc`.

## Test Environment

| Item | Value |
| --- | --- |
| Date recorded | 2026-06-22 |
| Backend test command | `./mvnw.cmd '-Dtest=HolidayControllerIntegrationTest' test` |
| Test type | Backend integration tests |
| Test database | H2 in-memory database via `application-test.properties` |
| Spring context | `@SpringBootTest` with `@AutoConfigureMockMvc` |

## Test Cases Matrix

| Test Case ID | Feature | Description | Expected Result | Status(Pass/Fail) |
| --- | --- | --- | --- | --- |
| TC-HOL-GET-ALL-01 | Holiday List | Get all holidays when records exist | Returns `200 OK` with a list containing holiday records | Pass |
| TC-HOL-GET-ALL-02 | Holiday List | Get all holidays when database is empty | Returns `200 OK` with an empty list | Pass |
| TC-HOL-GET-01 | Holiday Detail | Get holiday by valid ID | Returns `200 OK` with matching holiday ID, name, and date | Pass |
| TC-HOL-GET-02 | Holiday Detail | Get holiday by non-existent ID | Returns `404 Not Found` with `success=false` and not-found message | Pass |
| TC-HOL-CREATE-01 | Holiday Create | Create holiday with valid request | Returns `201 Created` with `success=true` | Pass |
| TC-HOL-CREATE-02 | Holiday Create | Create holiday with duplicate date | Returns `409 Conflict` with duplicate-date message | Pass |
| TC-HOL-CREATE-03 | Holiday Validation | Create holiday with missing date | Returns `400 Bad Request` | Pass |
| TC-HOL-CREATE-04 | Holiday Validation | Create holiday with missing name | Returns `400 Bad Request` | Pass |
| TC-HOL-CREATE-05 | Holiday Validation | Create holiday with invalid date format | Returns `409 Conflict` with invalid-date-format message | Pass |
| TC-HOL-CREATE-06 | Holiday Validation | Create holiday with empty JSON body | Returns `400 Bad Request` | Pass |
| TC-HOL-MULTI-01 | Holiday Bulk Create | Create list of valid holidays | Returns `201 Created` with `success=true` | Pass |
| TC-HOL-MULTI-02 | Holiday Bulk Create | Create list containing duplicate date | Returns `409 Conflict` with duplicate-date message | Pass |
| TC-HOL-MULTI-03 | Holiday Bulk Create | Create empty holiday list | Returns `201 Created` with `success=true` | Pass |
| TC-HOL-UPDATE-01 | Holiday Update | Update holiday with valid new data | Returns `200 OK` with `success=true` | Pass |
| TC-HOL-UPDATE-02 | Holiday Update | Update holiday with same date and new name | Returns `200 OK` with `success=true` | Pass |
| TC-HOL-UPDATE-03 | Holiday Update | Update holiday to another holiday's date | Returns `409 Conflict` with duplicate-date message | Pass |
| TC-HOL-UPDATE-04 | Holiday Update | Update non-existent holiday | Returns `404 Not Found` with not-found message | Pass |
| TC-HOL-DELETE-01 | Holiday Delete | Delete existing holiday | Returns `200 OK` with deleted ID in response | Pass |
| TC-HOL-DELETE-02 | Holiday Delete | Delete non-existent holiday | Returns `404 Not Found` with error details | Pass |
| TC-HOL-DELETE-03 | Holiday Delete | Delete mixed existing and non-existent IDs | Returns `206 Partial Content` with deleted and failed IDs | Pass |

## Result Summary

Executed on 2026-06-22.

| Metric | Result |
| --- | --- |
| Holiday integration tests | 20 passed, 0 failed, 0 errors, 0 skipped |
| Build result | Success |

## Notes

- Tests use `@SpringBootTest`, `@AutoConfigureMockMvc`, `@ActiveProfiles("test")`, and transactional rollback.
- Tests run against the H2 in-memory database from `backend/src/test/resources/application-test.properties`.
- Existing delete tests were updated to match the current list-style delete response from `HolidayController`.
- Maven emitted SQL/debug output during the run; these messages did not affect the test result.
