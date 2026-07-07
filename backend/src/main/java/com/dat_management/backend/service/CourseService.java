package com.dat_management.backend.service;

import com.dat_management.backend.dto.*;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.entity.Course.CourseStatus;
import com.dat_management.backend.entity.CourseCategory.CourseType;
import com.dat_management.backend.entity.CourseGroup.GroupStatus;
import com.dat_management.backend.entity.CourseSession.SessionStatus;
import com.dat_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseService {

    private final CourseCategoryRepository   categoryRepo;
    private final CourseRepository           courseRepo;
    private final CourseGroupRepository      groupRepo;
    private final CourseSessionRepository    sessionRepo;
    private final CourseEnrollmentRepository enrollmentRepo;
    private final SelfStudySessionRepository selfStudyRepo;
    private final CourseImageStorageService  courseImageStorageService;

    // =========================================================
    // API 1 — GET /api/courses
    // =========================================================
    @Transactional(readOnly = true)
    public List<CourseDto> getAllCourses() {
        return courseRepo.findByIsDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .map(c -> toCourseDto(c, false))
                .collect(Collectors.toList());
    }

    // =========================================================
    // API 2 — GET /api/courses/:id
    // =========================================================
    @Transactional(readOnly = true)
    public CourseDto getCourseById(Integer id) {
        return toCourseDto(findCourseOrThrow(id), true);
    }

    // =========================================================
    // API 3 — POST /api/courses (with optional image)
    // =========================================================
    public CourseDto createCourse(CourseRequestDto req, MultipartFile image) {
        CourseCategory category = findCategoryOrThrow(req.getCourseCategoryId());

        Course course = new Course();
        course.setCourseCategory(category);
        course.setCourseName(req.getCourseName());
        course.setTrainerName(req.getTrainerName());
        course.setSelfStudyType(req.getSelfStudyType());
        course.setTargetLevel(req.getTargetLevel());
        course.setTotalSessions(req.getTotalSessions());
        course.setSessionPerDays(req.getSessionPerDays());
        course.setStartDate(req.getStartDate());
        course.setEndDate(req.getEndDate());
        course.setRegistrationDeadline(req.getRegistrationDeadline());
        course.setStatus(req.getStatus() != null
                ? CourseStatus.valueOf(req.getStatus())
                : CourseStatus.DRAFT);
        course.setIsDeleted(false);
        course = courseRepo.save(course);

        // Save groups + sessions
        if (req.getGroups() != null) {
            for (GroupRequestDto gReq : req.getGroups()) {
                CourseGroup group = saveGroup(course, gReq);
                saveSessionsForGroup(course, group, gReq.getSessions());
            }
        }

        // Save self-study sessions
        if (req.getSelfStudySessions() != null) {
            saveSelfStudySessions(course, req.getSelfStudySessions());
        }

        // Save image if provided
        if (image != null && !image.isEmpty()) {
            try {
                String imagePath = courseImageStorageService.storeImage(image, course.getId());
                course.setImagePath(imagePath);
                courseRepo.save(course);
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload image: " + e.getMessage());
            }
        }

        return toCourseDto(courseRepo.findById(course.getId()).get(), false);
    }

    // =========================================================
    // API 4 — PUT /api/courses/:id (UPDATED WITH PROPER GROUP HANDLING)
    // =========================================================
    public CourseDto updateCourse(Integer id, CourseUpdateDto req) {
        Course course = findCourseOrThrow(id);

        // Update basic fields
        if (req.getCourseName() != null) course.setCourseName(req.getCourseName());
        if (req.getTrainerName() != null) course.setTrainerName(req.getTrainerName());
        if (req.getSelfStudyType() != null) course.setSelfStudyType(req.getSelfStudyType());
        if (req.getTargetLevel() != null) course.setTargetLevel(req.getTargetLevel());
        if (req.getTotalSessions() != null) course.setTotalSessions(req.getTotalSessions());
        if (req.getSessionPerDays() != null) course.setSessionPerDays(req.getSessionPerDays());
        if (req.getStartDate() != null) course.setStartDate(req.getStartDate());
        if (req.getEndDate() != null) course.setEndDate(req.getEndDate());
        if (req.getRegistrationDeadline() != null) course.setRegistrationDeadline(req.getRegistrationDeadline());
        if (req.getStatus() != null) course.setStatus(CourseStatus.valueOf(req.getStatus()));
        if (req.getCourseCategoryId() != null) course.setCourseCategory(findCategoryOrThrow(req.getCourseCategoryId()));

        course = courseRepo.save(course);

        // Handle groups update with incremental logic
        if (req.getGroups() != null) {
            updateGroupsWithEnrollmentAwareness(course, req.getGroups());
        }

        // Handle self-study sessions update
        if (req.getSelfStudySessions() != null) {
            selfStudyRepo.deleteByCourseId(course.getId());
            saveSelfStudySessions(course, req.getSelfStudySessions());
        }

        return toCourseDto(courseRepo.findById(course.getId()).get(), false);
    }

    // =========================================================
    // API 5 — DELETE /api/courses/:id
    // =========================================================
    public void deleteCourse(Integer id) throws IOException {
        Course course = findCourseOrThrow(id);
        
        String imagePath = course.getImagePath(); 
        if (imagePath != null && !imagePath.isEmpty()) {
            courseImageStorageService.deleteImage(imagePath);
        }
        course.setImagePath(null);
        course.setIsDeleted(true);
        courseRepo.save(course);
    }

    // =========================================================
    // RESTORE — /api/courses/:id/restore
    // =========================================================
    public CourseDto restoreCourse(Integer id) {
        Course course = courseRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));
        course.setIsDeleted(false);
        return toCourseDto(courseRepo.save(course), false);
    }

    // =========================================================
    // API 6 — GET /api/course-categories
    // =========================================================
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepo.findByIsDeletedFalse()
                .stream()
                .map(this::toCategoryDto)
                .collect(Collectors.toList());
    }

    // =========================================================
    // GET /api/course-categories/:id
    // =========================================================
    public CategoryDto getCategoryById(Integer id) {
        CourseCategory cat = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        return toCategoryDto(cat);
    }

    // =========================================================
    // API 7 — POST /api/course-categories
    // =========================================================
    public CategoryDto createCategory(String name, String type) {
        if (name == null || name.isBlank())
            throw new RuntimeException("course_category_name is required");
        CourseCategory cat = CourseCategory.builder()
                .courseCategoryName(name)
                .courseType(CourseType.valueOf(type))
                .isDeleted(false)
                .build();
        return toCategoryDto(categoryRepo.save(cat));
    }

    // =========================================================
    // API 8 — PUT /api/course-categories/:id
    // =========================================================
    public CategoryDto updateCategory(Integer id, String name, String type) {
        CourseCategory cat = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        if (name != null && !name.isBlank()) cat.setCourseCategoryName(name);
        if (type != null && !type.isBlank()) cat.setCourseType(CourseType.valueOf(type));
        return toCategoryDto(categoryRepo.save(cat));
    }

    // =========================================================
    // API 9 — DELETE /api/course-categories/:id
    // =========================================================
    public void deleteCategory(Integer id) {
        CourseCategory cat = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        cat.setIsDeleted(true);
        categoryRepo.save(cat);
    }

    // =========================================================
    // RESTORE — /api/course-categories/:id/restore
    // =========================================================
    public CategoryDto restoreCategory(Integer id) {
        CourseCategory cat = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        cat.setIsDeleted(false);
        return toCategoryDto(categoryRepo.save(cat));
    }

    // =========================================================
    // UPLOAD IMAGE — POST /api/courses/:id/image
    // =========================================================
    public CourseDto uploadCourseImage(Integer id, MultipartFile file) {
        Course course = findCourseOrThrow(id);
        try {
            if (course.getImagePath() != null) {
                courseImageStorageService.deleteImage(course.getImagePath());
            }
            String imagePath = courseImageStorageService.storeImage(file, id);
            course.setImagePath(imagePath);
            courseRepo.save(course);
            return toCourseDto(course, false);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image: " + e.getMessage());
        }
    }

    // =========================================================
    // DELETE IMAGE — DELETE /api/courses/:id/image
    // =========================================================
    public CourseDto deleteCourseImage(Integer id) {
        Course course = findCourseOrThrow(id);
        if (course.getImagePath() == null) {
            throw new RuntimeException("Course has no image to delete");
        }
        try {
            courseImageStorageService.deleteImage(course.getImagePath());
            course.setImagePath(null);
            courseRepo.save(course);
            return toCourseDto(course, false);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete image: " + e.getMessage());
        }
    }

    // =========================================================
    // API 10 — GET /api/courses/:id/enrollments
    // =========================================================
    @Transactional(readOnly = true)
    public List<CourseEnrollmentDto> getCourseEnrollments(Integer courseId) {
        findCourseOrThrow(courseId);
        List<CourseEnrollment> enrollments = enrollmentRepo.findByCourseId(courseId);
        return enrollments.stream()
            .map(this::toCourseEnrollmentDto)
            .collect(Collectors.toList());
    }

    // =========================================================
    // API 21 — GET /api/courses/:id/groups/:groupId/sessions
    // =========================================================
    @Transactional(readOnly = true)
    public List<SessionDto> getGroupSessions(Integer courseId, Integer groupId) {
        findCourseOrThrow(courseId);
        CourseGroup group = groupRepo.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));
        if (!group.getCourse().getId().equals(courseId)) {
            throw new RuntimeException("Group does not belong to the specified course");
        }
        List<CourseSession> sessions = sessionRepo.findByCourseGroupIdOrderBySessionNoAsc(groupId);
        return sessions.stream()
            .map(this::toSessionResponseDto)
            .collect(Collectors.toList());
    }

    // =========================================================
    // API 22 — PUT /api/courses/:id/groups/:groupId/sessions/:sessionId
    // =========================================================
    @Transactional
    public Map<String, Object> updateSessionStatus(Integer courseId, Integer groupId, Integer sessionId, String sessionStatus) {
        CourseSession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found with id: " + sessionId));
        if (sessionStatus == null || sessionStatus.isEmpty()) {
            throw new RuntimeException("session_status is required");
        }
        CourseSession.SessionStatus status = CourseSession.SessionStatus.valueOf(sessionStatus.toUpperCase());
        session.setSessionStatus(status);
        CourseSession updated = sessionRepo.save(session);
        Map<String, Object> sessionData = new HashMap<>();
        sessionData.put("id", updated.getId());
        sessionData.put("session_status", updated.getSessionStatus().name());
        sessionData.put("session_date", updated.getSessionDate());
        return sessionData;
    }

    // =========================================================
    // PRIVATE HELPERS
    // =========================================================

    /**
     * Updates groups with enrollment awareness:
     * - Groups with enrollments: Can be updated but NOT deleted
     * - Groups without enrollments: Can be updated OR deleted
     * - New groups: Can be added
     */
    private void updateGroupsWithEnrollmentAwareness(Course course, List<GroupRequestDto> groupRequests) {
        // Get existing groups
        List<CourseGroup> existingGroups = groupRepo.findByCourseIdOrderByGroupNameAsc(course.getId());
        
        // Map existing groups by ID for easy lookup
        Map<Integer, CourseGroup> existingGroupMap = existingGroups.stream()
            .collect(Collectors.toMap(CourseGroup::getId, Function.identity()));
        
        // Track which existing groups are still in the request
        Set<Integer> requestGroupIds = new HashSet<>();
        
        // Process each group from the request
        for (GroupRequestDto gReq : groupRequests) {
            if (gReq.getId() != null && existingGroupMap.containsKey(gReq.getId())) {
                // EXISTING GROUP - Update it (even with enrollments)
                CourseGroup group = existingGroupMap.get(gReq.getId());
                requestGroupIds.add(group.getId());
                
                // Update group basic info
                group.setGroupName(gReq.getGroupName());
                group.setCapacity(gReq.getCapacity());
                if (gReq.getGroupStatus() != null) {
                    group.setGroupStatus(GroupStatus.valueOf(gReq.getGroupStatus()));
                }
                group = groupRepo.save(group);
                
                // Update sessions for this group using incremental logic
                updateSessionsForGroup(group, gReq.getSessions());
                
            } else {
                // NEW GROUP - Create it (if no ID provided or ID not found)
                CourseGroup group = saveGroup(course, gReq);
                saveSessionsForGroup(course, group, gReq.getSessions());
            }
        }
        
        // Delete groups that are no longer in the request (only if NO enrollments)
        for (CourseGroup existingGroup : existingGroups) {
            if (!requestGroupIds.contains(existingGroup.getId())) {
                // Check for enrollments before deleting
                long enrollmentCount = groupRepo.countEnrollmentsByGroupId(existingGroup.getId());
                
                if (enrollmentCount == 0) {
                    // Safe to delete - no enrollments
                    sessionRepo.deleteByCourseGroupId(existingGroup.getId());
                    groupRepo.delete(existingGroup);
                } else {
                    // Cannot delete group with enrollments
                    throw new RuntimeException(
                        String.format("Cannot delete group '%s' (ID: %d) because it has %d active enrollment(s)",
                            existingGroup.getGroupName(),
                            existingGroup.getId(),
                            enrollmentCount
                        )
                    );
                }
            }
        }
    }

    /**
     * Updates sessions for a group - handles add/update/delete incrementally
     * This prevents duplicate key errors by checking for existing session numbers
     */
    private void updateSessionsForGroup(CourseGroup group, List<SessionDto> sessionReqs) {
        if (sessionReqs == null) return;
        
        // Get existing sessions for this group
        List<CourseSession> existingSessions = sessionRepo.findByCourseGroupIdOrderBySessionNoAsc(group.getId());
        
        // Map existing sessions by ID for easy lookup
        Map<Integer, CourseSession> existingSessionMap = existingSessions.stream()
            .collect(Collectors.toMap(CourseSession::getId, Function.identity()));
        
        // Map existing sessions by session number for duplicate checking
        // FIXED: Using Integer as key type (converted from Short)
        Map<Integer, CourseSession> existingSessionByNo = existingSessions.stream()
            .filter(s -> s.getSessionNo() != null)
            .collect(Collectors.toMap(
                s -> s.getSessionNo().intValue(),  // Convert Short to Integer
                Function.identity(), 
                (a, b) -> a
            ));
        
        // Track which sessions from the request are processed
        Set<Integer> requestSessionIds = new HashSet<>();
        
        for (SessionDto sReq : sessionReqs) {
            if (sReq.getId() != null && existingSessionMap.containsKey(sReq.getId())) {
                // === UPDATE EXISTING SESSION ===
                CourseSession session = existingSessionMap.get(sReq.getId());
                requestSessionIds.add(session.getId());
                
                // Update session fields
                if (sReq.getSessionNo() != null) {
                    // Check if the new session number conflicts with another existing session
                    Integer newSessionNo = sReq.getSessionNo().intValue();
                    if (!newSessionNo.equals(session.getSessionNo() != null ? session.getSessionNo().intValue() : null)) {
                        CourseSession conflictingSession = existingSessionByNo.get(newSessionNo);
                        if (conflictingSession != null && !conflictingSession.getId().equals(session.getId())) {
                            // Session number conflict - throw error
                            throw new RuntimeException(
                                String.format("Session number %d already exists for this group", sReq.getSessionNo())
                            );
                        }
                    }
                    session.setSessionNo(sReq.getSessionNo());
                }
                
                if (sReq.getSessionDate() != null) {
                    session.setSessionDate(sReq.getSessionDate());
                }
                if (sReq.getStartTime() != null) {
                    session.setStartTime(sReq.getStartTime());
                }
                if (sReq.getEndTime() != null) {
                    session.setEndTime(sReq.getEndTime());
                }
                if (sReq.getSessionStatus() != null) {
                    session.setSessionStatus(SessionStatus.valueOf(sReq.getSessionStatus()));
                }
                sessionRepo.save(session);
                
            } else {
                // === CREATE NEW SESSION ===
                // Check if a session with this number already exists (to avoid duplicate key)
                Integer newSessionNo = sReq.getSessionNo() != null ? sReq.getSessionNo().intValue() : null;
                CourseSession existingByNo = existingSessionByNo.get(newSessionNo);
                
                if (existingByNo != null) {
                    // If a session with this number exists, update it instead of creating duplicate
                    requestSessionIds.add(existingByNo.getId());
                    
                    existingByNo.setSessionDate(sReq.getSessionDate());
                    existingByNo.setStartTime(sReq.getStartTime());
                    existingByNo.setEndTime(sReq.getEndTime());
                    if (sReq.getSessionStatus() != null) {
                        existingByNo.setSessionStatus(SessionStatus.valueOf(sReq.getSessionStatus()));
                    }
                    sessionRepo.save(existingByNo);
                    
                } else {
                    // Create new session
                    CourseSession newSession = new CourseSession();
                    newSession.setCourse(group.getCourse());
                    newSession.setCourseGroup(group);
                    newSession.setSessionNo(sReq.getSessionNo());
                    newSession.setSessionDate(sReq.getSessionDate());
                    newSession.setStartTime(sReq.getStartTime());
                    newSession.setEndTime(sReq.getEndTime());
                    newSession.setSessionStatus(sReq.getSessionStatus() != null ? 
                        SessionStatus.valueOf(sReq.getSessionStatus()) : SessionStatus.PLANNED);
                    sessionRepo.save(newSession);
                }
            }
        }
        
        // === DELETE SESSIONS NO LONGER IN REQUEST ===
        for (CourseSession existingSession : existingSessions) {
            if (!requestSessionIds.contains(existingSession.getId())) {
                // Check if this session number is still in the request (maybe with a different ID)
                boolean sessionNoStillExists = sessionReqs.stream()
                    .anyMatch(s -> s.getSessionNo() != null && 
                        s.getSessionNo().equals(existingSession.getSessionNo()));
                
                if (!sessionNoStillExists) {
                    // Session is completely removed - delete it
                    sessionRepo.delete(existingSession);
                }
            }
        }
    }

    private CourseDto toCourseDto(Course c, boolean includeEnrollments) {
        List<CourseGroup> groups = groupRepo.findByCourseIdOrderByGroupNameAsc(c.getId());
        List<GroupDto> groupDtos = groups.stream().map(g -> {
            List<SessionDto> sessions = sessionRepo
                    .findByCourseGroupIdOrderBySessionNoAsc(g.getId())
                    .stream().map(s -> SessionDto.builder()
                            .id(s.getId())
                            .sessionNo(s.getSessionNo())
                            .sessionDate(s.getSessionDate())
                            .startTime(s.getStartTime())
                            .endTime(s.getEndTime())
                            .sessionStatus(s.getSessionStatus() != null
                                    ? s.getSessionStatus().name() : null)
                            .build())
                    .collect(Collectors.toList());
            long regCount = groupRepo.countEnrollmentsByGroupId(g.getId());
            List<EnrollmentSummaryDto> enrollmentDtos = null;
            if (includeEnrollments) {
                enrollmentDtos = enrollmentRepo.findByCourseGroupId(g.getId())
                        .stream().map(e -> EnrollmentSummaryDto.builder()
                                .id(e.getId())
                                .employeeId(e.getEmployee().getId())
                                .employeeName(e.getEmployee().getName())
                                .email(e.getEmployee().getEmail())
                                .position(e.getEmployee().getPosition())
                                .enrollmentStatus(e.getEnrollmentStatus())
                                .enrolledAt(e.getEnrolledAt())
                                .build())
                        .collect(Collectors.toList());
            }
            return GroupDto.builder()
                    .id(g.getId())
                    .groupName(g.getGroupName())
                    .capacity(g.getCapacity())
                    .groupStatus(g.getGroupStatus() != null ? g.getGroupStatus().name() : null)
                    .createdAt(includeEnrollments ? g.getCreatedAt() : null)
                    .sessions(sessions)
                    .enrollments(enrollmentDtos)
                    .registeredCount(regCount)
                    .build();
        }).collect(Collectors.toList());

        List<SelfStudySessionDto> ssDtos = selfStudyRepo
                .findByCourseIdOrderBySessionNoAsc(c.getId())
                .stream().map(s -> SelfStudySessionDto.builder()
                        .id(s.getId())
                        .sessionNo(s.getSessionNo())
                        .filePath(s.getFilepath())
                        .kanjiTarget(s.getKanjiTarget())
                        .vocabularyTarget(s.getVocabularyTarget())
                        .grammarTarget(s.getGrammarTarget())
                        .readingTargetMinutes(s.getReadingTargetMinutes())
                        .listeningTargetMinutes(s.getListeningTargetMinutes())
                        .sessionStatus(s.getSessionStatus())
                        .createdAt(s.getCreatedAt())
                        .updatedAt(s.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        return CourseDto.builder()
                .id(c.getId())
                .courseName(c.getCourseName())
                .trainerName(c.getTrainerName())
                .selfStudyType(c.getSelfStudyType())
                .courseCategoryId(c.getCourseCategory() != null ? c.getCourseCategory().getId() : null)
                .targetLevel(c.getTargetLevel())
                .totalSessions(c.getTotalSessions())
                .sessionPerDays(c.getSessionPerDays())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .registrationDeadline(c.getRegistrationDeadline())
                .status(c.getStatus() != null ? c.getStatus().name() : null)
                .isDeleted(c.getIsDeleted())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .imagePath(c.getImagePath())
                .category(c.getCourseCategory() != null ? toCategoryDto(c.getCourseCategory()) : null)
                .groups(groupDtos.isEmpty() ? new ArrayList<>() : groupDtos)
                .selfStudySessions(ssDtos.isEmpty() ? new ArrayList<>() : ssDtos)
                .build();
    }

    private CategoryDto toCategoryDto(CourseCategory c) {
        return CategoryDto.builder()
                .id(c.getId())
                .courseCategoryName(c.getCourseCategoryName())
                .courseType(c.getCourseType() != null ? c.getCourseType().name() : null)
                .isDeleted(c.getIsDeleted())
                .build();
    }

    private CourseGroup saveGroup(Course course, GroupRequestDto gReq) {
        CourseGroup g = new CourseGroup();
        g.setCourse(course);
        g.setGroupName(gReq.getGroupName());
        g.setCapacity(gReq.getCapacity());
        g.setGroupStatus(gReq.getGroupStatus() != null
                ? GroupStatus.valueOf(gReq.getGroupStatus())
                : GroupStatus.OPEN);
        return groupRepo.save(g);
    }

    private void saveSessionsForGroup(Course course, CourseGroup group, List<SessionDto> sessions) {
        if (sessions == null) return;
        for (SessionDto s : sessions) {
            CourseSession cs = new CourseSession();
            cs.setCourse(course);
            cs.setCourseGroup(group);
            cs.setSessionNo(s.getSessionNo());
            cs.setSessionDate(s.getSessionDate());
            cs.setStartTime(s.getStartTime());
            cs.setEndTime(s.getEndTime());
            cs.setSessionStatus(s.getSessionStatus() != null
                    ? SessionStatus.valueOf(s.getSessionStatus())
                    : SessionStatus.PLANNED);
            sessionRepo.save(cs);
        }
    }

    private SessionDto toSessionResponseDto(CourseSession session) {
        return SessionDto.builder()
            .id(session.getId())
            .sessionNo(session.getSessionNo())
            .sessionDate(session.getSessionDate())
            .startTime(session.getStartTime())
            .endTime(session.getEndTime())
            .sessionStatus(session.getSessionStatus() != null ? 
                session.getSessionStatus().name() : null)
            .build();
    }

    private void saveSelfStudySessions(Course course, List<SelfStudySessionDto> dtos) {
        if (dtos == null) return;
        for (SelfStudySessionDto s : dtos) {
            SelfStudySession ss = new SelfStudySession();
            ss.setCourse(course);
            ss.setSessionNo(s.getSessionNo());
            ss.setFilepath(s.getFilePath());
            ss.setKanjiTarget(s.getKanjiTarget());
            ss.setVocabularyTarget(s.getVocabularyTarget());
            ss.setGrammarTarget(s.getGrammarTarget());
            ss.setReadingTargetMinutes(s.getReadingTargetMinutes());
            ss.setListeningTargetMinutes(s.getListeningTargetMinutes());
            ss.setSessionStatus(s.getSessionStatus() != null ? s.getSessionStatus() : "PLANNED");
            ss.setCreatedAt(LocalDateTime.now());
            ss.setUpdatedAt(LocalDateTime.now());
            selfStudyRepo.save(ss);
        }
    }

    private Course findCourseOrThrow(Integer id) {
        return courseRepo.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));
    }

    private CourseCategory findCategoryOrThrow(Integer id) {
        return categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
    }

    private CourseEnrollmentDto toCourseEnrollmentDto(CourseEnrollment enrollment) {
        Employee employee = enrollment.getEmployee();
        CourseGroup courseGroup = enrollment.getCourseGroup();
        Team team = employee.getTeam();
        DepartmentDat departmentDat = team != null ? team.getDepartmentDat() : null;
        
        return CourseEnrollmentDto.builder()
            .id(enrollment.getId())
            .employeeId(employee.getId())
            .employeeName(employee.getName())
            .email(employee.getEmail())
            .position(employee.getPosition())
            .teamId(team != null ? team.getId() : null)
            .teamName(team != null ? team.getTeamName() : null)
            .departmentId(departmentDat != null ? departmentDat.getId() : null)
            .departmentName(departmentDat != null ? departmentDat.getDeptName() : null)
            .courseGroupId(courseGroup != null ? courseGroup.getId() : null)
            .courseGroupName(courseGroup != null ? courseGroup.getGroupName() : null)
            .enrollmentStatus(enrollment.getEnrollmentStatus())
            .enrolledAt(enrollment.getEnrolledAt())
            .build();
    }
}