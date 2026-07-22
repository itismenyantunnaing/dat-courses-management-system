# Skillset Import/Export Test Cases

## Scope

These test cases cover the Skillset import and export workflow, including Excel extraction, Japanese header translation, technical skill header detection, new technical header creation, create/update decision logic, skipped employees, bulk API calls, and Excel/CSV/PDF export output.

## Test Environment

| Item | Value |
| --- | --- |
| Date prepared | 2026-07-22 |
| Frontend import parser | `frontend/lib/Excel-extractor-Skillset.tsx` |
| Frontend import orchestration | `frontend/components/nav/tabs-config.ts` |
| Frontend export helper | `frontend/lib/export/Export-skillsetData.tsx` |
| Frontend store | `frontend/store/zustandStores/skillset_data_store.ts` |
| Backend dependencies | `/api/skills/language`, `/api/skills/management`, `/api/skills/development`, `/api/skills/technical`, `/api/skills/technical/categories` |
| Recommended command | `npm run typecheck` plus dedicated parser/export unit tests when test runner is added |
| Test data required | English skillset workbook, Japanese skillset workbook, workbook with new technical skills, workbook with duplicate/existing records, invalid workbook, export fixture data |

## Test Data Set

| Data Set ID | Description | Purpose |
| --- | --- | --- |
| DS-SKILL-IMP-001 | Valid English skillset Excel file with one existing employee | Baseline import parsing |
| DS-SKILL-IMP-002 | Valid Japanese skillset Excel file with sheet name `元データ` and Japanese headers | Japanese header translation |
| DS-SKILL-IMP-003 | Excel file with multiple employees, including one ID not present in system | Skipped employee handling |
| DS-SKILL-IMP-004 | Excel file with existing management, language, development, and technical records | Update detection |
| DS-SKILL-IMP-005 | Excel file with new technical skill headers not present in DB/config | New header creation |
| DS-SKILL-IMP-006 | Excel file with duplicate technical headers and mixed case names | Deduplication and case-insensitive matching |
| DS-SKILL-IMP-007 | Excel file missing ID and name columns | Invalid format handling |
| DS-SKILL-EXP-001 | Export fixture with employees and all skillset sections populated | Full export validation |
| DS-SKILL-EXP-002 | Export fixture with empty skill sections | Empty value and placeholder validation |
| DS-SKILL-EXP-003 | Export fixture with dictionary translations | Japanese export validation |

## Import Test Cases Matrix

| Test Case ID | Area | Description | Expected Result | Priority | Automation Status |
| --- | --- | --- | --- | --- | --- |
| TC-SKILL-IMP-001 | Sheet Detection | Import English workbook with sheet name containing `Original data` | Parser selects correct sheet and returns success | High | Planned |
| TC-SKILL-IMP-002 | Sheet Detection | Import Japanese workbook with sheet name containing `元データ` | Parser selects correct sheet and enables Japanese translation mode | High | Planned |
| TC-SKILL-IMP-003 | Sheet Fallback | Import workbook without expected sheet name but with ID and name columns | Parser finds the valid data sheet by scanning rows | Medium | Planned |
| TC-SKILL-IMP-004 | Invalid Sheet | Import workbook without valid data sheet | Parser returns failure with `Could not find a valid data sheet.` | High | Planned |
| TC-SKILL-IMP-005 | Header Anchor | Import workbook where ID/name row appears within first 20 rows | Parser detects anchor row and builds header block | High | Planned |
| TC-SKILL-IMP-006 | Missing Required Columns | Import workbook missing ID or name | Parser returns failure with `Could not find ID and Name columns.` | High | Planned |
| TC-SKILL-IMP-007 | Merged Header Cells | Import workbook with merged multi-row headers | Parser reads master cell values and constructs dynamic headers | High | Planned |
| TC-SKILL-IMP-008 | Formula Cells | Import workbook containing formula result cells | Parser extracts formula result value instead of formula metadata | Medium | Planned |
| TC-SKILL-IMP-009 | Rich Text Cells | Import workbook containing rich text cells | Parser joins rich text into a normal string | Low | Planned |
| TC-SKILL-IMP-010 | Japanese Header Translation | Import Japanese workbook with management, development, language, and technical headers | Headers are translated to expected English keys | High | Planned |
| TC-SKILL-IMP-011 | Ignored Headers | Import workbook containing rank, core personnel, business trip, automatic calculation, position, or management headcount columns | Ignored columns do not become import data fields | Medium | Planned |
| TC-SKILL-IMP-012 | Data Stop Row | Import workbook with total row after employee rows | Parser stops before importing totals | Medium | Planned |
| TC-SKILL-IMP-013 | Row Limit | Import with a limit value | Parser stops after requested employee count | Low | Planned |
| TC-SKILL-IMP-014 | Empty Rows | Import workbook with blank rows between employees | Blank rows are skipped without stopping import | Medium | Planned |
| TC-SKILL-IMP-015 | Management Create Detection | Imported employee has management values and no existing management row | Import queues management create payload | High | Planned |
| TC-SKILL-IMP-016 | Management Update Detection | Imported management values differ from existing row | Import queues management update payload with existing ID | High | Planned |
| TC-SKILL-IMP-017 | Management No Change | Imported management values match existing row | No create/update is queued for management | Medium | Planned |
| TC-SKILL-IMP-018 | Language Create Detection | Imported employee has language level and no existing language row | Import queues language create payload | High | Planned |
| TC-SKILL-IMP-019 | Language Update Detection | Imported language level differs from existing row | Import queues language update payload with existing ID | High | Planned |
| TC-SKILL-IMP-020 | Language No Change | Imported language level matches existing row | No create/update is queued for language | Medium | Planned |
| TC-SKILL-IMP-021 | Development Create Detection | Imported development years/process exists for a type with no employee row | Import queues development create payload | High | Planned |
| TC-SKILL-IMP-022 | Development Update Detection | Imported development years/process differs from existing employee/type row | Import queues development update payload with existing ID | High | Planned |
| TC-SKILL-IMP-023 | Development Existing Headers | Import should fetch existing development types without creating missing ones automatically | Only existing development headers are used unless product rule changes | Medium | Planned |
| TC-SKILL-IMP-024 | Config Header Sync | Database is missing technical headers from local config | Import calls bulk category creation for missing config headers only | High | Planned |
| TC-SKILL-IMP-025 | Header Deduplication | Local config contains duplicate category/subcategory/skill combinations | Import deduplicates before calling bulk category creation | High | Planned |
| TC-SKILL-IMP-026 | Existing Header Filter | Database already contains config technical headers | Import does not recreate existing headers | High | Planned |
| TC-SKILL-IMP-027 | New Technical Header Detection | Workbook contains new technical skill columns not in DB/config | Import detects new skill and queues category/subcategory/skill creation | High | Planned |
| TC-SKILL-IMP-028 | New Technical Header Missing Category | Workbook contains new skill header without category/subcategory | Import assigns generated empty category/subcategory names and creates skill | Medium | Planned |
| TC-SKILL-IMP-029 | Technical Skill Create | Imported technical years or experience exists and no employee skill row exists | Import queues technical create payload with resolved skillId | High | Planned |
| TC-SKILL-IMP-030 | Technical Skill Update | Imported technical years or experience differs from existing employee skill | Import queues technical update payload with existing ID | High | Planned |
| TC-SKILL-IMP-031 | Technical No Change | Imported technical years and experience match existing employee skill | No create/update is queued for technical skill | Medium | Planned |
| TC-SKILL-IMP-032 | RPA Exact Matching | Workbook contains RPA headers and other words containing `rpa` | Import matches only intended RPA skill headers | High | Planned |
| TC-SKILL-IMP-033 | Years Only | Technical skill has years value but empty experience | Import creates/updates skill with years and blank experience | Medium | Planned |
| TC-SKILL-IMP-034 | Experience Only | Technical skill has experience text but empty years | Import creates/updates skill with 0 years and experience text | Medium | Planned |
| TC-SKILL-IMP-035 | Missing Skill ID | Parsed technical skill cannot resolve a skillId | Import skips that technical record and does not crash | High | Planned |
| TC-SKILL-IMP-036 | Skipped Employee | Imported employee ID does not exist in current employee list | Employee is skipped and included in import summary | High | Planned |
| TC-SKILL-IMP-037 | No Data To Import | Workbook contains no new or changed skillset values | Import returns no-data result and does not call mutation APIs | Medium | Planned |
| TC-SKILL-IMP-038 | User Cancels Confirm | Import summary appears and user cancels | No mutation API calls are made; result is cancelled | Medium | Planned |
| TC-SKILL-IMP-039 | Bulk Create Fallback | Bulk development or technical create fails | Import falls back to individual create attempts and counts successes | High | Planned |
| TC-SKILL-IMP-040 | Final Success Count | Import completes with mixed creates and updates | Success alert reports actual processed record count | Medium | Planned |

## Export Test Cases Matrix

| Test Case ID | Area | Description | Expected Result | Priority | Automation Status |
| --- | --- | --- | --- | --- | --- |
| TC-SKILL-EXP-001 | No Employee Data | Export with empty employee list | User sees `No employee data to export`; no file is generated | High | Planned |
| TC-SKILL-EXP-002 | Excel Export | Export full skillset data to Excel | `.xlsx` file is generated with five header rows, merged headers, employee rows, and dynamic skill columns | High | Planned |
| TC-SKILL-EXP-003 | CSV Export | Export full skillset data to CSV | `.csv` file is generated with BOM and flattened row data | High | Planned |
| TC-SKILL-EXP-004 | PDF Export | Export manageable-width skillset data to PDF | `.pdf` file is generated with title, generation metadata, headers, and body rows | Medium | Planned |
| TC-SKILL-EXP-005 | PDF Wide Confirmation | Export more than 15 columns to PDF | User is asked to confirm wide PDF export | Medium | Planned |
| TC-SKILL-EXP-006 | PDF Cancel | User cancels wide PDF export | Export throws cancellation error and no PDF is saved | Medium | Planned |
| TC-SKILL-EXP-007 | Unsupported Format | Export with unsupported format | User sees unsupported format alert | Medium | Planned |
| TC-SKILL-EXP-008 | English Export Naming | Export English file | File name ends with `_EN` and correct extension | Medium | Planned |
| TC-SKILL-EXP-009 | Japanese Export Naming | Export Japanese file | File name ends with `_JP` and correct extension | Medium | Planned |
| TC-SKILL-EXP-010 | Dictionary Translation | Export Japanese with dictionary entries | Headers and matching values are translated through dictionary | High | Planned |
| TC-SKILL-EXP-011 | Employee Columns | Export always includes team, ID, name, department, core personnel, and business trip columns | Employee columns are first and preserve expected order | High | Planned |
| TC-SKILL-EXP-012 | Administrator Columns | Export includes management experience, QCD, report/consult, education, and total level | Administrator columns are present and populated from management map | High | Planned |
| TC-SKILL-EXP-013 | Developer Columns | Export includes language level, JLPT/NAT, development years, and development process | Developer columns are present and populated from language/development maps | High | Planned |
| TC-SKILL-EXP-014 | Technical Columns | Export includes two columns per dynamic technical skill: years and experience | Technical columns are present and sorted by skill ID | High | Planned |
| TC-SKILL-EXP-015 | Empty Values | Export employee with missing skill data | Empty skill values are exported as `-` | Medium | Planned |
| TC-SKILL-EXP-016 | CamelCase Data | Export using camelCase API-style data | Export maps values correctly | High | Planned |
| TC-SKILL-EXP-017 | Snake Case Data | Export using snake_case import/mock-style data | Export maps values correctly | High | Planned |
| TC-SKILL-EXP-018 | Hidden Administrator Section | Export with `showAdministrator=false` | Administrator columns are excluded and total column count is correct | Medium | Planned |
| TC-SKILL-EXP-019 | Hidden Developer Section | Export with `showDeveloper=false` | Developer columns are excluded and total column count is correct | Medium | Planned |
| TC-SKILL-EXP-020 | Hidden Technical Section | Export with `showTechnicalAbility=false` | Technical columns are excluded and total column count is correct | Medium | Planned |
| TC-SKILL-EXP-021 | Empty Category Rendering | Export skills whose category/subcategory names include `empty` | Empty grouping rules match the UI table layout | Medium | Planned |
| TC-SKILL-EXP-022 | Long Header Width | Export skills with long names | Excel column widths are bounded and data remains readable | Low | Planned |
| TC-SKILL-EXP-023 | PDF Page Number | PDF export draws page number without runtime error | Page footer renders correctly | High | Planned |
| TC-SKILL-EXP-024 | Save Failure | Browser file save fails | Error is caught and user sees export failure alert | Medium | Planned |

## Recommended Automation

| Test Layer | Recommended Tooling | Coverage |
| --- | --- | --- |
| Parser unit tests | Vitest or Jest with generated ExcelJS workbooks | TC-SKILL-IMP-001 through TC-SKILL-IMP-014 |
| Import orchestration tests | Vitest/Jest with mocked `window.mainStore`, `alert`, and `confirm` | TC-SKILL-IMP-015 through TC-SKILL-IMP-040 |
| Export unit tests | Vitest/Jest with mocked `file-saver`, `jspdf`, and generated fixture data | TC-SKILL-EXP-001 through TC-SKILL-EXP-024 |
| E2E smoke tests | Playwright | Upload skillset file, confirm import, verify table, export Excel/CSV |
| Backend integration tests | Spring MockMvc/H2 | Bulk category creation and skill data persistence used by import |

## Notes

- Add sample workbooks under a test fixture directory before automating parser tests.
- Export tests should mock browser APIs such as `Blob`, `confirm`, and `saveAs`.
- PDF export should be tested separately because it dynamically imports `jspdf` and `jspdf-autotable`.
