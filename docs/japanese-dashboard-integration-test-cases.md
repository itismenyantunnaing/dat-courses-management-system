# JapaneseDashboard Integration Test Cases

## Scope

These test cases cover backend integration testing for the JapaneseDashboard module through `JapaneseDashboardControllerIntegrationTest`. They exercise the real HTTP endpoint, controller, service aggregation logic, repositories, entity mappings, H2 test database, security permit rules, and JSON response shape.

## Test Environment

| Item | Value |
| --- | --- |
| Date recorded | 2026-06-25 |
| Backend test command | `./mvnw.cmd "-Dtest=JapaneseDashboardControllerIntegrationTest" test` |
| Actual conducted command | `./mvnw.cmd "-Dtest=JapaneseDashboardServiceTest,JapaneseDashboardControllerTest,JapaneseDashboardControllerIntegrationTest" test` |
| Test type | Backend integration tests |
| Test database | H2 in-memory database via `application-test.properties` |
| Spring context | `@SpringBootTest` with `@AutoConfigureMockMvc` |
| Endpoint under test | `GET /api/japanese-dashboard` |

## Test Cases Matrix

| Test Case ID | Feature | Description | Expected Result | Status(Pass/Fail) |
| --- | --- | --- | --- | --- |
| TC-JD-INT-001 | Empty Dashboard Endpoint | Get dashboard when database has no Japanese profiles or active target term | Returns `200 OK`; response contains zero-count grand-total rows and communication capability rows | Pass |
| TC-JD-INT-002 | Calculated Dashboard Endpoint | Get dashboard after seeding active target term and two profiles in one team | Returns `200 OK`; response includes formatted target dates, department counts, team JLPT counts, no-cert counts, and communication counts | Pass |
| TC-JD-INT-003 | Deleted Employee Filtering | Get dashboard when one active and one deleted employee both have Japanese profiles | Returns `200 OK`; deleted employee profile is excluded from dashboard totals | Pass |
| TC-JD-INT-004 | Communication Bucket Mapping | Get dashboard with Level 2 G1/G2/G3 communication values | Returns `200 OK`; response maps current, target1, and target2 communication values into correct buckets | Pass |

## Result Summary

Executed on 2026-06-25.

| Metric | Result |
| --- | --- |
| `JapaneseDashboardControllerIntegrationTest` | 4 passed, 0 failed, 0 errors, 0 skipped |
| Build result | Success |

## Notes

- Tests seed Division, DepartmentDat, Team, Employee, EmployeeJapaneseProfile, and TargetTerm data directly through repositories.
- Tests run with `@ActiveProfiles("test")` and the H2 in-memory test database.
- The nested JLPT count JSON uses uppercase keys such as `N1`, `N2`, and `N3`.
- Maven emitted SQL/debug and security filter logs during execution; these messages did not affect the test result.
