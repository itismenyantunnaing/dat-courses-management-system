package com.dat_management.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dat_management.backend.entity.CourseGroup;

public interface CourseGroupRepository extends JpaRepository<CourseGroup, Integer> {

}