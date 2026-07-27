import type { Course_StoreType } from "../types"

type StoreSet = (
  fn: (state: Course_StoreType) => Partial<Course_StoreType>
) => void

type StoreGet = () => Course_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Course Self-Study Progress Store
export const courseSelfStudyProgressStore = (set: StoreSet, get: StoreGet) => ({
  studyProgress: [],

  // =========================
  // FETCH PROGRESS
  // =========================
  fetch_studyProgress: async (courseId: number | string) => {
    set((state: Course_StoreType) => ({
      ...state,
      isFetchingProgress: true,
      progressError: null
    }))

    try {
      const headers = get().getAuthHeaders()

      const response = await fetch(
        `${apiUrl}/api/courses/${courseId}/progress`,
        { headers }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      set((state: Course_StoreType) => ({
        ...state,
        studyProgress: data,
        isFetchingProgress: false,
        progressError: null
      }))


      return { success: true, data }

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch progress'

      set((state: Course_StoreType) => ({
        ...state,
        isFetchingProgress: false,
        progressError: errorMessage
      }))

      return { success: false, message: errorMessage }
    }
  },

  // =========================
  // ADD PROGRESS (POST ONLY)
  // =========================
  add_studyProgress: async (
    courseId: number | string,
    progressData: any
  ) => {
    set((state: Course_StoreType) => ({
      ...state,
      isUpdatingProgress: true,
      progressError: null
    }))

    try {
      const headers = {
        ...get().getAuthHeaders(),
        "Content-Type": "application/json"
      }

      const response = await fetch(
        `${apiUrl}/api/courses/${courseId}/progress`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(progressData),
        }
      )

      let result
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        const text = await response.text()
        result = { message: text }
      }

      if (!response.ok) {
        throw new Error(result.message || "Failed to create progress")
      }

      // refresh list after insert
      await get().fetch_studyProgress(courseId)

      set((state: Course_StoreType) => ({
        ...state,
        isUpdatingProgress: false,
        progressError: null
      }))

      return {
        success: true,
        message: result.message || "Progress created successfully",
        data: result
      }

    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create progress"

      set((state: Course_StoreType) => ({
        ...state,
        isUpdatingProgress: false,
        progressError: message
      }))

      return {
        success: false,
        message
      }
    }
  },

  // =========================
  // UPDATE PROGRESS (PUT)
  // =========================
  update_studyProgress: async (
    courseId: number | string,
    progressId: number | string,
    progressData: any
  ) => {
    set((state: Course_StoreType) => ({
      ...state,
      isUpdatingProgress: true,
      progressError: null
    }))

    try {
      const headers = {
        ...get().getAuthHeaders(),
        "Content-Type": "application/json"
      }

      const response = await fetch(
        `${apiUrl}/api/courses/${courseId}/progress/${progressId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(progressData),
        }
      )

      let result
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        const text = await response.text()
        result = { message: text }
      }

      if (!response.ok) {
        throw new Error(result.message || "Failed to update progress")
      }

      // refresh list after update
      await get().fetch_studyProgress(courseId)

      set((state: Course_StoreType) => ({
        ...state,
        isUpdatingProgress: false,
        progressError: null
      }))

      return {
        success: true,
        message: result.message || "Progress updated successfully",
        data: result
      }

    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update progress"

      set((state: Course_StoreType) => ({
        ...state,
        isUpdatingProgress: false,
        progressError: message
      }))

      return {
        success: false,
        message
      }
    }
  }
})