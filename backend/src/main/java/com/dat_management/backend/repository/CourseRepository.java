package com.dat_management.backend.repository;

import com.dat_management.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Integer> {

    // API 1: all non-deleted courses, newest first
    List<Course> findByIsDeletedFalseOrderByCreatedAtDesc();

    // API 2, 4, 5: single non-deleted course
    Optional<Course> findByIdAndIsDeletedFalse(Integer id);

    List<Course> findByIsDeletedFalse();
}