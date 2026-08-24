// SessionProgressService.java
package com.dat_management.backend.service;

import com.dat_management.backend.dto.EmployeeTargetLevelDTO;
import com.dat_management.backend.dto.SessionProgressReportDTO;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionProgressService {

    private static final Logger log = LoggerFactory.getLogger(SessionProgressService.class);

    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final SelfStudySessionRepository selfStudySessionRepository;
    private final SelfStudySessionProgressRepository selfStudySessionProgressRepository;
    private final EmployeeTargetService employeeTargetService;

    @Transactional(readOnly = true)
    public List<SessionProgressReportDTO> getSessionProgressReportByCourseId(Integer courseId) {
        // Validate course exists
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + courseId));

        // Get all enrollments for this course
        List<CourseEnrollment> enrollments = courseEnrollmentRepository.findByCourseId(courseId);
        
        if (enrollments.isEmpty()) {
            log.info("No enrollments found for course ID: {}", courseId);
            return new ArrayList<>();
        }

        // Get all sessions for this course ordered by session number
        List<SelfStudySession> sessions = selfStudySessionRepository.findByCourseIdOrderBySessionNoAsc(courseId);
        
        if (sessions.isEmpty()) {
            log.info("No self-study sessions found for course ID: {}", courseId);
            return new ArrayList<>();
        }
        
        List<SessionProgressReportDTO> reportList = new ArrayList<>();

        // For each enrollment, collect progress for all sessions
        for (CourseEnrollment enrollment : enrollments) {
            Employee employee = enrollment.getEmployee();
            
            // Get employee's target level using EmployeeTargetService
            EmployeeTargetLevelDTO targetLevelDTO = employeeTargetService.getTargetLevelForEmployee(employee.getId());
            
            // If no target level found, create default one
            if (targetLevelDTO == null) {
                targetLevelDTO = new EmployeeTargetLevelDTO();
                targetLevelDTO.setEmployeeId(employee.getId());
                targetLevelDTO.setJlptHighestLevel("Not Set");
                targetLevelDTO.setTargetJlptNatLevel("Not Set");
            }
            
            // Get all progress records for this enrollment
            List<SelfStudySessionProgress> progressList = 
                    selfStudySessionProgressRepository.findByEnrollmentId(enrollment.getId());

            // For each session, create a report
            for (SelfStudySession session : sessions) {
                Optional<SelfStudySessionProgress> progressOpt = progressList.stream()
                        .filter(p -> p.getSelfStudySession().getId().equals(session.getId()))
                        .findFirst();

                if (progressOpt.isPresent()) {
                    SelfStudySessionProgress progress = progressOpt.get();
                    SessionProgressReportDTO report = buildReportDTO(
                            courseId,
                            session,
                            employee,
                            targetLevelDTO,
                            progress
                    );
                    reportList.add(report);
                } else {
                    // Create empty progress report for sessions not started
                    SessionProgressReportDTO report = buildEmptyReportDTO(
                            courseId,
                            session,
                            employee,
                            targetLevelDTO
                    );
                    reportList.add(report);
                }
            }
        }

        log.info("Generated {} session progress reports for course ID: {}", reportList.size(), courseId);
        return reportList;
    }

    @Transactional(readOnly = true)
    public List<SessionProgressReportDTO> getSessionProgressReportByCourseIdAndEmployeeId(
            Integer courseId, String employeeId) {
        
        // Get all reports for the course
        List<SessionProgressReportDTO> allReports = getSessionProgressReportByCourseId(courseId);
        
        // Filter by employee name (or you can use employee ID if available in DTO)
        List<SessionProgressReportDTO> filteredReports = allReports.stream()
                .filter(report -> report.getMemberName().equals(employeeId))
                .collect(Collectors.toList());
        
        if (filteredReports.isEmpty()) {
            log.warn("No progress reports found for employee {} in course {}", employeeId, courseId);
        }
        
        return filteredReports;
    }

    @Transactional(readOnly = true)
    public SessionProgressReportDTO getSessionProgressForEmployeeAndSession(
            Integer courseId, String employeeId, Short sessionNo) {
        
        List<SessionProgressReportDTO> employeeReports = 
                getSessionProgressReportByCourseIdAndEmployeeId(courseId, employeeId);
        
        return employeeReports.stream()
                .filter(report -> report.getSessionNo().equals(sessionNo))
                .findFirst()
                .orElseThrow(() -> new RuntimeException(
                        "Progress not found for employee " + employeeId + 
                        " and session " + sessionNo + " in course " + courseId));
    }

    private SessionProgressReportDTO buildReportDTO(
            Integer courseId,
            SelfStudySession session,
            Employee employee,
            EmployeeTargetLevelDTO targetLevelDTO,
            SelfStudySessionProgress progress) {

        SessionProgressReportDTO report = new SessionProgressReportDTO();
        report.setSessionNo(session.getSessionNo());
        report.setSessionDeadline(progress.getSessionDeadline());
        report.setMemberName(employee.getName());
        
        // Set certified level from EmployeeTargetService
        report.setCertifiedLevel(targetLevelDTO.getJlptHighestLevel() != null ? 
                targetLevelDTO.getJlptHighestLevel() : null);
        
        // Set exam target from EmployeeTargetService
        report.setExamTarget(targetLevelDTO.getTargetJlptNatLevel() != null ? 
                targetLevelDTO.getTargetJlptNatLevel() : null);

        // Current progress
        report.setCurrentGrammar(progress.getGrammarCount() != null ? progress.getGrammarCount() : 0);
        report.setCurrentVocabulary(progress.getVocabularyCount() != null ? progress.getVocabularyCount() : 0);
        report.setCurrentKanji(progress.getKanjiCount() != null ? progress.getKanjiCount() : 0);
        report.setCurrentReadingMin(progress.getReadingMinutes() != null ? progress.getReadingMinutes() : 0);
        report.setCurrentListeningMin(progress.getListeningMinutes() != null ? progress.getListeningMinutes() : 0);

        // Target values from session
        report.setTargetGrammar(session.getGrammarTarget() != null ? session.getGrammarTarget() : 0);
        report.setTargetVocabulary(session.getVocabularyTarget() != null ? session.getVocabularyTarget() : 0);
        report.setTargetKanji(session.getKanjiTarget() != null ? session.getKanjiTarget() : 0);
        report.setTargetReadingMin(session.getReadingTargetMinutes() != null ? session.getReadingTargetMinutes() : 0);
        report.setTargetListeningMin(session.getListeningTargetMinutes() != null ? session.getListeningTargetMinutes() : 0);

        // Calculate percentage complete
        double percentage = calculatePercentage(progress, session);
        report.setPercentageComplete(percentage);

        // Status
        report.setStatus(progress.getCompletionStatus() != null ? progress.getCompletionStatus() : "NOT_STARTED");

        return report;
    }

    private SessionProgressReportDTO buildEmptyReportDTO(
            Integer courseId,
            SelfStudySession session,
            Employee employee,
            EmployeeTargetLevelDTO targetLevelDTO) {

        SessionProgressReportDTO report = new SessionProgressReportDTO();
        
        report.setSessionNo(session.getSessionNo());
        report.setSessionDeadline(null);
        report.setMemberName(employee.getName());
        
        // Set certified level from EmployeeTargetService
        report.setCertifiedLevel(targetLevelDTO.getJlptHighestLevel() != null ? 
                targetLevelDTO.getJlptHighestLevel() : "Not Set");
        
        // Set exam target from EmployeeTargetService
        report.setExamTarget(targetLevelDTO.getTargetJlptNatLevel() != null ? 
                targetLevelDTO.getTargetJlptNatLevel() : "Not Set");

        report.setCurrentGrammar(0);
        report.setCurrentVocabulary(0);
        report.setCurrentKanji(0);
        report.setCurrentReadingMin(0);
        report.setCurrentListeningMin(0);

        report.setTargetGrammar(session.getGrammarTarget() != null ? session.getGrammarTarget() : 0);
        report.setTargetVocabulary(session.getVocabularyTarget() != null ? session.getVocabularyTarget() : 0);
        report.setTargetKanji(session.getKanjiTarget() != null ? session.getKanjiTarget() : 0);
        report.setTargetReadingMin(session.getReadingTargetMinutes() != null ? session.getReadingTargetMinutes() : 0);
        report.setTargetListeningMin(session.getListeningTargetMinutes() != null ? session.getListeningTargetMinutes() : 0);

        report.setPercentageComplete(0.0);
        report.setStatus("NOT_STARTED");

        return report;
    }

    private double calculatePercentage(SelfStudySessionProgress progress, SelfStudySession session) {
        int totalTarget = 0;
        int totalAchieved = 0;

        // Grammar
        if (session.getGrammarTarget() != null && session.getGrammarTarget() > 0) {
            totalTarget += session.getGrammarTarget();
            totalAchieved += Math.min(
                    progress.getGrammarCount() != null ? progress.getGrammarCount() : 0, 
                    session.getGrammarTarget()
            );
        }

        // Vocabulary
        if (session.getVocabularyTarget() != null && session.getVocabularyTarget() > 0) {
            totalTarget += session.getVocabularyTarget();
            totalAchieved += Math.min(
                    progress.getVocabularyCount() != null ? progress.getVocabularyCount() : 0, 
                    session.getVocabularyTarget()
            );
        }

        // Kanji
        if (session.getKanjiTarget() != null && session.getKanjiTarget() > 0) {
            totalTarget += session.getKanjiTarget();
            totalAchieved += Math.min(
                    progress.getKanjiCount() != null ? progress.getKanjiCount() : 0, 
                    session.getKanjiTarget()
            );
        }

        // Reading
        if (session.getReadingTargetMinutes() != null && session.getReadingTargetMinutes() > 0) {
            totalTarget += session.getReadingTargetMinutes();
            totalAchieved += Math.min(
                    progress.getReadingMinutes() != null ? progress.getReadingMinutes() : 0, 
                    session.getReadingTargetMinutes()
            );
        }

        // Listening
        if (session.getListeningTargetMinutes() != null && session.getListeningTargetMinutes() > 0) {
            totalTarget += session.getListeningTargetMinutes();
            totalAchieved += Math.min(
                    progress.getListeningMinutes() != null ? progress.getListeningMinutes() : 0, 
                    session.getListeningTargetMinutes()
            );
        }

        if (totalTarget == 0) {
            return 0.0;
        }

        // Calculate percentage and round to 2 decimal places
        double percentage = (totalAchieved * 100.0) / totalTarget;
        return Math.round(percentage * 100.0) / 100.0;
    }
}