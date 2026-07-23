package com.dat_management.backend.repository;

import com.dat_management.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {

    List<Course> findAllByIsDeletedFalse();
    Optional<Course> findByIdAndIsDeletedFalse(Integer id);
    List<Course> findAllByIsDeletedTrue();
    Optional<Course> findByIdAndIsDeletedTrue(Integer id);

    List<Course> findByIsDeletedFalseOrderByCreatedAtDesc();
    List<Course> findByIsDeletedFalse();
}