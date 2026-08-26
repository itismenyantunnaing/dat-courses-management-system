package com.dat_management.backend.repository;

import com.dat_management.backend.entity.Skill;
import com.dat_management.backend.entity.SkillSubCategory;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SkillRepository extends JpaRepository<Skill, Integer> {
    Optional<Skill> findBySkillNameIgnoreCaseAndSubCategoryId(String skillName, Integer subCategoryId);
    Optional<Skill> findBySkillNameIgnoreCase(String skillName);
    List<Skill> findBySubCategoryId(Integer subCategoryId);

    Optional<Skill> findBySkillNameAndSubCategory(String skillName, SkillSubCategory subCategory);
    
    List<Skill> findByIsActiveTrue();
}