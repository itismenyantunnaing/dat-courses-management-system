package com.dat_management.backend.repository;

import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeCertificate;
import com.dat_management.backend.entity.EmployeeCertificate.CertificateType;
import com.dat_management.backend.entity.EmployeeCertificate.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeCertificateRepository extends JpaRepository<EmployeeCertificate, Integer> {
    
    List<EmployeeCertificate> findByEmployee(Employee employee);
    
    // Change parameter types from String to CertificateType
    EmployeeCertificate findByEmployeeAndCertificateTypeAndJapaneseLevel(
        Employee employee, 
        CertificateType certificateType, 
        String japaneseLevel
    );
    
    // Change parameter type from String to CertificateType
    boolean existsByEmployeeAndCertificateTypeAndJapaneseLevel(
        Employee employee, 
        CertificateType certificateType, 
        String japaneseLevel
    );
    
    // Change parameter type from String to VerificationStatus
    List<EmployeeCertificate> findByVerificationStatus(VerificationStatus status);
    
    // Optional: If you need to find by string status
    List<EmployeeCertificate> findByVerificationStatusIgnoreCase(String status);
}