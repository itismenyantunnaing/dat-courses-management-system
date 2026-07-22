# Skillset Regression Test Cases

## Scope

These regression test cases cover the Skillset module across backend service logic, backend controller mappings, frontend store behavior, import/export-sensitive data contracts, and role/security-sensitive access. The module includes language skill, management ability, development capability, technical ability headers, and employee technical skill records.

## Test Environment

| Item | Value |
| --- | --- |
| Date prepared | 2026-07-22 |
| Backend module | `SkillSetController`, `SkillSetService`, skillset DTOs, entities, and repositories |
| Frontend module | `skill-container.tsx`, `skillSet-drawer.tsx`, `skillsetForm.tsx`, `skillset_data_store.ts`, `types/skillset.ts` |
| Recommended backend test command | `.\mvnw.cmd "-Dtest=SkillSetServiceTest,SkillSetControllerTest,SkillSetControllerIntegrationTest" test` |
| Recommended frontend test command | `npm run typecheck` plus component/store tests when available |
| Test type | Regression, service unit, controller unit, integration, frontend store/component |
| Test database | H2 for integration tests; mocked repositories for unit tests |

## Test Cases Matrix

| Test Case ID | Area | Description | Expected Result | Priority | Automation Status |
| --- | --- | --- | --- | --- | --- |
| TC-SKILL-REG-001 | Language Skill Create | Create a language skill for an existing employee with level 1-5 | Returns `201 Created`; `employee_japanese_profiles.languageSkillLevel` is saved and linked to employee | High | Planned |
| TC-SKILL-REG-002 | Language Duplicate | Create a second language skill for the same employee | Request fails with duplicate profile error; existing profile is unchanged | High | Planned |
| TC-SKILL-REG-003 | Language Update | Update an employee language level | Returns success; same profile row is updated, not duplicated | High | Planned |
| TC-SKILL-REG-004 | Language Validation | Submit missing employee ID or level outside 1-5 | Returns `400 Bad Request` with validation details | High | Planned |
| TC-SKILL-REG-005 | Management Create | Create management scores with valid experience, QCD, report/consult, and education scores | Saves one management row and calculates `totalLevel` correctly | High | Planned |
| TC-SKILL-REG-006 | Management Total Level Boundaries | Submit score sums at total-level boundaries: 0, 3, 5, 7, 9, 11 | `totalLevel` maps to expected levels 0, 1, 2, 3, 4, 5 | High | Planned |
| TC-SKILL-REG-007 | Management Duplicate | Create a second management score for the same employee | Request fails with duplicate management score error | High | Planned |
| TC-SKILL-REG-008 | Management Update | Update management score values for an existing employee | Existing row is updated and `totalLevel` is recalculated | High | Planned |
| TC-SKILL-REG-009 | Development Type Create | Add new development type through bulk endpoint | New active development type is created and returned | Medium | Planned |
| TC-SKILL-REG-010 | Development Type Duplicate | Add a duplicate development type with different letter case | Request fails with duplicate error and does not create another row | Medium | Planned |
| TC-SKILL-REG-011 | Development Skill Create | Create development capability for employee, type, process, and years | Saves employee development experience with correct development type relation | High | Planned |
| TC-SKILL-REG-012 | Development Duplicate | Create same employee/type/process combination twice | Second request fails; unique business rule is preserved | High | Planned |
| TC-SKILL-REG-013 | Development Update | Update process name and years of experience | Existing development experience row is updated | Medium | Planned |
| TC-SKILL-REG-014 | Technical Header Create | Create category, subcategory, and skill hierarchy | Returns category structure with generated IDs; active rows are created | High | Planned |
| TC-SKILL-REG-015 | Technical Header Update | Rename existing category, subcategory, and skill by ID | Existing rows are renamed without creating duplicates | High | Planned |
| TC-SKILL-REG-016 | Technical Header Duplicate | Create same category/subcategory/skill names with different case | Existing rows are reused or duplicate error is returned consistently | High | Planned |
| TC-SKILL-REG-017 | Subcategory Ownership | Create the same subcategory name under two different categories | Existing subcategory must not be moved from its original category unexpectedly | Critical | Planned |
| TC-SKILL-REG-018 | Technical Skill Create | Add employee technical skill with category, subcategory, skill, years, and level | Saves `employee_skills` row linked to existing or newly created skill | High | Planned |
| TC-SKILL-REG-019 | Technical Skill Duplicate | Add same employee/category/subcategory/skill twice | Second request fails; employee has only one matching technical skill | High | Planned |
| TC-SKILL-REG-020 | Technical Skill Update | Update years and experience level for existing employee technical skill | Existing row is updated and skill relation remains correct | High | Planned |
| TC-SKILL-REG-021 | Technical Skill Same Name Different Category | Add the same skill name under different category/subcategory paths | Distinct skill definitions remain separate and employee rows map to the intended skill | High | Planned |
| TC-SKILL-REG-022 | All Technical Skills Fetch | Fetch `/api/skills/technical` | Returns flattened employee technical skill DTOs with employeeId, categoryName, subCategoryName, skillName, years, and level | Medium | Planned |
| TC-SKILL-REG-023 | Header Structure Fetch | Fetch `/api/skills/technical/categories` | Returns category -> subcategory -> skills structure without employee data | Medium | Planned |
| TC-SKILL-REG-024 | Skillset Table Load | Load skillset page | Employee, language, management, development, technical headers, technical data, and dictionary fetches complete without UI crash | High | Planned |
| TC-SKILL-REG-025 | Skillset Drawer Existing Values | Open drawer for employee with existing skillset data | Form fields are prefilled from API data using correct camelCase/snake_case mappings | High | Planned |
| TC-SKILL-REG-026 | Skillset Drawer Save Mixed Create Update | Save drawer with a mix of new and existing language, management, development, and technical values | Existing records update; new records create; data refreshes after save | Critical | Planned |
| TC-SKILL-REG-027 | Empty Technical Values | Save drawer without technical years or level for a skill | No empty employee technical skill row is created | Medium | Planned |
| TC-SKILL-REG-028 | Import New Headers | Import Excel file containing new technical skill headers | New headers are detected, created once, and employee skill rows use the generated IDs | High | Planned |
| TC-SKILL-REG-029 | Import Existing Data Update | Import Excel file containing existing management, language, development, and technical data | Existing rows update instead of duplicating | High | Planned |
| TC-SKILL-REG-030 | Export Skillset | Export skillset data to supported formats | Export includes employee and all visible skillset columns without missing dynamic headers | Medium | Planned |
| TC-SKILL-REG-031 | Authorization | Anonymous or unauthorized role calls skillset mutation endpoints | Request is rejected with `401` or `403` after backend security rules are enforced | Critical | Planned |

## Execution Notes

Prepared on 2026-07-22. Module-specific automated test classes do not currently exist in the repository, so these cases are ready for implementation as regression coverage.

Important implementation targets:

- Service unit tests should focus on `SkillSetService` business rules and duplicate handling.
- Controller tests should verify status-code and response-body mappings.
- Integration tests should use H2 and validate JPA uniqueness/relationship behavior.
- Frontend tests should pin the store API contract and drawer save behavior, especially ID and camelCase/snake_case mappings.
