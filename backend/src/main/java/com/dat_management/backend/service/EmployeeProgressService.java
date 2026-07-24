package com.dat_management.backend.service;

import com.dat_management.backend.dto.EmployeeProgressDtos.*;
import com.dat_management.backend.dto.EmployeeTargetLevelDTO;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeProgressService {

    private final CourseEnrollmentRepository enrollmentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final CourseSessionRepository courseSessionRepository;
    private final SelfStudySessionRepository selfStudySessionRepository;
    private final SelfStudySessionProgressRepository progressRepository;
    private final CourseGroupRepository courseGroupRepository;
    private final EmployeeTargetService employeeTargetService;

    private static final Double THRESHOLD = 80.0;
    private static final LocalDate TODAY = LocalDate.now();

    @Transactional(readOnly = true)
    public EmployeeProgressResponseDTO getEmployeeProgress(String employeeId) {
        log.info("========== STARTING EMPLOYEE PROGRESS TRACKING ==========");
        log.info("Employee ID: {}", employeeId);

        List<CourseEnrollment> enrollments = enrollmentRepository.findActiveEnrollmentsByEmployeeId(employeeId);
        log.info("Found {} active enrollments for employee {}", enrollments.size(), employeeId);

        if (enrollments.isEmpty()) {
            log.warn("No active enrollments found for employee: {}", employeeId);
            return new EmployeeProgressResponseDTO(
                employeeId,
                "Unknown",
                new ArrayList<>(),
                0.0,
                null
            );
        }

        Employee employee = enrollments.get(0).getEmployee();
        String employeeName = employee != null ? employee.getName() : "Unknown";
        log.info("Employee Name: {}", employeeName);

        List<EmployeeCourseProgressDTO> courseProgressList = new ArrayList<>();

        log.info("--- Processing {} courses for employee {} ---", enrollments.size(), employeeName);

        int courseIndex = 0;
        for (CourseEnrollment enrollment : enrollments) {
            courseIndex++;
            Course course = enrollment.getCourse();
            if (course == null) {
                log.warn("Enrollment {} has no course, skipping", enrollment.getId());
                continue;
            }

            CourseCategory.CourseType courseType = course.getCourseCategory().getCourseType();
            log.info("--- Course #{}/{}: {} (ID: {}, Type: {}) ---", 
                courseIndex, enrollments.size(), course.getCourseName(), course.getId(), courseType);

            // ✅ SKIP "other" type self-study courses completely
            if (courseType == CourseCategory.CourseType.SELF_STUDY 
                && course.getSelfStudyType() != null 
                && course.getSelfStudyType().equals("other")) {
                log.info("   ⏭️ Skipping 'other' type self-study course: {} (no tracking targets, excluded from response)", 
                    course.getCourseName());
                continue;
            }

            EmployeeCourseProgressDTO courseProgress = null;

            if (courseType == CourseCategory.CourseType.TRAINER_PROVIDED) {
                log.info("   📚 Processing as TRAINER_PROVIDED");
                courseProgress = getTrainerCourseProgress(enrollment);
                log.info("   📊 Trainer Course - Status: {}, Attendance: {}%, Group: {}", 
                    courseProgress.status(), 
                    courseProgress.attendance(),
                    courseProgress.groupName());
            } else if (courseType == CourseCategory.CourseType.SELF_STUDY) {
                log.info("   📚 Processing as SELF_STUDY (Type: {})", course.getSelfStudyType());
                courseProgress = getSelfStudyCourseProgress(enrollment);
                log.info("   📊 Self-Study Course - Status: {}, Progress: {}%, Group: {}", 
                    courseProgress.status(), 
                    courseProgress.attendance(),
                    courseProgress.groupName());
            } else {
                log.warn("   Unknown course type: {}, skipping", courseType);
                continue;
            }

            if (courseProgress != null) {
                courseProgressList.add(courseProgress);
                log.info("   📅 Course '{}' - Status: {}", course.getCourseName(), courseProgress.status());
            }
        }

        // Calculate average attendance across all courses
        Double averageAttendance = 0.0;
        if (!courseProgressList.isEmpty()) {
            double totalAttendance = courseProgressList.stream()
                .mapToDouble(c -> c.attendance() != null ? c.attendance() : 0.0)
                .sum();
            averageAttendance = Math.round(totalAttendance / courseProgressList.size() * 10.0) / 10.0;
        }

        // Fetch employee target level
        EmployeeTargetLevelDTO employeeTargetLevel = null;
        try {
            employeeTargetLevel = employeeTargetService.getTargetLevelForEmployee(employeeId);
            log.info("Employee Target Level: {}, Target Date: {}",
                employeeTargetLevel.getTargetJlptNatLevel(), employeeTargetLevel.getTargetDate());
        } catch (Exception e) {
            log.warn("Could not fetch target level for employee {}: {}", employeeId, e.getMessage());
        }

        log.info("========== EMPLOYEE PROGRESS COMPLETE ==========");
        log.info("Employee: {} ({})", employeeName, employeeId);
        log.info("Total courses processed: {}", courseProgressList.size());
        log.info("Average Attendance: {}%", averageAttendance);

        return new EmployeeProgressResponseDTO(
            employeeId,
            employeeName,
            courseProgressList,
            averageAttendance,
            employeeTargetLevel
        );
    }

    // ==================== TRAINER COURSE PROGRESS ====================

    private EmployeeCourseProgressDTO getTrainerCourseProgress(CourseEnrollment enrollment) {
        Course course = enrollment.getCourse();
        CourseGroup group = enrollment.getCourseGroup();
        
        String courseName = course != null ? course.getCourseName() : "Unknown";
        String courseType = "TRAINER_PROVIDED";
        String groupName = group != null ? group.getGroupName() : "N/A";
        
        log.info("      Group: {}, Course: {}", groupName, courseName);
        
        // Get all sessions for this group
        List<CourseSession> allSessions = courseSessionRepository
            .findByCourseGroupIdOrderBySessionNoAsc(group.getId());
        int totalGroupSessions = allSessions.size();
        log.info("      Total sessions in group: {}", totalGroupSessions);
        
        // Get attendance records for this enrollment
        List<AttendanceRecord> attendanceRecords = attendanceRecordRepository
            .findByEnrollmentId(enrollment.getId());
        log.info("      Attendance records found: {}", attendanceRecords.size());
        
        // 🔥 FIND MAX session number with attendance data (SAME AS RISKSERVICE)
        int maxSessionWithData = 0;
        for (AttendanceRecord record : attendanceRecords) {
            CourseSession session = record.getCourseSession();
            if (session != null && session.getSessionNo() > maxSessionWithData) {
                maxSessionWithData = session.getSessionNo();
            }
        }
        log.info("      MAX session with data: {}", maxSessionWithData);
        
        // If no attendance data
        if (maxSessionWithData == 0) {
            boolean anySessionPassed = allSessions.stream()
                .anyMatch(s -> s.getSessionDate().isBefore(TODAY) || s.getSessionDate().isEqual(TODAY));
            
            if (anySessionPassed) {
                log.info("      No attendance data but sessions have passed → 0%");
                return new EmployeeCourseProgressDTO(
                    courseName,
                    courseType,
                    "IN_PROGRESS",
                    0.0,
                    groupName
                );
            }
            return new EmployeeCourseProgressDTO(
                courseName,
                courseType,
                "NOT_STARTED",
                0.0,
                groupName
            );
        }
        
        // 🔥 CONSIDER sessions 1 through maxSessionWithData (SAME AS RISKSERVICE)
        int totalConsidered = 0;
        int presentCount = 0;
        StringBuilder sessionDetails = new StringBuilder();
        
        log.info("      Considering sessions 1 through {}", maxSessionWithData);
        
        for (CourseSession session : allSessions) {
            if (session.getSessionNo() > maxSessionWithData) {
                break;
            }
            totalConsidered++;
            
            boolean isPresent = attendanceRecords.stream()
                .anyMatch(record -> 
                    record.getCourseSession().getId().equals(session.getId()) &&
                    record.getAttendanceStatus() == AttendanceRecord.AttendanceStatus.PRESENT
                );
            
            if (isPresent) {
                presentCount++;
                sessionDetails.append("S").append(session.getSessionNo()).append(":P ");
            } else {
                sessionDetails.append("S").append(session.getSessionNo()).append(":A ");
            }
        }
        
        double attendancePercentage = totalConsidered > 0 ? (double) presentCount / totalConsidered * 100 : 0.0;
        double roundedAttendance = Math.round(attendancePercentage * 10.0) / 10.0;
        
        String status = determineTrainerStatus(presentCount, totalConsidered);
        
        log.info("      Status: {}, Attendance: {}% ({} / {}), Sessions: {}", 
            status, roundedAttendance, presentCount, totalConsidered, sessionDetails.toString());
        
        return new EmployeeCourseProgressDTO(
            courseName,
            courseType,
            status,
            roundedAttendance,
            groupName
        );
    }

    // ==================== SELF-STUDY COURSE PROGRESS ====================

    private EmployeeCourseProgressDTO getSelfStudyCourseProgress(CourseEnrollment enrollment) {
        Course course = enrollment.getCourse();
        CourseGroup group = enrollment.getCourseGroup();
        
        String courseName = course != null ? course.getCourseName() : "Unknown";
        String courseType = "SELF_STUDY";
        String groupName = group != null ? group.getGroupName() : "N/A";
        String selfStudyType = course.getSelfStudyType() != null ? course.getSelfStudyType() : "unknown";
        
        log.info("      Group: {}, Course: {}, SelfStudyType: {}", groupName, courseName, selfStudyType);
        
        List<SelfStudySession> sessions = selfStudySessionRepository.findByCourseId(course.getId());
        int totalSessions = sessions.size();
        log.info("      Total self-study sessions: {}", totalSessions);
        
        List<SelfStudySessionProgress> progressRecords = progressRepository.findByEnrollmentId(enrollment.getId());
        log.info("      Progress records found: {}", progressRecords.size());
        
        double progressPercentage = 0.0;
        String status = "NOT_STARTED";
        
        if (progressRecords.isEmpty()) {
            status = "NOT_STARTED";
            progressPercentage = 0.0;
            log.info("      No progress records found - NOT_STARTED");
        } else {
            log.info("      Calculating progress from targets");
            double totalCompletionPercentage = 0.0;
            int consideredSessions = 0;
            
            for (SelfStudySession session : sessions) {
                SelfStudySessionProgress progress = progressRecords.stream()
                    .filter(p -> p.getSelfStudySession().getId().equals(session.getId()))
                    .findFirst()
                    .orElse(null);
                
                if (progress == null) {
                    log.info("      Session {}: No progress record", session.getSessionNo());
                    continue;
                }
                
                boolean shouldConsider = false;
                
                if (progress.getSessionDeadline() != null) {
                    LocalDate deadlineDate = progress.getSessionDeadline().toLocalDate();
                    if (deadlineDate.isBefore(TODAY) || deadlineDate.isEqual(TODAY)) {
                        shouldConsider = true;
                    }
                }
                
                if (hasAnyProgress(progress)) {
                    shouldConsider = true;
                }
                
                if (shouldConsider) {
                    consideredSessions++;
                    double sessionCompletion = calculateSessionCompletion(session, progress);
                    totalCompletionPercentage += sessionCompletion;
                    log.info("      Session {}: Completion: {}%", session.getSessionNo(), 
                        Math.round(sessionCompletion * 10.0) / 10.0);
                } else {
                    log.info("      Session {}: NOT considered (deadline future, no progress)", session.getSessionNo());
                }
            }
            
            progressPercentage = consideredSessions > 0 ? totalCompletionPercentage / consideredSessions : 0.0;
            double roundedProgress = Math.round(progressPercentage * 10.0) / 10.0;
            
            status = determineSelfStudyStatus(progressPercentage, consideredSessions);
            log.info("      Average Progress: {}%, Status: {}", roundedProgress, status);
        }
        
        return new EmployeeCourseProgressDTO(
            courseName,
            courseType,
            status,
            Math.round(progressPercentage * 10.0) / 10.0,
            groupName
        );
    }

    // ==================== HELPER METHODS ====================

    private boolean hasAnyProgress(SelfStudySessionProgress progress) {
        return (progress.getKanjiCount() != null && progress.getKanjiCount() > 0) ||
               (progress.getVocabularyCount() != null && progress.getVocabularyCount() > 0) ||
               (progress.getGrammarCount() != null && progress.getGrammarCount() > 0) ||
               (progress.getReadingMinutes() != null && progress.getReadingMinutes() > 0) ||
               (progress.getListeningMinutes() != null && progress.getListeningMinutes() > 0);
    }

    private double calculateSessionCompletion(SelfStudySession session, SelfStudySessionProgress progress) {
        int totalTargets = 0;
        double totalPercentage = 0.0;

        if (session.getKanjiTarget() != null && session.getKanjiTarget() > 0) {
            totalTargets++;
            Integer kanjiProgress = progress.getKanjiCount() != null ? progress.getKanjiCount() : 0;
            double kanjiPercentage = Math.min(1.0, (double) kanjiProgress / session.getKanjiTarget());
            totalPercentage += kanjiPercentage;
        }

        if (session.getVocabularyTarget() != null && session.getVocabularyTarget() > 0) {
            totalTargets++;
            Integer vocabProgress = progress.getVocabularyCount() != null ? progress.getVocabularyCount() : 0;
            double vocabPercentage = Math.min(1.0, (double) vocabProgress / session.getVocabularyTarget());
            totalPercentage += vocabPercentage;
        }

        if (session.getGrammarTarget() != null && session.getGrammarTarget() > 0) {
            totalTargets++;
            Integer grammarProgress = progress.getGrammarCount() != null ? progress.getGrammarCount() : 0;
            double grammarPercentage = Math.min(1.0, (double) grammarProgress / session.getGrammarTarget());
            totalPercentage += grammarPercentage;
        }

        if (session.getReadingTargetMinutes() != null && session.getReadingTargetMinutes() > 0) {
            totalTargets++;
            Integer readingProgress = progress.getReadingMinutes() != null ? progress.getReadingMinutes() : 0;
            double readingPercentage = Math.min(1.0, (double) readingProgress / session.getReadingTargetMinutes());
            totalPercentage += readingPercentage;
        }

        if (session.getListeningTargetMinutes() != null && session.getListeningTargetMinutes() > 0) {
            totalTargets++;
            Integer listeningProgress = progress.getListeningMinutes() != null ? progress.getListeningMinutes() : 0;
            double listeningPercentage = Math.min(1.0, (double) listeningProgress / session.getListeningTargetMinutes());
            totalPercentage += listeningPercentage;
        }

        if (totalTargets == 0) {
            return hasAnyProgress(progress) ? 100.0 : 0.0;
        }

        return totalPercentage / totalTargets * 100;
    }

    private String determineTrainerStatus(long presentCount, int totalConsidered) {
        if (totalConsidered == 0) return "NOT_STARTED";
        double attendancePercentage = (double) presentCount / totalConsidered;
        if (attendancePercentage >= 0.8) {
            return "COMPLETED";
        } else if (presentCount > 0) {
            return "IN_PROGRESS";
        } else {
            return "NOT_STARTED";
        }
    }

    private String determineSelfStudyStatus(double progressPercentage, int totalConsidered) {
        if (totalConsidered == 0) return "NOT_STARTED";
        if (progressPercentage >= 80.0) {
            return "COMPLETED";
        } else if (progressPercentage > 0) {
            return "IN_PROGRESS";
        } else {
            return "NOT_STARTED";
        }
    }
}