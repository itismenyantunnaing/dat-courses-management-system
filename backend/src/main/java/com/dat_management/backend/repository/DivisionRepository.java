package com.dat_management.backend.repository;

import com.dat_management.backend.entity.Division;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DivisionRepository extends JpaRepository<Division, Integer> {
    Optional<Division> findByDivisionName(String divisionName);
}