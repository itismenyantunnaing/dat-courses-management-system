package com.dat_management.backend.dto;

import com.dat_management.backend.entity.AttendanceRecord.AttendanceStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AttendanceRequest {

    private Integer enrollmentId;
    private Integer courseSessionId;
    private AttendanceStatus attendanceStatus;
}