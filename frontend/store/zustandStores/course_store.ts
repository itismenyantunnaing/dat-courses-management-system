// store/zustandStores/course_store.ts
import {
  Course,
  CourseGroup,
  CourseSession,
  BackendCourseDto,
  BackendGroupDto,
  BackendSessionDto,
  BackendSelfStudySessionDto,
} from "@/types/course"
import type { Course_StoreType } from "../types"
import { courseCategoryStore } from "./course/course_category_store"
import { courseEnrollmentStore } from "./course/course_enrollment_store"
import { courseSelfStudyProgressStore } from "./course/course_selfStudy_progress_store"
import { courseAttendanceStore } from "./course/course_attendance_store"
import { groupChangeStore } from "./course/course_groupChange_store"

type StoreSet = (
  fn: (state: Course_StoreType) => Partial<Course_StoreType>
) => void
type StoreGet = () => Course_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// ========== DATE HELPER FUNCTIONS ==========
// Format a date as YYYY-MM-DD in local timezone (no timezone conversion)
const formatLocalDate = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse a date string as local date (no timezone conversion)
const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    // Parse as local date (year, month-1, day) to avoid timezone issues
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(dateStr);
};

// Check if a value is a valid Date object
const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Define the course store as a function that takes set and get
export const courseStore = (set: StoreSet, get: StoreGet) => ({
  // ========== INITIAL STATE ==========
  courses: [],
  error: null,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  courseCategory_data: {
    trainer: [],
    selfStudy: []
  },

  // ========== UI STATE ==========
  isFormVisible: false,
  editingCourse: null,

  // ========== HELPER FUNCTIONS ==========

  // Helper to get auth headers
  getAuthHeaders: () => {
    const state = get()
    const token = state.getToken ? state.getToken() : null

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  },

  // Helper to get multipart auth headers (for file upload)
  getMultipartAuthHeaders: () => {
    const state = get()
    const token = state.getToken ? state.getToken() : null

    const headers: HeadersInit = {}

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  },

  // Helper to transform backend course to frontend Course type
  transformBackendCourseToFrontend: (course: BackendCourseDto): Course => {
    const courseType = course.category?.course_type === 'SELF_STUDY' ? 'self-study' : 'trainer'

    // Map groups
    const groups: CourseGroup[] = (course.groups || []).map((g: BackendGroupDto) => {
      const groupSessions: CourseSession[] = (g.sessions || []).map((s: BackendSessionDto) => ({
        id: s.id?.toString() || '',
        sessionNo: s.session_no,
        date: s.session_date ? parseLocalDate(s.session_date) : new Date(),
        startTime: s.start_time,
        endTime: s.end_time,
        status: s.session_status,
      }))

      const firstSession = groupSessions[0]
      const startTime = firstSession?.startTime || "09:00"
      const endTime = firstSession?.endTime || "10:00"
      const sessionsPerWeek = Array.from(new Set(groupSessions.map(s => s.date.getDay())))

      return {
        id: g.id?.toString() || '',
        name: g.group_name || '',
        capacity: g.capacity === null ? 'unlimited' : g.capacity,
        status: g.group_status,
        startDate: groupSessions.length > 0 ? groupSessions[0].date : new Date(),
        endDate: groupSessions.length > 0 ? groupSessions[groupSessions.length - 1].date : undefined,
        startTime,
        endTime,
        sessionsPerWeek,
        sessions: groupSessions,
        registeredCount: g.registered_count || 0,
        createdAt: g.created_at ? parseLocalDate(g.created_at.split('T')[0]) : undefined,
      }
    })

    // Map self-study sessions
    const sessions: CourseSession[] = (course.self_study_sessions || []).map((s: BackendSelfStudySessionDto, index: number) => ({
      id: s.id?.toString() || `s-${index}`,
      sessionNo: s.session_no || index + 1,
      date: s.session_date ? parseLocalDate(s.session_date) : undefined as any,
      durationPerSession: s.duration_per_session || 7,
      kanjiCount: s.kanji_target || 0,
      vocabularyCount: s.vocabulary_target || 0,
      grammarCount: s.grammar_target || 0,
      readingMinutes: s.reading_target_minutes || 0,
      listeningMinutes: s.listening_target_minutes || 0,
      studyTimeTargetMinutes: s.study_time_target_minutes || 0,
      link: s.file_path || s.filepath || '',
      status: s.session_status,
    }))

    let calculatedDaysPerSession: number | undefined = course.session_per_days;

    // ✅ IMPROVED: Get category ID from multiple possible sources
    const categoryId = course.category?.id ||
      course.course_category_id ||
      (course.category as any)?.courseCategoryId ||
      undefined;

    // Get the category name
    const categoryName = course.category?.course_category_name || '';

    // Get the category value (for display)
    const categoryValue = categoryName.toLowerCase().replace(/\s+/g, '-');

    // If there's a categoryId but no category name, try to find it from the store
    // The store might have loaded categories separately

    const statusMap: Record<string, string> = {
      'DRAFT': 'draft',
      'OPEN': 'active',
      'CLOSED': 'upcoming',
      'COMPLETED': 'completed'
    }
    const status = statusMap[course.status] || course.status?.toLowerCase() || ''

    return {
      id: course.id?.toString() || '',
      title: course.course_name || '',
      trainerName: course.trainer_name || '',
      imageUrl: course.image_path || '',
      courseType: courseType,
      categoryId: categoryId,
      category: categoryValue,
      targetLevel: course.target_level,
      totalSessions: course.total_sessions,
      startDate: course.start_date ? parseLocalDate(course.start_date) : undefined,
      endDate: course.end_date ? parseLocalDate(course.end_date) : undefined,
      status: status as "active" | "upcoming" | "completed" | "draft",
      registrationDeadline: course.registration_deadline ? parseLocalDate(course.registration_deadline) : undefined,
      createdAt: course.created_at ? parseLocalDate(course.created_at.split('T')[0]) : new Date(),
      updatedAt: course.updated_at ? parseLocalDate(course.updated_at.split('T')[0]) : new Date(),
      groups: groups,
      self_study_sessions: sessions,
      daysPerSession: calculatedDaysPerSession,
      mentionedLearners: [],
      selfStudyType: course.self_study_type || (categoryName.toLowerCase().includes('jlpt') ? 'jlpt' : 'other'),
      totalKanji: course.self_study_sessions?.reduce((sum: number, s: BackendSelfStudySessionDto) => sum + (s.kanji_target || 0), 0) || 0,
      totalVocabulary: course.self_study_sessions?.reduce((sum: number, s: BackendSelfStudySessionDto) => sum + (s.vocabulary_target || 0), 0) || 0,
      totalGrammar: course.self_study_sessions?.reduce((sum: number, s: BackendSelfStudySessionDto) => sum + (s.grammar_target || 0), 0) || 0,
      totalReadingMinutes: course.self_study_sessions?.reduce((sum: number, s: BackendSelfStudySessionDto) => sum + (s.reading_target_minutes || 0), 0) || 0,
      totalListeningMinutes: course.self_study_sessions?.reduce((sum: number, s: BackendSelfStudySessionDto) => sum + (s.listening_target_minutes || 0), 0) || 0,
      isDeleted: course.is_deleted,
    }
  },

  // Helper to transform frontend Course to backend request format
  transformFrontendToBackendRequest: (course: Partial<Course> | any): any => {
    const request: any = {}

    // Handle both frontend and backend formats
    if (course.title !== undefined) request.course_name = course.title
    else if (course.course_name !== undefined) request.course_name = course.course_name

    if (course.trainerName !== undefined) request.trainer_name = course.trainerName
    else if (course.trainer_name !== undefined) request.trainer_name = course.trainer_name

    if (course.selfStudyType !== undefined) request.self_study_type = course.selfStudyType
    else if (course.self_study_type !== undefined) request.self_study_type = course.self_study_type

    if (course.categoryId !== undefined) request.course_category_id = course.categoryId
    else if (course.course_category_id !== undefined) request.course_category_id = course.course_category_id

    if (course.targetLevel !== undefined) request.target_level = course.targetLevel
    else if (course.target_level !== undefined) request.target_level = course.target_level

    if (course.totalSessions !== undefined) request.total_sessions = course.totalSessions
    else if (course.total_sessions !== undefined) request.total_sessions = course.total_sessions

    // Fix date fields - use formatLocalDate for proper local date handling
    if (course.startDate !== undefined) {
      request.start_date = isValidDate(course.startDate)
        ? formatLocalDate(course.startDate)
        : course.startDate
    } else if (course.start_date !== undefined) {
      request.start_date = course.start_date
    }

    if (course.endDate !== undefined) {
      request.end_date = isValidDate(course.endDate)
        ? formatLocalDate(course.endDate)
        : course.endDate
    } else if (course.end_date !== undefined) {
      request.end_date = course.end_date
    }

    if (course.registrationDeadline !== undefined) {
      request.registration_deadline = isValidDate(course.registrationDeadline)
        ? formatLocalDate(course.registrationDeadline)
        : course.registrationDeadline
    } else if (course.registration_deadline !== undefined) {
      request.registration_deadline = course.registration_deadline
    }

    if (course.session_per_days !== undefined) request.session_per_days = course.session_per_days

    if (course.status !== undefined) {
      const statusMap: Record<string, string> = {
        'active': 'OPEN',
        'upcoming': 'CLOSED',
        'completed': 'COMPLETED',
        'draft': 'DRAFT'
      }
      request.status = statusMap[course.status] || course.status.toUpperCase()
    }

    // Handle groups - with proper date formatting
    if (course.groups !== undefined) {
      const isValidGroup = (group: any) => {
        if (group.group_name !== undefined) {
          return group.group_name && group.group_name.trim() !== '';
        }
        if (group.name !== undefined) {
          return group.name && group.name.trim() !== '';
        }
        return false;
      };

      const getGroupName = (group: any) => {
        if (group.group_name !== undefined) {
          return group.group_name.trim();
        }
        if (group.name !== undefined) {
          return group.name.trim();
        }
        return null;
      };

      const validGroups = course.groups
        .filter(group => isValidGroup(group))
        .map((group: any) => {
          const groupName = getGroupName(group);
          const groupId = group.id ? (typeof group.id === 'string' && group.id.startsWith('new-') ? null : parseInt(group.id)) : null;

          // Check if we already have a formatted group (backend format)
          if (group.group_name !== undefined) {
            // Already in backend format, but ensure dates are properly formatted
            return {
              ...(groupId ? { id: groupId } : {}),
              group_name: groupName,
              capacity: group.capacity !== undefined ? group.capacity : null,
              group_status: group.group_status || group.status || 'PLANNED',
              start_date: group.start_date || (group.startDate ? formatLocalDate(group.startDate) : null),
              end_date: group.end_date || (group.endDate ? formatLocalDate(group.endDate) : null),
              sessions_per_week: group.sessions_per_week || group.sessionsPerWeek || [],
              start_time: group.start_time || group.startTime || '09:00',
              end_time: group.end_time || group.endTime || '10:00',
              sessions: (group.sessions || []).map((session: any) => {
                const sessionId = session.id ? (typeof session.id === 'string' && session.id.startsWith('new-') ? null : parseInt(session.id)) : null;
                return {
                  ...(sessionId ? { id: sessionId } : {}),
                  session_no: session.session_no || session.sessionNo || 1,
                  session_date: session.session_date || (session.date ? formatLocalDate(session.date) : null),
                  start_time: session.start_time || session.startTime || '09:00',
                  end_time: session.end_time || session.endTime || '10:00',
                  session_status: session.session_status || session.status || 'PLANNED'
                };
              })
            };
          }

          // Frontend format - transform to backend format with proper date formatting
          return {
            ...(groupId ? { id: groupId } : {}),
            group_name: groupName,
            capacity: group.capacity === 'unlimited' ? null : group.capacity,
            group_status: group.status || 'PLANNED',
            start_date: group.startDate ? formatLocalDate(group.startDate) : null,
            end_date: group.endDate ? formatLocalDate(group.endDate) : null,
            sessions_per_week: group.sessionsPerWeek || [],
            start_time: group.startTime || '09:00',
            end_time: group.endTime || '10:00',
            sessions: (group.sessions || []).map((session: CourseSession) => {
              const sessionId = session.id ? (typeof session.id === 'string' && session.id.startsWith('new-') ? null : parseInt(session.id)) : null;
              return {
                ...(sessionId ? { id: sessionId } : {}),
                session_no: session.sessionNo || 1,
                session_date: session.date ? formatLocalDate(session.date) : null,
                start_time: session.startTime || '09:00',
                end_time: session.endTime || '10:00',
                session_status: session.status || 'PLANNED'
              };
            })
          };
        });

      if (course.groups.length > validGroups.length) {
        console.warn(`⚠️ Filtered out ${course.groups.length - validGroups.length} invalid groups`);
      }

      request.groups = validGroups;
    }

    // Handle self-study sessions
    if (course.self_study_sessions !== undefined) {
      request.self_study_sessions = course.self_study_sessions.map((session: any, index: number) => {
        // If it's already in backend format, use its values
        if (session.duration_per_session !== undefined || session.kanji_target !== undefined) {
          return {
            id: session.id ? (typeof session.id === 'string' && session.id.startsWith('s') ? null : parseInt(session.id)) : null,
            session_no: index + 1,
            duration_per_session: session.duration_per_session !== undefined ? session.duration_per_session : 7,
            kanji_target: session.kanji_target || 0,
            vocabulary_target: session.vocabulary_target || 0,
            grammar_target: session.grammar_target || 0,
            reading_target_minutes: session.reading_target_minutes || 0,
            listening_target_minutes: session.listening_target_minutes || 0,
            study_time_target_minutes: session.study_time_target_minutes || 0,
            file_path: session.file_path || session.filepath || '',
            filepath: session.file_path || session.filepath || '',
            session_status: session.session_status || 'PLANNED'
          };
        }

        // Frontend format - check if date is a Date object and format it
        let sessionDate = null;
        if (session.date) {
          if (isValidDate(session.date)) {
            sessionDate = formatLocalDate(session.date);
          } else if (typeof session.date === 'string') {
            // If it's already a string, use it as is (might already be YYYY-MM-DD)
            sessionDate = session.date;
          }
        }

        return {
          id: session.id ? (typeof session.id === 'string' && session.id.startsWith('s') ? null : parseInt(session.id)) : null,
          session_no: index + 1,
          duration_per_session: session.durationPerSession || 7,
          kanji_target: session.kanjiCount || 0,
          vocabulary_target: session.vocabularyCount || 0,
          grammar_target: session.grammarCount || 0,
          reading_target_minutes: session.readingMinutes || 0,
          listening_target_minutes: session.listeningMinutes || 0,
          study_time_target_minutes: session.studyTimeTargetMinutes || 0,
          file_path: session.link || '',
          filepath: session.link || '',
          session_status: session.status || 'PLANNED'
        };
      });
    }

    return request
  },

  // ========== COURSE API ENDPOINTS ==========

  // GET /api/courses - Fetch all courses
  fetchAll_CourseData: async () => {
    set((state: Course_StoreType) => ({ ...state, error: null }))
    try {
      const headers = get().getAuthHeaders()

      const response = await fetch(`${apiUrl}/api/courses`, {
        headers: headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()


      let transformedCourses: Course[] = []

      if (data.courses && Array.isArray(data.courses)) {
        transformedCourses = data.courses.map((course: BackendCourseDto) => get().transformBackendCourseToFrontend(course))
      }

      set((state: Course_StoreType) => ({
        ...state,
        courses: transformedCourses,
        error: null
      }))
    } catch (error) {
      console.error('Error fetching courses:', error)
      set((state: Course_StoreType) => ({
        ...state,
        error: error instanceof Error ? error.message : 'Failed to fetch courses'
      }))
    }
  },

  // GET /api/courses/:id - Fetch a single course by ID
  fetch_CourseData: async (id: number | string) => {
    set((state: Course_StoreType) => ({ ...state, error: null }))
    try {
      const headers = get().getAuthHeaders()

      const response = await fetch(`${apiUrl}/api/courses/${id}`, {
        headers: headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.course) {
        throw new Error('Course not found')
      }

      const transformedCourse = get().transformBackendCourseToFrontend(data.course as BackendCourseDto)

      set((state: Course_StoreType) => ({
        ...state,
        error: null
      }))

      return {
        success: true,
        course: transformedCourse
      }

    } catch (error) {
      console.error('Error fetching course:', error)
      set((state: Course_StoreType) => ({
        ...state,
        error: error instanceof Error ? error.message : 'Failed to fetch course'
      }))
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch course'
      }
    }
  },

  // POST /api/courses - Create a new course (with optional image)
  add_CourseData: async (data: FormData | Record<string, any>) => {
    set((state: Course_StoreType) => ({ ...state, isCreating: true, error: null }))

    try {
      let body: BodyInit;
      let headers: HeadersInit = {};

      if (data instanceof FormData) {
        body = data;
      } else {
        headers = get().getAuthHeaders();
        body = JSON.stringify(data);
      }

      const response = await fetch(`${apiUrl}/api/courses`, {
        method: "POST",
        headers: headers,
        body: body,
      })


      let result
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        const text = await response.text()
        result = { message: text || `Error: ${response.status} ${response.statusText}` }
      }

      if (response.ok) {
        const transformedCourse = get().transformBackendCourseToFrontend(result.course as BackendCourseDto)

        set((state: Course_StoreType) => ({
          ...state,
          courses: [transformedCourse, ...state.courses],
          isCreating: false,
          error: null
        }))

        return {
          success: true,
          message: result.message || 'Course created successfully',
          course: transformedCourse
        }
      } else {
        set((state: Course_StoreType) => ({
          ...state,
          isCreating: false,
          error: result.message || 'Failed to create course'
        }))
        return {
          success: false,
          message: result.message || 'Failed to create course',
        }
      }
    } catch (error) {
      console.error("UPLOAD FAILED:", error)
      set((state: Course_StoreType) => ({
        ...state,
        isCreating: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }))
      return {
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
      }
    }
  },

  // PUT /api/courses/:id - Update an existing course
  update_CourseData: async (id: number | string, courseData: Partial<Course>) => {
    set((state: Course_StoreType) => ({ ...state, isUpdating: true, error: null }))

    try {
      console.log('📝 Update Course Data:', JSON.stringify(courseData, null, 2));

      const backendRequest = get().transformFrontendToBackendRequest(courseData)
      console.log('🚀 Sending to API:', JSON.stringify(backendRequest, null, 2));

      const headers = get().getAuthHeaders()

      const response = await fetch(`${apiUrl}/api/courses/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(backendRequest),
      })

      let result
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        const text = await response.text()
        result = { message: text || `Error: ${response.status} ${response.statusText}` }
      }

      if (!response.ok) {
        set((state: Course_StoreType) => ({
          ...state,
          isUpdating: false,
          error: result.message || 'Failed to update course'
        }))
        throw new Error(result.message || 'Failed to update course')
      }

      let transformedCourse = null
      if (result.course) {
        transformedCourse = get().transformBackendCourseToFrontend(result.course as BackendCourseDto)
      } else {
        const fetchResult = await get().fetch_CourseData(id)
        if (fetchResult.success && fetchResult.course) {
          transformedCourse = fetchResult.course
        }
      }

      if (transformedCourse) {
        set((state: Course_StoreType) => ({
          ...state,
          courses: state.courses.map((c: Course) => c.id === id.toString() ? transformedCourse : c),
          isUpdating: false,
          error: null
        }))
      } else {
        set((state: Course_StoreType) => ({
          ...state,
          isUpdating: false,
          error: null
        }))
      }

      return {
        success: true,
        message: result.message || 'Course updated successfully',
        course: transformedCourse
      }

    } catch (error) {
      console.error('Error updating course:', error)
      set((state: Course_StoreType) => ({
        ...state,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update course'
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update course'
      }
    }
  },

  // POST /api/courses/:id/image - Upload/Update course image
  upload_CourseImage: async (id: number | string, formData: FormData) => {
    set((state: Course_StoreType) => ({ ...state, isUpdating: true, error: null }))

    try {
      const response = await fetch(`${apiUrl}/api/courses/${id}/image`, {
        method: 'POST',
        body: formData,
      })

      let result
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        const text = await response.text()
        result = { message: text || `Error: ${response.status} ${response.statusText}` }
      }

      if (!response.ok) {
        set((state: Course_StoreType) => ({
          ...state,
          isUpdating: false,
          error: result.message || 'Failed to upload image'
        }))
        throw new Error(result.message || 'Failed to upload image')
      }

      const transformedCourse = get().transformBackendCourseToFrontend(result.course as BackendCourseDto)

      set((state: Course_StoreType) => ({
        ...state,
        courses: state.courses.map((c: Course) => c.id === id.toString() ? transformedCourse : c),
        isUpdating: false,
        error: null
      }))

      return {
        success: true,
        message: result.message || 'Image uploaded successfully',
        course: transformedCourse
      }

    } catch (error) {
      console.error('Error uploading image:', error)
      set((state: Course_StoreType) => ({
        ...state,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to upload image'
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload image'
      }
    }
  },

  // DELETE /api/courses/:id/image - Delete course image
  delete_CourseImage: async (id: number | string) => {
    set((state: Course_StoreType) => ({ ...state, isUpdating: true, error: null }))

    try {
      const response = await fetch(`${apiUrl}/api/courses/${id}/image`, {
        method: 'DELETE',
        headers: get().getAuthHeaders(),
      })

      let result
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        const text = await response.text()
        result = { message: text || `Error: ${response.status} ${response.statusText}` }
      }

      if (!response.ok) {
        set((state: Course_StoreType) => ({
          ...state,
          isUpdating: false,
          error: result.message || 'Failed to delete image'
        }))
        throw new Error(result.message || 'Failed to delete image')
      }

      const transformedCourse = get().transformBackendCourseToFrontend(result.course as BackendCourseDto)

      set((state: Course_StoreType) => ({
        ...state,
        courses: state.courses.map((c: Course) => c.id === id.toString() ? transformedCourse : c),
        isUpdating: false,
        error: null
      }))

      return {
        success: true,
        message: result.message || 'Image deleted successfully',
        course: transformedCourse
      }

    } catch (error) {
      console.error('Error deleting image:', error)
      set((state: Course_StoreType) => ({
        ...state,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to delete image'
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete image'
      }
    }
  },

  // DELETE /api/courses/:id - Delete a course
  delete_CourseData: async (id: number | string) => {
    const previousCourses = get().courses

    set((state: Course_StoreType) => ({
      ...state,
      courses: state.courses.filter((course: Course) => course.id !== id.toString()),
      isDeleting: true,
      error: null
    }))

    try {
      const headers = get().getAuthHeaders()

      const response = await fetch(`${apiUrl}/api/courses/${id}`, {
        method: 'DELETE',
        headers: headers,
      })

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const result = await response.json()
          if (result.message) {
            errorMessage = result.message
          }
        } catch (e) {
          errorMessage = response.statusText || errorMessage
        }

        set((state: Course_StoreType) => ({
          ...state,
          courses: previousCourses,
          isDeleting: false,
          error: errorMessage
        }))
        throw new Error(errorMessage)
      }

      const result = await response.json()

      set((state: Course_StoreType) => ({
        ...state,
        isDeleting: false,
        error: null
      }))

      return {
        success: true,
        message: result.message || 'Course deleted successfully'
      }

    } catch (error) {
      console.error('Error deleting course:', error)
      set((state: Course_StoreType) => ({
        ...state,
        courses: previousCourses,
        isDeleting: false,
        error: error instanceof Error ? error.message : 'Failed to delete course'
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete course'
      }
    }
  },

  // ========== course METHODS (delegated to courseCategoryStore) ==========
  ...courseCategoryStore(set, get),
  ...courseEnrollmentStore(set, get),
  ...courseSelfStudyProgressStore(set, get),
  ...courseAttendanceStore(set, get),
  ...groupChangeStore(set, get),

  // ========== LEGACY/UTILITY COURSE OPERATIONS ==========

  setCourses: (courses: Course[]) =>
    set((state: Course_StoreType) => ({ ...state, courses })),

  addCourse: (course: Course) =>
    set((state: Course_StoreType) => ({
      ...state,
      courses: [course, ...state.courses],
    })),

  updateCourse: (id: string, data: Partial<Course>) =>
    set((state: Course_StoreType) => ({
      ...state,
      courses: state.courses.map((course: Course) =>
        course.id === id
          ? { ...course, ...data, updatedAt: new Date() }
          : course
      ),
    })),

  deleteCourse: (id: string) =>
    set((state: Course_StoreType) => ({
      ...state,
      courses: state.courses.filter((course: Course) => course.id !== id),
    })),

  getCourse: (id: string) => {
    try {
      const state = get()
      return state.courses.find((course: Course) => course.id === id)
    } catch (error) {
      console.error('Error getting course:', error)
      return undefined
    }
  },

  initializeCourses: () => {
    try {
      set((state: Course_StoreType) => {
        if (state.courses.length === 0) {
          return state
        }
        return state
      })
    } catch (error) {
      console.error('Error initializing courses:', error)
    }
  },

  // ========== UI STATE METHODS ==========

  setIsFormVisible: (visible: boolean) =>
    set((state: Course_StoreType) => ({ ...state, isFormVisible: visible })),

  setEditingCourse: (course: Course | null) =>
    set((state: Course_StoreType) => ({ ...state, editingCourse: course })),

  resetForm: () =>
    set((state: Course_StoreType) => ({ ...state, isFormVisible: false, editingCourse: null })),
})