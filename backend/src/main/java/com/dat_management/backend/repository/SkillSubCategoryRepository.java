package com.dat_management.backend.repository;

import com.dat_management.backend.entity.SkillCategory;
import com.dat_management.backend.entity.SkillSubCategory;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SkillSubCategoryRepository extends JpaRepository<SkillSubCategory, Integer> {
    Optional<SkillSubCategory> findBySubCategoryNameIgnoreCaseAndCategoryId(String subCategoryName, Integer categoryId);
    Optional<SkillSubCategory> findBySubCategoryNameIgnoreCase(String subCategoryName);
    List<SkillSubCategory> findByCategoryId(Integer categoryId);

    Optional<SkillSubCategory> findBySubCategoryName(String subCategoryName);

    Optional<SkillSubCategory> findBySubCategoryNameAndCategory(String subCategoryName, SkillCategory category);
    
    List<SkillSubCategory> findByIsActiveTrue();
}
