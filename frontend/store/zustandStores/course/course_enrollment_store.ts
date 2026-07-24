import type { Course_StoreType } from "../../types"

type StoreSet = (
  fn: (state: Course_StoreType) => Partial<Course_StoreType>
) => void
type StoreGet = () => Course_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Course Enrollment Store
export const courseEnrollmentStore = (set: StoreSet, get: StoreGet) => ({
  // State for enrollments
  enrollments: [],
  enrollmentError: null,
  isEnrolling: false,
  isUnenrolling: false,
  isUpdatingEnrollment: false,
  isLoadingEnrollments: false, // ✅ ADD THIS - declare the loading state

  // ==================== COURSE ENROLLMENT API ENDPOINTS ====================

  // GET /api/courses/:courseId/enrollments - Fetch all enrollments for a course
  fetch_courseEnrollments: async (courseId: number | string) => {
    // ✅ Clear old enrollments and set loading state
    set((state: Course_StoreType) => ({
      ...state,
      enrollments: [],
      enrollmentError: null,
      isLoadingEnrollments: true
    }))

    try {
      const headers = get().getAuthHeaders()

      const response = await fetch(`${apiUrl}/api/courses/${courseId}/enrollments`, {
        headers: headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // ✅ Add courseId to each enrollment and update state
      const enrollmentsWithCourseId = (data || []).map((enrollment: any) => ({
        ...enrollment,
        courseId: parseInt(courseId.toString())
      }))

      // Store the enrollments in the store state
      set((state: Course_StoreType) => ({
        ...state,
        enrollments: enrollmentsWithCourseId,
        enrollmentError: null,
        isLoadingEnrollments: false // ✅ Set loading to false
      }))

      // Return the data directly so the component can use it
      return enrollmentsWithCourseId

    } catch (error) {
      console.error('❌ Error fetching course enrollments:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch enrollments'

      set((state: Course_StoreType) => ({
        ...state,
        enrollments: [],
        enrollmentError: errorMessage,
        isLoadingEnrollments: false // ✅ Set loading to false on error too
      }))

      return []
    }
  },

  // POST /api/courses/:courseId/enroll - Enroll an employee in a course
  enrollEmployee: async (courseId: number | string, courseGroupId: number, employeeId?: string) => {
    set((state: Course_StoreType) => ({ ...state, isEnrolling: true, enrollmentError: null }))

    try {
      // If employeeId is not provided, use the logged-in user's ID
      const targetEmployeeId = employeeId || get().getUserId?.() || null

      if (!targetEmployeeId) {
        throw new Error('Employee ID not found. Please log in again.')
      }

      const headers = get().getAuthHeaders()

      const response = await fetch(`${apiUrl}/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          employeeId: targetEmployeeId,
          courseGroupId: courseGroupId
        }),
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
          isEnrolling: false,
          enrollmentError: result.message || 'Failed to enroll employee'
        }))
        throw new Error(result.message || 'Failed to enroll employee')
      }

      // Refresh enrollments after successful enrollment
      await get().fetch_courseEnrollments(courseId)

      set((state: Course_StoreType) => ({
        ...state,
        isEnrolling: false,
        enrollmentError: null
      }))

      return {
        success: true,
        message: result.message || 'Employee enrolled successfully',
        data: result
      }

    } catch (error) {
      console.error('❌ Error enrolling employee:', error)
      set((state: Course_StoreType) => ({
        ...state,
        isEnrolling: false,
        enrollmentError: error instanceof Error ? error.message : 'Failed to enroll employee'
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to enroll employee'
      }
    }
  },

  // DELETE /api/courses/:courseId/enrollments/:enrollmentId - Cancel enrollment (soft delete)
  cancelEnrollment: async (courseId: number | string, enrollmentId: number) => {
    set((state: Course_StoreType) => ({ ...state, isUnenrolling: true, enrollmentError: null }))

    try {
      console.log('🔵 cancelEnrollment called with:', { courseId, enrollmentId })

      const headers = get().getAuthHeaders()

      const response = await fetch(`${apiUrl}/api/courses/${courseId}/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        headers: headers
      })

      console.log('🔵 Response status:', response.status)

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
          isUnenrolling: false,
          enrollmentError: errorMessage
        }))
        throw new Error(errorMessage)
      }

      let result = null
      try {
        result = await response.json()
      } catch (e) {
        result = { success: true, message: 'Enrollment cancelled successfully' }
      }

      // Refresh enrollments after successful cancellation
      await get().fetch_courseEnrollments(courseId)

      set((state: Course_StoreType) => ({
        ...state,
        isUnenrolling: false,
        enrollmentError: null
      }))

      return {
        success: true,
        message: result?.message || 'Enrollment cancelled successfully'
      }

    } catch (error) {
      console.error('❌ Error cancelling enrollment:', error)
      set((state: Course_StoreType) => ({
        ...state,
        isUnenrolling: false,
        enrollmentError: error instanceof Error ? error.message : 'Failed to cancel enrollment'
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel enrollment'
      }
    }
  },

  // Alias for cancelEnrollment to match the component's expected function name
  unenrollEmployee: async (courseId: number | string, enrollmentId: number) => {
    return await get().cancelEnrollment(courseId, enrollmentId);
  },

  // GET /api/employees/:employeeId/courses - Fetch all courses for the current employee
  fetchMyCourses: async () => {
    set((state: Course_StoreType) => ({ ...state, enrollmentError: null }))
    try {
      // Get current profile from store
      const currentProfile = get().profile;
      const employeeId = currentProfile?.id || null

      if (!employeeId) {
        throw new Error('Employee ID not found in session. Please log in again.')
      }


      const headers = get().getAuthHeaders()

      const response = await fetch(`${apiUrl}/api/employees/${employeeId}/courses`, {
        headers: headers
      })


      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('🔵 My courses data:', data)

      return {
        success: true,
        data: data
      }

    } catch (error) {
      console.error('❌ Error fetching my courses:', error)
      set((state: Course_StoreType) => ({
        ...state,
        enrollmentError: error instanceof Error ? error.message : 'Failed to fetch your courses'
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch your courses'
      }
    }
  },

  // Check if the current employee is enrolled in a course
  checkMyEnrollment: async (courseId: number | string, employeeID?: string) => {
    try {

      const currentProfile = get().profile;
      const employee_Id = employeeID || currentProfile.id



      if (!employee_Id) {
        return {
          success: false,
          isEnrolled: false,
          message: 'Employee ID not found in session'
        }
      }

      const enrollments = await get().fetch_courseEnrollments(courseId)

      if (Array.isArray(enrollments)) {
        const isEnrolled = enrollments.some(
          (enrollment: any) => enrollment.employeeId === employee_Id &&
            enrollment.enrollmentStatus === 'APPROVED'
        )

        const enrollment = enrollments.find(
          (enrollment: any) => enrollment.employeeId === employee_Id
        )

        return {
          success: true,
          isEnrolled,
          enrollment: enrollment || null
        }
      }

      return {
        success: true,
        isEnrolled: false,
        enrollment: null
      }

    } catch (error) {
      console.error('❌ Error checking enrollment:', error)
      return {
        success: false,
        isEnrolled: false,
        message: error instanceof Error ? error.message : 'Failed to check enrollment'
      }
    }
  },

  // ==================== HELPER FUNCTIONS ====================

  // Get the current user's enrollment for a specific course
  getMyEnrollment: async (courseId: number | string) => {
    try {

      // Get current profile from store
      const currentProfile = get().profile;
      const employeeId = currentProfile?.id || null

      if (!employeeId) return null

      const enrollments = await get().fetch_courseEnrollments(courseId)

      return enrollments.find(
        (enrollment: any) =>
          enrollment.employeeId === employeeId &&
          enrollment.courseId?.toString() === courseId.toString()
      )
    } catch (error) {
      console.error('Error getting my enrollment:', error)
      return null
    }
  },

  // Check if the current user is enrolled in a course (using store data)
  isMeEnrolled: (courseId: number | string) => {
    try {
      const state = get()
      const employeeId = state.getUserId?.() || null

      if (!employeeId) return false

      const enrollments = state.enrollments || []
      return enrollments.some(
        (enrollment: any) =>
          enrollment.employeeId === employeeId &&
          enrollment.courseId?.toString() === courseId.toString() &&
          enrollment.enrollmentStatus === 'APPROVED'
      )
    } catch (error) {
      console.error('Error checking if I am enrolled:', error)
      return false
    }
  },

  // Get enrollment by employee ID
  getEnrollmentByEmployeeId: (courseId: number | string, employeeId: string) => {
    try {
      const state = get()
      const enrollments = state.enrollments || []
      return enrollments.find(
        (enrollment: any) =>
          enrollment.employeeId === employeeId &&
          enrollment.courseId?.toString() === courseId.toString()
      )
    } catch (error) {
      console.error('Error getting enrollment by employee ID:', error)
      return null
    }
  },

  // Check if any employee is enrolled in a course
  isEmployeeEnrolled: (courseId: number | string, employeeId: string) => {
    try {
      const state = get()
      const enrollments = state.enrollments || []
      return enrollments.some(
        (enrollment: any) =>
          enrollment.employeeId === employeeId &&
          enrollment.courseId?.toString() === courseId.toString() &&
          enrollment.enrollmentStatus === 'APPROVED'
      )
    } catch (error) {
      console.error('Error checking employee enrollment:', error)
      return false
    }
  },

  // Get enrollment counts by status for a course
  getEnrollmentCountsByStatus: (courseId: number | string) => {
    try {
      const state = get()
      const enrollments = state.enrollments || []
      const courseEnrollments = enrollments.filter(
        (enrollment: any) => enrollment.courseId?.toString() === courseId.toString()
      )

      return {
        total: courseEnrollments.length,
        approved: courseEnrollments.filter((e: any) => e.enrollmentStatus === 'APPROVED').length,
        pending: courseEnrollments.filter((e: any) => e.enrollmentStatus === 'PENDING').length,
        cancelled: courseEnrollments.filter((e: any) => e.enrollmentStatus === 'CANCELLED').length,
        completed: courseEnrollments.filter((e: any) => e.enrollmentStatus === 'COMPLETED').length,
      }
    } catch (error) {
      console.error('Error getting enrollment counts:', error)
      return { total: 0, approved: 0, pending: 0, cancelled: 0, completed: 0 }
    }
  },

  // Clear enrollment state
  clearEnrollments: () => {
    set((state: Course_StoreType) => ({
      ...state,
      enrollments: [],
      enrollmentError: null,
      isLoadingEnrollments: false
    }))
  },

  // Reset enrollment loading states
  resetEnrollmentStates: () => {
    set((state: Course_StoreType) => ({
      ...state,
      isEnrolling: false,
      isUnenrolling: false,
      isUpdatingEnrollment: false,
      enrollmentError: null,
      isLoadingEnrollments: false
    }))
  }
})