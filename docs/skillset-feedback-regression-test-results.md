# Skillset and Feedback Regression Test Results

## Scope

This document records the regression preparation and execution attempt for the Skillset and Feedback modules on 2026-07-22.

## Prepared Documents

| Document | Purpose | Status |
| --- | --- | --- |
| `docs/skillset-regression-test-cases.md` | Skillset regression test-case matrix | Prepared |
| `docs/feedback-regression-test-cases.md` | Feedback regression test-case matrix | Prepared |

## Execution Environment

| Item | Value |
| --- | --- |
| Date executed | 2026-07-22 |
| Backend command attempted | `.\mvnw.cmd test` |
| Frontend command attempted | `npm run typecheck` |
| Backend location | `backend` |
| Frontend location | `frontend` |

## Execution Summary

| Check ID | Area | Command / Method | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| REG-RUN-001 | Backend automated tests | `.\mvnw.cmd test` | Backend test suite compiles and executes | Failed during test compilation before runtime tests executed | Fail |
| REG-RUN-002 | Frontend typecheck | `npm run typecheck` | TypeScript project compiles with no type errors | Failed with existing TypeScript errors, including feedback and skillset store/type mismatches | Fail |
| REG-RUN-003 | Skillset test availability | Repository inspection | Skillset regression test classes exist and can be run | No `SkillSetServiceTest`, `SkillSetControllerTest`, or `SkillSetControllerIntegrationTest` exists | Not Executed |
| REG-RUN-004 | Feedback test availability | Repository inspection | Feedback regression test classes exist and can be run | No `FeedbackSuggestionServiceTest`, `FeedbackSuggestionControllerTest`, or `FeedbackSuggestionControllerIntegrationTest` exists | Not Executed |
| REG-RUN-005 | Backend API authorization static check | Review `SecurityConfig` and `JwtAuthenticationFilter` | `/api/skills/**` and `/api/feedback/**` require authentication and role/ownership checks | `/api/**` is permitted and skipped by JWT filter | Fail |

## Backend Result Details

The backend test command was first attempted inside the restricted sandbox and could not resolve the Spring Boot parent POM from Maven Central. It was then rerun with network access approval.

The rerun reached Java test compilation and failed with existing test/source drift:

| File | Failure |
| --- | --- |
| `CertificateControllerTest.java` | Calls `verifyCertificate` with old method signature |
| `CertificateServiceTest.java` | Calls `verifyCertificate` and `rejectCertificate` with old method signatures |
| `JapaneseDashboardControllerIntegrationTest.java` | Calls missing `setDivisionCode` and `setDeptCode` setters |
| `EmployeeServiceTest.java` | Calls missing `setDivisionCode` and `setDeptCode` setters |
| `JapaneseDashboardServiceTest.java` | Calls missing `setDivisionCode` and `setDeptCode` setters |

Backend build status: Fail at `testCompile`. No Skillset or Feedback runtime tests were executed.

## Frontend Result Details

`npm run typecheck` failed with existing project-wide TypeScript errors. Module-relevant failures include:

| File | Failure |
| --- | --- |
| `components/feedback-container.tsx` | `profile` and `setProfile` are used from `mainStore` but are missing from the combined store type |
| `store/zustandStores/feedback_store.ts` | `profile` and `refreshFeedbackData` are used but missing from `Feedback_StoreType` |
| `components/drawers/skillset/skillSet-drawer.tsx` | Skillset types are missing expected IDs such as `LanguageSkill.id`, `ManagementScore.id`, and `EmployeeSkill.skillId` |
| `components/drawers/skillset/skillSet-drawer.tsx` | Drawer props include `onPointerDownOutside`, which is not accepted by the current component type |
| `components/drawers/skillset/technicalAbilityHeaders-drawer.tsx` | Same drawer prop type issue |
| `components/nav/tabs-config.ts` | Skillset import logic mixes camelCase and snake_case type contracts |

Frontend build/typecheck status: Fail.

## Regression Status by Module

| Module | Prepared Test Cases | Automated Tests Found | Tests Conducted | Result |
| --- | ---: | ---: | --- | --- |
| Skillset | 31 | 0 | Automated execution blocked by missing module tests plus backend/frontend compile failures | Blocked |
| Feedback | 36 | 0 | Automated execution blocked by missing module tests plus backend/frontend compile failures | Blocked |

## Key Regression Risks Found

| Risk ID | Module | Risk | Evidence | Recommended Action |
| --- | --- | --- | --- | --- |
| RISK-SKILL-001 | Skillset | Technical subcategory hierarchy can be corrupted when the same subcategory name is used under another category | `getOrCreateSubCategory` may reassign an existing subcategory to a new category | Add regression test TC-SKILL-REG-017 and adjust service behavior |
| RISK-SKILL-002 | Skillset | Entity/repository cleanup is needed | `EmployeeJapaneseProfile` contains placeholder methods that throw `UnsupportedOperationException`; repository has duplicate imports | Clean up unused methods/imports and add compile-focused regression |
| RISK-SKILL-003 | Skillset | Frontend data contract is inconsistent | Typecheck reports missing IDs and camelCase/snake_case mismatches | Align `types/skillset.ts`, store return types, and drawer assumptions |
| RISK-FEED-001 | Feedback | Backend authorization is not enforced | `/api/**` is permitted in security configuration and skipped by JWT filter | Add backend auth/ownership checks and regression tests TC-FEED-REG-035/036 |
| RISK-FEED-002 | Feedback | Store type is incomplete | `profile`, `setProfile`, and `refreshFeedbackData` exist in implementation but not type interface | Update `Feedback_StoreType` and add store tests |
| RISK-FEED-003 | Feedback | Update can reassign feedback ownership by payload employeeId | `FeedbackSuggestionService.update` loads employee from request DTO and sets it on existing feedback | Add ownership rules and regression test for cross-employee mutation |

## Recommended Next Steps

1. Fix existing backend test compilation failures so Maven can execute tests.
2. Fix frontend store/type errors for feedback and skillset.
3. Implement `SkillSetServiceTest` and `FeedbackSuggestionServiceTest` first because they cover the highest-risk business rules without requiring a running server.
4. Add controller and integration tests after service behavior is pinned down.
5. Re-run backend and frontend checks, then update this result document with pass/fail counts.
