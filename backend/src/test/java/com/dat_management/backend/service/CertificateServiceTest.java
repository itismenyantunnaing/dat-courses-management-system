package com.dat_management.backend.service;

import com.dat_management.backend.dto.CertificateResponseDto;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeCertificate;
import com.dat_management.backend.entity.EmployeeCertificate.CertificateType;
import com.dat_management.backend.entity.EmployeeCertificate.VerificationStatus;
import com.dat_management.backend.entity.EmployeeJapaneseProfile;
import com.dat_management.backend.repository.EmployeeCertificateRepository;
import com.dat_management.backend.repository.EmployeeJapaneseProfileRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CertificateServiceTest {

    @Mock
    private EmployeeCertificateRepository certificateRepository;

    @Mock
    private EmployeeJapaneseProfileRepository japaneseProfileRepository;

    @Mock
    private CertificateFileStorageService fileStorageService;

    @Test
    void uploadCertificate_validImage_savesPendingCertificateAndReturnsDto() throws IOException {
        CertificateService service = service();
        Employee employee = employee("EMP001", "Alice Admin");
        MockMultipartFile file = imageFile();

        when(fileStorageService.isAllowedImageFile(file)).thenReturn(true);
        when(fileStorageService.isValidFileSize(eq(file), anyLong())).thenReturn(true);
        when(certificateRepository.existsByEmployeeAndCertificateTypeAndJapaneseLevel(
                employee, CertificateType.JLPT, "N2")).thenReturn(false);
        when(fileStorageService.storeFile(file, "EMP001", "JLPT", "N2"))
                .thenReturn("uploads/certificates/EMP001_JLPT_N2.png");
        when(certificateRepository.save(any(EmployeeCertificate.class))).thenAnswer(invocation -> {
            EmployeeCertificate certificate = invocation.getArgument(0);
            certificate.setId(10);
            return certificate;
        });

        CertificateResponseDto result = service.uploadCertificate(employee, "JLPT", " N2 ", file);

        Assertions.assertEquals(10, result.getId());
        Assertions.assertEquals("EMP001", result.getEmployeeId());
        Assertions.assertEquals("Alice Admin", result.getEmployeeName());
        Assertions.assertEquals("JLPT", result.getCertificateType());
        Assertions.assertEquals("N2", result.getJapaneseLevel());
        Assertions.assertEquals("PENDING", result.getVerificationStatus());
        Assertions.assertEquals("uploads/certificates/EMP001_JLPT_N2.png", result.getFilePath());
    }

    @Test
    void uploadCertificate_duplicateTypeAndLevel_throwsAndDoesNotStoreFile() throws IOException {
        CertificateService service = service();
        Employee employee = employee("EMP001", "Alice Admin");
        MockMultipartFile file = imageFile();

        when(fileStorageService.isAllowedImageFile(file)).thenReturn(true);
        when(fileStorageService.isValidFileSize(eq(file), anyLong())).thenReturn(true);
        when(certificateRepository.existsByEmployeeAndCertificateTypeAndJapaneseLevel(
                employee, CertificateType.JLPT, "N2")).thenReturn(true);

        RuntimeException ex = Assertions.assertThrows(
                RuntimeException.class,
                () -> service.uploadCertificate(employee, "JLPT", "N2", file));

        Assertions.assertTrue(ex.getMessage().contains("already exists"));
        verify(fileStorageService, never()).storeFile(any(), any(), any(), any());
        verify(certificateRepository, never()).save(any(EmployeeCertificate.class));
    }

    @Test
    void uploadCertificate_invalidCertificateType_throwsBeforeSaving() {
        CertificateService service = service();

        RuntimeException ex = Assertions.assertThrows(
                RuntimeException.class,
                () -> service.uploadCertificate(employee("EMP001", "Alice Admin"), "INVALID", "N2", imageFile()));

        Assertions.assertTrue(ex.getMessage().contains("Invalid certificate type"));
        verify(certificateRepository, never()).save(any(EmployeeCertificate.class));
    }

    @Test
    void updateCertificate_withNewFile_replacesFileAndUpdatesFields() throws IOException {
        CertificateService service = service();
        Employee employee = employee("EMP001", "Alice Admin");
        EmployeeCertificate existing = certificate(10, employee, CertificateType.JLPT, "N2", VerificationStatus.PENDING);
        existing.setFilePath("uploads/certificates/old.png");
        MockMultipartFile file = imageFile();

        when(certificateRepository.findById(10)).thenReturn(Optional.of(existing));
        when(fileStorageService.isAllowedImageFile(file)).thenReturn(true);
        when(fileStorageService.isValidFileSize(eq(file), anyLong())).thenReturn(true);
        when(certificateRepository.findByEmployeeAndCertificateTypeAndJapaneseLevel(
                employee, CertificateType.NAT_TEST, "N3")).thenReturn(null);
        when(fileStorageService.storeFile(file, "EMP001", "NAT_TEST", "N3"))
                .thenReturn("uploads/certificates/EMP001_NAT_TEST_N3.png");
        when(certificateRepository.save(existing)).thenReturn(existing);

        CertificateResponseDto result = service.updateCertificate(10, employee, "NAT_TEST", "N3", file);

        Assertions.assertEquals("NAT_TEST", result.getCertificateType());
        Assertions.assertEquals("N3", result.getJapaneseLevel());
        Assertions.assertEquals("uploads/certificates/EMP001_NAT_TEST_N3.png", result.getFilePath());
        verify(fileStorageService).deleteFile("uploads/certificates/old.png");
    }

    @Test
    void updateCertificate_duplicateDifferentCertificate_throwsAndDoesNotSave() {
        CertificateService service = service();
        Employee employee = employee("EMP001", "Alice Admin");
        EmployeeCertificate existing = certificate(10, employee, CertificateType.JLPT, "N2", VerificationStatus.PENDING);
        EmployeeCertificate duplicate = certificate(11, employee, CertificateType.JLPT, "N1", VerificationStatus.PENDING);

        when(certificateRepository.findById(10)).thenReturn(Optional.of(existing));
        when(certificateRepository.findByEmployeeAndCertificateTypeAndJapaneseLevel(
                employee, CertificateType.JLPT, "N1")).thenReturn(duplicate);

        RuntimeException ex = Assertions.assertThrows(
                RuntimeException.class,
                () -> service.updateCertificate(10, employee, "JLPT", "N1", null));

        Assertions.assertTrue(ex.getMessage().contains("Another certificate"));
        verify(certificateRepository, never()).save(any(EmployeeCertificate.class));
    }

    @Test
    void verifyCertificate_marksCertificateVerifiedAndUpdatesJapaneseProfile() {
        CertificateService service = service();
        Employee employee = employee("EMP001", "Alice Admin");
        Employee verifier = employee("EMP999", "Verifier User");
        EmployeeCertificate certificate = certificate(10, employee, CertificateType.JLPT, "N2", VerificationStatus.PENDING);

        when(certificateRepository.findById(10)).thenReturn(Optional.of(certificate));
        when(japaneseProfileRepository.findByEmployeeId("EMP001")).thenReturn(Optional.empty());
        when(japaneseProfileRepository.save(any(EmployeeJapaneseProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(certificateRepository.save(certificate)).thenReturn(certificate);

        CertificateResponseDto result = service.verifyCertificate(10, verifier);

        Assertions.assertEquals("VERIFIED", result.getVerificationStatus());
        Assertions.assertEquals("EMP999", result.getVerifiedByEmployeeId());
        Assertions.assertNotNull(result.getVerifiedAt());

        ArgumentCaptor<EmployeeJapaneseProfile> profileCaptor = ArgumentCaptor.forClass(EmployeeJapaneseProfile.class);
        verify(japaneseProfileRepository).save(profileCaptor.capture());
        EmployeeJapaneseProfile savedProfile = profileCaptor.getValue();
        Assertions.assertEquals(employee, savedProfile.getEmployee());
        Assertions.assertEquals("N2", savedProfile.getJlptHighestLevel());
        Assertions.assertEquals(EmployeeJapaneseProfile.JapaneseExamType.JLPT, savedProfile.getJlptNatTest());
    }

    @Test
    void rejectCertificate_marksCertificateRejectedWithoutUpdatingProfile() {
        CertificateService service = service();
        Employee verifier = employee("EMP999", "Verifier User");
        EmployeeCertificate certificate = certificate(
                10,
                employee("EMP001", "Alice Admin"),
                CertificateType.JLPT,
                "N2",
                VerificationStatus.PENDING);

        when(certificateRepository.findById(10)).thenReturn(Optional.of(certificate));
        when(certificateRepository.save(certificate)).thenReturn(certificate);

        CertificateResponseDto result = service.rejectCertificate(10, verifier);

        Assertions.assertEquals("REJECTED", result.getVerificationStatus());
        Assertions.assertEquals("EMP999", result.getVerifiedByEmployeeId());
        verify(japaneseProfileRepository, never()).save(any(EmployeeJapaneseProfile.class));
    }

    @Test
    void deleteCertificate_ownerDeletesFileAndRepositoryRecord() throws IOException {
        CertificateService service = service();
        Employee owner = employee("EMP001", "Alice Admin");
        EmployeeCertificate certificate = certificate(10, owner, CertificateType.JLPT, "N2", VerificationStatus.PENDING);
        certificate.setFilePath("uploads/certificates/EMP001_JLPT_N2.png");

        when(certificateRepository.findById(10)).thenReturn(Optional.of(certificate));

        service.deleteCertificate(10, owner);

        verify(fileStorageService).deleteFile("uploads/certificates/EMP001_JLPT_N2.png");
        verify(certificateRepository).delete(certificate);
    }

    @Test
    void deleteCertificate_nonOwner_throwsAndDoesNotDelete() throws IOException {
        CertificateService service = service();
        Employee owner = employee("EMP001", "Alice Admin");
        Employee other = employee("EMP002", "Other User");
        EmployeeCertificate certificate = certificate(10, owner, CertificateType.JLPT, "N2", VerificationStatus.PENDING);

        when(certificateRepository.findById(10)).thenReturn(Optional.of(certificate));

        RuntimeException ex = Assertions.assertThrows(
                RuntimeException.class,
                () -> service.deleteCertificate(10, other));

        Assertions.assertEquals("You can only delete your own certificates.", ex.getMessage());
        verify(fileStorageService, never()).deleteFile(any());
        verify(certificateRepository, never()).delete(any(EmployeeCertificate.class));
    }

    @Test
    void getCertificateById_nonOwner_throwsPermissionError() {
        CertificateService service = service();
        Employee owner = employee("EMP001", "Alice Admin");
        Employee other = employee("EMP002", "Other User");

        when(certificateRepository.findById(10))
                .thenReturn(Optional.of(certificate(10, owner, CertificateType.JLPT, "N2", VerificationStatus.PENDING)));

        RuntimeException ex = Assertions.assertThrows(
                RuntimeException.class,
                () -> service.getCertificateById(10, other));

        Assertions.assertTrue(ex.getMessage().contains("don't have permission"));
    }

    @Test
    void getPendingCertificates_returnsPendingDtos() {
        CertificateService service = service();
        Employee employee = employee("EMP001", "Alice Admin");

        when(certificateRepository.findByVerificationStatus(VerificationStatus.PENDING))
                .thenReturn(List.of(certificate(10, employee, CertificateType.JLPT, "N2", VerificationStatus.PENDING)));

        List<CertificateResponseDto> result = service.getPendingCertificates();

        Assertions.assertEquals(1, result.size());
        Assertions.assertEquals("PENDING", result.get(0).getVerificationStatus());
    }

    private CertificateService service() {
        return new CertificateService(certificateRepository, japaneseProfileRepository, fileStorageService);
    }

    private static MockMultipartFile imageFile() {
        return new MockMultipartFile("file", "certificate.png", "image/png", new byte[] {1, 2, 3});
    }

    private static Employee employee(String id, String name) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(name);
        employee.setEmail(id.toLowerCase() + "@dat.com");
        employee.setPassword("encoded-password");
        employee.setPosition("Engineer");
        employee.setEmpStatus("active");
        employee.setStatus("default");
        employee.setIsCorePersonnel(false);
        employee.setHasJapanBusinessTrip(false);
        employee.setNotiSetting(false);
        employee.setIsDeleted(false);
        return employee;
    }

    private static EmployeeCertificate certificate(
            Integer id,
            Employee employee,
            CertificateType certificateType,
            String japaneseLevel,
            VerificationStatus status
    ) {
        EmployeeCertificate certificate = new EmployeeCertificate();
        certificate.setId(id);
        certificate.setEmployee(employee);
        certificate.setCertificateType(certificateType);
        certificate.setJapaneseLevel(japaneseLevel);
        certificate.setFilePath("uploads/certificates/certificate.png");
        certificate.setVerificationStatus(status);
        return certificate;
    }
}
