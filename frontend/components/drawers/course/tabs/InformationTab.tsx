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
        {/* Course Description */}
        {course.description && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Description
            </h4>
            <p className="text-sm">{course.description}</p>
          </div>
        )}

        {/* Course Info Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-3">
            {course.courseType === "trainer" && (
              <div className="flex items-center gap-3 text-sm">
                <HugeiconsIcon
                  icon={TeacherFreeIcons}
                  strokeWidth={1.5}
                  className="h-5 w-5 shrink-0 text-muted-foreground"
                />
                <div>
                  <p className="font-medium">Trainer Name</p>
                  <p className="text-muted-foreground">
                    {course.trainerName || "TBD"}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <HugeiconsIcon
                icon={Calendar03Icon}
                strokeWidth={1.5}
                className="h-5 w-5 shrink-0 text-muted-foreground"
              />
              <div>
                <p className="font-medium">Duration</p>
                <p className="text-muted-foreground">
                  {startDate
                    ? format(startDate, "MMM d, yyyy")
                    : course.courseType === "self-study"
                      ? "Dynamic Schedule"
                      : "TBD"}
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

          {/* Right Column */}
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
                      {totalCapacity || "N/A"}
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
                    <p className="text-muted-foreground">{totalSessions}</p>
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

                <div className="flex items-center gap-3 text-sm">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    strokeWidth={1.5}
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <p className="font-medium">Total Enrolled</p>
                    <p className="text-muted-foreground">
                      {filteredEnrollments.length}
                    </p>
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

        {/* Groups Section - For Trainer Courses */}
        {course.courseType === "trainer" &&
          course.groups &&
          course.groups.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  strokeWidth={1.5}
                  className="h-4 w-4"
                />
                Groups ({course.groups.length})
              </h4>
              <div className="space-y-4">
                {course.groups
                  .filter((group: any) => {
                    if (isAdmin) return true
                    if (isDepartmentHead) {
                      const groupId = parseInt(group.id)
                      return hasDepartmentEmployees(groupId)
                    }
                    if (isApprover) return true
                    if (isLearner && currentUserEnrollment) {
                      return (
                        parseInt(group.id) ===
                        currentUserEnrollment.courseGroupId
                      )
                    }
                    return false
                  })
                  .map((group: any, index: number) => {
                    const groupId = parseInt(group.id)
                    const groupEmployees = getEmployeesByGroup(groupId)
                    const isLoadingAttendance =
                      loadingAttendanceGroups[groupId] || false
                    const firstSessionUpcoming = isFirstSessionUpcoming(
                      group.sessions
                    )

                    return (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-semibold">
                                {group.name}
                              </h5>
                              <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                <span>
                                  Capacity:{" "}
                                  {group.capacity === undefined
                                    ? "Unlimited"
                                    : group.capacity}
                                </span>
                                <span>Enrolled: {groupEmployees.length}</span>
                                <span>Sessions: {group.sessions.length}</span>
                                {group.startDate && (
                                  <span>
                                    Start: {format(group.startDate, "MMM d")}
                                  </span>
                                )}
                                {group.endDate && (
                                  <span>
                                    End: {format(group.endDate, "MMM d")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isLoadingAttendance && (
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <HugeiconsIcon
                                    icon={LoaderCircle}
                                    strokeWidth={2}
                                    className="h-3 w-3 animate-spin"
                                  />
                                  Loading...
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  group.status === "ACTIVE"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {group.status || "Active"}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          {/* Sessions & Attendance */}
                          <div>
                            <h6 className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <HugeiconsIcon
                                icon={Calendar05Icon}
                                strokeWidth={1.5}
                                className="h-3 w-3"
                              />
                              Sessions & Attendance ({group.sessions.length})
                            </h6>

                            {!firstSessionUpcoming ? (
                              isLoadingAttendance ? (
                                <div className="flex items-center justify-center py-8">
                                  <div className="text-center">
                                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      Loading attendance...
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  {group.sessions.map(
                                    (session: any, idx: number) => {
                                      const sessionDate = session.date
                                        ? new Date(session.date)
                                        : null
                                      const currentDate =
                                        TESTING_DATE || new Date()
                                      const isFutureSession = sessionDate
                                        ? sessionDate.getTime() >
                                          currentDate.getTime()
                                        : false
                                      const isToday = sessionDate
                                        ? sessionDate.toDateString() ===
                                          currentDate.toDateString()
                                        : false
                                      const isOverdue = sessionDate
                                        ? sessionDate.getTime() <
                                            currentDate.getTime() && !isToday
                                        : false

                                      return (
                                        <Card
                                          key={idx}
                                          className={cn(
                                            "border-muted bg-muted/5",
                                            isFutureSession && "opacity-70",
                                            isOverdue &&
                                              "border-red-200 bg-red-50/5"
                                          )}
                                        >
                                          <div className="p-2">
                                            <div className="mb-2 flex items-center justify-between">
                                              <span className="text-xs font-medium">
                                                Session{" "}
                                                {session.sessionNo || idx + 1}
                                              </span>
                                              <div className="flex items-center gap-1">
                                                {isFutureSession && (
                                                  <Badge className="bg-blue-500 text-[8px] text-white">
                                                    Upcoming
                                                  </Badge>
                                                )}
                                                {isOverdue && (
                                                  <Badge className="bg-red-500 text-[8px] text-white">
                                                    Overdue
                                                  </Badge>
                                                )}
                                                {isToday && (
                                                  <Badge className="bg-green-500 text-[8px] text-white">
                                                    Today
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                              {sessionDate &&
                                                format(
                                                  sessionDate,
                                                  "MMM d, yyyy"
                                                )}
                                              {session.startTime &&
                                                session.endTime && (
                                                  <span className="ml-2">
                                                    {session.startTime} -{" "}
                                                    {session.endTime}
                                                  </span>
                                                )}
                                            </div>

                                            {/* Attendance for this session - show first 3 employees */}
                                            {groupEmployees.length > 0 && (
                                              <div className="mt-2 space-y-1">
                                                {groupEmployees
                                                  .filter((employee) => {
                                                    if (isLearner) {
                                                      return (
                                                        employee.employeeId ===
                                                        currentUserId
                                                      )
                                                    }
                                                    if (
                                                      isDepartmentHead &&
                                                      profile?.deptDat
                                                    ) {
                                                      return (
                                                        employee.departmentName ===
                                                        profile.deptDat
                                                      )
                                                    }
                                                    return true
                                                  })
                                                  .slice(0, 3)
                                                  .map((employee) => {
                                                    const attendance =
                                                      getAttendanceForSession(
                                                        parseInt(session.id),
                                                        employee.id
                                                      )
                                                    const key = `${session.id}-${employee.id}`
                                                    const currentStatus =
                                                      attendanceStatuses[key] ||
                                                      attendance?.attendanceStatus ||
                                                      ""

                                                    return (
                                                      <div
                                                        key={employee.id}
                                                        className="flex items-center justify-between rounded bg-muted/30 px-2 py-1"
                                                      >
                                                        <div className="flex items-center gap-1.5">
                                                          <Avatar className="h-5 w-5">
                                                            <AvatarImage
                                                              src={resolveUploadUrl(
                                                                employee.profilePhotoPath
                                                              )}
                                                            />
                                                            <AvatarFallback className="text-[8px]">
                                                              {getInitials(
                                                                employee.employeeName
                                                              )}
                                                            </AvatarFallback>
                                                          </Avatar>
                                                          <span className="text-[10px]">
                                                            {truncateText(
                                                              employee.employeeName,
                                                              15
                                                            )}
                                                          </span>
                                                        </div>
                                                        {currentStatus ? (
                                                          <Badge className="border-green-200 bg-green-100 text-[8px] text-green-700">
                                                            {getAttendanceLabel(
                                                              currentStatus
                                                            )}
                                                          </Badge>
                                                        ) : (
                                                          <span className="text-[8px] text-muted-foreground">
                                                            Not recorded
                                                          </span>
                                                        )}
                                                      </div>
                                                    )
                                                  })}
                                                {groupEmployees.length > 3 && (
                                                  <p className="text-[8px] text-muted-foreground">
                                                    +{" "}
                                                    {groupEmployees.length - 3}{" "}
                                                    more
                                                  </p>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </Card>
                                      )
                                    }
                                  )}
                                </div>
                              )
                            ) : (
                              <div className="py-4 text-center text-xs text-muted-foreground">
                                Attendance tracking will be available after the
                                first session starts.
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </div>
          )}

        {/* Sessions Section - For Self-Study Courses */}
        {course.courseType === "self-study" && sessionsList.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <HugeiconsIcon
                icon={Calendar05Icon}
                strokeWidth={1.5}
                className="h-4 w-4"
              />
              Sessions ({sessionsList.length})
              {isUserEnrolled && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Enrolled
                </Badge>
              )}
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                const isFutureSession = sessionStatus === "future"
                const isOverdue = sessionStatus === "overdue"
                const isToday = sessionStatus === "today"
                const isPastOrToday =
                  sessionStatus === "overdue" || sessionStatus === "today"

                const isEditable =
                  isJLPT &&
                  isUserEnrolled &&
                  !isCompleted &&
                  userRole === "learner" &&
                  (sessionStatus === "today" ||
                    (sessionStatus === "future" &&
                      index === firstFutureSessionIndex))

                const isLocked =
                  isJLPT &&
                  isUserEnrolled &&
                  !isCompleted &&
                  userRole === "learner" &&
                  (sessionStatus === "overdue" ||
                    (sessionStatus === "future" &&
                      index !== firstFutureSessionIndex))

                const overallProgress = hasProgress
                  ? Math.round(
                      ((progress?.kanji_progress_percent || 0) +
                        (progress?.vocabulary_progress_percent || 0) +
                        (progress?.grammar_progress_percent || 0) +
                        (progress?.reading_progress_percent || 0) +
                        (progress?.listening_progress_percent || 0)) /
                        5
                    )
                  : 0

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
                } else if (
                  hasProgress &&
                  overallProgress > 0 &&
                  overallProgress < 100
                ) {
                  statusBadge = (
                    <Badge className="bg-blue-500 text-[10px] text-white">
                      Progress ({overallProgress}%)
                    </Badge>
                  )
                } else if (isOverdue && !isCompleted && sessionDate) {
                  statusBadge = (
                    <Badge className="bg-red-500 text-[10px] text-white">
                      Overdue by{" "}
                      {Math.ceil(
                        (TESTING_DATE.getTime() -
                          new Date(sessionDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days
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
                    <Badge
                      variant="outline"
                      className="border-yellow-400 bg-yellow-50 text-[10px] text-yellow-600"
                    >
                      Active
                    </Badge>
                  )
                }

                return (
                  <Card
                    key={index}
                    className={cn(
                      "flex flex-col overflow-hidden border-muted bg-muted/5 transition-colors",
                      isFutureSession &&
                        index !== firstFutureSessionIndex &&
                        "opacity-70",
                      isOverdue && !isCompleted && "border-red-200 bg-red-50/5"
                    )}
                  >
                    <div className="flex h-full flex-col">
                      <div className="flex flex-col gap-2 bg-muted/10 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            Session {index + 1}
                          </span>
                          {statusBadge}
                        </div>
                        {isFutureSession &&
                          index === firstFutureSessionIndex && (
                            <Badge className="self-start bg-purple-500 text-[10px] text-white">
                              Available Now
                            </Badge>
                          )}
                        {isToday && (
                          <Badge className="self-start bg-green-500 text-[10px] text-white">
                            Today
                          </Badge>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          {isJLPT ? (
                            <>
                              <HugeiconsIcon
                                icon={Calendar03Icon}
                                strokeWidth={1.5}
                                className="h-4 w-4 text-muted-foreground"
                              />
                              <span
                                className={cn(
                                  "font-medium",
                                  isOverdue && !isCompleted
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                                )}
                              >
                                {sessionDate
                                  ? format(
                                      new Date(sessionDate),
                                      "MMM d, yyyy (EEE)"
                                    )
                                  : "Dynamic based on enrollment"}
                              </span>
                            </>
                          ) : (
                            <>
                              <HugeiconsIcon
                                icon={ClockIcon}
                                strokeWidth={1.5}
                                className="h-4 w-4 text-muted-foreground"
                              />
                              <span className="font-medium text-muted-foreground">
                                Duration: {session.durationPerSession || 7} days
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {isJLPT && (
                        <div className="bg-muted/5 p-3">
                          <p className="mb-2 text-xs text-muted-foreground">
                            🎯 Session Targets:
                          </p>
                          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-muted-foreground">
                                Kanji:
                              </span>
                              <span className="font-semibold text-primary">
                                {session.kanjiCount || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-muted-foreground">
                                Vocab:
                              </span>
                              <span className="font-semibold text-primary">
                                {session.vocabularyCount || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-muted-foreground">
                                Grammar:
                              </span>
                              <span className="font-semibold text-primary">
                                {session.grammarCount || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-muted-foreground">
                                Reading:
                              </span>
                              <span className="font-semibold text-primary">
                                {session.readingMinutes || 0}min
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-muted-foreground">
                                Listening:
                              </span>
                              <span className="font-semibold text-primary">
                                {session.listeningMinutes || 0}min
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {isJLPT &&
                        isUserEnrolled &&
                        hasProgress &&
                        userRole === "learner" && (
                          <div className="flex-1 bg-muted/10 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                📊 Your Progress:
                              </p>
                              <div className="flex items-center gap-2">
                                {isCompleted ? (
                                  <Badge className="bg-green-500 text-[10px] text-white">
                                    <HugeiconsIcon
                                      icon={CheckCircle}
                                      strokeWidth={2}
                                      className="mr-1 h-3 w-3"
                                    />
                                    Completed
                                  </Badge>
                                ) : (
                                  <Badge className="bg-blue-500 text-[10px] text-white">
                                    Progress ({overallProgress}%)
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-muted-foreground">
                                    Kanji
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {progress?.kanji_progress_percent || 0}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-muted">
                                  <div
                                    className="h-1.5 rounded-full bg-primary transition-all duration-300"
                                    style={{
                                      width: `${Math.min(progress?.kanji_progress_percent || 0, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-muted-foreground">
                                    Vocab
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {progress?.vocabulary_progress_percent || 0}
                                    %
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-muted">
                                  <div
                                    className="h-1.5 rounded-full bg-primary transition-all duration-300"
                                    style={{
                                      width: `${Math.min(progress?.vocabulary_progress_percent || 0, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-muted-foreground">
                                    Grammar
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {progress?.grammar_progress_percent || 0}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-muted">
                                  <div
                                    className="h-1.5 rounded-full bg-primary transition-all duration-300"
                                    style={{
                                      width: `${Math.min(progress?.grammar_progress_percent || 0, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-muted-foreground">
                                    Reading
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {progress?.reading_progress_percent || 0}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-muted">
                                  <div
                                    className="h-1.5 rounded-full bg-primary transition-all duration-300"
                                    style={{
                                      width: `${Math.min(progress?.reading_progress_percent || 0, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-muted-foreground">
                                    Listening
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {progress?.listening_progress_percent || 0}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-muted">
                                  <div
                                    className="h-1.5 rounded-full bg-primary transition-all duration-300"
                                    style={{
                                      width: `${Math.min(progress?.listening_progress_percent || 0, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      {isEditable && (
                        <div className="flex-1 bg-muted/10 p-3">
                          <p className="mb-2 text-xs text-muted-foreground">
                            📝 Enter Your Progress:
                            {isToday && (
                              <span className="ml-2 font-medium text-green-500">
                                (Today's session)
                              </span>
                            )}
                            {isFutureSession &&
                              index === firstFutureSessionIndex && (
                                <span className="ml-2 font-medium text-purple-500">
                                  (Available now)
                                </span>
                              )}
                          </p>
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-0.5">
                                <Label className="text-[10px] text-muted-foreground">
                                  Kanji Completed
                                </Label>
                                <Input
                                  type="number"
                                  value={
                                    sessionInputs[sessionId]?.kanjiCount ??
                                    progress?.kanji_count ??
                                    0
                                  }
                                  onChange={(e) =>
                                    handleSessionInputChange(
                                      sessionId,
                                      "kanjiCount",
                                      e.target.value
                                    )
                                  }
                                  className="h-7 text-sm"
                                  min={0}
                                  placeholder="0"
                                  disabled={savingSessions[sessionId]}
                                />
                                <p className="text-[9px] text-muted-foreground">
                                  Target: {session.kanjiCount || 0}
                                </p>
                              </div>
                              <div className="space-y-0.5">
                                <Label className="text-[10px] text-muted-foreground">
                                  Vocab Completed
                                </Label>
                                <Input
                                  type="number"
                                  value={
                                    sessionInputs[sessionId]?.vocabularyCount ??
                                    progress?.vocabulary_count ??
                                    0
                                  }
                                  onChange={(e) =>
                                    handleSessionInputChange(
                                      sessionId,
                                      "vocabularyCount",
                                      e.target.value
                                    )
                                  }
                                  className="h-7 text-sm"
                                  min={0}
                                  placeholder="0"
                                  disabled={savingSessions[sessionId]}
                                />
                                <p className="text-[9px] text-muted-foreground">
                                  Target: {session.vocabularyCount || 0}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-0.5">
                                <Label className="text-[10px] text-muted-foreground">
                                  Grammar Completed
                                </Label>
                                <Input
                                  type="number"
                                  value={
                                    sessionInputs[sessionId]?.grammarCount ??
                                    progress?.grammar_count ??
                                    0
                                  }
                                  onChange={(e) =>
                                    handleSessionInputChange(
                                      sessionId,
                                      "grammarCount",
                                      e.target.value
                                    )
                                  }
                                  className="h-7 text-sm"
                                  min={0}
                                  placeholder="0"
                                  disabled={savingSessions[sessionId]}
                                />
                                <p className="text-[9px] text-muted-foreground">
                                  Target: {session.grammarCount || 0}
                                </p>
                              </div>
                              <div className="space-y-0.5">
                                <Label className="text-[10px] text-muted-foreground">
                                  Reading (min)
                                </Label>
                                <Input
                                  type="number"
                                  value={
                                    sessionInputs[sessionId]?.readingMinutes ??
                                    progress?.reading_minutes ??
                                    0
                                  }
                                  onChange={(e) =>
                                    handleSessionInputChange(
                                      sessionId,
                                      "readingMinutes",
                                      e.target.value
                                    )
                                  }
                                  className="h-7 text-sm"
                                  min={0}
                                  placeholder="0"
                                  disabled={savingSessions[sessionId]}
                                />
                                <p className="text-[9px] text-muted-foreground">
                                  Target: {session.readingMinutes || 0}min
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="col-span-2 space-y-0.5">
                                <Label className="text-[10px] text-muted-foreground">
                                  Listening (min)
                                </Label>
                                <Input
                                  type="number"
                                  value={
                                    sessionInputs[sessionId]
                                      ?.listeningMinutes ??
                                    progress?.listening_minutes ??
                                    0
                                  }
                                  onChange={(e) =>
                                    handleSessionInputChange(
                                      sessionId,
                                      "listeningMinutes",
                                      e.target.value
                                    )
                                  }
                                  className="h-7 text-sm"
                                  min={0}
                                  placeholder="0"
                                  disabled={savingSessions[sessionId]}
                                />
                                <p className="text-[9px] text-muted-foreground">
                                  Target: {session.listeningMinutes || 0}min
                                </p>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="mt-3 w-full gap-2"
                            onClick={() => handleSaveSession(sessionId)}
                            disabled={savingSessions[sessionId]}
                          >
                            {savingSessions[sessionId] ? (
                              <>
                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></span>
                                Saving...
                              </>
                            ) : (
                              <>
                                <HugeiconsIcon
                                  icon={SaveIcon}
                                  strokeWidth={2}
                                  className="h-4 w-4"
                                />
                                Save Progress
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {isLocked && (
                        <div className="border-t border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
                          <p className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                            <HugeiconsIcon
                              icon={Alert01Icon}
                              strokeWidth={2}
                              className="h-4 w-4"
                            />
                            {isOverdue ? (
                              <>
                                ⚠️ This session is overdue. Progress submission
                                is disabled.
                              </>
                            ) : (
                              <>
                                📅 This session is not yet available. Please
                                complete the previous session first.
                              </>
                            )}
                          </p>
                        </div>
                      )}

                      {!isJLPT && session.link && (
                        <div className="mt-auto bg-muted/5 p-3">
                          <div className="flex items-center gap-2 text-[11px]">
                            <HugeiconsIcon
                              icon={Megaphone02Icon}
                              strokeWidth={1.5}
                              className="h-4 w-4 text-muted-foreground"
                            />
                            <a
                              href={session.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="max-w-[150px] truncate font-medium text-primary hover:underline"
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
          </div>
        )}

        {/* Compact Learners Section - Always visible */}
        {filteredEnrollments.length > 0 && (
          <div>
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  strokeWidth={1.5}
                  className="h-4 w-4"
                />
                Enrolled Learners ({filteredEnrollments.length})
                {isApprover && !isDepartmentHead && profile?.team && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Team: {profile.team}
                  </Badge>
                )}
                {isDepartmentHead && profile?.deptDat && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Dept: {profile.deptDat}
                  </Badge>
                )}
              </h4>
              {filteredEnrollments.length > 9 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullLearners(!showFullLearners)}
                  className="gap-1 text-xs"
                >
                  <HugeiconsIcon
                    icon={showFullLearners ? ChevronDownIcon : ChevronRightIcon}
                    strokeWidth={2}
                    className="h-3 w-3"
                  />
                  {showFullLearners
                    ? "Show Less"
                    : `View All (${filteredEnrollments.length})`}
                </Button>
              )}
            </div>

            {!showFullLearners ? (
              // Compact view - avatar cards
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEnrollments.slice(0, 9).map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={employee.pfImage || ""} />
                      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {getInitials(employee.employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {employee.employeeName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {truncateText(employee.departmentName || "-", 25)}
                        {employee.teamName &&
                          ` • ${truncateText(employee.teamName, 20)}`}
                      </p>
                    </div>
                    {course.courseType === "trainer" && (
                      <Badge className="text-[10px]">
                        {employee.courseGroupName || "-"}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Full LearnersTab embedded
              <div className="mt-3">
                <LearnersTab
                  enrollments={enrollments}
                  userRole={userRole}
                  profile={profile}
                  enrollmentSearchTerm={enrollmentSearchTerm}
                  onSearchChange={onSearchChange}
                  course={course}
                  onRefreshEnrollments={handleRefreshEnrollments}
                  onAdminChangeGroup={onAdminChangeGroup}
                  isChangingGroup={isChangingGroup}
                  groupChangeError={groupChangeError}
                  groupChangeSuccess={groupChangeSuccess}
                  allEmployees={allEmployees}
                  groups={groups}
                  onEnrollEmployee={onEnrollEmployee}
                  onUnenrollEmployee={onUnenrollEmployee}
                  isEnrolling={isEnrolling}
                  isUnenrolling={isUnenrolling}
                />
              </div>
            )}

            {!showFullLearners && filteredEnrollments.length > 9 && (
              <p className="mt-2 text-sm text-muted-foreground">
                + {filteredEnrollments.length - 9} more learners
              </p>
            )}
          </div>
        )}
      </div>
    </TabsContent>
  )
}
