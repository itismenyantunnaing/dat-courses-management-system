package com.dat_management.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dat_management.backend.entity.AttendanceRecord;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Integer> {

}