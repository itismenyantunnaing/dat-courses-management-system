package com.dat_management.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Locale;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Employee implements UserDetails {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String status = "default";

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    @ManyToOne
    @JoinColumn(name = "department_dir_id")
    private DepartmentDir departmentDir;

    @Column(unique = true)
    private String doorlog;

    @Column(nullable = false)
    private String position;

    @Column(name = "emp_status", nullable = false)
    private String empStatus = "active";
    
    @Column(name = "failed_login_attempts", nullable = false)
    private Integer failedLoginAttempts = 0;

    @Column(name = "account_locked_until")
    private LocalDateTime accountLockedUntil;

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;

    private LocalDate dob;

    private String profilePhotoPath;

    @Column(nullable = false)
    private Boolean isCorePersonnel = false;

    @Column(nullable = false)
    private Boolean hasJapanBusinessTrip = false;

    @Column(nullable = false)
    private Boolean notiSetting = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isDeleted = false;
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (empStatus == null) {
            empStatus = "active";}
        if (status == null) {
            status = "default";
        }

    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role != null && role.getRoleName() != null) {
            String normalizedRole = role.getRoleName().trim().toUpperCase(Locale.ROOT);
            return List.of(new SimpleGrantedAuthority("ROLE_" + normalizedRole));
        }
        return List.of(new SimpleGrantedAuthority("ROLE_STAFF"));
    }

    @Override
    public String getUsername() {
        return this.id;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountLockedUntil == null || accountLockedUntil.isBefore(LocalDateTime.now());
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}