package com.dat_management.backend.repository;

import com.dat_management.backend.entity.EmployeeJapaneseProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeJapaneseProfileRepository extends JpaRepository<EmployeeJapaneseProfile, Integer> {

    Optional<EmployeeJapaneseProfile> findByEmployeeId(String employeeId);

    boolean existsByEmployeeId(String employeeId);
}
