package com.dat_management.backend.service;

import com.dat_management.backend.dto.CourseStatsDTO;
import com.dat_management.backend.dto.EmployeeCourseStatsDtos.*;
import com.dat_management.backend.dto.EmployeeCourseSummaryDtos.*;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
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

    private static final Double COMPLETION_THRESHOLD = 0.8; // 80%
    private static final LocalDate TODAY = LocalDate.now();

    // ==================== COURSE STATS ====================

    @Transactional(readOnly = true)
    public List<CourseStatsDTO> getCourseStats() {
        log.info("========== STARTING COURSE STATS CALCULATION ==========");
        
        List<Course> courses = courseRepository.findByIsDeletedFalse();
        log.info("Found {} courses to process", courses.size());
        
        // ✅ FILTER: Exclude "other" type self-study courses
        List<Course> filteredCourses = courses.stream()
            .filter(course -> {
                boolean isotherType = course.getCourseCategory().getCourseType() == CourseCategory.CourseType.SELF_STUDY
                    && course.getSelfStudyType() != null
                    && course.getSelfStudyType().equals("other");
                if (isotherType) {
                    log.info("   ⏭️ Skipping 'other' type self-study course: {} (no tracking targets)", 
                        course.getCourseName());
                }
                return !isotherType;
            })
            .collect(Collectors.toList());
        
        log.info("Processing {} courses (excluded 'other' type)", filteredCourses.size());
        
        return filteredCourses.stream()
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
    // SAME AS ORIGINAL: Counts ALL sessions in the group
    
    private Long getTrainerCompletedCount(Course course) {
        log.info(">>> Calculating trainer-provided completion for: {}", course.getCourseName());
        
        List<CourseEnrollment> enrollments = enrollmentRepository.findByCourseId(course.getId());
        
        if (enrollments.isEmpty()) {
            log.warn("No enrollments found for course: {}", course.getCourseName());
            return 0L;
        }
        
        long completedCount = 0;
        
        for (CourseEnrollment enrollment : enrollments) {
            CourseGroup studentGroup = enrollment.getCourseGroup();
            
            if (studentGroup == null) {
                log.warn("Enrollment {} has no group assigned!", enrollment.getId());
                continue;
            }
            
            // ALL sessions in the group
            List<CourseSession> groupSessions = courseSessionRepository.findByCourseGroupIdOrderBySessionNoAsc(studentGroup.getId());
            int totalGroupSessions = groupSessions.size();
            
            if (totalGroupSessions == 0) {
                log.warn("Group {} has no sessions!", studentGroup.getGroupName());
                continue;
            }
            
            // Count PRESENT attendance records for this enrollment (ALL sessions)
            long presentCount = attendanceRecordRepository.countByEnrollmentIdAndAttendanceStatus(
                enrollment.getId(), AttendanceRecord.AttendanceStatus.PRESENT
            );
            
            // Calculate attendance percentage based on ALL group sessions
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
    // SAME AS ORIGINAL: Counts ALL sessions in the course
    
    private Long getSelfStudyCompletedCount(Course course) {
        log.info(">>> Calculating self-study completion for: {}", course.getCourseName());
        
        List<CourseEnrollment> enrollments = enrollmentRepository.findByCourseId(course.getId());
        
        if (enrollments.isEmpty()) {
            return 0L;
        }
        
        // ALL self-study sessions for this course
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
            List<SelfStudySessionProgress> progressRecords = 
                progressRepository.findByEnrollmentId(enrollment.getId());
            
            if (progressRecords.isEmpty()) {
                log.debug("No progress records for enrollment {}", enrollment.getId());
                continue;
            }
            
            // Calculate average completion across ALL sessions
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
            
            // Average completion across ALL sessions
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

    /**
     * Calculate session completion percentage (0-100%)
     */
    private double calculateSessionCompletionPercentage(SelfStudySession session, 
                                                        SelfStudySessionProgress progress) {
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
            boolean hasProgress = 
                (progress.getKanjiCount() != null && progress.getKanjiCount() > 0) ||
                (progress.getVocabularyCount() != null && progress.getVocabularyCount() > 0) ||
                (progress.getGrammarCount() != null && progress.getGrammarCount() > 0) ||
                (progress.getReadingMinutes() != null && progress.getReadingMinutes() > 0) ||
                (progress.getListeningMinutes() != null && progress.getListeningMinutes() > 0);
            
            return hasProgress ? 100.0 : 0.0;
        }
        
        // Return percentage (0-100)
        return (totalPercentage / totalTargets) * 100;
    }

    // ==================== EMPLOYEE COURSE STATS ====================
    // SAME LOGIC AS ORIGINAL CourseStatsService: Counts ALL sessions

    @Transactional(readOnly = true)
    public EmployeeCourseStatsResponseDTO getEmployeeCourseStats(String employeeId) {
        log.info("==================================================");
        log.info("    EMPLOYEE COURSE STATS REQUEST");
        log.info("==================================================");
        log.info("Employee ID: {}", employeeId);

        List<CourseEnrollment> enrollments = enrollmentRepository.findActiveEnrollmentsByEmployeeId(employeeId);
        log.info("Found {} active enrollments for employee {}", enrollments.size(), employeeId);

        if (enrollments.isEmpty()) {
            log.warn("No active enrollments found for employee: {}", employeeId);
            return new EmployeeCourseStatsResponseDTO(
                employeeId,
                "Unknown",
                0,
                0,
                0,
                0.0,
                0,
                0,
                new ArrayList<>()
            );
        }

        Employee employee = enrollments.get(0).getEmployee();
        String employeeName = employee != null ? employee.getName() : "Unknown";
        log.info("Employee Name: {}", employeeName);

        List<EmployeeCourseDetailDTO> courseDetails = new ArrayList<>();
        int totalCourses = enrollments.size();
        int completedCourses = 0;
        int inProgressCourses = 0;
        int totalSessions = 0;
        int activeSessions = 0;

        log.info("--- Processing {} courses for employee {} ---", totalCourses, employeeName);

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
                courseIndex, totalCourses, course.getCourseName(), course.getId(), courseType);

            // ✅ CHECK: Is this "other" type self-study?
            boolean isotherType = courseType == CourseCategory.CourseType.SELF_STUDY 
                && course.getSelfStudyType() != null 
                && course.getSelfStudyType().equals("other");

            if (isotherType) {
                log.info("   ⏭️ 'other' type self-study course: {} (excluded from response)", 
                    course.getCourseName());
                
                // ✅ SKIP adding to courses array - don't count in totals
                continue;
            }

            EmployeeCourseDetailDTO courseDetail;

            if (courseType == CourseCategory.CourseType.TRAINER_PROVIDED) {
                log.info("   📚 Processing as TRAINER_PROVIDED");
                courseDetail = getTrainerCourseDetail(enrollment);
                log.info("   📊 Trainer Course - Status: {}, Attendance: {}%, Group: {}", 
                    courseDetail.status(), 
                    courseDetail.attendance(),
                    courseDetail.groupName());
            } else if (courseType == CourseCategory.CourseType.SELF_STUDY) {
                log.info("   📚 Processing as SELF_STUDY (Type: {})", course.getSelfStudyType());
                courseDetail = getSelfStudyCourseDetail(enrollment);
                log.info("   📊 Self-Study Course - Status: {}, Progress: {}%, Group: {}", 
                    courseDetail.status(), 
                    courseDetail.attendance(),
                    courseDetail.groupName());
            } else {
                log.warn("   Unknown course type: {}, skipping", courseType);
                continue;
            }

            courseDetails.add(courseDetail);
            
            if ("COMPLETED".equals(courseDetail.status())) {
                completedCourses++;
                log.info("   ✅ Course '{}' is COMPLETED", course.getCourseName());
            } else if ("IN_PROGRESS".equals(courseDetail.status())) {
                inProgressCourses++;
                log.info("   ⏳ Course '{}' is IN_PROGRESS", course.getCourseName());
            } else {
                log.info("   📅 Course '{}' is NOT_STARTED", course.getCourseName());
            }
            
            totalSessions += courseDetail.totalSessions();
            int courseActiveSessions = getCourseActiveSessions(enrollment);
            activeSessions += courseActiveSessions;
            log.info("   📅 Active sessions for this course: {}/{}", courseActiveSessions, courseDetail.totalSessions());
        }

        double completionRate = totalCourses > 0 ? (double) completedCourses / totalCourses * 100 : 0.0;
        double roundedCompletionRate = Math.round(completionRate * 100.0) / 100.0;

        log.info("==================================================");
        log.info("    EMPLOYEE COURSE STATS SUMMARY");
        log.info("==================================================");
        log.info("Employee: {} ({})", employeeName, employeeId);
        log.info("Total Courses: {}", totalCourses);
        log.info("Completed Courses: {}", completedCourses);
        log.info("In-Progress Courses: {}", inProgressCourses);
        log.info("Completion Rate: {}%", roundedCompletionRate);
        log.info("Total Sessions: {}", totalSessions);
        log.info("Active Sessions: {}", activeSessions);
        log.info("==================================================");

        return new EmployeeCourseStatsResponseDTO(
            employeeId,
            employeeName,
            totalCourses,
            completedCourses,
            inProgressCourses,
            roundedCompletionRate,
            totalSessions,
            activeSessions,
            courseDetails
        );
    }

    // ==================== EMPLOYEE COURSE DETAIL HELPERS ====================
    // SAME LOGIC AS ORIGINAL: Counts ALL sessions in the group

    private EmployeeCourseDetailDTO getTrainerCourseDetail(CourseEnrollment enrollment) {
        Course course = enrollment.getCourse();
        CourseGroup group = enrollment.getCourseGroup();
        
        String courseName = course != null ? course.getCourseName() : "Unknown";
        String courseType = "TRAINER_PROVIDED";
        String groupName = group != null ? group.getGroupName() : "N/A";
        
        log.info("      Group: {}, Course: {}", groupName, courseName);
        
        // ALL sessions in the group
        List<CourseSession> allSessions = courseSessionRepository
            .findByCourseGroupIdOrderBySessionNoAsc(group.getId());
        int totalGroupSessions = allSessions.size();
        log.info("      Total sessions in group: {}", totalGroupSessions);
        
        // Get attendance records for this enrollment
        List<AttendanceRecord> attendanceRecords = attendanceRecordRepository
            .findByEnrollmentId(enrollment.getId());
        log.info("      Attendance records found: {}", attendanceRecords.size());
        
        // Count PRESENT across ALL sessions (same as CourseStatsService)
        int totalConsidered = totalGroupSessions;
        int presentCount = 0;
        StringBuilder sessionDetails = new StringBuilder();
        
        for (CourseSession session : allSessions) {
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
        
        return new EmployeeCourseDetailDTO(
            courseName,
            courseType,
            status,
            roundedAttendance,
            totalGroupSessions,
            groupName
        );
    }

    // SAME LOGIC AS ORIGINAL: Counts ALL sessions in the course
    
    private EmployeeCourseDetailDTO getSelfStudyCourseDetail(CourseEnrollment enrollment) {
        Course course = enrollment.getCourse();
        CourseGroup group = enrollment.getCourseGroup();
        
        String courseName = course != null ? course.getCourseName() : "Unknown";
        String courseType = "SELF_STUDY";
        String groupName = group != null ? group.getGroupName() : "N/A";
        String selfStudyType = course.getSelfStudyType() != null ? course.getSelfStudyType() : "unknown";
        
        log.info("      Group: {}, Course: {}, SelfStudyType: {}", groupName, courseName, selfStudyType);
        
        // ALL self-study sessions for this course
        List<SelfStudySession> sessions = sessionRepository.findByCourseId(course.getId());
        int totalSessions = sessions.size();
        log.info("      Total self-study sessions: {}", totalSessions);
        
        // Get progress records for this enrollment
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
            
            // Calculate average completion across ALL sessions
            for (SelfStudySession session : sessions) {
                SelfStudySessionProgress progress = progressRecords.stream()
                    .filter(p -> p.getSelfStudySession().getId().equals(session.getId()))
                    .findFirst()
                    .orElse(null);
                
                if (progress == null) {
                    log.info("      Session {}: No progress record", session.getSessionNo());
                    continue;
                }
                
                double sessionCompletion = calculateSessionCompletionPercentage(session, progress);
                totalCompletionPercentage += sessionCompletion;
                log.info("      Session {}: Completion: {}%", session.getSessionNo(), 
                    Math.round(sessionCompletion * 10.0) / 10.0);
            }
            
            // Average completion across ALL sessions
            progressPercentage = totalSessions > 0 ? totalCompletionPercentage / totalSessions : 0.0;
            double roundedProgress = Math.round(progressPercentage * 10.0) / 10.0;
            
            status = determineSelfStudyStatus(progressPercentage, totalSessions);
            log.info("      Average Progress: {}%, Status: {}", roundedProgress, status);
        }
        
        return new EmployeeCourseDetailDTO(
            courseName,
            courseType,
            status,
            Math.round(progressPercentage * 10.0) / 10.0,  // Progress percentage
            totalSessions,
            groupName
        );
    }

    // ==================== EMPLOYEE COURSE SUMMARY ====================

    @Transactional(readOnly = true)
    public List<EmployeeCourseSummaryResponseDTO> getAllEmployeesCourseSummary() {
        log.info("========== STARTING ALL EMPLOYEES COURSE SUMMARY ==========");

        List<CourseEnrollment> allEnrollments = enrollmentRepository.findAllApprovedActiveEnrollments();
        log.info("Found {} active enrollments", allEnrollments.size());

        Map<String, List<CourseEnrollment>> employeeEnrollmentMap = new LinkedHashMap<>();
        Map<String, String> employeeNameMap = new HashMap<>();
        Map<String, String> employeeDepartmentMap = new HashMap<>();
        Map<String, String> employeeTeamMap = new HashMap<>();

        for (CourseEnrollment enrollment : allEnrollments) {
            Employee employee = enrollment.getEmployee();
            if (employee == null) continue;

            String employeeId = employee.getId();
            
            employeeNameMap.putIfAbsent(employeeId, employee.getName());
            
            if (employee.getTeam() != null) {
                employeeTeamMap.putIfAbsent(employeeId, employee.getTeam().getTeamName());
                if (employee.getTeam().getDepartmentDat() != null) {
                    employeeDepartmentMap.putIfAbsent(employeeId, 
                        employee.getTeam().getDepartmentDat().getDeptName());
                }
            }

            employeeEnrollmentMap.computeIfAbsent(employeeId, k -> new ArrayList<>())
                .add(enrollment);
        }

        log.info("Found {} employees with active enrollments", employeeEnrollmentMap.size());

        List<EmployeeCourseSummaryResponseDTO> result = new ArrayList<>();

        for (Map.Entry<String, List<CourseEnrollment>> entry : employeeEnrollmentMap.entrySet()) {
            String employeeId = entry.getKey();
            List<CourseEnrollment> enrollments = entry.getValue();
            String employeeName = employeeNameMap.getOrDefault(employeeId, "Unknown");
            String departmentName = employeeDepartmentMap.get(employeeId);
            String teamName = employeeTeamMap.get(employeeId);

            List<String> completedCourseNames = new ArrayList<>();
            List<String> attendingCourseNames = new ArrayList<>();

            log.info("--- Processing Employee: {} ({}) ---", employeeName, employeeId);

            for (CourseEnrollment enrollment : enrollments) {
                Course course = enrollment.getCourse();
                if (course == null) continue;

                CourseCategory.CourseType courseType = course.getCourseCategory().getCourseType();
                boolean isCompleted = false;

                if (courseType == CourseCategory.CourseType.TRAINER_PROVIDED) {
                    isCompleted = isTrainerCourseCompletedForEmployee(enrollment);
                } else if (courseType == CourseCategory.CourseType.SELF_STUDY) {
                    // ✅ SKIP "other" type for summary (no tracking)
                    if (course.getSelfStudyType() != null && course.getSelfStudyType().equals("other")) {
                        continue;
                    }
                    isCompleted = isSelfStudyCourseCompletedForEmployee(enrollment);
                } else {
                    continue;
                }

                String courseDisplayName = course.getCourseName() + " (" + courseType.toString() + ")";

                if (isCompleted) {
                    completedCourseNames.add(courseDisplayName);
                } else {
                    attendingCourseNames.add(courseDisplayName);
                }
            }

            result.add(new EmployeeCourseSummaryResponseDTO(
                employeeId,
                employeeName,
                departmentName,
                teamName,
                new CourseSummaryDTO(completedCourseNames.size(), completedCourseNames),
                new CourseSummaryDTO(attendingCourseNames.size(), attendingCourseNames)
            ));
        }

        log.info("========== ALL EMPLOYEES COURSE SUMMARY COMPLETE ==========");
        log.info("Total employees processed: {}", result.size());

        return result;
    }

    // ==================== HELPER METHODS ====================

    private boolean hasAnyProgress(SelfStudySessionProgress progress) {
        return (progress.getKanjiCount() != null && progress.getKanjiCount() > 0) ||
               (progress.getVocabularyCount() != null && progress.getVocabularyCount() > 0) ||
               (progress.getGrammarCount() != null && progress.getGrammarCount() > 0) ||
               (progress.getReadingMinutes() != null && progress.getReadingMinutes() > 0) ||
               (progress.getListeningMinutes() != null && progress.getListeningMinutes() > 0);
    }

    private String determineTrainerStatus(long presentCount, int totalConsidered) {
        if (totalConsidered == 0) return "NOT_STARTED";
        double attendancePercentage = (double) presentCount / totalConsidered;
        if (attendancePercentage >= COMPLETION_THRESHOLD) {
            return "COMPLETED";
        } else if (presentCount > 0) {
            return "IN_PROGRESS";
        } else {
            return "NOT_STARTED";
        }
    }

    private String determineSelfStudyStatus(double progressPercentage, int totalConsidered) {
        if (totalConsidered == 0) return "NOT_STARTED";
        if (progressPercentage >= COMPLETION_THRESHOLD * 100) {
            return "COMPLETED";
        } else if (progressPercentage > 0) {
            return "IN_PROGRESS";
        } else {
            return "NOT_STARTED";
        }
    }

    private boolean isTrainerCourseCompletedForEmployee(CourseEnrollment enrollment) {
        CourseGroup group = enrollment.getCourseGroup();
        if (group == null) return false;

        List<CourseSession> allSessions = courseSessionRepository
            .findByCourseGroupIdOrderBySessionNoAsc(group.getId());

        if (allSessions.isEmpty()) return false;

        List<AttendanceRecord> attendanceRecords = attendanceRecordRepository
            .findByEnrollmentId(enrollment.getId());

        int totalSessions = allSessions.size();
        int presentCount = 0;

        for (CourseSession session : allSessions) {
            boolean isPresent = attendanceRecords.stream()
                .anyMatch(record -> 
                    record.getCourseSession().getId().equals(session.getId()) &&
                    record.getAttendanceStatus() == AttendanceRecord.AttendanceStatus.PRESENT
                );

            if (isPresent) {
                presentCount++;
            }
        }

        if (totalSessions == 0) return false;

        double attendancePercentage = (double) presentCount / totalSessions * 100;
        return attendancePercentage >= (COMPLETION_THRESHOLD * 100);
    }

    private boolean isSelfStudyCourseCompletedForEmployee(CourseEnrollment enrollment) {
        Course course = enrollment.getCourse();

        List<SelfStudySession> sessions = sessionRepository.findByCourseId(course.getId());
        if (sessions.isEmpty()) return false;

        List<SelfStudySessionProgress> progressRecords = progressRepository
            .findByEnrollmentId(enrollment.getId());

        if (progressRecords.isEmpty()) return false;

        int totalSessions = sessions.size();
        double totalCompletionPercentage = 0.0;

        for (SelfStudySession session : sessions) {
            SelfStudySessionProgress progress = progressRecords.stream()
                .filter(p -> p.getSelfStudySession().getId().equals(session.getId()))
                .findFirst()
                .orElse(null);

            if (progress == null) continue;

            double sessionCompletion = calculateSessionCompletionPercentage(session, progress);
            totalCompletionPercentage += sessionCompletion;
        }

        double averageCompletion = totalCompletionPercentage / totalSessions;
        return averageCompletion >= (COMPLETION_THRESHOLD * 100);
    }

    private int getCourseActiveSessions(CourseEnrollment enrollment) {
        Course course = enrollment.getCourse();
        CourseCategory.CourseType courseType = course.getCourseCategory().getCourseType();
        LocalDate today = LocalDate.now();
        
        if (courseType == CourseCategory.CourseType.TRAINER_PROVIDED) {
            CourseGroup group = enrollment.getCourseGroup();
            if (group == null) return 0;
            long activeCount = courseSessionRepository.countActiveSessionsByGroupId(group.getId(), today);
            return (int) activeCount;
        } else if (courseType == CourseCategory.CourseType.SELF_STUDY) {
            // ✅ Skip "other" type - they won't reach here because they're excluded
            List<SelfStudySessionProgress> progressRecords = progressRepository.findByEnrollmentId(enrollment.getId());
            if (progressRecords.isEmpty()) {
                List<SelfStudySession> sessions = sessionRepository.findByCourseId(course.getId());
                return sessions.size();
            }
            long activeCount = progressRepository.countActiveSessionsByEnrollmentId(
                enrollment.getId(), LocalDateTime.now()
            );
            return (int) activeCount;
        }
        return 0;
    }
}