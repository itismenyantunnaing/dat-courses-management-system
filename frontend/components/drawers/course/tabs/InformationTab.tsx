// components/course/tabs/InformationTab.tsx
"use client"

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckCircle,
  ArrowLeft01Icon,
  Calendar01Icon,
  ArrowRight01Icon,
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
import {
  WEEKDAY_LABELS,
  HOUR_START,
  HOUR_END,
  HOUR_HEIGHT,
  STROKE_WIDTH,
  SESSION_THEMES,
} from "@/components/schedule/constants/schedule.constants"
import {
  getWeekStart,
  getWeekDates,
  isSameDay,
  formatHourLabel,
  formatTimeLabel,
  formatWeekRangeLabel,
  formatMonthLabel,
  formatFullDate,
} from "@/components/schedule/utils/schedule.utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SessionDetailDialog } from "@/components/dialogs/sessionDetail-dialog"
import {
  Session,
  SessionDialogState,
  SessionAttendanceStatus,
  SessionLearnerRow,
  SessionProgressRow,
  SelfStudyProgressFields,
} from "@/types/schedule"

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

const parseTimeToHour = (timeStr: string): number => {
  if (!timeStr) return 9
  const parts = timeStr.split(":")
  const h = parseInt(parts[0] || "9", 10)
  const m = parseInt(parts[1] || "0", 10)
  return h + m / 60
}

const dateToDayIndex = (date: Date): number => {
  const jsDay = date.getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

const THEME_COUNT = SESSION_THEMES.length

const hashStringToTheme = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return hash % THEME_COUNT
}

const parseSessionId = (
  id: string
): {
  prefix: "t" | "s" | null
  courseId: string | null
  groupId: string | null
  sessionId: string | null
  empId?: string | null
} | null => {
  const parts = id.split("-")
  if (parts.length < 2) return null
  const prefix = parts[0] as "t" | "s"
  if (prefix === "t" && parts.length >= 4) {
    return {
      prefix,
      courseId: parts[1] || null,
      groupId: parts[2] || null,
      sessionId: parts[3] || null,
    }
  }
  if (prefix === "s" && parts.length >= 3) {
    return {
      prefix,
      courseId: parts[1] || null,
      groupId: null,
      sessionId: parts[2] || null,
      empId: parts[3] || null,
    }
  }
  return null
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

  // const TESTING_DATE = new Date()
  const TESTING_DATE: Date | null = new Date("2026-09-10")

  const [showFullLearners, setShowFullLearners] = useState(false)

  // Session state
  const [savedProgress, setSavedProgress] = useState<Record<string, any>>({})
  const [sessionInputs, setSessionInputs] = useState<Record<string, any>>({})
  const [savingSessions, setSavingSessions] = useState<Record<string, boolean>>(
    {}
  )

  // Schedule state
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [searchTerm, setSearchTerm] = useState("")
  const [justScrolledToToday, setJustScrolledToToday] = useState(false)
  const [dialog, setDialog] = useState<SessionDialogState>({
    open: false,
    session: null,
  })
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Attendance store for dialog
  const [attendanceStore, setAttendanceStore] = useState<
    Record<string, SessionLearnerRow[]>
  >({})

  const [progressStore, setProgressStore] = useState<
    Record<string, SessionProgressRow[]>
  >({})

  const {
    fetch_courseEnrollments,
    studyProgress,
    fetch_studyProgress,
    add_studyProgress,
    update_studyProgress,
    enrollments: allEnrollments,
    attendances: allAttendances,
    fetchAttendance,
    getUserId,
  } = mainStore()

  const currentUserIdFromStore = getUserId?.() || "unknown-user"
  const effectiveUserId = currentUserId || currentUserIdFromStore

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const today = useMemo(() => TESTING_DATE || new Date(), [TESTING_DATE])

  const [nowTime, setNowTime] = useState(() => TESTING_DATE || new Date())
  useEffect(() => {
    const id = window.setInterval(() => {
      setNowTime(TESTING_DATE || new Date())
    }, 60 * 1000)
    return () => window.clearInterval(id)
  }, [])

  // Get user's enrolled groups for trainer courses - SAME AS SCHEDULETAB
  const userEnrolledGroupIds = useMemo(() => {
    if (course.courseType !== "trainer" || isAdmin) {
      return null // null means show all groups (admin) or not applicable
    }

    const courseIdNum = parseInt(course.id, 10)
    if (isNaN(courseIdNum)) return new Set<string>()

    const userEnrollments = allEnrollments.filter((eRaw) => {
      const e = eRaw as Record<string, unknown>
      const eCourseId =
        typeof e.courseId === "number"
          ? e.courseId
          : typeof e.courseId === "string"
            ? parseInt(e.courseId, 10)
            : NaN
      const eEmpId = (e.employeeId || e.employee_id) as string
      const eStatus = (e.enrollmentStatus || e.status) as string
      return (
        eCourseId === courseIdNum &&
        eEmpId === effectiveUserId &&
        eStatus !== "CANCELLED"
      )
    })

    const groupIds = new Set<string>()
    userEnrollments.forEach((e) => {
      const eGroupId = (e as Record<string, unknown>).courseGroupId
      if (eGroupId) {
        groupIds.add(String(eGroupId))
      }
    })

    return groupIds
  }, [course, allEnrollments, effectiveUserId, isAdmin])

  // Fetch attendance data for trainer courses
  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (course.courseType !== "trainer" || !course.groups) return

      const cid = parseInt(course.id, 10)
      if (isNaN(cid)) return

      try {
        await fetch_courseEnrollments(cid)

        for (const group of course.groups) {
          const gid = parseInt(group.id, 10)
          if (isNaN(gid)) continue
          await fetchAttendance(cid, gid)
        }
        console.log('✅ Attendance data fetched successfully for course:', course.id)
      } catch (e) {
        console.warn(`Failed to fetch attendance data for course ${course.id}:`, e)
      }
    }

    fetchAttendanceData()
  }, [course.id, course.courseType, course.groups, fetch_courseEnrollments, fetchAttendance])

  const nowHour =
    nowTime.getHours() + nowTime.getMinutes() / 60 + nowTime.getSeconds() / 3600
  const nowDayIndex = (() => {
    const d = nowTime.getDay()
    return d === 0 ? 6 : d - 1
  })()

  const nowInRange = nowHour >= HOUR_START && nowHour <= HOUR_END
  const nowTop =
    nowHour <= HOUR_START
      ? 0
      : nowHour >= HOUR_END
        ? (HOUR_END - HOUR_START) * HOUR_HEIGHT
        : (nowHour - HOUR_START) * HOUR_HEIGHT
  const todayDayIndex = weekDates.findIndex((d) => isSameDay(d, nowTime))

  const hours = useMemo(
    () =>
      Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i),
    []
  )

  // Derived sessions for trainer course - SAME AS SCHEDULETAB
  const derivedSessions = useMemo<Session[]>(() => {
    const result: Session[] = []
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    const weekStartDate = new Date(weekStart)
    weekStartDate.setHours(0, 0, 0, 0)

    const isInWeek = (d: Date): boolean => {
      const t = d.getTime()
      if (isNaN(t)) return false
      return t >= weekStartDate.getTime() && t <= weekEnd.getTime()
    }

    if (course.courseType === "trainer") {
      course.groups?.forEach((group: any) => {
        // For learners: only include groups they're enrolled in - SAME AS SCHEDULETAB
        if (!isAdmin && userEnrolledGroupIds) {
          const groupId = group.id || String(group.id)
          if (!userEnrolledGroupIds.has(groupId)) {
            return // Skip this group
          }
        }

        group.sessions?.forEach((sess: any) => {
          if (!sess.date) return
          const d = new Date(sess.date)
          if (isNaN(d.getTime())) return
          if (!isInWeek(d)) return

          const startHour = sess.startTime
            ? parseTimeToHour(sess.startTime)
            : parseTimeToHour(group.startTime || "09:00")
          const endHour = sess.endTime
            ? parseTimeToHour(sess.endTime)
            : parseTimeToHour(group.endTime || "10:00")

          result.push({
            id: `t-${course.id}-${group.id}-${sess.id}`,
            name: `Session ${sess.sessionNo ?? 1}`,
            courseName: course.title || course.name || "",
            instructor: course.trainerName || course.instructor || "TBA",
            instructorEmail: undefined,
            dayIndex: dateToDayIndex(d),
            startHour,
            endHour,
            theme: hashStringToTheme(`${course.id}-${group.id}`),
            group: group.name,
            type: "trainer-provided",
            sessionDate: d,
          })
        })
      })
    }

    return result
  }, [course, weekStart, isAdmin, userEnrolledGroupIds])

  const filteredSessions = useMemo(() => {
    let sessions = derivedSessions

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      sessions = sessions.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.courseName.toLowerCase().includes(term) ||
          (s.instructor ?? "").toLowerCase().includes(term) ||
          (s.group ?? "").toLowerCase().includes(term)
      )
    }

    return sessions
  }, [derivedSessions, searchTerm])

  // Initialize attendance store for dialog - SAME AS SCHEDULETAB
  useEffect(() => {
    const initialAttendance: Record<string, SessionLearnerRow[]> = {}

    derivedSessions.forEach((s) => {
      if (s.type === "trainer-provided") {
        const parsed = parseSessionId(s.id)
        const courseIdNum = parsed?.courseId ? parseInt(parsed.courseId, 10) : NaN
        const groupIdNum = parsed?.groupId ? parseInt(parsed.groupId, 10) : NaN
        const sessionIdNum = parsed?.sessionId ? parseInt(parsed.sessionId, 10) : NaN
        const sessionNoMatch = s.name.match(/Session\s+(\d+)/i)
        const sessionNo = sessionNoMatch ? Number(sessionNoMatch[1]) : null

        const groupEnrollments = allEnrollments.filter((eRaw) => {
          const e = eRaw as Record<string, unknown>
          const eCourseId =
            typeof e.courseId === "number"
              ? e.courseId
              : typeof e.courseId === "string"
                ? parseInt(e.courseId, 10)
                : NaN
          const eGroupId =
            typeof e.courseGroupId === "number"
              ? e.courseGroupId
              : typeof e.courseGroupId === "string"
                ? parseInt(e.courseGroupId, 10)
                : NaN
          return eCourseId === courseIdNum && eGroupId === groupIdNum
        })

        if (groupEnrollments.length === 0) {
          initialAttendance[s.id] = []
          return
        }

        initialAttendance[s.id] = groupEnrollments.map((enrollmentRaw) => {
          const enrollment = enrollmentRaw as Record<string, unknown>
          const empId =
            typeof enrollment.employeeId === "string"
              ? enrollment.employeeId
              : typeof enrollment.employee_id === "string"
                ? enrollment.employee_id
                : ""
          const enrollmentId =
            typeof enrollment.id === "number"
              ? enrollment.id
              : typeof enrollment.id === "string"
                ? enrollment.id
                : ""

          let matchedAttendance: Record<string, unknown> | null = null
          for (const aRaw of allAttendances) {
            const a = aRaw as Record<string, unknown>
            const aEmpId =
              typeof a.employeeId === "string"
                ? a.employeeId
                : typeof a.employee_id === "string"
                  ? a.employee_id
                  : null
            const aSessionId =
              typeof a.courseSessionId === "number"
                ? a.courseSessionId
                : typeof a.courseSessionId === "string"
                  ? parseInt(a.courseSessionId, 10)
                  : NaN
            const aSessionNo =
              typeof a.sessionNo === "number" ? a.sessionNo : null
            const aGroupId =
              typeof a.groupId === "number"
                ? a.groupId
                : typeof a.groupId === "string"
                  ? parseInt(a.groupId, 10)
                  : NaN
            const sessMatches = !isNaN(sessionIdNum)
              ? aSessionId === sessionIdNum
              : sessionNo != null
                ? aSessionNo === sessionNo
                : false
            if (
              aEmpId === empId &&
              aGroupId === groupIdNum &&
              sessMatches
            ) {
              matchedAttendance = a
              break
            }
          }

          const status: SessionAttendanceStatus =
            (matchedAttendance?.attendanceStatus as SessionAttendanceStatus) ||
            "PRESENT"

          const learnerName =
            typeof enrollment.employeeName === "string"
              ? enrollment.employeeName
              : typeof enrollment.employee_name === "string"
                ? enrollment.employee_name
                : "Unknown"
          const email =
            typeof enrollment.email === "string" ? enrollment.email : ""
          const department =
            typeof enrollment.departmentName === "string"
              ? enrollment.departmentName
              : typeof enrollment.department_name === "string"
                ? enrollment.department_name
                : ""
          const team =
            typeof enrollment.teamName === "string"
              ? enrollment.teamName
              : typeof enrollment.team_name === "string"
                ? enrollment.team_name
                : ""
          const position =
            typeof enrollment.position === "string" ? enrollment.position : ""
          const groupName =
            typeof enrollment.courseGroupName === "string"
              ? enrollment.courseGroupName
              : typeof enrollment.course_group_name === "string"
                ? enrollment.course_group_name
                : ""

          const row: SessionLearnerRow = {
            id: empId || `e-${enrollmentId}`,
            learnerName,
            email,
            department,
            team,
            position,
            group: groupName,
            status,
            note: undefined,
            lateMinutes: status === "LATE" ? 15 : undefined,
          }
          return row
        })
      }
    })

    setAttendanceStore(initialAttendance)
  }, [derivedSessions, allEnrollments, allAttendances])

  const goToToday = () => {
    const targetDate = TESTING_DATE || new Date()
    setWeekStart(getWeekStart(targetDate))
    setTimeout(() => scrollToToday(), 100)
  }

  const goToPreviousWeek = () =>
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() - 7)
      return next
    })
  const goToNextWeek = () =>
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + 7)
      return next
    })

  const scrollToToday = () => {
    const outerContainer = tableContainerRef.current
    if (!outerContainer) return

    const container = outerContainer

    const todayDate = TESTING_DATE || new Date()
    const todayWeekIndex = weekDates.findIndex((d) => isSameDay(d, todayDate))

    if (todayWeekIndex === -1) {
      return
    }

    const headerCells =
      container.querySelectorAll<HTMLElement>("[data-day-index]")
    let targetCell: HTMLElement | null = null
    for (const cell of headerCells) {
      if (cell.getAttribute("data-day-index") === String(todayWeekIndex)) {
        targetCell = cell
        break
      }
    }

    if (!targetCell) {
      const dayHeaders = container.querySelectorAll(
        ".border-l.bg-background.py-2"
      )
      if (dayHeaders.length > todayWeekIndex + 1) {
        targetCell = dayHeaders[todayWeekIndex + 1] as HTMLElement
      }
    }

    if (!targetCell) {
      const columnWidth = 140
      const scrollLeft = (todayWeekIndex + 1) * columnWidth - 100
      if (container.scrollWidth > container.clientWidth) {
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: "smooth",
        })
      }
      setJustScrolledToToday(true)
      setTimeout(() => setJustScrolledToToday(false), 1200)
      return
    }

    const containerRect = container.getBoundingClientRect()
    const targetRect = targetCell.getBoundingClientRect()

    const timeGutter = container.querySelector<HTMLElement>(".sticky.left-0")
    const timeGutterWidth = timeGutter?.getBoundingClientRect().width ?? 64

    const cellWidth = targetRect.width
    const viewportAvailableWidth = containerRect.width - timeGutterWidth

    const cellLeftInContainer = targetRect.left - containerRect.left
    const currentScrollLeft = container.scrollLeft
    const cellAbsoluteLeft = cellLeftInContainer + currentScrollLeft

    const centeringOffset = Math.max(
      0,
      (viewportAvailableWidth - cellWidth) / 2
    )
    const desiredScrollLeft =
      cellAbsoluteLeft - timeGutterWidth - centeringOffset

    const maxScrollLeft = container.scrollWidth - container.clientWidth
    const clampedScrollLeft = Math.min(
      Math.max(0, desiredScrollLeft),
      Math.max(0, maxScrollLeft)
    )

    if (container.scrollWidth > container.clientWidth) {
      container.scrollTo({
        left: clampedScrollLeft,
        behavior: "smooth",
      })
    }

    setJustScrolledToToday(true)
    setTimeout(() => setJustScrolledToToday(false), 1200)
  }

  const gridHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT

  const openSessionDialog = useCallback((s: Session) => {
    setDialog({ open: true, session: s })
  }, [])

  const activeRows = dialog.session
    ? (attendanceStore[dialog.session.id] ?? [])
    : []

  const activeProgressRows = dialog.session
    ? (progressStore[dialog.session.id] ?? [])
    : []

  const onAttendanceChangeDialog = useCallback(
    (learnerId: string, next: SessionAttendanceStatus) => {
      if (!dialog.session) return
      const sid = dialog.session.id
      setAttendanceStore((prev) => {
        const rows = prev[sid] ?? []
        return {
          ...prev,
          [sid]: rows.map((r) =>
            r.id === learnerId
              ? {
                ...r,
                status: next,
                lateMinutes:
                  next === "LATE" ? (r.lateMinutes ?? 15) : undefined,
              }
              : r
          ),
        }
      })
    },
    [dialog.session]
  )

  const onNoteChange = useCallback(
    (learnerId: string, note: string) => {
      if (!dialog.session) return
      const sid = dialog.session.id
      setAttendanceStore((prev) => {
        const rows = prev[sid] ?? []
        return {
          ...prev,
          [sid]: rows.map((r) => (r.id === learnerId ? { ...r, note } : r)),
        }
      })
    },
    [dialog.session]
  )

  const onMarkAllPresent = useCallback(() => {
    if (!dialog.session) return
    const sid = dialog.session.id
    setAttendanceStore((prev) => {
      const rows = prev[sid] ?? []
      return {
        ...prev,
        [sid]: rows.map((r) => ({
          ...r,
          status: "PRESENT" as SessionAttendanceStatus,
          lateMinutes: undefined,
        })),
      }
    })
    toast.success("All learners marked as Present")
  }, [dialog.session])

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
          `Progress saved successfully for Session ${session.session_no || session.sessionNo || ""
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
          if (p.employee_id === effectiveUserId) {
            progressMap[p.self_study_session_id.toString()] = { ...p, id: p.id }
          } else {
            const compositeKey = `${p.self_study_session_id}-${p.employee_id}`
            progressMap[compositeKey] = { ...p, id: p.id }
          }
        }
      })
      setSavedProgress(progressMap)
    }
  }, [studyProgress, effectiveUserId])

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
    <TooltipProvider>
      <TabsContent value="information" className="pt-4">
        <div className="space-y-6">
          {/* Course Cards and Session Accordion */}
          <div className="mt-0">
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Course Card (takes 1 column) */}
              <div className="col-span-1">
                <CourseCard course={course} onView={() => { }} isInfoTab={true} />
              </div>

              {/* Right Column - Session Content (takes 2 columns) */}
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
                  /* Trainer Schedule - EXACTLY like ScheduleTab */
                  <div className="w-full min-w-0 rounded-lg bg-background">
                    {/* Header with Search and Navigation */}
                    <div className="flex flex-wrap items-center justify-end gap-4 pb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center rounded-md border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-r-none"
                            onClick={goToPreviousWeek}
                            aria-label="Previous week"
                          >
                            <HugeiconsIcon
                              icon={ArrowLeft01Icon}
                              strokeWidth={STROKE_WIDTH}
                              className="h-4 w-4"
                            />
                          </Button>
                          <div className="flex items-center gap-1.5 border-x px-3 text-sm font-medium whitespace-nowrap">
                            <HugeiconsIcon
                              icon={Calendar01Icon}
                              strokeWidth={STROKE_WIDTH}
                              className="h-3.5 w-3.5 text-muted-foreground"
                            />
                            {formatWeekRangeLabel(weekDates)}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-l-none"
                            onClick={goToNextWeek}
                            aria-label="Next week"
                          >
                            <HugeiconsIcon
                              icon={ArrowRight01Icon}
                              strokeWidth={STROKE_WIDTH}
                              className="h-4 w-4"
                            />
                          </Button>
                        </div>

                        {/* Today button */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={goToToday}
                              className="h-8 gap-1.5 border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                            >
                              Today
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Scroll to today's column</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Trainer-provided week grid - EXACTLY like ScheduleTab */}
                    <div className="min-w-0 overflow-hidden rounded-sm border">
                      <div
                        ref={tableContainerRef}
                        className="min-w-0 overflow-auto scroll-smooth"
                      >
                        <div className="grid min-w-[900px] grid-cols-[64px_repeat(7,minmax(140px,1fr))]">
                          {/* Day headers */}
                          <div className="bg-background" />
                          {weekDates.map((date, i) => {
                            const isToday = isSameDay(date, today)
                            const monthName = date.toLocaleString("default", {
                              month: "short",
                            })

                            return (
                              <div
                                key={`head-${i}`}
                                data-day-index={i}
                                className={cn(
                                  "sticky top-0 z-20 border-l bg-background py-2 text-center transition-colors duration-200",
                                  isToday && "bg-blue-100/50 text-blue-600",
                                  isToday &&
                                  justScrolledToToday &&
                                  "animate-pulse bg-blue-200/80 ring-2 ring-blue-500 ring-inset"
                                )}
                              >
                                <div className="mx-auto mb-1 flex w-fit items-center justify-center gap-1 rounded-lg text-sm font-semibold">
                                  <span>{monthName}</span>
                                  <span>{date.getDate()}</span>
                                </div>
                                <div className="text-xs font-medium text-muted-foreground">
                                  {WEEKDAY_LABELS[i]}
                                </div>
                              </div>
                            )
                          })}

                          {/* Time gutter */}
                          <div
                            className="sticky left-0 z-20 border-t bg-background"
                            style={{ height: gridHeight }}
                          >
                            {hours.map((hour, i) => (
                              <div
                                key={hour}
                                className="absolute right-3 translate-y-4 text-[11px] font-medium text-muted-foreground"
                                style={{ top: i * HOUR_HEIGHT }}
                              >
                                {formatHourLabel(hour)}
                              </div>
                            ))}
                            {todayDayIndex !== -1 && nowInRange && (
                              <div
                                className="pointer-events-none absolute right-0 z-30 flex translate-x-1/2 translate-y-4 items-center"
                                style={{ top: nowTop }}
                              >
                                <div className="h-3 w-3 rounded-full border-2 border-white bg-red-500" />
                              </div>
                            )}
                          </div>

                          {/* Day columns */}
                          {weekDates.map((date, dayIndex) => {
                            const isToday = isSameDay(date, today)
                            const daySessions = filteredSessions.filter((s) => {
                              if (s.type === "self-study") return false
                              if (s.dayIndex !== dayIndex) return false
                              if (s.sessionDate instanceof Date) {
                                return isSameDay(s.sessionDate, date)
                              }
                              return true
                            })

                            return (
                              <div
                                key={`col-${dayIndex}`}
                                className={cn(
                                  "relative border-t border-l",
                                  isToday && "bg-blue-50/40",
                                  isToday &&
                                  justScrolledToToday &&
                                  "animate-pulse bg-blue-100/60"
                                )}
                                style={{ height: gridHeight }}
                              >
                                {hours.map((hour, i) => (
                                  <div
                                    key={hour}
                                    className="absolute inset-x-0 border-t border-dashed border-muted"
                                    style={{ top: i * HOUR_HEIGHT }}
                                  />
                                ))}

                                {todayDayIndex !== -1 &&
                                  dayIndex === todayDayIndex &&
                                  nowInRange && (
                                    <div
                                      className="pointer-events-none absolute inset-x-0 z-20 translate-y-4"
                                      style={{ top: nowTop }}
                                    >
                                      <div className="relative h-[2px] w-full bg-red-500" />
                                    </div>
                                  )}

                                {daySessions.map((session, index, array) => {
                                  // Find all sessions that overlap at the same time
                                  const overlappingSessions = array.filter(s =>
                                    s.startHour === session.startHour && s.endHour === session.endHour
                                  )
                                  const overlapIndex = overlappingSessions.findIndex(s => s.id === session.id)
                                  const totalOverlapping = overlappingSessions.length

                                  const theme = SESSION_THEMES[session.theme]
                                  const top = (session.startHour - HOUR_START) * HOUR_HEIGHT + 14
                                  const height = (session.endHour - session.startHour) * HOUR_HEIGHT

                                  // Calculate width for each session (distribute evenly)
                                  const width = totalOverlapping > 1 ? 100 / totalOverlapping : 100
                                  const left = totalOverlapping > 1 ? (overlapIndex * width) : 0

                                  return (
                                    <button
                                      type="button"
                                      key={session.id}
                                      onClick={() => openSessionDialog(session)}
                                      className={cn(
                                        "group absolute cursor-pointer overflow-hidden rounded-md border-l-[3px] p-1.5 text-left ring-offset-background transition-all hover:ring-2 hover:ring-offset-1",
                                        theme.bg,
                                        theme.border,
                                        theme.hoverRing
                                      )}
                                      style={{
                                        top: top + 2,
                                        left: `${left}%`,
                                        width: `${width}%`,
                                        height: Math.max(height - 4, 30),
                                        zIndex: overlapIndex + 1,
                                      }}
                                    >
                                      <div
                                        className={cn(
                                          "truncate text-xs font-semibold",
                                          theme.text
                                        )}
                                      >
                                        {session.courseName}
                                      </div>
                                      <div
                                        className={cn(
                                          "mt-0.5 truncate text-[10px]",
                                          theme.subtext
                                        )}
                                      >
                                        {session.group} • {session.name}
                                      </div>
                                      <div
                                        className={cn(
                                          "mt-0.5 truncate text-[11px]",
                                          theme.subtext
                                        )}
                                      >
                                        {formatTimeLabel(session.startHour)} -{" "}
                                        {formatTimeLabel(session.endHour)}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
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

        {/* Session Detail Dialog */}
        <SessionDetailDialog
          open={dialog.open}
          onOpenChange={(o) => setDialog((st) => ({ ...st, open: o }))}
          session={dialog.session}
          weekDates={weekDates}
          studyColumns={[]}
          attendanceRows={activeRows}
          onAttendanceChange={onAttendanceChangeDialog}
          onNoteChange={onNoteChange}
          onMarkAllPresent={onMarkAllPresent}
          progressRows={activeProgressRows}
          onProgressChange={() => { }}
          currentLearnerId={effectiveUserId || ""}
          userRole={userRole}
        />
      </TabsContent>
    </TooltipProvider>
  )
}