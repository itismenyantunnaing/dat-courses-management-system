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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    // API 4 — PUT /api/courses/:id
    // =========================================================
    public CourseDto updateCourse(Integer id, CourseUpdateDto req) {
        Course course = findCourseOrThrow(id);

        if (req.getCourseName()           != null) course.setCourseName(req.getCourseName());
        if (req.getTrainerName()          != null) course.setTrainerName(req.getTrainerName());
        if (req.getSelfStudyType()        != null) course.setSelfStudyType(req.getSelfStudyType());
        if (req.getTargetLevel()          != null) course.setTargetLevel(req.getTargetLevel());
        if (req.getTotalSessions()        != null) course.setTotalSessions(req.getTotalSessions());
        if (req.getStartDate()            != null) course.setStartDate(req.getStartDate());
        if (req.getEndDate()              != null) course.setEndDate(req.getEndDate());
        if (req.getRegistrationDeadline() != null) course.setRegistrationDeadline(req.getRegistrationDeadline());
        if (req.getStatus()               != null) course.setStatus(CourseStatus.valueOf(req.getStatus()));
        if (req.getCourseCategoryId()     != null) course.setCourseCategory(findCategoryOrThrow(req.getCourseCategoryId()));

        course = courseRepo.save(course);

        if (req.getGroups() != null) {
            List<CourseGroup> old = groupRepo.findByCourseIdOrderByGroupNameAsc(course.getId());
            for (CourseGroup g : old) sessionRepo.deleteByCourseGroupId(g.getId());
            groupRepo.deleteByCourseId(course.getId());
            for (GroupRequestDto gReq : req.getGroups()) {
                CourseGroup group = saveGroup(course, gReq);
                saveSessionsForGroup(course, group, gReq.getSessions());
            }
        }

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
    
    // Get the image path from the course
    String imagePath = course.getImagePath(); 
    
    // Delete the image file if it exists
    if (imagePath != null && !imagePath.isEmpty()) {
        courseImageStorageService.deleteImage(imagePath);
    }
    
    // Set the image path to null
    course.setImagePath(null);
    
    // Soft delete the course
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
        // First verify the course exists
        findCourseOrThrow(courseId);
        
        // Get all enrollments for this course
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
        // Verify the course exists
        findCourseOrThrow(courseId);
        
        // Verify the group exists and belongs to the course
        CourseGroup group = groupRepo.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));
        
        if (!group.getCourse().getId().equals(courseId)) {
            throw new RuntimeException("Group does not belong to the specified course");
        }
        
        // Get all sessions for this group
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
        // Find session
        CourseSession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found with id: " + sessionId));
        
        // Update status
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
                        .sessionDeadline(s.getSessionDeadline() != null
                                ? s.getSessionDeadline().toLocalDate() : null)
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
            ss.setSessionDeadline(s.getSessionDeadline() != null
                    ? s.getSessionDeadline().atStartOfDay() : null);
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