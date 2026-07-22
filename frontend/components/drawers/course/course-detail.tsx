"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SaveIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  TeacherFreeIcons,
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
  RefreshIcon,
  ArrowRight01Icon,
  Cancel01Icon,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
  // Group change fields
  groupChangeStatus?: string
  requestedCourseGroupId?: number
  requestedCourseGroupName?: string
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

// Helper to get group change status color
const getGroupChangeStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'APPROVED':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'REJECTED':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'NONE':
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

// Helper to get group change status label
const getGroupChangeStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'Pending Review'
    case 'APPROVED':
      return 'Approved'
    case 'REJECTED':
      return 'Rejected'
    case 'NONE':
    default:
      return 'Current Group'
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
  const isAdmin = userRole === "admin"
  const isLearner = userRole === "learner"
  const isApprover = userRole === "approver"
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isUnenrolling, setIsUnenrolling] = useState(false)
  const [currentUserEnrollment, setCurrentUserEnrollment] = useState<EnrolledEmployee | null>(null)
  const [savedProgress, setSavedProgress] = useState<{ [key: string]: ProgressData }>({})
  const [sessionInputs, setSessionInputs] = useState<{ [key: string]: any }>({})
  const [savingSessions, setSavingSessions] = useState<{ [key: string]: boolean }>({})

  const [selectedGroupId, setSelectedGroupId] = useState<string>("")

  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [attendanceStatuses, setAttendanceStatuses] = useState<{ [key: string]: string }>({})
  const [savingAttendance, setSavingAttendance] = useState<{ [key: string]: boolean }>({})
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  // Group change states
  const [selectedRequestGroupId, setSelectedRequestGroupId] = useState<string>("")
  const [isRequestingGroupChange, setIsRequestingGroupChange] = useState(false)
  const [processingGroupChangeId, setProcessingGroupChangeId] = useState<number | null>(null)

  const [savedAttendance, setSavedAttendance] = useState<{ [key: string]: boolean }>({})

  // for search bar
  const [enrollmentSearchTerm, setEnrollmentSearchTerm] = useState("")

  // Check if user is enrolled
  const isUserEnrolled = !!currentUserEnrollment && currentUserEnrollment.enrollmentStatus === 'APPROVED'

  const {
    fetch_courseEnrollments,
    enrollments,
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
    // Group change methods
    requestGroupChange,
    approveGroupChange,
    rejectGroupChange,
    isRequestingGroupChange: isStoreRequesting,
    isApprovingGroupChange,
    isRejectingGroupChange,
    profile
  } = mainStore();


  // Get current user ID
  const currentUserId = getUserId?.() || null

  const TESTING_DATE = new Date('2026-08-4')
  // const TESTING_DATE = new Date()

  // Helper function to get session status
  const getSessionStatus = (sessionDate: Date | string | undefined) => {
    if (!sessionDate) return 'unknown'

    let date: Date
    if (typeof sessionDate === 'string') {
      date = new Date(sessionDate)
      if (isNaN(date.getTime())) return 'unknown'
    } else if (sessionDate instanceof Date) {
      date = sessionDate
      if (isNaN(date.getTime())) return 'unknown'
    } else {
      return 'unknown'
    }

    const currentDate = TESTING_DATE || new Date()

    // Check if it's today
    if (currentDate.toDateString() === date.toDateString()) {
      return 'today'
    }
    // Check if it's in the past
    if (currentDate.getTime() > date.getTime()) {
      return 'overdue'
    }
    // Check if it's in the future
    if (currentDate.getTime() < date.getTime()) {
      return 'future'
    }
    return 'unknown'
  }

  const loadAttendance = async () => {
    setLoadingAttendance(true)
    try {
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

      setAttendanceRecords(allAttendance)
    } catch (error) {
      console.error('Error loading attendance:', error)
    } finally {
      setLoadingAttendance(false)
    }
  }

  const firstFutureSessionIndex = useMemo(() => {
    const sessionsList = course.self_study_sessions?.length > 0
      ? course.self_study_sessions
      : course.sessions || []

    return sessionsList.findIndex((s) => {
      const progress = savedProgress[s.id?.toString()]
      const sessionDate = progress?.session_deadline ? new Date(progress.session_deadline) : s.date

      if (!sessionDate) return false
      const sessionStatus = getSessionStatus(sessionDate)
      return sessionStatus === 'future'
    })
  }, [course.self_study_sessions, course.sessions, savedProgress])

  // Fetch study progress when course loads and user is enrolled
  useEffect(() => {
    if (course.id && isUserEnrolled && course.courseType === "self-study") {
      fetch_studyProgress(course.id)
    }
  }, [course.id, isUserEnrolled, course.courseType])

  // Fetch attendance for trainer-provided courses
  useEffect(() => {
    if (course.id && course.courseType === "trainer" && isUserEnrolled || isAdmin) {
      loadAttendance()
    }
  }, [course.id, course.courseType, isUserEnrolled])



  // Update saved progress when studyProgress changes
  useEffect(() => {
    if (studyProgress && studyProgress.progress && Array.isArray(studyProgress.progress)) {
      const progressMap: { [key: string]: ProgressData } = {}

      studyProgress.progress.forEach((p: ProgressData) => {
        if (p.self_study_session_id) {
          if (p.employee_id === currentUserId) {
            progressMap[p.self_study_session_id.toString()] = {
              ...p,
              id: p.id
            }
          } else {
            const compositeKey = `${p.self_study_session_id}-${p.employee_id}`
            progressMap[compositeKey] = {
              ...p,
              id: p.id
            }
          }
        }
      })
      setSavedProgress(progressMap)
    }
  }, [studyProgress, currentUserId])

  // Check if current user is enrolled (excluding CANCELLED) - USING STORE ENROLLMENTS
  useEffect(() => {
    if (enrollments.length > 0 && currentUserId) {
      const userEnrollment = enrollments.find(
        (emp: any) => emp.employeeId === currentUserId && emp.enrollmentStatus !== 'CANCELLED'
      )
      setCurrentUserEnrollment(userEnrollment || null)
    } else {
      setCurrentUserEnrollment(null)
    }
  }, [enrollments, currentUserId])

  useEffect(() => {
    const loadEnrollments = async () => {
      if (!course.id) {
        return;
      }

      setIsLoadingEnrollments(true);
      try {
        // The store will clear old enrollments automatically
        const result = await fetch_courseEnrollments(course.id);
      } catch (error) {
        console.error('Error loading enrollments:', error);
      } finally {
        setIsLoadingEnrollments(false);
      }
    };

    loadEnrollments();
  }, [course.id]);



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

  // Update the enrollment status check - USING STORE ENROLLMENTS
  useEffect(() => {
    if (enrollments.length > 0 && currentUserId) {
      const enrollment = enrollments.find(
        (emp: any) => emp.employeeId === currentUserId
      )
      setCurrentUserEnrollment(enrollment || null)
    } else {
      setCurrentUserEnrollment(null)
    }
  }, [enrollments, currentUserId])

  // Check if registration deadline has passed
  const isRegistrationDeadlinePassed = useMemo(() => {
    if (!course.registrationDeadline) return false
    const deadline = new Date(course.registrationDeadline)
    const today = new Date()
    return deadline.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)
  }, [course.registrationDeadline])

  // Group employees by courseGroupId - filter out CANCELLED
  const getEmployeesByGroup = (groupId: number) => {
    return enrollments.filter(emp => emp.courseGroupId === groupId && emp.enrollmentStatus !== 'CANCELLED')
  }

  // Get unique statuses from enrolled employees (excluding CANCELLED)
  const getUniqueStatuses = (employees: EnrolledEmployee[]) => {
    const statuses = employees
      .filter(emp => emp.enrollmentStatus !== 'CANCELLED')
      .map(emp => emp.enrollmentStatus)
    return [...new Set(statuses)]
  }

  // Filter employees by status (excluding CANCELLED)
  const getEmployeesByStatus = (employees: EnrolledEmployee[], status: string) => {
    return employees.filter(emp => emp.enrollmentStatus === status && emp.enrollmentStatus !== 'CANCELLED')
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
      const hasUnlimited = capacities.some((c) => c === undefined)
      if (hasUnlimited) return undefined
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

    const groupId = selectedGroupId || course.groups[0].id
    const groupIdNum = parseInt(groupId)

    setIsEnrolling(true)
    try {
      const result = await enrollEmployee(course.id, groupIdNum)

      if (result.success) {
        alert(result.message || 'Successfully enrolled in the course!')

        // Refresh enrollments - store will be updated automatically
        await fetch_courseEnrollments(course.id)

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

        // Refresh enrollments - store will be updated automatically
        await fetch_courseEnrollments(course.id)

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

    let maxValue = Infinity
    if (field === 'kanjiCount') maxValue = session?.kanjiCount || 0
    else if (field === 'vocabularyCount') maxValue = session?.vocabularyCount || 0
    else if (field === 'grammarCount') maxValue = session?.grammarCount || 0
    else if (field === 'readingMinutes') maxValue = session?.readingMinutes || 0
    else if (field === 'listeningMinutes') maxValue = session?.listeningMinutes || 0

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
  const handleAttendanceStatusChange = async (sessionId: string, employeeId: string, value: string, enrollmentId: number, groupId: number) => {
    const key = `${sessionId}-${employeeId}`

    // Store the previous status in case we need to revert
    const previousStatus = attendanceStatuses[key]

    // Optimistically update the UI immediately
    setAttendanceStatuses(prev => ({
      ...prev,
      [key]: value
    }))

    // Clear previous saved state
    setSavedAttendance(prev => ({
      ...prev,
      [key]: false
    }))

    // Find existing attendance record
    const existingAttendance = getAttendanceForSession(parseInt(sessionId), enrollmentId)

    setSavingAttendance(prev => ({
      ...prev,
      [key]: true
    }))

    try {
      let result
      if (existingAttendance) {
        result = await updateAttendance(
          course.id,
          groupId,
          existingAttendance.id,
          {
            enrollmentId,
            courseSessionId: parseInt(sessionId),
            attendanceStatus: value as any
          }
        )
      } else {
        result = await createAttendance(
          course.id,
          groupId,
          {
            enrollmentId,
            courseSessionId: parseInt(sessionId),
            attendanceStatus: value as any
          }
        )
      }

      if (result.success) {
        // Find the employee name from enrollments
        const employee = enrollments.find((e: any) => e.id === enrollmentId)

        // Update the attendance record in local state instead of refetching
        setAttendanceRecords(prev => {
          const existingIndex = prev.findIndex(
            r => r.courseSessionId === parseInt(sessionId) && r.enrollmentId === enrollmentId
          )

          if (existingIndex !== -1) {
            // Update existing record
            const updated = [...prev]
            updated[existingIndex] = {
              ...updated[existingIndex],
              attendanceStatus: value as any
            }
            return updated
          } else {
            // Add new record
            const newRecord: AttendanceRecord = {
              id: result.data?.id || Date.now(),
              enrollmentId: enrollmentId,
              employeeId: employeeId,
              employeeName: employee?.employeeName || '',
              courseSessionId: parseInt(sessionId),
              sessionNo: parseInt(sessionId),
              sessionDate: new Date().toISOString(),
              attendanceStatus: value as any,
              registeredAt: new Date().toISOString()
            }
            return [...prev, newRecord]
          }
        })

        // Show saved indicator briefly
        setSavedAttendance(prev => ({
          ...prev,
          [key]: true
        }))

        // Auto-hide the saved indicator after 1.5 seconds
        setTimeout(() => {
          setSavedAttendance(prev => ({
            ...prev,
            [key]: false
          }))
        }, 1500)

      } else {
        // Revert on error
        setAttendanceStatuses(prev => ({
          ...prev,
          [key]: previousStatus || ''
        }))
        alert(result.message || 'Failed to save attendance')
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
      // Revert on error
      setAttendanceStatuses(prev => ({
        ...prev,
        [key]: previousStatus || ''
      }))
      alert('An error occurred while saving attendance')
    } finally {
      setSavingAttendance(prev => ({
        ...prev,
        [key]: false
      }))
    }
  }

  // ==================== GROUP CHANGE HANDLERS ====================

  // Learner requests group change
  const handleRequestGroupChange = async () => {
    if (!currentUserEnrollment) {
      alert('You are not enrolled in this course');
      return;
    }

    if (!selectedRequestGroupId) {
      alert('Please select a group to request');
      return;
    }

    // Find the selected group to get its name
    const selectedGroup = course.groups?.find(g => g.id === selectedRequestGroupId);
    const groupName = selectedGroup?.name || `Group ${selectedRequestGroupId}`;

    if (!confirm(`Are you sure you want to request to change to "${groupName}"?`)) {
      return;
    }

    setIsRequestingGroupChange(true);
    try {
      const result = await requestGroupChange(
        currentUserEnrollment.id,
        parseInt(selectedRequestGroupId)
      );

      if (result.success) {
        alert('Group change request submitted successfully!');
        setSelectedRequestGroupId("");

        // Refresh enrollments - store will be updated automatically
        await fetch_courseEnrollments(course.id);
      } else {
        alert(result.message || 'Failed to submit group change request');
      }
    } catch (error) {
      console.error('Error requesting group change:', error);
      alert(error instanceof Error ? error.message : 'Failed to request group change');
    } finally {
      setIsRequestingGroupChange(false);
    }
  };

  // Admin approves group change
  const handleApproveGroupChange = async (enrollmentId: number) => {
    if (!confirm('Are you sure you want to approve this group change request?')) {
      return;
    }

    setProcessingGroupChangeId(enrollmentId);
    try {
      const result = await approveGroupChange(enrollmentId);

      if (result.success) {
        alert('Group change request approved successfully!');

        // Refresh enrollments - store will be updated automatically
        await fetch_courseEnrollments(course.id);
      } else {
        alert('Failed to approve group change');
      }
    } catch (error) {
      console.error('Error approving group change:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve group change');
    } finally {
      setProcessingGroupChangeId(null);
    }
  };

  // Admin rejects group change
  const handleRejectGroupChange = async (enrollmentId: number) => {
    if (!confirm('Are you sure you want to reject this group change request?')) {
      return;
    }

    setProcessingGroupChangeId(enrollmentId);
    try {
      const result = await rejectGroupChange(enrollmentId);

      if (result.success) {
        alert('Group change request rejected successfully!');

        // Refresh enrollments - store will be updated automatically
        await fetch_courseEnrollments(course.id);
      } else {
        alert(result.message || 'Failed to reject group change');
      }
    } catch (error) {
      console.error('Error rejecting group change:', error);
      alert(error instanceof Error ? error.message : 'Failed to reject group change');
    } finally {
      setProcessingGroupChangeId(null);
    }
  };

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

  console.log(enrollments)

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
            {isAdmin && course.status !== "completed" && (
              <Button onClick={() => onEdit(course)} className="w-full gap-2">
                <HugeiconsIcon
                  icon={Edit03Icon}
                  strokeWidth={1.5}
                  className="h-4 w-4"
                />
                Edit Course
              </Button>
            )}

            {!isAdmin && (
              <div className="space-y-3">
                {/* Group Selection - Only show if there are multiple groups */}
                {course.groups && course.groups.length > 1 && !isUserEnrolled && (
                  <div className="space-y-1">
                    <Select
                      value={selectedGroupId || ""}
                      onValueChange={setSelectedGroupId}
                      disabled={isUserEnrolled || course.status === "completed" || isRegistrationDeadlinePassed}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="" disabled className="text-muted-foreground">
                          Select a group
                        </SelectItem>
                        {course.groups.map((group) => {
                          const groupIndex = course.groups.indexOf(group)
                          const groupEmployees = getEmployeesByGroup(parseInt(group.id))
                          const isFull = group.capacity !== undefined && groupEmployees.length >= (group.capacity as number || 0)

                          return (
                            <SelectItem
                              key={group.id}
                              value={group.id}
                              disabled={isFull}
                            >
                              <div className="flex items-center justify-between w-full gap-2">
                                <span>{group.name}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  ({groupEmployees.length}/{group.capacity === undefined ? "∞" : group.capacity})
                                  {isFull && " (Full)"}
                                </span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {selectedGroupId && (
                      <p className="text-xs text-muted-foreground">
                        Selected group capacity: {
                          (() => {
                            const group = course.groups.find(g => g.id === selectedGroupId)
                            if (!group) return "N/A"
                            const groupEmployees = getEmployeesByGroup(parseInt(group.id))
                            return `${groupEmployees.length}/${group.capacity === undefined ? "∞" : group.capacity}`
                          })()
                        }
                      </p>
                    )}
                  </div>
                )}

                {/* Enrollment Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleRegister}
                    className="flex-1 gap-2"
                    disabled={
                      isUserEnrolled ||
                      course.status === "completed" ||
                      isEnrolling ||
                      isRegistrationDeadlinePassed ||
                      (course.groups && course.groups.length > 1 && !selectedGroupId)
                    }
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
                    ) : isRegistrationDeadlinePassed ? (
                      "Registration Closed"
                    ) : (
                      "Enroll course"
                    )}
                  </Button>

                  {isUserEnrolled && !isRegistrationDeadlinePassed && (
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
            {/* === ADD GROUP CHANGE TABS === */}
            {course.courseType === "trainer" && isLearner && isUserEnrolled && (
              <TabsTrigger value="group-change">
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={1.5} className="h-4 w-4" />
                Change Group
              </TabsTrigger>
            )}
            {course.courseType === "trainer" && isAdmin && (
              <TabsTrigger value="group-requests">
                <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="h-4 w-4" />
                Group Requests
                {(() => {
                  const pendingRequests = enrollments.filter(
                    (e: any) => e.groupChangeStatus === 'PENDING'
                  );
                  return pendingRequests.length > 0 && (
                    <Badge className="ml-1 bg-red-500 text-white text-[10px] px-1.5">
                      {pendingRequests.length}
                    </Badge>
                  );
                })()}
              </TabsTrigger>
            )}
            <TabsTrigger value="enrollments">
              <HugeiconsIcon
                icon={UserGroupIcon}
                strokeWidth={1.5}
                className="h-4 w-4"
              />
              Enrollments ({(() => {
                let count = enrollments.filter(e => e.enrollmentStatus !== 'CANCELLED')
                if (isApprover && profile?.team) {
                  count = count.filter(e => e.teamName === profile.team)
                }
                return count.length
              })()})
            </TabsTrigger>
          </TabsList>

          {/* === LEARNER GROUP CHANGE TAB === */}
          {course.courseType === "trainer" && isLearner && isUserEnrolled && (
            <TabsContent value="group-change">
              <Card>
                <CardHeader className="bg-muted/30">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <HugeiconsIcon icon={RefreshIcon} strokeWidth={1.5} className="h-5 w-5" />
                    Request Group Change
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Request to move to a different group. An admin will review your request.
                  </p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Current Group Info */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-primary">
                          {currentUserEnrollment?.courseGroupName || 'N/A'}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn(
                        getGroupChangeStatusColor(currentUserEnrollment?.groupChangeStatus || 'NONE')
                      )}>
                        {getGroupChangeStatusLabel(currentUserEnrollment?.groupChangeStatus || 'NONE')}
                      </Badge>
                    </div>
                  </div>

                  {/* Group Change Request Form */}
                  {currentUserEnrollment?.groupChangeStatus !== 'PENDING' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select New Group</Label>
                        <Select
                          value={selectedRequestGroupId}
                          onValueChange={setSelectedRequestGroupId}
                          disabled={isRequestingGroupChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a group..." />
                          </SelectTrigger>
                          <SelectContent>
                            {course.groups?.map((group) => {
                              const groupId = parseInt(group.id);
                              const isCurrentGroup = groupId === currentUserEnrollment?.courseGroupId;


                              return (
                                <SelectItem
                                  key={group.id}
                                  value={group.id}
                                  disabled={isCurrentGroup}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>
                                      {group.name}
                                      {isCurrentGroup && " (Current)"}
                                    </span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {selectedRequestGroupId && (
                          <p className="text-xs text-muted-foreground">
                            You are requesting to move to: {
                              course.groups?.find(g => g.id === selectedRequestGroupId)?.name
                            }
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={handleRequestGroupChange}
                        disabled={!selectedRequestGroupId || isRequestingGroupChange || isStoreRequesting}
                        className="w-full gap-2"
                      >
                        {(isRequestingGroupChange || isStoreRequesting) ? (
                          <>
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                            Submitting Request...
                          </>
                        ) : (
                          <>
                            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="h-4 w-4" />
                            Submit Group Change Request
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
                      <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-yellow-700">Request Pending</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Your group change request is being reviewed by an admin.
                        You will be notified when it's approved or rejected.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Requested Group: {currentUserEnrollment?.requestedCourseGroupName || 'N/A'}
                      </p>
                    </div>
                  )}

                  {/* Request History/Status */}
                  {currentUserEnrollment?.groupChangeStatus === 'APPROVED' && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                      <HugeiconsIcon icon={CheckCircle} strokeWidth={2} className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-700">Request Approved!</p>
                      <p className="text-xs text-green-600 mt-1">
                        Your group change has been approved. You are now in: {currentUserEnrollment?.courseGroupName}
                      </p>
                    </div>
                  )}

                  {currentUserEnrollment?.groupChangeStatus === 'REJECTED' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                      <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-red-700">Request Rejected</p>
                      <p className="text-xs text-red-600 mt-1">
                        Your group change request was rejected. You can submit a new request.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* === ADMIN GROUP REQUESTS TAB === */}
          {course.courseType === "trainer" && isAdmin && (
            <TabsContent value="group-requests">
              <Card>
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="h-5 w-5" />
                        Group Change Requests
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Review and manage group change requests from learners
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await fetch_courseEnrollments(course.id);
                      }}
                      className="gap-2"
                    >
                      <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {(() => {
                    // Use enrollments from store directly
                    const pendingRequests = enrollments.filter(
                      (e: any) => e.groupChangeStatus === 'PENDING'
                    );
                    const approvedRequests = enrollments.filter(
                      (e: any) => e.groupChangeStatus === 'APPROVED'
                    );
                    const rejectedRequests = enrollments.filter(
                      (e: any) => e.groupChangeStatus === 'REJECTED'
                    );

                    if (pendingRequests.length === 0 && approvedRequests.length === 0 && rejectedRequests.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                          <p className="mt-2 text-sm text-muted-foreground">No group change requests found</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        {/* Pending Requests */}
                        {pendingRequests.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-yellow-700 mb-3 flex items-center gap-2">
                              <Badge className="bg-yellow-500 text-white">Pending ({pendingRequests.length})</Badge>
                            </h5>
                            <div className="space-y-3">
                              {pendingRequests.map((request: any) => {
                                const isProcessing = processingGroupChangeId === request.id;
                                return (
                                  <div key={request.id} className="rounded-lg border border-yellow-200 bg-yellow-50/30 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-start gap-3 flex-1">
                                        <Avatar className="h-10 w-10 shrink-0">
                                          <AvatarImage src={request.pfImage || ""} />
                                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                            {getInitials(request.employeeName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-medium">{request.employeeName}</p>
                                          <p className="text-xs text-muted-foreground">{request.email}</p>
                                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                                            <span className="text-muted-foreground">Current: <span className="font-medium">{request.courseGroupName}</span></span>
                                            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.5} className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-muted-foreground">Requested: <span className="font-medium text-yellow-700">{request.requestedCourseGroupName || 'Unknown'}</span></span>
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Department: {request.departmentName} • Team: {request.teamName}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                          size="sm"
                                          className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white"
                                          onClick={() => handleApproveGroupChange(request.id)}
                                          disabled={isProcessing || isApprovingGroupChange}
                                        >
                                          {isProcessing && isApprovingGroupChange ? (
                                            <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                                          ) : (
                                            <>
                                              <HugeiconsIcon icon={CheckCircle} strokeWidth={2} className="h-3 w-3" />
                                              Approve
                                            </>
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="h-8 gap-1"
                                          onClick={() => handleRejectGroupChange(request.id)}
                                          disabled={isProcessing || isRejectingGroupChange}
                                        >
                                          {isProcessing && isRejectingGroupChange ? (
                                            <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                                          ) : (
                                            <>
                                              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="h-3 w-3" />
                                              Reject
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Approved Requests */}
                        {approvedRequests.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2">
                              <Badge className="bg-green-500 text-white">Approved ({approvedRequests.length})</Badge>
                            </h5>
                            <div className="space-y-2">
                              {approvedRequests.map((request: any) => (
                                <div key={request.id} className="rounded-lg border border-green-200 bg-green-50/30 p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={request.pfImage || ""} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                          {getInitials(request.employeeName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="text-sm font-medium">{request.employeeName}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <span>Old: {request.courseGroupName}</span>
                                          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.5} className="h-3 w-3" />
                                          <span className="text-green-700 font-medium">New: {request.requestedCourseGroupName || request.courseGroupName}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <Badge className="bg-green-500 text-white text-[10px]">
                                      Approved
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rejected Requests */}
                        {rejectedRequests.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-red-700 mb-3 flex items-center gap-2">
                              <Badge className="bg-red-500 text-white">Rejected ({rejectedRequests.length})</Badge>
                            </h5>
                            <div className="space-y-2">
                              {rejectedRequests.map((request: any) => (
                                <div key={request.id} className="rounded-lg border border-red-200 bg-red-50/30 p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={request.pfImage || ""} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                          {getInitials(request.employeeName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="text-sm font-medium">{request.employeeName}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Requested: {request.requestedCourseGroupName || 'Unknown'}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge className="bg-red-500 text-white text-[10px]">
                                      Rejected
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Information Tab */}
          <TabsContent value="information">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  {course.courseType === "trainer" &&
                    <div className="flex items-center gap-3 text-sm">
                      <HugeiconsIcon
                        icon={TeacherFreeIcons}
                        strokeWidth={1.5}
                        className="h-5 w-5 shrink-0 text-muted-foreground"
                      />
                      <div>
                        <p className="font-medium">Trainer Name</p>
                        <p className="text-muted-foreground">
                          {course.trainerName}
                        </p>
                      </div>
                    </div>
                  }
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
                  {course.groups
                    .filter((group) => {
                      // Admin or Approver: show all groups
                      if (isAdmin || isApprover) return true;
                      // Learner: only show their enrolled group
                      if (isLearner && currentUserEnrollment) {
                        return parseInt(group.id) === currentUserEnrollment.courseGroupId;
                      }
                      // Learner not enrolled: show no groups
                      return false;
                    })
                    .map((group, index) => {
                      const groupEmployees = getEmployeesByGroup(parseInt(group.id))
                      const uniqueStatuses = getUniqueStatuses(groupEmployees)

                      return (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader className="bg-muted/30 pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-lg font-semibold">{group.name}</h4>
                                <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <span>
                                    <span className="font-medium">Capacity:</span>{" "}
                                    {group.capacity === undefined ? "Unlimited" : group.capacity}
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
                              {(userRole === "learner" || isAdmin || isApprover) && (
                                <div className="space-y-4">
                                  {group.sessions.map((session, idx) => {
                                    const sessionId = session.id
                                    const sessionDate = session.date ? new Date(session.date) : null
                                    const currentDate = TESTING_DATE || new Date()

                                    // Determine session status based on date
                                    const isFutureSession = sessionDate ? sessionDate.getTime() > currentDate.getTime() : false
                                    const isToday = sessionDate ? sessionDate.toDateString() === currentDate.toDateString() : false
                                    const isPast = sessionDate ? sessionDate.getTime() < currentDate.getTime() && !isToday : false
                                    const isOverdue = isPast && !isToday

                                    // Determine if attendance can be edited
                                    const canEditAttendance = isAdmin || (userRole === "learner" && (isToday || isPast))

                                    // For learners: show all sessions but with different states
                                    const isSessionLocked = userRole === "learner" && (isFutureSession || isOverdue)

                                    return (
                                      <Card key={idx} className={cn(
                                        "bg-muted/5 border-muted",
                                        isFutureSession && userRole === "learner" && "opacity-70",
                                        isOverdue && userRole === "learner" && "border-red-200 bg-red-50/5",
                                        isOverdue && isAdmin && "border-orange-200 bg-orange-50/5",
                                        isFutureSession && isAdmin && "border-blue-200 bg-blue-50/5"
                                      )}>
                                        <div className="p-3">
                                          {/* Session Header */}
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-4">
                                              <span className="font-medium text-sm">Session {session.sessionNo || idx + 1}</span>
                                              <span className="text-xs text-muted-foreground">
                                                {sessionDate ? format(sessionDate, "MMM d, yyyy") : "TBD"}
                                              </span>
                                              {session.startTime && session.endTime && (
                                                <span className="text-xs text-muted-foreground">
                                                  {session.startTime} - {session.endTime}
                                                </span>
                                              )}
                                              <Badge variant="outline" className="text-[10px]">
                                                {session.status || ""}
                                              </Badge>
                                              {isFutureSession && (
                                                <Badge className="text-[10px] bg-blue-500 text-white">
                                                  Upcoming
                                                </Badge>
                                              )}
                                              {isOverdue && (
                                                <Badge className="text-[10px] bg-red-500 text-white">
                                                  Overdue
                                                </Badge>
                                              )}
                                              {isToday && (
                                                <Badge className="text-[10px] bg-green-500 text-white">
                                                  Today
                                                </Badge>
                                              )}
                                            </div>
                                            {isSessionLocked && userRole === "learner" && (
                                              <div className="text-xs flex items-center gap-1">
                                                {isFutureSession ? (
                                                  <span className="text-blue-500 flex items-center gap-1">
                                                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="h-3 w-3" />
                                                    Coming Soon
                                                  </span>
                                                ) : isOverdue ? (
                                                  <span className="text-red-500 flex items-center gap-1">
                                                    <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="h-3 w-3" />
                                                    Locked
                                                  </span>
                                                ) : null}
                                              </div>
                                            )}
                                          </div>

                                          {/* Attendance Table - Show for all sessions */}
                                          <div className="overflow-x-auto">
                                            {groupEmployees.length > 0 ? (
                                              <table className="w-full text-sm">
                                                <thead>
                                                  <tr className="border-b">
                                                    <th className="text-left py-2 px-2 font-medium text-xs text-muted-foreground">Employee</th>
                                                    <th className="text-left py-2 px-2 font-medium text-xs text-muted-foreground">Department</th>
                                                    <th className="text-left py-2 px-2 font-medium text-xs text-muted-foreground">Status</th>
                                                    {!isApprover &&
                                                      <th className="text-left py-2 px-2 font-medium text-xs text-muted-foreground">Action</th>
                                                    }
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {/* Show ALL enrolled employees in the group (excluding CANCELLED) */}
                                                  {groupEmployees
                                                    .filter(employee => {
                                                      // For learners: show ONLY the current user
                                                      if (userRole === "learner") {
                                                        return employee.employeeId === currentUserId;
                                                      }
                                                      // For approvers: show ONLY employees from the same team
                                                      if (userRole === "approver" && profile?.team) {
                                                        return employee.teamName === profile.team;
                                                      }
                                                      // For admins: show ALL employees (excluding CANCELLED)
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

                                                      // Determine if attendance can be edited
                                                      const canEdit = isAdmin || (userRole === "learner" && canEditAttendance && employee.employeeId === currentUserId)

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
                                                              <span className="text-xs text-muted-foreground">
                                                                {isFutureSession && userRole === "learner" ? "Pending" : "Not recorded"}
                                                              </span>
                                                            )}
                                                          </td>
                                                          {!isApprover &&
                                                            <td className="py-2 px-2">
                                                              {canEdit ? (
                                                                <div className="flex items-center gap-2">
                                                                  <Select
                                                                    value={currentStatus}
                                                                    onValueChange={(value) => {
                                                                      handleAttendanceStatusChange(
                                                                        sessionId,
                                                                        employee.id.toString(),
                                                                        value,
                                                                        employee.id,
                                                                        parseInt(group.id)
                                                                      )
                                                                    }}
                                                                    disabled={isSaving || isSessionLocked}
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
                                                                  {isSaving ? (
                                                                    <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></span>
                                                                  ) : savedAttendance[key] ? (
                                                                    <HugeiconsIcon
                                                                      icon={CheckmarkCircle01Icon}
                                                                      strokeWidth={2}
                                                                      className="h-3 w-3 text-green-500"
                                                                    />
                                                                  ) : currentStatus && (
                                                                    <span className="h-3 w-3"></span> // Empty space for alignment
                                                                  )}
                                                                </div>
                                                              ) : (
                                                                <span className="text-xs text-muted-foreground">
                                                                  {isFutureSession ? "Coming Soon" : isOverdue ? "Locked" : "No access"}
                                                                </span>
                                                              )}
                                                            </td>
                                                          }

                                                        </tr>
                                                      )
                                                    })}
                                                </tbody>
                                              </table>
                                            ) : (
                                              <div className="text-center py-6 text-sm text-muted-foreground">
                                                No employees enrolled in this group yet.
                                              </div>
                                            )}
                                          </div>

                                          {/* Status Messages based on session state */}
                                          {isFutureSession && userRole === "learner" && (
                                            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="h-4 w-4" />
                                                📅 This session is scheduled for {sessionDate ? format(sessionDate, "MMM d, yyyy") : "TBD"}.
                                                Attendance will be available on the session date.
                                              </p>
                                            </div>
                                          )}

                                          {isOverdue && userRole === "learner" && (
                                            <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                                              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                                                <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="h-4 w-4" />
                                                ⚠️ This session is overdue. Attendance can be viewed but not modified.
                                              </p>
                                            </div>
                                          )}

                                          {isOverdue && isAdmin && (
                                            <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-800">
                                              <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-2">
                                                <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="h-4 w-4" />
                                                ⚠️ This session is overdue. As an admin, you can still modify attendance records.
                                              </p>
                                            </div>
                                          )}

                                          {isFutureSession && isAdmin && (
                                            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="h-4 w-4" />
                                                📅 This is a future session. As an admin, you can pre-record attendance.
                                              </p>
                                            </div>
                                          )}

                                          {isToday && userRole === "learner" && (
                                            <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                                              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                                                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="h-4 w-4" />
                                                ✅ Today's session - Attendance can be recorded.
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </Card>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            {/* ✅ UPDATED: Enrolled Employees for this Group - with Status Tabs and Team Filtering */}
                            {groupEmployees.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="text-sm font-medium flex items-center gap-2">
                                    <HugeiconsIcon
                                      icon={User02Icon}
                                      strokeWidth={1.5}
                                      className="h-4 w-4"
                                    />
                                    Enrolled Employees (
                                    {isApprover && profile?.team
                                      ? groupEmployees.filter(e => e.teamName === profile.team).length
                                      : groupEmployees.length
                                    }
                                    )
                                  </h5>
                                  {isApprover && profile?.team && (
                                    <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50">
                                      Team: {profile.team}
                                    </Badge>
                                  )}
                                </div>

                                {/* Status Tabs - Filtered for Approvers */}
                                <Tabs defaultValue={uniqueStatuses[0]?.toLowerCase() || "all"} className="mb-4">
                                  <TabsList className="mb-3">
                                    {uniqueStatuses.map((status) => {
                                      // ✅ Filter employees by team for approvers
                                      const statusEmployees = getEmployeesByStatus(groupEmployees, status);
                                      const filteredEmployees = isApprover && profile?.team
                                        ? statusEmployees.filter(e => e.teamName === profile.team)
                                        : statusEmployees;

                                      return filteredEmployees.length > 0 && (
                                        <TabsTrigger key={status} value={status.toLowerCase()} className="text-xs">
                                          {capitalizeFirstLetter(status)} ({filteredEmployees.length})
                                        </TabsTrigger>
                                      );
                                    })}
                                  </TabsList>

                                  {/* Status filtered employees */}
                                  {uniqueStatuses.map((status) => {
                                    // ✅ Filter employees by team for approvers
                                    const statusEmployees = getEmployeesByStatus(groupEmployees, status);
                                    const filteredEmployees = isApprover && profile?.team
                                      ? statusEmployees.filter(e => e.teamName === profile.team)
                                      : statusEmployees;

                                    return filteredEmployees.length > 0 && (
                                      <TabsContent key={status} value={status.toLowerCase()}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {filteredEmployees.map((employee) => (
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
                                    );
                                  })}
                                </Tabs>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}

                  {/* Show message if learner is not enrolled in any group */}
                  {isLearner && !currentUserEnrollment && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        You are not enrolled in any group for this course.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}


          {/* Enrollments Tab - Shows all enrolled employees in a table */}
          <TabsContent value="enrollments">
            <Card>
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="h-5 w-5" />
                      Enrolled Employees
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {isApprover && profile?.team
                        ? `Employees from your team enrolled in this course (${enrollments.filter(e => e.teamName === profile.team && e.enrollmentStatus !== 'CANCELLED').length} active)`
                        : `All employees enrolled in this course (${enrollments.filter(e => e.enrollmentStatus !== 'CANCELLED').length} active)`
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Filter by name, dept, team, or group..."
                      value={enrollmentSearchTerm}
                      onChange={(e) => setEnrollmentSearchTerm(e.target.value)}
                      className="w-[250px] h-8 text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {(() => {
                  // Filter out cancelled enrollments
                  let activeEnrollments = enrollments.filter(e => e.enrollmentStatus !== 'CANCELLED')

                  // ✅ FILTER FOR APPROVERS: Only show employees from the same team
                  if (isApprover && profile?.team) {
                    activeEnrollments = activeEnrollments.filter(
                      employee => employee.teamName === profile.team
                    )
                  }

                  // Apply search filter
                  let filteredEnrollments = activeEnrollments.filter((employee) => {
                    if (!enrollmentSearchTerm.trim()) return true
                    const searchLower = enrollmentSearchTerm.toLowerCase()
                    return (
                      (employee.employeeName || "").toLowerCase().includes(searchLower) ||
                      (employee.departmentName || "").toLowerCase().includes(searchLower) ||
                      (employee.teamName || "").toLowerCase().includes(searchLower) ||
                      (employee.courseGroupName || "").toLowerCase().includes(searchLower) ||
                      (employee.employeeId || "").toLowerCase().includes(searchLower) ||
                      (employee.email || "").toLowerCase().includes(searchLower)
                    )
                  })

                  // ✅ Sort by group name first, then by employee name
                  filteredEnrollments = filteredEnrollments.sort((a, b) => {
                    const groupA = a.courseGroupName || ''
                    const groupB = b.courseGroupName || ''
                    if (groupA !== groupB) {
                      return groupA.localeCompare(groupB)
                    }
                    return (a.employeeName || '').localeCompare(b.employeeName || '')
                  })

                  if (filteredEnrollments.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          {enrollmentSearchTerm ? "No matching employees found" : "No employees enrolled in this course yet"}
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs font-medium">Sr.</TableHead>
                            <TableHead className="text-xs font-medium">Employee ID</TableHead>
                            <TableHead className="text-xs font-medium">Name</TableHead>
                            <TableHead className="text-xs font-medium">Email</TableHead>
                            <TableHead className="text-xs font-medium">Department</TableHead>
                            <TableHead className="text-xs font-medium">Team</TableHead>
                            <TableHead className="text-xs font-medium">Group</TableHead>
                            <TableHead className="text-xs font-medium">Enrolled At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEnrollments.map((employee, index) => {
                            // Get group color based on group name
                            const groupColors = [
                              'bg-blue-100 text-blue-700 border-blue-200',
                              'bg-purple-100 text-purple-700 border-purple-200',
                              'bg-pink-100 text-pink-700 border-pink-200',
                              'bg-indigo-100 text-indigo-700 border-indigo-200',
                              'bg-teal-100 text-teal-700 border-teal-200',
                              'bg-orange-100 text-orange-700 border-orange-200',
                              'bg-cyan-100 text-cyan-700 border-cyan-200',
                              'bg-amber-100 text-amber-700 border-amber-200',
                              'bg-lime-100 text-lime-700 border-lime-200',
                              'bg-emerald-100 text-emerald-700 border-emerald-200',
                            ]
                            const groupIndex = filteredEnrollments
                              .filter(e => e.courseGroupName === employee.courseGroupName)
                              .length > 0
                              ? filteredEnrollments.findIndex(e => e.courseGroupName === employee.courseGroupName) % groupColors.length
                              : index % groupColors.length

                            return (
                              <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="text-xs text-center">{index + 1}</TableCell>
                                <TableCell className="text-xs font-mono">{employee.employeeId || '-'}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={employee.pfImage || ""} />
                                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                        {getInitials(employee.employeeName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{employee.employeeName}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs">{employee.email || '-'}</TableCell>
                                <TableCell className="text-xs">{employee.departmentName || '-'}</TableCell>
                                <TableCell className="text-xs">{employee.teamName || '-'}</TableCell>
                                <TableCell>
                                  <Badge className={cn(
                                    "text-xs font-normal",
                                    groupColors[groupIndex % groupColors.length]
                                  )}>
                                    {employee.courseGroupName || '-'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {employee.enrolledAt ? format(new Date(employee.enrolledAt), "MMM d, yyyy") : '-'}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab - ONLY for self-study courses */}
          {course.courseType === "self-study" && (
            <TabsContent value="sessions">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sessions</h3>
                <div className="flex flex-col gap-3">
                  {(() => {
                    const sessionsList = course.self_study_sessions?.length > 0
                      ? course.self_study_sessions
                      : course.sessions || []

                    return sessionsList.map((session, index) => {
                      const isJLPT = isJLPTType(course.selfStudyType as any)
                      const sessionId = session.id
                      const hasProgress = hasSavedProgress(sessionId)
                      const isCompleted = isSessionCompleted(sessionId)
                      const progress = savedProgress[sessionId]
                      const sessionDate = progress?.session_deadline ? new Date(progress.session_deadline) : session.date
                      const sessionStatus = getSessionStatus(sessionDate)
                      const isFutureSession = sessionStatus === 'future'
                      const isOverdue = sessionStatus === 'overdue'
                      const isToday = sessionStatus === 'today'
                      const isPastOrToday = sessionStatus === 'overdue' || sessionStatus === 'today'

                      const isEditable = isJLPT && isUserEnrolled && !isCompleted && userRole === "learner" &&
                        (sessionStatus === 'today' || (sessionStatus === 'future' && index === firstFutureSessionIndex));

                      const isLocked = isJLPT && isUserEnrolled && !isCompleted && userRole === "learner" &&
                        (sessionStatus === 'overdue' || (sessionStatus === 'future' && index !== firstFutureSessionIndex));

                      const overallProgress = hasProgress ? Math.round(
                        ((progress?.kanji_progress_percent || 0) +
                          (progress?.vocabulary_progress_percent || 0) +
                          (progress?.grammar_progress_percent || 0) +
                          (progress?.reading_progress_percent || 0) +
                          (progress?.listening_progress_percent || 0)) / 5
                      ) : 0

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
                            isFutureSession && index !== firstFutureSessionIndex && "opacity-70",
                            isOverdue && !isCompleted && "border-red-200 bg-red-50/5"
                          )}
                        >
                          <div className="flex flex-col">
                            <div className="flex-1 p-4 bg-muted/10 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <span className="font-semibold text-sm">Session {index + 1}</span>
                                {statusBadge}
                                {isFutureSession && index === firstFutureSessionIndex && (
                                  <Badge className="bg-purple-500 text-white text-[10px]">
                                    Available Now
                                  </Badge>
                                )}
                                {isToday && (
                                  <Badge className="bg-green-500 text-white text-[10px]">
                                    Today
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                {isJLPT ? (
                                  <>
                                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.5} className="h-4 w-4 text-muted-foreground" />
                                    <span className={cn(
                                      "font-medium",
                                      isOverdue && !isCompleted ? "text-red-500" : "text-muted-foreground"
                                    )}>
                                      {sessionDate ? format(new Date(sessionDate), "MMM d, yyyy (EEE)") : "Dynamic based on enrollment"}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <HugeiconsIcon icon={ClockIcon} strokeWidth={1.5} className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-muted-foreground">
                                      Duration: {session.durationPerSession || 7} days
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {isJLPT && (
                              <div className="p-4 bg-muted/5">
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

                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
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

                            {isEditable && (
                              <div className="p-4 bg-muted/10">
                                <p className="text-xs text-muted-foreground mb-2">
                                  📝 Enter Your Progress:
                                  {isToday && (
                                    <span className="ml-2 text-green-500 font-medium">(Today's session)</span>
                                  )}
                                  {isFutureSession && index === firstFutureSessionIndex && (
                                    <span className="ml-2 text-purple-500 font-medium">(Available now)</span>
                                  )}
                                </p>
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

                            {isLocked && (
                              <div className="p-4 bg-red-50 dark:bg-red-950/20 border-t border-red-200 dark:border-red-800">
                                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                                  <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="h-4 w-4" />
                                  {isOverdue ? (
                                    <>⚠️ This session is overdue. Progress submission is disabled.</>
                                  ) : (
                                    <>📅 This session is not yet available. Please complete the previous session first.</>
                                  )}
                                </p>
                              </div>
                            )}

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
                    })
                  })()}
                </div>

                {(() => {
                  // ✅ FILTER FOR APPROVERS: Only show employees from the same team
                  let activeEmployees = enrollments.filter(e => e.enrollmentStatus !== 'CANCELLED')

                  if (isApprover && profile?.team) {
                    activeEmployees = activeEmployees.filter(
                      employee => employee.teamName === profile.team
                    )
                  }

                  return activeEmployees.length > 0 && (
                    <div className="mt-8">
                      <Card>
                        <CardHeader className="bg-muted/30 pb-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold flex items-center gap-2">
                              <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="h-5 w-5" />
                              Enrolled Employees ({activeEmployees.length})
                            </h4>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs">
                                {activeEmployees.filter(e => e.enrollmentStatus === 'APPROVED').length} Approved
                              </Badge>
                              {isApprover && profile?.team && (
                                <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50">
                                  Team: {profile.team}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {activeEmployees.map((employee) => (
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
                  )
                })()}
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