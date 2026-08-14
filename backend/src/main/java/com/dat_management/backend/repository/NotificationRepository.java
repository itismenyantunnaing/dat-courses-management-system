package com.dat_management.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    
    List<Notification> findAllByOrderByCreatedAtDesc();
    
    // Find notifications for a specific employee through NotificationRecipient
    @Query("SELECT DISTINCT n FROM Notification n " +
           "JOIN NotificationRecipient nr ON nr.notification = n " +
           "WHERE nr.employee = :employee " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findByEmployee(@Param("employee") Employee employee);
    
    // Find unread notifications for a specific employee
    @Query("SELECT DISTINCT n FROM Notification n " +
           "JOIN NotificationRecipient nr ON nr.notification = n " +
           "WHERE nr.employee = :employee AND nr.isRead = false " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findByEmployeeAndIsReadFalse(@Param("employee") Employee employee);
    
    // Count unread notifications for a specific employee
    @Query("SELECT COUNT(n) FROM Notification n " +
           "JOIN NotificationRecipient nr ON nr.notification = n " +
           "WHERE nr.employee = :employee AND nr.isRead = false")
    long countUnreadByEmployee(@Param("employee") Employee employee);

    @Modifying
    @Query("UPDATE Notification n SET n.certificate = NULL WHERE n.certificate.id = :certificateId")
    int nullifyCertificateReference(@Param("certificateId") Integer certificateId);
}