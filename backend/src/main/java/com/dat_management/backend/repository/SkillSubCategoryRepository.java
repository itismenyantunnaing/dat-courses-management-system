package com.dat_management.backend.repository;

import com.dat_management.backend.entity.SkillSubCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SkillSubCategoryRepository extends JpaRepository<SkillSubCategory, Integer> {
}
