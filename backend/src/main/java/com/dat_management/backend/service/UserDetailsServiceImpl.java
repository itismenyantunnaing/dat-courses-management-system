package com.dat_management.backend.service;

import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final EmployeeRepository employeeRepository;


    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {

        Employee employee = employeeRepository.findById(userId)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with ID: " + userId)
                );

        return org.springframework.security.core.userdetails.User.builder()
                .username(employee.getId())
                .password(employee.getPassword())
                .authorities("ROLE_" + employee.getRole().getRoleName()) // 🔥 IMPORTANT FIX
                .accountLocked(false)
                .disabled(false)
                .build();
    }
}