package com.dat_management.backend.repository;

import com.dat_management.backend.entity.DevelopmentType;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DevelopmentTypeRepository extends JpaRepository<DevelopmentType, Integer> {
    Optional<DevelopmentType> findByDevelopmentTypeNameIgnoreCase(String developmentTypeName);

    List<DevelopmentType> findByIsActiveTrue();
}
