package com.dat_management.backend.service;

import com.dat_management.backend.dto.OrganizationalStatsDtos.*;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationalStatsService {

    private final CourseEnrollmentRepository enrollmentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final SelfStudySessionProgressRepository progressRepository;
    private final SelfStudySessionRepository sessionRepository;
    private final CourseSessionRepository courseSessionRepository;
    private final DivisionRepository divisionRepository;
    private final DepartmentDatRepository departmentDatRepository;
    private final TeamRepository teamRepository;
    private final EmployeeRepository employeeRepository;

    private static final Double COMPLETION_THRESHOLD = 0.8;

    @Transactional(readOnly = true)
    public OrganizationalStatsResponseDTO getOrganizationalStats() {
        log.info("========== ORGANIZATIONAL STATS ==========");

        List<Division> divisions = divisionRepository.findAllByIsDeletedFalse();
        List<DivisionStatsDTO> divisionStats = new ArrayList<>();

        for (Division division : divisions) {
            divisionStats.add(buildDivisionStats(division));
        }

        return new OrganizationalStatsResponseDTO(divisionStats);
    }

    // ==================== DIVISION LEVEL ====================

    private DivisionStatsDTO buildDivisionStats(Division division) {
        // Get all employees in this division
        Set<String> divisionEmployeeIds = getDivisionEmployeeIds(division);
        
        List<DepartmentDat> departments = departmentDatRepository.findAllByDivisionAndIsDeletedFalse(division);
        List<DepartmentStatsDTO> departmentStats = new ArrayList<>();
        
        Set<Course> allCourses = new HashSet<>();

        for (DepartmentDat department : departments) {
            DepartmentStatsDTO deptDTO = buildDepartmentStats(department);
            departmentStats.add(deptDTO);
            allCourses.addAll(getDepartmentCourses(department));
        }

        // Get course stats LOCAL to this division only
        List<CourseStatDTO> allCourseStats = getCourseStatsForCoursesWithEmployeeIds(allCourses, divisionEmployeeIds);
        Double avgCompletionRate = calculateAverageCompletionRate(allCourseStats);

        return new DivisionStatsDTO(
            division.getDivisionName(),
            String.valueOf(division.getId()),
            avgCompletionRate,
            departmentStats,
            allCourseStats
        );
    }

    private Set<String> getDivisionEmployeeIds(Division division) {
        List<DepartmentDat> departments = departmentDatRepository.findAllByDivisionAndIsDeletedFalse(division);
        Set<String> employeeIds = new HashSet<>();
        for (DepartmentDat department : departments) {
            employeeIds.addAll(getDepartmentEmployeeIds(department));
        }
        return employeeIds;
    }

    // ==================== DEPARTMENT LEVEL ====================

    private DepartmentStatsDTO buildDepartmentStats(DepartmentDat department) {
        // Get all employees in this department
        Set<String> departmentEmployeeIds = getDepartmentEmployeeIds(department);
        
        List<Team> teams = teamRepository.findAllByDepartmentDatAndIsDeletedFalse(department);
        List<TeamStatsDTO> teamStats = new ArrayList<>();
        
        Set<Course> allCourses = new HashSet<>();

        for (Team team : teams) {
            TeamStatsDTO teamDTO = buildTeamStats(team);
            teamStats.add(teamDTO);
            allCourses.addAll(getTeamCourses(team));
        }

        // Get course stats LOCAL to this department only
        List<CourseStatDTO> allCourseStats = getCourseStatsForCoursesWithEmployeeIds(allCourses, departmentEmployeeIds);
        Double avgCompletionRate = calculateAverageCompletionRate(allCourseStats);

        return new DepartmentStatsDTO(
            department.getDeptName(),
            String.valueOf(department.getId()),
            department.getDivision().getDivisionName(),
            String.valueOf(department.getDivision().getId()),
            avgCompletionRate,
            teamStats,
            allCourseStats
        );
    }

    private Set<String> getDepartmentEmployeeIds(DepartmentDat department) {
        List<Team> teams = teamRepository.findAllByDepartmentDatAndIsDeletedFalse(department);
        Set<String> employeeIds = new HashSet<>();
        for (Team team : teams) {
            employeeIds.addAll(getTeamEmployeeIds(team));
        }
        return employeeIds;
    }

    // ==================== TEAM LEVEL ====================

    private TeamStatsDTO buildTeamStats(Team team) {
        // Get all employees in this team
        Set<String> teamEmployeeIds = getTeamEmployeeIds(team);
        
        Set<Course> allCourses = new HashSet<>();
        
        for (String employeeId : teamEmployeeIds) {
            List<CourseEnrollment> enrollments = enrollmentRepository.findActiveEnrollmentsByEmployeeId(employeeId);
            for (CourseEnrollment enrollment : enrollments) {
                Course course = enrollment.getCourse();
                if (course != null && !course.getIsDeleted() && !isOtherTypeSelfStudy(course)) {
                    allCourses.add(course);
                }
            }
        }

        // Get course stats LOCAL to this team only
        List<CourseStatDTO> allCourseStats = getCourseStatsForCoursesWithEmployeeIds(allCourses, teamEmployeeIds);
        Double avgCompletionRate = calculateAverageCompletionRate(allCourseStats);

        return new TeamStatsDTO(
            team.getTeamName(),
            String.valueOf(team.getId()),
            team.getDepartmentDat().getDeptName(),
            String.valueOf(team.getDepartmentDat().getId()),
            team.getDepartmentDat().getDivision().getDivisionName(),
            String.valueOf(team.getDepartmentDat().getDivision().getId()),
            avgCompletionRate,
            allCourseStats
        );
    }

    private Set<String> getTeamEmployeeIds(Team team) {
        List<Employee> employees = employeeRepository.findByTeamIdAndIsDeletedFalse(team.getId());
        return employees.stream()
            .map(Employee::getId)  // Returns String
            .collect(Collectors.toSet());
    }

    // ==================== COURSE STATS WITH LOCAL FILTERING ====================

    private List<CourseStatDTO> getCourseStatsForCoursesWithEmployeeIds(Set<Course> courses, Set<String> employeeIds) {
        List<CourseStatDTO> stats = new ArrayList<>();
        for (Course course : courses) {
            if (isOtherTypeSelfStudy(course)) continue;
            stats.add(buildCourseStatsForEmployees(course, employeeIds));
        }
        return stats;
    }

    private CourseStatDTO buildCourseStatsForEmployees(Course course, Set<String> employeeIds) {
        // Get course ID as Integer or Long
        Integer courseId = course.getId();
        
        // Count enrollments ONLY for the given employee IDs
        Long enrolled = enrollmentRepository.countByCourseIdAndEmployeeIdIn(courseId, employeeIds);
        
        // Count completed ONLY for the given employee IDs
        Long completed = getCompletedCountForEmployees(course, employeeIds);

        return new CourseStatDTO(
            course.getCourseName(),
            enrolled.intValue(),
            completed.intValue(),
            course.getCourseCategory().getCourseCategoryName(),
            enrolled > 0 ? Math.round((double) completed / enrolled * 10000.0) / 100.0 : 0.0,
            course.getCourseCategory().getCourseType().name()
        );
    }

    // ==================== COMPLETION CALCULATIONS WITH EMPLOYEE FILTERING ====================

    private Long getCompletedCountForEmployees(Course course, Set<String> employeeIds) {
        CourseCategory.CourseType courseType = course.getCourseCategory().getCourseType();
        
        if (courseType == CourseCategory.CourseType.TRAINER_PROVIDED) {
            return getTrainerCompletedCountForEmployees(course, employeeIds);
        } else if (courseType == CourseCategory.CourseType.SELF_STUDY) {
            return getSelfStudyCompletedCountForEmployees(course, employeeIds);
        }
        return 0L;
    }

    private Long getTrainerCompletedCountForEmployees(Course course, Set<String> employeeIds) {
        // Get enrollments ONLY for the given employee IDs
        Integer courseId = course.getId();
        List<CourseEnrollment> enrollments = enrollmentRepository.findByCourseIdAndEmployeeIdIn(courseId, employeeIds);
        
        long completed = 0;

        for (CourseEnrollment enrollment : enrollments) {
            CourseGroup group = enrollment.getCourseGroup();
            if (group == null) continue;

            List<CourseSession> sessions = courseSessionRepository
                .findByCourseGroupIdOrderBySessionNoAsc(group.getId());
            int total = sessions.size();
            if (total == 0) continue;

            long present = attendanceRecordRepository.countByEnrollmentIdAndAttendanceStatus(
                enrollment.getId(), AttendanceRecord.AttendanceStatus.PRESENT
            );

            if ((double) present / total >= COMPLETION_THRESHOLD) {
                completed++;
            }
        }

        return completed;
    }

    private Long getSelfStudyCompletedCountForEmployees(Course course, Set<String> employeeIds) {
        // Get enrollments ONLY for the given employee IDs
        Integer courseId = course.getId();
        List<CourseEnrollment> enrollments = enrollmentRepository.findByCourseIdAndEmployeeIdIn(courseId, employeeIds);
        
        List<SelfStudySession> sessions = sessionRepository.findByCourseId(courseId);
        int totalSessions = sessions.size();
        if (totalSessions == 0) return 0L;

        long completed = 0;

        for (CourseEnrollment enrollment : enrollments) {
            List<SelfStudySessionProgress> progressRecords = progressRepository
                .findByEnrollmentId(enrollment.getId());

            if (progressRecords.isEmpty()) continue;

            double totalCompletion = 0.0;
            for (SelfStudySession session : sessions) {
                SelfStudySessionProgress progress = progressRecords.stream()
                    .filter(p -> p.getSelfStudySession().getId().equals(session.getId()))
                    .findFirst()
                    .orElse(null);

                if (progress != null) {
                    totalCompletion += calculateSessionCompletion(session, progress);
                }
            }

            if ((totalCompletion / totalSessions) >= COMPLETION_THRESHOLD) {
                completed++;
            }
        }

        return completed;
    }

    // ==================== SELF-STUDY HELPER METHODS ====================

    private double calculateSessionCompletion(SelfStudySession session, SelfStudySessionProgress progress) {
        int totalTargets = 0;
        double totalPercentage = 0.0;

        if (session.getKanjiTarget() != null && session.getKanjiTarget() > 0) {
            totalTargets++;
            int kanjiProgress = progress.getKanjiCount() != null ? progress.getKanjiCount() : 0;
            totalPercentage += Math.min(1.0, (double) kanjiProgress / session.getKanjiTarget());
        }

        if (session.getVocabularyTarget() != null && session.getVocabularyTarget() > 0) {
            totalTargets++;
            int vocabProgress = progress.getVocabularyCount() != null ? progress.getVocabularyCount() : 0;
            totalPercentage += Math.min(1.0, (double) vocabProgress / session.getVocabularyTarget());
        }

        if (session.getGrammarTarget() != null && session.getGrammarTarget() > 0) {
            totalTargets++;
            int grammarProgress = progress.getGrammarCount() != null ? progress.getGrammarCount() : 0;
            totalPercentage += Math.min(1.0, (double) grammarProgress / session.getGrammarTarget());
        }

        if (session.getReadingTargetMinutes() != null && session.getReadingTargetMinutes() > 0) {
            totalTargets++;
            int readingProgress = progress.getReadingMinutes() != null ? progress.getReadingMinutes() : 0;
            totalPercentage += Math.min(1.0, (double) readingProgress / session.getReadingTargetMinutes());
        }

        if (session.getListeningTargetMinutes() != null && session.getListeningTargetMinutes() > 0) {
            totalTargets++;
            int listeningProgress = progress.getListeningMinutes() != null ? progress.getListeningMinutes() : 0;
            totalPercentage += Math.min(1.0, (double) listeningProgress / session.getListeningTargetMinutes());
        }

        if (totalTargets == 0) {
            return hasAnyProgress(progress) ? 1.0 : 0.0;
        }

        return totalPercentage / totalTargets;
    }

    private boolean hasAnyProgress(SelfStudySessionProgress progress) {
        return (progress.getKanjiCount() != null && progress.getKanjiCount() > 0) ||
               (progress.getVocabularyCount() != null && progress.getVocabularyCount() > 0) ||
               (progress.getGrammarCount() != null && progress.getGrammarCount() > 0) ||
               (progress.getReadingMinutes() != null && progress.getReadingMinutes() > 0) ||
               (progress.getListeningMinutes() != null && progress.getListeningMinutes() > 0);
    }

    // ==================== AVERAGE COMPLETION RATE ====================

    private Double calculateAverageCompletionRate(List<CourseStatDTO> courses) {
        if (courses == null || courses.isEmpty()) {
            return 0.0;
        }
        
        double totalWeightedRate = 0.0;
        int totalEnrolled = 0;
        
        for (CourseStatDTO course : courses) {
            if (course.enrolled() > 0) {
                totalWeightedRate += course.completionRate() * course.enrolled();
                totalEnrolled += course.enrolled();
            }
        }
        
        if (totalEnrolled == 0) {
            return 0.0;
        }
        
        return Math.round((totalWeightedRate / totalEnrolled) * 100.0) / 100.0;
    }

    // ==================== HELPER METHODS ====================

    private Set<Course> getDepartmentCourses(DepartmentDat department) {
        Set<Course> courses = new HashSet<>();
        List<Team> teams = teamRepository.findAllByDepartmentDatAndIsDeletedFalse(department);
        for (Team team : teams) {
            courses.addAll(getTeamCourses(team));
        }
        return courses;
    }

    private Set<Course> getTeamCourses(Team team) {
        Set<Course> courses = new HashSet<>();
        Set<String> employeeIds = getTeamEmployeeIds(team);
        for (String employeeId : employeeIds) {
            List<CourseEnrollment> enrollments = enrollmentRepository.findActiveEnrollmentsByEmployeeId(employeeId);
            for (CourseEnrollment enrollment : enrollments) {
                Course course = enrollment.getCourse();
                if (course != null && !course.getIsDeleted() && !isOtherTypeSelfStudy(course)) {
                    courses.add(course);
                }
            }
        }
        return courses;
    }

    private boolean isOtherTypeSelfStudy(Course course) {
        return course.getCourseCategory().getCourseType() == CourseCategory.CourseType.SELF_STUDY
            && course.getSelfStudyType() != null
            && course.getSelfStudyType().equals("other");
    }
}