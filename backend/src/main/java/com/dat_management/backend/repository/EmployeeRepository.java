// repository/UserRepository.java

package com.dat_management.backend.repository;

import com.dat_management.backend.entity.Employee;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {

    Optional<Employee> findById(String id);

    Optional<Employee> findByEmail(String email);

    Boolean existsByEmail(String email);
}