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

  // ==================== COURSE ENROLLMENT API ENDPOINTS ====================

  // GET /api/courses/:courseId/enrollments - Fetch all enrollments for a course
  fetch_courseEnrollments: async (courseId: number | string) => {
    set((state: Course_StoreType) => ({ ...state, enrollmentError: null }))
    try {
      console.log('🔵 fetch_courseEnrollments called with courseId:', courseId)
      
      const headers = get().getAuthHeaders()
      console.log('🔵 Headers:', headers)
      
      const response = await fetch(`${apiUrl}/api/courses/${courseId}/enrollments`, {
        headers: headers
      })

      console.log('🔵 Response status:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('🔵 Raw API response data:', data)

      // Store the enrollments in the store state
      set((state: Course_StoreType) => ({
        ...state,
        enrollments: data,
        enrollmentError: null
      }))
      

      // Return the data directly so the component can use it
      return data

    } catch (error) {
      console.error('❌ Error fetching course enrollments:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch enrollments'
      
      set((state: Course_StoreType) => ({
        ...state,
        enrollmentError: errorMessage
      }))
      
      return []
    }
  },

  // POST /api/courses/:courseId/enroll - Enroll an employee in a course
  enrollEmployee: async (courseId: number | string, courseGroupId: number) => {
    set((state: Course_StoreType) => ({ ...state, isEnrolling: true, enrollmentError: null }))

    try {
      // Get employee ID from session
      const employeeId = get().getUserId?.() || null
      
      if (!employeeId) {
        throw new Error('Employee ID not found in session. Please log in again.')
      }

      console.log('🔵 enrollEmployee called with:', { courseId, employeeId, courseGroupId })
      
      const headers = get().getAuthHeaders()
      
      // First, fetch current enrollments to check if user already has one
      const enrollments = await get().fetch_courseEnrollments(courseId)
      
      let existingEnrollment = null
      if (Array.isArray(enrollments)) {
        existingEnrollment = enrollments.find(
          (enrollment: any) => enrollment.employeeId === employeeId
        )
      }

      // If there's an existing enrollment that's not APPROVED (cancelled, pending, etc.)
      // Update it instead of creating a new one
      if (existingEnrollment && existingEnrollment.enrollmentStatus !== 'APPROVED') {
        console.log('🔵 Found existing cancelled enrollment, updating it:', existingEnrollment)
        
        const updateResponse = await fetch(
          `${apiUrl}/api/courses/${courseId}/enrollments/${existingEnrollment.id}`,
          {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({ 
              enrollmentStatus: 'APPROVED',
              courseGroupId: courseGroupId 
            }),
          }
        )

        console.log('🔵 Update response status:', updateResponse.status)

        let updateResult
        const contentType = updateResponse.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          updateResult = await updateResponse.json()
        } else {
          const text = await updateResponse.text()
          updateResult = { message: text || `Error: ${updateResponse.status} ${updateResponse.statusText}` }
        }

        if (!updateResponse.ok) {
          set((state: Course_StoreType) => ({
            ...state,
            isEnrolling: false,
            enrollmentError: updateResult.message || 'Failed to re-enroll employee'
          }))
          throw new Error(updateResult.message || 'Failed to re-enroll employee')
        }

        // Refresh enrollments after successful update
        await get().fetch_courseEnrollments(courseId)

        set((state: Course_StoreType) => ({
          ...state,
          isEnrolling: false,
          enrollmentError: null
        }))

        return {
          success: true,
          message: 'Successfully re-enrolled in the course!',
          data: updateResult
        }
      }

      // If enrollment already exists and is APPROVED
      if (existingEnrollment && existingEnrollment.enrollmentStatus === 'APPROVED') {
        set((state: Course_StoreType) => ({
          ...state,
          isEnrolling: false,
          enrollmentError: null
        }))

        return {
          success: true,
          message: 'You are already enrolled in this course',
          data: existingEnrollment
        }
      }

      // No existing enrollment, create a new one
      console.log('🔵 Creating new enrollment')
      const response = await fetch(`${apiUrl}/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          employeeId: employeeId,
          courseGroupId: courseGroupId
        }),
      })

      console.log('🔵 Response status:', response.status)

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

  // PUT /api/courses/:courseId/enrollments/:enrollmentId - Update enrollment status
  updateEnrollmentStatus: async (courseId: number | string, enrollmentId: number, status: string) => {
    set((state: Course_StoreType) => ({ ...state, isUpdatingEnrollment: true, enrollmentError: null }))

    try {
      console.log('🔵 updateEnrollmentStatus called with:', { courseId, enrollmentId, status })
      
      const headers = get().getAuthHeaders()
      
      const response = await fetch(`${apiUrl}/api/courses/${courseId}/enrollments/${enrollmentId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ enrollmentStatus: status }),
      })

      console.log('🔵 Response status:', response.status)

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
          isUpdatingEnrollment: false,
          enrollmentError: result.message || 'Failed to update enrollment'
        }))
        throw new Error(result.message || 'Failed to update enrollment')
      }

      // Refresh enrollments after successful update
      await get().fetch_courseEnrollments(courseId)

      set((state: Course_StoreType) => ({
        ...state,
        isUpdatingEnrollment: false,
        enrollmentError: null
      }))

      return {
        success: true,
        message: result.message || 'Enrollment updated successfully',
        data: result
      }

    } catch (error) {
      console.error('❌ Error updating enrollment:', error)
      set((state: Course_StoreType) => ({
        ...state,
        isUpdatingEnrollment: false,
        enrollmentError: error instanceof Error ? error.message : 'Failed to update enrollment'
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update enrollment'
      }
    }
  },

  // DELETE /api/courses/:courseId/enrollments/:enrollmentId - Cancel enrollment (soft delete)
  // Alias as unenrollEmployee for better naming consistency
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
      // Get employee ID from session
      const employeeId = get().getUserId?.() || null
      
      if (!employeeId) {
        throw new Error('Employee ID not found in session. Please log in again.')
      }

      console.log('🔵 fetchMyCourses called for employeeId:', employeeId)
      
      const headers = get().getAuthHeaders()
      
      const response = await fetch(`${apiUrl}/api/employees/${employeeId}/courses`, {
        headers: headers
      })

      console.log('🔵 Response status:', response.status)

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
  checkMyEnrollment: async (courseId: number | string) => {
    try {
      const employeeId = get().getUserId?.() || null
      
      if (!employeeId) {
        return {
          success: false,
          isEnrolled: false,
          message: 'Employee ID not found in session'
        }
      }

      // Get all enrollments for the course
      const enrollments = await get().fetch_courseEnrollments(courseId)
      
      if (Array.isArray(enrollments)) {
        const isEnrolled = enrollments.some(
          (enrollment: any) => enrollment.employeeId === employeeId && 
          enrollment.enrollmentStatus === 'APPROVED'
        )
        
        // Get the specific enrollment if found
        const enrollment = enrollments.find(
          (enrollment: any) => enrollment.employeeId === employeeId
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
  getMyEnrollment: (courseId: number | string) => {
    try {
      const state = get()
      const employeeId = state.getUserId?.() || null
      
      if (!employeeId) return null
      
      const enrollments = state.enrollments || []
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
      enrollmentError: null
    }))
  },

  // Reset enrollment loading states
  resetEnrollmentStates: () => {
    set((state: Course_StoreType) => ({
      ...state,
      isEnrolling: false,
      isUnenrolling: false,
      isUpdatingEnrollment: false,
      enrollmentError: null
    }))
  }
})