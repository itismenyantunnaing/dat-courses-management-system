package com.dat_management.backend.repository;

import com.dat_management.backend.entity.DepartmentDat;
import com.dat_management.backend.entity.Division;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentDatRepository extends JpaRepository<DepartmentDat, Integer> {
    Optional<DepartmentDat> findByDeptNameAndDivision(String deptName, Division division);
}