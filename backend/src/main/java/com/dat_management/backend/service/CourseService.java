package com.dat_management.backend.service;

import com.dat_management.backend.dto.*;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.entity.Course.CourseStatus;
import com.dat_management.backend.entity.CourseCategory.CourseType;
import com.dat_management.backend.entity.CourseGroup.GroupStatus;
import com.dat_management.backend.entity.CourseSession.SessionStatus;
import com.dat_management.backend.entity.Notification.NotificationType;
import com.dat_management.backend.repository.*;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CourseService {

    private final CourseCategoryRepository categoryRepo;
    private final CourseRepository courseRepo;
    private final CourseGroupRepository groupRepo;
    private final CourseSessionRepository sessionRepo;
    private final CourseEnrollmentRepository enrollmentRepo;
    private final SelfStudySessionRepository selfStudyRepo;
    private final CourseImageStorageService courseImageStorageService;
    private final NotificationService notificationService;

    // =========================================================
    // API 1 — GET /api/courses
    // =========================================================
    @Transactional(readOnly = true)
    public List<CourseDto> getAllCourses() {
        log.info("📋 Fetching all non-deleted courses");
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
        log.info("🔍 Fetching course with ID: {}", id);
        return toCourseDto(findCourseOrThrow(id), true);
    }

    // =========================================================
    // API 3 — POST /api/courses (with optional image)
    // =========================================================
    public CourseDto createCourse(CourseRequestDto req, MultipartFile image, HttpServletRequest request) {
        log.info("📝 Creating new course: {}", req.getCourseName());
        
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
        log.info(" Course created with ID: {}", course.getId());

        // Save groups + sessions
        if (req.getGroups() != null) {
            log.info("📦 Creating {} groups for course", req.getGroups().size());
            for (GroupRequestDto gReq : req.getGroups()) {
                CourseGroup group = saveGroup(course, gReq);
                saveSessionsForGroup(course, group, gReq.getSessions());
            }
        }

        // Save self-study sessions
        if (req.getSelfStudySessions() != null) {
            log.info("📚 Creating {} self-study sessions", req.getSelfStudySessions().size());
            saveSelfStudySessions(course, req.getSelfStudySessions());
        }

        // Save image if provided
        if (image != null && !image.isEmpty()) {
            try {
                log.info("🖼️ Uploading image for course ID: {}", course.getId());
                String imagePath = courseImageStorageService.storeImage(image, course.getId());
                course.setImagePath(imagePath);
                courseRepo.save(course);
            } catch (IOException e) {
                log.error("❌ Failed to upload image: {}", e.getMessage());
                throw new RuntimeException("Failed to upload image: " + e.getMessage());
            }
        }

        CourseDto result = toCourseDto(courseRepo.findById(course.getId()).get(), false);

        if (result.getStatus() != null && CourseStatus.OPEN.name().equalsIgnoreCase(result.getStatus())) {
            log.info("📢 Sending notification for new course: {}", course.getCourseName());
            notificationService.sendToAllActive(
                    NotificationType.COURSE,
                    "New course available",
                    "A new course \"" + course.getCourseName() + "\" has been created. Please check the course details and enrollment deadline.",
                    course.getId(),
                    request);
        }
        return result;
    }

    // =========================================================
    // API 4 — PUT /api/courses/:id
    // =========================================================
    public CourseDto updateCourse(Integer id, CourseUpdateDto req, HttpServletRequest request) {
        log.info("🔄 Updating course ID: {}", id);
        Course course = findCourseOrThrow(id);
        
        // Store the old status before updating
        CourseStatus oldStatus = course.getStatus();
        boolean statusChangedToOpen = false;

        // Update basic fields
        if (req.getCourseName() != null) {
            log.info("  📝 Updating course name: {} → {}", course.getCourseName(), req.getCourseName());
            course.setCourseName(req.getCourseName());
        }
        if (req.getTrainerName() != null) {
            log.info("  👨‍🏫 Updating trainer: {} → {}", course.getTrainerName(), req.getTrainerName());
            course.setTrainerName(req.getTrainerName());
        }
        if (req.getSelfStudyType() != null)
            course.setSelfStudyType(req.getSelfStudyType());
        if (req.getTargetLevel() != null)
            course.setTargetLevel(req.getTargetLevel());
        if (req.getTotalSessions() != null)
            course.setTotalSessions(req.getTotalSessions());
        if (req.getStartDate() != null)
            course.setStartDate(req.getStartDate());
        if (req.getEndDate() != null)
            course.setEndDate(req.getEndDate());
        if (req.getRegistrationDeadline() != null)
            course.setRegistrationDeadline(req.getRegistrationDeadline());
        if (req.getStatus() != null) {
            CourseStatus newStatus = CourseStatus.valueOf(req.getStatus());
            course.setStatus(newStatus);
            
            if (CourseStatus.OPEN.equals(newStatus) && !CourseStatus.OPEN.equals(oldStatus)) {
                statusChangedToOpen = true;
                log.info("  📢 Course status changed to OPEN");
            }
        }
        if (req.getCourseCategoryId() != null) {
            log.info("  📂 Updating category to ID: {}", req.getCourseCategoryId());
            course.setCourseCategory(findCategoryOrThrow(req.getCourseCategoryId()));
        }

        course = courseRepo.save(course);

        // Handle groups update - ONLY if groups are provided in the request
        if (req.getGroups() != null && !req.getGroups().isEmpty()) {
            log.info("  👥 Updating groups for course ID: {}", id);
            updateGroups(course, req.getGroups());
        } else {
            log.info("  ℹ️ No group changes in request. Skipping group update.");
        }

        // Handle self-study sessions update
        if (req.getSelfStudySessions() != null) {
            log.info("  📚 Updating self-study sessions");
            updateSelfStudySessions(course, req.getSelfStudySessions());
        }

        // Send notification if status changed to OPEN
        if (statusChangedToOpen) {
            log.info("📢 Sending notification for course status change to OPEN");
            notificationService.sendToAllActive(
                NotificationType.COURSE,
                "New course available",
                "Course \"" + course.getCourseName() + "\" is now open for registration! Please check the course details and enrollment deadline.",
                course.getId(),
                request
            );
        }
        
        log.info(" Course update completed for ID: {}", id);
        return toCourseDto(courseRepo.findById(course.getId()).get(), false);
    }

    // =========================================================
    // API 5 — DELETE /api/courses/:id
    // =========================================================
    public void deleteCourse(Integer id) throws IOException {
        log.info("🗑️ Deleting course ID: {}", id);
        Course course = findCourseOrThrow(id);

        String imagePath = course.getImagePath();
        if (imagePath != null && !imagePath.isEmpty()) {
            log.info("  🖼️ Deleting image: {}", imagePath);
            courseImageStorageService.deleteImage(imagePath);
        }
        course.setImagePath(null);
        course.setIsDeleted(true);
        courseRepo.save(course);
        log.info(" Course ID: {} marked as deleted", id);
    }

    // =========================================================
    // RESTORE — /api/courses/:id/restore
    // =========================================================
    public CourseDto restoreCourse(Integer id) {
        log.info("♻️ Restoring course ID: {}", id);
        Course course = courseRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));
        course.setIsDeleted(false);
        Course restored = courseRepo.save(course);
        log.info(" Course ID: {} restored", id);
        return toCourseDto(restored, false);
    }

    // =========================================================
    // API 6 — GET /api/course-categories
    // =========================================================
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        log.info("📋 Fetching all categories");
        return categoryRepo.findByIsDeletedFalse()
                .stream()
                .map(this::toCategoryDto)
                .collect(Collectors.toList());
    }

    // =========================================================
    // GET /api/course-categories/:id
    // =========================================================
    public CategoryDto getCategoryById(Integer id) {
        log.info("🔍 Fetching category ID: {}", id);
        CourseCategory cat = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        return toCategoryDto(cat);
    }

    // =========================================================
    // API 7 — POST /api/course-categories
    // =========================================================
    public CategoryDto createCategory(String name, String type) {
        log.info("📝 Creating category: {} with type: {}", name, type);
        if (name == null || name.isBlank())
            throw new RuntimeException("course_category_name is required");
        CourseCategory cat = CourseCategory.builder()
                .courseCategoryName(name)
                .courseType(CourseType.valueOf(type))
                .isDeleted(false)
                .build();
        CategoryDto result = toCategoryDto(categoryRepo.save(cat));
        log.info(" Category created with ID: {}", result.getId());
        return result;
    }

    // =========================================================
    // API 8 — PUT /api/course-categories/:id
    // =========================================================
    public CategoryDto updateCategory(Integer id, String name, String type) {
        log.info("🔄 Updating category ID: {}", id);
        CourseCategory cat = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        if (name != null && !name.isBlank()) {
            log.info("  📝 Updating name: {} → {}", cat.getCourseCategoryName(), name);
            cat.setCourseCategoryName(name);
        }
        if (type != null && !type.isBlank()) {
            log.info("  📂 Updating type: {} → {}", cat.getCourseType(), type);
            cat.setCourseType(CourseType.valueOf(type));
        }
        CategoryDto result = toCategoryDto(categoryRepo.save(cat));
        log.info(" Category ID: {} updated", id);
        return result;
    }

    // =========================================================
    // API 9 — DELETE /api/course-categories/:id
    // =========================================================
    public void deleteCategory(Integer id) {
        log.info("🗑️ Deleting category ID: {}", id);
        CourseCategory cat = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        cat.setIsDeleted(true);
        categoryRepo.save(cat);
        log.info(" Category ID: {} marked as deleted", id);
    }

    // =========================================================
    // RESTORE — /api/course-categories/:id/restore
    // =========================================================
    public CategoryDto restoreCategory(Integer id) {
        log.info("♻️ Restoring category ID: {}", id);
        CourseCategory cat = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        cat.setIsDeleted(false);
        CategoryDto result = toCategoryDto(categoryRepo.save(cat));
        log.info(" Category ID: {} restored", id);
        return result;
    }

    // =========================================================
    // UPLOAD IMAGE — POST /api/courses/:id/image
    // =========================================================
    public CourseDto uploadCourseImage(Integer id, MultipartFile file) {
        log.info("🖼️ Uploading image for course ID: {}", id);
        Course course = findCourseOrThrow(id);
        try {
            if (course.getImagePath() != null) {
                log.info("  🗑️ Deleting old image: {}", course.getImagePath());
                courseImageStorageService.deleteImage(course.getImagePath());
            }
            String imagePath = courseImageStorageService.storeImage(file, id);
            course.setImagePath(imagePath);
            courseRepo.save(course);
            log.info(" Image uploaded successfully for course ID: {}", id);
            return toCourseDto(course, false);
        } catch (IOException e) {
            log.error("❌ Failed to upload image: {}", e.getMessage());
            throw new RuntimeException("Failed to upload image: " + e.getMessage());
        }
    }

    // =========================================================
    // DELETE IMAGE — DELETE /api/courses/:id/image
    // =========================================================
    public CourseDto deleteCourseImage(Integer id) {
        log.info("🗑️ Deleting image for course ID: {}", id);
        Course course = findCourseOrThrow(id);
        if (course.getImagePath() == null) {
            log.warn("⚠️ Course ID: {} has no image to delete", id);
            throw new RuntimeException("Course has no image to delete");
        }
        try {
            courseImageStorageService.deleteImage(course.getImagePath());
            course.setImagePath(null);
            courseRepo.save(course);
            log.info(" Image deleted for course ID: {}", id);
            return toCourseDto(course, false);
        } catch (IOException e) {
            log.error("❌ Failed to delete image: {}", e.getMessage());
            throw new RuntimeException("Failed to delete image: " + e.getMessage());
        }
    }

    // =========================================================
    // API 10 — GET /api/courses/:id/enrollments
    // =========================================================
    @Transactional(readOnly = true)
    public List<CourseEnrollmentDto> getCourseEnrollments(Integer courseId) {
        log.info("📋 Fetching enrollments for course ID: {}", courseId);
        findCourseOrThrow(courseId);
        List<CourseEnrollment> enrollments = enrollmentRepo.findByCourseId(courseId);
        log.info("  - Found {} enrollments", enrollments.size());
        return enrollments.stream()
                .map(this::toCourseEnrollmentDto)
                .collect(Collectors.toList());
    }

    // =========================================================
    // API 21 — GET /api/courses/:id/groups/:groupId/sessions
    // =========================================================
    @Transactional(readOnly = true)
    public List<SessionDto> getGroupSessions(Integer courseId, Integer groupId) {
        log.info("📋 Fetching sessions for group ID: {} in course ID: {}", groupId, courseId);
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
    public Map<String, Object> updateSessionStatus(Integer courseId, Integer groupId, Integer sessionId,
            String sessionStatus) {
        log.info("🔄 Updating session status for session ID: {} in group ID: {}", sessionId, groupId);
        CourseSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found with id: " + sessionId));
        if (sessionStatus == null || sessionStatus.isEmpty()) {
            throw new RuntimeException("session_status is required");
        }
        CourseSession.SessionStatus status = CourseSession.SessionStatus.valueOf(sessionStatus.toUpperCase());
        session.setSessionStatus(status);
        CourseSession updated = sessionRepo.save(session);
        log.info(" Session ID: {} status updated to: {}", sessionId, status);
        Map<String, Object> sessionData = new HashMap<>();
        sessionData.put("id", updated.getId());
        sessionData.put("session_status", updated.getSessionStatus().name());
        sessionData.put("session_date", updated.getSessionDate());
        return sessionData;
    }

    // =========================================================
    // PRIVATE HELPERS - GROUP MANAGEMENT (FIXED WITH AUTO-CREATION)
    // =========================================================

    /**
     * Main group update logic with fixes (NO entity structure changes):
     * 
     * First redistribution detection:
     *   - Exactly 1 group exists with capacity = NULL
     *   - Request has 1 or more groups with finite capacities
     *   - Members exist in the course
     * 
     * Auto-creation during first redistribution:
     *   - If only 1 group requested AND capacity < total members
     *   - Auto-create additional groups with SAME capacity
     *   - Distribute all members across all groups
     */
    private void updateGroups(Course course, List<GroupRequestDto> groupRequests) {
        log.info("========================================");
        log.info("🔄 STARTING updateGroups for Course ID: {}", course.getId());
        log.info("========================================");
        
        // Get existing groups
        List<CourseGroup> existingGroups = groupRepo.findByCourseIdOrderByGroupNameAsc(course.getId());
        
        log.info("📊 Current State:");
        log.info("  - Course ID: {}", course.getId());
        log.info("  - Existing Groups: {}", existingGroups.size());
        for (CourseGroup g : existingGroups) {
            long memberCount = groupRepo.countEnrollmentsByGroupId(g.getId());
            log.info("    • Group: '{}' (ID: {}, Capacity: {}, Members: {})", 
                g.getGroupName(), g.getId(), g.getCapacity(), memberCount);
        }
        
        log.info("📥 Requested Groups: {}", groupRequests.size());
        for (GroupRequestDto gReq : groupRequests) {
            log.info("    • Group: '{}' (Capacity: {})", gReq.getGroupName(), gReq.getCapacity());
        }

        // =========================================================
        // DETECT: Is this the FIRST redistribution?
        // =========================================================
        boolean isFirstRedistribution = false;
        
        if (existingGroups.size() == 1) {
            CourseGroup theOnlyGroup = existingGroups.get(0);
            long memberCount = groupRepo.countEnrollmentsByGroupId(theOnlyGroup.getId());
            
            boolean hasNullCapacity = theOnlyGroup.getCapacity() == null;
            boolean allRequestedHaveFiniteCapacity = groupRequests.stream()
                    .allMatch(gReq -> gReq.getCapacity() != null);
            boolean hasMembers = memberCount > 0;
            
            if (hasNullCapacity && allRequestedHaveFiniteCapacity && hasMembers) {
                isFirstRedistribution = true;
                log.info("🎯 FIRST REDISTRIBUTION DETECTED!");
                log.info("  - Group '{}' has NULL capacity → New capacities defined", 
                    theOnlyGroup.getGroupName());
                log.info("  - Requested {} groups with capacities:", groupRequests.size());
                for (GroupRequestDto gReq : groupRequests) {
                    log.info("      • '{}': Capacity = {}", gReq.getGroupName(), gReq.getCapacity());
                }
                log.info("  - Members to distribute: {}", memberCount);
            }
        }

        if (isFirstRedistribution) {
            log.info("========================================");
            log.info("🔄 EXECUTING FIRST REDISTRIBUTION (Full Distribution)");
            log.info("========================================");
            handleFirstRedistribution(course, groupRequests, existingGroups);
            log.info(" First redistribution completed.");
            log.info("========================================");
            return;
        }

        log.info("ℹ️ Not first redistribution. Using minimal update logic.");
        
        // =========================================================
        // SUBSEQUENT UPDATES: Check what changed
        // =========================================================
        Map<String, CourseGroup> existingGroupByName = existingGroups.stream()
                .collect(Collectors.toMap(CourseGroup::getGroupName, Function.identity()));
        
        Set<String> requestGroupNames = new HashSet<>();
        boolean capacityChanged = false;
        boolean groupsAdded = false;
        boolean groupsDeleted = false;
        
        log.info("📊 Analyzing changes...");
        
        for (GroupRequestDto gReq : groupRequests) {
            requestGroupNames.add(gReq.getGroupName());
            
            if (existingGroupByName.containsKey(gReq.getGroupName())) {
                CourseGroup existingGroup = existingGroupByName.get(gReq.getGroupName());
                Integer oldCapacity = existingGroup.getCapacity();
                Integer newCapacity = gReq.getCapacity();
                
                if (!Objects.equals(oldCapacity, newCapacity)) {
                    capacityChanged = true;
                    log.info("  📊 Capacity changed for '{}': {} → {}", 
                        gReq.getGroupName(), oldCapacity, newCapacity);
                }
            } else {
                groupsAdded = true;
                log.info("  ➕ New group added: '{}' (Capacity: {})", 
                    gReq.getGroupName(), gReq.getCapacity());
            }
        }
        
        for (CourseGroup existingGroup : existingGroups) {
            if (!requestGroupNames.contains(existingGroup.getGroupName())) {
                groupsDeleted = true;
                long memberCount = groupRepo.countEnrollmentsByGroupId(existingGroup.getId());
                log.info("  ➖ Group deleted: '{}' (Members: {}, Capacity: {})", 
                    existingGroup.getGroupName(), memberCount, existingGroup.getCapacity());
            }
        }
        
        log.info("📊 Change Summary:");
        log.info("  - Capacity Changed: {}", capacityChanged);
        log.info("  - Groups Added: {}", groupsAdded);
        log.info("  - Groups Deleted: {}", groupsDeleted);
        
        // Case 1: Only metadata changed (no group structure changes)
        if (!capacityChanged && !groupsAdded && !groupsDeleted) {
            log.info("ℹ️ No group structure changes detected. Skipping redistribution.");
            log.info("  (Only updating group metadata like status or sessions)");
            processGroupUpdates(course, groupRequests, existingGroups);
            log.info("========================================");
            return;
        }
        
        // Case 2: Group structure changed - check if redistribution is needed
        log.info("🔍 Checking if redistribution is needed...");
        
        processGroupUpdates(course, groupRequests, existingGroups);
        
        existingGroups = groupRepo.findByCourseIdOrderByGroupNameAsc(course.getId());
        
        boolean anyGroupOverCapacity = false;
        for (CourseGroup group : existingGroups) {
            if (group.getCapacity() != null) {
                long currentMembers = groupRepo.countEnrollmentsByGroupId(group.getId());
                if (currentMembers > group.getCapacity()) {
                    anyGroupOverCapacity = true;
                    log.info("  ⚠️ Group '{}' is OVER capacity: {} / {} members", 
                        group.getGroupName(), currentMembers, group.getCapacity());
                }
            }
        }
        
        if (anyGroupOverCapacity) {
            log.info("🔄 Redistribution needed: Some groups are over capacity");
            redistributeWithMinimalChanges(course, existingGroups);
        } else {
            log.info(" All groups within capacity. No redistribution needed.");
            log.info("  (Keeping existing group assignments stable)");
        }
        
        if (groupsDeleted) {
            log.info("🗑️ Deleting groups not in request...");
            deleteGroupsNotInRequest(course, existingGroups, requestGroupNames);
        }
        
        log.info(" updateGroups completed for Course ID: {}", course.getId());
        log.info("========================================");
    }

    /**
     * HANDLE FIRST REDISTRIBUTION WITH AUTO-CREATION
     * This happens ONLY ONCE: when going from NULL capacity to finite capacities
     * 
     * Auto-creation logic:
     *   - If ONLY 1 group requested AND capacity < total members
     *   - Auto-create additional groups with SAME capacity
     *   - Distribute all members across all groups
     */
    private void handleFirstRedistribution(Course course, List<GroupRequestDto> groupRequests, 
                                           List<CourseGroup> existingGroups) {
        log.info("📊 First Redistribution Started");
        log.info("  - Request has {} groups to create/update", groupRequests.size());
        
        CourseGroup originalGroup = existingGroups.get(0);
        int totalMembers = (int) groupRepo.countEnrollmentsByGroupId(originalGroup.getId());
        
        log.info("  - Original Group: '{}' (Members: {})", originalGroup.getGroupName(), totalMembers);
        
        // =========================================================
        // STEP 1: Calculate total capacity from request
        // =========================================================
        int requestedTotalCapacity = 0;
        Map<String, Integer> requestedCapacities = new HashMap<>();
        
        for (GroupRequestDto gReq : groupRequests) {
            Integer cap = gReq.getCapacity();
            if (cap != null) {
                requestedTotalCapacity += cap;
                requestedCapacities.put(gReq.getGroupName(), cap);
            }
        }
        
        log.info("  - Requested total capacity: {}", requestedTotalCapacity);
        log.info("  - Total members: {}", totalMembers);
        
        // =========================================================
        // STEP 2: Check if we need to auto-create groups
        // =========================================================
        boolean needsAutoCreate = false;
        int groupsNeeded = 0;
        int autoCreateCapacity = 0;
        String baseGroupName = null;
        
        if (requestedTotalCapacity < totalMembers && groupRequests.size() == 1) {
            // Only 1 group requested and capacity is insufficient
            // → Auto-create additional groups
            needsAutoCreate = true;
            Integer singleCapacity = groupRequests.get(0).getCapacity();
            baseGroupName = groupRequests.get(0).getGroupName();
            autoCreateCapacity = singleCapacity != null ? singleCapacity : 0;
            
            if (autoCreateCapacity > 0) {
                groupsNeeded = (int) Math.ceil((double) totalMembers / autoCreateCapacity);
                log.info("  🔄 Auto-creation needed!");
                log.info("  - Single group capacity: {}", autoCreateCapacity);
                log.info("  - Groups needed: {} (ceil({}/{}))", groupsNeeded, totalMembers, autoCreateCapacity);
            } else {
                throw new RuntimeException("Capacity cannot be 0 or null for auto-creation");
            }
        } else if (requestedTotalCapacity < totalMembers && groupRequests.size() > 1) {
            // Multiple groups requested but total capacity insufficient
            log.error("  ❌ Total capacity ({}) is less than total members ({})", requestedTotalCapacity, totalMembers);
            throw new RuntimeException(
                String.format("Total capacity (%d) is less than total enrollments (%d). " +
                    "Please increase capacity or add more groups.",
                    requestedTotalCapacity, totalMembers));
        }
        
        // =========================================================
        // STEP 3: Process groups from the request
        // =========================================================
        log.info("  📦 Processing {} groups from request...", groupRequests.size());
        
        Map<String, CourseGroup> existingGroupByName = existingGroups.stream()
                .collect(Collectors.toMap(CourseGroup::getGroupName, Function.identity()));
        
        List<CourseGroup> allGroups = new ArrayList<>();
        int totalCapacity = 0;
        
        for (GroupRequestDto gReq : groupRequests) {
            CourseGroup group;
            String groupName = gReq.getGroupName();
            Integer capacity = gReq.getCapacity();
            
            if (existingGroupByName.containsKey(groupName)) {
                group = existingGroupByName.get(groupName);
                group.setCapacity(capacity);
                if (gReq.getGroupStatus() != null) {
                    group.setGroupStatus(GroupStatus.valueOf(gReq.getGroupStatus()));
                }
                group = groupRepo.save(group);
                log.info("     Updated group '{}': Capacity = {}", groupName, capacity);
            } else {
                group = new CourseGroup();
                group.setCourse(course);
                group.setGroupName(groupName);
                group.setCapacity(capacity);
                group.setGroupStatus(gReq.getGroupStatus() != null 
                    ? GroupStatus.valueOf(gReq.getGroupStatus()) 
                    : GroupStatus.OPEN);
                group = groupRepo.save(group);
                log.info("     Created new group '{}': Capacity = {}", groupName, capacity);
                copySessionsFromGroup(course, group, originalGroup);
            }
            
            allGroups.add(group);
            if (capacity != null) {
                totalCapacity += capacity;
            }
        }
        
        // =========================================================
        // STEP 4: AUTO-CREATE additional groups (if needed)
        // =========================================================
        List<CourseGroup> autoCreatedGroups = new ArrayList<>();
        
        if (needsAutoCreate) {
            log.info("  🔄 Auto-creating {} additional groups...", groupsNeeded - 1);
            
            int baseNumber = allGroups.size() + 1;
            
            for (int i = 0; i < groupsNeeded - 1; i++) {
                String newGroupName = "Group " + (baseNumber + i);
                
                // Ensure unique name
                while (isGroupNameTaken(newGroupName, allGroups, groupRequests)) {
                    newGroupName = baseGroupName + "_" + (baseNumber + i) + "_" + System.currentTimeMillis();
                }
                
                CourseGroup newGroup = new CourseGroup();
                newGroup.setCourse(course);
                newGroup.setGroupName(newGroupName);
                newGroup.setCapacity(autoCreateCapacity);
                newGroup.setGroupStatus(GroupStatus.OPEN);
                newGroup = groupRepo.save(newGroup);
                
                log.info("     Auto-created group '{}': Capacity = {}", newGroupName, autoCreateCapacity);
                
                copySessionsFromGroup(course, newGroup, originalGroup);
                
                allGroups.add(newGroup);
                autoCreatedGroups.add(newGroup);
                totalCapacity += autoCreateCapacity;
            }
            
            log.info("  - Total capacity after auto-creation: {}", totalCapacity);
        }
        
        // =========================================================
        // STEP 5: Validate capacity is sufficient
        // =========================================================
        if (totalCapacity < totalMembers) {
            log.error("  ❌ Total capacity ({}) is less than total members ({})", totalCapacity, totalMembers);
            throw new RuntimeException(
                String.format("Total capacity (%d) is less than total enrollments (%d). " +
                    "Please increase capacity or add more groups.",
                    totalCapacity, totalMembers));
        }
        
        // =========================================================
        // STEP 6: Distribute ALL members across ALL groups
        // =========================================================
        log.info("  🔄 Distributing {} members across {} groups", totalMembers, allGroups.size());
        redistributeAllMembersEvenly(course, allGroups);
        
        log.info(" First Redistribution Completed");
        log.info("  - Groups after redistribution: {}", allGroups.size());
        for (CourseGroup group : allGroups) {
            long memberCount = groupRepo.countEnrollmentsByGroupId(group.getId());
            log.info("    • Group '{}': {} members (Capacity: {})", 
                group.getGroupName(), memberCount, group.getCapacity());
        }
    }

    /**
     * REDISTRIBUTE ALL MEMBERS EVENLY (Used only for first redistribution)
     */
    private void redistributeAllMembersEvenly(Course course, List<CourseGroup> groups) {
        log.info("  📊 Redistributing ALL members evenly");
        
        List<CourseEnrollment> allEnrollments = enrollmentRepo.findByCourseId(course.getId());
        log.info("    - Total enrollments to distribute: {}", allEnrollments.size());
        
        allEnrollments.sort(Comparator.comparing(CourseEnrollment::getEnrolledAt));
        
        Map<Integer, Integer> groupCapacities = new HashMap<>();
        Map<Integer, Integer> groupCounts = new HashMap<>();
        
        for (CourseGroup group : groups) {
            if (group.getCapacity() != null) {
                groupCapacities.put(group.getId(), group.getCapacity());
            } else {
                groupCapacities.put(group.getId(), Integer.MAX_VALUE);
            }
            groupCounts.put(group.getId(), 0);
        }
        
        int enrollmentIndex = 0;
        for (CourseGroup group : groups) {
            int capacity = groupCapacities.get(group.getId());
            int toAssign = Math.min(capacity, allEnrollments.size() - enrollmentIndex);
            
            for (int i = 0; i < toAssign && enrollmentIndex < allEnrollments.size(); i++) {
                CourseEnrollment enrollment = allEnrollments.get(enrollmentIndex);
                enrollment.setCourseGroup(group);
                enrollmentRepo.save(enrollment);
                groupCounts.put(group.getId(), groupCounts.get(group.getId()) + 1);
                log.info("      ✓ Assigned enrollment {} to group '{}'", 
                    enrollment.getId(), group.getGroupName());
                enrollmentIndex++;
            }
            
            if (enrollmentIndex >= allEnrollments.size()) {
                break;
            }
        }
        
        log.info("    - Distribution complete:");
        for (CourseGroup group : groups) {
            int count = groupCounts.getOrDefault(group.getId(), 0);
            int capacity = groupCapacities.getOrDefault(group.getId(), 0);
            String capStr = capacity == Integer.MAX_VALUE ? "UNLIMITED" : String.valueOf(capacity);
            log.info("      • Group '{}': {} / {} members", group.getGroupName(), count, capStr);
        }
    }

    /**
     * PROCESS GROUP UPDATES (Create/Update groups without redistribution)
     */
    private void processGroupUpdates(Course course, List<GroupRequestDto> groupRequests, 
                                     List<CourseGroup> existingGroups) {
        log.info("  📝 Processing group updates...");
        
        Map<String, CourseGroup> existingGroupByName = existingGroups.stream()
                .collect(Collectors.toMap(CourseGroup::getGroupName, Function.identity()));
        
        for (GroupRequestDto gReq : groupRequests) {
            if (existingGroupByName.containsKey(gReq.getGroupName())) {
                CourseGroup group = existingGroupByName.get(gReq.getGroupName());
                group.setCapacity(gReq.getCapacity());
                if (gReq.getGroupStatus() != null) {
                    group.setGroupStatus(GroupStatus.valueOf(gReq.getGroupStatus()));
                }
                groupRepo.save(group);
                log.info("     Updated group '{}': Capacity = {}, Status = {}", 
                    group.getGroupName(), group.getCapacity(), group.getGroupStatus());
                updateSessionsForGroup(group, gReq.getSessions());
            } else {
                CourseGroup newGroup = saveGroup(course, gReq);
                saveSessionsForGroup(course, newGroup, gReq.getSessions());
                existingGroups.add(newGroup);
                log.info("     Created new group '{}': Capacity = {}", 
                    newGroup.getGroupName(), newGroup.getCapacity());
            }
        }
    }

    /**
     * REDISTRIBUTE WITH MINIMAL CHANGES
     * Only move members who are in over-capacity groups
     */
    private void redistributeWithMinimalChanges(Course course, List<CourseGroup> groups) {
        log.info("🔄 Starting minimal redistribution...");
        
        Map<Integer, List<CourseEnrollment>> enrollmentsByGroup = new HashMap<>();
        Map<Integer, Integer> currentCounts = new HashMap<>();
        
        for (CourseGroup group : groups) {
            List<CourseEnrollment> enrollments = enrollmentRepo.findByCourseGroupId(group.getId());
            enrollmentsByGroup.put(group.getId(), enrollments);
            currentCounts.put(group.getId(), enrollments.size());
            log.info("  - Group '{}': {} members (Capacity: {})", 
                group.getGroupName(), enrollments.size(), group.getCapacity());
        }
        
        List<CourseGroup> overCapacityGroups = new ArrayList<>();
        List<CourseGroup> underCapacityGroups = new ArrayList<>();
        
        for (CourseGroup group : groups) {
            if (group.getCapacity() == null) {
                log.info("  - Group '{}' has unlimited capacity (NULL)", group.getGroupName());
                continue;
            }
            int current = currentCounts.getOrDefault(group.getId(), 0);
            int capacity = group.getCapacity();
            if (current > capacity) {
                overCapacityGroups.add(group);
                log.info("  ⚠️ Group '{}' is OVER capacity: {} > {}", 
                    group.getGroupName(), current, capacity);
            } else if (current < capacity) {
                underCapacityGroups.add(group);
                log.info("   Group '{}' has space: {} < {}", 
                    group.getGroupName(), current, capacity);
            }
        }
        
        if (overCapacityGroups.isEmpty()) {
            log.info(" No over-capacity groups. No redistribution needed.");
            return;
        }
        
        log.info("🔄 Moving members from over-capacity groups...");
        int totalMoved = 0;
        
        for (CourseGroup sourceGroup : overCapacityGroups) {
            int capacity = sourceGroup.getCapacity();
            List<CourseEnrollment> members = enrollmentsByGroup.get(sourceGroup.getId());
            members.sort(Comparator.comparing(CourseEnrollment::getEnrolledAt));
            
            int excess = members.size() - capacity;
            log.info("  - Group '{}' has {} excess members to move", sourceGroup.getGroupName(), excess);
            
            for (int i = 0; i < excess; i++) {
                CourseEnrollment member = members.get(members.size() - 1 - i);
                
                CourseGroup targetGroup = null;
                for (CourseGroup g : underCapacityGroups) {
                    int current = currentCounts.getOrDefault(g.getId(), 0);
                    int cap = g.getCapacity() == null ? Integer.MAX_VALUE : g.getCapacity();
                    if (current < cap) {
                        targetGroup = g;
                        break;
                    }
                }
                
                if (targetGroup != null) {
                    member.setCourseGroup(targetGroup);
                    enrollmentRepo.save(member);
                    currentCounts.put(sourceGroup.getId(), currentCounts.get(sourceGroup.getId()) - 1);
                    currentCounts.put(targetGroup.getId(), currentCounts.get(targetGroup.getId()) + 1);
                    totalMoved++;
                    log.info("      ✓ Moved enrollment {} from '{}' to '{}'", 
                        member.getId(), sourceGroup.getGroupName(), targetGroup.getGroupName());
                } else {
                    log.warn("      ⚠️ No available space for enrollment {}", member.getId());
                    throw new RuntimeException(
                        String.format("Cannot move enrollment %d from group '%s'. No available capacity in other groups.",
                            member.getId(), sourceGroup.getGroupName()));
                }
            }
        }
        
        log.info(" Minimal redistribution completed. Total members moved: {}", totalMoved);
    }

    /**
     * DELETE GROUPS NOT IN REQUEST
     */
    private void deleteGroupsNotInRequest(Course course, List<CourseGroup> existingGroups, 
                                          Set<String> requestGroupNames) {
        log.info("🗑️ Deleting groups not in request...");
        
        List<CourseGroup> groupsToDelete = new ArrayList<>();
        
        for (CourseGroup existingGroup : existingGroups) {
            if (!requestGroupNames.contains(existingGroup.getGroupName())) {
                long memberCount = groupRepo.countEnrollmentsByGroupId(existingGroup.getId());
                log.info("  - Group '{}' not in request. Members: {}", 
                    existingGroup.getGroupName(), memberCount);
                
                if (memberCount > 0) {
                    log.warn("  ⚠️ Group '{}' has {} members! Moving them first...", 
                        existingGroup.getGroupName(), memberCount);
                    
                    boolean moved = moveMembersToAvailableGroups(existingGroup, existingGroups);
                    if (!moved) {
                        throw new RuntimeException(
                            String.format("Cannot delete group '%s'. No available capacity in other groups. " +
                                "Please increase capacity or delete members first.",
                                existingGroup.getGroupName()));
                    }
                }
                groupsToDelete.add(existingGroup);
            }
        }
        
        for (CourseGroup groupToDelete : groupsToDelete) {
            log.info("  🗑️ Deleting group '{}' (ID: {})", 
                groupToDelete.getGroupName(), groupToDelete.getId());
            sessionRepo.deleteByCourseGroupId(groupToDelete.getId());
            groupRepo.delete(groupToDelete);
        }
        
        log.info(" Groups deletion completed. Deleted {} groups.", groupsToDelete.size());
    }

    /**
     * MOVE MEMBERS FROM A GROUP TO AVAILABLE GROUPS
     */
    private boolean moveMembersToAvailableGroups(CourseGroup sourceGroup, List<CourseGroup> allGroups) {
        List<CourseEnrollment> members = enrollmentRepo.findByCourseGroupId(sourceGroup.getId());
        
        if (members.isEmpty()) {
            log.info("   Group '{}' has no members to move", sourceGroup.getGroupName());
            return true;
        }
        
        log.info("  Moving {} members from '{}'", members.size(), sourceGroup.getGroupName());
        
        List<CourseGroup> availableGroups = new ArrayList<>();
        for (CourseGroup group : allGroups) {
            if (group.getId().equals(sourceGroup.getId())) continue;
            if (group.getCapacity() == null) {
                availableGroups.add(group);
                log.info("    ✓ Group '{}' has unlimited capacity", group.getGroupName());
            } else {
                long currentMembers = groupRepo.countEnrollmentsByGroupId(group.getId());
                if (currentMembers < group.getCapacity()) {
                    availableGroups.add(group);
                    int space = group.getCapacity() - (int) currentMembers;
                    log.info("    ✓ Group '{}' has {} spaces available", group.getGroupName(), space);
                }
            }
        }
        
        if (availableGroups.isEmpty()) {
            log.error("❌ No available groups to move members to!");
            return false;
        }
        
        int memberIndex = 0;
        for (CourseGroup targetGroup : availableGroups) {
            if (memberIndex >= members.size()) break;
            
            int availableSpace = targetGroup.getCapacity() == null ? 
                Integer.MAX_VALUE : 
                targetGroup.getCapacity() - (int) groupRepo.countEnrollmentsByGroupId(targetGroup.getId());
            
            int toMove = Math.min(availableSpace, members.size() - memberIndex);
            
            for (int i = 0; i < toMove && memberIndex < members.size(); i++) {
                CourseEnrollment member = members.get(memberIndex);
                member.setCourseGroup(targetGroup);
                enrollmentRepo.save(member);
                log.info("      ✓ Moved member {} to '{}'", member.getId(), targetGroup.getGroupName());
                memberIndex++;
            }
        }
        
        if (memberIndex < members.size()) {
            log.error("❌ Could not move all members! {} members remain", members.size() - memberIndex);
            return false;
        }
        
        log.info("   All {} members moved successfully", members.size());
        return true;
    }

    /**
     * COPY SESSIONS FROM SOURCE GROUP TO TARGET GROUP
     */
    private void copySessionsFromGroup(Course course, CourseGroup targetGroup, CourseGroup sourceGroup) {
        if (sourceGroup == null) {
            log.warn("  ⚠️ Source group is null. Cannot copy sessions.");
            return;
        }
        
        List<CourseSession> sourceSessions = sessionRepo.findByCourseGroupIdOrderBySessionNoAsc(sourceGroup.getId());
        if (sourceSessions.isEmpty()) {
            log.info("  ℹ️ Source group has no sessions to copy");
            return;
        }
        
        log.info("  📋 Copying {} sessions from '{}' to '{}'", 
            sourceSessions.size(), sourceGroup.getGroupName(), targetGroup.getGroupName());
        
        for (CourseSession session : sourceSessions) {
            CourseSession newSession = new CourseSession();
            newSession.setCourse(course);
            newSession.setCourseGroup(targetGroup);
            newSession.setSessionNo(session.getSessionNo());
            newSession.setSessionDate(session.getSessionDate());
            newSession.setStartTime(session.getStartTime());
            newSession.setEndTime(session.getEndTime());
            newSession.setSessionStatus(SessionStatus.PLANNED);
            sessionRepo.save(newSession);
        }
    }

    // =========================================================
    // PRIVATE HELPERS - SESSION MANAGEMENT
    // =========================================================

    private void updateSessionsForGroup(CourseGroup group, List<SessionDto> sessionReqs) {
        if (sessionReqs == null) {
            log.info("  ℹ️ No session updates for group '{}'", group.getGroupName());
            return;
        }

        log.info("  📋 Updating {} sessions for group '{}'", sessionReqs.size(), group.getGroupName());

        List<CourseSession> existingSessions = sessionRepo.findByCourseGroupIdOrderBySessionNoAsc(group.getId());

        Map<Integer, CourseSession> existingSessionMap = existingSessions.stream()
                .collect(Collectors.toMap(CourseSession::getId, Function.identity()));

        Map<Integer, CourseSession> existingSessionByNo = existingSessions.stream()
                .filter(s -> s.getSessionNo() != null)
                .collect(Collectors.toMap(
                        s -> s.getSessionNo().intValue(),
                        Function.identity(),
                        (a, b) -> a));

        Set<Integer> requestSessionIds = new HashSet<>();

        for (SessionDto sReq : sessionReqs) {
            if (sReq.getId() != null && existingSessionMap.containsKey(sReq.getId())) {
                CourseSession session = existingSessionMap.get(sReq.getId());
                requestSessionIds.add(session.getId());

                if (sReq.getSessionNo() != null) {
                    Integer newSessionNo = sReq.getSessionNo().intValue();
                    if (!newSessionNo.equals(session.getSessionNo() != null ? session.getSessionNo().intValue() : null)) {
                        CourseSession conflictingSession = existingSessionByNo.get(newSessionNo);
                        if (conflictingSession != null && !conflictingSession.getId().equals(session.getId())) {
                            throw new RuntimeException(
                                    String.format("Session number %d already exists for this group", sReq.getSessionNo()));
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
                Integer newSessionNo = sReq.getSessionNo() != null ? sReq.getSessionNo().intValue() : null;
                CourseSession existingByNo = existingSessionByNo.get(newSessionNo);

                if (existingByNo != null) {
                    requestSessionIds.add(existingByNo.getId());

                    existingByNo.setSessionDate(sReq.getSessionDate());
                    existingByNo.setStartTime(sReq.getStartTime());
                    existingByNo.setEndTime(sReq.getEndTime());
                    if (sReq.getSessionStatus() != null) {
                        existingByNo.setSessionStatus(SessionStatus.valueOf(sReq.getSessionStatus()));
                    }
                    sessionRepo.save(existingByNo);

                } else {
                    CourseSession newSession = new CourseSession();
                    newSession.setCourse(group.getCourse());
                    newSession.setCourseGroup(group);
                    newSession.setSessionNo(sReq.getSessionNo());
                    newSession.setSessionDate(sReq.getSessionDate());
                    newSession.setStartTime(sReq.getStartTime());
                    newSession.setEndTime(sReq.getEndTime());
                    newSession.setSessionStatus(
                            sReq.getSessionStatus() != null ? SessionStatus.valueOf(sReq.getSessionStatus())
                                    : SessionStatus.PLANNED);
                    sessionRepo.save(newSession);
                }
            }
        }

        for (CourseSession existingSession : existingSessions) {
            if (!requestSessionIds.contains(existingSession.getId())) {
                boolean sessionNoStillExists = sessionReqs.stream()
                        .anyMatch(s -> s.getSessionNo() != null &&
                                s.getSessionNo().equals(existingSession.getSessionNo()));

                if (!sessionNoStillExists) {
                    log.info("    🗑️ Deleting session ID: {} (No. {})", 
                        existingSession.getId(), existingSession.getSessionNo());
                    sessionRepo.delete(existingSession);
                }
            }
        }
        
        log.info("   Sessions updated for group '{}'", group.getGroupName());
    }

    // =========================================================
    // PRIVATE HELPERS - SELF-STUDY SESSIONS
    // =========================================================

    private void updateSelfStudySessions(Course course, List<SelfStudySessionDto> sessionRequests) {
        if (sessionRequests == null) {
            log.info("  ℹ️ No self-study session updates");
            return;
        }

        log.info("  📚 Updating {} self-study sessions", sessionRequests.size());

        List<SelfStudySession> existingSessions = selfStudyRepo.findByCourseIdOrderBySessionNoAsc(course.getId());

        Map<Integer, SelfStudySession> existingSessionById = existingSessions.stream()
                .collect(Collectors.toMap(SelfStudySession::getId, Function.identity(), (a, b) -> a));

        Map<Short, SelfStudySession> existingSessionByNo = existingSessions.stream()
                .collect(Collectors.toMap(
                        SelfStudySession::getSessionNo,
                        Function.identity(),
                        (a, b) -> a));

        Set<Integer> requestSessionIds = new HashSet<>();

        for (SelfStudySessionDto sReq : sessionRequests) {
            Short sessionNo = sReq.getSessionNo();
            if (sessionNo == null) {
                throw new RuntimeException("Session number is required");
            }

            long duplicateInRequest = sessionRequests.stream()
                    .filter(s -> sessionNo.equals(s.getSessionNo()))
                    .count();

            if (duplicateInRequest > 1) {
                throw new RuntimeException(
                        String.format("Duplicate session number '%d' found in the request", sessionNo));
            }

            SelfStudySession sessionToUpdate = null;

            if (sReq.getId() != null && existingSessionById.containsKey(sReq.getId())) {
                sessionToUpdate = existingSessionById.get(sReq.getId());
                requestSessionIds.add(sessionToUpdate.getId());
            } else if (existingSessionByNo.containsKey(sessionNo)) {
                sessionToUpdate = existingSessionByNo.get(sessionNo);
                requestSessionIds.add(sessionToUpdate.getId());
            }

            if (sessionToUpdate != null) {
                if (sReq.getFilePath() != null) {
                    sessionToUpdate.setFilepath(sReq.getFilePath());
                }
                if (sReq.getKanjiTarget() != null) {
                    sessionToUpdate.setKanjiTarget(sReq.getKanjiTarget());
                }
                if (sReq.getVocabularyTarget() != null) {
                    sessionToUpdate.setVocabularyTarget(sReq.getVocabularyTarget());
                }
                if (sReq.getGrammarTarget() != null) {
                    sessionToUpdate.setGrammarTarget(sReq.getGrammarTarget());
                }
                if (sReq.getReadingTargetMinutes() != null) {
                    sessionToUpdate.setReadingTargetMinutes(sReq.getReadingTargetMinutes());
                }
                if (sReq.getListeningTargetMinutes() != null) {
                    sessionToUpdate.setListeningTargetMinutes(sReq.getListeningTargetMinutes());
                }
                if (sReq.getDurationPerSession() != null) {
                    sessionToUpdate.setDurationPerSession(sReq.getDurationPerSession());
                }
                if (sReq.getSessionStatus() != null) {
                    sessionToUpdate.setSessionStatus(sReq.getSessionStatus());
                }
                if (!sessionNo.equals(sessionToUpdate.getSessionNo())) {
                    if (existingSessionByNo.containsKey(sessionNo) &&
                            !existingSessionByNo.get(sessionNo).getId().equals(sessionToUpdate.getId())) {
                        throw new RuntimeException(
                                String.format("Session number %d already exists for this course", sessionNo));
                    }
                    sessionToUpdate.setSessionNo(sessionNo);
                }
                sessionToUpdate.setUpdatedAt(LocalDateTime.now());
                selfStudyRepo.save(sessionToUpdate);

            } else {
                SelfStudySession newSession = new SelfStudySession();
                newSession.setCourse(course);
                newSession.setSessionNo(sReq.getSessionNo());
                newSession.setFilepath(sReq.getFilePath());
                newSession.setKanjiTarget(sReq.getKanjiTarget());
                newSession.setVocabularyTarget(sReq.getVocabularyTarget());
                newSession.setGrammarTarget(sReq.getGrammarTarget());
                newSession.setReadingTargetMinutes(sReq.getReadingTargetMinutes());
                newSession.setListeningTargetMinutes(sReq.getListeningTargetMinutes());
                newSession.setDurationPerSession(sReq.getDurationPerSession());
                newSession.setSessionStatus(sReq.getSessionStatus() != null ? sReq.getSessionStatus() : "PLANNED");
                newSession.setCreatedAt(LocalDateTime.now());
                newSession.setUpdatedAt(LocalDateTime.now());
                selfStudyRepo.save(newSession);
            }
        }

        for (SelfStudySession existingSession : existingSessions) {
            if (!requestSessionIds.contains(existingSession.getId())) {
                try {
                    log.info("    🗑️ Deleting self-study session ID: {} (No. {})", 
                        existingSession.getId(), existingSession.getSessionNo());
                    selfStudyRepo.delete(existingSession);
                } catch (Exception e) {
                    throw new RuntimeException(
                            String.format(
                                    "Cannot delete self-study session '%d' because it has associated progress records.",
                                    existingSession.getSessionNo()));
                }
            }
        }
        
        log.info("   Self-study sessions updated");
    }

    // =========================================================
    // PRIVATE HELPERS - DTO CONVERSIONS
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
                                    ? s.getSessionStatus().name()
                                    : null)
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
                        .durationPerSession(s.getDurationPerSession())
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
        log.debug("  💾 Saved group: '{}' (Capacity: {})", g.getGroupName(), g.getCapacity());
        return groupRepo.save(g);
    }

    private void saveSessionsForGroup(Course course, CourseGroup group, List<SessionDto> sessions) {
        if (sessions == null) {
            log.debug("  ℹ️ No sessions to save for group '{}'", group.getGroupName());
            return;
        }
        log.debug("  📋 Saving {} sessions for group '{}'", sessions.size(), group.getGroupName());
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

    private void saveSelfStudySessions(Course course, List<SelfStudySessionDto> dtos) {
        if (dtos == null)
            return;
        for (SelfStudySessionDto s : dtos) {
            SelfStudySession ss = new SelfStudySession();
            ss.setCourse(course);
            ss.setSessionNo(s.getSessionNo());
            ss.setFilepath(s.getFilePath());
            ss.setKanjiTarget(s.getKanjiTarget());
            ss.setVocabularyTarget(s.getVocabularyTarget());
            ss.setGrammarTarget(s.getGrammarTarget());
            ss.setReadingTargetMinutes(s.getReadingTargetMinutes());
            ss.setDurationPerSession(s.getDurationPerSession());
            ss.setListeningTargetMinutes(s.getListeningTargetMinutes());
            ss.setSessionStatus(s.getSessionStatus() != null ? s.getSessionStatus() : "PLANNED");
            ss.setCreatedAt(LocalDateTime.now());
            ss.setUpdatedAt(LocalDateTime.now());
            selfStudyRepo.save(ss);
        }
    }

    private SessionDto toSessionResponseDto(CourseSession session) {
        return SessionDto.builder()
                .id(session.getId())
                .sessionNo(session.getSessionNo())
                .sessionDate(session.getSessionDate())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .sessionStatus(session.getSessionStatus() != null ? session.getSessionStatus().name() : null)
                .build();
    }

    private Course findCourseOrThrow(Integer id) {
        return courseRepo.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));
    }

    private boolean isGroupNameTaken(String groupName, List<CourseGroup> existingGroups,
            List<GroupRequestDto> groupRequests) {
        boolean nameExists = existingGroups.stream()
                .anyMatch(g -> g.getGroupName().equals(groupName));

        if (!nameExists) {
            nameExists = groupRequests.stream()
                    .anyMatch(r -> r.getGroupName() != null && r.getGroupName().equals(groupName));
        }

        return nameExists;
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