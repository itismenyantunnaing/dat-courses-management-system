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

type StoreSet = (
  fn: (state: Course_StoreType) => Partial<Course_StoreType>
) => void
type StoreGet = () => Course_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

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
        date: new Date(s.session_date),
        startTime: s.start_time,
        endTime: s.end_time,
        status: s.session_status,
      }))

      // Extract group-level times from the first session if available
      const firstSession = groupSessions[0]
      const startTime = firstSession?.startTime || "09:00"
      const endTime = firstSession?.endTime || "10:00"

      // Synthesize sessionsPerWeek from unique days of the week in sessions
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
        createdAt: g.created_at ? new Date(g.created_at) : undefined,
      }
    })

    // Map self-study sessions
    const sessions: CourseSession[] = (course.self_study_sessions || []).map((s: BackendSelfStudySessionDto, index: number) => ({
      id: s.id?.toString() || `s-${index}`,
      sessionNo: s.session_no || index + 1,
      date: s.session_date ? new Date(s.session_date) : undefined as any,
      durationPerSession: s.duration_per_session || 7, // ✅ ADD THIS
      kanjiCount: s.kanji_target || 0,
      vocabularyCount: s.vocabulary_target || 0,
      grammarCount: s.grammar_target || 0,
      readingMinutes: s.reading_target_minutes || 0,
      listeningMinutes: s.listening_target_minutes || 0,
      studyTimeTargetMinutes: s.study_time_target_minutes || 0,
      link: s.file_path || s.filepath || '',
      status: s.session_status,
    }))

    // Calculate daysPerSession from sessions if possible
    let calculatedDaysPerSession: number | undefined = course.session_per_days;

    // Get the category value for the frontend
    const categoryName = course.category?.course_category_name || ''
    // Try to find matching category from the store if it's already loaded
    const categoryValue = categoryName.toLowerCase().replace(/\s+/g, '-')

    // Status mapping
    const statusMap: Record<string, string> = {
      'DRAFT': 'draft',
      'OPEN': 'active',
      'CLOSED': 'upcoming',
      'COMPLETED': 'completed'
    }
    const status = statusMap[course.status] || course.status?.toLowerCase() || 'draft'

    return {
      id: course.id?.toString() || '',
      title: course.course_name || '',
      trainerName: course.trainer_name || '',
      imageUrl: course.image_path || '',
      courseType: courseType,
      categoryId: course.course_category_id,
      category: categoryValue,
      targetLevel: course.target_level,
      totalSessions: course.total_sessions,
      startDate: course.start_date ? new Date(course.start_date) : undefined,
      endDate: course.end_date ? new Date(course.end_date) : undefined,
      status: status as "active" | "upcoming" | "completed" | "draft",
      registrationDeadline: course.registration_deadline ? new Date(course.registration_deadline) : undefined,
      createdAt: course.created_at ? new Date(course.created_at) : new Date(),
      updatedAt: course.updated_at ? new Date(course.updated_at) : new Date(),
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
  transformFrontendToBackendRequest: (course: Partial<Course>): any => {
    const request: any = {}

    if (course.title !== undefined) request.course_name = course.title
    if (course.trainerName !== undefined) request.trainer_name = course.trainerName
    if (course.selfStudyType !== undefined) request.self_study_type = course.selfStudyType
    if (course.categoryId !== undefined) request.course_category_id = course.categoryId
    if (course.targetLevel !== undefined) request.target_level = course.targetLevel
    if (course.totalSessions !== undefined) request.total_sessions = course.totalSessions
    if (course.startDate !== undefined) request.start_date = course.startDate
    if (course.endDate !== undefined) request.end_date = course.endDate
    if (course.registrationDeadline !== undefined) request.registration_deadline = course.registrationDeadline
    if (course.status !== undefined) {
      const statusMap: Record<string, string> = {
        'active': 'OPEN',
        'upcoming': 'CLOSED',
        'completed': 'COMPLETED',
        'draft': 'DRAFT'
      }
      request.status = statusMap[course.status] || course.status.toUpperCase()
    }

    // Handle groups
    if (course.groups !== undefined) {
      request.groups = course.groups.map((group: CourseGroup) => ({
        group_name: group.name,
        capacity: group.capacity === 'unlimited' ? null : group.capacity,
        group_status: group.status,
        sessions: group.sessions.map((session: CourseSession) => ({
          session_no: session.sessionNo,
          session_date: session.date ? session.date.toISOString().split('T')[0] : undefined,
          start_time: session.startTime,
          end_time: session.endTime,
          session_status: session.status
        }))
      }))
    }

    // Handle self-study sessions - ✅ ADD duration_per_session
    if (course.self_study_sessions !== undefined) {
      request.self_study_sessions = course.self_study_sessions.map((session: CourseSession, index: number) => ({
        session_no: index + 1, // Use index instead of session.sessionNo
        duration_per_session: session.durationPerSession || 7, // ✅ ADD THIS with default
        kanji_target: session.kanjiCount || 0,
        vocabulary_target: session.vocabularyCount || 0,
        grammar_target: session.grammarCount || 0,
        reading_target_minutes: session.readingMinutes || 0,
        listening_target_minutes: session.listeningMinutes || 0,
        study_time_target_minutes: session.studyTimeTargetMinutes || 0,
        file_path: session.link || '',
        session_status: session.status || 'PLANNED'
      }))
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
  add_CourseData: async (formData: FormData) => {
    set((state: Course_StoreType) => ({ ...state, isCreating: true, error: null }))

    try {
      // ❗ HARD CHECK
      if (!(formData instanceof FormData)) {
        throw new Error("Body is NOT FormData")
      }

      const response = await fetch(`${apiUrl}/api/courses`, {
        method: "POST",
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
      // Transform frontend course data to backend format
      const backendRequest = get().transformFrontendToBackendRequest(courseData)

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

      // If the response contains the updated course, transform it
      let transformedCourse = null
      if (result.course) {
        transformedCourse = get().transformBackendCourseToFrontend(result.course as BackendCourseDto)
      } else {
        // If no course returned, fetch the updated course
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
        // If we can't get the updated course, just mark as updated
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