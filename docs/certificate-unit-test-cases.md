# Certificate Unit Test Cases

## Scope

These test cases cover unit testing for the Certificate backend module. They test `CertificateService`, `CertificateFileStorageService`, and `CertificateController` in isolation with mocked dependencies or temporary file storage.

## Test Environment

| Item | Value |
| --- | --- |
| Date recorded | 2026-06-23 |
| Backend test command | `./mvnw.cmd "-Dtest=CertificateServiceTest,CertificateFileStorageServiceTest,CertificateControllerTest" test` |
| Actual combined command conducted | `./mvnw.cmd "-Dtest=CertificateServiceTest,CertificateFileStorageServiceTest,CertificateControllerTest,CertificateControllerIntegrationTest,EmployeeServiceTest" test` |
| Test type | Unit tests |
| Database required | No |
| Spring application context required | No |
| Mocking framework | Mockito |

## Test Cases Matrix

| Test Case ID | Feature | Description | Expected Result | Status(Pass/Fail) |
| --- | --- | --- | --- | --- |
| TC-CERT-SVC-001 | Certificate Upload | Upload valid image certificate through service | Saves pending certificate and returns DTO with employee, type, level, status, and file path | Pass |
| TC-CERT-SVC-002 | Duplicate Validation | Upload duplicate certificate type and level for same employee | Throws duplicate error; file is not stored and repository save is not called | Pass |
| TC-CERT-SVC-003 | Certificate Type Validation | Upload with invalid certificate type | Throws invalid certificate type error before save | Pass |
| TC-CERT-SVC-004 | Certificate Update | Update certificate with new file and metadata | Deletes old file, stores new file, updates type and level | Pass |
| TC-CERT-SVC-005 | Update Duplicate Validation | Update certificate to duplicate another certificate's type and level | Throws duplicate error and does not save | Pass |
| TC-CERT-SVC-006 | Certificate Verification | Verify pending certificate | Marks certificate `VERIFIED`, records verifier, and updates Japanese profile | Pass |
| TC-CERT-SVC-007 | Certificate Rejection | Reject pending certificate | Marks certificate `REJECTED` and does not update Japanese profile | Pass |
| TC-CERT-SVC-008 | Certificate Delete | Owner deletes own certificate | Deletes stored file and repository record | Pass |
| TC-CERT-SVC-009 | Delete Authorization | Non-owner tries to delete certificate | Throws permission error and does not delete file or record | Pass |
| TC-CERT-SVC-010 | View Authorization | Non-owner tries to view certificate | Throws permission error | Pass |
| TC-CERT-SVC-011 | Pending Certificates | Get pending certificates | Returns pending certificate DTO list | Pass |
| TC-CERT-FILE-001 | File Storage | Store valid PNG file | Saves file and returns `uploads/certificates/...` path | Pass |
| TC-CERT-FILE-002 | Duplicate Filename | Store same employee/type/level filename twice | Second stored file receives counter suffix | Pass |
| TC-CERT-FILE-003 | File Type Validation | Store PDF file | Throws JPG/PNG-only validation error | Pass |
| TC-CERT-FILE-004 | File Delete | Delete existing file | Removes file from upload directory | Pass |
| TC-CERT-FILE-005 | File Read | Read existing file | Returns stored file bytes | Pass |
| TC-CERT-FILE-006 | Missing File Read | Read missing file | Throws file-not-found error | Pass |
| TC-CERT-FILE-007 | File Helper Validation | Validate content type, extension, and size helpers | Accepts JPG/PNG, rejects PDF, reports extension and size correctly | Pass |
| TC-CERT-CTRL-001 | Upload Endpoint Mapping | Controller upload valid certificate | Returns `201 Created` success response with certificate data | Pass |
| TC-CERT-CTRL-002 | Upload Error Mapping | Upload for missing employee | Returns `400 Bad Request` with error response | Pass |
| TC-CERT-CTRL-003 | My Certificates Mapping | Get certificates for employee | Returns `200 OK` with certificate list | Pass |
| TC-CERT-CTRL-004 | Detail Error Mapping | Get missing certificate | Returns `404 Not Found` with error response | Pass |
| TC-CERT-CTRL-005 | Image Response | Get PNG certificate image | Returns `200 OK`, PNG content type, content disposition, and bytes | Pass |
| TC-CERT-CTRL-006 | Update Error Mapping | Update certificate with storage failure | Returns `500 Internal Server Error` with file-save message | Pass |
| TC-CERT-CTRL-007 | Delete Mapping | Delete certificate | Returns `200 OK` success response and calls service delete | Pass |
| TC-CERT-CTRL-008 | Verify Mapping | Verify certificate | Returns `200 OK` success response with verified certificate | Pass |
| TC-CERT-CTRL-009 | Pending Mapping | Get pending certificates | Returns `200 OK` with pending certificate list | Pass |

## Result Summary

Executed on 2026-06-23.

| Metric | Result |
| --- | --- |
| `CertificateServiceTest` | 11 passed, 0 failed, 0 errors, 0 skipped |
| `CertificateFileStorageServiceTest` | 7 passed, 0 failed, 0 errors, 0 skipped |
| `CertificateControllerTest` | 9 passed, 0 failed, 0 errors, 0 skipped |
| Certificate unit test total | 27 passed, 0 failed, 0 errors, 0 skipped |
| Build result | Success |

## Notes

- These tests are unit-level and do not require MySQL, H2, or a running Spring Boot server.
- `CertificateServiceTest` uses mocked repositories and mocked file storage.
- `CertificateControllerTest` calls controller methods directly with mocked services.
- `CertificateFileStorageServiceTest` uses temporary directories for safe file operations.
- Maven emitted Mockito/JDK warnings during the run; these warnings did not affect the test result.
