package com.dat_management.backend.repository;

import com.dat_management.backend.dto.UpcomingSessionResponse;
import com.dat_management.backend.entity.CourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Integer> {

    // Enrollments per group — used in API 2 to build enrollments[] inside each
    // group
    List<CourseEnrollment> findByCourseGroupId(Integer courseGroupId);

    Long countByCourseId(Integer courseId);

    List<CourseEnrollment> findByCourseId(Integer courseId);

    // Duplicate-enroll guard
    boolean existsByEmployeeIdAndCourseId(String employeeId, Integer courseId);

    @Query("""
                SELECT COUNT(ce) > 0
                FROM CourseEnrollment ce
                WHERE ce.employee.id = :employeeId
                AND ce.course.id = :courseId
            """)
    boolean existsEnrollment(
            @Param("employeeId") String employeeId,
            @Param("courseId") Integer courseId);

    @Query("SELECT e FROM CourseEnrollment e WHERE e.courseGroup.id = :groupId ORDER BY e.enrolledAt ASC")
    List<CourseEnrollment> findByCourseGroupIdOrderByEnrolledAtAsc(@Param("groupId") Integer groupId);

    @Modifying
    @Query("UPDATE CourseEnrollment e SET e.courseGroup.id = :newGroupId WHERE e.id = :enrollmentId")
    void updateEnrollmentGroup(@Param("enrollmentId") Integer enrollmentId,
            @Param("newGroupId") Integer newGroupId);

    @Query("SELECT ce FROM CourseEnrollment ce WHERE ce.enrollmentStatus = 'APPROVED' " +
            "AND ce.employee.isDeleted = false " +
            "AND ce.employee.empStatus = 'active' " +
            "AND ce.course.isDeleted = false")
    List<CourseEnrollment> findAllApprovedActiveEnrollments();

    @Query("SELECT ce FROM CourseEnrollment ce WHERE ce.employee.id = :employeeId " +
            "AND ce.enrollmentStatus = 'APPROVED' " +
            "AND ce.course.isDeleted = false")
    List<CourseEnrollment> findActiveEnrollmentsByEmployeeId(@Param("employeeId") String employeeId);

    /*
     * ===============================================
     * TRAINER PROVIDED SESSIONS
     * ===============================================
     */

    @Query("""
                SELECT
                    c.id,
                    ce.courseGroup.id,
                    cs.id,
                    ar.id,
                    NULL,
                    c.courseName,
                    CAST(c.courseCategory.courseType AS string),
                    cs.sessionNo,
                    cs.sessionDate,
                    cs.startTime,
                    cs.endTime,
                    NULL,
                    NULL,
                    CASE
                        WHEN cs.sessionDate = CURRENT_DATE
                        THEN 'ACTIVE'
                        ELSE 'UPCOMING'
                    END,
                    CAST(ar.attendanceStatus AS string),
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL

                FROM CourseEnrollment ce

                JOIN ce.course c

                JOIN CourseSession cs
                    ON cs.course.id = c.id
                    AND cs.courseGroup.id = ce.courseGroup.id

                LEFT JOIN AttendanceRecord ar
                    ON ar.enrollment.id = ce.id
                    AND ar.courseSession.id = cs.id

                WHERE ce.employee.id = :employeeId
                  AND c.courseCategory.courseType =
                    com.dat_management.backend.entity.CourseCategory.CourseType.TRAINER_PROVIDED
                  AND cs.sessionDate >= CURRENT_DATE

                ORDER BY cs.sessionDate ASC
            """)
    List<Object[]> findUpcomingTrainerSessions(
            @Param("employeeId") String employeeId);

    /*
     * ===============================================
     * SELF STUDY SESSIONS
     * ===============================================
     */

    @Query("""
                SELECT
                    c.id,
                    ce.courseGroup.id,
                    sss.id,
                    NULL,
                    sp.id,
                    c.courseName,
                    CAST(c.courseCategory.courseType AS string),
                    sss.sessionNo,
                    NULL,
                    NULL,
                    NULL,
                    sp.sessionDeadline,
                    sss.durationPerSession,
                    sss.sessionStatus,
                    NULL,
                    sp.grammarCount,
                    sp.vocabularyCount,
                    sp.kanjiCount,
                    sp.readingMinutes,
                    sp.listeningMinutes,
                    sss.grammarTarget,
                    sss.vocabularyTarget,
                    sss.kanjiTarget,
                    sss.readingTargetMinutes,
                    sss.listeningTargetMinutes,
                    sp.completionStatus

                FROM CourseEnrollment ce

                JOIN ce.course c

                JOIN SelfStudySession sss
                    ON sss.course.id = c.id

                LEFT JOIN SelfStudySessionProgress sp
                    ON sp.enrollment.id = ce.id
                    AND sp.selfStudySession.id = sss.id

                WHERE ce.employee.id = :employeeId
                  AND c.courseCategory.courseType =
                    com.dat_management.backend.entity.CourseCategory.CourseType.SELF_STUDY
                    AND sp.sessionDeadline >= CURRENT_TIMESTAMP

                ORDER BY sp.sessionDeadline ASC
            """)
    List<Object[]> findUpcomingSelfStudySessions(
            @Param("employeeId") String employeeId);
}
