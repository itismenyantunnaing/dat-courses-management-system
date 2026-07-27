package com.dat_management.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByEmployeeOrderByCreatedAtDesc(Employee employee);
    List<Notification> findByEmployeeAndIsReadFalseOrderByCreatedAtDesc(Employee employee);
    long countByEmployeeAndIsReadFalse(Employee employee);
}
