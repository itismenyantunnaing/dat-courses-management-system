package com.dat_management.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dat_management.backend.entity.Announcement;


public interface AnnouncementRepository extends JpaRepository<Announcement, Integer> {
}