// components/course/tabs/InformationTab.tsx
"use client"

import React, { useState, useEffect } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  TeacherFreeIcons,
  Calendar03Icon,
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  Calendar05Icon,
  UserIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircle,
  Alert01Icon,
  SaveIcon,
  Megaphone02Icon,
  LoaderCircle,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { Course, isJLPTType } from "@/types/course"
import { format } from "date-fns"
import { cn, resolveUploadUrl } from "@/lib/utils"
import { LearnersTab } from "./LearnersTab"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mainStore } from "@/store/mainStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CourseCard } from "@/components/cards/course-card"

interface InformationTabProps {
  course: Course
  enrollments?: any[]
  userRole?: string
  currentUserId?: string | null
  profile?: any
  attendanceRecords?: any[]
  attendanceStatuses?: Record<string, string>
  savingAttendance?: Record<string, boolean>
  savedAttendance?: Record<string, boolean>
  loadingAttendanceGroups?: Record<number, boolean>
  onAttendanceChange?: (
    sessionId: string,
    employeeId: string,
    value: string,
    enrollmentId: number,
    groupId: number
  ) => void
  // LearnersTab props
  enrollmentSearchTerm: string
  onSearchChange: (value: string) => void
  allEmployees?: any[]
  groups?: any[]
  onRefreshEnrollments?: () => Promise<void>
  onAdminChangeGroup?: (
    enrollmentId: number,
    newGroupId: number
  ) => Promise<void>
  isChangingGroup?: boolean
  groupChangeError?: string | null
  groupChangeSuccess?: string | null
  onEnrollEmployee?: (
    employeeId: string | number,
    groupId?: number
  ) => Promise<void>
  onUnenrollEmployee?: (enrollmentId: number) => Promise<void>
  isEnrolling?: boolean
  isUnenrolling?: boolean
  // Sessions props
  currentUserEnrollment?: any
  isUserEnrolled?: boolean
}

const getInitials = (name: string) => {
  if (!name) return "??"
  const parts = name.split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const truncateText = (text: string, maxLength: number = 30) => {
  if (!text) return ""
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
}

// Attendance status options with labels and icons
const ATTENDANCE_OPTIONS = [
  { value: "PRESENT", label: "Present", icon: "✅" },
  { value: "ABSENT", label: "Absent", icon: "❌" },
  { value: "LATE", label: "Late", icon: "⏰" },
  { value: "EXCUSED", label: "Excused", icon: "📝" },
]

const getAttendanceLabel = (status: string) => {
  const option = ATTENDANCE_OPTIONS.find((opt) => opt.value === status)
  return option ? `${option.icon} ${option.label}` : status
}

export function InformationTab({
  course,
  enrollments = [],
  userRole = "learner",
  currentUserId = null,
  profile,
  attendanceRecords = [],
  attendanceStatuses = {},
  savingAttendance = {},
  savedAttendance = {},
  loadingAttendanceGroups = {},
  onAttendanceChange,
  // LearnersTab props
  enrollmentSearchTerm,
  onSearchChange,
  allEmployees = [],
  groups = [],
  onRefreshEnrollments,
  onAdminChangeGroup,
  isChangingGroup = false,
  groupChangeError = null,
  groupChangeSuccess = null,
  onEnrollEmployee,
  onUnenrollEmployee,
  isEnrolling = false,
  isUnenrolling = false,
  // Sessions props
  currentUserEnrollment,
  isUserEnrolled = false,
}: InformationTabProps) {
  const isAdmin = userRole === "admin"
  const isApprover = userRole === "approver"
  const isLearner = userRole === "learner"
  const isDepartmentHead = userRole === "department_head"
  const isDivisionHead = userRole === "division_head"

  const canViewAllGroups = isAdmin || isApprover

  const TESTING_DATE = new Date()
  const [showFullLearners, setShowFullLearners] = useState(false)

  // Session state
  const [savedProgress, setSavedProgress] = useState<Record<string, any>>({})
  const [sessionInputs, setSessionInputs] = useState<Record<string, any>>({})
  const [savingSessions, setSavingSessions] = useState<Record<string, boolean>>(
    {}
  )

  const {
    fetch_courseEnrollments,
    studyProgress,
    fetch_studyProgress,
    add_studyProgress,
    update_studyProgress,
  } = mainStore()

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

  const getEmployeesByGroup = (groupId: number) => {
    let employees = enrollments.filter(
      (emp) =>
        emp.courseGroupId === groupId && emp.enrollmentStatus !== "CANCELLED"
    )

    if (isDepartmentHead && profile?.deptDat) {
      employees = employees.filter(
        (emp) => emp.departmentName === profile.deptDat
      )
    }

    return employees
  }

  const isFirstSessionUpcoming = (sessions: any[]) => {
    if (!sessions || sessions.length === 0) return false
    const sortedSessions = [...sessions].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateA - dateB
    })
    const firstSession = sortedSessions[0]
    if (!firstSession || !firstSession.date) return false
    const currentDate = TESTING_DATE || new Date()
    const sessionDate = new Date(firstSession.date)
    return sessionDate.getTime() > currentDate.getTime()
  }

  const hasDepartmentEmployees = (groupId: number) => {
    if (!isDepartmentHead || !profile?.deptDat) return true

    const groupEmployees = enrollments.filter(
      (emp) =>
        emp.courseGroupId === groupId &&
        emp.enrollmentStatus !== "CANCELLED" &&
        emp.departmentName === profile.deptDat
    )

    return groupEmployees.length > 0
  }

  // Session helper functions
  const getSessionStatus = (sessionDate: Date | string | undefined) => {
    if (!sessionDate) return "unknown"

    let date: Date
    if (typeof sessionDate === "string") {
      date = new Date(sessionDate)
      if (isNaN(date.getTime())) return "unknown"
    } else if (sessionDate instanceof Date) {
      date = sessionDate
      if (isNaN(date.getTime())) return "unknown"
    } else {
      return "unknown"
    }

    const currentDate = TESTING_DATE || new Date()

    if (currentDate.toDateString() === date.toDateString()) {
      return "today"
    }
    if (currentDate.getTime() > date.getTime()) {
      return "overdue"
    }
    if (currentDate.getTime() < date.getTime()) {
      return "future"
    }
    return "unknown"
  }

  const hasSavedProgress = (sessionId: string) => {
    return !!savedProgress[sessionId]
  }

  const isSessionCompleted = (sessionId: string) => {
    const progress = savedProgress[sessionId]
    return progress?.completion_status === "COMPLETED"
  }

  const handleSessionInputChange = (
    sessionId: string,
    field: string,
    value: string
  ) => {
    const numValue = parseInt(value) || 0
    const session = course.self_study_sessions?.find(
      (s) => String(s.id) === String(sessionId)
    )

    let maxValue = Infinity
    if (field === "kanjiCount") maxValue = session?.kanjiCount || 0
    else if (field === "vocabularyCount")
      maxValue = session?.vocabularyCount || 0
    else if (field === "grammarCount") maxValue = session?.grammarCount || 0
    else if (field === "readingMinutes") maxValue = session?.readingMinutes || 0
    else if (field === "listeningMinutes")
      maxValue = session?.listeningMinutes || 0

    const clampedValue = Math.min(numValue, maxValue)

    setSessionInputs((prev) => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [field]: clampedValue,
      },
    }))
  }

  const handleSaveSession = async (sessionId: string) => {
    const values = sessionInputs[sessionId]

    const session = course.self_study_sessions?.find(
      (s) => String(s.id) === String(sessionId)
    )

    if (!session) {
      toast.warning("Session not found")
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

    setSavingSessions((prev) => ({
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
        toast.success(
          `Progress saved successfully for Session ${
            session.session_no || session.sessionNo || ""
          }`
        )

        if (allTargetsMet) {
          toast.success("🎉 Congratulations! Session completed!")
        }
      } else {
        toast.error(result.message || "Failed to save progress")
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred while saving progress")
    } finally {
      setSavingSessions((prev) => ({
        ...prev,
        [sessionId]: false,
      }))
    }
  }

  // Load study progress
  useEffect(() => {
    if (course.id && isUserEnrolled && course.courseType === "self-study") {
      fetch_studyProgress(course.id)
    }
  }, [course.id, isUserEnrolled, course.courseType, fetch_studyProgress])

  // Update saved progress from store
  useEffect(() => {
    if (
      studyProgress &&
      studyProgress.progress &&
      Array.isArray(studyProgress.progress)
    ) {
      const progressMap: Record<string, any> = {}
      studyProgress.progress.forEach((p: any) => {
        if (p.self_study_session_id) {
          if (p.employee_id === currentUserId) {
            progressMap[p.self_study_session_id.toString()] = { ...p, id: p.id }
          } else {
            const compositeKey = `${p.self_study_session_id}-${p.employee_id}`
            progressMap[compositeKey] = { ...p, id: p.id }
          }
        }
      })
      setSavedProgress(progressMap)
    }
  }, [studyProgress, currentUserId])

  // Initialize session inputs
  useEffect(() => {
    const initialInputs: Record<string, any> = {}
    const sessions =
      course.self_study_sessions?.length > 0
        ? course.self_study_sessions
        : course.sessions || []

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

  const firstFutureSessionIndex = React.useMemo(() => {
    const sessionsList =
      course.self_study_sessions?.length > 0
        ? course.self_study_sessions
        : course.sessions || []

    return sessionsList.findIndex((s) => {
      const progress = savedProgress[s.id?.toString()]
      const sessionDate = progress?.session_deadline
        ? new Date(progress.session_deadline)
        : s.date

      if (!sessionDate) return false
      const sessionStatus = getSessionStatus(sessionDate)
      return sessionStatus === "future"
    })
  }, [course.self_study_sessions, course.sessions, savedProgress])

  const totalSessions = getTotalSessions()
  const totalCapacity = getTotalCapacity()
  const groupCount = getGroupCount()
  const startDate = getStartDate()
  const endDate = getEndDate()

  // Get active enrollments
  const activeEnrollments = enrollments.filter(
    (e) => e.enrollmentStatus !== "CANCELLED"
  )

  let filteredEnrollments = activeEnrollments
  if (isApprover && profile?.team) {
    filteredEnrollments = filteredEnrollments.filter(
      (employee) => employee.teamName === profile.team
    )
  }
  if (isDepartmentHead && profile?.deptDat) {
    filteredEnrollments = filteredEnrollments.filter(
      (employee) => employee.departmentName === profile.deptDat
    )
  }

  const groupColors = [
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-purple-100 text-purple-700 border-purple-200",
    "bg-pink-100 text-pink-700 border-pink-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-orange-100 text-orange-700 border-orange-200",
    "bg-cyan-100 text-cyan-700 border-cyan-200",
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-lime-100 text-lime-700 border-lime-200",
    "bg-emerald-100 text-emerald-700 border-emerald-200",
  ]

  // Helper to refresh enrollments
  const handleRefreshEnrollments = async () => {
    if (onRefreshEnrollments) {
      await onRefreshEnrollments()
    }
    if (course?.id) {
      await fetch_courseEnrollments(course.id)
    }
  }

  // Check if user can manage learners
  const canManageLearners = isAdmin

  // Get session list
  const sessionsList =
    course.self_study_sessions?.length > 0
      ? course.self_study_sessions
      : course.sessions || []

  // Get attendance for session helper
  const getAttendanceForSession = (sessionId: number, enrollmentId: number) => {
    return attendanceRecords.find(
      (record) =>
        record.courseSessionId === sessionId &&
        record.enrollmentId === enrollmentId
    )
  }

  return (
    <TabsContent value="information" className="pt-4">
      <div className="space-y-6">
        {/* Course Cards and Session Accordion */}
        <div className="mt-0">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Course Card (takes 1 column) */}
            <div className="col-span-1">
              <CourseCard course={course} onView={() => {}} />
            </div>

            {/* Right Column - Session Accordion (takes 2 columns) */}
            <div className="col-span-2">
              {course.courseType === "self-study" && sessionsList.length > 0 ? (
                <Accordion
                  type="single"
                  collapsible
                  className="rounded-lg border"
                  defaultValue={
                    sessionsList.length > 0
                      ? String(sessionsList[0].id)
                      : undefined
                  }
                >
                  {sessionsList.map((session, index) => {
                    const isJLPT = isJLPTType(course.selfStudyType as any)
                    const sessionId = session.id
                    const hasProgress = hasSavedProgress(sessionId)
                    const isCompleted = isSessionCompleted(sessionId)
                    const progress = savedProgress[sessionId]
                    const sessionDate = progress?.session_deadline
                      ? new Date(progress.session_deadline)
                      : session.date
                    const sessionStatus = getSessionStatus(sessionDate)

                    let statusBadge = null
                    if (isCompleted) {
                      statusBadge = (
                        <Badge className="bg-green-500 text-[10px] text-white">
                          <HugeiconsIcon
                            icon={CheckCircle}
                            strokeWidth={2}
                            className="mr-1 h-3 w-3"
                          />
                          Completed
                        </Badge>
                      )
                    } else if (hasProgress && progress) {
                      const overallProgress = Math.round(
                        ((progress?.kanji_progress_percent || 0) +
                          (progress?.vocabulary_progress_percent || 0) +
                          (progress?.grammar_progress_percent || 0) +
                          (progress?.reading_progress_percent || 0) +
                          (progress?.listening_progress_percent || 0)) /
                          5
                      )
                      if (overallProgress > 0) {
                        statusBadge = (
                          <Badge className="bg-blue-500 text-[10px] text-white">
                            Progress ({overallProgress}%)
                          </Badge>
                        )
                      }
                    } else if (sessionStatus === "future") {
                      statusBadge = (
                        <Badge variant="secondary" className="text-[10px]">
                          Upcoming
                        </Badge>
                      )
                    }

                    return (
                      <AccordionItem
                        key={sessionId}
                        value={String(sessionId)}
                        className="border-b px-4 last:border-b-0"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex flex-1 items-center justify-between gap-2">
                            <span className="text-sm font-medium">
                              Session {index + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              {statusBadge}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pt-2">
                          {isJLPT ? (
                            <>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                  Session Targets
                                </p>
                                <div className="mt-1 grid grid-cols-5 gap-x-2 text-sm">
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-muted-foreground">
                                      Kanji:
                                    </span>
                                    <span className="font-medium">
                                      {session.kanjiCount || 0}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-muted-foreground">
                                      Vocabulary:
                                    </span>
                                    <span className="font-medium">
                                      {session.vocabularyCount || 0}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-muted-foreground">
                                      Grammar:
                                    </span>
                                    <span className="font-medium">
                                      {session.grammarCount || 0}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-muted-foreground">
                                      Reading:
                                    </span>
                                    <span className="font-medium">
                                      {session.readingMinutes || 0} min
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-muted-foreground">
                                      Listening:
                                    </span>
                                    <span className="font-medium">
                                      {session.listeningMinutes || 0} min
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {hasProgress && progress && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Your Progress
                                  </p>
                                  <div className="mt-1 space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">
                                        Overall:
                                      </span>
                                      <span className="font-medium">
                                        {Math.round(
                                          ((progress?.kanji_progress_percent ||
                                            0) +
                                            (progress?.vocabulary_progress_percent ||
                                              0) +
                                            (progress?.grammar_progress_percent ||
                                              0) +
                                            (progress?.reading_progress_percent ||
                                              0) +
                                            (progress?.listening_progress_percent ||
                                              0)) /
                                            5
                                        )}
                                        %
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div>
                                <div className="mt-1 space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    {session.link && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">
                                          Resources:
                                        </span>
                                        <a
                                          href={session.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="truncate text-sm font-medium text-primary hover:underline"
                                        >
                                          {session.link}
                                        </a>
                                      </div>
                                    )}
                                    <span className="font-medium">
                                      {session.durationPerSession || 7} days
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              ) : course.courseType === "trainer" &&
                course.groups &&
                course.groups.length > 0 ? (
                <Accordion
                  type="single"
                  collapsible
                  className="rounded-lg border"
                  defaultValue={
                    course.groups.length > 0
                      ? String(course.groups[0].id)
                      : undefined
                  }
                >
                  {course.groups.map((group: any, index: number) => (
                    <AccordionItem
                      key={group.id}
                      value={String(group.id)}
                      className="border-b px-4 last:border-b-0"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-1 items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {group.name || `Group ${index + 1}`}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {group.sessions?.length || 0} sessions
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 pt-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Capacity:
                            </span>
                            <span className="font-medium">
                              {group.capacity === undefined
                                ? "Unlimited"
                                : group.capacity}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Status:
                            </span>
                            <span className="font-medium">
                              {group.status || "Active"}
                            </span>
                          </div>
                          {group.startDate && (
                            <div className="col-span-2 flex justify-between">
                              <span className="text-muted-foreground">
                                Start Date:
                              </span>
                              <span className="font-medium">
                                {format(group.startDate, "MMM d, yyyy")}
                              </span>
                            </div>
                          )}
                          {group.endDate && (
                            <div className="col-span-2 flex justify-between">
                              <span className="text-muted-foreground">
                                End Date:
                              </span>
                              <span className="font-medium">
                                {format(group.endDate, "MMM d, yyyy")}
                              </span>
                            </div>
                          )}
                        </div>
                        {group.sessions && group.sessions.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Sessions ({group.sessions.length})
                            </p>
                            <div className="mt-1 max-h-32 space-y-1 overflow-y-auto">
                              {group.sessions.map(
                                (session: any, sIdx: number) => (
                                  <div
                                    key={sIdx}
                                    className="flex justify-between border-b border-muted/30 py-1 text-xs last:border-0"
                                  >
                                    <span className="text-muted-foreground">
                                      Session {session.sessionNo || sIdx + 1}
                                    </span>
                                    <span className="font-medium">
                                      {session.date
                                        ? format(
                                            new Date(session.date),
                                            "MMM d"
                                          )
                                        : "TBD"}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    No sessions available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  )
}
