package com.dat_management.backend.repository;

import com.dat_management.backend.entity.DepartmentDir;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.List;

public interface DepartmentDirRepository
        extends JpaRepository<DepartmentDir, Integer> {

    Optional<DepartmentDir> findByDeptNameAndIsDeletedFalse(String deptName);

    // Query to get all department names
    @Query("SELECT d.deptName FROM DepartmentDir d ")
    List<String> findAllDepartmentNames();
}   