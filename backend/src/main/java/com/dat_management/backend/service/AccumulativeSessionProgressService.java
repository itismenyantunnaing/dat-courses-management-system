package com.dat_management.backend.service;

import com.dat_management.backend.dto.AccumulativeSessionProgressDTO;
import com.dat_management.backend.dto.EmployeeTargetLevelDTO;
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
public class AccumulativeSessionProgressService {

    private static final Logger log = LoggerFactory.getLogger(AccumulativeSessionProgressService.class);

    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final SelfStudySessionRepository selfStudySessionRepository;
    private final SelfStudySessionProgressRepository selfStudySessionProgressRepository;
    private final EmployeeTargetService employeeTargetService;

    /**
     * Get accumulative session progress for all employees in a course
     * Each session shows cumulative progress from session 1 to current session
     */
    @Transactional(readOnly = true)
    public List<AccumulativeSessionProgressDTO> getAccumulativeProgressByCourseId(Integer courseId) {
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

        // Calculate total course target sum
        TotalTargets totalCourseTargets = calculateTotalCourseTargets(sessions);
        
        List<AccumulativeSessionProgressDTO> reportList = new ArrayList<>();

        // For each enrollment, collect accumulative progress for all sessions
        for (CourseEnrollment enrollment : enrollments) {
            Employee employee = enrollment.getEmployee();
            
            // Get employee's target level
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

            // Initialize accumulators
            Accumulator accumulator = new Accumulator();

            // For each session in order, accumulate and create report
            for (SelfStudySession session : sessions) {
                // Find progress for this specific session
                Optional<SelfStudySessionProgress> progressOpt = progressList.stream()
                        .filter(p -> p.getSelfStudySession().getId().equals(session.getId()))
                        .findFirst();

                // Add current session's values to accumulator
                if (progressOpt.isPresent()) {
                    SelfStudySessionProgress progress = progressOpt.get();
                    accumulator.addCurrentValues(progress);
                }
                // If no progress, add 0 values (targets still added)

                // Add session targets to accumulator
                accumulator.addTargetValues(session);

                // Build report with accumulative values
                AccumulativeSessionProgressDTO report = buildAccumulativeReportDTO(
                        session,
                        employee,
                        targetLevelDTO,
                        accumulator,
                        totalCourseTargets,
                        progressOpt.orElse(null)
                );
                reportList.add(report);
            }
        }

        log.info("Generated {} accumulative session progress reports for course ID: {}", reportList.size(), courseId);
        return reportList;
    }

    /**
     * Get accumulative session progress for a specific employee in a course
     */
    @Transactional(readOnly = true)
    public List<AccumulativeSessionProgressDTO> getAccumulativeProgressByCourseIdAndEmployeeId(
            Integer courseId, String employeeId) {
        
        // Get all reports for the course
        List<AccumulativeSessionProgressDTO> allReports = getAccumulativeProgressByCourseId(courseId);
        
        // Filter by employee name
        List<AccumulativeSessionProgressDTO> filteredReports = allReports.stream()
                .filter(report -> report.getMemberName().equals(employeeId))
                .collect(Collectors.toList());
        
        if (filteredReports.isEmpty()) {
            log.warn("No progress reports found for employee {} in course {}", employeeId, courseId);
        }
        
        return filteredReports;
    }

    /**
     * Get accumulative session progress for a specific employee and session
     */
    @Transactional(readOnly = true)
    public AccumulativeSessionProgressDTO getAccumulativeProgressForEmployeeAndSession(
            Integer courseId, String employeeId, Short sessionNo) {
        
        List<AccumulativeSessionProgressDTO> employeeReports = 
                getAccumulativeProgressByCourseIdAndEmployeeId(courseId, employeeId);
        
        return employeeReports.stream()
                .filter(report -> report.getSessionNo().equals(sessionNo))
                .findFirst()
                .orElseThrow(() -> new RuntimeException(
                        "Progress not found for employee " + employeeId + 
                        " and session " + sessionNo + " in course " + courseId));
    }

    /**
     * Build DTO with accumulative values
     */
    private AccumulativeSessionProgressDTO buildAccumulativeReportDTO(
            SelfStudySession session,
            Employee employee,
            EmployeeTargetLevelDTO targetLevelDTO,
            Accumulator accumulator,
            TotalTargets totalCourseTargets,
            SelfStudySessionProgress progress) {

        AccumulativeSessionProgressDTO report = new AccumulativeSessionProgressDTO();
        
        report.setSessionNo(session.getSessionNo());
        report.setSessionDeadline(progress != null ? progress.getSessionDeadline() : null);
        report.setMemberName(employee.getName());
        report.setCertifiedLevel(targetLevelDTO.getJlptHighestLevel() != null ? 
                targetLevelDTO.getJlptHighestLevel() : "-");
        report.setExamTarget(targetLevelDTO.getTargetJlptNatLevel() != null ? 
                targetLevelDTO.getTargetJlptNatLevel() : "-");

        // Set accumulative current values
        report.setCurrentGrammar(accumulator.currentGrammar);
        report.setCurrentVocabulary(accumulator.currentVocabulary);
        report.setCurrentKanji(accumulator.currentKanji);
        report.setCurrentReadingMin(accumulator.currentReadingMin);
        report.setCurrentListeningMin(accumulator.currentListeningMin);

        // Set accumulative target values
        report.setTargetGrammar(accumulator.targetGrammar);
        report.setTargetVocabulary(accumulator.targetVocabulary);
        report.setTargetKanji(accumulator.targetKanji);
        report.setTargetReadingMin(accumulator.targetReadingMin);
        report.setTargetListeningMin(accumulator.targetListeningMin);

        // Calculate actualPercentage = (sumCurrent / totalCourseTarget) * 100
        double actualPercentage = calculateActualPercentage(accumulator, totalCourseTargets);
        report.setActualPercentage(actualPercentage);

        // Calculate targetPercentage = (sumTarget / totalCourseTarget) * 100
        double targetPercentage = calculateTargetPercentage(accumulator, totalCourseTargets);
        report.setTargetPercentage(targetPercentage);

        // Set status from progress or NOT_STARTED
        report.setStatus(progress != null && progress.getCompletionStatus() != null ? 
                progress.getCompletionStatus() : "NOT_STARTED");

        return report;
    }

    /**
     * Calculate actual percentage based on accumulative current values vs total course targets
     */
    private double calculateActualPercentage(Accumulator accumulator, TotalTargets totalCourseTargets) {
        int sumCurrent = accumulator.currentGrammar + accumulator.currentVocabulary 
                + accumulator.currentKanji + accumulator.currentReadingMin 
                + accumulator.currentListeningMin;
        
        int sumTarget = totalCourseTargets.totalGrammar + totalCourseTargets.totalVocabulary 
                + totalCourseTargets.totalKanji + totalCourseTargets.totalReadingMin 
                + totalCourseTargets.totalListeningMin;

        if (sumTarget == 0) {
            return 0.0;
        }

        // Cap at 100% (should never exceed target)
        double percentage = (sumCurrent * 100.0) / sumTarget;
        return Math.min(Math.round(percentage * 100.0) / 100.0, 100.0);
    }

    /**
     * Calculate target percentage based on accumulative target values vs total course targets
     */
    private double calculateTargetPercentage(Accumulator accumulator, TotalTargets totalCourseTargets) {
        int sumTarget = accumulator.targetGrammar + accumulator.targetVocabulary 
                + accumulator.targetKanji + accumulator.targetReadingMin 
                + accumulator.targetListeningMin;
        
        int sumTotalTarget = totalCourseTargets.totalGrammar + totalCourseTargets.totalVocabulary 
                + totalCourseTargets.totalKanji + totalCourseTargets.totalReadingMin 
                + totalCourseTargets.totalListeningMin;

        if (sumTotalTarget == 0) {
            return 0.0;
        }

        // Should never exceed 100%
        double percentage = (sumTarget * 100.0) / sumTotalTarget;
        return Math.min(Math.round(percentage * 100.0) / 100.0, 100.0);
    }

    /**
     * Calculate total course targets across all sessions
     */
    private TotalTargets calculateTotalCourseTargets(List<SelfStudySession> sessions) {
        TotalTargets total = new TotalTargets();
        
        for (SelfStudySession session : sessions) {
            total.totalGrammar += session.getGrammarTarget() != null ? session.getGrammarTarget() : 0;
            total.totalVocabulary += session.getVocabularyTarget() != null ? session.getVocabularyTarget() : 0;
            total.totalKanji += session.getKanjiTarget() != null ? session.getKanjiTarget() : 0;
            total.totalReadingMin += session.getReadingTargetMinutes() != null ? session.getReadingTargetMinutes() : 0;
            total.totalListeningMin += session.getListeningTargetMinutes() != null ? session.getListeningTargetMinutes() : 0;
        }
        
        return total;
    }

    /**
     * Inner class to hold accumulative values
     */
    private static class Accumulator {
        int currentGrammar = 0;
        int currentVocabulary = 0;
        int currentKanji = 0;
        int currentReadingMin = 0;
        int currentListeningMin = 0;
        int targetGrammar = 0;
        int targetVocabulary = 0;
        int targetKanji = 0;
        int targetReadingMin = 0;
        int targetListeningMin = 0;

        void addCurrentValues(SelfStudySessionProgress progress) {
            this.currentGrammar += progress.getGrammarCount() != null ? progress.getGrammarCount() : 0;
            this.currentVocabulary += progress.getVocabularyCount() != null ? progress.getVocabularyCount() : 0;
            this.currentKanji += progress.getKanjiCount() != null ? progress.getKanjiCount() : 0;
            this.currentReadingMin += progress.getReadingMinutes() != null ? progress.getReadingMinutes() : 0;
            this.currentListeningMin += progress.getListeningMinutes() != null ? progress.getListeningMinutes() : 0;
        }

        void addTargetValues(SelfStudySession session) {
            this.targetGrammar += session.getGrammarTarget() != null ? session.getGrammarTarget() : 0;
            this.targetVocabulary += session.getVocabularyTarget() != null ? session.getVocabularyTarget() : 0;
            this.targetKanji += session.getKanjiTarget() != null ? session.getKanjiTarget() : 0;
            this.targetReadingMin += session.getReadingTargetMinutes() != null ? session.getReadingTargetMinutes() : 0;
            this.targetListeningMin += session.getListeningTargetMinutes() != null ? session.getListeningTargetMinutes() : 0;
        }
    }

    /**
     * Inner class to hold total course targets
     */
    private static class TotalTargets {
        int totalGrammar = 0;
        int totalVocabulary = 0;
        int totalKanji = 0;
        int totalReadingMin = 0;
        int totalListeningMin = 0;
    }
}