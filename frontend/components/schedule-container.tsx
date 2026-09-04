// components/schedule/ScheduleContainer.tsx

"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { mainStore } from "@/store/mainStore"
import { Course, CourseGroup, CourseSession } from "@/types/course"

// Import types, constants, utils, and components
import {
  Session,
  SessionDialogState,
  SessionTestRole,
  SessionAttendanceStatus,
  SessionLearnerRow,
  SessionProgressRow,
  SelfStudyProgressFields,
  StudyColumnRange,
  SELF_STUDY_COLUMNS,
  ScheduleType,
} from "@/types/schedule"
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
  formatStudyColumnLabel,
  formatMonthLabel,
  formatFullDate,
} from "@/components/schedule/utils/schedule.utils"
import { SessionDetailDialog } from "@/components/dialogs/sessionDetail-dialog"

const THEME_COUNT = SESSION_THEMES.length

const hashStringToTheme = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return hash % THEME_COUNT
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

const findSelfStudyTargetSession = (
  courses: Course[],
  scheduleSessionId: string
): CourseSession | null => {
  const parsed = parseSessionId(scheduleSessionId)
  if (!parsed || parsed.prefix !== "s" || !parsed.courseId) return null

  const course = courses.find((c) => c.id === parsed.courseId)
  if (!course) return null

  if (parsed.sessionId != null) {
    const byId = (course.self_study_sessions || []).find(
      (s) => s.id === parsed.sessionId
    )
    if (byId) return byId
  }

  return null
}

export function ScheduleContainer({ userRole }: { userRole?: string }) {
  const {
    courses,
    fetchAll_CourseData,
    fetch_courseEnrollments,
    enrollments: allEnrollments,
    attendances: allAttendances,
    fetchAttendance,
    fetchCourseEnrollments,
    studyProgress: allStudyProgress,
    fetch_studyProgress,
    getUserId,
  } = mainStore()

  const currentUserId = getUserId?.() || "unknown-user"

  // Check if user is admin
  const isAdmin = userRole === "admin" || 
    userRole === "approver" || 
    userRole === "department_head"

  const [scheduleType, setScheduleType] =
    useState<ScheduleType>("trainer-provided")
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [studyPeriodStart, setStudyPeriodStart] = useState(() =>
    getWeekStart(new Date())
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [justScrolledToToday, setJustScrolledToToday] = useState(false)
  const searchInputRef = useCallback((node: HTMLInputElement | null) => {
    ; (
      window as unknown as { __scheduleSearch?: HTMLInputElement | null }
    ).__scheduleSearch = node
  }, [])
  const [dialog, setDialog] = useState<SessionDialogState>({
    open: false,
    session: null,
  })

  const tableContainerRef = useRef<HTMLDivElement>(null)

  const [attendanceStore, setAttendanceStore] = useState<
    Record<string, SessionLearnerRow[]>
  >({})

  const [progressStore, setProgressStore] = useState<
    Record<string, SessionProgressRow[]>
  >({})

  const [fetchedCourseIds, setFetchedCourseIds] = useState<Set<string>>(new Set())

  // Get user's enrolled group IDs for trainer courses
  const userEnrolledGroupIds = useMemo(() => {
    if (isAdmin) {
      return null // Admin sees all groups
    }

    const userEnrollments = allEnrollments.filter((eRaw) => {
      const e = eRaw as Record<string, unknown>
      const eEmpId = (e.employeeId || e.employee_id) as string
      const eStatus = (e.enrollmentStatus || e.status) as string
      return eEmpId === currentUserId && eStatus !== "CANCELLED"
    })

    const groupIds = new Map<string, Set<string>>() // courseId -> Set of groupIds

    userEnrollments.forEach((e) => {
      const eCourseId = String((e as Record<string, unknown>).courseId || "")
      const eGroupId = String((e as Record<string, unknown>).courseGroupId || "")
      
      if (eCourseId && eGroupId) {
        if (!groupIds.has(eCourseId)) {
          groupIds.set(eCourseId, new Set())
        }
        groupIds.get(eCourseId)!.add(eGroupId)
      }
    })

    return groupIds
  }, [allEnrollments, currentUserId, isAdmin])

  useEffect(() => {
    const loadInitial = async () => {
      await fetchAll_CourseData()
    }
    loadInitial()
  }, [fetchAll_CourseData])

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

    courses.forEach((course: Course) => {
      if (course.courseType === "trainer") {
        // ============ TRAINER COURSE LOGIC ============
        course.groups.forEach((group: CourseGroup) => {
          // For learners: only include groups they're enrolled in
          if (!isAdmin && userEnrolledGroupIds) {
            const courseId = String(course.id)
            const groupId = String(group.id)
            const enrolledGroups = userEnrolledGroupIds.get(courseId)
            if (!enrolledGroups || !enrolledGroups.has(groupId)) {
              return // Skip this group
            }
          }

          group.sessions.forEach((sess: CourseSession) => {
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
              courseName: course.title,
              instructor: course.trainerName,
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
      } else if (course.courseType === "self-study") {
        // ============ SELF-STUDY COURSE LOGIC ============
        const courseIdNum = parseInt(course.id, 10)
        const progressList = Array.isArray(allStudyProgress)
          ? allStudyProgress
          : Array.isArray((allStudyProgress as any)?.progress)
            ? (allStudyProgress as any).progress
            : []

        const courseEnrollments = allEnrollments.filter((eRaw) => {
          const e = eRaw as Record<string, unknown>
          const eCourseId =
            typeof e.courseId === "number"
              ? e.courseId
              : typeof e.courseId === "string"
                ? parseInt(e.courseId, 10)
                : NaN
          return eCourseId === courseIdNum
        })

        // Skip if no enrolled employees
        if (courseEnrollments.length === 0) {
          return
        }

        const sessions = course.self_study_sessions?.length > 0
          ? course.self_study_sessions
          : course.sessions || []

        sessions.forEach((sess: CourseSession, idx: number) => {
          const sessionNo = sess.sessionNo ?? idx + 1

          courseEnrollments.forEach((enrollmentRaw) => {
            const enrollment = enrollmentRaw as Record<string, unknown>
            const empId =
              typeof enrollment.employeeId === "string"
                ? enrollment.employeeId
                : typeof enrollment.employee_id === "string"
                  ? enrollment.employee_id
                  : `emp-${enrollment.id}`
            const empName =
              typeof enrollment.employeeName === "string"
                ? enrollment.employeeName
                : typeof enrollment.employee_name === "string"
                  ? enrollment.employee_name
                  : "Unknown"

            // For non-admin learners, only show their own sessions
            if (!isAdmin && empId !== currentUserId) {
              return
            }

            let deadlineDate: Date | null = null
            for (const pRaw of progressList) {
              const p = pRaw as Record<string, unknown>
              const pEmp =
                typeof p.employee_id === "string"
                  ? p.employee_id
                  : typeof p.employeeId === "string"
                    ? p.employeeId
                    : null
              const pSess =
                typeof p.session_no === "number"
                  ? p.session_no
                  : typeof p.sessionNo === "number"
                    ? p.sessionNo
                    : null
              const pDeadline = p.session_deadline ?? p.sessionDeadline
              if (
                pEmp === empId &&
                pSess === sessionNo &&
                pDeadline
              ) {
                deadlineDate = new Date(pDeadline as string)
                if (!isNaN(deadlineDate.getTime())) break
              }
            }

            if (!deadlineDate && sess.date) {
              deadlineDate = new Date(sess.date)
              if (isNaN(deadlineDate.getTime())) deadlineDate = null
            }

            // Skip if no deadline date
            if (!deadlineDate) {
              return
            }

            // Calculate week index based on deadline date and studyPeriodStart
            const d = new Date(deadlineDate)
            if (!isNaN(d.getTime())) {
              const periodStart = new Date(studyPeriodStart)
              periodStart.setHours(0, 0, 0, 0)
              const dayDiff = Math.floor(
                (d.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
              )
              const computedWeek = Math.floor(dayDiff / 7)

              // ONLY show sessions that fall within the 4-week period (weeks 0-3)
              if (computedWeek >= 0 && computedWeek < 4) {
                result.push({
                  id: `s-${course.id}-${sess.id || idx}-${empId}`,
                  name: `Session ${sessionNo}`,
                  courseName: course.title,
                  instructor: empName,
                  instructorEmail:
                    typeof enrollment.email === "string"
                      ? enrollment.email
                      : undefined,
                  dayIndex: 0,
                  startHour: 8,
                  endHour: 9,
                  theme: hashStringToTheme(`${course.id}-${empId}-selfstudy`),
                  group: "Self-Study",
                  type: "self-study",
                  weekIndex: computedWeek,
                  durationDays:
                    sess.durationPerSession || course.daysPerSession || 7,
                  sessionDate: deadlineDate,
                  originalSessionId: sess.id,
                  employeeId: empId,
                })
              }
              // If computedWeek < 0 or >= 4, skip this session (don't add to result)
            }
          })
        })
      }
    })

    return result
  }, [courses, weekStart, allEnrollments, allStudyProgress, studyPeriodStart, isAdmin, userEnrolledGroupIds, currentUserId])

  useEffect(() => {
    const toFetch: Array<{ courseId: number; groupId: number }> = []
    const selfStudyToFetch: string[] = []
    const newFetched = new Set(fetchedCourseIds)

    courses.forEach((course: Course) => {
      const cid = parseInt(course.id, 10)
      if (isNaN(cid)) return

      if (course.courseType === "trainer") {
        course.groups.forEach((g: CourseGroup) => {
          const gid = parseInt(g.id, 10)
          if (isNaN(gid)) return
          const key = `${cid}-${gid}`
          if (!newFetched.has(key)) {
            toFetch.push({ courseId: cid, groupId: gid })
            newFetched.add(key)
          }
        })
      } else if (course.courseType === "self-study") {
        if (!newFetched.has(`ss-${cid}`)) {
          selfStudyToFetch.push(course.id)
          newFetched.add(`ss-${cid}`)
        }
      }
    })

    if (toFetch.length > 0 || selfStudyToFetch.length > 0) {
      setFetchedCourseIds(newFetched)
        ; (async () => {
          for (const { courseId, groupId } of toFetch) {
            try {
              await fetch_courseEnrollments(courseId)
              // Only fetch attendance - skip fetchCourseEnrollments
              // since we already have allEnrollments from the main store
              await fetchAttendance(courseId, groupId)
            } catch (e) {
              console.warn(`Failed to fetch data for course ${courseId}:`, e)
            }
          }
          for (const cid of selfStudyToFetch) {
            try {
              await fetch_courseEnrollments(cid)
              await fetch_studyProgress(cid)
            } catch (e) {
              console.warn(`Failed to fetch data for self-study ${cid}:`, e)
            }
          }
        })()
    }
  }, [
    courses,
    fetchedCourseIds,
    fetch_courseEnrollments,
    fetchAttendance,
    fetch_studyProgress,
  ])

  useEffect(() => {
    const initialAttendance: Record<string, SessionLearnerRow[]> = {}
    const initialProgress: Record<string, SessionProgressRow[]> = {}

    // Helper to get progress array
    const getProgressArray = () => {
      if (Array.isArray(allStudyProgress)) {
        return allStudyProgress
      }
      if (allStudyProgress && typeof allStudyProgress === 'object') {
        // Check for progress property
        const progress = (allStudyProgress as any).progress
        if (Array.isArray(progress)) {
          return progress
        }
        // Check for data property
        const data = (allStudyProgress as any).data
        if (Array.isArray(data)) {
          return data
        }
      }
      return []
    }

    const progressArray = getProgressArray()

    derivedSessions.forEach((s) => {
      if (s.type === "self-study") {
        const parsed = parseSessionId(s.id)
        const courseIdNum = parsed?.courseId ? parseInt(parsed.courseId, 10) : NaN
        const sessionNoMatch = s.name.match(/Session\s+(\d+)/i)
        const sessionNo = sessionNoMatch ? Number(sessionNoMatch[1]) : null

        // For self-study, filter enrollments for this specific employee
        const empId = (s as any).employeeId
        let courseEnrollments = allEnrollments.filter((eRaw) => {
          const e = eRaw as Record<string, unknown>
          const eCourseId =
            typeof e.courseId === "number"
              ? e.courseId
              : typeof e.courseId === "string"
                ? parseInt(e.courseId, 10)
                : NaN
          const eEmpId = (e.employeeId || e.employee_id) as string
          return eCourseId === courseIdNum && (empId ? eEmpId === empId : true)
        })

        if (!empId) {
          courseEnrollments = allEnrollments.filter((eRaw) => {
            const e = eRaw as Record<string, unknown>
            const eCourseId =
              typeof e.courseId === "number"
                ? e.courseId
                : typeof e.courseId === "string"
                  ? parseInt(e.courseId, 10)
                  : NaN
            return eCourseId === courseIdNum
          })
        }

        if (courseEnrollments.length === 0) {
          initialProgress[s.id] = []
          return
        }

        initialProgress[s.id] = courseEnrollments.map((enrollmentRaw) => {
          const enrollment = enrollmentRaw as Record<string, unknown>
          const empIdFromEnrollment =
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

          // Find progress for this employee and session
          let userProgressRaw: Record<string, unknown> | null = null
          for (const pRaw of progressArray) {
            const p = pRaw as Record<string, unknown>
            // Try different property name variations
            const pEmp = p.employee_id || p.employeeId || p.employeeID || null
            const pSess = p.session_no || p.sessionNo || null
            const pCourseId = p.course_id || p.courseId || null

            // Match by employee ID AND session number AND course ID
            if (
              pEmp === empIdFromEnrollment &&
              (sessionNo != null ? Number(pSess) === sessionNo : true) &&
              String(courseIdNum) === String(pCourseId)
            ) {
              userProgressRaw = p
              break
            }
          }

          // If no progress found by course ID, try without course ID
          if (!userProgressRaw) {
            for (const pRaw of progressArray) {
              const p = pRaw as Record<string, unknown>
              const pEmp = p.employee_id || p.employeeId || p.employeeID || null
              const pSess = p.session_no || p.sessionNo || null
              if (
                pEmp === empIdFromEnrollment &&
                (sessionNo != null ? Number(pSess) === sessionNo : true)
              ) {
                userProgressRaw = p
                break
              }
            }
          }

          const targetSession = findSelfStudyTargetSession(courses, s.id)
          const grammarTarget = targetSession?.grammarCount || 0
          const vocabularyTarget = targetSession?.vocabularyCount || 0
          const kanjiTarget = targetSession?.kanjiCount || 0
          const readingTarget = targetSession?.readingMinutes || 0
          const listeningTarget = targetSession?.listeningMinutes || 0

          // Get current values from progress data - try different property names
          const grammarCurrent = userProgressRaw
            ? Number(userProgressRaw.grammar_count ?? userProgressRaw.grammarCurrent ?? 0)
            : 0
          const vocabularyCurrent = userProgressRaw
            ? Number(userProgressRaw.vocabulary_count ?? userProgressRaw.vocabularyCurrent ?? 0)
            : 0
          const kanjiCurrent = userProgressRaw
            ? Number(userProgressRaw.kanji_count ?? userProgressRaw.kanjiCurrent ?? 0)
            : 0
          const readingCurrent = userProgressRaw
            ? Number(userProgressRaw.reading_minutes ?? userProgressRaw.readingCurrent ?? 0)
            : 0
          const listeningCurrent = userProgressRaw
            ? Number(userProgressRaw.listening_minutes ?? userProgressRaw.listeningCurrent ?? 0)
            : 0

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

          const row: SessionProgressRow = {
            id: empIdFromEnrollment || `e-${enrollmentId}`,
            learnerName,
            email,
            department,
            team,
            position,
            group: groupName,
            grammarCurrent,
            grammarTarget,
            vocabularyCurrent,
            vocabularyTarget,
            kanjiCurrent,
            kanjiTarget,
            readingCurrent,
            readingTarget,
            listeningCurrent,
            listeningTarget,
          }
          return row
        })
      } else {
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
    setProgressStore(initialProgress)
  }, [derivedSessions, allEnrollments, allAttendances, allStudyProgress, courses])



  // Keyboard shortcut: Ctrl/Cmd + K focuses the search
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault()
        const input =
          (window as unknown as { __scheduleSearch?: HTMLInputElement | null })
            .__scheduleSearch ??
          document.querySelector<HTMLInputElement>(
            'input[placeholder="Search sessions..."]'
          )
        input?.focus()
        input?.select()
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "t") {
        e.preventDefault()
        scrollToToday()
      }
    }
    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [])

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const today = useMemo(() => new Date(), [])

  const studyColumns = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => {
        const start = new Date(studyPeriodStart)
        start.setDate(start.getDate() + i * 7)
        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        return { start, end }
      }),
    [studyPeriodStart]
  )

  const [nowTime, setNowTime] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNowTime(new Date()), 60 * 1000)
    return () => window.clearInterval(id)
  }, [])
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

  const getTypeCount = (type: ScheduleType) => {
    return derivedSessions.filter((s) => s.type === type).length
  }

  const filteredSessions = useMemo(() => {
    let sessions = derivedSessions.filter((s) => s.type === scheduleType)

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
  }, [derivedSessions, scheduleType, searchTerm])

  const goToToday = () => {
    setWeekStart(getWeekStart(new Date()))
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

  const goToTodayPeriod = () => {
    setStudyPeriodStart(getWeekStart(new Date()))
  }

  const goToPreviousPeriod = () =>
    setStudyPeriodStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() - 28)
      return next
    })

  const goToNextPeriod = () =>
    setStudyPeriodStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + 28)
      return next
    })

  const goToPreviousMonth = () => {
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() - 1)
      return next
    })
    setStudyPeriodStart((prev) => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() - 1)
      return next
    })
  }

  const goToNextMonth = () => {
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() + 1)
      return next
    })
    setStudyPeriodStart((prev) => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() + 1)
      return next
    })
  }


  const openSessionDialog = useCallback((s: Session) => {
    setDialog({ open: true, session: s })
  }, [])

  const activeRows = dialog.session
    ? (attendanceStore[dialog.session.id] ?? [])
    : []

  const activeProgressRows = dialog.session
    ? (progressStore[dialog.session.id] ?? [])
    : []

  const onProgressChange = useCallback(
    (
      learnerId: string,
      field: keyof SelfStudyProgressFields,
      value: number
    ) => {
      if (!dialog.session) return
      const sid = dialog.session.id
      setProgressStore((prev) => {
        const rows = prev[sid] ?? []
        return {
          ...prev,
          [sid]: rows.map((r) =>
            r.id === learnerId ? { ...r, [field]: value } : r
          ),
        }
      })
    },
    [dialog.session]
  )

  const onAttendanceChange = useCallback(
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

  const scrollToToday = () => {
    const outerContainer = tableContainerRef.current
    if (!outerContainer) return

    const container =
      outerContainer.querySelector<HTMLElement>(
        '[data-slot="table-container"]'
      ) ?? outerContainer

    const todayDate = new Date()
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

  return (
    <div className="w-full min-w-0 rounded-lg bg-background pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
        <div>
          <Tabs
            value={scheduleType}
            onValueChange={(value) => setScheduleType(value as ScheduleType)}
          >
            <TabsList className="h-auto">
              <TabsTrigger value="trainer-provided" className="gap-2">
                Trainer-Provided
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-5 px-1.5 text-xs",
                    scheduleType === "trainer-provided"
                      ? "bg-secondary"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {getTypeCount("trainer-provided")}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="self-study" className="gap-2">
                Self-Study
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-5 px-1.5 text-xs",
                    scheduleType === "self-study"
                      ? "bg-secondary"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {getTypeCount("self-study")}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="w-[300px]">
            <InputGroupInput
              placeholder="Search sessions..."
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <InputGroupAddon>
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={STROKE_WIDTH}
                className="h-4 w-4 text-muted-foreground"
              />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Kbd>Ctrl + K</Kbd>
            </InputGroupAddon>
          </InputGroup>

          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={
                scheduleType === "self-study"
                  ? goToPreviousMonth
                  : goToPreviousWeek
              }
              aria-label={
                scheduleType === "self-study"
                  ? "Previous month"
                  : "Previous week"
              }
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
              {scheduleType === "self-study"
                ? formatMonthLabel(studyPeriodStart)
                : formatWeekRangeLabel(weekDates)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={
                scheduleType === "self-study" ? goToNextMonth : goToNextWeek
              }
              aria-label={
                scheduleType === "self-study" ? "Next month" : "Next week"
              }
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={STROKE_WIDTH}
                className="h-4 w-4"
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Self-study view */}
      {scheduleType === "self-study" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {studyColumns.map((col, colIndex) => {
            const colSessions = filteredSessions.filter(
              (s) => s.weekIndex === colIndex
            )
            const isCurrentColumn =
              today >= col.start &&
              today <=
              new Date(
                col.end.getFullYear(),
                col.end.getMonth(),
                col.end.getDate(),
                23,
                59,
                59
              )

            return (
              <div
                key={colIndex}
                className={cn(
                  "flex min-w-0 flex-col rounded-lg border",
                  isCurrentColumn && "border-blue-300 bg-blue-50/30"
                )}
              >
                <div
                  className={cn(
                    "rounded-t-lg border-b bg-background px-3 py-2.5",
                    isCurrentColumn && "bg-blue-100/50 text-blue-700"
                  )}
                >
                  <div className="text-sm font-semibold">
                    Week {colIndex + 1}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <HugeiconsIcon
                      icon={Calendar01Icon}
                      strokeWidth={STROKE_WIDTH}
                      className="h-3 w-3"
                    />
                    {formatStudyColumnLabel(col)}
                  </div>
                </div>

                <div className="flex-1 space-y-2 p-2.5">
                  {colSessions.length === 0 ? (
                    <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                      No sessions
                    </div>
                  ) : (
                    colSessions.map((session) => {
                      const theme = SESSION_THEMES[session.theme]
                      const deadlineLabel =
                        session.sessionDate instanceof Date &&
                          !isNaN(session.sessionDate.getTime())
                          ? formatFullDate(session.sessionDate).trim()
                          : ""
                      return (
                        <button
                          type="button"
                          key={session.id}
                          onClick={() => openSessionDialog(session)}
                          className={cn(
                            "w-full cursor-pointer overflow-hidden rounded-md border-l-[3px] p-2.5 text-left ring-offset-background transition-all hover:ring-2 hover:ring-offset-1",
                            theme.bg,
                            theme.border,
                            theme.hoverRing
                          )}
                        >
                          <div
                            className={cn(
                              "truncate text-sm font-semibold",
                              theme.text
                            )}
                          >
                            {session.courseName}
                          </div>
                          <div
                            className={cn(
                              "mt-0.5 truncate text-xs font-medium",
                              theme.subtext
                            )}
                          >
                            {session.name}
                            {session.instructor && (
                              <span className="ml-1">• {session.instructor}</span>
                            )}
                          </div>
                          {deadlineLabel && (
                            <div
                              className={cn(
                                "mt-0.5 truncate text-[11px]",
                                theme.subtext
                              )}
                            >
                              📅 {deadlineLabel}
                            </div>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Trainer-provided week grid */
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
      )}

      {/* Session Detail Dialog */}
      <SessionDetailDialog
        open={dialog.open}
        onOpenChange={(o) => setDialog((st) => ({ ...st, open: o }))}
        session={dialog.session}
        weekDates={weekDates}
        studyColumns={studyColumns}
        attendanceRows={activeRows}
        onAttendanceChange={onAttendanceChange}
        onNoteChange={onNoteChange}
        onMarkAllPresent={onMarkAllPresent}
        progressRows={activeProgressRows}
        onProgressChange={onProgressChange}
        currentLearnerId={currentUserId}
        userRole={userRole}
      />
    </div>
  )
}