package com.dat_management.backend.service;

import com.dat_management.backend.dto.CertificateResponseDto;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeCertificate;
import com.dat_management.backend.entity.EmployeeCertificate.CertificateType;
import com.dat_management.backend.entity.EmployeeCertificate.VerificationStatus;
import com.dat_management.backend.entity.EmployeeJapaneseProfile;
import com.dat_management.backend.repository.EmployeeCertificateRepository;
import com.dat_management.backend.repository.EmployeeJapaneseProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final EmployeeCertificateRepository certificateRepository;
    private final EmployeeJapaneseProfileRepository japaneseProfileRepository;
    private final CertificateFileStorageService fileStorageService;

    @Value("${file.max-size:5242880}")
    private long maxFileSize;

    // Convert Entity to DTO
    private CertificateResponseDto toDto(EmployeeCertificate certificate) {
        CertificateResponseDto dto = new CertificateResponseDto();
        dto.setId(certificate.getId());

        if (certificate.getEmployee() != null) {
            dto.setEmployeeId(certificate.getEmployee().getId());
            dto.setEmployeeName(certificate.getEmployee().getName());
        }

        dto.setCertificateType(
                certificate.getCertificateType() != null ? certificate.getCertificateType().name() : null);
        dto.setJapaneseLevel(certificate.getJapaneseLevel());
        dto.setFilePath(certificate.getFilePath());
        dto.setVerificationStatus(
                certificate.getVerificationStatus() != null ? certificate.getVerificationStatus().name() : null);
        dto.setVerifiedAt(certificate.getVerifiedAt());

        if (certificate.getVerifiedBy() != null) {
            dto.setVerifiedByEmployeeId(certificate.getVerifiedBy().getId());
            dto.setVerifiedByEmployeeName(certificate.getVerifiedBy().getName());
        }

        return dto;
    }

    // Convert List of Entities to List of DTOs
    private List<CertificateResponseDto> toDtoList(List<EmployeeCertificate> certificates) {
        return certificates.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private CertificateType parseCertificateType(String typeStr) {
        if (typeStr == null || typeStr.isEmpty()) {
            throw new RuntimeException("Certificate Type is required");
        }
        try {
            return CertificateType.valueOf(typeStr.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid certificate type. Allowed values: JLPT, NAT_TEST, TOP_J, BJT, OTHER");
        }
    }

    private EmployeeJapaneseProfile.JapaneseExamType mapJapaneseExamType(CertificateType certificateType) {
        if (certificateType == null) {
            return null;
        }

        return switch (certificateType) {
            case JLPT -> EmployeeJapaneseProfile.JapaneseExamType.JLPT;
            case NAT_TEST -> EmployeeJapaneseProfile.JapaneseExamType.NAT;
            case TOP_J -> EmployeeJapaneseProfile.JapaneseExamType.TopJ;
            case BJT -> EmployeeJapaneseProfile.JapaneseExamType.BJT;
            case OTHER -> null;
        };
    }

    private void updateApprovedJapaneseProfile(Employee employee, CertificateType certificateType,
            String japaneseLevel) {
        EmployeeJapaneseProfile profile = japaneseProfileRepository.findByEmployeeId(employee.getId())
                .orElseGet(() -> {
                    EmployeeJapaneseProfile newProfile = new EmployeeJapaneseProfile();
                    newProfile.setEmployee(employee);
                    return newProfile;
                });

        String level = japaneseLevel == null ? null : japaneseLevel.trim();
        if (certificateType == CertificateType.JLPT) {
            profile.setJlptHighestLevel(level);
        } else {
            profile.setOtherJapaneseLevel(level);
        }

        EmployeeJapaneseProfile.JapaneseExamType examType = mapJapaneseExamType(certificateType);
        if (examType != null) {
            profile.setJlptNatTest(examType);
        }

        japaneseProfileRepository.save(profile);
    }

    @Transactional
    public void updateApprovedJapaneseProfile(Employee employee, String certificateType, String japaneseLevel) {
        updateApprovedJapaneseProfile(employee, parseCertificateType(certificateType), japaneseLevel);
    }

    private void validateRequiredFields(String certificateType, String japaneseLevel, MultipartFile file,
            boolean isFileRequired) {
        if (certificateType == null || certificateType.isEmpty()) {
            throw new RuntimeException("Certificate Type is required");
        }
        if (japaneseLevel == null || japaneseLevel.isEmpty()) {
            throw new RuntimeException("Japanese Level is required");
        }

        // Validate that certificate type is valid enum
        parseCertificateType(certificateType);

        // File validation - required only for upload, optional for update
        if (isFileRequired) {
            if (file == null || file.isEmpty()) {
                throw new RuntimeException("Please upload an image file (JPG or PNG)");
            }
            if (!fileStorageService.isAllowedImageFile(file)) {
                String extension = fileStorageService.getFileExtension(file);
                throw new RuntimeException("Only JPG and PNG image files are allowed. Provided: " +
                        (extension.isEmpty() ? "unknown" : extension));
            }
            if (!fileStorageService.isValidFileSize(file, maxFileSize)) {
                throw new RuntimeException("File size exceeds maximum allowed size (5MB)");
            }
        } else {
            // For update - file is optional, but if provided validate it
            if (file != null && !file.isEmpty()) {
                if (!fileStorageService.isAllowedImageFile(file)) {
                    String extension = fileStorageService.getFileExtension(file);
                    throw new RuntimeException("Only JPG and PNG image files are allowed. Provided: " +
                            (extension.isEmpty() ? "unknown" : extension));
                }
                if (!fileStorageService.isValidFileSize(file, maxFileSize)) {
                    throw new RuntimeException("File size exceeds maximum allowed size (5MB)");
                }
            }
        }
    }

    @Transactional
    public CertificateResponseDto uploadCertificate(
            Employee employee,
            String certificateType,
            String japaneseLevel,
            MultipartFile file) throws IOException {

        validateRequiredFields(certificateType, japaneseLevel, file, true);

        CertificateType enumCertType = parseCertificateType(certificateType);
        String level = japaneseLevel.trim();

        // Check for duplicate
        if (certificateRepository.existsByEmployeeAndCertificateTypeAndJapaneseLevel(
                employee, enumCertType, level)) {
            throw new RuntimeException("A certificate with type '" + certificateType +
                    "' and level '" + japaneseLevel + "' already exists for this employee. " +
                    "Please check your existing certificates or use a different type/level combination.");
        }

        // Store file and get path
        String filePath = fileStorageService.storeFile(file, employee.getId(), certificateType, level);

        EmployeeCertificate certificate = new EmployeeCertificate();
        certificate.setEmployee(employee);
        certificate.setCertificateType(enumCertType);
        certificate.setJapaneseLevel(level);
        certificate.setFilePath(filePath);
        certificate.setVerificationStatus(VerificationStatus.PENDING);

        EmployeeCertificate savedCertificate = certificateRepository.save(certificate);
        return toDto(savedCertificate);
    }

    public List<CertificateResponseDto> getCertificatesByEmployee(Employee employee) {
        List<EmployeeCertificate> certificates = certificateRepository.findByEmployee(employee);
        return toDtoList(certificates);
    }

    @Transactional
    public CertificateResponseDto updateCertificate(
            Integer id,
            Employee currentUser,
            String certificateType,
            String japaneseLevel,
            MultipartFile file) throws IOException {

        EmployeeCertificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found with ID: " + id));

        validateRequiredFields(certificateType, japaneseLevel, file, false);

        CertificateType enumCertType = parseCertificateType(certificateType);
        String level = japaneseLevel.trim();

        // Check for duplicate (excluding current certificate)
        EmployeeCertificate existing = certificateRepository
                .findByEmployeeAndCertificateTypeAndJapaneseLevel(
                        certificate.getEmployee(), enumCertType, level);

        if (existing != null && !existing.getId().equals(id)) {
            throw new RuntimeException("Another certificate with type '" + certificateType +
                    "' and level '" + japaneseLevel + "' already exists for this employee. " +
                    "Please use a different type/level combination.");
        }

        // Handle file update (optional)
        if (file != null && !file.isEmpty()) {
            if (certificate.getFilePath() != null) {
                fileStorageService.deleteFile(certificate.getFilePath());
            }
            String filePath = fileStorageService.storeFile(file, currentUser.getId(), certificateType, level);
            certificate.setFilePath(filePath);
        }

        // Update fields
        certificate.setCertificateType(enumCertType);
        certificate.setJapaneseLevel(level);

        EmployeeCertificate updatedCertificate = certificateRepository.save(certificate);
        return toDto(updatedCertificate);
    }

    @Transactional
    public CertificateResponseDto verifyCertificate(Integer id, Employee verifier) {
        EmployeeCertificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found with ID: " + id));

        // Set to VERIFIED
        certificate.setVerificationStatus(VerificationStatus.VERIFIED);
        certificate.setVerifiedBy(verifier);
        certificate.setVerifiedAt(LocalDateTime.now());

        updateApprovedJapaneseProfile(
                certificate.getEmployee(),
                certificate.getCertificateType(),
                certificate.getJapaneseLevel());

        EmployeeCertificate verifiedCertificate = certificateRepository.save(certificate);
        return toDto(verifiedCertificate);
    }

    @Transactional
    public CertificateResponseDto rejectCertificate(Integer id, Employee verifier) {
        EmployeeCertificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found with ID: " + id));

        // Set to REJECTED
        certificate.setVerificationStatus(VerificationStatus.REJECTED);
        certificate.setVerifiedBy(verifier);
        certificate.setVerifiedAt(LocalDateTime.now());

        EmployeeCertificate rejectedCertificate = certificateRepository.save(certificate);
        return toDto(rejectedCertificate);
    }

    @Transactional
    public void deleteCertificate(Integer id, Employee currentUser) throws IOException {
        EmployeeCertificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found with ID: " + id));

        // Only the owner can delete their certificates
        String ownerId = certificate.getEmployee().getId();
        String currentUserId = currentUser.getId();

        if (!ownerId.equals(currentUserId)) {
            throw new RuntimeException("You can only delete your own certificates.");
        }

        if (certificate.getFilePath() != null) {
            fileStorageService.deleteFile(certificate.getFilePath());
        }

        certificateRepository.delete(certificate);
    }

    public List<CertificateResponseDto> getPendingCertificates() {
        List<EmployeeCertificate> certificates = certificateRepository
                .findByVerificationStatus(VerificationStatus.PENDING);
        return toDtoList(certificates);
    }

    public List<CertificateResponseDto> getAllCertificates() {
        List<EmployeeCertificate> certificates = certificateRepository.findAll();
        return toDtoList(certificates);
    }

    public CertificateResponseDto getCertificateById(Integer id, Employee currentUser) {
        EmployeeCertificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found with ID: " + id));

        // Check if user owns this certificate
        boolean isOwner = certificate.getEmployee().getId().equals(currentUser.getId());

        if (!isOwner) {
            throw new RuntimeException(
                    "You don't have permission to view this certificate. Only the owner can view it.");
        }

        return toDto(certificate);
    }
}
