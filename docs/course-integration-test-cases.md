# Course Integration Test Cases

## Scope

These test cases cover backend integration testing for the Course module through `CourseControllerIntegrationTest`. They exercise HTTP endpoints, multipart course creation, repository persistence, nested course retrieval, enrollment, self-study progress creation, attendance creation, and group-change approval using Spring Boot, MockMvc, and the H2 test database.

## Test Environment

| Item | Value |
| --- | --- |
| Date recorded | 2026-07-16 |
| Backend test command | `.\mvnw.cmd "-Dtest=CourseServiceTest,CourseEnrollmentServiceTest,AttendanceServiceTest,CourseControllerTest,CourseControllerIntegrationTest" test` |
| Test type | Backend integration tests |
| Test database | H2 in-memory database via `application-test.properties` |
| Spring context | `@SpringBootTest` with `@AutoConfigureMockMvc` |
| Test upload directory | `backend/target/course-test-uploads` |
| SQL initialization | Disabled for this test class with `spring.sql.init.mode=never` |

## Test Cases Matrix

| Test Case ID | Feature | Description | Expected Result | Status(Pass/Fail) |
| --- | --- | --- | --- | --- |
| TC-COURSE-INT-001 | Course Creation | Create trainer course through HTTP multipart endpoint | Returns `201 Created` and persists course, group, and session records | Pass |
| TC-COURSE-INT-002 | Course Detail | Get existing trainer course by ID | Returns `200 OK` with nested groups and sessions | Pass |
| TC-COURSE-INT-003 | Self-study Enrollment | Enroll employee into self-study course through HTTP endpoint | Returns `201 Created`, persists enrollment, and creates progress records | Pass |
| TC-COURSE-INT-004 | Attendance Creation | Create attendance for valid enrollment and session through HTTP endpoint | Returns created attendance record and persists attendance data | Pass |
| TC-COURSE-INT-005 | Group Change Approval | Approve pending group-change request through HTTP endpoint | Returns success response and moves enrollment to requested group | Pass |

## Result Summary

Executed on 2026-07-16.

| Metric | Result |
| --- | --- |
| `CourseControllerIntegrationTest` | 5 passed, 0 failed, 0 errors, 0 skipped |
| Build result | Success |

## Notes

- Tests use H2 through `@ActiveProfiles("test")`.
- Tests use MockMvc to exercise controller routing, service logic, repositories, and entity mappings together.
- The test class overrides `file.upload-dir` to keep course upload artifacts under `target/course-test-uploads`.
- SQL initialization is disabled for this integration class because the global `data.sql` script is MySQL-specific and is not required for these test fixtures.
