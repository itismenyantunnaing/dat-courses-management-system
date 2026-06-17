package com.dat_management.backend.repository;

import com.dat_management.backend.entity.Holiday;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Integer> {
    boolean existsByHolidayDate(LocalDate holidayDate);
    Optional<Holiday> findByHolidayDate(LocalDate holidayDate);
}
