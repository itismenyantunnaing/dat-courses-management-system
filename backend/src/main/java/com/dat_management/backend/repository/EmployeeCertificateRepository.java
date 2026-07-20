package com.dat_management.backend.repository;

import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeCertificate;
import com.dat_management.backend.entity.EmployeeCertificate.CertificateType;
import com.dat_management.backend.entity.EmployeeCertificate.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

     @Query("SELECT ec.certificateType, ec.japaneseLevel, COUNT(ec) " +
           "FROM EmployeeCertificate ec " +
           "WHERE ec.verificationStatus = 'APPROVED' " +
           "GROUP BY ec.certificateType, ec.japaneseLevel")
    List<Object[]> countVerifiedCertificatesByTypeAndLevel();
    
    // Query for team-wise verified certificates count
    @Query("SELECT e.team.teamName, ec.certificateType, ec.japaneseLevel, COUNT(ec) " +
           "FROM EmployeeCertificate ec " +
           "JOIN ec.employee e " +
           "WHERE ec.verificationStatus = 'APPROVED' " +
           "AND e.team.id IS NOT NULL " +
           "GROUP BY e.team.teamName, ec.certificateType, ec.japaneseLevel")
    List<Object[]> countVerifiedCertificatesByTeamTypeAndLevel();
    
    // Count total employees
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.isDeleted = false")
    long countTotalEmployees();
    
    // Count employees in each team
    @Query("SELECT e.team.teamName, COUNT(e) " +
           "FROM Employee e " +
           "WHERE e.team.id IS NOT NULL " +
           "AND e.isDeleted = false " +
           "GROUP BY e.team.teamName")
    List<Object[]> countEmployeesByTeam();
    
    // Optional: Count employees in a specific team
    @Query("SELECT COUNT(e) FROM Employee e " +
           "WHERE e.team.teamName = :teamName " +
           "AND e.isDeleted = false")
    long countEmployeesByTeamName(@Param("teamName") String teamName);
} 