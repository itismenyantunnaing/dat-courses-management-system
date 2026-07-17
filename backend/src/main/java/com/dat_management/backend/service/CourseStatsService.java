package com.dat_management.backend.service;

import com.dat_management.backend.dto.CourseStatsDTO;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseStatsService {

    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final SelfStudySessionProgressRepository progressRepository;
    private final SelfStudySessionRepository sessionRepository;
    private final CourseSessionRepository courseSessionRepository;
    private final CourseGroupRepository courseGroupRepository;

    // Single threshold for all course types
    private static final Double COMPLETION_THRESHOLD = 0.8; // 80%

    @Transactional(readOnly = true)
    public List<CourseStatsDTO> getCourseStats() {
        log.info("========== STARTING COURSE STATS CALCULATION ==========");
        
        List<Course> courses = courseRepository.findByIsDeletedFalse();
        log.info("Found {} courses to process", courses.size());
        
        return courses.stream()
            .map(this::mapToCourseStatsDTO)
            .collect(Collectors.toList());
    }

    private CourseStatsDTO mapToCourseStatsDTO(Course course) {
        CourseStatsDTO dto = new CourseStatsDTO();
        dto.setName(course.getCourseName());
        
        Long enrolled = getEnrollmentCount(course);
        Long completed = getCompletedCount(course);
        
        dto.setEnrolled(enrolled);
        dto.setCompleted(completed);
        dto.setCategory(course.getCourseCategory().getCourseCategoryName());
        
        if (enrolled > 0) {
            dto.setCompletionRate((double) completed / enrolled * 100);
        } else {
            dto.setCompletionRate(0.0);
        }
        
        dto.setCourseType(course.getCourseCategory().getCourseType().name());
        
        return dto;
    }

    private Long getEnrollmentCount(Course course) {
        return enrollmentRepository.countByCourseId(course.getId());
    }

    private Long getCompletedCount(Course course) {
        CourseCategory.CourseType courseType = course.getCourseCategory().getCourseType();
        
        if (courseType == CourseCategory.CourseType.TRAINER_PROVIDED) {
            return getTrainerCompletedCount(course);
        } else if (courseType == CourseCategory.CourseType.SELF_STUDY) {
            return getSelfStudyCompletedCount(course);
        }
        
        return 0L;
    }

    // ==================== TRAINER-PROVIDED COMPLETION LOGIC ====================
    
    private Long getTrainerCompletedCount(Course course) {
        log.info(">>> Calculating trainer-provided completion for: {}", course.getCourseName());
        
        List<CourseEnrollment> enrollments = enrollmentRepository.findByCourseId(course.getId());
        
        if (enrollments.isEmpty()) {
            log.warn("No enrollments found for course: {}", course.getCourseName());
            return 0L;
        }
        
        long completedCount = 0;
        
        for (CourseEnrollment enrollment : enrollments) {
            // Get the group this student is enrolled in
            CourseGroup studentGroup = enrollment.getCourseGroup();
            
            if (studentGroup == null) {
                log.warn("Enrollment {} has no group assigned!", enrollment.getId());
                continue;
            }
            
            // Get sessions ONLY for this student's group
            List<CourseSession> groupSessions = courseSessionRepository.findByCourseGroupIdOrderBySessionNoAsc(studentGroup.getId());
            int totalGroupSessions = groupSessions.size();
            
            if (totalGroupSessions == 0) {
                log.warn("Group {} has no sessions!", studentGroup.getGroupName());
                continue;
            }
            
            // Count PRESENT attendance records for this enrollment
            long presentCount = attendanceRecordRepository.countByEnrollmentIdAndAttendanceStatus(
                enrollment.getId(), AttendanceRecord.AttendanceStatus.PRESENT
            );
            
            // Calculate attendance percentage based on group sessions
            double attendancePercentage = (double) presentCount / totalGroupSessions;
            
            log.debug("Enrollment {}: Present: {}/{}, Percentage: {}%, Threshold: {}%, Completed: {}", 
                enrollment.getId(), presentCount, totalGroupSessions, 
                attendancePercentage * 100, COMPLETION_THRESHOLD * 100,
                attendancePercentage >= COMPLETION_THRESHOLD);
            
            if (attendancePercentage >= COMPLETION_THRESHOLD) {
                completedCount++;
                log.info("✅ Enrollment {} COMPLETED (Group: {}, {}/{} sessions)", 
                    enrollment.getId(), studentGroup.getGroupName(), presentCount, totalGroupSessions);
            } else {
                log.info("❌ Enrollment {} NOT completed (Group: {}, {}/{} sessions)", 
                    enrollment.getId(), studentGroup.getGroupName(), presentCount, totalGroupSessions);
            }
        }
        
        log.info("Course: {} - Completed Count: {}/{}", 
            course.getCourseName(), completedCount, enrollments.size());
        
        return completedCount;
    }

    // ==================== SELF-STUDY COMPLETION LOGIC ====================
    
    private Long getSelfStudyCompletedCount(Course course) {
        log.info(">>> Calculating self-study completion for: {}", course.getCourseName());
        
        List<CourseEnrollment> enrollments = enrollmentRepository.findByCourseId(course.getId());
        
        if (enrollments.isEmpty()) {
            return 0L;
        }
        
        // Get all self-study sessions for this course
        List<SelfStudySession> sessions = sessionRepository.findByCourseId(course.getId());
        
        if (sessions.isEmpty()) {
            log.warn("No self-study sessions found for course: {}", course.getCourseName());
            return 0L;
        }
        
        int totalSessions = sessions.size();
        log.info("Course: {} - Total Self-Study Sessions: {}, Total Enrollments: {}", 
            course.getCourseName(), totalSessions, enrollments.size());
        
        long completedCount = 0;
        
        for (CourseEnrollment enrollment : enrollments) {
            // Get progress records for this enrollment
            List<SelfStudySessionProgress> progressRecords = 
                progressRepository.findByEnrollmentId(enrollment.getId());
            
            if (progressRecords.isEmpty()) {
                log.debug("No progress records for enrollment {}", enrollment.getId());
                continue;
            }
            
            // Calculate average completion across all sessions
            double totalCompletionPercentage = 0.0;
            
            for (SelfStudySession session : sessions) {
                SelfStudySessionProgress progress = progressRecords.stream()
                    .filter(p -> p.getSelfStudySession().getId().equals(session.getId()))
                    .findFirst()
                    .orElse(null);
                
                if (progress == null) {
                    // No progress for this session, contribute 0%
                    continue;
                }
                
                double sessionCompletion = calculateSessionCompletionPercentage(session, progress);
                totalCompletionPercentage += sessionCompletion;
            }
            
            // Calculate average completion across ALL sessions
            double averageCompletion = totalCompletionPercentage / totalSessions;
            
            log.debug("Enrollment {}: Average Completion: {}%, Threshold: {}%, Completed: {}", 
                enrollment.getId(), averageCompletion * 100, COMPLETION_THRESHOLD * 100,
                averageCompletion >= COMPLETION_THRESHOLD);
            
            if (averageCompletion >= COMPLETION_THRESHOLD) {
                completedCount++;
                log.info("✅ Self-Study Enrollment {} COMPLETED (Average: {}%)", 
                    enrollment.getId(), averageCompletion * 100);
            } else {
                log.info("❌ Self-Study Enrollment {} NOT completed (Average: {}%)", 
                    enrollment.getId(), averageCompletion * 100);
            }
        }
        
        log.info("Course: {} - Completed Count: {}/{}", 
            course.getCourseName(), completedCount, enrollments.size());
        
        return completedCount;
    }

    private double calculateSessionCompletionPercentage(SelfStudySession session, 
                                                        SelfStudySessionProgress progress) {
        int totalTargets = 0;
        double totalPercentage = 0.0;
        
        // 1. Kanji Target
        if (session.getKanjiTarget() != null && session.getKanjiTarget() > 0) {
            totalTargets++;
            Integer kanjiProgress = progress.getKanjiCount() != null ? progress.getKanjiCount() : 0;
            double kanjiPercentage = Math.min(1.0, (double) kanjiProgress / session.getKanjiTarget());
            totalPercentage += kanjiPercentage;
        }
        
        // 2. Vocabulary Target
        if (session.getVocabularyTarget() != null && session.getVocabularyTarget() > 0) {
            totalTargets++;
            Integer vocabProgress = progress.getVocabularyCount() != null ? progress.getVocabularyCount() : 0;
            double vocabPercentage = Math.min(1.0, (double) vocabProgress / session.getVocabularyTarget());
            totalPercentage += vocabPercentage;
        }
        
        // 3. Grammar Target
        if (session.getGrammarTarget() != null && session.getGrammarTarget() > 0) {
            totalTargets++;
            Integer grammarProgress = progress.getGrammarCount() != null ? progress.getGrammarCount() : 0;
            double grammarPercentage = Math.min(1.0, (double) grammarProgress / session.getGrammarTarget());
            totalPercentage += grammarPercentage;
        }
        
        // 4. Reading Target (in minutes)
        if (session.getReadingTargetMinutes() != null && session.getReadingTargetMinutes() > 0) {
            totalTargets++;
            Integer readingProgress = progress.getReadingMinutes() != null ? progress.getReadingMinutes() : 0;
            double readingPercentage = Math.min(1.0, (double) readingProgress / session.getReadingTargetMinutes());
            totalPercentage += readingPercentage;
        }
        
        // 5. Listening Target (in minutes)
        if (session.getListeningTargetMinutes() != null && session.getListeningTargetMinutes() > 0) {
            totalTargets++;
            Integer listeningProgress = progress.getListeningMinutes() != null ? progress.getListeningMinutes() : 0;
            double listeningPercentage = Math.min(1.0, (double) listeningProgress / session.getListeningTargetMinutes());
            totalPercentage += listeningPercentage;
        }
        
        // If no targets defined, consider session 100% complete if there's any progress
        if (totalTargets == 0) {
            boolean hasProgress = 
                (progress.getKanjiCount() != null && progress.getKanjiCount() > 0) ||
                (progress.getVocabularyCount() != null && progress.getVocabularyCount() > 0) ||
                (progress.getGrammarCount() != null && progress.getGrammarCount() > 0) ||
                (progress.getReadingMinutes() != null && progress.getReadingMinutes() > 0) ||
                (progress.getListeningMinutes() != null && progress.getListeningMinutes() > 0);
            
            return hasProgress ? 1.0 : 0.0;
        }
        
        return totalPercentage / totalTargets;
    }
}