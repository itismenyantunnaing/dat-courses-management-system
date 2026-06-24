# Certificate Integration Test Cases

## Scope

These test cases cover backend integration testing for the Certificate module through `CertificateControllerIntegrationTest`. They exercise HTTP endpoints, multipart upload, service logic, repository access, entity mappings, H2 database persistence, file storage, verification, rejection, and authorization checks.

## Test Environment

| Item | Value |
| --- | --- |
| Date recorded | 2026-06-23 |
| Backend test command | `./mvnw.cmd "-Dtest=CertificateControllerIntegrationTest" test` |
| Actual combined command conducted | `./mvnw.cmd "-Dtest=CertificateServiceTest,CertificateFileStorageServiceTest,CertificateControllerTest,CertificateControllerIntegrationTest,EmployeeServiceTest" test` |
| Test type | Backend integration tests |
| Test database | H2 in-memory database via `application-test.properties` |
| Spring context | `@SpringBootTest` with `@AutoConfigureMockMvc` |
| Test upload directory | `backend/target/certificate-test-uploads` |

## Test Cases Matrix

| Test Case ID | Feature | Description | Expected Result | Status(Pass/Fail) |
| --- | --- | --- | --- | --- |
| TC-CERT-INT-001 | Certificate Upload | Upload valid certificate through HTTP multipart endpoint | Returns `201 Created`, persists certificate, and writes uploaded file | Pass |
| TC-CERT-INT-002 | Duplicate Upload | Upload duplicate certificate type and level | Returns `400 Bad Request` with duplicate message | Pass |
| TC-CERT-INT-003 | File Validation | Upload PDF certificate | Returns `400 Bad Request` with JPG/PNG-only message | Pass |
| TC-CERT-INT-004 | My Certificates | Get employee certificates | Returns `200 OK` with employee certificate list | Pass |
| TC-CERT-INT-005 | Certificate Detail | Owner gets certificate by ID | Returns `200 OK` with matching certificate | Pass |
| TC-CERT-INT-006 | Detail Authorization | Non-owner gets certificate by ID | Returns `404 Not Found` with permission message | Pass |
| TC-CERT-INT-007 | Certificate Image | Get certificate image | Returns `200 OK`, PNG bytes, and image headers | Pass |
| TC-CERT-INT-008 | Certificate Update | Update metadata without replacing file | Returns `200 OK` with updated type and level | Pass |
| TC-CERT-INT-009 | Certificate Delete | Owner deletes certificate | Returns `200 OK` and removes certificate record | Pass |
| TC-CERT-INT-010 | Delete Authorization | Non-owner deletes certificate | Returns `400 Bad Request` with permission message | Pass |
| TC-CERT-INT-011 | Certificate Verify | Verify certificate through HTTP endpoint | Returns `200 OK`, status `VERIFIED`, verifier data, and updates Japanese profile | Pass |
| TC-CERT-INT-012 | Certificate Reject | Reject certificate through HTTP endpoint | Returns `200 OK`, status `REJECTED`, and verifier data | Pass |
| TC-CERT-INT-013 | Pending Certificates | Get pending certificates | Returns `200 OK` with pending certificate list | Pass |
| TC-CERT-INT-014 | All Certificates | Get all certificates | Returns `200 OK` with all certificate records | Pass |

## Result Summary

Executed on 2026-06-23.

| Metric | Result |
| --- | --- |
| `CertificateControllerIntegrationTest` | 14 passed, 0 failed, 0 errors, 0 skipped |
| Build result | Success |

## Notes

- Tests use H2 through `@ActiveProfiles("test")`.
- Tests override `file.upload-dir` to `target/certificate-test-uploads` so real uploaded certificates are not touched.
- Tests use `MockMvc` to exercise the controller, service layer, repositories, and file storage together.
- Maven emitted SQL/debug output during the run; these messages did not affect the test result.
