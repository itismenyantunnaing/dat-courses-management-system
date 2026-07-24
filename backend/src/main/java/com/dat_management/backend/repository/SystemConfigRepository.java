package com.dat_management.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dat_management.backend.entity.SystemConfig;

public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {
}