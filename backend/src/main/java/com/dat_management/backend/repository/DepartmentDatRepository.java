package com.dat_management.backend.repository;

import com.dat_management.backend.entity.DepartmentDat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentDatRepository extends JpaRepository<DepartmentDat, Integer> {
}
