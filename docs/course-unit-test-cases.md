# Course Unit Test Cases

## Scope

These test cases cover unit testing for the Course backend module. They test course creation, category creation, soft delete, session status update, enrollment, self-study progress creation, attendance validation, and controller response mapping with mocked dependencies.

## Test Environment

| Item | Value |
| --- | --- |
| Date recorded | 2026-07-16 |
| Backend test command | `.\mvnw.cmd "-Dtest=CourseServiceTest,CourseEnrollmentServiceTest,AttendanceServiceTest,CourseControllerTest,CourseControllerIntegrationTest" test` |
| Test type | Unit and controller tests |
| Database required | No |
| Spring application context required | No |
| Mocking framework | Mockito |

## Test Cases Matrix

| Test Case ID | Feature | Description | Expected Result | Status(Pass/Fail) |
| --- | --- | --- | --- | --- |
| TC-COURSE-SVC-001 | Category Creation | Create valid trainer category | Saves active category and returns category response | Pass |
| TC-COURSE-SVC-002 | Course Creation | Create trainer course with group and sessions | Saves course, group, sessions, and returns nested course response | Pass |
| TC-COURSE-SVC-003 | Course Delete | Soft delete course with image | Marks course as deleted, saves course, and deletes stored image | Pass |
| TC-COURSE-SVC-004 | Session Status | Update session status | Updates matching session status and returns updated course structure | Pass |
| TC-COURSE-ENR-001 | Trainer Enrollment | Enroll employee into trainer course | Saves approved enrollment and returns enrollment response | Pass |
| TC-COURSE-ENR-002 | Duplicate Enrollment | Enroll same employee in same course twice | Throws conflict error and does not save a second enrollment | Pass |
| TC-COURSE-ENR-003 | Self-study Enrollment | Enroll employee into JLPT self-study course | Saves enrollment and creates progress records with deadlines | Pass |
| TC-COURSE-ATT-001 | Attendance Creation | Create attendance for valid course, group, session, and enrollment | Saves attendance record and returns attendance response | Pass |
| TC-COURSE-ATT-002 | Duplicate Attendance | Create attendance for same enrollment and session twice | Throws duplicate attendance error and does not save | Pass |
| TC-COURSE-ATT-003 | Attendance Validation | Create attendance for enrollment from different group | Throws validation error and does not save | Pass |
| TC-COURSE-CTRL-001 | Course List Mapping | Get all courses through controller | Returns `200 OK` with course payload | Pass |
| TC-COURSE-CTRL-002 | Missing Course Mapping | Get missing course by ID through controller | Returns `404 Not Found` with error response | Pass |
| TC-COURSE-CTRL-003 | Category Mapping | Create category through controller | Returns `201 Created` with category payload | Pass |

## Result Summary

Executed on 2026-07-16.

| Metric | Result |
| --- | --- |
| `CourseServiceTest` | 4 passed, 0 failed, 0 errors, 0 skipped |
| `CourseEnrollmentServiceTest` | 3 passed, 0 failed, 0 errors, 0 skipped |
| `AttendanceServiceTest` | 3 passed, 0 failed, 0 errors, 0 skipped |
| `CourseControllerTest` | 3 passed, 0 failed, 0 errors, 0 skipped |
| Course unit/controller test total | 13 passed, 0 failed, 0 errors, 0 skipped |
| Build result | Success |

## Notes

- Unit tests use Mockito mocks for repositories, services, and file storage dependencies.
- Controller unit tests call `CourseController` methods directly without starting Spring Boot.
- The test run also included `CourseControllerIntegrationTest`; integration coverage is documented separately.
- A baseline compile issue in `CertificateService` was corrected before the course test suite could run.
