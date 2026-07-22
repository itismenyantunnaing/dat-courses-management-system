# Skillset Import/Export Test Results

## Scope

This document records the preparation and execution attempt for Skillset import/export testing on 2026-07-22.

## Prepared Document

| Document | Purpose | Status |
| --- | --- | --- |
| `docs/skillset-import-export-test-cases.md` | Dedicated import/export test-case matrix | Prepared |

## Execution Environment

| Item | Value |
| --- | --- |
| Date executed | 2026-07-22 |
| Frontend command attempted | `npm run typecheck` |
| Static review files | `frontend/lib/Excel-extractor-Skillset.tsx`, `frontend/components/nav/tabs-config.ts`, `frontend/lib/export/Export-skillsetData.tsx` |
| Test fixture search | Repository search for skillset Excel/CSV samples |

## Execution Summary

| Check ID | Area | Command / Method | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| SKILL-IE-RUN-001 | Frontend typecheck | `npm run typecheck` | Import/export TypeScript compiles with no errors | Failed with existing project-wide TypeScript errors, including import/export-specific errors | Fail |
| SKILL-IE-RUN-002 | Import/export test availability | Repository inspection | Dedicated import/export automated tests exist | No dedicated import/export tests exist | Not Executed |
| SKILL-IE-RUN-003 | Test fixture availability | Repository file search | Sample skillset `.xlsx`, `.xls`, or `.csv` files exist for parser/import tests | No sample skillset spreadsheet fixtures were found | Not Executed |
| SKILL-IE-RUN-004 | Import parser static review | Source review | Parser supports sheet detection, merged headers, Japanese headers, and invalid workbook handling | Parser has those paths, but no automated tests currently validate them | Reviewed |
| SKILL-IE-RUN-005 | Export helper static review | Source review | Excel, CSV, and PDF export functions are callable and type-safe | PDF export has a TypeScript error around `doc.internal.getCurrentPageInfo()` | Fail |

## Frontend Typecheck Result Details

`npm run typecheck` failed before any import/export workflow could be treated as verified. Import/export-relevant failures include:

| File | Failure |
| --- | --- |
| `frontend/app/test-extractor/page.tsx` | Calls `extractEmployeesFromExcel(file)` with one argument while the imported function expects 2-3 arguments |
| `frontend/components/nav/tabs-config.ts` | Skillset import logic mixes `categoryName`/`skillSubCategories` with `category_name`/`skill_sub_categories`, producing type errors |
| `frontend/lib/export/Export-skillsetData.tsx` | PDF export calls `doc.internal.getCurrentPageInfo()`, which is not available on the current TypeScript type for `doc.internal` |
| `frontend/store/mainStore.ts` and related store types | Combined store typing failures prevent reliable compile-time validation of import/export store calls |

## Static Review Findings

| Finding ID | Area | Finding | Risk | Recommended Action |
| --- | --- | --- | --- | --- |
| SKILL-IE-FIND-001 | Import parser | `extractEmployeesFromExcel` supports English and Japanese sheet/header detection, merged cells, formula results, rich text, ignored headers, total-row stop, and row limits | Good coverage in code, but unverified | Add parser unit tests with generated ExcelJS workbooks |
| SKILL-IE-FIND-002 | Test page | `app/test-extractor/page.tsx` imports a separate `lib/excel-extractor` path, while production skill import uses `lib/Excel-extractor-Skillset` | Test page may not validate production import behavior | Align test page or replace with automated parser tests |
| SKILL-IE-FIND-003 | Header parsing | New technical skills may receive generated `empty-*` category/subcategory names when header context is incomplete | Repeat imports can create hard-to-match headers | Add deterministic behavior or regression tests for missing category/subcategory |
| SKILL-IE-FIND-004 | New skill detection | Import suppresses new skill creation when a skill name already exists anywhere, even if category/subcategory differs | Same skill name in different hierarchy may be skipped incorrectly | Test same skill name under different category/subcategory |
| SKILL-IE-FIND-005 | Bulk fallback | Development and technical bulk create failures fall back to individual creates | Partial success can occur; user sees only success count | Add tests for partial failures and clearer result reporting |
| SKILL-IE-FIND-006 | Export PDF | PDF page number helper is not type-safe with current jsPDF types | Typecheck fails and PDF export may break at runtime depending on jsPDF version | Replace with compatible page-number API or type-safe wrapper |
| SKILL-IE-FIND-007 | Export mapping | Export attempts to support both camelCase and snake_case data | Useful but fragile without contract tests | Add fixture-based export tests for both naming styles |
| SKILL-IE-FIND-008 | Fixtures | No skillset workbook fixtures are committed | Parser/import behavior cannot be reproduced automatically | Add sanitized English and Japanese sample files or generate fixtures in tests |

## Regression Status

| Area | Prepared Test Cases | Tests Conducted | Result |
| --- | ---: | --- | --- |
| Import parser | 14 | Static review and typecheck only | Blocked by missing fixtures/tests and typecheck failures |
| Import orchestration | 26 | Static review and typecheck only | Blocked by missing tests and typecheck failures |
| Export Excel/CSV/PDF | 24 | Static review and typecheck only | Blocked by typecheck failure; PDF type error found |

## Recommended Next Steps

1. Fix TypeScript errors that directly affect import/export:
   - `frontend/app/test-extractor/page.tsx`
   - `frontend/components/nav/tabs-config.ts`
   - `frontend/lib/export/Export-skillsetData.tsx`
2. Add generated workbook fixtures or sanitized real skillset templates for English and Japanese imports.
3. Add parser unit tests for `extractEmployeesFromExcel`.
4. Add import orchestration tests with mocked `window.mainStore`, `alert`, and `confirm`.
5. Add export tests with mocked `saveAs`, `confirm`, `jspdf`, and `jspdf-autotable`.
6. Re-run `npm run typecheck` and the new import/export tests, then update this result document with pass/fail counts.
