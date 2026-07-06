// In CourseSessionRepository.java
package com.dat_management.backend.repository;

import com.dat_management.backend.entity.CourseSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseSessionRepository extends JpaRepository<CourseSession, Integer> {
    
    List<CourseSession> findByCourseGroupIdOrderBySessionNoAsc(Integer groupId);
    
    void deleteByCourseGroupId(Integer groupId);
    
    @Query("SELECT s FROM CourseSession s WHERE s.courseGroup.id = :groupId AND s.sessionNo = :sessionNo")
    CourseSession findByCourseGroupIdAndSessionNo(@Param("groupId") Integer groupId, @Param("sessionNo") Integer sessionNo);
}