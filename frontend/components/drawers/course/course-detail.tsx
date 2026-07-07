// components/drawers/course/course-detail.tsx
"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SaveIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  UserGroupIcon,
  Edit03Icon,
  BookOpenIcon,
  ClockIcon,
  UserIcon,
  Calendar05Icon,
  InformationCircleIcon,
  Megaphone02Icon,
  User02Icon,
  UserMinus01Icon,
  CheckCircle,
  CheckmarkCircle01Icon,
  CodeCircleIcon,
  AlertCircleIcon,
  Clock04Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons"
import {
  Course,
  COURSE_TYPE_LABELS,
  COURSE_STATUS_LABELS,
  isJLPTType,
} from "@/types/course"
import { format, isPast, isFuture, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { mainStore } from "@/store/mainStore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CourseDetailProps {
  course: Course
  onEdit: (course: Course) => void
  onBack: () => void
  userRole: string
  onRegister?: (course: Course) => void
  isRegistered?: boolean
}

interface EnrolledEmployee {
  id: number
  employeeId: string
  employeeName: string
  email: string
  departmentId: number
  departmentName: string
  teamId: number
  teamName: string
  position: string
  courseGroupId: number
  courseGroupName: string
  enrollmentStatus: string
  enrolledAt: string
  pfImage?: string
}

interface ProgressData {
  id?: number
  enrollment_id?: number
  employee_id?: string
  employee_name?: string
  self_study_session_id?: number
  session_no?: number
  session_deadline?: string
  kanji_count?: number
  vocabulary_count?: number
  grammar_count?: number
  reading_minutes?: number
  listening_minutes?: number
  completion_status?: string
  started_at?: string
  completed_at?: string
  updated_at?: string
  kanji_progress_percent?: number
  vocabulary_progress_percent?: number
  grammar_progress_percent?: number
  reading_progress_percent?: number
  listening_progress_percent?: number
}

// Attendance types
interface AttendanceRecord {
  id: number
  enrollmentId: number
  employeeId: string
  employeeName: string
  courseSessionId: number
  sessionNo: number
  sessionDate: string
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  registeredAt: string
}

// Mock announcements - you can replace this with actual data from your course
const getMockAnnouncements = (courseId: string) => {
  return [
    {
      id: "1",
      title: "Welcome to the Course!",
      content:
        "Welcome everyone! Please review the course materials before the first session.",
      createdAt: new Date(2026, 5, 20),
      author: "Instructor",
      priority: "high" as const,
    },
    {
      id: "2",
      title: "Schedule Update",
      content:
        "Please note that the session on July 15th has been rescheduled to July 16th.",
      createdAt: new Date(2026, 5, 22),
      author: "Admin",
      priority: "medium" as const,
    },
    {
      id: "3",
      title: "Course Materials Available",
      content:
        "The course materials for Week 1 are now available in the resources section.",
      createdAt: new Date(2026, 5, 23),
      author: "Instructor",
      priority: "low" as const,
    },
  ]
}

// Helper function to get initials from name
const getInitials = (name: string) => {
  if (!name) return "??"
  const parts = name.split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 30) => {
  if (!text) return ""
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
}

// Helper function to capitalize first letter
const capitalizeFirstLetter = (str: string) => {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Helper to get attendance status color
const getAttendanceStatusColor = (status: string) => {
  switch (status) {
    case 'PRESENT':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'ABSENT':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'LATE':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'EXCUSED':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

// Helper to get attendance status icon
const getAttendanceStatusIcon = (status: string) => {
  switch (status) {
    case 'PRESENT':
      return CheckmarkCircle01Icon
    case 'ABSENT':
      return CodeCircleIcon
    case 'LATE':
      return Clock04Icon
    case 'EXCUSED':
      return AlertCircleIcon
    default:
      return AlertCircleIcon
  }
}

export function CourseDetail({
  course,
  onEdit,
  onBack,
  userRole,
  onRegister,
  isRegistered = false,
}: CourseDetailProps) {
  const isAdmin = userRole === "admin" || userRole === "approver"
  const isLearner = userRole === "learner"
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isUnenrolling, setIsUnenrolling] = useState(false)
  const [enrolledEmployees, setEnrolledEmployees] = useState<EnrolledEmployee[]>([])
  const [currentUserEnrollment, setCurrentUserEnrollment] = useState<EnrolledEmployee | null>(null)
  const [savedProgress, setSavedProgress] = useState<{ [key: string]: ProgressData }>({})
  const [sessionInputs, setSessionInputs] = useState<{ [key: string]: any }>({})
  const [savingSessions, setSavingSessions] = useState<{ [key: string]: boolean }>({})

  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [attendanceStatuses, setAttendanceStatuses] = useState<{ [key: string]: string }>({})
  const [savingAttendance, setSavingAttendance] = useState<{ [key: string]: boolean }>({})
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  // Check if user is enrolled
  const isUserEnrolled = !!currentUserEnrollment && currentUserEnrollment.enrollmentStatus === 'APPROVED'
  const {
    fetch_courseEnrollments,
    enrollEmployee,
    unenrollEmployee,
    getMyEnrollment,
    getUserId,
    studyProgress,
    fetch_studyProgress,
    add_studyProgress,
    update_studyProgress,
    // Add attendance methods here
    fetchAttendance,
    createAttendance,
    updateAttendance,
  } = mainStore();

  // Get current user ID
  const currentUserId = getUserId?.() || null

  // Fetch study progress when course loads and user is enrolled
  useEffect(() => {
    if (course.id && isUserEnrolled && course.courseType === "self-study") {
      fetch_studyProgress(course.id)
    }
  }, [course.id, isUserEnrolled, course.courseType])

  // Fetch attendance for trainer-provided courses
  useEffect(() => {
    if (course.id && course.courseType === "trainer" && isUserEnrolled) {
      loadAttendance()
    }
  }, [course.id, course.courseType, isUserEnrolled])

  const loadAttendance = async () => {
    setLoadingAttendance(true)
    try {
      // Fetch attendance for each group
      const groups = course.groups || []
      let allAttendance: AttendanceRecord[] = []

      for (const group of groups) {
        const result = await fetchAttendance(course.id, parseInt(group.id))
        if (result && Array.isArray(result)) {
          allAttendance = [...allAttendance, ...result]
        } else if (result?.attendance && Array.isArray(result.attendance)) {
          allAttendance = [...allAttendance, ...result.attendance]
        }
      }

      // Replace the entire attendance records state
      setAttendanceRecords(allAttendance)
    } catch (error) {
      console.error('Error loading attendance:', error)
    } finally {
      setLoadingAttendance(false)
    }
  }

  console.log(studyProgress)

  // Update saved progress when studyProgress changes
  useEffect(() => {
    if (studyProgress && studyProgress.progress && Array.isArray(studyProgress.progress)) {
      const progressMap: { [key: string]: ProgressData } = {}

      studyProgress.progress.forEach((p: ProgressData) => {
        if (p.self_study_session_id) {
          // Use composite key: session_id + employee_id to differentiate
          // For the current user, use the simple key for backward compatibility
          if (p.employee_id === currentUserId) {
            // Use simple key for current user (for existing code to work)
            progressMap[p.self_study_session_id.toString()] = {
              ...p,
              id: p.id
            }
          } else {
            // For other users, use composite key
            const compositeKey = `${p.self_study_session_id}-${p.employee_id}`
            progressMap[compositeKey] = {
              ...p,
              id: p.id
            }
          }
        }
      })
      setSavedProgress(progressMap)

      // Debug: Log what's stored
      console.log('Saved Progress Map:', progressMap)
      console.log('Current User ID:', currentUserId)
    }
  }, [studyProgress, currentUserId])

  // Check if current user is enrolled
  useEffect(() => {
    if (enrolledEmployees.length > 0 && currentUserId) {
      const userEnrollment = enrolledEmployees.find(
        emp => emp.employeeId === currentUserId
      )
      setCurrentUserEnrollment(userEnrollment || null)
    } else {
      setCurrentUserEnrollment(null)
    }
  }, [enrolledEmployees, currentUserId])

  useEffect(() => {
    const loadEnrollments = async () => {
      setIsLoadingEnrollments(true)
      try {
        const result = await fetch_courseEnrollments(course.id)
        console.log('Enrollment result:', result)

        if (Array.isArray(result)) {
          console.log('Setting enrollments from array:', result)
          setEnrolledEmployees(result)
        } else if (result && result.success && Array.isArray(result.data)) {
          console.log('Setting enrollments from result.data:', result.data)
          setEnrolledEmployees(result.data)
        } else if (result && result.data && Array.isArray(result.data)) {
          console.log('Setting enrollments from data:', result.data)
          setEnrolledEmployees(result.data)
        } else {
          console.log('Unexpected result format:', result)
          setEnrolledEmployees([])
        }
      } catch (error) {
        console.error('Error loading enrollments:', error)
        setEnrolledEmployees([])
      } finally {
        setIsLoadingEnrollments(false)
      }
    }

    if (course.id) {
      loadEnrollments()
    }
  }, [fetch_courseEnrollments, course.id])

  // Initialize session inputs
  useEffect(() => {
    const initialInputs: { [key: string]: any } = {}
    const sessions = course.self_study_sessions?.length > 0 ? course.self_study_sessions : course.sessions || []

    sessions.forEach((session) => {
      const existingProgress = savedProgress[session.id?.toString()]
      if (existingProgress) {
        initialInputs[session.id] = {
          kanjiCount: existingProgress.kanji_count || 0,
          vocabularyCount: existingProgress.vocabulary_count || 0,
          grammarCount: existingProgress.grammar_count || 0,
          readingMinutes: existingProgress.reading_minutes || 0,
          listeningMinutes: existingProgress.listening_minutes || 0,
        }
      } else {
        initialInputs[session.id] = {
          kanjiCount: 0,
          vocabularyCount: 0,
          grammarCount: 0,
          readingMinutes: 0,
          listeningMinutes: 0,
        }
      }
    })
    setSessionInputs(initialInputs)
  }, [course, savedProgress])

  // Update the enrollment status check
  useEffect(() => {
    if (enrolledEmployees.length > 0 && currentUserId) {
      const enrollment = enrolledEmployees.find(
        emp => emp.employeeId === currentUserId
      )
      setCurrentUserEnrollment(enrollment || null)
    } else {
      setCurrentUserEnrollment(null)
    }
  }, [enrolledEmployees, currentUserId])

  // Group employees by courseGroupId
  const getEmployeesByGroup = (groupId: number) => {
    return enrolledEmployees.filter(emp => emp.courseGroupId === groupId)
  }

  // Get unique statuses from enrolled employees
  const getUniqueStatuses = (employees: EnrolledEmployee[]) => {
    const statuses = employees.map(emp => emp.enrollmentStatus)
    return [...new Set(statuses)]
  }

  // Filter employees by status
  const getEmployeesByStatus = (employees: EnrolledEmployee[], status: string) => {
    return employees.filter(emp => emp.enrollmentStatus === status)
  }

  // Get attendance for a specific session and employee
  const getAttendanceForSession = (sessionId: number, enrollmentId: number) => {
    return attendanceRecords.find(
      record => record.courseSessionId === sessionId && record.enrollmentId === enrollmentId
    )
  }

  const getTotalSessions = () => {
    if (course.courseType === "trainer") {
      return (
        course.groups?.reduce(
          (total, group) => total + group.sessions.length,
          0
        ) || 0
      )
    }
    return course.self_study_sessions?.length || course.sessions?.length || 0
  }

  const getTotalCapacity = () => {
    if (course.courseType === "trainer") {
      const capacities = course.groups?.map((g) => g.capacity) || []
      const hasUnlimited = capacities.some((c) => c === "unlimited")
      if (hasUnlimited) return "Unlimited"
      const total = capacities.reduce(
        (sum, c) => sum + (typeof c === "number" ? c : 0),
        0
      )
      return total.toString()
    }
    return "N/A"
  }

  const getGroupCount = () => {
    if (course.courseType === "trainer") {
      return course.groups?.length || 0
    }
    return 0
  }

  const getStartDate = () => {
    if (course.courseType === "trainer" && course.groups?.length > 0) {
      const dates = course.groups.map((g) => g.startDate).filter((d) => d)
      if (dates.length === 0) return null
      return new Date(Math.min(...dates.map((d) => d.getTime())))
    }
    return null
  }

  const getEndDate = () => {
    if (course.courseType === "trainer" && course.groups?.length > 0) {
      const dates = course.groups.map((g) => g.endDate).filter((d) => d)
      if (dates.length === 0) return null
      return new Date(Math.max(...dates.map((d) => d.getTime())))
    }
    return null
  }

  const totalSessions = getTotalSessions()
  const totalCapacity = getTotalCapacity()
  const groupCount = getGroupCount()
  const startDate = getStartDate()
  const endDate = getEndDate()

  const statusColors = {
    active: "bg-green-500",
    upcoming: "bg-blue-500",
    completed: "bg-gray-500",
    draft: "bg-yellow-500",
  }

  // Get announcements for this course
  const announcements = getMockAnnouncements(course.id)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-red-500"
      case "medium":
        return "border-l-4 border-yellow-500"
      case "low":
        return "border-l-4 border-blue-500"
      default:
        return "border-l-4 border-gray-300"
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700"
      case "medium":
        return "bg-yellow-100 text-yellow-700"
      case "low":
        return "bg-blue-100 text-blue-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  // In course-detail.tsx, update the handleRegister function
  const handleRegister = async () => {
    if (!course.groups || course.groups.length === 0) {
      alert('No groups available for enrollment')
      return
    }

    // Get the first group ID (you might want to let user select which group)
    const firstGroupId = parseInt(course.groups[0].id)

    setIsEnrolling(true)
    try {
      const result = await enrollEmployee(course.id, firstGroupId)

      if (result.success) {
        alert(result.message || 'Successfully enrolled in the course!')

        // Refresh enrollments to show updated list
        const refreshResult = await fetch_courseEnrollments(course.id)
        if (Array.isArray(refreshResult)) {
          setEnrolledEmployees(refreshResult)
        }

        // Call the parent onRegister callback if provided
        if (onRegister) {
          onRegister(course)
        }
      } else {
        alert(result.message || 'Failed to enroll in the course')
      }
    } catch (error) {
      console.error('Error enrolling:', error)
      alert('An error occurred while enrolling')
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleUnenroll = async () => {
    if (!currentUserEnrollment) {
      alert('You are not enrolled in this course')
      return
    }

    if (!confirm('Are you sure you want to unenroll from this course?')) {
      return
    }

    setIsUnenrolling(true)
    try {
      const result = await unenrollEmployee(course.id, currentUserEnrollment.id)

      if (result.success) {
        alert(result.message || 'Successfully unenrolled from the course')
        setCurrentUserEnrollment(null)

        // Refresh enrollments to show updated list
        const refreshResult = await fetch_courseEnrollments(course.id)
        if (Array.isArray(refreshResult)) {
          setEnrolledEmployees(refreshResult)
        }

        // Call the parent onRegister callback if provided
        if (onRegister) {
          onRegister(course)
        }
      } else {
        alert(result.message || 'Failed to unenroll from the course')
      }
    } catch (error) {
      console.error('Error unenrolling:', error)
      alert('An error occurred while unenrolling')
    } finally {
      setIsUnenrolling(false)
    }
  }

  const handleSessionInputChange = (sessionId: string, field: string, value: string) => {
    const numValue = parseInt(value) || 0
    const session = course.self_study_sessions?.find(s => String(s.id) === String(sessionId))

    // Get the max value based on the field
    let maxValue = Infinity
    if (field === 'kanjiCount') maxValue = session?.kanjiCount || 0
    else if (field === 'vocabularyCount') maxValue = session?.vocabularyCount || 0
    else if (field === 'grammarCount') maxValue = session?.grammarCount || 0
    else if (field === 'readingMinutes') maxValue = session?.readingMinutes || 0
    else if (field === 'listeningMinutes') maxValue = session?.listeningMinutes || 0

    // Clamp the value
    const clampedValue = Math.min(numValue, maxValue)

    setSessionInputs(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [field]: clampedValue
      }
    }))
  }

  const handleSaveSession = async (sessionId: string) => {
    const values = sessionInputs[sessionId]

    const session = course.self_study_sessions?.find(
      s => String(s.id) === String(sessionId)
    )

    if (!session) {
      alert("Session not found")
      return
    }

    const existingProgress = savedProgress[sessionId]

    const progressData = {
      enrollment_id: currentUserEnrollment?.id,
      self_study_session_id: session.id,
      kanji_count: values.kanjiCount || 0,
      vocabulary_count: values.vocabularyCount || 0,
      grammar_count: values.grammarCount || 0,
      reading_minutes: values.readingMinutes || 0,
      listening_minutes: values.listeningMinutes || 0,
      completion_status: "IN_PROGRESS",
    }

    const allTargetsMet =
      (values.kanjiCount || 0) >= (session.kanjiCount || 0) &&
      (values.vocabularyCount || 0) >= (session.vocabularyCount || 0) &&
      (values.grammarCount || 0) >= (session.grammarCount || 0) &&
      (values.readingMinutes || 0) >= (session.readingMinutes || 0) &&
      (values.listeningMinutes || 0) >= (session.listeningMinutes || 0)

    if (allTargetsMet) {
      progressData.completion_status = "COMPLETED"
    }

    setSavingSessions(prev => ({
      ...prev,
      [sessionId]: true,
    }))

    try {
      let result

      if (!existingProgress) {
        result = await add_studyProgress(course.id, progressData)
      } else {
        result = await update_studyProgress(
          course.id,
          existingProgress.id,
          progressData
        )
      }

      if (result.success) {
        await fetch_studyProgress(course.id)
        alert(
          `Progress saved successfully for Session ${session.session_no || session.sessionNo || ""
          }`
        )

        if (allTargetsMet) {
          alert("🎉 Congratulations! Session completed!")
        }
      } else {
        alert(result.message || "Failed to save progress")
      }
    } catch (error) {
      console.error(error)
      alert("An error occurred while saving progress")
    } finally {
      setSavingSessions(prev => ({
        ...prev,
        [sessionId]: false,
      }))
    }
  }

  // Attendance handlers
  const handleAttendanceStatusChange = (sessionId: string, employeeId: string, value: string) => {
    const key = `${sessionId}-${employeeId}`
    setAttendanceStatuses(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveAttendance = async (sessionId: number, enrollmentId: number, groupId: number) => {
    const key = `${sessionId}-${enrollmentId}`
    const status = attendanceStatuses[key]

    if (!status) {
      alert('Please select an attendance status')
      return
    }

    // Find if attendance already exists
    const existingAttendance = getAttendanceForSession(sessionId, enrollmentId)

    setSavingAttendance(prev => ({
      ...prev,
      [key]: true
    }))

    try {
      let result
      if (existingAttendance) {
        // Update existing attendance
        result = await updateAttendance(
          course.id,
          groupId,
          existingAttendance.id,
          {
            enrollmentId,
            courseSessionId: sessionId,
            attendanceStatus: status as any
          }
        )
      } else {
        // Create new attendance
        result = await createAttendance(
          course.id,
          groupId,
          {
            enrollmentId,
            courseSessionId: sessionId,
            attendanceStatus: status as any
          }
        )
      }

      if (result.success) {
        alert(`Attendance ${existingAttendance ? 'updated' : 'recorded'} successfully!`)
        // Refresh attendance
        await loadAttendance()
      } else {
        alert(result.message || 'Failed to save attendance')
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('An error occurred while saving attendance')
    } finally {
      setSavingAttendance(prev => ({
        ...prev,
        [key]: false
      }))
    }
  }

  // Show loading state while fetching enrollments
  if (isLoadingEnrollments) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading course details...</p>
        </div>
      </div>
    )
  }

  // Check if session has saved progress (and should show read-only)
  const hasSavedProgress = (sessionId: string) => {
    return !!savedProgress[sessionId]
  }

  // Check if session is completed
  const isSessionCompleted = (sessionId: string) => {
    const progress = savedProgress[sessionId]
    return progress?.completion_status === 'COMPLETED'
  }

  // const TESTING_DATE = new Date('2026-07-9') // Change this for testing
  const TESTING_DATE = new Date() // Uncomment for production

  // Helper function to get session status - UPDATED to use TESTING_DATE
  const getSessionStatus = (sessionDate: Date | string | undefined) => {
    if (!sessionDate) return 'unknown'
    const date = new Date(sessionDate)
    const currentDate = TESTING_DATE || new Date()


    if (currentDate.getTime() > date.getTime() &&
      currentDate.toDateString() !== date.toDateString()) {
      console.log('Returning: overdue')
      return 'overdue'
    }
    if (currentDate.toDateString() === date.toDateString()) {
      console.log('Returning: today')
      return 'today'
    }
    if (currentDate.getTime() < date.getTime()) {
      console.log('Returning: future')
      return 'future'
    }
    return 'unknown'
  }
  return (
    <div className="flex h-full gap-6">
      {/* Left Side - Sticky Course Header */}
      <div className="sticky top-0 h-fit w-[320px] shrink-0">
        <Card className="gap-2 overflow-hidden pt-0 pb-3">
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            {course.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.imageUrl}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <span className="text-6xl font-bold text-primary/20">
                  {course.title.charAt(0)}
                </span>
              </div>
            )}

            <div className="absolute top-3 right-3 flex gap-2">
              <Badge
                className={cn(
                  "border-0 px-3 py-1 text-xs font-medium text-white",
                  statusColors[course.status]
                )}
              >
                {COURSE_STATUS_LABELS[course.status]}
              </Badge>
            </div>
          </div>

          <CardHeader className="space-y-4 px-3">
            <div className="space-y-2">
              <h1 className="text-xl leading-tight font-bold">
                {course.title}
              </h1>
              <Badge className="border-0 bg-secondary/90 text-xs font-medium text-secondary-foreground backdrop-blur-sm">
                {COURSE_TYPE_LABELS[course.courseType]}
              </Badge>
            </div>

            {/* Quick Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  strokeWidth={1.5}
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
                <span className="text-muted-foreground">
                  {startDate ? format(startDate, "MMM d, yyyy") : (course.courseType === "self-study" ? "Dynamic Schedule" : "TBD")}
                  {endDate && ` - ${format(endDate, "MMM d, yyyy")}`}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={BookOpenIcon}
                  strokeWidth={1.5}
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
                <span className="text-muted-foreground capitalize">
                  {course.category}
                </span>
              </div>

              {course.courseType === "trainer" && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon
                      icon={UserGroupIcon}
                      strokeWidth={1.5}
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                    />
                    <span className="text-muted-foreground">
                      Capacity: {totalCapacity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon
                      icon={UserGroupIcon}
                      strokeWidth={1.5}
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                    />
                    <span className="text-muted-foreground">
                      {groupCount} Group{groupCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </>
              )}

              {course.courseType === "self-study" && course.selfStudyType && (
                <div className="flex items-center gap-2 text-sm">
                  <HugeiconsIcon
                    icon={BookOpenIcon}
                    strokeWidth={1.5}
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                  />
                  <span className="text-muted-foreground capitalize">
                    {course.selfStudyType}
                  </span>
                </div>
              )}

              {/* Registration Deadline */}
              {course.registrationDeadline && (
                <div className="flex items-center gap-2 text-sm">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    strokeWidth={1.5}
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                  />
                  <span className="text-muted-foreground">
                    Registration Deadline: {format(course.registrationDeadline, "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons - Edit for Admin/Approver, Register/Unenroll for Learner */}
            {isAdmin && (
              <Button onClick={() => onEdit(course)} className="w-full gap-2">
                <HugeiconsIcon
                  icon={Edit03Icon}
                  strokeWidth={1.5}
                  className="h-4 w-4"
                />
                Edit Course
              </Button>
            )}

            {isLearner && (
              <div className="flex gap-2">
                <Button
                  onClick={handleRegister}
                  className="flex-1 gap-2"
                  disabled={isUserEnrolled || course.status === "completed" || isEnrolling}
                  variant={isUserEnrolled ? "outline" : "default"}
                >
                  {isEnrolling ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></span>
                      Enrolling...
                    </>
                  ) : isUserEnrolled ? (
                    "Registered"
                  ) : course.status === "completed" ? (
                    "Course Completed"
                  ) : (
                    "Enroll course"
                  )}
                </Button>

                {isUserEnrolled && (
                  <Button
                    onClick={handleUnenroll}
                    variant="destructive"
                    className="gap-2"
                    disabled={isUnenrolling}
                  >
                    {isUnenrolling ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                        Unenrolling...
                      </>
                    ) : (
                      "Unenroll"
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
        </Card>
      </div>

      {/* Right Side - Tabs Content */}
      <div className="min-w-0 flex-1">
        <Tabs defaultValue="information" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="information">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                strokeWidth={1.5}
                className="h-4 w-4"
              />
              Information
            </TabsTrigger>
            {course.courseType === "trainer" &&
              course.groups &&
              course.groups.length > 0 && (
                <TabsTrigger value="groups">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    strokeWidth={1.5}
                    className="h-4 w-4"
                  />
                  Groups ({course.groups.length})
                </TabsTrigger>
              )}
            {course.courseType === "self-study" && (
              <TabsTrigger value="sessions">
                <HugeiconsIcon
                  icon={Calendar05Icon}
                  strokeWidth={1.5}
                  className="h-4 w-4"
                />
                Sessions ({course.self_study_sessions?.length || course.sessions?.length || 0})
              </TabsTrigger>
            )}
            <TabsTrigger value="announcements">
              <HugeiconsIcon
                icon={Megaphone02Icon}
                strokeWidth={1.5}
                className="h-4 w-4"
              />
              Announcements ({announcements.length})
            </TabsTrigger>
          </TabsList>

          {/* Information Tab */}
          <TabsContent value="information">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      strokeWidth={1.5}
                      className="h-5 w-5 shrink-0 text-muted-foreground"
                    />
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-muted-foreground">
                        {startDate ? format(startDate, "MMM d, yyyy") : (course.courseType === "self-study" ? "Dynamic Schedule" : "TBD")}
                        {endDate && ` - ${format(endDate, "MMM d, yyyy")}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <HugeiconsIcon
                      icon={BookOpenIcon}
                      strokeWidth={1.5}
                      className="h-5 w-5 shrink-0 text-muted-foreground"
                    />
                    <div>
                      <p className="font-medium">Category</p>
                      <p className="text-muted-foreground capitalize">
                        {course.category}
                      </p>
                    </div>
                  </div>

                  {course.registrationDeadline && (
                    <div className="flex items-center gap-3 text-sm">
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        strokeWidth={1.5}
                        className="h-5 w-5 shrink-0 text-muted-foreground"
                      />
                      <div>
                        <p className="font-medium">Registration Deadline</p>
                        <p className="text-muted-foreground">
                          {format(course.registrationDeadline, "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {course.courseType === "trainer" && (
                    <>
                      <div className="flex items-center gap-3 text-sm">
                        <HugeiconsIcon
                          icon={UserGroupIcon}
                          strokeWidth={1.5}
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <div>
                          <p className="font-medium">Total Capacity</p>
                          <p className="text-muted-foreground">
                            {totalCapacity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <HugeiconsIcon
                          icon={Calendar05Icon}
                          strokeWidth={1.5}
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <div>
                          <p className="font-medium">Total Sessions</p>
                          <p className="text-muted-foreground">
                            {totalSessions}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <HugeiconsIcon
                          icon={UserIcon}
                          strokeWidth={1.5}
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <div>
                          <p className="font-medium">Number of Groups</p>
                          <p className="text-muted-foreground">{groupCount}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {course.courseType === "self-study" && (
                    <>
                      {course.selfStudyType && (
                        <div className="flex items-center gap-3 text-sm">
                          <HugeiconsIcon
                            icon={BookOpenIcon}
                            strokeWidth={1.5}
                            className="h-5 w-5 shrink-0 text-muted-foreground"
                          />
                          <div>
                            <p className="font-medium">Study Type</p>
                            <p className="text-muted-foreground capitalize">
                              {course.selfStudyType}
                            </p>
                          </div>
                        </div>
                      )}
                      {course.selfStudyType?.toLowerCase().trim() !== "other" && (
                        <>
                          {course.totalKanji && (
                            <div className="flex items-center gap-3 text-sm">
                              <HugeiconsIcon
                                icon={ClockIcon}
                                strokeWidth={1.5}
                                className="h-5 w-5 shrink-0 text-muted-foreground"
                              />
                              <div>
                                <p className="font-medium">Total Kanji</p>
                                <p className="text-muted-foreground">
                                  {course.totalKanji}
                                </p>
                              </div>
                            </div>
                          )}

                          {course.totalVocabulary && (
                            <div className="flex items-center gap-3 text-sm">
                              <HugeiconsIcon
                                icon={ClockIcon}
                                strokeWidth={1.5}
                                className="h-5 w-5 shrink-0 text-muted-foreground"
                              />
                              <div>
                                <p className="font-medium">Total Vocabulary</p>
                                <p className="text-muted-foreground">
                                  {course.totalVocabulary}
                                </p>
                              </div>
                            </div>
                          )}


                          {course.totalGrammar && (
                            <div className="flex items-center gap-3 text-sm">
                              <HugeiconsIcon
                                icon={ClockIcon}
                                strokeWidth={1.5}
                                className="h-5 w-5 shrink-0 text-muted-foreground"
                              />
                              <div>
                                <p className="font-medium">Total Grammar</p>
                                <p className="text-muted-foreground">
                                  {course.totalGrammar}
                                </p>
                              </div>
                            </div>
                          )}

                          {course.totalReadingMinutes && (
                            <div className="flex items-center gap-3 text-sm">
                              <HugeiconsIcon
                                icon={ClockIcon}
                                strokeWidth={1.5}
                                className="h-5 w-5 shrink-0 text-muted-foreground"
                              />
                              <div>
                                <p className="font-medium">Total Reading Minutes</p>
                                <p className="text-muted-foreground">
                                  {course.totalReadingMinutes}
                                </p>
                              </div>
                            </div>
                          )}

                          {course.totalListeningMinutes && (
                            <div className="flex items-center gap-3 text-sm">
                              <HugeiconsIcon
                                icon={ClockIcon}
                                strokeWidth={1.5}
                                className="h-5 w-5 shrink-0 text-muted-foreground"
                              />
                              <div>
                                <p className="font-medium">Total Listening Minutes</p>
                                <p className="text-muted-foreground">
                                  {course.totalListeningMinutes}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Groups Tab - Now with Attendance for Trainer Courses */}
          {course.courseType === "trainer" &&
            course.groups &&
            course.groups.length > 0 && (
              <TabsContent value="groups">
                <div className="space-y-6">
                  {course.groups.map((group, index) => {
                    const groupEmployees = getEmployeesByGroup(parseInt(group.id))
                    const uniqueStatuses = getUniqueStatuses(groupEmployees)

                    return (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-semibold">Group {index + 1}: {group.name}</h4>
                              <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span>
                                  <span className="font-medium">Capacity:</span>{" "}
                                  {group.capacity === "unlimited" ? "Unlimited" : group.capacity}
                                </span>
                                <span>
                                  <span className="font-medium">Enrolled:</span>{" "}
                                  {groupEmployees.length}
                                </span>
                                <span>
                                  <span className="font-medium">Sessions:</span>{" "}
                                  {group.sessions.length}
                                </span>
                                <span>
                                  <span className="font-medium">Start:</span>{" "}
                                  {group.startDate ? format(group.startDate, "MMM d, yyyy") : "TBD"}
                                </span>
                                {group.endDate && (
                                  <span>
                                    <span className="font-medium">End:</span>{" "}
                                    {format(group.endDate, "MMM d, yyyy")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge variant={group.status === "ACTIVE" ? "default" : "secondary"}>
                              {group.status || "Active"}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-4">
                          {/* Group Sessions with Attendance */}
                          <div className="mb-4">
                            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <HugeiconsIcon
                                icon={Calendar05Icon}
                                strokeWidth={1.5}
                                className="h-4 w-4"
                              />
                              Sessions & Attendance ({group.sessions.length})
                            </h5>

                            {/* Show attendance only for enrolled users or admins */}
                            {(userRole === "learner" || isAdmin) && (
                              <div className="space-y-4">
                                {group.sessions.map((session, idx) => {
                                  const sessionId = session.id
                                  return (
                                    <Card key={idx} className="bg-muted/5 border-muted">
                                      <div className="p-3">
                                        {/* Session Header */}
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-4">
                                            <span className="font-medium text-sm">Session {session.sessionNo || idx + 1}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {session.date ? format(session.date, "MMM d, yyyy") : "TBD"}
                                            </span>
                                            {session.startTime && session.endTime && (
                                              <span className="text-xs text-muted-foreground">
                                                {session.startTime} - {session.endTime}
                                              </span>
                                            )}
                                            <Badge variant="outline" className="text-[10px]">
                                              {session.status || ""}
                                            </Badge>
                                          </div>
                                        </div>

                                        {/* Attendance Table */}
                                        <div className="overflow-x-auto">
                                          {/* Show attendance based on user role */}
                                          {(userRole === "learner" || isAdmin) && (
                                            <table className="w-full text-sm">
                                              <thead>
                                                <tr className="border-b">
                                                  <th className="text-left py-2 px-2 font-medium text-xs text-muted-foreground">Employee</th>
                                                  <th className="text-left py-2 px-2 font-medium text-xs text-muted-foreground">Department</th>
                                                  <th className="text-left py-2 px-2 font-medium text-xs text-muted-foreground">Status</th>
                                                  <th className="text-left py-2 px-2 font-medium text-xs text-muted-foreground">Action</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {/* Show ALL enrolled employees in the group */}
                                                {groupEmployees
                                                  .filter(employee => {
                                                    // For learners: show ONLY the current user
                                                    if (userRole === "learner") {
                                                      return employee.employeeId === currentUserId;
                                                    }
                                                    // For admins: show ALL employees
                                                    return true;
                                                  })
                                                  .map((employee) => {
                                                    // Try to find attendance for this employee for this session
                                                    const attendance = getAttendanceForSession(
                                                      parseInt(sessionId),
                                                      employee.id
                                                    )
                                                    const key = `${sessionId}-${employee.id}`
                                                    const currentStatus = attendanceStatuses[key] || attendance?.attendanceStatus || ''
                                                    const isSaving = savingAttendance[key] || false

                                                    return (
                                                      <tr key={employee.id} className="border-b border-muted/50">
                                                        <td className="py-2 px-2">
                                                          <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6">
                                                              <AvatarImage src={employee.pfImage || ""} />
                                                              <AvatarFallback className="text-[10px]">
                                                                {getInitials(employee.employeeName)}
                                                              </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-xs font-medium">
                                                              {truncateText(employee.employeeName, 20)}
                                                            </span>
                                                          </div>
                                                        </td>
                                                        <td className="py-2 px-2 text-xs text-muted-foreground">
                                                          {truncateText(employee.departmentName, 20)}
                                                        </td>
                                                        <td className="py-2 px-2">
                                                          {attendance && attendance.attendanceStatus ? (
                                                            <Badge className={cn(
                                                              "text-[10px]",
                                                              getAttendanceStatusColor(attendance.attendanceStatus)
                                                            )}>
                                                              <HugeiconsIcon
                                                                icon={getAttendanceStatusIcon(attendance.attendanceStatus)}
                                                                strokeWidth={2}
                                                                className="h-3 w-3 mr-1"
                                                              />
                                                              {attendance.attendanceStatus}
                                                            </Badge>
                                                          ) : (
                                                            <span className="text-xs text-muted-foreground">Not recorded</span>
                                                          )}
                                                        </td>
                                                        <td className="py-2 px-2">
                                                          {(isAdmin || isUserEnrolled) && (
                                                            <div className="flex items-center gap-2">
                                                              <Select
                                                                value={currentStatus}
                                                                onValueChange={(value) =>
                                                                  handleAttendanceStatusChange(sessionId, employee.id.toString(), value)
                                                                }
                                                                disabled={isSaving}
                                                              >
                                                                <SelectTrigger className="h-7 w-[130px] text-xs">
                                                                  <SelectValue placeholder="Select status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                  <SelectItem value="PRESENT">✅ Present</SelectItem>
                                                                  <SelectItem value="ABSENT">❌ Absent</SelectItem>
                                                                  <SelectItem value="LATE">⏰ Late</SelectItem>
                                                                  <SelectItem value="EXCUSED">📝 Excused</SelectItem>
                                                                </SelectContent>
                                                              </Select>
                                                              <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 px-2 text-xs"
                                                                onClick={() => handleSaveAttendance(
                                                                  parseInt(sessionId),
                                                                  employee.id,
                                                                  parseInt(group.id)
                                                                )}
                                                                disabled={!currentStatus || isSaving}
                                                              >
                                                                {isSaving ? (
                                                                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
                                                                ) : (
                                                                  <HugeiconsIcon icon={SaveIcon} strokeWidth={2} className="h-3 w-3" />
                                                                )}
                                                              </Button>
                                                            </div>
                                                          )}
                                                        </td>
                                                      </tr>
                                                    )
                                                  })}
                                              </tbody>
                                            </table>
                                          )}
                                        </div>
                                      </div>
                                    </Card>
                                  )
                                })}
                              </div>
                            )}
                          </div>

                          {/* Enrolled Employees for this Group - with Status Tabs */}
                          {groupEmployees.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-medium flex items-center gap-2">
                                  <HugeiconsIcon
                                    icon={User02Icon}
                                    strokeWidth={1.5}
                                    className="h-4 w-4"
                                  />
                                  Enrolled Employees ({groupEmployees.length})
                                </h5>
                              </div>

                              {/* Status Tabs */}
                              <Tabs defaultValue={uniqueStatuses[0]?.toLowerCase() || "all"} className="mb-4">
                                <TabsList className="mb-3">
                                  {uniqueStatuses.map((status) => (
                                    <TabsTrigger key={status} value={status.toLowerCase()} className="text-xs">
                                      {capitalizeFirstLetter(status)} ({getEmployeesByStatus(groupEmployees, status).length})
                                    </TabsTrigger>
                                  ))}
                                </TabsList>

                                {/* Status filtered employees */}
                                {uniqueStatuses.map((status) => (
                                  <TabsContent key={status} value={status.toLowerCase()}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {getEmployeesByStatus(groupEmployees, status).map((employee) => (
                                        <div key={employee.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                                          <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarImage src={employee.pfImage || ""} />
                                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                              {getInitials(employee.employeeName)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate" title={employee.employeeName}>
                                              {employee.employeeName}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate" title={`${employee.departmentName} • ${employee.teamName}`}>
                                              {truncateText(employee.departmentName, 25)}
                                              {employee.teamName && ` • ${truncateText(employee.teamName, 20)}`}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </TabsContent>
                                ))}
                              </Tabs>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>
            )}

          {/* Sessions Tab - ONLY for self-study courses */}
          {course.courseType === "self-study" && (
            <TabsContent value="sessions">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sessions</h3>
                <div className="flex flex-col gap-3">
                  {(course.self_study_sessions?.length > 0 ? course.self_study_sessions : course.sessions || []).map((session, index) => {
                    const isJLPT = isJLPTType(course.selfStudyType as any)
                    const sessionId = session.id
                    const hasProgress = hasSavedProgress(sessionId)
                    const isCompleted = isSessionCompleted(sessionId)
                    const progress = savedProgress[sessionId]
                    const sessionDate = progress?.session_deadline ? new Date(progress.session_deadline) : session.date
                    const sessionStatus = getSessionStatus(sessionDate)
                    const isFutureSession = sessionStatus === 'future'
                    const isOverdue = sessionStatus === 'overdue'
                    const isPastOrToday = sessionStatus === 'overdue' || sessionStatus === 'today'

                    // Calculate overall progress percentage
                    const overallProgress = hasProgress ? Math.round(
                      ((progress?.kanji_progress_percent || 0) +
                        (progress?.vocabulary_progress_percent || 0) +
                        (progress?.grammar_progress_percent || 0) +
                        (progress?.reading_progress_percent || 0) +
                        (progress?.listening_progress_percent || 0)) / 5
                    ) : 0

                    // Determine session status display
                    let statusBadge = null
                    if (isCompleted) {
                      statusBadge = (
                        <Badge className="bg-green-500 text-white text-[10px]">
                          <HugeiconsIcon icon={CheckCircle} strokeWidth={2} className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )
                    } else if (hasProgress && overallProgress > 0 && overallProgress < 100) {
                      statusBadge = (
                        <Badge className="bg-blue-500 text-white text-[10px]">
                          Progress ({overallProgress}%)
                        </Badge>
                      )
                    } else if (isOverdue && !isCompleted && sessionDate) {
                      statusBadge = (
                        <Badge className="bg-red-500 text-white text-[10px]">
                          Overdue by {Math.ceil((TESTING_DATE.getTime() - new Date(sessionDate).getTime()) / (1000 * 60 * 60 * 24))} days
                        </Badge>
                      )
                    } else if (isFutureSession) {
                      statusBadge = (
                        <Badge variant="secondary" className="text-[10px]">
                          Upcoming
                        </Badge>
                      )
                    } else if (!hasProgress && isPastOrToday) {
                      statusBadge = (
                        <Badge variant="outline" className="text-[10px] text-yellow-600 border-yellow-400 bg-yellow-50">
                          Active
                        </Badge>
                      )
                    }

                    return (
                      <Card
                        key={sessionId || index}
                        className={cn(
                          "overflow-hidden bg-muted/5 border-muted transition-colors",
                          isFutureSession && "opacity-70",
                          isOverdue && !isCompleted && "border-red-200 bg-red-50/5"
                        )}
                      >
                        <div className="flex flex-col">
                          {/* Header - Session Info */}
                          <div className="flex-1 p-4 bg-muted/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="font-semibold text-sm">Session {index + 1}</span>
                              {statusBadge}

                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.5} className="h-4 w-4 text-muted-foreground" />
                              <span className={cn(
                                "font-medium",
                                isOverdue && !isCompleted ? "text-red-500" : "text-muted-foreground"
                              )}>
                                {sessionDate ? format(new Date(sessionDate), "MMM d, yyyy (EEE)") : "Dynamic based on enrollment"}
                              </span>
                            </div>
                          </div>

                          {/* Static Totals Display - Target from backend */}
                          {isJLPT && (
                            <div className="p-4  bg-muted/5">
                              <p className="text-xs text-muted-foreground mb-2">🎯 Session Targets:</p>
                              <div className="flex flex-wrap gap-x-6 gap-y-2">
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-muted-foreground">Kanji:</span>
                                  <span className="font-semibold text-primary">{session.kanjiCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-muted-foreground">Vocab:</span>
                                  <span className="font-semibold text-primary">{session.vocabularyCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-muted-foreground">Grammar:</span>
                                  <span className="font-semibold text-primary">{session.grammarCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-muted-foreground">Reading:</span>
                                  <span className="font-semibold text-primary">{session.readingMinutes || 0}min</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-muted-foreground">Listening:</span>
                                  <span className="font-semibold text-primary">{session.listeningMinutes || 0}min</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Progress Display - Shows for users with progress */}
                          {isJLPT && isUserEnrolled && hasProgress && userRole === "learner" && (
                            <div className="p-4 bg-muted/10">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-xs text-muted-foreground">📊 Your Progress:</p>
                                <div className="flex items-center gap-2">
                                  {isCompleted ? (
                                    <Badge className="bg-green-500 text-white text-[10px]">
                                      <HugeiconsIcon icon={CheckCircle} strokeWidth={2} className="h-3 w-3 mr-1" />
                                      Completed
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-blue-500 text-white text-[10px]">
                                      Progress ({overallProgress}%)
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Progress Bars with Percentages */}
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                                {/* Kanji Progress */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Kanji</span>
                                    <span className="font-semibold text-primary">
                                      {progress?.kanji_progress_percent || 0}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                      className="bg-primary rounded-full h-1.5 transition-all duration-300"
                                      style={{
                                        width: `${Math.min(progress?.kanji_progress_percent || 0, 100)}%`
                                      }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {progress?.kanji_count || 0} / {session.kanjiCount || 0}
                                  </p>
                                </div>

                                {/* Vocabulary Progress */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Vocab</span>
                                    <span className="font-semibold text-primary">
                                      {progress?.vocabulary_progress_percent || 0}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                      className="bg-primary rounded-full h-1.5 transition-all duration-300"
                                      style={{
                                        width: `${Math.min(progress?.vocabulary_progress_percent || 0, 100)}%`
                                      }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {progress?.vocabulary_count || 0} / {session.vocabularyCount || 0}
                                  </p>
                                </div>

                                {/* Grammar Progress */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Grammar</span>
                                    <span className="font-semibold text-primary">
                                      {progress?.grammar_progress_percent || 0}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                      className="bg-primary rounded-full h-1.5 transition-all duration-300"
                                      style={{
                                        width: `${Math.min(progress?.grammar_progress_percent || 0, 100)}%`
                                      }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {progress?.grammar_count || 0} / {session.grammarCount || 0}
                                  </p>
                                </div>

                                {/* Reading Progress */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Reading</span>
                                    <span className="font-semibold text-primary">
                                      {progress?.reading_progress_percent || 0}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                      className="bg-primary rounded-full h-1.5 transition-all duration-300"
                                      style={{
                                        width: `${Math.min(progress?.reading_progress_percent || 0, 100)}%`
                                      }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {progress?.reading_minutes || 0}min / {session.readingMinutes || 0}min
                                  </p>
                                </div>

                                {/* Listening Progress */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Listening</span>
                                    <span className="font-semibold text-primary">
                                      {progress?.listening_progress_percent || 0}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                      className="bg-primary rounded-full h-1.5 transition-all duration-300"
                                      style={{
                                        width: `${Math.min(progress?.listening_progress_percent || 0, 100)}%`
                                      }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {progress?.listening_minutes || 0}min / {session.listeningMinutes || 0}min
                                  </p>
                                </div>
                              </div>

                              {/* Overall Progress */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-2 mt-1">
                                <span>
                                  Overall Progress:
                                  <span className="font-semibold text-primary ml-1">
                                    {overallProgress}%
                                  </span>
                                </span>
                                {progress?.completed_at && (
                                  <span>
                                    Completed: {format(new Date(progress.completed_at), "MMM d, yyyy HH:mm")}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Progress Input - Show for non-future, non-completed, non-overdue sessions */}
                          {isJLPT && isUserEnrolled && !isCompleted && !isFutureSession && !isOverdue && userRole === "learner" && (
                            <div className="p-4 bg-muted/10">
                              <p className="text-xs text-muted-foreground mb-2">📝 Enter Your Progress:</p>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Kanji Completed</Label>
                                  <Input
                                    type="number"
                                    value={sessionInputs[sessionId]?.kanjiCount ?? (progress?.kanji_count ?? 0)}
                                    onChange={(e) => handleSessionInputChange(sessionId, 'kanjiCount', e.target.value)}
                                    className="h-8 text-sm"
                                    min={0}
                                    placeholder="0"
                                    disabled={savingSessions[sessionId]}
                                  />
                                  <p className="text-[10px] text-muted-foreground">
                                    Target: {session.kanjiCount || 0}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Vocab Completed</Label>
                                  <Input
                                    type="number"
                                    value={sessionInputs[sessionId]?.vocabularyCount ?? (progress?.vocabulary_count ?? 0)}
                                    onChange={(e) => handleSessionInputChange(sessionId, 'vocabularyCount', e.target.value)}
                                    className="h-8 text-sm"
                                    min={0}
                                    placeholder="0"
                                    disabled={savingSessions[sessionId]}
                                  />
                                  <p className="text-[10px] text-muted-foreground">
                                    Target: {session.vocabularyCount || 0}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Grammar Completed</Label>
                                  <Input
                                    type="number"
                                    value={sessionInputs[sessionId]?.grammarCount ?? (progress?.grammar_count ?? 0)}
                                    onChange={(e) => handleSessionInputChange(sessionId, 'grammarCount', e.target.value)}
                                    className="h-8 text-sm"
                                    min={0}
                                    placeholder="0"
                                    disabled={savingSessions[sessionId]}
                                  />
                                  <p className="text-[10px] text-muted-foreground">
                                    Target: {session.grammarCount || 0}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Reading Completed (min)</Label>
                                  <Input
                                    type="number"
                                    value={sessionInputs[sessionId]?.readingMinutes ?? (progress?.reading_minutes ?? 0)}
                                    onChange={(e) => handleSessionInputChange(sessionId, 'readingMinutes', e.target.value)}
                                    className="h-8 text-sm"
                                    min={0}
                                    placeholder="0"
                                    disabled={savingSessions[sessionId]}
                                  />
                                  <p className="text-[10px] text-muted-foreground">
                                    Target: {session.readingMinutes || 0}min
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Listening Completed (min)</Label>
                                  <Input
                                    type="number"
                                    value={sessionInputs[sessionId]?.listeningMinutes ?? (progress?.listening_minutes ?? 0)}
                                    onChange={(e) => handleSessionInputChange(sessionId, 'listeningMinutes', e.target.value)}
                                    className="h-8 text-sm"
                                    min={0}
                                    placeholder="0"
                                    disabled={savingSessions[sessionId]}
                                  />
                                  <p className="text-[10px] text-muted-foreground">
                                    Target: {session.listeningMinutes || 0}min
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="mt-3 gap-2"
                                onClick={() => handleSaveSession(sessionId)}
                                disabled={savingSessions[sessionId]}
                              >
                                {savingSessions[sessionId] ? (
                                  <>
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></span>
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <HugeiconsIcon icon={SaveIcon} strokeWidth={2} className="h-4 w-4" />
                                    Save Progress
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          {/* Show disabled message for overdue sessions */}
                          {isJLPT && isUserEnrolled && isOverdue && !isCompleted && userRole === "learner" && (
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 border-t border-red-200 dark:border-red-800">
                              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                                <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="h-4 w-4" />
                                ⚠️ This session is overdue. Progress submission is disabled.
                              </p>
                            </div>
                          )}



                          {/* Show info for future sessions */}
                          {isJLPT && isUserEnrolled && isFutureSession && userRole === "learner" && sessionDate && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border-t border-blue-200 dark:border-blue-800">
                              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="h-4 w-4" />
                                📅 This session starts on {format(new Date(sessionDate), "MMM d, yyyy")}. Progress tracking will be available from that date.
                              </p>
                            </div>
                          )}

                          {/* Progress display for admins/approvers (read-only) */}
                          {isJLPT && hasProgress && userRole === "learner" && (
                            <div className="p-4 bg-muted/5">
                              <p className="text-xs text-muted-foreground mb-2">📊 Progress (Read-Only):</p>
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Kanji</span>
                                    <span className="font-semibold text-primary">
                                      {progress?.kanji_progress_percent || 0}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                      className="bg-primary rounded-full h-1.5 transition-all duration-300"
                                      style={{
                                        width: `${Math.min(progress?.kanji_progress_percent || 0, 100)}%`
                                      }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {progress?.kanji_count || 0} / {session.kanjiCount || 0}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Vocab</span>
                                    <span className="font-semibold text-primary">
                                      {progress?.vocabulary_progress_percent || 0}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                      className="bg-primary rounded-full h-1.5 transition-all duration-300"
                                      style={{
                                        width: `${Math.min(progress?.vocabulary_progress_percent || 0, 100)}%`
                                      }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {progress?.vocabulary_count || 0} / {session.vocabularyCount || 0}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Grammar</span>
                                    <span className="font-semibold text-primary">
                                      {progress?.grammar_progress_percent || 0}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                      className="bg-primary rounded-full h-1.5 transition-all duration-300"
                                      style={{
                                        width: `${Math.min(progress?.grammar_progress_percent || 0, 100)}%`
                                      }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {progress?.grammar_count || 0} / {session.grammarCount || 0}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Reading</span>
                                    <span className="font-semibold text-primary">
                                      {progress?.reading_progress_percent || 0}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                      className="bg-primary rounded-full h-1.5 transition-all duration-300"
                                      style={{
                                        width: `${Math.min(progress?.reading_progress_percent || 0, 100)}%`
                                      }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {progress?.reading_minutes || 0}min / {session.readingMinutes || 0}min
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Listening</span>
                                    <span className="font-semibold text-primary">
                                      {progress?.listening_progress_percent || 0}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                      className="bg-primary rounded-full h-1.5 transition-all duration-300"
                                      style={{
                                        width: `${Math.min(progress?.listening_progress_percent || 0, 100)}%`
                                      }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {progress?.listening_minutes || 0}min / {session.listeningMinutes || 0}min
                                  </p>
                                </div>
                              </div>
                              {progress?.completion_status && (
                                <Badge className="mt-2 text-[10px]" variant={progress.completion_status === 'COMPLETED' ? 'default' : 'secondary'}>
                                  {progress.completion_status}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Non-JLPT - Show link if exists */}
                          {!isJLPT && session.link && (
                            <div className="p-4 bg-muted/5">
                              <div className="flex items-center gap-2 text-[11px]">
                                <HugeiconsIcon icon={Megaphone02Icon} strokeWidth={1.5} className="h-4 w-4 text-muted-foreground" />
                                <a
                                  href={session.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary font-medium hover:underline truncate max-w-[200px]"
                                >
                                  Resources Link: {session.link}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>

                {/* Enrolled Employees Section - shown at the bottom */}
                {enrolledEmployees.length > 0 && (
                  <div className="mt-8">
                    <Card>
                      <CardHeader className="bg-muted/30 pb-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold flex items-center gap-2">
                            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="h-5 w-5" />
                            Enrolled Employees ({enrolledEmployees.length})
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {enrolledEmployees.filter(e => e.enrollmentStatus === 'APPROVED').length} Approved
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {enrolledEmployees.map((employee) => (
                            <div key={employee.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={employee.pfImage || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                  {getInitials(employee.employeeName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate" title={employee.employeeName}>
                                  {employee.employeeName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate" title={`${employee.departmentName} • ${employee.teamName}`}>
                                  {truncateText(employee.departmentName, 25)}
                                  {employee.teamName && ` • ${truncateText(employee.teamName, 20)}`}
                                </p>
                                <div className="mt-1">
                                  <Badge variant="outline" className="text-[10px]">
                                    {employee.enrollmentStatus}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Announcements</h3>
                {isAdmin && (
                  <Button size="sm" className="gap-2">
                    <HugeiconsIcon
                      icon={Megaphone02Icon}
                      strokeWidth={1.5}
                      className="h-4 w-4"
                    />
                    New Announcement
                  </Button>
                )}
              </div>

              {announcements.length > 0 ? (
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className={cn(
                        "rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5",
                        getPriorityColor(announcement.priority)
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {announcement.title}
                            </h4>
                            <Badge
                              className={cn(
                                "text-xs font-medium",
                                getPriorityBadgeColor(announcement.priority)
                              )}
                            >
                              {announcement.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {announcement.content}
                          </p>
                          <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                            <span>By: {announcement.author}</span>
                            <span>
                              {format(announcement.createdAt, "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex shrink-0 gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <HugeiconsIcon
                                icon={Edit03Icon}
                                strokeWidth={1.5}
                                className="h-4 w-4"
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <HugeiconsIcon
                                icon={ClockIcon}
                                strokeWidth={1.5}
                                className="h-4 w-4"
                              />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                  <HugeiconsIcon
                    icon={Megaphone02Icon}
                    strokeWidth={1.5}
                    className="h-12 w-12 text-muted-foreground/50"
                  />
                  <h4 className="mt-4 text-lg font-semibold">
                    No Announcements
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    There are no announcements for this course yet.
                  </p>
                  {isAdmin && (
                    <Button className="mt-4 gap-2">
                      <HugeiconsIcon
                        icon={Megaphone02Icon}
                        strokeWidth={1.5}
                        className="h-4 w-4"
                      />
                      Create First Announcement
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}