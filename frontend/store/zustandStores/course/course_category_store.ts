import { CategoryItem, CourseCategoryData, BackendCategoryDto } from "@/types/course"
import type { Course_StoreType } from "../../types"

type StoreSet = (
  fn: (state: Course_StoreType) => Partial<Course_StoreType>
) => void
type StoreGet = () => Course_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Course Category Store
export const courseCategoryStore = (set: StoreSet, get: StoreGet) => ({
  courseCategory_data: {
    trainer: [],
    selfStudy: []
  },

  // ==================== COURSE CATEGORY API ENDPOINTS ====================

  // Fetch course categories from API
  fetch_courseCategories: async () => {
    set((state: Course_StoreType) => ({ ...state, error: null }))
    try {
      const headers = get().getAuthHeaders()
      
      const response = await fetch(`${apiUrl}/api/course-categories`, {
        headers: headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const transformedData: CourseCategoryData = {
        trainer: [],
        selfStudy: []
      }

      if (data.categories && Array.isArray(data.categories)) {
        data.categories.forEach((category: BackendCategoryDto) => {
          if (category.is_deleted) return

          let selfStudyType: 'jlpt' | 'other' | undefined = undefined
          const nameLower = category.course_category_name.toLowerCase()

          if (nameLower.includes('jlpt') ||
            nameLower.includes('n5') ||
            nameLower.includes('n4') ||
            nameLower.includes('n3') ||
            nameLower.includes('n2') ||
            nameLower.includes('n1')) {
            selfStudyType = 'jlpt'
          } else {
            selfStudyType = 'other'
          }

          const categoryItem: CategoryItem = {
            id: category.id,
            value: category.course_category_name.toLowerCase().replace(/\s+/g, '-'),
            label: category.course_category_name,
            type: category.course_type === 'TRAINER_PROVIDED' ? 'trainer' : 'self-study',
            ...(category.course_type === 'SELF_STUDY' && {
              selfStudyType: selfStudyType
            })
          }

          if (category.course_type === 'TRAINER_PROVIDED') {
            transformedData.trainer.push(categoryItem)
          } else if (category.course_type === 'SELF_STUDY') {
            transformedData.selfStudy.push(categoryItem)
          }
        })
      }

      set((state: Course_StoreType) => ({
        ...state,
        courseCategory_data: transformedData,
        error: null
      }))
    } catch (error) {
      console.error('Error fetching course categories:', error)
      set((state: Course_StoreType) => ({
        ...state,
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        courseCategory_data: { trainer: [], selfStudy: [] }
      }))
    }
  },

  // POST /api/course-categories - Create a new category
  add_courseCategories: async (categoryName: string, courseType: 'trainer' | 'self-study') => {
    const previousData = get().courseCategory_data
    const apiCourseType = courseType === 'trainer' ? 'TRAINER_PROVIDED' : 'SELF_STUDY'

    const optimisticCategory: CategoryItem = {
      value: categoryName.toLowerCase().replace(/\s+/g, '-'),
      label: categoryName,
      type: courseType,
      ...(courseType === 'self-study' && {
        selfStudyType: categoryName.toLowerCase().includes('jlpt') ? 'jlpt' : 'other'
      })
    }

    const categoryKey = courseType === 'trainer' ? 'trainer' : 'selfStudy'
    set((state: Course_StoreType) => ({
      ...state,
      courseCategory_data: {
        ...state.courseCategory_data,
        [categoryKey]: [...state.courseCategory_data[categoryKey], optimisticCategory]
      },
      isCreating: true,
      error: null
    }))

    try {
      const headers = get().getAuthHeaders()
      
      const response = await fetch(`${apiUrl}/api/course-categories`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          course_category_name: categoryName,
          course_type: apiCourseType
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        set((state: Course_StoreType) => ({
          ...state,
          courseCategory_data: previousData,
          isCreating: false,
          error: result.message || 'Failed to create category'
        }))
        throw new Error(result.message || 'Failed to create category')
      }

      await get().fetch_courseCategories()

      set((state: Course_StoreType) => ({
        ...state,
        isCreating: false,
        error: null
      }))

      return {
        success: true,
        message: 'Category created successfully',
        category: result.category
      }

    } catch (error) {
      console.error('Error creating category:', error)
      set((state: Course_StoreType) => ({
        ...state,
        courseCategory_data: previousData,
        isCreating: false,
        error: error instanceof Error ? error.message : 'Failed to create category'
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create category'
      }
    }
  },

  // PUT /api/course-categories/:id - Update an existing category
// PUT /api/course-categories/:id - Update an existing category
update_courseCategories: async (categoryId: number, categoryName: string, courseType: 'trainer' | 'self-study') => {
  const previousData = get().courseCategory_data
  
  // Find the category in BOTH trainer and selfStudy lists
  let foundCategory: CategoryItem | undefined
  let currentCategoryKey: 'trainer' | 'selfStudy' | '' = ''

  // Check in trainer list
  const trainerCat = previousData.trainer.find((cat: CategoryItem) => cat.id === categoryId)
  if (trainerCat) {
    foundCategory = trainerCat
    currentCategoryKey = 'trainer'
  } else {
    // Check in selfStudy list
    const selfStudyCat = previousData.selfStudy.find((cat: CategoryItem) => cat.id === categoryId)
    if (selfStudyCat) {
      foundCategory = selfStudyCat
      currentCategoryKey = 'selfStudy'
    }
  }

  if (!foundCategory || !currentCategoryKey) {
    return {
      success: false,
      message: 'Category not found'
    }
  }

  const apiCourseType = courseType === 'trainer' ? 'TRAINER_PROVIDED' : 'SELF_STUDY'

  const updatedCategory: CategoryItem = {
    ...foundCategory,
    value: categoryName.toLowerCase().replace(/\s+/g, '-'),
    label: categoryName,
    type: courseType,
    ...(courseType === 'self-study' && {
      selfStudyType: categoryName.toLowerCase().includes('jlpt') ? 'jlpt' : 'other'
    })
  }

  // Update the category in the store optimistically
  const newCategoryData = { ...previousData }
  
  // Remove from current list
  if (currentCategoryKey === 'trainer') {
    newCategoryData.trainer = newCategoryData.trainer.filter(
      (cat: CategoryItem) => cat.id !== categoryId
    )
  } else {
    newCategoryData.selfStudy = newCategoryData.selfStudy.filter(
      (cat: CategoryItem) => cat.id !== categoryId
    )
  }
  
  // Add to the appropriate list based on the new type
  const targetKey = courseType === 'trainer' ? 'trainer' : 'selfStudy'
  if (targetKey === 'trainer') {
    newCategoryData.trainer = [...newCategoryData.trainer, updatedCategory]
  } else {
    newCategoryData.selfStudy = [...newCategoryData.selfStudy, updatedCategory]
  }

  set((state: Course_StoreType) => ({
    ...state,
    courseCategory_data: newCategoryData,
    isUpdating: true,
    error: null
  }))

  try {
    const headers = get().getAuthHeaders()
    
    // Just send the data to the backend - let the backend handle validation
    const response = await fetch(`${apiUrl}/api/course-categories/${categoryId}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify({
        course_category_name: categoryName,
        course_type: apiCourseType
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      // Revert on error
      set((state: Course_StoreType) => ({
        ...state,
        courseCategory_data: previousData,
        isUpdating: false,
        error: result.message || 'Failed to update category'
      }))
      return {
        success: false,
        message: result.message || 'Failed to update category'
      }
    }

    // Refetch categories to get the latest data from backend
    await get().fetch_courseCategories()

    set((state: Course_StoreType) => ({
      ...state,
      isUpdating: false,
      error: null
    }))

    return {
      success: true,
      message: 'Category updated successfully',
      category: result.category
    }

  } catch (error) {
    console.error('Error updating category:', error)
    set((state: Course_StoreType) => ({
      ...state,
      courseCategory_data: previousData,
      isUpdating: false,
      error: error instanceof Error ? error.message : 'Failed to update category'
    }))

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update category'
    }
  }
},

  // DELETE /api/course-categories/:id - Delete a category
  delete_courseCategories: async (categoryId: number) => {
    const previousData = get().courseCategory_data
    
    let categoryKey: 'trainer' | 'selfStudy' | '' = ''

    const trainerCat = previousData.trainer.find((cat: CategoryItem) => cat.id === categoryId)
    if (trainerCat) {
      categoryKey = 'trainer'
    } else {
      const selfStudyCat = previousData.selfStudy.find((cat: CategoryItem) => cat.id === categoryId)
      if (selfStudyCat) {
        categoryKey = 'selfStudy'
      }
    }

    if (!categoryKey) {
      return {
        success: false,
        message: 'Category not found'
      }
    }

    set((state: Course_StoreType) => ({
      ...state,
      courseCategory_data: {
        ...state.courseCategory_data,
        [categoryKey]: state.courseCategory_data[categoryKey].filter(
          (cat: CategoryItem) => cat.id !== categoryId
        )
      },
      isDeleting: true,
      error: null
    }))

    try {
      const headers = get().getAuthHeaders()
      
      const response = await fetch(`${apiUrl}/api/course-categories/${categoryId}`, {
        method: 'DELETE',
        headers: headers,
      })

      if (response.status === 403) {
        const errorMessage = 'You do not have permission to delete categories. Only administrators and approvers can perform this action.'
        
        set((state: Course_StoreType) => ({
          ...state,
          courseCategory_data: previousData,
          isDeleting: false,
          error: errorMessage
        }))
        
        return {
          success: false,
          message: errorMessage
        }
      }

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
          courseCategory_data: previousData,
          isDeleting: false,
          error: errorMessage
        }))
        
        return {
          success: false,
          message: errorMessage
        }
      }

      let result = null
      try {
        result = await response.json()
      } catch (e) {
        result = { success: true, message: 'Category deleted successfully' }
      }

      await get().fetch_courseCategories()

      set((state: Course_StoreType) => ({
        ...state,
        isDeleting: false,
        error: null
      }))

      return {
        success: true,
        message: result?.message || 'Category deleted successfully'
      }

    } catch (error) {
      console.error('Error deleting category:', error)
      set((state: Course_StoreType) => ({
        ...state,
        courseCategory_data: previousData,
        isDeleting: false,
        error: error instanceof Error ? error.message : 'Failed to delete category'
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete category'
      }
    }
  },

  // ==================== CATEGORY HELPER FUNCTIONS ====================

  // Helper function to get all categories as a flat array
  getAllCategories: () => {
    try {
      const state = get()
      const all: CategoryItem[] = []
      if (state.courseCategory_data) {
        state.courseCategory_data.trainer.forEach((cat: CategoryItem) => {
          all.push({ ...cat, type: 'trainer' })
        })
        state.courseCategory_data.selfStudy.forEach((cat: CategoryItem) => {
          all.push({ ...cat, type: 'self-study' })
        })
      }
      return all
    } catch (error) {
      console.error('Error getting all categories:', error)
      return []
    }
  },

  // Helper function to get category by value
  getCategoryByValue: (value: string) => {
    try {
      const state = get()
      const all = state.getAllCategories()
      return all.find((cat: CategoryItem) => cat.value === value)
    } catch (error) {
      console.error('Error getting category by value:', error)
      return undefined
    }
  },

  // Helper function to get category by ID
  getCategoryByIdFromStore: (id: number) => {
    try {
      const state = get()
      const all = state.getAllCategories()
      return all.find((cat: CategoryItem) => cat.id === id)
    } catch (error) {
      console.error('Error getting category by ID:', error)
      return undefined
    }
  },

  // Helper function to get category type
  getCategoryType: (value: string) => {
    try {
      const category = get().getCategoryByValue(value)
      return category?.type || null
    } catch (error) {
      console.error('Error getting category type:', error)
      return null
    }
  },

  // Helper function to get self-study type
  getSelfStudyType: (value: string) => {
    try {
      const category = get().getCategoryByValue(value)
      return category?.selfStudyType || 'other'
    } catch (error) {
      console.error('Error getting self-study type:', error)
      return 'other'
    }
  },
})