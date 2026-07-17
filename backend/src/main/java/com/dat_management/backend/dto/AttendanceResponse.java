package com.dat_management.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.dat_management.backend.entity.AttendanceRecord.AttendanceStatus;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AttendanceResponse {

    private Integer id;

    private Integer enrollmentId;

    private String employeeId;

    private String employeeName;

    private Integer courseSessionId;

    private short sessionNo;

    private LocalDate sessionDate;

    private AttendanceStatus attendanceStatus;

    private LocalDateTime registeredAt;
}