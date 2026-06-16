package com.dat_management.backend.repository;

import com.dat_management.backend.entity.EmployeeJapaneseProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeJapaneseProfileRepository extends JpaRepository<EmployeeJapaneseProfile, Integer> {
}
