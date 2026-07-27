import type { Course_StoreType } from "../../types"

type StoreSet = (
  fn: (state: Course_StoreType) => Partial<Course_StoreType>
) => void
type StoreGet = () => Course_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Group Change Store
export const groupChangeStore = (set: StoreSet, get: StoreGet) => ({
  // State for group changes
  groupChangeError: null,
  isRequestingGroupChange: false,
  isAdminChangingGroup: false,
  isApprovingGroupChange: false,
  isRejectingGroupChange: false,
  groupChangeSuccess: null,


  // PUT /api/groupchange/request - Employee requests to change group
  requestGroupChange: async (enrollmentId: number, groupId: number) => {
    set((state: Course_StoreType) => ({ 
      ...state, 
      isRequestingGroupChange: true, 
      groupChangeError: null,
      groupChangeSuccess: null
    }))

    try {
      const headers = get().getAuthHeaders()

      const requestBody: GroupChangeRequest = {
        enrollmentId,
        groupId
      }

      const response = await fetch(`${apiUrl}/api/groupchange/request`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(requestBody)
      })

      let result
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        result = await response.text()
      }

      if (!response.ok) {
        set((state: Course_StoreType) => ({
          ...state,
          isRequestingGroupChange: false,
          groupChangeError: result || 'Failed to request group change'
        }))
        throw new Error(result || 'Failed to request group change')
      }

      // Refresh enrollments to get updated data
      // Get the courseId from the enrollment
      const enrollments = get().enrollments || []
      const enrollment = enrollments.find((e: any) => e.id === enrollmentId)
      if (enrollment?.courseId) {
        await get().fetch_courseEnrollments(enrollment.courseId)
      }

      set((state: Course_StoreType) => ({
        ...state,
        isRequestingGroupChange: false,
        groupChangeError: null,
        groupChangeSuccess: result || 'Group change request submitted successfully'
      }))

      return {
        success: true,
        message: result || 'Group change request submitted successfully'
      }

    } catch (error) {
      console.error('❌ Error requesting group change:', error)
      set((state: Course_StoreType) => ({
        ...state,
        isRequestingGroupChange: false,
        groupChangeError: error instanceof Error ? error.message : 'Failed to request group change',
        groupChangeSuccess: null
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to request group change'
      }
    }
  },

  // PUT /api/groupchange/{enrollmentId}/adminchange/{groupId} - Admin changes group immediately
  adminChangeGroup: async (enrollmentId: number, groupId: number) => {
    set((state: Course_StoreType) => ({ 
      ...state, 
      isAdminChangingGroup: true, 
      groupChangeError: null,
      groupChangeSuccess: null
    }))

    try {
      const headers = get().getAuthHeaders()


      const response = await fetch(`${apiUrl}/api/groupchange/${enrollmentId}/adminchange/${groupId}`, {
        method: 'PUT',
        headers: headers
      })


      let result
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        result = await response.text()
      }

      if (!response.ok) {
        set((state: Course_StoreType) => ({
          ...state,
          isAdminChangingGroup: false,
          groupChangeError: result || 'Failed to change group'
        }))
        throw new Error(result || 'Failed to change group')
      }

      // Refresh enrollments to get updated data
      const enrollments = get().enrollments || []
      const enrollment = enrollments.find((e: any) => e.id === enrollmentId)
      if (enrollment?.courseId) {
        await get().fetch_courseEnrollments(enrollment.courseId)
      }

      set((state: Course_StoreType) => ({
        ...state,
        isAdminChangingGroup: false,
        groupChangeError: null,
        groupChangeSuccess: result || 'Group changed successfully'
      }))

      return {
        success: true,
        message: result || 'Group changed successfully'
      }

    } catch (error) {
      console.error('❌ Error changing group:', error)
      set((state: Course_StoreType) => ({
        ...state,
        isAdminChangingGroup: false,
        groupChangeError: error instanceof Error ? error.message : 'Failed to change group',
        groupChangeSuccess: null
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to change group'
      }
    }
  },

  // PUT /api/groupchange/{enrollmentId}/approve - Admin approves group change request
  approveGroupChange: async (enrollmentId: number) => {
    set((state: Course_StoreType) => ({ 
      ...state, 
      isApprovingGroupChange: true, 
      groupChangeError: null,
      groupChangeSuccess: null
    }))

    try {
      const headers = get().getAuthHeaders()


      const response = await fetch(`${apiUrl}/api/groupchange/${enrollmentId}/approve`, {
        method: 'PUT',
        headers: headers
      })


      let result
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        result = await response.text()
      }

      if (!response.ok) {
        set((state: Course_StoreType) => ({
          ...state,
          isApprovingGroupChange: false,
          groupChangeError: result || 'Failed to approve group change'
        }))
        throw new Error(result || 'Failed to approve group change')
      }

      // Refresh enrollments to get updated data
      const enrollments = get().enrollments || []
      const enrollment = enrollments.find((e: any) => e.id === enrollmentId)
      if (enrollment?.courseId) {
        await get().fetch_courseEnrollments(enrollment.courseId)
      }

      set((state: Course_StoreType) => ({
        ...state,
        isApprovingGroupChange: false,
        groupChangeError: null,
        groupChangeSuccess: result || 'Group change request approved successfully'
      }))

      return {
        success: true,
        message: result || 'Group change request approved successfully'
      }

    } catch (error) {
      console.error('❌ Error approving group change:', error)
      set((state: Course_StoreType) => ({
        ...state,
        isApprovingGroupChange: false,
        groupChangeError: error instanceof Error ? error.message : 'Failed to approve group change',
        groupChangeSuccess: null
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve group change'
      }
    }
  },

  // PUT /api/groupchange/{enrollmentId}/reject - Admin rejects group change request
  rejectGroupChange: async (enrollmentId: number) => {
    set((state: Course_StoreType) => ({ 
      ...state, 
      isRejectingGroupChange: true, 
      groupChangeError: null,
      groupChangeSuccess: null
    }))

    try {
      const headers = get().getAuthHeaders()


      const response = await fetch(`${apiUrl}/api/groupchange/${enrollmentId}/reject`, {
        method: 'PUT',
        headers: headers
      })


      let result
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        result = await response.text()
      }

      if (!response.ok) {
        set((state: Course_StoreType) => ({
          ...state,
          isRejectingGroupChange: false,
          groupChangeError: result || 'Failed to reject group change'
        }))
        throw new Error(result || 'Failed to reject group change')
      }

      // Refresh enrollments to get updated data
      const enrollments = get().enrollments || []
      const enrollment = enrollments.find((e: any) => e.id === enrollmentId)
      if (enrollment?.courseId) {
        await get().fetch_courseEnrollments(enrollment.courseId)
      }

      set((state: Course_StoreType) => ({
        ...state,
        isRejectingGroupChange: false,
        groupChangeError: null,
        groupChangeSuccess: result || 'Group change request rejected successfully'
      }))

      return {
        success: true,
        message: result || 'Group change request rejected successfully'
      }

    } catch (error) {
      console.error('❌ Error rejecting group change:', error)
      set((state: Course_StoreType) => ({
        ...state,
        isRejectingGroupChange: false,
        groupChangeError: error instanceof Error ? error.message : 'Failed to reject group change',
        groupChangeSuccess: null
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject group change'
      }
    }
  },

  // ==================== HELPER FUNCTIONS ====================

  // Get group change requests for a specific course
  getGroupChangeRequests: (courseId: number | string) => {
    try {
      const state = get()
      const enrollments = state.enrollments || []
      
      // Filter enrollments that have pending group change requests
      // Note: This assumes your enrollment objects have a field indicating group change request status
      // You may need to adjust this based on your actual data structure
      return enrollments.filter(
        (enrollment: any) => 
          enrollment.courseId?.toString() === courseId.toString() &&
          enrollment.groupChangeRequestStatus === 'PENDING'
      )
    } catch (error) {
      console.error('Error getting group change requests:', error)
      return []
    }
  },

  // Get pending group change requests count for a course
  getPendingGroupChangeCount: (courseId: number | string) => {
    try {
      const requests = get().getGroupChangeRequests(courseId)
      return requests.length
    } catch (error) {
      console.error('Error getting pending group change count:', error)
      return 0
    }
  },

  // Check if a specific enrollment has a pending group change request
  hasPendingGroupChange: (enrollmentId: number) => {
    try {
      const state = get()
      const enrollments = state.enrollments || []
      const enrollment = enrollments.find((e: any) => e.id === enrollmentId)
      
      return enrollment?.groupChangeRequestStatus === 'PENDING' || false
    } catch (error) {
      console.error('Error checking pending group change:', error)
      return false
    }
  },

  // Clear group change state
  clearGroupChangeState: () => {
    set((state: Course_StoreType) => ({
      ...state,
      groupChangeError: null,
      groupChangeSuccess: null,
      isRequestingGroupChange: false,
      isAdminChangingGroup: false,
      isApprovingGroupChange: false,
      isRejectingGroupChange: false
    }))
  },

  // Reset group change loading states
  resetGroupChangeStates: () => {
    set((state: Course_StoreType) => ({
      ...state,
      isRequestingGroupChange: false,
      isAdminChangingGroup: false,
      isApprovingGroupChange: false,
      isRejectingGroupChange: false
    }))
  }
})

// Type definitions for the request
export interface GroupChangeRequest {
  enrollmentId: number
  groupId: number
}