// app/dashboard/learnerDashboard-container.tsx
"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  ChampionIcon,
  Attachment01Icon,
  ArrowRight01Icon,
  UserGroupIcon,
  DashboardBrowsingIcon,
  CheckmarkCircle01Icon,
  Alert01Icon,
  SaveIcon,
  NotificationIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { StatCard } from "../charts/stat-card"
import { NotificationsDrawer } from "../drawers/notifications-drawer"
import { mainStore } from "@/store/mainStore"
import type { Course, CourseSession } from "@/types/course"
import type { EmployeeCourseDetailDTO } from "@/types/dashboard"
import { toast } from "sonner"

// Spinner component
const Spinner = ({ className, ...props }: React.ComponentProps<"svg">) => {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
    />
  )
}

// Spinner with text
const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <Spinner />
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
}

interface LearnerDashboardContainerProps {
  onNavigateToCourse?: (courseId: number) => void
  onNavigateToCertificate?: (certificateId: number) => void
  onNavigateToNotifications?: () => void
}

const getInitials = (name: string) => {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"
  )
}

// Attendance status options
const ATTENDANCE_OPTIONS = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
  { value: "EXCUSED", label: "Excused" },
]

const getAttendanceStatusBadge = (status: string | null) => {
  if (!status) return null
  switch (status) {
    case "PRESENT":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          Present
        </Badge>
      )
    case "ABSENT":
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          Absent
        </Badge>
      )
    case "LATE":
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          Late
        </Badge>
      )
    case "EXCUSED":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          Excused
        </Badge>
      )
    default:
      return null
  }
}

const formatTime = (timestamp: string) => {
  if (!timestamp) return "Just now"
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} mins ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

export default function LearnerDashboardContainer({
  onNavigateToCourse,
  onNavigateToCertificate,
  onNavigateToNotifications,
}: LearnerDashboardContainerProps) {
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingAttendance, setIsUpdatingAttendance] = useState(false)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const [savedAttendance, setSavedAttendance] = useState<{
    [key: string]: boolean
  }>({})
  const [savingSessions, setSavingSessions] = useState<{
    [key: string]: boolean
  }>({})
  const [savedProgress, setSavedProgress] = useState<{ [key: string]: any }>({})

  const {
    fetchEmployeeCourseStats,
    fetchEmployeeAttendance,
    fetchEmployeeTargetLevel,
    fetchAllUpcomingSessions,
    employeeCourseStats,
    employeeAttendance,
    employeeTargetLevel,
    upcomingAllSessionsData,
    profile,
    createAttendance,
    updateAttendance,
    fetch_courseEnrollments,
    enrollments,
    isLoading: attendanceLoading,
    // Self-study progress functions
    fetch_studyProgress,
    add_studyProgress,
    update_studyProgress,
    studyProgress,
    isFetchingProgress,
    isUpdatingProgress,
    progressError,
    // Notifications
    notifications: storeNotifications,
    unreadCount,
    fetch_Notifications,
    fetch_UnreadCount,
  } = mainStore()

  // Fetch notifications when component mounts
  useEffect(() => {
    if (profile?.id) {
      fetch_Notifications(profile.id, false)
      fetch_UnreadCount(profile.id)
    }
  }, [profile?.id, fetch_Notifications, fetch_UnreadCount])

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        await fetchEmployeeCourseStats(profile.id)
        await fetchEmployeeAttendance(profile.id)
        await fetchAllUpcomingSessions(profile.id)
        await fetchEmployeeTargetLevel(profile.id)

        // Fetch study progress for self-study courses
        const selfStudyCourses = upcomingAllSessionsData.filter(
          (session: CourseSession) => session.courseType === "SELF_STUDY"
        )
        for (const session of selfStudyCourses) {
          await fetch_studyProgress(session.courseId)
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [
    fetchEmployeeCourseStats,
    fetchEmployeeAttendance,
    profile?.id,
    fetchAllUpcomingSessions,
    fetchEmployeeTargetLevel,
  ])

  // Fetch enrollments for the current user to get enrollment IDs
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (upcomingAllSessionsData.length > 0) {
        // Get unique course IDs for trainer-provided courses
        const uniqueCourseIds = new Set<string | number>()
        upcomingAllSessionsData.forEach((session: CourseSession) => {
          if (session.courseType === "TRAINER_PROVIDED" && session.courseId) {
            uniqueCourseIds.add(session.courseId)
          }
        })

        // Fetch enrollments for each course
        for (const courseId of uniqueCourseIds) {
          try {
            await fetch_courseEnrollments(courseId)
          } catch (error) {
            console.error(
              `Failed to fetch enrollments for course ${courseId}:`,
              error
            )
          }
        }
      }
    }

    fetchEnrollments()
  }, [upcomingAllSessionsData, fetch_courseEnrollments])

  // Update saved progress when studyProgress changes
  useEffect(() => {
    if (
      studyProgress &&
      studyProgress.progress &&
      Array.isArray(studyProgress.progress)
    ) {
      const progressMap: { [key: string]: any } = {}
      studyProgress.progress.forEach((p: any) => {
        if (p.self_study_session_id) {
          const key = p.self_study_session_id.toString()
          progressMap[key] = {
            ...p,
            id: p.id,
          }
        }
      })
      setSavedProgress(progressMap)
    }
  }, [studyProgress])

  // Helper to get enrollment ID for a course
  const getEnrollmentId = (courseId: number): number | null => {
    const enrollment = enrollments.find(
      (e: any) => e.courseId === courseId && e.employeeId === profile?.id
    )
    return enrollment?.id || null
  }

  // Self-study progress state
  const [selfStudyInputs, setSelfStudyInputs] = useState<{
    [key: number]: {
      kanjiCount: number
      vocabularyCount: number
      grammarCount: number
      readingMinutes: number
      listeningMinutes: number
    }
  }>({})

  // Initialize session inputs when sessions load
  useEffect(() => {
    const initialInputs: { [key: number]: any } = {}
    const selfStudySessions = upcomingAllSessionsData.filter(
      (session: CourseSession) => session.courseType === "SELF_STUDY"
    )

    selfStudySessions.forEach((session: CourseSession) => {
      // Check if sessionId exists
      if (session.sessionId) {
        const existingProgress = savedProgress[session.sessionId.toString()]
        if (existingProgress) {
          initialInputs[session.sessionId] = {
            kanjiCount: existingProgress.kanji_count || 0,
            vocabularyCount: existingProgress.vocabulary_count || 0,
            grammarCount: existingProgress.grammar_count || 0,
            readingMinutes: existingProgress.reading_minutes || 0,
            listeningMinutes: existingProgress.listening_minutes || 0,
          }
        } else {
          initialInputs[session.sessionId] = {
            kanjiCount: 0,
            vocabularyCount: 0,
            grammarCount: 0,
            readingMinutes: 0,
            listeningMinutes: 0,
          }
        }
      }
    })
    setSelfStudyInputs(initialInputs)
  }, [upcomingAllSessionsData, savedProgress])

  const handleAttendanceChange = async (session: any, value: string) => {
    // Only proceed if it's a trainer-led session
    if (session.courseType !== "TRAINER_PROVIDED") return

    setAttendanceError(null)
    setIsUpdatingAttendance(true)

    const key = `${session.sessionId}`

    try {
      // Get enrollment ID for this course
      const enrollmentId = getEnrollmentId(session.courseId)

      if (!enrollmentId) {
        console.error("No enrollment found for course:", session.courseId)
        throw new Error(
          `You are not enrolled in this course. Please contact your administrator.`
        )
      }

      const attendanceRequest = {
        enrollmentId: enrollmentId,
        courseSessionId: session.sessionId,
        attendanceStatus: value as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
      }

      // Check if attendance already exists
      if (session.attendanceId) {
        // Update existing attendance
        await updateAttendance(
          session.courseId,
          session.groupId,
          session.attendanceId,
          attendanceRequest
        )
      } else {
        // Create new attendance
        await createAttendance(
          session.courseId,
          session.groupId,
          attendanceRequest
        )
      }

      // Show saved indicator
      setSavedAttendance((prev) => ({
        ...prev,
        [key]: true,
      }))

      // Auto-hide the saved indicator after 1.5 seconds
      setTimeout(() => {
        setSavedAttendance((prev) => ({
          ...prev,
          [key]: false,
        }))
      }, 1500)

      // Refresh the sessions data to get updated attendance status
      await fetchAllUpcomingSessions(profile?.id)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update attendance"
      console.error("❌ Error updating attendance:", error)
      setAttendanceError(errorMessage)
    } finally {
      setIsUpdatingAttendance(false)
    }
  }

  const handleSessionInputChange = (
    sessionId: number,
    field: string,
    value: string
  ) => {
    const numValue = parseInt(value) || 0

    setSelfStudyInputs((prev) => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [field]: numValue,
      },
    }))
  }

  const handleSaveProgress = async (session: any) => {
    const sessionId = session.sessionId
    const values = selfStudyInputs[sessionId]

    if (!values) {
      toast.warning("No progress data to save")
      return
    }

    const existingProgress = savedProgress[sessionId?.toString()]

    const progressData = {
      enrollment_id: getEnrollmentId(session.courseId),
      self_study_session_id: sessionId,
      kanji_count: values.kanjiCount || 0,
      vocabulary_count: values.vocabularyCount || 0,
      grammar_count: values.grammarCount || 0,
      reading_minutes: values.readingMinutes || 0,
      listening_minutes: values.listeningMinutes || 0,
      completion_status: "IN_PROGRESS",
    }

    // Check if all targets are met
    const allTargetsMet =
      (values.kanjiCount || 0) >= (session.kanjiTarget || 0) &&
      (values.vocabularyCount || 0) >= (session.vocabularyTarget || 0) &&
      (values.grammarCount || 0) >= (session.grammarTarget || 0) &&
      (values.readingMinutes || 0) >= (session.readingTargetMinutes || 0) &&
      (values.listeningMinutes || 0) >= (session.listeningTargetMinutes || 0)

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
        result = await add_studyProgress(session.courseId, progressData)
      } else {
        result = await update_studyProgress(
          session.courseId,
          existingProgress.id,
          progressData
        )
      }

      if (result.success) {
        // Refresh study progress
        await fetch_studyProgress(session.courseId)

        // Show success message
        if (allTargetsMet) {
          toast.success(`🎉 Session completed!`)
        } else {
          toast.success(`Progress saved successfully for ${session.courseName}`)
        }
      } else {
        toast.error(result.message || "Failed to save progress")
      }
    } catch (error) {
      console.error("Error saving progress:", error)
      toast.error("An error occurred while saving progress")
    } finally {
      setSavingSessions((prev) => ({
        ...prev,
        [sessionId]: false,
      }))
    }
  }

  // Get session status based on date for self-study sessions
  const getSelfStudySessionStatus = (session: any) => {
    if (session.courseType !== "SELF_STUDY") return session.status

    const deadline = session.sessionDeadline
      ? new Date(session.sessionDeadline)
      : null
    if (!deadline) return "PLANNED"

    const today = new Date()
    const isPast = deadline < today
    const isToday = deadline.toDateString() === today.toDateString()

    if (isPast || isToday) {
      return "ACTIVE"
    }
    return "UPCOMING"
  }

  const getStatusBadge = (status: string, isSelfStudy: boolean = false) => {
    // For self-study, we use the derived status
    const displayStatus = status

    switch (displayStatus) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Active
          </Badge>
        )
      case "UPCOMING":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Upcoming
          </Badge>
        )
      case "PLANNED":
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
            Planned
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  // Check if attendance can be edited (only for today or past sessions)
  const canEditAttendance = (sessionDate: string) => {
    if (!sessionDate) return false
    const date = new Date(sessionDate)
    const today = new Date()
    return date <= today
  }

  // Filter sessions to show only one per course
  const filterSessionsPerCourse = (sessions: any[]) => {
    const courseMap = new Map()

    sessions.forEach((session) => {
      if (!courseMap.has(session.courseId)) {
        courseMap.set(session.courseId, {
          active: null,
          upcoming: null,
          planned: null,
        })
      }

      const courseSessions = courseMap.get(session.courseId)

      if (session.status === "ACTIVE" && !courseSessions.active) {
        courseSessions.active = session
      }
      if (session.status === "UPCOMING" && !courseSessions.upcoming) {
        courseSessions.upcoming = session
      }
      if (session.status === "PLANNED" && !courseSessions.planned) {
        courseSessions.planned = session
      }
    })

    const result = []
    for (const [courseId, sessions] of courseMap) {
      if (sessions.active) result.push(sessions.active)
      if (sessions.upcoming) result.push(sessions.upcoming)
      if (sessions.planned) result.push(sessions.planned)
    }
    return result
  }

  const filteredSessions = filterSessionsPerCourse(upcomingAllSessionsData)

  // Handle notification actions
  const handleNotificationAction = (
    action: "view-course" | "view-certificate",
    id: number
  ) => {
    if (action === "view-course") {
      // Use the navigation callback
      if (onNavigateToCourse) {
        onNavigateToCourse(id)
      }
    } else if (action === "view-certificate") {
      // Use the navigation callback
      if (onNavigateToCertificate) {
        onNavigateToCertificate(id)
      }
    }
  }

  // Transform notifications for display in the card - Show ALL types, latest 3, no filtering
  const getDisplayNotifications = () => {
    if (!storeNotifications || storeNotifications.length === 0) {
      return []
    }

    // Sort notifications by createdAt (newest first)
    const sortedNotifications = [...storeNotifications].sort(
      (a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    )

    // Take only the latest 3 notifications
    const latestNotifications = sortedNotifications.slice(0, 3)

    return latestNotifications.map((notif: any) => {
      // Determine if action is needed based on type
      let hasAction = false
      if (notif.type === "COURSE" || notif.type === "CERTIFICATE") {
        hasAction = true
      }

      return {
        id: notif.id,
        message: notif.message,
        time: formatTime(notif.createdAt),
        unread: !notif.read,
        type: notif.type,
        courseId: notif.courseId,
        certificateId: notif.certificateId,
        hasAction,
      }
    })
  }

  const displayNotifications = getDisplayNotifications()

  // Get total count of all notifications
  const totalNotificationsCount = storeNotifications?.length || 0

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner text="Loading dashboard..." />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col pt-4 pb-6">
        <CardContent className="space-y-4 px-4">
          {/* Stats Row - 4 cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Total Courses"
              value={employeeCourseStats?.totalCourses || 0}
              icon={BookOpenIcon}
              description={`${employeeCourseStats?.completedCourses || 0} completed`}
            />
            <StatCard
              title="Average Attendance"
              value={`${Math.round(employeeAttendance?.courses?.averageAttendance) || 0}%`}
              icon={CalendarIcon}
              description="Daily Attendance average"
            />
            <StatCard
              title="Total Sessions"
              value={employeeCourseStats?.totalSessions || 0}
              icon={DashboardBrowsingIcon}
              description={`${employeeCourseStats?.activeSessions || 0} active`}
            />
            <StatCard
              title="JLPT Level"
              value={employeeTargetLevel?.jlptHighestLevel || "None"}
              icon={ChampionIcon}
              description={
                employeeTargetLevel?.targetJlptNatLevel
                  ? `Target: ${employeeTargetLevel.targetJlptNatLevel} by ${employeeTargetLevel.targetDate ? new Date(employeeTargetLevel.targetDate).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Not set"}`
                  : ""
              }
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Overall Attendance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Overall Attendance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employeeCourseStats?.courses?.map(
                  (course: EmployeeCourseDetailDTO, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">
                            {course.courseName}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {course.attendance}%
                        </span>
                      </div>
                      <Progress value={course.attendance} className="h-2" />
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Daily Attendance Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Daily Attendance Rate</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {employeeAttendance?.courses?.map(
                  (course: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">
                            {course.courseName}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {course.attendance}%
                        </span>
                      </div>
                      <Progress value={course.attendance} className="h-2" />
                    </div>
                  )
                )}
              </CardContent>
              <CardFooter>
                <div className="flex w-full items-start gap-2 text-sm">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2 leading-none font-medium">
                      Average attendance:{" "}
                      {Math.round(
                        employeeAttendance?.courses?.averageAttendance || 0
                      )}
                      %
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>

            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>
                  Your scheduled learning sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[500px] space-y-4 overflow-y-auto">
                {filteredSessions.map((session, index) => {
                  const key = `${session.sessionId}`
                  const isSaving =
                    isUpdatingAttendance && key === `${session.sessionId}`
                  const isSaved = savedAttendance[key]
                  const canEdit = canEditAttendance(session.sessionDate)
                  const sessionDate = session.sessionDate
                    ? new Date(session.sessionDate)
                    : null
                  const isToday = sessionDate
                    ? sessionDate.toDateString() === new Date().toDateString()
                    : false

                  // Self-study progress
                  const progress = savedProgress[session.sessionId?.toString()]
                  const isSavingProgress = savingSessions[session.sessionId]
                  const inputs = selfStudyInputs[session.sessionId] || {
                    kanjiCount: 0,
                    vocabularyCount: 0,
                    grammarCount: 0,
                    readingMinutes: 0,
                    listeningMinutes: 0,
                  }

                  // Calculate overall progress
                  const overallProgress = progress
                    ? Math.round(
                        ((progress.kanji_progress_percent || 0) +
                          (progress.vocabulary_progress_percent || 0) +
                          (progress.grammar_progress_percent || 0) +
                          (progress.reading_progress_percent || 0) +
                          (progress.listening_progress_percent || 0)) /
                          5
                      )
                    : 0

                  const isCompleted =
                    progress?.completion_status === "COMPLETED"

                  return (
                    <div
                      key={index}
                      className={cn(
                        "rounded-lg border p-4 transition-colors hover:bg-muted/50",
                        !canEdit &&
                          sessionDate &&
                          sessionDate > new Date() &&
                          "opacity-70"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {session.courseName}
                            </h4>
                            {session.courseType === "TRAINER_PROVIDED" ? (
                              <Badge variant="outline" className="text-xs">
                                <HugeiconsIcon
                                  icon={UserGroupIcon}
                                  strokeWidth={2}
                                  className="mr-1 h-3 w-3"
                                />
                                Trainer-led
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <HugeiconsIcon
                                  icon={BookOpenIcon}
                                  strokeWidth={2}
                                  className="mr-1 h-3 w-3"
                                />
                                Self-study
                              </Badge>
                            )}
                            {isCompleted && (
                              <Badge className="bg-green-500 text-[10px] text-white">
                                <HugeiconsIcon
                                  icon={CheckmarkCircle01Icon}
                                  strokeWidth={2}
                                  className="mr-1 h-3 w-3"
                                />
                                Completed
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <HugeiconsIcon
                              icon={CalendarIcon}
                              strokeWidth={2}
                              className="h-3.5 w-3.5"
                            />
                            <span>
                              {new Date(
                                session.sessionDate || session.sessionDeadline
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            {session.courseType === "TRAINER_PROVIDED" &&
                              session.startTime &&
                              session.endTime && (
                                <>
                                  <span>•</span>
                                  <HugeiconsIcon
                                    icon={ClockIcon}
                                    strokeWidth={2}
                                    className="h-3.5 w-3.5"
                                  />
                                  <span>
                                    {session.startTime.slice(0, 5)} -{" "}
                                    {session.endTime.slice(0, 5)}
                                  </span>
                                </>
                              )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {session.courseType === "SELF_STUDY"
                            ? getStatusBadge(getSelfStudySessionStatus(session))
                            : getStatusBadge(session.status)}
                        </div>
                      </div>

                      {/* Trainer-led session - Attendance dropdown for learners */}
                      {session.courseType === "TRAINER_PROVIDED" && (
                        <div className="mt-3">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                Attendance:
                              </span>
                              {session.attendanceStatus ? (
                                getAttendanceStatusBadge(
                                  session.attendanceStatus
                                )
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  Not marked
                                </span>
                              )}
                            </div>
                            {canEdit ? (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={session.attendanceStatus || ""}
                                  onValueChange={(value) =>
                                    handleAttendanceChange(session, value)
                                  }
                                  disabled={isSaving || attendanceLoading}
                                >
                                  <SelectTrigger className="h-8 w-[140px] text-xs">
                                    <SelectValue placeholder="Mark status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ATTENDANCE_OPTIONS.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={cn(
                                              "h-2 w-2 rounded-full",
                                              option.value === "PRESENT" &&
                                                "bg-green-500",
                                              option.value === "ABSENT" &&
                                                "bg-red-500",
                                              option.value === "LATE" &&
                                                "bg-yellow-500",
                                              option.value === "EXCUSED" &&
                                                "bg-blue-500"
                                            )}
                                          />
                                          {option.label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {isSaving ? (
                                  <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></span>
                                ) : isSaved ? (
                                  <HugeiconsIcon
                                    icon={CheckmarkCircle01Icon}
                                    strokeWidth={2}
                                    className="h-4 w-4 text-green-500"
                                  />
                                ) : (
                                  session.attendanceStatus && (
                                    <span className="h-4 w-4"></span>
                                  )
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {sessionDate && sessionDate > new Date() ? (
                                  <span className="flex items-center gap-1 text-blue-500">
                                    <HugeiconsIcon
                                      icon={CalendarIcon}
                                      strokeWidth={2}
                                      className="h-3 w-3"
                                    />
                                    Available on session day
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Locked
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          {attendanceError && (
                            <div className="mt-2 text-sm text-red-500">
                              Error: {attendanceError}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Self-study session - Progress */}
                      {session.courseType === "SELF_STUDY" && (
                        <div className="mt-4 space-y-3">
                          {/* Input fields for progress */}
                          {!isCompleted && (
                            <>
                              <div className="grid grid-cols-5 gap-2">
                                {[
                                  {
                                    key: "kanjiCount",
                                    label: "Kanji",
                                    target: session.kanjiTarget || 0,
                                  },
                                  {
                                    key: "vocabularyCount",
                                    label: "Vocab",
                                    target: session.vocabularyTarget || 0,
                                  },
                                  {
                                    key: "grammarCount",
                                    label: "Grammar",
                                    target: session.grammarTarget || 0,
                                  },
                                  {
                                    key: "readingMinutes",
                                    label: "Reading (min)",
                                    target: session.readingTargetMinutes || 0,
                                  },
                                  {
                                    key: "listeningMinutes",
                                    label: "Listening (min)",
                                    target: session.listeningTargetMinutes || 0,
                                  },
                                ].map((item) => {
                                  const currentValue =
                                    inputs[item.key as keyof typeof inputs] || 0
                                  const targetValue = item.target

                                  return (
                                    <div key={item.key} className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">
                                        {item.label}
                                      </Label>
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          value={currentValue}
                                          onChange={(e) =>
                                            handleSessionInputChange(
                                              session.sessionId,
                                              item.key,
                                              e.target.value
                                            )
                                          }
                                          className="h-8 text-center text-xs"
                                          min={0}
                                          max={targetValue || 999}
                                          disabled={
                                            isSavingProgress ||
                                            isUpdatingProgress
                                          }
                                        />
                                      </div>
                                      <div className="text-center text-[10px] text-muted-foreground">
                                        Target: {targetValue}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                              <Button
                                size="sm"
                                className="w-full gap-2"
                                onClick={() => handleSaveProgress(session)}
                                disabled={
                                  isSavingProgress || isUpdatingProgress
                                }
                              >
                                {isSavingProgress || isUpdatingProgress ? (
                                  <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></span>
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
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Notifications - Using real data from store */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b py-0">
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Important updates and reminders
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  className="justify-center gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setNotificationsDrawerOpen(true)}
                >
                  All Notifications
                  {totalNotificationsCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                    >
                      {totalNotificationsCount}
                    </Badge>
                  )}
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                </Button>
              </CardHeader>
              <CardContent className="max-h-[400px] scrollbar-thin space-y-4 overflow-y-auto">
                {displayNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <HugeiconsIcon
                      icon={NotificationIcon}
                      strokeWidth={2}
                      className="mb-2 h-8 w-8 text-gray-300"
                    />
                    <p className="text-sm text-gray-400">No notifications</p>
                  </div>
                ) : (
                  displayNotifications.map((notification, index) => {
                    const isLast = index === displayNotifications.length - 1
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "group relative flex gap-3 transition-colors",
                          !isLast && "border-b border-gray-100 pb-4"
                        )}
                      >
                        {/* System Icon */}
                        <div className="flex-shrink-0 pt-0.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                            <HugeiconsIcon
                              icon={NotificationIcon}
                              strokeWidth={2}
                              className="h-5 w-5 text-gray-500"
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] leading-snug text-gray-900">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-[13px] text-gray-400">
                            {notification.time}
                          </p>
                          {notification.hasAction && notification.courseId && (
                            <div className="mt-3 flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Use the navigation callback
                                  if (onNavigateToCourse) {
                                    onNavigateToCourse(notification.courseId)
                                  }
                                }}
                              >
                                View Course
                              </Button>
                            </div>
                          )}
                        </div>
                        {notification.unread && (
                          <div className="flex-shrink-0 pt-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </div>

      {/* Notifications Drawer */}
      <NotificationsDrawer
        open={notificationsDrawerOpen}
        onOpenChange={setNotificationsDrawerOpen}
        onAction={handleNotificationAction}
      />
    </>
  )
}
