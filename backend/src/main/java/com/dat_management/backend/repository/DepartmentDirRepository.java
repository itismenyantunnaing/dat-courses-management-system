package com.dat_management.backend.repository;

import com.dat_management.backend.entity.DepartmentDir;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DepartmentDirRepository
        extends JpaRepository<DepartmentDir, Integer> {

    Optional<DepartmentDir> findByDeptNameAndIsDeletedFalse(String deptName);
}