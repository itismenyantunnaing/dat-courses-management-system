package com.dat_management.backend.repository;

import com.dat_management.backend.entity.Employee;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {

    Optional<Employee> findByEmail(String email);
    Boolean existsByEmail(String email);

    List<Employee> findAllByIsDeletedFalse();
    Optional<Employee> findByIdAndIsDeletedFalse(String id);
    boolean existsByIdAndIsDeletedFalse(String id);
    List<Employee> findByEmpStatusAndIsDeletedFalse(String empStatus);
    List<Employee> findByIsDeletedTrue();
    Optional<Employee> findByIdAndIsDeletedTrue(String id);

    @Query("SELECT e FROM Employee e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :name, '%')) AND e.isDeleted = false")
    List<Employee> searchByName(@Param("name") String name);

    @Query("SELECT e.team.id FROM Employee e WHERE e.id = :employeeId")
    Optional<String> findTeamIdByEmployeeId(@Param("employeeId") String employeeId);

    @Query("SELECT e FROM Employee e WHERE e.team.id = :teamId AND e.isDeleted = false")
    List<Employee> findByTeamIdAndIsDeletedFalse(@Param("teamId") Integer teamId);

     @Query("SELECT e FROM Employee e " +
           "LEFT JOIN FETCH e.role " +
           "LEFT JOIN FETCH e.team " +
           "LEFT JOIN FETCH e.team.departmentDat " +
           "LEFT JOIN FETCH e.team.departmentDat.division " +
           "WHERE e.id = :employeeId")
    Optional<Employee> findByIdWithRelationships(@Param("employeeId") String employeeId);
    
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.empStatus = 'active' AND e.isDeleted = false")
    Long countActiveEmployees();
    
    @Query("SELECT COUNT(e) FROM Employee e " +
           "WHERE e.empStatus = 'active' " +
           "AND e.isDeleted = false " +
           "AND e.team.departmentDat.division.id = :divisionId")
    Long countActiveEmployeesByDivisionId(@Param("divisionId") Integer divisionId);
    
    @Query("SELECT COUNT(e) FROM Employee e " +
           "WHERE e.empStatus = 'active' " +
           "AND e.isDeleted = false " +
           "AND e.team.departmentDat.id = :departmentId")
    Long countActiveEmployeesByDepartmentId(@Param("departmentId") Integer departmentId);
    
    @Query("SELECT COUNT(e) FROM Employee e " +
           "WHERE e.empStatus = 'active' " +
           "AND e.isDeleted = false " +
           "AND e.team.id = :teamId")
    Long countActiveEmployeesByTeamId(@Param("teamId") Integer teamId);

    @EntityGraph(attributePaths = {"team", "departmentDir"})
    Optional<Employee> findById(String id);

    Optional<Employee> findByDoorlog(String doorlog);
    @EntityGraph(attributePaths = {"team", "departmentDir"})
    List<Employee> findByIsDeletedFalse();
    @EntityGraph(attributePaths = {"team", "departmentDir"})
    List<Employee> findByDepartmentDirId(Integer departmentDirId);
    @EntityGraph(attributePaths = {"team", "departmentDir"})
    List<Employee> findByTeamId(Integer teamId);
    
    @Query("SELECT e FROM Employee e WHERE e.isDeleted = false AND e.team.departmentDat.id = :deptDatId")
    List<Employee> findByDepartmentDatId(@Param("deptDatId") Integer deptDatId);
    
}