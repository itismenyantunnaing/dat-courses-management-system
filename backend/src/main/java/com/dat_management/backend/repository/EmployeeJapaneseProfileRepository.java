package com.dat_management.backend.repository;

import com.dat_management.backend.entity.EmployeeJapaneseProfile;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface EmployeeJapaneseProfileRepository extends JpaRepository<EmployeeJapaneseProfile, Integer> {


    boolean existsByEmployeeId(String employeeId);

    @Query("""
                SELECT p FROM EmployeeJapaneseProfile p
                JOIN FETCH p.employee e
                LEFT JOIN FETCH e.team t
                LEFT JOIN FETCH t.departmentDat d
                WHERE e.isDeleted = false
            """)
    List<EmployeeJapaneseProfile> findAllWithEmployee();
}
    Optional<EmployeeJapaneseProfile> findByEmployeeId(String employeeId);
}
