package com.dat_management.backend.service;

import com.dat_management.backend.dto.MonthlyAttendanceDtos.*;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseAttendanceService {

    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final CourseSessionRepository courseSessionRepository;
    private final CourseGroupRepository courseGroupRepository;

    @Transactional(readOnly = true)
    public List<DivisionMonthlyAttendanceDTO> getDailyAttendanceByDivision() {
        log.info("========== STARTING DAILY ATTENDANCE BY DIVISION ==========");
        
        List<Course> trainerCourses = courseRepository.findByIsDeletedFalse().stream()
            .filter(course -> course.getCourseCategory().getCourseType() == CourseCategory.CourseType.TRAINER_PROVIDED)
            .collect(Collectors.toList());
        
        log.info("Found {} trainer-provided courses", trainerCourses.size());
        
        if (trainerCourses.isEmpty()) {
            log.warn("No trainer-provided courses found");
            return new ArrayList<>();
        }
        
        Map<String, Map<String, Map<String, List<CourseGroupData>>>> divisionDeptTeamMap = new LinkedHashMap<>();
        
        for (Course course : trainerCourses) {
            log.info("Processing course: {}", course.getCourseName());
            processCourse(course, divisionDeptTeamMap);
        }
        
        List<DivisionMonthlyAttendanceDTO> result = convertToDTOWithAverages(divisionDeptTeamMap);
        
        log.info("Completed daily attendance by division. Found {} divisions", result.size());
        return result;
    }

    private void processCourse(Course course, Map<String, Map<String, Map<String, List<CourseGroupData>>>> divisionDeptTeamMap) {
        List<CourseGroup> groups = courseGroupRepository.findByCourseId(course.getId());
        
        if (groups.isEmpty()) {
            log.debug("Course {} has no groups", course.getCourseName());
            return;
        }
        
        for (CourseGroup group : groups) {
            processGroup(course, group, divisionDeptTeamMap);
        }
    }

    private void processGroup(Course course, CourseGroup group, 
                              Map<String, Map<String, Map<String, List<CourseGroupData>>>> divisionDeptTeamMap) {
        // Get all sessions for this group
        List<CourseSession> sessions = courseSessionRepository
            .findByCourseGroupIdOrderBySessionNoAsc(group.getId());
        
        if (sessions.isEmpty()) {
            log.debug("Group {} has no sessions, skipping", group.getGroupName());
            return;
        }
        
        // Get all enrollments for this group
        List<CourseEnrollment> enrollments = enrollmentRepository.findByCourseGroupId(group.getId());
        
        if (enrollments.isEmpty()) {
            log.debug("Group {} has no enrollments, skipping", group.getGroupName());
            return;
        }
        
        // Group enrollments by division, department and team
        Map<String, Map<String, Map<String, List<CourseEnrollment>>>> divisionDeptTeamEnrollmentMap = new LinkedHashMap<>();
        
        for (CourseEnrollment enrollment : enrollments) {
            Employee employee = enrollment.getEmployee();
            if (employee == null) continue;
            
            Team team = employee.getTeam();
            if (team == null) continue;
            
            DepartmentDat department = team.getDepartmentDat();
            if (department == null) continue;
            
            String divisionName = department.getDivision() != null ? 
                department.getDivision().getDivisionName() : "Unknown";
            String deptName = department.getDeptName();
            String teamName = team.getTeamName();
            
            divisionDeptTeamEnrollmentMap
                .computeIfAbsent(divisionName, k -> new LinkedHashMap<>())
                .computeIfAbsent(deptName, k -> new LinkedHashMap<>())
                .computeIfAbsent(teamName, k -> new ArrayList<>())
                .add(enrollment);
        }
        
        // For each division, department and team, calculate attendance separately
        for (Map.Entry<String, Map<String, Map<String, List<CourseEnrollment>>>> divisionEntry : divisionDeptTeamEnrollmentMap.entrySet()) {
            String divisionName = divisionEntry.getKey();
            Map<String, Map<String, List<CourseEnrollment>>> deptMap = divisionEntry.getValue();
            
            for (Map.Entry<String, Map<String, List<CourseEnrollment>>> deptEntry : deptMap.entrySet()) {
                String deptName = deptEntry.getKey();
                Map<String, List<CourseEnrollment>> teamMap = deptEntry.getValue();
                
                for (Map.Entry<String, List<CourseEnrollment>> teamEntry : teamMap.entrySet()) {
                    String teamName = teamEntry.getKey();
                    List<CourseEnrollment> teamEnrollments = teamEntry.getValue();
                    
                    // Calculate daily attendance specifically for this team's students
                    List<DailyAttendanceDetailDTO> dailyAttendance = 
                        calculateDailyAttendanceForEnrollments(group, sessions, teamEnrollments);
                    
                    if (!dailyAttendance.isEmpty()) {
                        String courseName = course.getCourseName();
                        String groupName = group.getGroupName();
                        
                        // Calculate group average attendance
                        Double groupAverage = dailyAttendance.stream()
                            .map(DailyAttendanceDetailDTO::presentPercentage)
                            .filter(Objects::nonNull)
                            .mapToDouble(Double::doubleValue)
                            .average()
                            .orElse(0.0);
                        
                        CourseGroupData groupData = new CourseGroupData(
                            courseName,
                            groupName,
                            dailyAttendance,
                            groupAverage  // Added
                        );
                        
                        divisionDeptTeamMap
                            .computeIfAbsent(divisionName, k -> new LinkedHashMap<>())
                            .computeIfAbsent(deptName, k -> new LinkedHashMap<>())
                            .computeIfAbsent(teamName, k -> new ArrayList<>())
                            .add(groupData);
                    }
                }
            }
        }
    }

    private List<DailyAttendanceDetailDTO> calculateDailyAttendanceForEnrollments(
            CourseGroup group,
            List<CourseSession> sessions,
            List<CourseEnrollment> enrollments) {
        
        Set<LocalDate> uniqueDates = new TreeSet<>();
        for (CourseSession session : sessions) {
            uniqueDates.add(session.getSessionDate());
        }
        
        List<DailyAttendanceDetailDTO> dailyAttendanceList = new ArrayList<>();
        int totalStudents = enrollments.size();
        
        for (LocalDate date : uniqueDates) {
            List<CourseSession> sessionsOnDate = courseSessionRepository
                .findByCourseGroupIdAndSessionDate(group.getId(), date);
            
            int totalSessionsOnDate = sessionsOnDate.size();
            int totalPresent = 0;
            int totalAbsent = 0;
            int totalLate = 0;
            int totalExcused = 0;
            
            for (CourseEnrollment enrollment : enrollments) {
                for (CourseSession session : sessionsOnDate) {
                    totalPresent += attendanceRecordRepository
                        .countByEnrollmentIdAndAttendanceStatusAndSessionId(
                            enrollment.getId(),
                            AttendanceRecord.AttendanceStatus.PRESENT,
                            session.getId()
                        );
                    
                    totalAbsent += attendanceRecordRepository
                        .countByEnrollmentIdAndAttendanceStatusAndSessionId(
                            enrollment.getId(),
                            AttendanceRecord.AttendanceStatus.ABSENT,
                            session.getId()
                        );
                    
                    totalLate += attendanceRecordRepository
                        .countByEnrollmentIdAndAttendanceStatusAndSessionId(
                            enrollment.getId(),
                            AttendanceRecord.AttendanceStatus.LATE,
                            session.getId()
                        );
                    
                    totalExcused += attendanceRecordRepository
                        .countByEnrollmentIdAndAttendanceStatusAndSessionId(
                            enrollment.getId(),
                            AttendanceRecord.AttendanceStatus.EXCUSED,
                            session.getId()
                        );
                }
            }
            
            int totalPossible = totalStudents * totalSessionsOnDate;
            double presentPercentage = 0.0;
            double absentPercentage = 0.0;
            double latePercentage = 0.0;
            double excusedPercentage = 0.0;
            
            if (totalPossible > 0) {
                presentPercentage = (double) totalPresent / totalPossible * 100;
                absentPercentage = (double) totalAbsent / totalPossible * 100;
                latePercentage = (double) totalLate / totalPossible * 100;
                excusedPercentage = (double) totalExcused / totalPossible * 100;
            }
            
            String formattedDate = formatDate(date);
            
            dailyAttendanceList.add(new DailyAttendanceDetailDTO(
                formattedDate,
                Math.round(presentPercentage * 100.0) / 100.0,
                Math.round(absentPercentage * 100.0) / 100.0,
                Math.round(latePercentage * 100.0) / 100.0,
                Math.round(excusedPercentage * 100.0) / 100.0,
                totalPresent,
                totalAbsent,
                totalLate,
                totalExcused,
                totalStudents
            ));
        }
        
        return dailyAttendanceList;
    }

    // NEW: Updated conversion method with averages
    private List<DivisionMonthlyAttendanceDTO> convertToDTOWithAverages(
            Map<String, Map<String, Map<String, List<CourseGroupData>>>> divisionDeptTeamMap) {
        
        List<DivisionMonthlyAttendanceDTO> result = new ArrayList<>();
        
        for (Map.Entry<String, Map<String, Map<String, List<CourseGroupData>>>> divisionEntry : divisionDeptTeamMap.entrySet()) {
            String divisionName = divisionEntry.getKey();
            Map<String, Map<String, List<CourseGroupData>>> deptMap = divisionEntry.getValue();
            
            List<DepartmentMonthlyAttendanceDTO> deptDTOs = new ArrayList<>();
            
            for (Map.Entry<String, Map<String, List<CourseGroupData>>> deptEntry : deptMap.entrySet()) {
                String deptName = deptEntry.getKey();
                Map<String, List<CourseGroupData>> teamMap = deptEntry.getValue();
                
                List<TeamMonthlyAttendanceDTO> teamDTOs = new ArrayList<>();
                
                for (Map.Entry<String, List<CourseGroupData>> teamEntry : teamMap.entrySet()) {
                    String teamName = teamEntry.getKey();
                    List<CourseGroupData> groupDataList = teamEntry.getValue();
                    
                    Map<String, List<CourseGroupData>> courseMap = groupDataList.stream()
                        .collect(Collectors.groupingBy(CourseGroupData::courseName));
                    
                    List<CourseMonthlyAttendanceDTO> courseDTOs = new ArrayList<>();
                    
                    for (Map.Entry<String, List<CourseGroupData>> courseEntry : courseMap.entrySet()) {
                        String courseName = courseEntry.getKey();
                        List<CourseGroupData> courseGroupData = courseEntry.getValue();
                        
                        Map<String, List<DailyAttendanceDetailDTO>> groupAttendanceMap = new LinkedHashMap<>();
                        Map<String, Double> groupAverageMap = new LinkedHashMap<>();  // NEW: Store group averages
                        
                        for (CourseGroupData data : courseGroupData) {
                            groupAttendanceMap.put(data.groupName(), data.dailyAttendance());
                            groupAverageMap.put(data.groupName(), data.groupAverage());
                        }
                        
                        List<GroupMonthlyAttendanceDTO> groupDTOs = new ArrayList<>();
                        for (Map.Entry<String, List<DailyAttendanceDetailDTO>> groupEntry : groupAttendanceMap.entrySet()) {
                            String groupName = groupEntry.getKey();
                            List<DailyAttendanceDetailDTO> dailyAttendance = groupEntry.getValue();
                            Double groupAverage = groupAverageMap.get(groupName);
                            
                            groupDTOs.add(new GroupMonthlyAttendanceDTO(
                                groupName,
                                groupAverage,  // Added
                                dailyAttendance
                            ));
                        }
                        
                        // Calculate course average (average of all group averages)
                        Double courseAverage = groupDTOs.stream()
                            .map(GroupMonthlyAttendanceDTO::averageAttendance)
                            .filter(Objects::nonNull)
                            .mapToDouble(Double::doubleValue)
                            .average()
                            .orElse(0.0);
                        
                        courseDTOs.add(new CourseMonthlyAttendanceDTO(
                            courseName,
                            courseAverage,  // Added
                            groupDTOs
                        ));
                    }
                    
                    // Calculate team average (average of all course averages)
                    Double teamAverage = courseDTOs.stream()
                        .map(CourseMonthlyAttendanceDTO::averageAttendance)
                        .filter(Objects::nonNull)
                        .mapToDouble(Double::doubleValue)
                        .average()
                        .orElse(0.0);
                    
                    teamDTOs.add(new TeamMonthlyAttendanceDTO(
                        teamName,
                        teamAverage,  // Added
                        courseDTOs
                    ));
                }
                
                // Calculate department average (average of all team averages)
                Double deptAverage = teamDTOs.stream()
                    .map(TeamMonthlyAttendanceDTO::averageAttendance)
                    .filter(Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.0);
                
                deptDTOs.add(new DepartmentMonthlyAttendanceDTO(
                    deptName,
                    deptAverage,  // Added
                    teamDTOs
                ));
            }
            
            // Calculate division average (average of all department averages)
            Double divisionAverage = deptDTOs.stream()
                .map(DepartmentMonthlyAttendanceDTO::averageAttendance)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
            
            result.add(new DivisionMonthlyAttendanceDTO(
                divisionName,
                divisionAverage,  // Added
                deptDTOs
            ));
        }
        
        return result;
    }

    // ==================== HELPER METHODS ====================

    private record CourseGroupData(
            String courseName,
            String groupName,
            List<DailyAttendanceDetailDTO> dailyAttendance,
            Double groupAverage  // Added
    ) {}

    private String formatDate(LocalDate date) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d");
        return date.format(formatter);
    }

    private Integer getMonthNumber(String monthName) {
        try {
            return Enum.valueOf(java.time.Month.class, monthName).getValue();
        } catch (IllegalArgumentException e) {
            log.warn("Invalid month name: {}, defaulting to 1", monthName);
            return 1;
        }
    }

    private String getMonthAbbreviation(String monthName) {
        try {
            java.time.Month month = java.time.Month.valueOf(monthName);
            return month.name().substring(0, 3);
        } catch (IllegalArgumentException e) {
            return monthName.length() >= 3 ? monthName.substring(0, 3) : monthName;
        }
    }
}