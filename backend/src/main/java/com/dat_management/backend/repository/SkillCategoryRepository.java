package com.dat_management.backend.repository;

import com.dat_management.backend.entity.SkillCategory;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SkillCategoryRepository extends JpaRepository<SkillCategory, Integer> {
    Optional<SkillCategory> findByCategoryNameIgnoreCase(String categoryName);
}
