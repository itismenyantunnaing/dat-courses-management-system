package com.dat_management.backend.service;

import com.dat_management.backend.dto.*;
import com.dat_management.backend.entity.*;
import com.dat_management.backend.entity.Course.CourseStatus;
import com.dat_management.backend.entity.CourseCategory.CourseType;
import com.dat_management.backend.entity.CourseGroup.GroupStatus;
import com.dat_management.backend.entity.CourseSession.SessionStatus;
import com.dat_management.backend.entity.Notification.NotificationType;
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

        
        CourseDto result = toCourseDto(courseRepo.findById(course.getId()).get(), false);
        notificationService.sendToAllActive(
                NotificationType.COURSE,
                "New course available",
                "A new course \"" + course.getCourseName() + "\" has been created. Please check the course details and enrollment deadline.",
                course.getId());

        return result;
    }

    // =========================================================
    // API 4 — PUT /api/courses/:id
    // =========================================================
    public CourseDto updateCourse(Integer id, CourseUpdateDto req) {
        Course course = findCourseOrThrow(id);

        // Update basic fields
        if (req.getCourseName() != null)
            course.setCourseName(req.getCourseName());
        if (req.getTrainerName() != null)
            course.setTrainerName(req.getTrainerName());
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
        if (req.getStatus() != null)
            course.setStatus(CourseStatus.valueOf(req.getStatus()));
        if (req.getCourseCategoryId() != null)
            course.setCourseCategory(findCategoryOrThrow(req.getCourseCategoryId()));

        course = courseRepo.save(course);

        // Handle groups update
        if (req.getGroups() != null && !req.getGroups().isEmpty()) {
            updateGroups(course, req.getGroups());
        }

        // Handle self-study sessions update
        if (req.getSelfStudySessions() != null) {
            updateSelfStudySessions(course, req.getSelfStudySessions());
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
        if (name != null && !name.isBlank())
            cat.setCourseCategoryName(name);
        if (type != null && !type.isBlank())
            cat.setCourseType(CourseType.valueOf(type));
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
    public Map<String, Object> updateSessionStatus(Integer courseId, Integer groupId, Integer sessionId,
            String sessionStatus) {
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
    // PRIVATE HELPERS - GROUP MANAGEMENT
    // =========================================================

    /**
     * Main group update logic:
     * 
     * Scenario 1: Auto-Creation (1 Group in Request)
     * - Condition: Exactly 1 group, current capacity in DB is NULL, new capacity
     * NOT NULL, enrollments > new capacity
     * - Action: Create additional groups with SAME capacity, distribute enrollments
     * evenly
     * 
     * Scenario 2: Multiple Groups (2+ Groups in Request)
     * - Condition: User sends 2+ groups
     * - Action: Update/Create groups, redistribute enrollments based on capacities,
     * delete groups not in request
     * 
     * Scenario 3: Delete Group (Group not in request)
     * - Condition: Group exists in DB but not in request
     * - Action: Move all enrollments to other groups based on capacities, delete
     * empty group
     */
    private void updateGroups(Course course, List<GroupRequestDto> groupRequests) {
        System.out.println("=== Starting updateGroups ===");
        System.out.println("Number of groups in request: " + groupRequests.size());

        // Get existing groups for this course
        List<CourseGroup> existingGroups = groupRepo.findByCourseIdOrderByGroupNameAsc(course.getId());

        System.out.println("Existing groups in DB (" + existingGroups.size() + "): " +
                existingGroups.stream().map(g -> g.getId() + ":" + g.getGroupName() +
                        "(cap:" + g.getCapacity() + ", enrollments:" + groupRepo.countEnrollmentsByGroupId(g.getId())
                        + ")")
                        .collect(Collectors.joining(", ")));

        // Create a map of group name -> existing group for easy lookup
        Map<String, CourseGroup> existingGroupByName = existingGroups.stream()
                .collect(Collectors.toMap(
                        CourseGroup::getGroupName,
                        Function.identity(),
                        (a, b) -> a));

        // Track which existing groups are still in the request
        Set<String> requestGroupNames = new HashSet<>();

        // =========================================================
        // Step 1: Process groups from the request (Update or Create)
        // This updates capacities FIRST before any redistribution
        // =========================================================
        for (GroupRequestDto gReq : groupRequests) {
            String groupName = gReq.getGroupName();
            if (groupName == null || groupName.trim().isEmpty()) {
                throw new RuntimeException("Group name is required");
            }

            // Check for duplicate group names within the request itself
            long duplicateInRequest = groupRequests.stream()
                    .filter(r -> groupName.equals(r.getGroupName()))
                    .count();

            if (duplicateInRequest > 1) {
                throw new RuntimeException(
                        String.format("Duplicate group name '%s' found in the request", groupName));
            }

            requestGroupNames.add(groupName);

            // Check if this group name already exists in the course
            if (existingGroupByName.containsKey(groupName)) {
                // EXISTING GROUP - Update it (capacity is updated here FIRST)
                CourseGroup group = existingGroupByName.get(groupName);
                System.out.println("Updating existing group: " + groupName + " (ID: " + group.getId() + ")");

                Integer oldCapacity = group.getCapacity();
                Integer newCapacity = gReq.getCapacity();
                System.out.println("  Old capacity: " + oldCapacity + ", New capacity: " + newCapacity);

                // Update group basic info
                group.setCapacity(newCapacity);
                if (gReq.getGroupStatus() != null) {
                    group.setGroupStatus(GroupStatus.valueOf(gReq.getGroupStatus()));
                }
                group = groupRepo.save(group);

                // Update sessions for this group
                updateSessionsForGroup(group, gReq.getSessions());

            } else {
                // NEW GROUP - Create it
                System.out.println(
                        "Creating new group from request: " + groupName + " with capacity: " + gReq.getCapacity());
                CourseGroup group = saveGroup(course, gReq);
                saveSessionsForGroup(course, group, gReq.getSessions());
                existingGroups.add(group);
                System.out.println("  Created group with ID: " + group.getId());
            }
        }

        // =========================================================
        // Step 2: Check for Auto-Creation (Only when exactly 1 group in request)
        // Auto-creation creates new groups with capacities
        // IMPORTANT: This MUST happen BEFORE redistribution
        // =========================================================
        Set<String> autoCreatedGroupNames = new HashSet<>();

        if (groupRequests.size() == 1) {
            System.out.println("Only 1 group in request. Checking if auto-creation needed...");
            autoCreatedGroupNames = handleAutoCreation(course, groupRequests, existingGroups);
            System.out.println("Auto-created groups: " + autoCreatedGroupNames);
        }

        // =========================================================
        // Step 3: Redistribute enrollments based on updated capacities
        // Now all groups (including auto-created ones) have been created
        // =========================================================
        // Check if there's any group with NULL capacity
        boolean hasUnlimited = existingGroups.stream().anyMatch(g -> g.getCapacity() == null);

        if (!hasUnlimited) {
            System.out.println("Redistributing enrollments based on updated capacities...");
            redistributeEnrollmentsBasedOnCapacities(course, existingGroups, groupRequests);
        } else {
            System.out.println("Found group with NULL capacity. Skipping redistribution.");
        }

        // =========================================================
        // Step 4: Delete groups that are not in the request
        // IMPORTANT: Do NOT delete auto-created groups
        // =========================================================
        System.out.println("Checking for groups to delete...");
        List<CourseGroup> groupsToDelete = new ArrayList<>();

        for (CourseGroup existingGroup : existingGroups) {
            // Skip auto-created groups - they should be kept
            if (autoCreatedGroupNames.contains(existingGroup.getGroupName())) {
                System.out.println("  Keeping auto-created group: " + existingGroup.getGroupName());
                continue;
            }

            if (!requestGroupNames.contains(existingGroup.getGroupName())) {
                long enrollmentCount = groupRepo.countEnrollmentsByGroupId(existingGroup.getId());
                System.out.println("  Group " + existingGroup.getGroupName() + " (ID: " + existingGroup.getId() +
                        ") not in request. Enrollments: " + enrollmentCount);

                if (enrollmentCount == 0) {
                    // Safe to delete - no enrollments
                    groupsToDelete.add(existingGroup);
                } else {
                    // This group has enrollments but is not in the request
                    // Move enrollments to available groups (capacities are already updated)
                    System.out.println("    Moving " + enrollmentCount + " enrollments to other groups...");
                    moveEnrollmentsToAvailableGroups(existingGroup, existingGroups);
                    groupsToDelete.add(existingGroup);
                }
            }
        }

        // Delete groups
        for (CourseGroup groupToDelete : groupsToDelete) {
            System.out.println(
                    "  Deleting group: " + groupToDelete.getGroupName() + " (ID: " + groupToDelete.getId() + ")");
            sessionRepo.deleteByCourseGroupId(groupToDelete.getId());
            groupRepo.delete(groupToDelete);
        }

        System.out.println("=== Finished updateGroups ===");
    }

    /**
     * Auto-creation logic: Only called when exactly 1 group is in the request
     * Condition: Current capacity in DB is NULL, new capacity NOT NULL, enrollments
     * > new capacity
     */
    private Set<String> handleAutoCreation(Course course, List<GroupRequestDto> groupRequests,
            List<CourseGroup> existingGroups) {
        Set<String> autoCreatedGroupNames = new HashSet<>();

        // Get the first (and only) group from the request
        GroupRequestDto firstGroup = groupRequests.get(0);

        // Find the existing group
        CourseGroup mainGroup = existingGroups.stream()
                .filter(g -> g.getGroupName().equals(firstGroup.getGroupName()))
                .findFirst()
                .orElse(null);

        if (mainGroup == null) {
            System.out.println("Main group not found in existing groups. Skipping auto-creation.");
            return autoCreatedGroupNames;
        }

        // Get enrollments for the main group
        List<CourseEnrollment> enrollments = enrollmentRepo.findByCourseGroupIdOrderByEnrolledAtAsc(mainGroup.getId());
        int enrollmentCount = enrollments.size();

        // Check conditions for auto-creation
        Integer currentCapacity = mainGroup.getCapacity(); // Capacity in DB (already updated)

        System.out.println("Auto-creation check for group: " + mainGroup.getGroupName());
        System.out.println("  Current capacity: " + currentCapacity);
        System.out.println("  Enrollments: " + enrollmentCount);

        // Auto-creation happens when:
        // 1. Capacity is NOT null
        // 2. Enrollments > capacity
        if (currentCapacity == null) {
            System.out.println("  Capacity is NULL (unlimited). No auto-creation needed.");
            return autoCreatedGroupNames;
        }

        if (enrollmentCount <= currentCapacity) {
            System.out.println("  All enrollments fit within capacity. No auto-creation needed.");
            return autoCreatedGroupNames;
        }

        // Need to create additional groups
        int remainingEnrollments = enrollmentCount - currentCapacity;
        int groupsNeeded = (int) Math.ceil((double) remainingEnrollments / currentCapacity);
        System.out.println("  Need to create " + groupsNeeded + " additional groups with capacity " + currentCapacity);

        // Create additional groups with SAME capacity as the original group
        int baseNumber = existingGroups.size() + 1;

        for (int i = 0; i < groupsNeeded; i++) {
            String groupName = "Group " + (baseNumber + i);

            // Ensure unique group name
            while (isGroupNameTaken(groupName, existingGroups, groupRequests)) {
                groupName = "Group " + (baseNumber + i) + "_" + System.currentTimeMillis();
            }

            // Create new group with SAME capacity as the original group
            CourseGroup newGroup = new CourseGroup();
            newGroup.setCourse(course);
            newGroup.setGroupName(groupName);
            newGroup.setCapacity(currentCapacity);
            newGroup.setGroupStatus(GroupStatus.OPEN);
            newGroup = groupRepo.save(newGroup);
            System.out.println("  Auto-created group: " + groupName + " (ID: " + newGroup.getId() + ", capacity: "
                    + currentCapacity + ")");

            // Copy sessions from the main group
            copySessionsFromGroup(course, newGroup, mainGroup);

            // Add to existing groups list
            existingGroups.add(newGroup);

            // Track auto-created group name
            autoCreatedGroupNames.add(groupName);
        }

        return autoCreatedGroupNames;
    }

    /**
     * Redistributes enrollments based on group capacities
     * This handles distribution across all groups
     */
    private void redistributeEnrollmentsBasedOnCapacities(Course course, List<CourseGroup> groups,
            List<GroupRequestDto> groupRequests) {
        System.out.println("=== Redistributing enrollments based on capacities ===");

        // Get all enrollments for this course
        List<CourseEnrollment> allEnrollments = enrollmentRepo.findByCourseId(course.getId());

        if (allEnrollments.isEmpty()) {
            System.out.println("No enrollments to redistribute");
            return;
        }

        System.out.println("Total enrollments: " + allEnrollments.size());

        // Check if any group has NULL capacity (unlimited)
        boolean hasUnlimited = groups.stream().anyMatch(g -> g.getCapacity() == null);

        if (hasUnlimited) {
            System.out.println("Found group with NULL capacity (unlimited). No redistribution needed.");
            return;
        }

        // If we reach here, all groups have finite capacities
        // Calculate total capacity
        int totalCapacity = groups.stream()
                .filter(g -> g.getCapacity() != null)
                .mapToInt(CourseGroup::getCapacity)
                .sum();

        System.out.println("Total capacity: " + totalCapacity);

        if (totalCapacity < allEnrollments.size()) {
            throw new RuntimeException(
                    String.format("Total capacity (%d) is less than total enrollments (%d). " +
                            "Please increase capacity or add more groups.",
                            totalCapacity, allEnrollments.size()));
        }

        // Group enrollments by their current group
        Map<Integer, List<CourseEnrollment>> enrollmentsByGroup = new HashMap<>();
        for (CourseEnrollment enrollment : allEnrollments) {
            Integer groupId = enrollment.getCourseGroup().getId();
            enrollmentsByGroup.computeIfAbsent(groupId, k -> new ArrayList<>()).add(enrollment);
        }

        // Print current distribution
        for (Map.Entry<Integer, List<CourseEnrollment>> entry : enrollmentsByGroup.entrySet()) {
            CourseGroup group = groups.stream().filter(g -> g.getId().equals(entry.getKey())).findFirst().orElse(null);
            System.out.println("  Current: Group " + (group != null ? group.getGroupName() : "Unknown") +
                    " has " + entry.getValue().size() + " enrollments (capacity: "
                    + (group != null ? group.getCapacity() : "N/A") + ")");
        }

        // Build capacity map
        Map<Integer, Integer> groupCapacities = new HashMap<>();
        Map<Integer, String> groupNames = new HashMap<>();

        for (CourseGroup group : groups) {
            groupNames.put(group.getId(), group.getGroupName());
            if (group.getCapacity() != null) {
                groupCapacities.put(group.getId(), group.getCapacity());
            }
        }

        // Redistribute enrollments
        List<CourseEnrollment> allEnrollmentsList = new ArrayList<>(allEnrollments);
        Collections.sort(allEnrollmentsList, Comparator.comparing(CourseEnrollment::getEnrolledAt));

        int enrollmentIndex = 0;
        for (CourseGroup group : groups) {
            if (group.getCapacity() == null)
                continue;

            int capacity = group.getCapacity();
            List<CourseEnrollment> groupEnrollments = new ArrayList<>();

            // Get existing enrollments for this group
            List<CourseEnrollment> existing = enrollmentsByGroup.getOrDefault(group.getId(), new ArrayList<>());

            // Keep existing enrollments if they fit within capacity
            int keepCount = Math.min(existing.size(), capacity);
            for (int i = 0; i < keepCount && i < existing.size(); i++) {
                groupEnrollments.add(existing.get(i));
            }

            // Fill remaining capacity with other enrollments
            int remainingCapacity = capacity - groupEnrollments.size();
            while (remainingCapacity > 0 && enrollmentIndex < allEnrollmentsList.size()) {
                CourseEnrollment enrollment = allEnrollmentsList.get(enrollmentIndex);
                // Skip enrollments already assigned
                if (!isEnrollmentAlreadyAssigned(enrollment, groupEnrollments)) {
                    groupEnrollments.add(enrollment);
                    remainingCapacity--;
                }
                enrollmentIndex++;
            }

            // Update enrollments for this group
            for (CourseEnrollment enrollment : groupEnrollments) {
                if (!enrollment.getCourseGroup().getId().equals(group.getId())) {
                    enrollment.setCourseGroup(group);
                    enrollmentRepo.save(enrollment);
                    System.out
                            .println("  Moved enrollment " + enrollment.getId() + " to group " + group.getGroupName());
                }
            }
        }

        // Check if all enrollments are assigned
        int assignedCount = 0;
        for (CourseGroup group : groups) {
            if (group.getCapacity() != null) {
                assignedCount += groupRepo.countEnrollmentsByGroupId(group.getId());
            }
        }

        if (assignedCount < allEnrollments.size()) {
            System.out.println("WARNING: Not all enrollments could be assigned. Unassigned: " +
                    (allEnrollments.size() - assignedCount));
        }
    }

    /**
     * Checks if an enrollment is already assigned to a group
     */
    private boolean isEnrollmentAlreadyAssigned(CourseEnrollment enrollment, List<CourseEnrollment> assigned) {
        return assigned.stream().anyMatch(e -> e.getId().equals(enrollment.getId()));
    }

    /**
     * Moves enrollments from a group to available groups
     * This is called when a group is being deleted (not in request)
     */
    private void moveEnrollmentsToAvailableGroups(CourseGroup sourceGroup, List<CourseGroup> allGroups) {
        List<CourseEnrollment> enrollments = enrollmentRepo.findByCourseGroupId(sourceGroup.getId());

        if (enrollments.isEmpty()) {
            return;
        }

        // Find groups with available capacity (capacities are already updated)
        List<CourseGroup> availableGroups = new ArrayList<>();
        for (CourseGroup group : allGroups) {
            if (group.getId().equals(sourceGroup.getId()))
                continue;
            if (group.getCapacity() == null) {
                availableGroups.add(group);
            } else {
                long currentEnrollments = groupRepo.countEnrollmentsByGroupId(group.getId());
                if (currentEnrollments < group.getCapacity()) {
                    availableGroups.add(group);
                }
            }
        }

        if (availableGroups.isEmpty()) {
            throw new RuntimeException(
                    "Cannot move enrollments from group " + sourceGroup.getGroupName() +
                            " - no available groups with capacity. Please check your capacity settings.");
        }

        // Sort available groups by capacity (largest first, unlimited first)
        availableGroups.sort((g1, g2) -> {
            if (g1.getCapacity() == null)
                return -1;
            if (g2.getCapacity() == null)
                return 1;
            return g2.getCapacity().compareTo(g1.getCapacity());
        });

        int enrollmentIndex = 0;
        for (CourseGroup targetGroup : availableGroups) {
            long currentEnrollments = groupRepo.countEnrollmentsByGroupId(targetGroup.getId());
            int availableCapacity = targetGroup.getCapacity() == null ? Integer.MAX_VALUE
                    : targetGroup.getCapacity() - (int) currentEnrollments;

            int toMove = Math.min(availableCapacity, enrollments.size() - enrollmentIndex);

            for (int i = 0; i < toMove && enrollmentIndex < enrollments.size(); i++) {
                CourseEnrollment enrollment = enrollments.get(enrollmentIndex);
                enrollment.setCourseGroup(targetGroup);
                enrollmentRepo.save(enrollment);
                System.out.println("    Moved enrollment " + enrollment.getId() +
                        " from " + sourceGroup.getGroupName() + " to " + targetGroup.getGroupName());
                enrollmentIndex++;
            }

            if (enrollmentIndex >= enrollments.size()) {
                break;
            }
        }

        if (enrollmentIndex < enrollments.size()) {
            throw new RuntimeException(
                    String.format("Could not move all enrollments from group %s. %d enrollments remain. " +
                            "Please increase capacity of other groups.",
                            sourceGroup.getGroupName(), enrollments.size() - enrollmentIndex));
        }
    }

    /**
     * Copies sessions from a source group to a target group
     */
    private void copySessionsFromGroup(Course course, CourseGroup targetGroup, CourseGroup sourceGroup) {
        if (sourceGroup == null)
            return;

        List<CourseSession> sourceSessions = sessionRepo.findByCourseGroupIdOrderBySessionNoAsc(sourceGroup.getId());
        if (!sourceSessions.isEmpty()) {
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
    }

    /**
     * Updates sessions for a group - handles add/update/delete incrementally
     */
    private void updateSessionsForGroup(CourseGroup group, List<SessionDto> sessionReqs) {
        if (sessionReqs == null)
            return;

        // Get existing sessions for this group
        List<CourseSession> existingSessions = sessionRepo.findByCourseGroupIdOrderBySessionNoAsc(group.getId());

        // Map existing sessions by ID for easy lookup
        Map<Integer, CourseSession> existingSessionMap = existingSessions.stream()
                .collect(Collectors.toMap(CourseSession::getId, Function.identity()));

        // Map existing sessions by session number for duplicate checking
        Map<Integer, CourseSession> existingSessionByNo = existingSessions.stream()
                .filter(s -> s.getSessionNo() != null)
                .collect(Collectors.toMap(
                        s -> s.getSessionNo().intValue(),
                        Function.identity(),
                        (a, b) -> a));

        // Track which sessions from the request are processed
        Set<Integer> requestSessionIds = new HashSet<>();

        for (SessionDto sReq : sessionReqs) {
            if (sReq.getId() != null && existingSessionMap.containsKey(sReq.getId())) {
                // === UPDATE EXISTING SESSION ===
                CourseSession session = existingSessionMap.get(sReq.getId());
                requestSessionIds.add(session.getId());

                // Update session fields
                if (sReq.getSessionNo() != null) {
                    Integer newSessionNo = sReq.getSessionNo().intValue();
                    if (!newSessionNo
                            .equals(session.getSessionNo() != null ? session.getSessionNo().intValue() : null)) {
                        CourseSession conflictingSession = existingSessionByNo.get(newSessionNo);
                        if (conflictingSession != null && !conflictingSession.getId().equals(session.getId())) {
                            throw new RuntimeException(
                                    String.format("Session number %d already exists for this group",
                                            sReq.getSessionNo()));
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

        // === DELETE SESSIONS NO LONGER IN REQUEST ===
        for (CourseSession existingSession : existingSessions) {
            if (!requestSessionIds.contains(existingSession.getId())) {
                boolean sessionNoStillExists = sessionReqs.stream()
                        .anyMatch(s -> s.getSessionNo() != null &&
                                s.getSessionNo().equals(existingSession.getSessionNo()));

                if (!sessionNoStillExists) {
                    sessionRepo.delete(existingSession);
                }
            }
        }
    }

    /**
     * Updates self-study sessions by matching on id or session_no
     */
    private void updateSelfStudySessions(Course course, List<SelfStudySessionDto> sessionRequests) {
        if (sessionRequests == null)
            return;

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
                    selfStudyRepo.delete(existingSession);
                } catch (Exception e) {
                    throw new RuntimeException(
                            String.format(
                                    "Cannot delete self-study session '%d' because it has associated progress records.",
                                    existingSession.getSessionNo()));
                }
            }
        }
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
        return groupRepo.save(g);
    }

    private void saveSessionsForGroup(Course course, CourseGroup group, List<SessionDto> sessions) {
        if (sessions == null)
            return;
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