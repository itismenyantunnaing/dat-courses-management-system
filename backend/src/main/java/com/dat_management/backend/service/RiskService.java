package com.dat_management.backend.service;

import com.dat_management.backend.dto.RiskDtos.*;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskService {

    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final CourseSessionRepository courseSessionRepository;
    private final CourseGroupRepository courseGroupRepository;
    private final SelfStudySessionRepository selfStudySessionRepository;
    private final SelfStudySessionProgressRepository progressRepository;

    private static final Double THRESHOLD = 80.0;

    // ==================== FOR TESTING ====================
    // CHANGE THIS DATE FOR TESTING PURPOSES
    // Comment/uncomment the appropriate line to test different scenarios
    private static final LocalDate TODAY = LocalDate.now();
    // private static final LocalDate TODAY = LocalDate.of(2026, 7, 5);  // Test: Before course starts
    // private static final LocalDate TODAY = LocalDate.of(2026, 7, 15); // Test: Mid-course
    // private static final LocalDate TODAY = LocalDate.of(2026, 7, 25); // Test: After some deadlines
    //private static final LocalDate TODAY = LocalDate.of(2026, 8, 1); // Test: After all deadlines

    @Transactional(readOnly = true)
    public RiskResponseDTO getAtRiskStudents() {
        log.info("========== STARTING RISK DASHBOARD CALCULATION ==========");
        log.info("Using TODAY: {}", TODAY);

        List<RiskDTO> atRiskStudents = new ArrayList<>();

        // Get all active non-deleted courses
        List<Course> courses = courseRepository.findByIsDeletedFalse();
        log.info("Found {} courses to process", courses.size());

        for (Course course : courses) {
            log.info("---------- Processing Course: {} (ID: {}) ----------", 
                course.getCourseName(), course.getId());
            log.info("Course Type: {}, SelfStudyType: {}", 
                course.getCourseCategory().getCourseType(), 
                course.getSelfStudyType());

            CourseCategory.CourseType courseType = course.getCourseCategory().getCourseType();
            
            if (courseType == CourseCategory.CourseType.TRAINER_PROVIDED) {
                List<RiskDTO> trainerRisks = processTrainerCourse(course);
                atRiskStudents.addAll(trainerRisks);
                log.info("Course: {} - Found {} at-risk students (Trainer)", 
                    course.getCourseName(), trainerRisks.size());
            } else if (courseType == CourseCategory.CourseType.SELF_STUDY) {
                // Skip "Other" type self-study courses
                if (course.getSelfStudyType() != null && course.getSelfStudyType().equals("Other")) {
                    log.info("Skipping 'Other' type self-study course: {} (no tracking targets)", 
                        course.getCourseName());
                    continue;
                }
                List<RiskDTO> selfStudyRisks = processJLPTTypeSelfStudyCourse(course);
                atRiskStudents.addAll(selfStudyRisks);
                log.info("Course: {} - Found {} at-risk students (Self-Study)", 
                    course.getCourseName(), selfStudyRisks.size());
            }
        }

        // Build summary
        RiskSummaryDTO summary = buildSummary(atRiskStudents);

        log.info("========== RISK DASHBOARD COMPLETE ==========");
        log.info("Total at-risk students found: {}", atRiskStudents.size());

        return new RiskResponseDTO(
            atRiskStudents,
            atRiskStudents.size(),
            summary
        );
    }

    // ==================== TRAINER-PROVIDED LOGIC ====================

    private List<RiskDTO> processTrainerCourse(Course course) {
        List<RiskDTO> risks = new ArrayList<>();
        log.info(">>> Calculating trainer-provided risk for: {}", course.getCourseName());

        // Check if course has started
        boolean hasStarted = courseSessionRepository.hasAnySessionStarted(course.getId(), TODAY);
        if (!hasStarted) {
            log.info("Course {} hasn't started yet (no sessions with date <= {}), skipping", 
                course.getCourseName(), TODAY);
            return risks;
        }
        log.info("Course {} has started (sessions with date <= {} exist)", 
            course.getCourseName(), TODAY);

        // Get all groups for this course
        List<CourseGroup> groups = courseGroupRepository.findByCourseId(course.getId());
        log.info("Course {} has {} groups", course.getCourseName(), groups.size());

        int totalEnrollments = 0;
        int atRiskCount = 0;

        for (CourseGroup group : groups) {
            log.info("--- Processing Group: {} (ID: {}) for Course: {} (ID: {}) ---", 
                group.getGroupName(), group.getId(), course.getCourseName(), course.getId());

            // Get all enrollments for this group
            List<CourseEnrollment> enrollments = enrollmentRepository.findByCourseGroupId(group.getId());
            
            // FILTER: Only process enrollments that belong to this course
            List<CourseEnrollment> filteredEnrollments = enrollments.stream()
                .filter(e -> e.getCourse() != null && e.getCourse().getId().equals(course.getId()))
                .collect(Collectors.toList());
            
            if (filteredEnrollments.size() != enrollments.size()) {
                log.warn("⚠️ Found {} enrollments that don't belong to course {} in group {} - Filtering them out!", 
                    enrollments.size() - filteredEnrollments.size(), 
                    course.getCourseName(), 
                    group.getGroupName());
                for (CourseEnrollment e : enrollments) {
                    if (e.getCourse() != null && !e.getCourse().getId().equals(course.getId())) {
                        log.warn("   - Skipping Enrollment {} (belongs to course: {} ID: {})", 
                            e.getId(), e.getCourse().getCourseName(), e.getCourse().getId());
                    }
                }
            }
            
            totalEnrollments += filteredEnrollments.size();
            log.info("Group {} has {} enrollments ({} total, {} filtered)", 
                group.getGroupName(), filteredEnrollments.size(), enrollments.size(), 
                enrollments.size() - filteredEnrollments.size());

            int enrollmentIndex = 0;
            for (CourseEnrollment enrollment : filteredEnrollments) {
                enrollmentIndex++;
                log.info("--- Checking Enrollment #{} (ID: {}) for course: {} ---", 
                    enrollmentIndex, enrollment.getId(), course.getCourseName());

                RiskDTO risk = calculateTrainerRisk(enrollment, course, group);
                if (risk != null) {
                    risks.add(risk);
                    atRiskCount++;
                    log.info("✅ Enrollment {} is AT RISK ({}: {}%)", 
                        enrollment.getId(), risk.issue(), risk.risk());
                } else {
                    log.info("❌ Enrollment {} is NOT at risk (Attendance >= {}%)", 
                        enrollment.getId(), THRESHOLD);
                }
            }
        }

        log.info("Course: {} - Summary: {}/{} students at risk", 
            course.getCourseName(), atRiskCount, totalEnrollments);

        return risks;
    }

    private RiskDTO calculateTrainerRisk(CourseEnrollment enrollment, Course course, CourseGroup group) {
        Employee employee = enrollment.getEmployee();
        if (employee == null) {
            log.debug("Enrollment {} has no employee, skipping", enrollment.getId());
            return null;
        }

        // Verify enrollment belongs to this course
        if (enrollment.getCourse() != null && !enrollment.getCourse().getId().equals(course.getId())) {
            log.warn("⚠️ Enrollment {} belongs to course {} but we are processing course {} - SKIPPING!", 
                enrollment.getId(), 
                enrollment.getCourse().getCourseName(), 
                course.getCourseName());
            return null;
        }

        log.debug("Checking employee: {} (ID: {})", employee.getName(), employee.getId());

        // Get all sessions for this group
        List<CourseSession> allSessions = courseSessionRepository
            .findByCourseGroupIdOrderBySessionNoAsc(group.getId());

        if (allSessions.isEmpty()) {
            log.debug("Group {} has no sessions, skipping", group.getGroupName());
            return null;
        }

        log.debug("Group {} has {} total sessions", group.getGroupName(), allSessions.size());

        // Get attendance records for this enrollment
        List<AttendanceRecord> attendanceRecords = attendanceRecordRepository
            .findByEnrollmentId(enrollment.getId());

        log.debug("Enrollment {} has {} attendance records", 
            enrollment.getId(), attendanceRecords.size());

        // Find MAX session number with attendance data
        int maxSessionWithData = 0;
        for (AttendanceRecord record : attendanceRecords) {
            CourseSession session = record.getCourseSession();
            if (session != null && session.getSessionNo() > maxSessionWithData) {
                maxSessionWithData = session.getSessionNo();
            }
        }

        log.debug("MAX session with data for enrollment {}: {}", 
            enrollment.getId(), maxSessionWithData);

        // If no attendance data, student is at risk (0%)
        if (maxSessionWithData == 0) {
            // Check if any session has passed (should have data)
            boolean anySessionPassed = allSessions.stream()
                .anyMatch(s -> s.getSessionDate().isBefore(TODAY) || s.getSessionDate().isEqual(TODAY));
            
            if (anySessionPassed) {
                log.info("⚠️ Enrollment {} has NO attendance data but sessions have passed → AT RISK (0%)", 
                    enrollment.getId());
                return createRiskDTO(employee, course, "Low attendance", 0.0);
            }
            log.debug("Enrollment {} has no attendance data and no sessions passed → NOT AT RISK", 
                enrollment.getId());
            return null;
        }

        // Consider sessions 1 through maxSessionWithData
        int totalConsidered = 0;
        int presentCount = 0;
        StringBuilder sessionDetails = new StringBuilder();

        log.debug("Considering sessions 1 through {} for enrollment {}", 
            maxSessionWithData, enrollment.getId());

        for (CourseSession session : allSessions) {
            if (session.getSessionNo() > maxSessionWithData) {
                break;
            }
            totalConsidered++;

            // Check if this session has a PRESENT record
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

        if (totalConsidered == 0) {
            return null;
        }

        double attendancePercentage = (double) presentCount / totalConsidered * 100;
        double roundedPercentage = Math.round(attendancePercentage * 10.0) / 10.0;

        log.info("📊 Enrollment {} - Attendance Summary: {}/{}, {}% | Sessions: {}", 
            enrollment.getId(), presentCount, totalConsidered, roundedPercentage, sessionDetails.toString());

        if (attendancePercentage < THRESHOLD) {
            log.info("⚠️ Enrollment {} is AT RISK: {}% attendance (below {}% threshold)", 
                enrollment.getId(), roundedPercentage, THRESHOLD);
            return createRiskDTO(employee, course, "Low attendance", attendancePercentage);
        }

        log.info("✅ Enrollment {} is NOT at risk: {}% attendance (above {}% threshold)", 
            enrollment.getId(), roundedPercentage, THRESHOLD);
        return null;
    }

    // ==================== SELF-STUDY (JLPT TYPE) LOGIC ====================

    private List<RiskDTO> processJLPTTypeSelfStudyCourse(Course course) {
        List<RiskDTO> risks = new ArrayList<>();
        log.info(">>> Calculating self-study risk for: {}", course.getCourseName());

        // Get all groups for this course
        List<CourseGroup> groups = courseGroupRepository.findByCourseId(course.getId());
        log.info("Course {} has {} groups", course.getCourseName(), groups.size());

        int totalEnrollments = 0;
        int atRiskCount = 0;

        for (CourseGroup group : groups) {
            log.info("--- Processing Group: {} (ID: {}) for Course: {} (ID: {}) ---", 
                group.getGroupName(), group.getId(), course.getCourseName(), course.getId());

            // Get all enrollments for this group
            List<CourseEnrollment> enrollments = enrollmentRepository.findByCourseGroupId(group.getId());
            
            // FILTER: Only process enrollments that belong to this course
            List<CourseEnrollment> filteredEnrollments = enrollments.stream()
                .filter(e -> e.getCourse() != null && e.getCourse().getId().equals(course.getId()))
                .collect(Collectors.toList());
            
            if (filteredEnrollments.size() != enrollments.size()) {
                log.warn("⚠️ Found {} enrollments that don't belong to course {} in group {} - Filtering them out!", 
                    enrollments.size() - filteredEnrollments.size(), 
                    course.getCourseName(), 
                    group.getGroupName());
                for (CourseEnrollment e : enrollments) {
                    if (e.getCourse() != null && !e.getCourse().getId().equals(course.getId())) {
                        log.warn("   - Skipping Enrollment {} (belongs to course: {} ID: {})", 
                            e.getId(), e.getCourse().getCourseName(), e.getCourse().getId());
                    }
                }
            }
            
            totalEnrollments += filteredEnrollments.size();
            log.info("Group {} has {} enrollments ({} total, {} filtered)", 
                group.getGroupName(), filteredEnrollments.size(), enrollments.size(), 
                enrollments.size() - filteredEnrollments.size());

            int enrollmentIndex = 0;
            for (CourseEnrollment enrollment : filteredEnrollments) {
                enrollmentIndex++;
                log.info("--- Checking Self-Study Enrollment #{} (ID: {}) for course: {} ---", 
                    enrollmentIndex, enrollment.getId(), course.getCourseName());

                RiskDTO risk = calculateJLPTTypeSelfStudyRisk(enrollment, course);
                if (risk != null) {
                    risks.add(risk);
                    atRiskCount++;
                    log.info("✅ Self-Study Enrollment {} is AT RISK ({}: {}%)", 
                        enrollment.getId(), risk.issue(), risk.risk());
                } else {
                    log.info("❌ Self-Study Enrollment {} is NOT at risk (Progress >= {}%)", 
                        enrollment.getId(), THRESHOLD);
                }
            }
        }

        log.info("Course: {} - Summary: {}/{} students at risk", 
            course.getCourseName(), atRiskCount, totalEnrollments);

        return risks;
    }

    private RiskDTO calculateJLPTTypeSelfStudyRisk(CourseEnrollment enrollment, Course course) {
        Employee employee = enrollment.getEmployee();
        if (employee == null) {
            log.debug("Enrollment {} has no employee, skipping", enrollment.getId());
            return null;
        }

        // Verify enrollment belongs to this course
        if (enrollment.getCourse() != null && !enrollment.getCourse().getId().equals(course.getId())) {
            log.warn("⚠️ Self-Study Enrollment {} belongs to course {} but we are processing course {} - SKIPPING!", 
                enrollment.getId(), 
                enrollment.getCourse().getCourseName(), 
                course.getCourseName());
            return null;
        }

        log.debug("Checking employee: {} (ID: {})", employee.getName(), employee.getId());

        // Get all self-study sessions for this course
        List<SelfStudySession> allSessions = selfStudySessionRepository
            .findByCourseIdOrderBySessionNoAsc(course.getId());

        if (allSessions.isEmpty()) {
            log.debug("Course {} has no self-study sessions, skipping", course.getCourseName());
            return null;
        }

        log.debug("Course {} has {} self-study sessions", course.getCourseName(), allSessions.size());

        // Get progress records for this enrollment
        List<SelfStudySessionProgress> progressRecords = progressRepository
            .findByEnrollmentId(enrollment.getId());

        log.debug("Enrollment {} has {} progress records", 
            enrollment.getId(), progressRecords.size());

        if (progressRecords.isEmpty()) {
            log.debug("Enrollment {} has no progress records, skipping", enrollment.getId());
            return null;
        }

        // Determine which sessions to consider:
        // 1. Sessions with sessionDeadline passed (from SelfStudySessionProgress), OR
        // 2. Sessions with progress > 0 (student is working ahead)
        int totalConsidered = 0;
        double totalCompletionSum = 0.0;
        StringBuilder sessionDetails = new StringBuilder();

        log.debug("Evaluating sessions for enrollment {}", enrollment.getId());

        for (SelfStudySession session : allSessions) {
            // Find progress for this session
            SelfStudySessionProgress progress = progressRecords.stream()
                .filter(p -> p.getSelfStudySession().getId().equals(session.getId()))
                .findFirst()
                .orElse(null);

            if (progress == null) {
                log.debug("Session {}: No progress record, skipping", session.getSessionNo());
                continue;
            }

            boolean shouldConsider = false;
            boolean deadlinePassed = false;
            boolean hasProgressValue = hasAnyProgress(progress);

            // Check if deadline passed (from SelfStudySessionProgress)
            if (progress.getSessionDeadline() != null) {
                LocalDate deadlineDate = progress.getSessionDeadline().toLocalDate();
                if (deadlineDate.isBefore(TODAY) || deadlineDate.isEqual(TODAY)) {
                    shouldConsider = true;
                    deadlinePassed = true;
                }
            }

            // Check if student has progress > 0 (working ahead)
            if (hasProgressValue) {
                shouldConsider = true;
            }

            if (shouldConsider) {
                totalConsidered++;

                // Calculate session completion
                double sessionCompletion = calculateSessionCompletion(session, progress);
                totalCompletionSum += sessionCompletion;

                // Determine if session is "completed" (>= 80%) for display
                boolean isCompleted = sessionCompletion >= 80.0;
                
                if (isCompleted) {
                    sessionDetails.append("S").append(session.getSessionNo()).append(":C(")
                        .append(Math.round(sessionCompletion)).append("%) ");
                } else {
                    sessionDetails.append("S").append(session.getSessionNo()).append(":I(")
                        .append(Math.round(sessionCompletion)).append("%) ");
                }

                log.debug("Session {}: Deadline Passed: {}, Has Progress: {}, Completion: {}%, Completed: {}", 
                    session.getSessionNo(), deadlinePassed, hasProgressValue, 
                    Math.round(sessionCompletion * 10.0) / 10.0, isCompleted);
            } else {
                log.debug("Session {}: NOT considered (Deadline: {}, Progress: {})", 
                    session.getSessionNo(), 
                    progress.getSessionDeadline() != null ? progress.getSessionDeadline().toLocalDate() : "null",
                    hasAnyProgress(progress));
            }
        }

        if (totalConsidered == 0) {
            log.debug("Enrollment {}: No sessions considered, skipping", enrollment.getId());
            return null;
        }

        // 🔥 NEW LOGIC: Average of all session completion percentages
        double avgCompletionPercentage = totalCompletionSum / totalConsidered;
        double roundedPercentage = Math.round(avgCompletionPercentage * 10.0) / 10.0;

        log.info("📊 Self-Study Enrollment {} - Progress Summary: Average completion: {}% (Total: {} / Sessions: {}) | Sessions: {}", 
            enrollment.getId(), roundedPercentage, Math.round(totalCompletionSum), totalConsidered, sessionDetails.toString());

        if (avgCompletionPercentage < THRESHOLD) {
            log.info("⚠️ Self-Study Enrollment {} is AT RISK: {}% average completion (below {}% threshold)", 
                enrollment.getId(), roundedPercentage, THRESHOLD);
            return createRiskDTO(employee, course, "Low progress", avgCompletionPercentage);
        }

        log.info("✅ Self-Study Enrollment {} is NOT at risk: {}% average completion (above {}% threshold)", 
            enrollment.getId(), roundedPercentage, THRESHOLD);
        return null;
    }

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

        if (totalTargets == 0) {
            return hasAnyProgress(progress) ? 100.0 : 0.0;
        }

        return totalPercentage / totalTargets * 100;
    }

    // ==================== HELPER METHODS ====================

    private RiskDTO createRiskDTO(Employee employee, Course course, String issue, Double percentage) {
        String divisionName = null;
        String departmentName = null;
        String teamName = null;

        if (employee.getTeam() != null) {
            teamName = employee.getTeam().getTeamName();
            
            // Get department
            if (employee.getTeam().getDepartmentDat() != null) {
                departmentName = employee.getTeam().getDepartmentDat().getDeptName();
                
                // Get division from department
                if (employee.getTeam().getDepartmentDat().getDivision() != null) {
                    divisionName = employee.getTeam().getDepartmentDat().getDivision().getDivisionName();
                }
            }
        }

        double roundedPercentage = Math.round(percentage * 10.0) / 10.0;

        log.debug("Creating RiskDTO for employee: {}, Division: {}, Department: {}, Issue: {}, Percentage: {}%", 
            employee.getName(), divisionName, departmentName, issue, roundedPercentage);

        return new RiskDTO(
            employee.getName(),
            issue,
            roundedPercentage,
            divisionName,  // ← Division field
            departmentName,
            teamName,
            course.getCourseName()
        );
    }

    private RiskSummaryDTO buildSummary(List<RiskDTO> atRiskStudents) {
        log.info("Building summary for {} at-risk students", atRiskStudents.size());

        int totalAtRisk = atRiskStudents.size();

        // By issue
        int lowAttendanceCount = 0;
        int lowProgressCount = 0;
        for (RiskDTO student : atRiskStudents) {
            if ("Low attendance".equals(student.issue())) {
                lowAttendanceCount++;
            } else if ("Low progress".equals(student.issue())) {
                lowProgressCount++;
            }
        }
        IssueBreakdownDTO byIssue = new IssueBreakdownDTO(lowAttendanceCount, lowProgressCount);
        log.info("By Issue - Low Attendance: {}, Low Progress: {}", lowAttendanceCount, lowProgressCount);

        // By division
        Map<String, Integer> divisionMap = new HashMap<>();
        for (RiskDTO student : atRiskStudents) {
            String div = student.division() != null ? student.division() : "Unknown";
            divisionMap.put(div, divisionMap.getOrDefault(div, 0) + 1);
        }
        List<DivisionRiskDTO> divisionList = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : divisionMap.entrySet()) {
            divisionList.add(new DivisionRiskDTO(entry.getKey(), entry.getValue()));
            log.info("Division: {} - At Risk: {}", entry.getKey(), entry.getValue());
        }
        DivisionBreakdownDTO byDivision = new DivisionBreakdownDTO(divisionList);

        // By department
        Map<String, Integer> departmentMap = new HashMap<>();
        for (RiskDTO student : atRiskStudents) {
            String dept = student.department() != null ? student.department() : "Unknown";
            departmentMap.put(dept, departmentMap.getOrDefault(dept, 0) + 1);
        }
        List<DepartmentRiskDTO> departmentList = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : departmentMap.entrySet()) {
            departmentList.add(new DepartmentRiskDTO(entry.getKey(), entry.getValue()));
            log.info("Department: {} - At Risk: {}", entry.getKey(), entry.getValue());
        }
        DepartmentBreakdownDTO byDepartment = new DepartmentBreakdownDTO(departmentList);

        // By risk level (based on percentage)
        int highRisk = 0;
        int mediumRisk = 0;
        int lowRisk = 0;
        for (RiskDTO student : atRiskStudents) {
            if (student.risk() >= 70) {
                highRisk++;
            } else if (student.risk() >= 40) {
                mediumRisk++;
            } else {
                lowRisk++;
            }
        }
        RiskLevelDTO byRiskLevel = new RiskLevelDTO(highRisk, mediumRisk, lowRisk);
        log.info("By Risk Level - High: {}, Medium: {}, Low: {}", highRisk, mediumRisk, lowRisk);

        return new RiskSummaryDTO(
            totalAtRisk, 
            byIssue, 
            byDivision,  // ← Division breakdown added
            byDepartment, 
            byRiskLevel
        );
    }
}