package com.dat_management.backend.service;

import com.dat_management.backend.entity.Notification.NotificationType;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.dat_management.backend.dto.CertificateResponseDto;
import com.dat_management.backend.entity.DepartmentDat;
import com.dat_management.backend.entity.Division;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeCertificate;
import com.dat_management.backend.entity.EmployeeCertificate.CertificateType;
import com.dat_management.backend.entity.EmployeeCertificate.VerificationStatus;
import com.dat_management.backend.entity.EmployeeJapaneseProfile;
import com.dat_management.backend.entity.Team;
import com.dat_management.backend.repository.EmployeeCertificateRepository;
import com.dat_management.backend.repository.EmployeeJapaneseProfileRepository;
import com.dat_management.backend.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final EmployeeCertificateRepository certificateRepository;
    private final EmployeeJapaneseProfileRepository japaneseProfileRepository;
    private final CertificateFileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    // Default (10MB) matches the "Maximum 10 MB" copy shown on the certificate upload form.
    // Keep this in sync with `file.max-size` in application.properties.
    @Value("${file.max-size:10485760}")
    private long maxFileSize;

    private String maxFileSizeLabel() {
        return (maxFileSize / (1024 * 1024)) + "MB";
    }

    private static final Map<String, Integer> JLPT_RANKING = Map.of(
        "N5", 1,
        "N4", 2,
        "N3", 3,
        "N2", 4,
        "N1", 5
    );

    // Convert Entity to DTO
    private CertificateResponseDto toDto(EmployeeCertificate certificate) {
        CertificateResponseDto dto = new CertificateResponseDto();
        dto.setId(certificate.getId());

        if (certificate.getEmployee() != null) {
            Employee employee = certificate.getEmployee();
            dto.setEmployeeId(employee.getId());
            dto.setEmployeeName(employee.getName());
            dto.setEmail(employee.getEmail());
            dto.setProfilePhotoPath(employee.getProfilePhotoPath());
            
            // Get team, department, and division information
            if (employee.getTeam() != null) {
                Team team = employee.getTeam();
                dto.setTeamName(team.getTeamName());
                
                // Get department from team's departmentDat
                if (team.getDepartmentDat() != null) {
                    DepartmentDat deptDat = team.getDepartmentDat();
                    
                    // departmentName from deptName
                    dto.setDepartmentName(deptDat.getDeptName());
                    
                    // Get division name from departmentDat's division relationship
                    if (deptDat.getDivision() != null) {
                        dto.setDivisionName(deptDat.getDivision().getDivisionName());
                    }
                }
            }
        }

        dto.setCertificateType(
                certificate.getCertificateType() != null ? certificate.getCertificateType().name() : null);
        dto.setJapaneseLevel(certificate.getJapaneseLevel());
        dto.setFilePath(certificate.getFilePath());
        dto.setVerificationStatus(
                certificate.getVerificationStatus() != null ? certificate.getVerificationStatus().name() : null);
        dto.setVerifiedAt(certificate.getVerifiedAt());
        dto.setRemark(certificate.getRemark());
        dto.setCreatedAt(certificate.getCreatedAt());

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

    private void updateApprovedJapaneseProfile(Employee employee, CertificateType certificateType, String japaneseLevel) {
    EmployeeJapaneseProfile profile = japaneseProfileRepository.findByEmployeeId(employee.getId())
            .orElseGet(() -> {
                EmployeeJapaneseProfile newProfile = new EmployeeJapaneseProfile();
                newProfile.setEmployee(employee);
                return newProfile;
            });

    String level = japaneseLevel == null ? null : japaneseLevel.trim();

    // Only update JLPT level if it's a JLPT certificate
    if (certificateType == CertificateType.JLPT) {
        String currentLevel = profile.getJlptHighestLevel();

        // Update only if new level is higher or no current level exists
        if (isHigherLevel(level, currentLevel)) {
            profile.setJlptHighestLevel(level);
        }
        // Always set the exam type
        profile.setJlptNatTest(EmployeeJapaneseProfile.JapaneseExamType.JLPT);
    } else {
        // For other certificate types (NAT_TEST, TOP_J, BJT, OTHER)
        String currentLevel = profile.getOtherJapaneseLevel();

        // You might want similar logic for other certificate levels
        // Or just update directly if you don't track other levels
        if (isHigherLevel(level, currentLevel)) {
            profile.setOtherJapaneseLevel(level);
        }

        EmployeeJapaneseProfile.JapaneseExamType examType = mapJapaneseExamType(certificateType);
        if (examType != null) {
            profile.setJlptNatTest(examType);
        }
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
                throw new RuntimeException("File size exceeds maximum allowed size (" + maxFileSizeLabel() + ")");
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
                    throw new RuntimeException("File size exceeds maximum allowed size (" + maxFileSizeLabel() + ")");
                }
            }
        }
    }

    @Transactional
    public CertificateResponseDto verifyCertificate(
            Integer id,
            Employee verifier,
            String remark) {

        EmployeeCertificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found with ID: " + id));

        certificate.setVerificationStatus(VerificationStatus.APPROVED);
        certificate.setVerifiedBy(verifier);
        certificate.setVerifiedAt(LocalDateTime.now());
        certificate.setRemark(remark);

        updateApprovedJapaneseProfile(
                certificate.getEmployee(),
                certificate.getCertificateType(),
                certificate.getJapaneseLevel());

        EmployeeCertificate verifiedCertificate = certificateRepository.save(certificate);
        notificationService.send(
                certificate.getEmployee(),
                NotificationType.CERTIFICATE,
                "Certificate approved",
                "Your " + certificate.getCertificateType().name() + " certificate (" + certificate.getJapaneseLevel() + ") has been approved.",
                certificate.getId());
        return toDto(verifiedCertificate);
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
        notificationService.sendToAdmins(
                NotificationType.CERTIFICATE,
                "Certificate submitted for approval",
                employee.getName() + " uploaded a " + enumCertType.name() + " certificate (" + level + ") for review.",
                savedCertificate.getId());
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
    public CertificateResponseDto rejectCertificate(
            Integer id,
            Employee verifier,
            String remark) {

        EmployeeCertificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found with ID: " + id));

        certificate.setVerificationStatus(VerificationStatus.REJECTED);
        certificate.setVerifiedBy(verifier);
        certificate.setVerifiedAt(LocalDateTime.now());
        certificate.setRemark(remark);

        EmployeeCertificate rejectedCertificate = certificateRepository.save(certificate);
        String reason = remark == null || remark.isBlank() ? "" : " Remark: " + remark;
        notificationService.send(
                certificate.getEmployee(),
                NotificationType.CERTIFICATE,
                "Certificate rejected",
                "Your " + certificate.getCertificateType().name() + " certificate (" + certificate.getJapaneseLevel() + ") was rejected." + reason,
                certificate.getId());
        return toDto(rejectedCertificate);
    }

    @Transactional
    public void deleteCertificate(Integer id, Employee currentUser) throws IOException {
        EmployeeCertificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found with ID: " + id));

        // Only the owner can delete their certificates
        String ownerId = certificate.getEmployee().getId();
        String currentUserId = currentUser.getId();

        notificationRepository.nullifyCertificateReference(id);

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

    private boolean isHigherLevel(String newLevel, String currentLevel) {
        if (newLevel == null || currentLevel == null) {
            return newLevel != null; // If new is not null but current is null, it's higher
        }

        Integer newRank = JLPT_RANKING.get(newLevel.toUpperCase());
        Integer currentRank = JLPT_RANKING.get(currentLevel.toUpperCase());

        if (newRank == null) return false; // Invalid level
        if (currentRank == null) return true; // Current is invalid, so new is higher

        return newRank > currentRank;
    }
}