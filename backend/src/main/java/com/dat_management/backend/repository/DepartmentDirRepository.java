package com.dat_management.backend.repository;

import com.dat_management.backend.entity.DepartmentDir;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentDirRepository extends JpaRepository<DepartmentDir, Integer> {
}
