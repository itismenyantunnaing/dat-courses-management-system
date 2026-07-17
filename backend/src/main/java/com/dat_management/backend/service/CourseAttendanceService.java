package com.dat_management.backend.service;

import com.dat_management.backend.dto.MonthlyAttendanceDtos.*;
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
public class CourseAttendanceService {

    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final CourseSessionRepository courseSessionRepository;
    private final CourseGroupRepository courseGroupRepository;

    @Transactional(readOnly = true)
    public List<DepartmentMonthlyAttendanceDTO> getMonthlyAttendanceByDepartment() {
        log.info("========== STARTING MONTHLY ATTENDANCE BY DEPARTMENT ==========");
        
        List<Course> trainerCourses = courseRepository.findByIsDeletedFalse().stream()
            .filter(course -> course.getCourseCategory().getCourseType() == CourseCategory.CourseType.TRAINER_PROVIDED)
            .collect(Collectors.toList());
        
        log.info("Found {} trainer-provided courses", trainerCourses.size());
        
        if (trainerCourses.isEmpty()) {
            log.warn("No trainer-provided courses found");
            return new ArrayList<>();
        }
        
        Map<String, Map<String, List<CourseGroupData>>> departmentTeamMap = new LinkedHashMap<>();
        
        for (Course course : trainerCourses) {
            log.info("Processing course: {}", course.getCourseName());
            processCourse(course, departmentTeamMap);
        }
        
        List<DepartmentMonthlyAttendanceDTO> result = convertToDTO(departmentTeamMap);
        
        log.info("Completed monthly attendance by department. Found {} departments", result.size());
        return result;
    }

    private void processCourse(Course course, Map<String, Map<String, List<CourseGroupData>>> departmentTeamMap) {
        List<CourseGroup> groups = courseGroupRepository.findByCourseId(course.getId());
        
        if (groups.isEmpty()) {
            log.debug("Course {} has no groups", course.getCourseName());
            return;
        }
        
        for (CourseGroup group : groups) {
            processGroup(course, group, departmentTeamMap);
        }
    }

    private void processGroup(Course course, CourseGroup group, 
                              Map<String, Map<String, List<CourseGroupData>>> departmentTeamMap) {
        List<CourseSession> sessions = courseSessionRepository
            .findByCourseGroupIdOrderBySessionNoAsc(group.getId());
        
        if (sessions.isEmpty()) {
            log.debug("Group {} has no sessions, skipping", group.getGroupName());
            return;
        }
        
        List<CourseEnrollment> enrollments = enrollmentRepository.findByCourseGroupId(group.getId());
        
        if (enrollments.isEmpty()) {
            log.debug("Group {} has no enrollments, skipping", group.getGroupName());
            return;
        }
        
        // Group enrollments by department and team
        Map<String, Map<String, List<CourseEnrollment>>> departmentTeamEnrollmentMap = new LinkedHashMap<>();
        
        for (CourseEnrollment enrollment : enrollments) {
            Employee employee = enrollment.getEmployee();
            if (employee == null) continue;
            
            Team team = employee.getTeam();
            if (team == null) continue;
            
            DepartmentDat department = team.getDepartmentDat();
            if (department == null) continue;
            
            String deptName = department.getDeptName();
            String teamName = team.getTeamName();
            
            departmentTeamEnrollmentMap
                .computeIfAbsent(deptName, k -> new LinkedHashMap<>())
                .computeIfAbsent(teamName, k -> new ArrayList<>())
                .add(enrollment);
        }
        
        // For each department and team, calculate attendance separately
        for (Map.Entry<String, Map<String, List<CourseEnrollment>>> deptEntry : departmentTeamEnrollmentMap.entrySet()) {
            String deptName = deptEntry.getKey();
            Map<String, List<CourseEnrollment>> teamMap = deptEntry.getValue();
            
            for (Map.Entry<String, List<CourseEnrollment>> teamEntry : teamMap.entrySet()) {
                String teamName = teamEntry.getKey();
                List<CourseEnrollment> teamEnrollments = teamEntry.getValue();
                
                // Calculate monthly attendance specifically for this team's students
                List<MonthlyAttendanceDetailDTO> teamMonthlyAttendance = 
                    calculateMonthlyAttendanceForEnrollments(group, sessions, teamEnrollments);
                
                if (!teamMonthlyAttendance.isEmpty()) {
                    String courseName = course.getCourseName();
                    String groupName = group.getGroupName();
                    
                    CourseGroupData groupData = new CourseGroupData(
                        courseName,
                        groupName,
                        teamMonthlyAttendance
                    );
                    
                    departmentTeamMap
                        .computeIfAbsent(deptName, k -> new LinkedHashMap<>())
                        .computeIfAbsent(teamName, k -> new ArrayList<>())
                        .add(groupData);
                }
            }
        }
    }

    /**
     * Calculate monthly attendance specifically for a set of enrollments
     */
    private List<MonthlyAttendanceDetailDTO> calculateMonthlyAttendanceForEnrollments(
            CourseGroup group,
            List<CourseSession> sessions,
            List<CourseEnrollment> enrollments) {
        
        Set<String> monthYearSet = getDistinctMonths(sessions);
        List<String> sortedMonths = sortMonthsChronologically(monthYearSet);
        
        List<MonthlyAttendanceDetailDTO> monthlyAttendanceList = new ArrayList<>();
        
        for (String monthYear : sortedMonths) {
            String[] parts = monthYear.split("-");
            String monthName = parts[0];
            Integer year = Integer.parseInt(parts[1]);
            Integer monthNumber = getMonthNumber(monthName);
            
            // Get sessions for this specific month
            List<CourseSession> monthSessions = courseSessionRepository
                .findByGroupIdAndMonthAndYear(group.getId(), monthNumber, year);
            
            int totalSessionsInMonth = monthSessions.size();
            int totalStudents = enrollments.size();
            int totalPresent = 0;
            
            // Count PRESENT attendance for each enrollment in this month
            for (CourseEnrollment enrollment : enrollments) {
                long presentCount = attendanceRecordRepository
                    .countByEnrollmentIdAndAttendanceStatusAndMonthAndYear(
                        enrollment.getId(),
                        AttendanceRecord.AttendanceStatus.PRESENT,
                        monthNumber,
                        year
                    );
                totalPresent += presentCount;
            }
            
            // Calculate attendance percentage
            double attendancePercentage = 0.0;
            if (totalStudents > 0 && totalSessionsInMonth > 0) {
                attendancePercentage = (double) totalPresent / (totalStudents * totalSessionsInMonth) * 100;
            }
            
            monthlyAttendanceList.add(new MonthlyAttendanceDetailDTO(
                getMonthAbbreviation(monthName),
                year,
                Math.round(attendancePercentage * 100.0) / 100.0,
                totalPresent,
                totalSessionsInMonth,
                totalStudents
            ));
        }
        
        return monthlyAttendanceList;
    }

    private List<DepartmentMonthlyAttendanceDTO> convertToDTO(
            Map<String, Map<String, List<CourseGroupData>>> departmentTeamMap) {
        
        List<DepartmentMonthlyAttendanceDTO> result = new ArrayList<>();
        
        for (Map.Entry<String, Map<String, List<CourseGroupData>>> deptEntry : departmentTeamMap.entrySet()) {
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
                    
                    Map<String, List<MonthlyAttendanceDetailDTO>> groupAttendanceMap = new LinkedHashMap<>();
                    for (CourseGroupData data : courseGroupData) {
                        groupAttendanceMap.put(data.groupName(), data.monthlyAttendance());
                    }
                    
                    List<GroupMonthlyAttendanceDTO> groupDTOs = new ArrayList<>();
                    for (Map.Entry<String, List<MonthlyAttendanceDetailDTO>> groupEntry : groupAttendanceMap.entrySet()) {
                        groupDTOs.add(new GroupMonthlyAttendanceDTO(
                            groupEntry.getKey(),
                            groupEntry.getValue()
                        ));
                    }
                    
                    courseDTOs.add(new CourseMonthlyAttendanceDTO(
                        courseName,
                        groupDTOs
                    ));
                }
                
                teamDTOs.add(new TeamMonthlyAttendanceDTO(
                    teamName,
                    courseDTOs
                ));
            }
            
            result.add(new DepartmentMonthlyAttendanceDTO(
                deptName,
                teamDTOs
            ));
        }
        
        return result;
    }

    // ==================== HELPER METHODS ====================

    private record CourseGroupData(
            String courseName,
            String groupName,
            List<MonthlyAttendanceDetailDTO> monthlyAttendance
    ) {}

    private Set<String> getDistinctMonths(List<CourseSession> sessions) {
        Set<String> monthYearSet = new LinkedHashSet<>();
        for (CourseSession session : sessions) {
            String monthYear = session.getSessionDate().getMonth().name() + "-" + session.getSessionDate().getYear();
            monthYearSet.add(monthYear);
        }
        return monthYearSet;
    }

    private List<String> sortMonthsChronologically(Set<String> monthYearSet) {
        return monthYearSet.stream()
            .sorted((m1, m2) -> {
                String[] parts1 = m1.split("-");
                String[] parts2 = m2.split("-");
                int yearCompare = Integer.parseInt(parts1[1]) - Integer.parseInt(parts2[1]);
                if (yearCompare != 0) return yearCompare;
                return parts1[0].compareTo(parts2[0]);
            })
            .collect(Collectors.toList());
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