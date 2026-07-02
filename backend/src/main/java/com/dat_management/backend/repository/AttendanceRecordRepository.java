package com.dat_management.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dat_management.backend.entity.AttendanceRecord;

public interface AttendanceRecordRepository
        extends JpaRepository<AttendanceRecord, Integer> {

  List<AttendanceRecord> findByCourseSession_Course_IdAndCourseSession_CourseGroup_Id(
        Integer courseId,
        Integer groupId
);

    Optional<AttendanceRecord> findByEnrollment_IdAndCourseSession_Id(
            Integer enrollmentId,
            Integer courseSessionId);
}