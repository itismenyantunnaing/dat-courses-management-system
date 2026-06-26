# JapaneseDashboard Unit Test Cases

## Scope

These test cases cover unit testing for the JapaneseDashboard backend module. They verify `JapaneseDashboardService` aggregation logic and `JapaneseDashboardController` response mapping without starting the Spring application context or using a database.

## Test Environment

| Item | Value |
| --- | --- |
| Date recorded | 2026-06-25 |
| Backend test command | `./mvnw.cmd "-Dtest=JapaneseDashboardServiceTest,JapaneseDashboardControllerTest" test` |
| Actual conducted command | `./mvnw.cmd "-Dtest=JapaneseDashboardServiceTest,JapaneseDashboardControllerTest,JapaneseDashboardControllerIntegrationTest" test` |
| Test type | Unit tests |
| Database required | No |
| Spring application context required | No |
| Mocking framework | Mockito |

## Test Cases Matrix

| Test Case ID | Feature | Description | Expected Result | Status(Pass/Fail) |
| --- | --- | --- | --- | --- |
| TC-JD-UNIT-001 | Dashboard Aggregation | Build dashboard with profiles and active target term | Formats target dates, builds department totals, team JLPT totals, communication totals, and no-cert member totals | Pass |
| TC-JD-UNIT-002 | Empty Dashboard | Build dashboard without profiles or active target term | Target dates remain null; dashboard sections contain grand-total rows and zero counts | Pass |
| TC-JD-UNIT-003 | Missing Team Handling | Build dashboard for profile whose employee has no team | Department is reported as `Unknown`; team-based sections skip the employee and keep grand-total rows | Pass |
| TC-JD-UNIT-004 | Invalid JLPT Handling | Build dashboard with invalid, blank, null, and explicit `None` JLPT values | Invalid/blank/null JLPT values are ignored; explicit `None` is counted only where expected | Pass |
| TC-JD-UNIT-005 | Controller Mapping | Call `JapaneseDashboardController.getDashboard()` with mocked service | Returns `200 OK` with the dashboard DTO returned by the service | Pass |

## Result Summary

Executed on 2026-06-25.

| Metric | Result |
| --- | --- |
| `JapaneseDashboardServiceTest` | 4 passed, 0 failed, 0 errors, 0 skipped |
| `JapaneseDashboardControllerTest` | 1 passed, 0 failed, 0 errors, 0 skipped |
| JapaneseDashboard unit test total | 5 passed, 0 failed, 0 errors, 0 skipped |
| Build result | Success |

## Notes

- Unit tests use mocked `EmployeeJapaneseProfileRepository`, `TargetTermRepository`, and `JapaneseDashboardService`.
- Tests verify business calculations directly from DTO objects, not JSON.
- Maven emitted Mockito/JDK warnings during execution; these warnings did not affect the test result.
