// components/courses/course-container.tsx
"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Kbd } from "@/components/ui/kbd"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ArrowLeft01Icon,
  CourseIcon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import { Course, CourseFormSubmitData } from "@/types/course"
import { CourseCard } from "../components/cards/course-card"
import { CourseDetail } from "../components/drawers/course/course-detail"
import { Trainer_CourseForm } from "./drawers/course/trainer-views/trainer-CourseForm"
import { mainStore } from "@/store/mainStore"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const STROKE_WIDTH = 2

interface CoursesContainerProps {
  searchPlaceholder?: string
  userRole?: "admin" | "learner" | "approver"
  selectedCourseId?: number | null
}

// Add this helper function at the top of the file, after imports
const formatLocalDateForAPI = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return ""
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Helper function to get course start date
const getCourseStartDate = (course: Course): Date | null => {
  if (course.courseType === "trainer") {
    const dates = course.groups?.map((g) => g.startDate).filter((d) => d) || []
    if (dates.length === 0) return null
    return new Date(Math.min(...dates.map((d) => d.getTime())))
  }
  // For self-study courses, use self_study_sessions
  if (course.self_study_sessions?.length > 0) {
    return course.self_study_sessions[0].date || null
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
  return course.self_study_sessions?.length || 0
}

export function CoursesContainer({
  searchPlaceholder = "Search courses...",
  userRole,
  selectedCourseId,
}: CoursesContainerProps) {
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
    isCreating,
    isUpdating,
    upload_CourseImage,
    delete_CourseImage,
    fetch_courseEnrollments,
  } = mainStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [hasProcessedSelectedId, setHasProcessedSelectedId] = useState(false)
  // Add a state to track the course being edited
  const [editingCourseRef, setEditingCourseRef] = useState<Course | null>(null)
  // Search input ref for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null)
  // Flag to track if we're coming from a successful save
  const [isSuccessfullySaved, setIsSuccessfullySaved] = useState(false)
      const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  

  // Keyboard shortcut for search focus (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Fetch courses and categories from API on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingCourses(true)
      await fetchAll_CourseData()
      await fetch_courseCategories()
      setIsLoadingCourses(false)
    }
    loadData()
  }, [fetchAll_CourseData, fetch_courseCategories])

  useEffect(() => {
    if (selectedCourseId) {
      setHasProcessedSelectedId(false)
    }
  }, [selectedCourseId])

  // Effect to find and open the course when selectedCourseId is provided
  useEffect(() => {
    // Only process if:
    // 1. We have a selectedCourseId
    // 2. Courses are loaded
    // 3. We haven't processed this ID yet
    if (!selectedCourseId || isLoadingCourses || hasProcessedSelectedId) {
      return
    }

    // Find the course (convert ID to string for comparison)
    const courseIdStr = selectedCourseId.toString()
    const foundCourse = courses.find((c: Course) => c.id === courseIdStr)

    if (foundCourse) {
      // Found the course - open it in detail view
      setSelectedCourse(foundCourse)
      setHasProcessedSelectedId(true)

      // Auto-select the correct tab based on course status
      if (foundCourse.status === 'draft' && activeTab !== 'draft') {
        setActiveTab('draft')
      } else if (foundCourse.status !== 'draft' && activeTab === 'draft') {
        setActiveTab('all')
      }
      return
    }

    // If course not found and we're not on 'all' tab, switch to 'all' and try again
    if (activeTab !== 'all') {
      setActiveTab('all')
      // The effect will re-run after state update
      return
    }

    // If still not found on 'all' tab, try to refresh data
    console.warn(`Course with ID ${selectedCourseId} not found. Refreshing...`)
    fetchAll_CourseData().then(() => {
      // After refresh, check again
      const refreshedCourse = courses.find((c: Course) => c.id === courseIdStr)
      if (refreshedCourse) {
        setSelectedCourse(refreshedCourse)
      }
      setHasProcessedSelectedId(true)
    })
  }, [selectedCourseId, courses, isLoadingCourses, hasProcessedSelectedId, activeTab, fetchAll_CourseData])

  const isAdmin = userRole === "admin"

  // Get current user's enrolled course IDs
  const { enrollments, getUserId } = mainStore()
  const currentUserId = getUserId?.() || null

  const userEnrolledCourseIds = useMemo(() => {
    if (!currentUserId) return new Set()
    const userEnrollments = enrollments.filter(
      (e: any) =>
        e.employeeId === currentUserId && e.enrollmentStatus !== "CANCELLED"
    )
    return new Set(userEnrollments.map((e: any) => e.courseId))
  }, [enrollments, currentUserId])

  // Get counts for each tab (admin)
  const getAdminTabCounts = useMemo(() => {
    const all = courses.length
    const draft = courses.filter((c: Course) => c.status === "draft").length
    const active = courses.filter(
      (c: Course) => c.status === "active" || c.status === "upcoming"
    ).length
    return { all, draft, active }
  }, [courses])

  // Get counts for each tab (learner)
  const getLearnerTabCounts = useMemo(() => {
    const all = courses.filter((c: Course) => c.status !== "draft").length
    const yourCourses = courses.filter(
      (c: Course) => userEnrolledCourseIds.has(c.id) && c.status !== "draft"
    ).length
    return { all, yourCourses }
  }, [courses, userEnrolledCourseIds])

  const filteredCourses = useMemo(() => {
    const search = searchTerm.toLowerCase()

    let filtered = courses
      .filter(() => {
        if (userRole === "admin") {
          return true
        }
        return true
      })
      .filter((course: Course) => {
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

    // Apply tab filter
    if (activeTab === "draft") {
      filtered = filtered.filter((course: Course) => course.status === "draft")
    } else if (activeTab === "active") {
      filtered = filtered.filter(
        (course: Course) => course.status === "active" || course.status === "upcoming"
      )
    } else if (activeTab === "your-courses") {
      filtered = filtered.filter((course: Course) =>
        userEnrolledCourseIds.has(course.id)
      )
    }

    return filtered
  }, [courses, searchTerm, userRole, activeTab, userEnrolledCourseIds])

  const handleView = (course: Course) => {
    setSelectedCourse(course)
  }

  const handleBackFromDetail = () => {
    setSelectedCourse(null)
  }

  const handleEdit = (course: Course) => {
    setEditingCourseRef(course)
    setSelectedCourse(null)
    setEditingCourse(course)
    setIsFormVisible(true)
    setIsSuccessfullySaved(false)
    setHasUnsavedChanges(false) // ✅ Start each edit session clean
  }

  const handleNewCourse = () => {
    setSelectedCourse(null)
    setEditingCourse(null)
    setIsFormVisible(true)
    setIsSuccessfullySaved(false)
    setHasUnsavedChanges(false) // ✅ Start each create session clean
  }

  // Function to close form without confirmation (used after successful save)
  const closeForm = () => {
    resetForm()
    setIsSubmitting(false)
    setIsSuccessfullySaved(false)
    setHasUnsavedChanges(false) // ✅ Always clear the dirty flag when the form closes

    // If we were editing a course, go back to the course detail
    if (editingCourseRef) {
      setSelectedCourse(editingCourseRef)
      setEditingCourseRef(null)
    }
  }

  // Handle cancel with confirmation
 const handleCancel = () => {
  const wasCreating = !editingCourseRef

  // Skip confirmation if we just saved successfully
  if (isSuccessfullySaved) {
    closeForm();
    return;
  }

  // Check if there are actual unsaved changes
  if (hasUnsavedChanges) {
    const confirmCancel = window.confirm(
      `You have unsaved changes. Are you sure you want to cancel editing "${editingCourse?.title || 'this course'}"? Your changes will be lost.`
    );

    if (!confirmCancel) {
      return; // User cancelled the cancellation
    }
  }

  closeForm(); // Also clears hasUnsavedChanges

  // If we were creating a new course, show a brief notification
  if (wasCreating) {
    alert("Course creation cancelled");
  }
};

  const handleDeleteCourse = async () => {
    if (editingCourse) {
      const result = await delete_CourseData(editingCourse.id)
      if (result.success) {
        resetForm()
        setIsSuccessfullySaved(false)
        setEditingCourseRef(null)
        setSelectedCourse(null)
        setIsFormVisible(false)
        await fetchAll_CourseData()
      } else {
        alert(result.message || "Failed to delete course")
      }
    }
  }

  const handleSubmit = async (data: CourseFormSubmitData) => {
    setIsSubmitting(true)

    try {
      const categoryId = data.course_category_id

      if (!categoryId) {
        alert("Please select a valid category")
        setIsSubmitting(false)
        return
      }

      // Get the category for display/label purposes (optional)
      const category = getCategoryByValue(data.category)

      const statusMap: Record<string, string> = {
        active: "OPEN",
        upcoming: "CLOSED",
        completed: "COMPLETED",
        draft: "DRAFT",
      }

      const currentStatus = data.status || "draft"
      const backendStatus = statusMap[currentStatus] || "DRAFT"

      // Prepare groups for trainer courses
      let newGroups = null
      if (
        data.courseType === "trainer" &&
        data.groups &&
        data.groups.length > 0
      ) {
        newGroups = data.groups.map((group: any, index: number) => {
          const existingGroup = editingCourse?.groups?.find(
            (g: any) => g.id === group.id
          )

          return {
            ...(editingCourse &&
              existingGroup?.id && { id: parseInt(existingGroup.id) }),
            group_name: group.name || `Group ${index + 1}`,
            capacity:
              group.capacity === "unlimited"
                ? null
                : Number(group.capacity) || null,
            start_date:
              group.startDate instanceof Date
                ? formatLocalDateForAPI(group.startDate)
                : group.startDate || null,
            end_date:
              group.endDate instanceof Date
                ? formatLocalDateForAPI(group.endDate)
                : group.endDate || null,
            sessions_per_week: group.sessionsPerWeek || [],
            group_status: group.status || "OPEN",
            sessions: (group.sessions || []).map(
              (session: any, sIndex: number) => {
                const existingSession = existingGroup?.sessions?.find(
                  (s: any) => s.id === session.id
                )

                return {
                  ...(editingCourse &&
                    existingSession?.id && {
                    id: parseInt(existingSession.id),
                  }),
                  session_no: sIndex + 1,
                  session_date:
                    session.date instanceof Date
                      ? formatLocalDateForAPI(session.date)
                      : session.date,
                  start_time: session.startTime || group.startTime || "09:00",
                  end_time: session.endTime || group.endTime || "10:00",
                  session_status: session.status || "PLANNED",
                }
              }
            ),
          }
        })
      }

      // Prepare self-study sessions
      let newSelfStudySessions = null
      if (
        data.courseType === "self-study" &&
        data.sessions &&
        data.sessions.length > 0
      ) {
        const isJLPT = data.selfStudyType === "jlpt"
        newSelfStudySessions = data.sessions.map(
          (session: any, index: number) => {
            const existingSession = editingCourse?.self_study_sessions?.find(
              (s: any) => s.id === session.id
            )

            return {
              ...(editingCourse &&
                existingSession?.id && { id: parseInt(existingSession.id) }),
              session_no: index + 1,
              duration_per_session: session.durationPerSession || 7,
              file_path: isJLPT ? null : session.link || null,
              filepath: isJLPT ? null : session.link || null,
              kanji_target: isJLPT ? session.kanjiCount || 0 : 0,
              vocabulary_target: isJLPT ? session.vocabularyCount || 0 : 0,
              grammar_target: isJLPT ? session.grammarCount || 0 : 0,
              reading_target_minutes: isJLPT ? session.readingMinutes || 0 : 0,
              listening_target_minutes: isJLPT
                ? session.listeningMinutes || 0
                : 0,
              session_status: session.status || "PLANNED",
            }
          }
        )
      }

      // Create the base course data
      const courseData: any = {
        course_name: data.title,
        course_category_id: Number(categoryId),
        trainer_name: data.trainerName || null,
        self_study_type: data.selfStudyType || null,
        target_level: data.targetLevel || null,
        total_sessions:
          data.courseType === "trainer"
            ? data.groups?.reduce(
              (total: number, g: any) => total + (g.sessions?.length || 0),
              0
            )
            : data.sessions?.length || 0,
        session_per_days:
          data.courseType === "self-study" ? data.daysPerSession : null,
        start_date: null,
        end_date: null,
        registration_deadline:
          data.registrationDeadline instanceof Date
            ? formatLocalDateForAPI(data.registrationDeadline)
            : data.registrationDeadline || null,
        status: backendStatus,
      }

      // ============ ADD DEFAULT GROUP 1 FOR SELF-STUDY ============
      if (
        data.courseType === "self-study" &&
        data.sessions &&
        data.sessions.length > 0
      ) {
        const existingGroup = editingCourse?.groups?.[0]
        const existingSessions = editingCourse?.self_study_sessions || []

        courseData.start_date = null
        courseData.end_date = null

        courseData.groups = [
          {
            ...(editingCourse &&
              existingGroup?.id && { id: parseInt(existingGroup.id) }),
            group_name: "Group 1",
            capacity: null,
            start_date: null,
            end_date: null,
            sessions_per_week: [],
            group_status: "OPEN",
            sessions: [],
          },
        ]
      }

      // Add trainer groups if applicable
      if (newGroups && data.courseType === "trainer") {
        courseData.groups = newGroups

        const allStartDates = newGroups
          .map((g: any) => g.start_date)
          .filter((d: any) => d)
        const allEndDates = newGroups
          .map((g: any) => g.end_date)
          .filter((d: any) => d)

        if (allStartDates.length > 0) {
          courseData.start_date = allStartDates.sort()[0]
        }
        if (allEndDates.length > 0) {
          courseData.end_date = allEndDates.sort()[allEndDates.length - 1]
        }
      }

      // Add self-study sessions
      if (newSelfStudySessions && data.courseType === "self-study") {
        courseData.self_study_sessions = newSelfStudySessions
      }

      let result
      if (editingCourse) {
        // ============ UPDATE MODE ============

        // For self-study, we need to handle the update carefully
        if (data.courseType === "self-study") {
          const clearPayload: any = {
            ...courseData,
            self_study_sessions: [],
            groups: courseData.groups
              ? [
                {
                  ...courseData.groups[0],
                  sessions: [],
                },
              ]
              : undefined,
          }

          await update_CourseData(editingCourse.id, clearPayload)
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        result = await update_CourseData(editingCourse.id, courseData)

        // Handle image changes during update
        if (result.success) {
          if (!data.imageUrl && editingCourse.imageUrl) {
            await delete_CourseImage(editingCourse.id)
          } else if (data.imageUrl && data.imageUrl.startsWith("data:")) {
            const res = await fetch(data.imageUrl)
            const blob = await res.blob()
            const file = new File(
              [blob],
              `course-${editingCourse.id}-${Date.now()}.jpg`,
              { type: blob.type || "image/jpeg" }
            )

            const imageFormData = new FormData()
            imageFormData.append("image", file)

            const imageResult = await upload_CourseImage(
              editingCourse.id,
              imageFormData
            )
            if (!imageResult.success) {
              console.error(
                "Image upload failed during update:",
                imageResult.message
              )
            }
          }
        }
      } else {
        // ============ CREATE MODE ============

        const formData = new FormData()
        const jsonBlob = new Blob([JSON.stringify(courseData)], {
          type: "application/json",
        })
        formData.append("data", jsonBlob)

        if (data.imageUrl && data.imageUrl.startsWith("data:")) {
          const res = await fetch(data.imageUrl)
          const blob = await res.blob()
          const file = new File([blob], `course-${Date.now()}.jpg`, {
            type: blob.type || "image/jpeg",
          })
          formData.append("image", file)
        }

        result = await add_CourseData(formData)
      }

      if (result.success) {
        // Set the flag to skip confirmation
        setIsSuccessfullySaved(true)
        
        // Close the form without confirmation
        closeForm()
        
        // Refresh data
        await fetchAll_CourseData()
        if (editingCourse) {
          await fetch_courseEnrollments(editingCourse.id)
        }
      } else {
        alert(result.message || "Failed to save course")
      }
    } catch (error) {
      console.error("Failed to save course:", error)
      alert("An error occurred while saving the course")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Learner view
  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <CardContent className="px-4">
          {selectedCourse ? (
            <CourseDetail
              course={selectedCourse}
              onEdit={handleEdit}
              onBack={handleBackFromDetail}
              userRole={userRole}
            />
          ) : (
            <>
              {/* Tabs and Search Bar */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Tabs
                  defaultValue="all"
                  value={activeTab}
                  onValueChange={(value) => {
                    setActiveTab(value)
                    setSearchTerm("")
                  }}
                >
                  <TabsList className="h-auto">
                    <TabsTrigger value="all" className="gap-2">
                      All
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-5 px-1.5 text-xs",
                          activeTab === "all"
                            ? "bg-secondary"
                            : "bg-muted-foreground/20 text-muted-foreground"
                        )}
                      >
                        {getLearnerTabCounts.all}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="your-courses" className="gap-2">
                      Your Courses
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-5 px-1.5 text-xs",
                          activeTab === "your-courses"
                            ? "bg-secondary"
                            : "bg-muted-foreground/20 text-muted-foreground"
                        )}
                      >
                        {getLearnerTabCounts.yourCourses}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <InputGroup className="w-full max-w-sm sm:w-[250px]">
                  <InputGroupInput
                    ref={searchInputRef}
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                    }}
                  />
                  <InputGroupAddon>
                    <HugeiconsIcon
                      icon={Search01Icon}
                      strokeWidth={2}
                      className="h-4 w-4 text-muted-foreground"
                    />
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <Kbd>Ctrl + K</Kbd>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              {/* Course Grid */}
              {filteredCourses.length > 0 ? (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredCourses.map((course: Course, index: number) => {
                    if (course.status !== "draft") {
                      return (
                        <CourseCard
                          key={index}
                          course={course}
                          onView={handleView}
                        />
                      )
                    }
                  })}
                </div>
              ) : (
                <Empty className="mt-6 h-full">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <HugeiconsIcon
                        icon={CourseIcon}
                        strokeWidth={1.5}
                        className="h-8 w-8"
                      />
                    </EmptyMedia>
                    <EmptyTitle>
                      {searchTerm
                        ? "No courses found"
                        : activeTab === "your-courses"
                          ? "No enrolled courses"
                          : "No courses available"}
                    </EmptyTitle>
                    <EmptyDescription className="max-w-xs text-pretty">
                      {searchTerm
                        ? `No courses match "${searchTerm}". Try adjusting your search.`
                        : activeTab === "your-courses"
                          ? "You haven't enrolled in any courses yet. Browse available courses to get started."
                          : "There are no courses available at the moment. Check back later."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </>
          )}
        </CardContent>
      </div>
    )
  }

  // Admin view
  return (
    <div className="flex flex-col gap-4 pt-4">
      <CardContent className="px-4">
        {isFormVisible ? (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                strokeWidth={2}
                className="h-4 w-4"
              />
            </Button>
            <h2 className="text-lg font-semibold">
              {editingCourse ? "Edit Course" : "Create New Course"}
            </h2>
          </div>
        ) : selectedCourse ? (
          <CourseDetail
            course={selectedCourse}
            onEdit={handleEdit}
            onBack={handleBackFromDetail}
            userRole={userRole}
          />
        ) : (
          <>
            {/* Tabs and Search Bar + New Course Button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Tabs
                defaultValue="all"
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value)
                  setSearchTerm("")
                }}
              >
                <TabsList className="h-auto">
                  <TabsTrigger value="all" className="gap-2">
                    All
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 px-1.5 text-xs",
                        activeTab === "all"
                          ? "bg-secondary"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {getAdminTabCounts.all}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="draft" className="gap-2">
                    Draft
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 px-1.5 text-xs",
                        activeTab === "draft"
                          ? "bg-secondary"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {getAdminTabCounts.draft}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="active" className="gap-2">
                    Active
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 px-1.5 text-xs",
                        activeTab === "active"
                          ? "bg-secondary"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {getAdminTabCounts.active}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex w-full items-center gap-2 sm:w-auto">
                <InputGroup className="flex-1 sm:w-[300px]">
                  <InputGroupInput
                    ref={searchInputRef}
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                    }}
                  />
                  <InputGroupAddon>
                    <HugeiconsIcon
                      icon={Search01Icon}
                      strokeWidth={2}
                      className="h-4 w-4 text-muted-foreground"
                    />
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <Kbd>Ctrl + K</Kbd>
                  </InputGroupAddon>
                </InputGroup>
                <Button
                  variant="default"
                  onClick={handleNewCourse}
                  className="shrink-0 bg-primary hover:bg-primary/90"
                >
                  <HugeiconsIcon icon={CourseIcon} strokeWidth={2} />
                  New Course
                </Button>
              </div>
            </div>

            {/* Course Grid */}
            {filteredCourses.length > 0 ? (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCourses.map((course: Course, index: number) => (
                  <CourseCard
                    key={index}
                    course={course}
                    onView={handleView}
                  />
                ))}
              </div>
            ) : (
              <Empty className="mt-6 h-full">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HugeiconsIcon
                      icon={CourseIcon}
                      strokeWidth={1.5}
                      className="h-8 w-8"
                    />
                  </EmptyMedia>
                  <EmptyTitle>
                    {searchTerm
                      ? "No courses found"
                      : activeTab === "draft"
                        ? "No draft courses"
                        : activeTab === "active"
                          ? "No active courses"
                          : "No courses available"}
                  </EmptyTitle>
                  <EmptyDescription className="max-w-xs text-pretty">
                    {searchTerm
                      ? `No courses match "${searchTerm}". Try adjusting your search.`
                      : activeTab === "draft"
                        ? "You don't have any draft courses. Create a new course to see it here."
                        : activeTab === "active"
                          ? "There are no active courses. Publish a course to see it here."
                          : "Get started by creating your first course."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </>
        )}

        {isFormVisible && !selectedCourse && isAdmin && (
          <div className="mt-6">
            <Trainer_CourseForm
              mode={editingCourse ? "edit" : "add"}
              initialData={editingCourse as any}
              initialImage={editingCourse?.imageUrl || null}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              onDelete={handleDeleteCourse}
              isSubmitting={isSubmitting || isCreating || isUpdating}
               onChanges={setHasUnsavedChanges}
                disableSubmit={editingCourse ? !hasUnsavedChanges : false}
            />
          </div>
        )}
      </CardContent>
    </div>
  )
}