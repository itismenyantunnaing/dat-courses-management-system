package com.dat_management.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.NotificationRecipient;

@Repository
public interface NotificationRecipientRepository extends JpaRepository<NotificationRecipient, Integer> {
    
    List<NotificationRecipient> findByEmployeeAndIsReadFalse(Employee employee);
    
    List<NotificationRecipient> findByEmployeeOrderByNotificationCreatedAtDesc(Employee employee);
    
    long countByEmployeeAndIsReadFalse(Employee employee);
    
    Optional<NotificationRecipient> findByNotificationIdAndEmployee(Integer notificationId, Employee employee);
    
    List<NotificationRecipient> findByEmployee(Employee employee);
    
    long countByNotificationId(Integer notificationId);
}