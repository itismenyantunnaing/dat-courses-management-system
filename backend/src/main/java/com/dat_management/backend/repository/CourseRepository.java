package com.dat_management.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dat_management.backend.entity.Course;

public interface CourseRepository extends JpaRepository<Course, Integer> {

}