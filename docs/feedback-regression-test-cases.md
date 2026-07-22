# Feedback Regression Test Cases

## Scope

These regression test cases cover the Feedback module across backend CRUD behavior, validation, employee mapping, frontend store behavior, role-based UI behavior, optimistic updates, and access control.

## Test Environment

| Item | Value |
| --- | --- |
| Date prepared | 2026-07-22 |
| Backend module | `FeedbackSuggestionController`, `FeedbackSuggestionService`, `FeedbackSuggestion`, `FeedbackSuggestionDto`, `FeedbackSuggestionRepository` |
| Frontend module | `feedback-container.tsx`, `feedback-card.tsx`, `newFeedback-dialog.tsx`, `editFeedback-dialog.tsx`, `feedback_store.ts`, `types/feedback.ts` |
| Recommended backend test command | `.\mvnw.cmd "-Dtest=FeedbackSuggestionServiceTest,FeedbackSuggestionControllerTest,FeedbackSuggestionControllerIntegrationTest" test` |
| Recommended frontend test command | `npm run typecheck` plus component/store tests when available |
| Test type | Regression, service unit, controller unit, integration, frontend store/component |
| Test database | H2 for integration tests; mocked repositories for unit tests |

## Test Cases Matrix

| Test Case ID | Area | Description | Expected Result | Priority | Automation Status |
| --- | --- | --- | --- | --- | --- |
| TC-FEED-REG-001 | Create | Learner creates feedback with employeeId, subject, and description | Returns `201 Created`; response contains success message and created feedback DTO | High | Planned |
| TC-FEED-REG-002 | Default Status | Create feedback without status | Saved feedback status defaults to `Pending` | High | Planned |
| TC-FEED-REG-003 | Create With Status | Create feedback with explicit valid status | Saved feedback uses provided status | Medium | Planned |
| TC-FEED-REG-004 | Missing Employee | Create feedback for non-existing employee ID | Returns `404 Not Found`; no feedback row is saved | High | Planned |
| TC-FEED-REG-005 | Validation Missing Employee | Create feedback with blank employeeId | Returns `400 Bad Request` with validation errors | High | Planned |
| TC-FEED-REG-006 | Validation Missing Subject | Create feedback with blank subject | Returns `400 Bad Request` with validation errors | High | Planned |
| TC-FEED-REG-007 | Validation Missing Description | Create feedback with blank description | Returns `400 Bad Request` with validation errors | High | Planned |
| TC-FEED-REG-008 | List All | Admin or approver fetches all feedback | Returns `200 OK` with all feedback DTOs and employee details | High | Planned |
| TC-FEED-REG-009 | List By Employee | Learner fetches feedback by own employee ID | Returns only that employee's feedback | High | Planned |
| TC-FEED-REG-010 | List Missing Employee | Fetch feedback by missing employee ID | Returns `404 Not Found` | Medium | Planned |
| TC-FEED-REG-011 | DTO Employee Mapping | Fetch feedback for employee with team and department | DTO includes employeeName, department, team, profilePhotoPath, createdAt, and updatedAt | High | Planned |
| TC-FEED-REG-012 | DTO Missing Optional Team | Fetch feedback for employee without team | DTO mapping succeeds without null-pointer error; missing department/team are omitted or null | Medium | Planned |
| TC-FEED-REG-013 | Update Subject Description | Update feedback subject and description | Returns success and persisted row has new subject/description | High | Planned |
| TC-FEED-REG-014 | Update Status | Update feedback status | Persisted row has new status and updatedAt is set | Medium | Planned |
| TC-FEED-REG-015 | Update Missing Feedback | Update non-existing feedback ID | Returns `404 Not Found` | High | Planned |
| TC-FEED-REG-016 | Update Missing Employee | Update feedback with missing employee ID | Returns `404 Not Found`; existing feedback is unchanged | High | Planned |
| TC-FEED-REG-017 | Delete Existing | Delete existing feedback | Returns success and row is removed | High | Planned |
| TC-FEED-REG-018 | Delete Missing | Delete missing feedback ID | Returns `404 Not Found` | Medium | Planned |
| TC-FEED-REG-019 | Learner Page Load | Learner opens feedback tab | Store calls employee-specific fetch and UI shows "Showing your feedback" | High | Planned |
| TC-FEED-REG-020 | Admin Approver Page Load | Admin or approver opens feedback tab | Store calls fetch-all and UI shows "Showing all feedback" | High | Planned |
| TC-FEED-REG-021 | Create Dialog Visibility | Learner views feedback page | New Feedback button is visible | Medium | Planned |
| TC-FEED-REG-022 | Create Dialog Hidden | Admin or approver views feedback page | New Feedback button is hidden | Medium | Planned |
| TC-FEED-REG-023 | Edit Action Visibility | Learner views feedback card | Edit action is available for learner feedback | Medium | Planned |
| TC-FEED-REG-024 | Edit Action Hidden | Admin or approver views feedback card | Edit action is hidden unless product rules change | Medium | Planned |
| TC-FEED-REG-025 | Optimistic Create Success | Store creates feedback successfully | Temporary record is replaced by refreshed API data and success message is returned | High | Planned |
| TC-FEED-REG-026 | Optimistic Create Failure | Store create request fails | Store rolls back to previous feedback list and returns failure message | High | Planned |
| TC-FEED-REG-027 | Optimistic Update Success | Store updates feedback successfully | UI updates, API succeeds, and refreshed role-based data is loaded | High | Planned |
| TC-FEED-REG-028 | Optimistic Update Failure | Store update request fails | Store rolls back to previous feedback list | High | Planned |
| TC-FEED-REG-029 | Optimistic Delete Success | Store deletes one or more feedback records successfully | Records disappear and refreshed role-based data is loaded | High | Planned |
| TC-FEED-REG-030 | Optimistic Delete Failure | One delete request fails during bulk delete | Store rolls back to previous feedback list and returns failure message | High | Planned |
| TC-FEED-REG-031 | Search | Search by employee ID, employee name, subject, description, department, or team | UI filters matching feedback cards only | Medium | Planned |
| TC-FEED-REG-032 | Department Filter | Filter feedback by department | UI shows only selected departments | Medium | Planned |
| TC-FEED-REG-033 | Team Filter | Filter feedback by team | UI shows only selected teams | Medium | Planned |
| TC-FEED-REG-034 | Sort Recent First | Toggle sort to most recent | Feedback cards sort by updatedAt then createdAt descending | Medium | Planned |
| TC-FEED-REG-035 | Authorization Read All | Learner calls fetch-all feedback endpoint directly | Request is rejected with `401` or `403` after backend security rules are enforced | Critical | Planned |
| TC-FEED-REG-036 | Authorization Mutate Other User | Learner updates or deletes another employee's feedback directly | Request is rejected with `401` or `403` after backend ownership rules are enforced | Critical | Planned |

## Execution Notes

Prepared on 2026-07-22. Module-specific automated test classes do not currently exist in the repository, so these cases are ready for implementation as regression coverage.

Important implementation targets:

- Service unit tests should verify default status, employee existence checks, timestamp behavior, and DTO mapping.
- Controller tests should verify status-code mappings for validation, not-found, and successful CRUD.
- Integration tests should verify repository queries and employee relationship mapping.
- Frontend tests should pin learner/admin/approver behavior, optimistic rollback, and filter/sort behavior.
