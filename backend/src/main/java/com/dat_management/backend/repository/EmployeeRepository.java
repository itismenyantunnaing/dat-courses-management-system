package com.dat_management.backend.repository;

import com.dat_management.backend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {

    Optional<Employee> findById(String id);
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
}