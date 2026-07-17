// In CourseSessionRepository.java
package com.dat_management.backend.repository;

import com.dat_management.backend.entity.CourseSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CourseSessionRepository extends JpaRepository<CourseSession, Integer> {
    
    List<CourseSession> findByCourseGroupIdOrderBySessionNoAsc(Integer groupId);
    
    // Add this method for ordering by session date
    @Query("SELECT cs FROM CourseSession cs WHERE cs.courseGroup.id = :groupId ORDER BY cs.sessionDate ASC")
    List<CourseSession> findByCourseGroupIdOrderBySessionDateAsc(@Param("groupId") Integer groupId);

    List<CourseSession> findByCourseId(Integer courseId);

    List<CourseSession> findByCourseIdAndSessionStatus(
        Integer courseId, 
        CourseSession.SessionStatus status
    );
    
    void deleteByCourseGroupId(Integer groupId);
    
    @Query("SELECT s FROM CourseSession s WHERE s.courseGroup.id = :groupId AND s.sessionNo = :sessionNo")
    CourseSession findByCourseGroupIdAndSessionNo(@Param("groupId") Integer groupId, @Param("sessionNo") Integer sessionNo);
    
    // Add this method for finding sessions by group id, month, and year
    @Query("SELECT cs FROM CourseSession cs WHERE cs.courseGroup.id = :groupId " +
           "AND FUNCTION('MONTH', cs.sessionDate) = :month " +
           "AND FUNCTION('YEAR', cs.sessionDate) = :year")
    List<CourseSession> findByGroupIdAndMonthAndYear(@Param("groupId") Integer groupId,
                                                      @Param("month") Integer month,
                                                      @Param("year") Integer year);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END " +
       "FROM CourseSession s WHERE s.courseGroup.course.id = :courseId " +
       "AND s.sessionDate <= :date")
boolean hasAnySessionStarted(@Param("courseId") Integer courseId, 
                             @Param("date") LocalDate date);
}