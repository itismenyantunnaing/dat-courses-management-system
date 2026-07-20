package com.dat_management.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.dat_management.backend.entity.AttendanceRecord;

public interface AttendanceRecordRepository
                extends JpaRepository<AttendanceRecord, Integer> {

        List<AttendanceRecord> findByCourseSession_Course_IdAndCourseSession_CourseGroup_Id(
                        Integer courseId,
                        Integer groupId);

        Optional<AttendanceRecord> findByEnrollment_IdAndCourseSession_Id(
                        Integer enrollmentId,
                        Integer courseSessionId);

        long countByEnrollmentIdAndAttendanceStatus(
                        Integer enrollmentId,
                        AttendanceRecord.AttendanceStatus status);

        // Add this method for counting attendance by month and year
        @Query("SELECT COUNT(ar) FROM AttendanceRecord ar WHERE ar.enrollment.id = :enrollmentId " +
                        "AND ar.attendanceStatus = :status " +
                        "AND FUNCTION('MONTH', ar.courseSession.sessionDate) = :month " +
                        "AND FUNCTION('YEAR', ar.courseSession.sessionDate) = :year")
        long countByEnrollmentIdAndAttendanceStatusAndMonthAndYear(@Param("enrollmentId") Integer enrollmentId,
                        @Param("status") AttendanceRecord.AttendanceStatus status,
                        @Param("month") Integer month,
                        @Param("year") Integer year);

        List<AttendanceRecord> findByEnrollmentId(Integer enrollmentId);

        @Query("SELECT COUNT(ar) FROM AttendanceRecord ar WHERE ar.enrollment.id = :enrollmentId " +
                        "AND ar.attendanceStatus = :status " +
                        "AND ar.courseSession.id = :sessionId")
        long countByEnrollmentIdAndAttendanceStatusAndSessionId(@Param("enrollmentId") Integer enrollmentId,
                        @Param("status") AttendanceRecord.AttendanceStatus status,
                        @Param("sessionId") Integer sessionId);
}