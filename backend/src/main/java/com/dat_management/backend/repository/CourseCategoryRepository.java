package com.dat_management.backend.repository;

import com.dat_management.backend.entity.CourseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseCategoryRepository extends JpaRepository<CourseCategory, Integer> {

    List<CourseCategory> findAllByIsDeletedFalse();

    List<CourseCategory> findByIsDeletedFalse();
}