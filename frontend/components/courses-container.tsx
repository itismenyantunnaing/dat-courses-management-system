// components/courses/course-container.tsx
"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  DiplomaIcon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { Course, type CourseCategory } from "@/types/course"
import { CourseCard } from "../components/cards/course-card"
import { CourseDetail } from "../components/drawers/course/course-detail"
import { Trainer_CourseForm } from "./drawers/course/trainer-views/trainer-CourseForm"
import { mainStore } from "@/store/mainStore"
import { format } from "date-fns"

const STROKE_WIDTH = 2

// Helper function to get course start date
const getCourseStartDate = (course: Course): Date | null => {
  if (course.courseType === "trainer") {
    const dates = course.groups?.map((g) => g.startDate).filter((d) => d) || []
    if (dates.length === 0) return null
    return new Date(Math.min(...dates.map((d) => d.getTime())))
  }
  if (course.sessions?.length > 0) {
    return course.sessions[0].date
  }
  return null
}

// Helper function to get course sessions count
const getCourseSessionsCount = (course: Course): number => {
  if (course.courseType === "trainer") {
    return (
      course.groups?.reduce((total, g) => total + g.sessions.length, 0) || 0
    )
  }
  return course.sessions?.length || 0
}

export function CoursesContainer({ searchPlaceholder = "Search courses..." }) {
  const {
    courses,
    fetchAll_CourseData,
    fetch_courseCategories,
    add_CourseData,
    update_CourseData,
    delete_CourseData,
    isFormVisible,
    editingCourse,
    setIsFormVisible,
    setEditingCourse,
    resetForm,
    getCategoryByValue,
    getUserRole,
    isCreating,
    isUpdating,
    isDeleting,
    upload_CourseImage,
    delete_CourseImage,
    
  } = mainStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  // Fetch courses and categories from API on mount
  useEffect(() => {
    fetchAll_CourseData()
    fetch_courseCategories()
  }, [fetchAll_CourseData, fetch_courseCategories])

  const userRole = "LEARNER" // getUserRole()

  const canEditTrainerCourses = userRole === "ADMIN" || userRole === "APPROVER"
  const isLearner = userRole === "LEARNER"

  const filteredCourses = useMemo(() => {
    const search = searchTerm.toLowerCase()

    return courses
      .filter(() => {
        if (userRole === "ADMIN" || userRole === "APPROVER") {
          return true
        }
        return true
      })
      .filter((course) => {
        const startDate = getCourseStartDate(course)
        const dateStr = startDate
          ? format(startDate, "MMM yyyy").toLowerCase()
          : ""
        const sessionsCount = getCourseSessionsCount(course)

        return (
          course.title.toLowerCase().includes(search) ||
          course.status.toLowerCase().includes(search) ||
          dateStr.includes(search) ||
          sessionsCount.toString().includes(search)
        )
      })
  }, [courses, searchTerm, userRole])

  const handleView = (course: Course) => {
    setSelectedCourse(course)
  }

  const handleBackFromDetail = () => {
    setSelectedCourse(null)
  }

  const handleEdit = (course: Course) => {
    setSelectedCourse(null)
    setEditingCourse(course)
    setIsFormVisible(true)
  }

  const handleNewCourse = () => {
    setSelectedCourse(null)
    setEditingCourse(null)
    setIsFormVisible(true)
  }

  const handleCancel = () => {
    resetForm()
    setIsSubmitting(false)
  }

  const handleDeleteCourse = async () => {
    if (editingCourse) {
      const result = await delete_CourseData(editingCourse.id)
      if (result.success) {
        resetForm()
      } else {
        alert(result.message || 'Failed to delete course')
      }
    }
  }


  const handleSubmit = async (data: CourseCategory) => {
    setIsSubmitting(true)

    try {
      // Get the category from the store using the category value
      const category = getCategoryByValue(data.category)

      if (!category) {
        alert('Please select a valid category')
        setIsSubmitting(false)
        return
      }

      // Map frontend status to backend status
      const statusMap: Record<string, string> = {
        'active': 'OPEN',
        'upcoming': 'CLOSED',
        'completed': 'COMPLETED',
        'draft': 'DRAFT'
      }
      
      // Use the status from the course if it's an edit, otherwise default to draft
      const currentStatus = editingCourse?.status || 'draft'
      const backendStatus = statusMap[currentStatus] || 'DRAFT'

      // Prepare groups for API if applicable
      let newGroups = null
      if (data.courseType === 'trainer' && data.groups && data.groups.length > 0) {
        newGroups = data.groups.map((group: any, index: number) => ({
          group_name: group.name || `Group ${index + 1}`,
          capacity: group.capacity === 'unlimited' ? null : (Number(group.capacity) || null),
          sessions: (group.sessions || []).map((session: any, sIndex: number) => ({
            session_no: sIndex + 1,
            session_date: session.date instanceof Date ? session.date.toISOString().split('T')[0] : session.date,
            start_time: session.startTime || "09:00",
            end_time: session.endTime || "10:00",
            session_status: 'PLANNED'
          }))
        }))
      }

      // Prepare self-study sessions for API if applicable
      let newSelfStudySessions = null
      if (data.courseType === 'self-study' && data.sessions && data.sessions.length > 0) {
        const isJLPT = data.selfStudyType === 'jlpt'
        newSelfStudySessions = data.sessions.map((session: any, index: number) => ({
          session_no: index + 1,
          session_deadline: session.date instanceof Date ? session.date.toISOString().split('T')[0] : session.date,
          file_path: isJLPT ? null : (session.link || null),
          filepath: isJLPT ? null : (session.link || null),
          kanji_target: isJLPT ? (session.kanjiCount || 0) : 0,
          vocabulary_target: isJLPT ? (session.vocabularyCount || 0) : 0,
          grammar_target: isJLPT ? (session.grammarCount || 0) : 0,
          reading_target_minutes: isJLPT ? (session.readingMinutes || 0) : 0,
          listening_target_minutes: isJLPT ? (session.listeningMinutes || 0) : 0,
          session_status: 'PLANNED'
        }))
      }

      // Create the JSON data object for API
      const courseData: any = {
        course_name: data.title,
        course_category_id: Number(category.id),
        trainer_name: data.trainerName || null,
        self_study_type: data.selfStudyType || null,
        total_sessions: data.courseType === 'trainer'
          ? data.groups?.reduce((total: number, g: any) => total + (g.sessions?.length || 0), 0)
          : data.sessions?.length || 0,
        registration_deadline: data.registrationDeadline instanceof Date 
          ? data.registrationDeadline.toISOString().split('T')[0] 
          : data.registrationDeadline || null,
        status: backendStatus,
      }

      if (newGroups) courseData.groups = newGroups
      if (newSelfStudySessions) courseData.self_study_sessions = newSelfStudySessions

      console.log('=== COURSE DATA ===')
      console.log('JSON being prepared:', JSON.stringify(courseData, null, 2))
      console.log('===================')

      let result
      if (editingCourse) {
        // --- HACK FOR BACKEND DUPLICATE ENTRY ISSUE ---
        // The backend deletes and re-inserts groups/sessions. Hibernate's action queue
        // often tries to INSERT before DELETE for entities with the same unique key
        // in the same transaction, causing "Duplicate entry" errors.
        // To fix this from the frontend, we send a preliminary update to clear the 
        // existing groups/sessions in a separate transaction.
        
        const hasGroups = !!courseData.groups
        const hasSessions = !!courseData.self_study_sessions
        
        if (hasGroups || hasSessions) {
          console.log('Performing preliminary clear to avoid duplicate entry conflict...')
          const clearPayload: any = { ...courseData }
          if (hasGroups) clearPayload.groups = []
          if (hasSessions) clearPayload.self_study_sessions = []
          
          await update_CourseData(editingCourse.id, clearPayload)
          // Small delay to ensure backend transaction is fully committed if needed
          // await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        result = await update_CourseData(editingCourse.id, courseData)

        // Handle image changes during update
        if (result.success) {
          // Case 1: Image removed
          if (!data.imageUrl && editingCourse.imageUrl) {
            console.log('Deleting course image...')
            await delete_CourseImage(editingCourse.id)
          } 
          // Case 2: Image changed to a new one
          else if (data.imageUrl && data.imageUrl.startsWith("data:")) {
            console.log('Uploading new course image...')
            const res = await fetch(data.imageUrl)
            const blob = await res.blob()
            const file = new File(
              [blob],
              `course-${editingCourse.id}-${Date.now()}.jpg`,
              { type: blob.type || "image/jpeg" }
            )
            
            const imageFormData = new FormData()
            imageFormData.append("image", file)
            
            const imageResult = await upload_CourseImage(editingCourse.id, imageFormData)
            if (!imageResult.success) {
              console.error("Image upload failed during update:", imageResult.message)
            }
          }
        }
      } else {
        // Create FormData for new courses (to include image)
        const formData = new FormData()
        const jsonBlob = new Blob([JSON.stringify(courseData)], { type: 'application/json' })
        formData.append('data', jsonBlob)

        // Add image if selected
        if (data.imageUrl && data.imageUrl.startsWith("data:")) {
          const res = await fetch(data.imageUrl)
          const blob = await res.blob()
          const file = new File(
            [blob],
            `course-${Date.now()}.jpg`,
            { type: blob.type || "image/jpeg" }
          )
          formData.append("image", file)
        }

        result = await add_CourseData(formData)
      }

      if (result.success) {
        handleCancel()
        await fetchAll_CourseData()
      } else {
        alert(result.message || 'Failed to save course')
      }
    } catch (error) {
      console.error("Failed to save course:", error)
      alert('An error occurred while saving the course')
    } finally {
      setIsSubmitting(false)
    }
  }


  // Learner view
  if (isLearner) {
    return (
      <div className="flex flex-col gap-4 py-6">
        <CardContent className="px-4">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {selectedCourse ? (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleBackFromDetail}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="h-4 w-4" />
                  Back
                </Button>
                <h2 className="text-lg font-semibold">Course Details</h2>
              </div>
            ) : (
              <>
                <div className="relative max-w-sm flex-1">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    strokeWidth={STROKE_WIDTH}
                    className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground"
                  />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </>
            )}
          </div>

          {selectedCourse && (
            <div className="p-2">
              <CourseDetail
                course={selectedCourse}
                onEdit={handleEdit}
                onBack={handleBackFromDetail}
                userRole={userRole}
              />
            </div>
          )}

          {!selectedCourse && (
            <>
              {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredCourses.map((course) => (
                    <CourseCard key={course.id} course={course} onView={handleView} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border bg-card p-8 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No courses found matching your search"
                      : "No courses available."}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </div>
    )
  }

  // Admin view
  return (
    <div className="flex flex-col gap-4 py-6">
      <CardContent className="px-4">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {isFormVisible ? (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="h-4 w-4" />
                Back
              </Button>
              <h2 className="text-lg font-semibold">
                {editingCourse ? "Edit Course" : "Create New Course"}
              </h2>
            </div>
          ) : selectedCourse ? (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBackFromDetail}>
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="h-4 w-4" />
                Back
              </Button>
              <h2 className="text-lg font-semibold">Course Details</h2>
            </div>
          ) : (
            <>
              <div className="relative max-w-sm flex-1">
                <HugeiconsIcon
                  icon={Search01Icon}
                  strokeWidth={STROKE_WIDTH}
                  className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground"
                />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={handleNewCourse}
                  className="bg-primary hover:bg-primary/90"
                >
                  <HugeiconsIcon icon={DiplomaIcon} strokeWidth={2} />
                  New Course
                </Button>
              </div>
            </>
          )}
        </div>

        {selectedCourse && (
          <div className="p-2">
            <CourseDetail
              course={selectedCourse}
              onEdit={handleEdit}
              onBack={handleBackFromDetail}
              userRole={userRole}
            />
          </div>
        )}

        {isFormVisible && !selectedCourse && canEditTrainerCourses && (
          <div className="p-2">
            <Trainer_CourseForm
              mode={editingCourse ? "edit" : "add"}
              initialData={editingCourse || undefined}
              initialImage={editingCourse?.imageUrl || null}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              onDelete={handleDeleteCourse}
              isSubmitting={isSubmitting || isCreating || isUpdating}
            />
          </div>
        )}

        {!isFormVisible && !selectedCourse && (
          <>
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} onView={handleView} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No courses found matching your search"
                    : "No courses available. Create your first course!"}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </div>
  )
}