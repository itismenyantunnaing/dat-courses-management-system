package com.dat_management.backend.service;

import com.dat_management.backend.dto.CategoryDto;
import com.dat_management.backend.dto.CourseDto;
import com.dat_management.backend.dto.CourseRequestDto;
import com.dat_management.backend.dto.GroupRequestDto;
import com.dat_management.backend.dto.SessionDto;
import com.dat_management.backend.entity.Course;
import com.dat_management.backend.entity.Course.CourseStatus;
import com.dat_management.backend.entity.CourseCategory;
import com.dat_management.backend.entity.CourseCategory.CourseType;
import com.dat_management.backend.entity.CourseGroup;
import com.dat_management.backend.entity.CourseGroup.GroupStatus;
import com.dat_management.backend.entity.CourseSession;
import com.dat_management.backend.repository.CourseCategoryRepository;
import com.dat_management.backend.repository.CourseEnrollmentRepository;
import com.dat_management.backend.repository.CourseGroupRepository;
import com.dat_management.backend.repository.CourseRepository;
import com.dat_management.backend.repository.CourseSessionRepository;
import com.dat_management.backend.repository.SelfStudySessionRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseCategoryRepository categoryRepo;

    @Mock
    private CourseRepository courseRepo;

    @Mock
    private CourseGroupRepository groupRepo;

    @Mock
    private CourseSessionRepository sessionRepo;

    @Mock
    private CourseEnrollmentRepository enrollmentRepo;

    @Mock
    private SelfStudySessionRepository selfStudyRepo;

    @Mock
    private CourseImageStorageService imageStorageService;

    @Test
    void createCategory_validTrainerCategory_savesActiveCategory() {
        CourseService service = service();
        CourseCategory saved = category(1, "JLPT Exam Target Course", CourseType.TRAINER_PROVIDED);

        when(categoryRepo.save(any(CourseCategory.class))).thenReturn(saved);

        CategoryDto result = service.createCategory("JLPT Exam Target Course", "TRAINER_PROVIDED");

        Assertions.assertEquals(1, result.getId());
        Assertions.assertEquals("JLPT Exam Target Course", result.getCourseCategoryName());
        Assertions.assertEquals("TRAINER_PROVIDED", result.getCourseType());
        Assertions.assertFalse(result.getIsDeleted());
    }

    @Test
    void createCourse_trainerCourse_savesGroupAndSessions() {
        CourseService service = service();
        CourseCategory category = category(1, "Trainer Course", CourseType.TRAINER_PROVIDED);
        List<CourseGroup> savedGroups = new ArrayList<>();
        List<CourseSession> savedSessions = new ArrayList<>();

        when(categoryRepo.findById(1)).thenReturn(Optional.of(category));
        when(courseRepo.save(any(Course.class))).thenAnswer(invocation -> {
            Course course = invocation.getArgument(0);
            course.setId(100);
            return course;
        });
        when(groupRepo.save(any(CourseGroup.class))).thenAnswer(invocation -> {
            CourseGroup group = invocation.getArgument(0);
            group.setId(10);
            savedGroups.add(group);
            return group;
        });
        when(sessionRepo.save(any(CourseSession.class))).thenAnswer(invocation -> {
            CourseSession session = invocation.getArgument(0);
            session.setId(savedSessions.size() + 1);
            savedSessions.add(session);
            return session;
        });
        when(courseRepo.findById(100)).thenAnswer(invocation -> Optional.of(savedGroups.get(0).getCourse()));
        when(groupRepo.findByCourseIdOrderByGroupNameAsc(100)).thenReturn(savedGroups);
        when(sessionRepo.findByCourseGroupIdOrderBySessionNoAsc(10)).thenReturn(savedSessions);
        when(groupRepo.countEnrollmentsByGroupId(10)).thenReturn(0L);
        when(selfStudyRepo.findByCourseIdOrderBySessionNoAsc(100)).thenReturn(List.of());

        CourseDto result = service.createCourse(trainerCourseRequest(), null);

        Assertions.assertEquals(100, result.getId());
        Assertions.assertEquals("JLPT N2 Trainer", result.getCourseName());
        Assertions.assertEquals("OPEN", result.getStatus());
        Assertions.assertEquals(1, result.getGroups().size());
        Assertions.assertEquals(2, result.getGroups().get(0).getSessions().size());
        Assertions.assertEquals("G1", result.getGroups().get(0).getGroupName());
    }

    @Test
    void deleteCourse_withImage_softDeletesCourseAndDeletesImage() throws IOException {
        CourseService service = service();
        Course course = course(100, category(1, "Trainer Course", CourseType.TRAINER_PROVIDED));
        course.setImagePath("uploads/courses/course_100.png");

        when(courseRepo.findByIdAndIsDeletedFalse(100)).thenReturn(Optional.of(course));
        when(courseRepo.save(course)).thenReturn(course);

        service.deleteCourse(100);

        Assertions.assertTrue(course.getIsDeleted());
        Assertions.assertNull(course.getImagePath());
        verify(imageStorageService).deleteImage("uploads/courses/course_100.png");
        verify(courseRepo).save(course);
    }

    @Test
    void updateSessionStatus_validStatus_updatesSessionStatus() {
        CourseService service = service();
        CourseSession session = new CourseSession();
        session.setId(77);
        session.setSessionDate(LocalDate.of(2026, 7, 20));
        session.setSessionStatus(CourseSession.SessionStatus.PLANNED);

        when(sessionRepo.findById(77)).thenReturn(Optional.of(session));
        when(sessionRepo.save(session)).thenReturn(session);

        var result = service.updateSessionStatus(100, 10, 77, "FINISHED");

        Assertions.assertEquals("FINISHED", result.get("session_status"));
        Assertions.assertEquals(CourseSession.SessionStatus.FINISHED, session.getSessionStatus());
    }

    private CourseService service() {
        return new CourseService(
                categoryRepo,
                courseRepo,
                groupRepo,
                sessionRepo,
                enrollmentRepo,
                selfStudyRepo,
                imageStorageService);
    }

    private static CourseRequestDto trainerCourseRequest() {
        return CourseRequestDto.builder()
                .courseName("JLPT N2 Trainer")
                .trainerName("Tanaka")
                .courseCategoryId(1)
                .targetLevel("N2")
                .totalSessions((short) 2)
                .registrationDeadline(LocalDate.of(2026, 7, 31))
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 8, 8))
                .status("OPEN")
                .groups(List.of(GroupRequestDto.builder()
                        .groupName("G1")
                        .capacity(20)
                        .groupStatus("OPEN")
                        .sessions(List.of(
                                SessionDto.builder()
                                        .sessionNo((short) 1)
                                        .sessionDate(LocalDate.of(2026, 8, 1))
                                        .startTime(LocalTime.of(9, 0))
                                        .endTime(LocalTime.of(10, 0))
                                        .sessionStatus("PLANNED")
                                        .build(),
                                SessionDto.builder()
                                        .sessionNo((short) 2)
                                        .sessionDate(LocalDate.of(2026, 8, 8))
                                        .startTime(LocalTime.of(9, 0))
                                        .endTime(LocalTime.of(10, 0))
                                        .sessionStatus("PLANNED")
                                        .build()))
                        .build()))
                .build();
    }

    private static CourseCategory category(Integer id, String name, CourseType type) {
        CourseCategory category = new CourseCategory();
        category.setId(id);
        category.setCourseCategoryName(name);
        category.setCourseType(type);
        category.setIsDeleted(false);
        return category;
    }

    private static Course course(Integer id, CourseCategory category) {
        Course course = new Course();
        course.setId(id);
        course.setCourseCategory(category);
        course.setCourseName("JLPT N2 Trainer");
        course.setStatus(CourseStatus.OPEN);
        course.setIsDeleted(false);
        return course;
    }
}
