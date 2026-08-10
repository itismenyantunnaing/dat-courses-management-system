package com.dat_management.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificateResponseDto {
    private Integer id;
    private String employeeId;
    private String employeeName;
    private String profilePhotoPath; 
    private String email;
    private String teamName;
    private String certificateType;
    private String japaneseLevel;
    private String filePath;
    private String verificationStatus;
    private String verifiedByEmployeeId;
    private String verifiedByEmployeeName;
    private LocalDateTime verifiedAt;
    private String remark;
    private LocalDateTime createdAt;
}