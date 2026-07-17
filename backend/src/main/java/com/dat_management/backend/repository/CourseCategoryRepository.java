package com.dat_management.backend.repository;

import com.dat_management.backend.entity.CourseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseCategoryRepository extends JpaRepository<CourseCategory, Integer> {

    // API 6: only non-deleted categories
    List<CourseCategory> findByIsDeletedFalse();
}