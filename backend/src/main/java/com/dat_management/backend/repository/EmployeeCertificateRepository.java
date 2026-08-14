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
    
    EmployeeCertificate findByEmployeeAndCertificateTypeAndJapaneseLevel(
        Employee employee, 
        CertificateType certificateType, 
        String japaneseLevel
    );
    
    boolean existsByEmployeeAndCertificateTypeAndJapaneseLevel(
        Employee employee, 
        CertificateType certificateType, 
        String japaneseLevel
    );
    
    List<EmployeeCertificate> findByVerificationStatus(VerificationStatus status);
    
    List<EmployeeCertificate> findByVerificationStatusIgnoreCase(String status);

    @Query("SELECT ec.certificateType, ec.japaneseLevel, COUNT(ec) " +
           "FROM EmployeeCertificate ec " +
           "WHERE ec.verificationStatus = 'APPROVED' " +
           "GROUP BY ec.certificateType, ec.japaneseLevel")
    List<Object[]> countVerifiedCertificatesByTypeAndLevel();
    
    @Query("SELECT e.team.teamName, ec.certificateType, ec.japaneseLevel, COUNT(ec) " +
           "FROM EmployeeCertificate ec " +
           "JOIN ec.employee e " +
           "WHERE ec.verificationStatus = 'APPROVED' " +
           "AND e.team.id IS NOT NULL " +
           "GROUP BY e.team.teamName, ec.certificateType, ec.japaneseLevel")
    List<Object[]> countVerifiedCertificatesByTeamTypeAndLevel();

    @Query("SELECT e.team.departmentDat.deptName, ec.certificateType, ec.japaneseLevel, COUNT(ec) " +
           "FROM EmployeeCertificate ec " +
           "JOIN ec.employee e " +
           "WHERE ec.verificationStatus = 'APPROVED' " +
           "AND e.team.departmentDat.id IS NOT NULL " +
           "AND e.team.departmentDat.isDeleted = false " +
           "GROUP BY e.team.departmentDat.deptName, ec.certificateType, ec.japaneseLevel")
    List<Object[]> countVerifiedCertificatesByDepartmentTypeAndLevel();

    @Query("SELECT e.team.departmentDat.division.divisionName, ec.certificateType, ec.japaneseLevel, COUNT(ec) " +
           "FROM EmployeeCertificate ec " +
           "JOIN ec.employee e " +
           "WHERE ec.verificationStatus = 'APPROVED' " +
           "AND e.team.departmentDat.division.id IS NOT NULL " +
           "AND e.team.departmentDat.division.isDeleted = false " +
           "GROUP BY e.team.departmentDat.division.divisionName, ec.certificateType, ec.japaneseLevel")
    List<Object[]> countVerifiedCertificatesByDivisionTypeAndLevel();
    
    // Department with Team breakdown
    @Query("SELECT e.team.departmentDat.deptName, e.team.teamName, ec.certificateType, ec.japaneseLevel, COUNT(ec) " +
           "FROM EmployeeCertificate ec " +
           "JOIN ec.employee e " +
           "WHERE ec.verificationStatus = 'APPROVED' " +
           "AND e.team.departmentDat.id IS NOT NULL " +
           "AND e.team.departmentDat.isDeleted = false " +
           "AND e.team.isDeleted = false " +
           "GROUP BY e.team.departmentDat.deptName, e.team.teamName, ec.certificateType, ec.japaneseLevel")
    List<Object[]> countVerifiedCertificatesByDepartmentTeamTypeAndLevel();

    // Division with Department and Team breakdown (Complete hierarchy)
    @Query("SELECT e.team.departmentDat.division.divisionName, " +
           "e.team.departmentDat.deptName, " +
           "e.team.teamName, " +
           "ec.certificateType, " +
           "ec.japaneseLevel, " +
           "COUNT(ec) " +
           "FROM EmployeeCertificate ec " +
           "JOIN ec.employee e " +
           "WHERE ec.verificationStatus = 'APPROVED' " +
           "AND e.team.departmentDat.division.id IS NOT NULL " +
           "AND e.team.departmentDat.division.isDeleted = false " +
           "AND e.team.departmentDat.isDeleted = false " +
           "AND e.team.isDeleted = false " +
           "GROUP BY e.team.departmentDat.division.divisionName, " +
           "e.team.departmentDat.deptName, " +
           "e.team.teamName, " +
           "ec.certificateType, " +
           "ec.japaneseLevel")
    List<Object[]> countVerifiedCertificatesByDivisionDepartmentTeamTypeAndLevel();
    
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.isDeleted = false")
    long countTotalEmployees();
    
    @Query("SELECT e.team.teamName, COUNT(e) " +
           "FROM Employee e " +
           "WHERE e.team.id IS NOT NULL " +
           "AND e.isDeleted = false " +
           "GROUP BY e.team.teamName")
    List<Object[]> countEmployeesByTeam();
    
    @Query("SELECT COUNT(e) FROM Employee e " +
           "WHERE e.team.teamName = :teamName " +
           "AND e.isDeleted = false")
    long countEmployeesByTeamName(@Param("teamName") String teamName);
}