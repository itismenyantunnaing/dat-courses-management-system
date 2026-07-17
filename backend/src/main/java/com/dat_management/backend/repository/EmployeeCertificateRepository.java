package com.dat_management.backend.repository;

import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeCertificate;
import com.dat_management.backend.entity.EmployeeCertificate.CertificateType;
import com.dat_management.backend.entity.EmployeeCertificate.VerificationStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeCertificateRepository extends JpaRepository<EmployeeCertificate, Integer> {
    
    @EntityGraph(attributePaths = {"employee", "employee.team"})
    List<EmployeeCertificate> findByEmployee(Employee employee);
    
    // Change parameter types from String to CertificateType
    @EntityGraph(attributePaths = {"employee", "employee.team"})
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
    @EntityGraph(attributePaths = {"employee", "employee.team"})
    List<EmployeeCertificate> findByVerificationStatus(VerificationStatus status);
    
    // Optional: If you need to find by string status
    @EntityGraph(attributePaths = {"employee", "employee.team"})
    List<EmployeeCertificate> findByVerificationStatusIgnoreCase(String status);

    @EntityGraph(attributePaths = {"employee", "employee.team"})
    @Override
    List<EmployeeCertificate> findAll();

    @EntityGraph(attributePaths = {"employee", "employee.team"})
    @Override
    Optional<EmployeeCertificate> findById(Integer id);
}