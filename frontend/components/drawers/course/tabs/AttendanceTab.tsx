// components/course/tabs/AttendanceTab.tsx
"use client"

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useDeferredValue,
} from "react"
import { createPortal } from "react-dom"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuShortcut,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserGroupIcon,
  Search01Icon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  ClockIcon,
  File02Icon,
  FilterMailIcon,
  Delete02Icon,
  Calendar01Icon,
  ArrowDown01Icon,
  EyeIcon,
} from "@hugeicons/core-free-icons"
import { cn, resolveUploadUrl } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface AttendanceTabProps {
  course: any
  enrollments: any[]
  userRole: string
  currentUserId: string | null
  currentUserEnrollment: any
  profile?: any
  attendanceRecords: any[]
  attendanceStatuses: Record<string, string>
  savingAttendance: Record<string, boolean>
  savedAttendance: Record<string, boolean>
  loadingAttendanceGroups?: Record<number, boolean>
  onAttendanceChange: (
    sessionId: string,
    employeeId: string,
    value: string,
    enrollmentId: number,
    groupId: number
  ) => void
}

// Attendance status options with labels and icons
const ATTENDANCE_OPTIONS = [
  {
    value: "PRESENT",
    label: "Present",
    icon: CheckmarkCircle02Icon,
    color: "bg-green-500",
    badgeColor: "bg-green-100 text-green-700",
    iconColor: "text-green-600",
  },
  {
    value: "ABSENT",
    label: "Absent",
    icon: CancelCircleIcon,
    color: "bg-red-500",
    badgeColor: "bg-red-100 text-red-700",
    iconColor: "text-red-600",
  },
  {
    value: "LATE",
    label: "Late",
    icon: ClockIcon,
    color: "bg-yellow-500",
    badgeColor: "bg-yellow-100 text-yellow-700",
    iconColor: "text-yellow-600",
  },
  {
    value: "EXCUSED",
    label: "Excused",
    icon: File02Icon,
    color: "bg-blue-500",
    badgeColor: "bg-blue-100 text-blue-700",
    iconColor: "text-blue-600",
  },
]

const STATUS_TO_CODE: Record<string, string> = {
  PRESENT: "P",
  ABSENT: "A",
  LATE: "L",
  EXCUSED: "E",
}

interface SessionColumn {
  key: string
  date: string
  day: string
  fullDate: Date
}

// const TESTING_DATE: Date | null = null
const TESTING_DATE: Date | null = new Date("2026-09-10")

const getEffectiveToday = () => TESTING_DATE ?? new Date()

const isFutureDate = (date: Date) => {
  const today = getEffectiveToday()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return dateStart.getTime() > todayStart.getTime()
}

const isTodayDate = (date: Date) => {
  const today = getEffectiveToday()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return dateStart.getTime() === todayStart.getTime()
}

// Filter state type
type AttendanceFilterState = {
  group: string[]
  department: string[]
  team: string[]
}

// Bordered Table Cell component
const BorderedTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.ComponentProps<typeof TableCell>
>(({ children, className = "", ...props }, ref) => (
  <TableCell ref={ref} className={cn("border-r border-l", className)} {...props}>
    {children}
  </TableCell>
))
BorderedTableCell.displayName = "BorderedTableCell"

const BorderedTableHead = ({
  children,
  className = "",
  colSpan,
  rowSpan,
  ...props
}: React.ComponentProps<typeof TableHead> & {
  colSpan?: number
  rowSpan?: number
}) => (
  <TableHead
    className={cn("border-r border-l", className)}
    colSpan={colSpan}
    rowSpan={rowSpan}
    {...props}
  >
    {children}
  </TableHead>
)

const getInitials = (name: string) => {
  if (!name) return "??"
  const parts = name.split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const getFilterUniqueValues = (values: (string | undefined)[]) => {
  const set = new Set<string>()
  values.forEach((v) => {
    if (v && v.trim()) set.add(v.trim())
  })
  return Array.from(set).sort()
}

/* ------------------------------------------------------------------ */
/*  Lightweight attendance cell control                                */
/* ------------------------------------------------------------------ */

type ActiveCell = {
  employeeEnrollmentId: number
  employeeId: string
  sessionId: string
  groupId: number
  rect: DOMRect
  isEditable: boolean
} | null

const AttendanceCellButton = React.memo(function AttendanceCellButton({
  status,
  disabled,
  isSaving,
  isViewOnly = false,
  onOpen,
}: {
  status: string
  disabled?: boolean
  isSaving?: boolean
  isViewOnly?: boolean
  onOpen: (rect: DOMRect) => void
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const option = ATTENDANCE_OPTIONS.find((opt) => opt.value === status)
  const isDisabled = disabled || isSaving || isViewOnly

  // If view-only, render as plain text with no border
  if (isViewOnly) {
    return (
      <span
        className={cn(
          "inline-block w-[58px] text-center text-xs font-medium",
          option?.iconColor || "text-muted-foreground"
        )}
      >
        {status ? STATUS_TO_CODE[status] || status.charAt(0) : "-"}
      </span>
    )
  }

  return (
    <button
      ref={btnRef}
      type="button"
      disabled={isDisabled}
      aria-haspopup="listbox"
      onClick={() => {
        if (btnRef.current) onOpen(btnRef.current.getBoundingClientRect())
      }}
      className={cn(
        "flex mx-auto h-7 w-[58px] items-center justify-center gap-0.5 rounded-md border border-gray-200 bg-transparent px-1.5 text-xs font-medium transition-colors",
        "hover:bg-muted/50 hover:border-gray-300",
        isDisabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:border-gray-200",
        option?.iconColor
      )}
    >
      {isSaving ? (
        <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-current" />
      ) : (
        <>
          <span>{status ? STATUS_TO_CODE[status] || status.charAt(0) : "-"}</span>
          {!isDisabled && (
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className="h-3 w-3 opacity-60"
            />
          )}
        </>
      )}
    </button>
  )
})

function AttendanceDropdownPortal({
  rect,
  onSelect,
  onClose,
}: {
  rect: DOMRect
  onSelect: (value: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    const id = window.setTimeout(() => {
      document.addEventListener("mousedown", handleClick)
      document.addEventListener("keydown", handleEsc)
    }, 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [onClose])

  const menuWidth = 176
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024
  const left = Math.min(rect.left, viewportWidth - menuWidth - 8)
  const top = rect.bottom + 4

  return createPortal(
    <div
      ref={ref}
      style={{ position: "fixed", top, left: Math.max(8, left), zIndex: 1000 }}
      className="w-44 rounded-md border bg-popover p-1 shadow-md"
    >
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
        Attendance Status
      </div>
      {ATTENDANCE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            onSelect(option.value)
            onClose()
          }}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
        >
          <span className={option.iconColor}>{option.label}</span>
          <span
            className={cn(
              "ml-auto text-xs text-muted-foreground",
              option.iconColor
            )}
          >
            ({STATUS_TO_CODE[option.value]})
          </span>
        </button>
      ))}
    </div>,
    document.body
  )
}

/* ------------------------------------------------------------------ */
/*  Display employee shape                                             */
/* ------------------------------------------------------------------ */

interface DisplayEmployee {
  enrollmentId: number
  employeeId: string
  employeeName: string
  profilePhotoPath?: string
  email?: string
  departmentName: string
  teamName: string
  groupId: number
  groupName: string
}

/* ------------------------------------------------------------------ */
/*  Memoized row                                                       */
/* ------------------------------------------------------------------ */

interface AttendanceRowProps {
  employee: DisplayEmployee
  sessionColumns: SessionColumn[]
  groupSessionsByDate: Record<number, Record<string, any>>
  attendanceByKey: Map<string, any>
  attendanceStatuses: Record<string, string>
  savingAttendance: Record<string, boolean>
  loadingAttendanceGroups: Record<number, boolean>
  canEditRow: boolean
  isViewOnly: boolean
  isLearner: boolean
  onCellClick: (
    employeeEnrollmentId: number,
    employeeId: string,
    sessionId: string,
    groupId: number,
    rect: DOMRect,
    isEditable: boolean
  ) => void
}

const AttendanceRow = React.memo(function AttendanceRow({
  employee,
  sessionColumns,
  groupSessionsByDate,
  attendanceByKey,
  attendanceStatuses,
  savingAttendance,
  loadingAttendanceGroups,
  canEditRow,
  isViewOnly,
  onCellClick,
  isLearner
}: AttendanceRowProps) {
  const groupSessions = groupSessionsByDate[employee.groupId] || {}
  const isGroupLoading = loadingAttendanceGroups[employee.groupId] || false

  // Summary computed only from this employee's own group sessions
  const summary = useMemo(() => {
    let present = 0,
      absent = 0,
      late = 0,
      excused = 0,
      total = 0

    Object.values(groupSessions).forEach((session: any) => {
      if (!session?.date) return
      const sessionDate = new Date(session.date)
      if (isFutureDate(sessionDate)) return
      total++
      const key = `${session.id}-${employee.enrollmentId}`
      const record = attendanceByKey.get(key)
      const status = attendanceStatuses[key] || record?.attendanceStatus || "ABSENT"
      if (status === "PRESENT") present++
      else if (status === "ABSENT") absent++
      else if (status === "LATE") late++
      else if (status === "EXCUSED") excused++
    })

    const attendanceRate = total > 0 ? Math.round(((present + excused) / total) * 100) : 0
    return { total, present, absent, late, excused, attendanceRate }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupSessions, attendanceByKey, attendanceStatuses, employee.enrollmentId])

  // Determine if this specific row should be editable
  // Only the learner's own row can be edited, others are view-only
  const rowIsEditable = canEditRow && !isViewOnly

  return (
    <TableRow className="transition-colors">
      <BorderedTableCell className="sticky left-0 z-10 w-[250px] border-r-border bg-background shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={resolveUploadUrl(employee.profilePhotoPath)} />
            <AvatarFallback className="text-xs text-primary">
              {getInitials(employee.employeeName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex w-full flex-col">
            <span className="truncate text-sm font-medium">
              {employee.employeeName}
            </span>
            <span className="flex gap-1 truncate text-xs text-muted-foreground">
              <span className="max-w-[50%] truncate">
                {employee.departmentName}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="max-w-[50%] truncate">{employee.teamName}</span>
            </span>
          </div>
        </div>
      </BorderedTableCell>

      {!isLearner && (
        <BorderedTableCell>{employee.groupName}</BorderedTableCell>
      )}

      {sessionColumns.map((col) => {
        const session = groupSessions[col.key]

        // No session for this employee's group on this date
        if (!session) {
          return (
            <BorderedTableCell
              key={`${employee.enrollmentId}-${col.key}`}
              data-date-key={col.key}
              className="text-center text-muted-foreground/40"
            >
              —
            </BorderedTableCell>
          )
        }

        const sessionDate = new Date(session.date)
        const isFuture = isFutureDate(sessionDate)
        const isToday = isTodayDate(sessionDate)
        const key = `${session.id}-${employee.enrollmentId}`
        const record = attendanceByKey.get(key)
        const status = attendanceStatuses[key] || record?.attendanceStatus || ""
        const isSaving = savingAttendance[key] || false

        // Determine if this cell is editable
        // 1. Not future
        // 2. Row is editable (only the learner's own row)
        // 3. Not loading
        const cellIsEditable = !isFuture && rowIsEditable && !isGroupLoading
        const cellIsViewOnly = !cellIsEditable && !isFuture && !isGroupLoading

        const disabled = isFuture || !rowIsEditable || isGroupLoading

        return (
          <BorderedTableCell
            key={`${employee.enrollmentId}-${col.key}`}
            data-date-key={col.key}
            className={cn(
              "text-center",
              isFuture && "opacity-50",
              isToday && "bg-blue-100/50"
            )}
          >
            <AttendanceCellButton
              status={status}
              disabled={disabled}
              isSaving={isSaving}
              isViewOnly={cellIsViewOnly}
              onOpen={(rect) =>
                onCellClick(
                  employee.enrollmentId,
                  employee.employeeId,
                  String(session.id),
                  employee.groupId,
                  rect,
                  cellIsEditable
                )
              }
            />
          </BorderedTableCell>
        )
      })}

      <BorderedTableCell className="text-center">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-medium text-muted-foreground">
            {summary.attendanceRate}%
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-green-600">P: {summary.present}</span>
            <span className="text-xs text-red-600">A: {summary.absent}</span>
            <span className="text-xs text-yellow-600">L: {summary.late}</span>
            <span className="text-xs text-blue-600">E: {summary.excused}</span>
          </div>
        </div>
      </BorderedTableCell>
    </TableRow>
  )
})

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function AttendanceTab({
  course,
  enrollments,
  userRole,
  currentUserId,
  currentUserEnrollment,
  profile,
  attendanceRecords,
  attendanceStatuses,
  savingAttendance,
  savedAttendance,
  loadingAttendanceGroups = {},
  onAttendanceChange,
}: AttendanceTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCell, setActiveCell] = useState<ActiveCell>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Role classification
  const isAdmin = userRole === "admin"
  const isApprover =
    userRole === "approver" ||
    userRole === "division_head" ||
    userRole === "department_head"
  const isLearner = userRole === "learner"
  const isDepartmentHead = userRole === "department_head"

  const [filters, setFilters] = useState<AttendanceFilterState>({
    group: [],
    department: [],
    team: [],
  })

  const deferredSearchTerm = useDeferredValue(searchTerm)

  const handleCellOpen = useCallback(
    (
      employeeEnrollmentId: number,
      employeeId: string,
      sessionId: string,
      groupId: number,
      rect: DOMRect,
      isEditable: boolean
    ) => {
      if (!isEditable) return
      setActiveCell({ employeeEnrollmentId, employeeId, sessionId, groupId, rect, isEditable })
    },
    []
  )

  const closeCell = useCallback(() => setActiveCell(null), [])

  /* ---------------- Session columns (real dates from course.groups) --------------- */

  const sessionColumns: SessionColumn[] = useMemo(() => {
    const map = new Map<string, SessionColumn>()

    // For learners, only show sessions from their group
    let groupsToProcess = course?.groups || []

    if (isLearner && currentUserEnrollment?.courseGroupId) {
      const userGroupId = currentUserEnrollment.courseGroupId
      groupsToProcess = groupsToProcess.filter(
        (group: any) => parseInt(group.id) === userGroupId
      )
    }

    groupsToProcess.forEach((group: any) => {
      ; (group.sessions || []).forEach((session: any) => {
        if (!session?.date) return
        const d = new Date(session.date)
        const key = d.toDateString()
        if (!map.has(key)) {
          map.set(key, {
            key,
            date: `${d.toLocaleString("default", { month: "short" })} ${String(
              d.getDate()
            ).padStart(2, "0")}`,
            day: d.toLocaleString("default", { weekday: "short" }),
            fullDate: d,
          })
        }
      })
    })

    return Array.from(map.values()).sort(
      (a, b) => a.fullDate.getTime() - b.fullDate.getTime()
    )
  }, [course?.groups, isLearner, currentUserEnrollment?.courseGroupId])

  // groupId -> dateKey -> session
  const groupSessionsByDate = useMemo(() => {
    const result: Record<number, Record<string, any>> = {}

    // For learners, only process their group
    let groupsToProcess = course?.groups || []

    if (isLearner && currentUserEnrollment?.courseGroupId) {
      const userGroupId = currentUserEnrollment.courseGroupId
      groupsToProcess = groupsToProcess.filter(
        (group: any) => parseInt(group.id) === userGroupId
      )
    }

    groupsToProcess.forEach((group: any) => {
      const groupId = parseInt(group.id)
      if (isNaN(groupId)) return
      const byDate: Record<string, any> = {}
        ; (group.sessions || []).forEach((session: any) => {
          if (!session?.date) return
          byDate[new Date(session.date).toDateString()] = session
        })
      result[groupId] = byDate
    })

    return result
  }, [course?.groups, isLearner, currentUserEnrollment?.courseGroupId])

  // sessionId+enrollmentId -> attendance record
  const attendanceByKey = useMemo(() => {
    const map = new Map<string, any>()
      ; (attendanceRecords || []).forEach((record: any) => {
        map.set(`${record.courseSessionId}-${record.enrollmentId}`, record)
      })
    return map
  }, [attendanceRecords])

  /* ---------------- Row visibility - LEARNER SEES ONLY THEIR GROUP --------------- */

  const roleFilteredEmployees: DisplayEmployee[] = useMemo(() => {
    let list = (enrollments || []).filter(
      (e: any) => e.enrollmentStatus !== "CANCELLED"
    )

    // IMPORTANT: Learner can only see people in their own group
    if (isLearner) {
      const userGroupId = currentUserEnrollment?.courseGroupId
      if (userGroupId) {
        // Only show employees in the same group as the learner
        list = list.filter((e: any) => e.courseGroupId === userGroupId)
      } else {
        // If learner has no enrollment, show nothing
        list = []
      }
    } else if (isDepartmentHead && profile?.deptDat) {
      list = list.filter((e: any) => e.departmentName === profile.deptDat)
    }
    // Admin and Approver see all

    return list.map((e: any) => ({
      enrollmentId: e.id,
      employeeId: e.employeeId,
      employeeName: e.employeeName || e.name || "",
      profilePhotoPath: e.profilePhotoPath,
      email: e.email,
      departmentName: e.departmentName || "",
      teamName: e.teamName || "",
      groupId: e.courseGroupId,
      groupName: e.courseGroupName || `Group ${e.courseGroupId}`,
    }))
  }, [enrollments, isLearner, isDepartmentHead, profile?.deptDat, currentUserEnrollment])

  // Determine if the entire table should be view-only for a learner
  // (True for learners, but we'll still allow editing their own row)
  const isViewOnlyForLearner = useMemo(() => {
    return isLearner
  }, [isLearner])

  // Edit permission — only the learner's own row is editable
  const canEditEmployee = useCallback(
    (employee: DisplayEmployee) => {
      if (isAdmin) return true
      if (isDepartmentHead && profile?.deptDat && employee.departmentName === profile.deptDat)
        return true
      if (isApprover && !isDepartmentHead && employee.employeeId === currentUserId)
        return true
      // LEARNER: Can only edit their own attendance
      if (isLearner && employee.employeeId === currentUserId) return true
      return false
    },
    [isAdmin, isDepartmentHead, isApprover, isLearner, profile?.deptDat, currentUserId]
  )

  // Check if a row should be view-only (learner viewing others in their group)
  const isRowViewOnly = useCallback(
    (employee: DisplayEmployee) => {
      // Admin can edit everything
      if (isAdmin) return false
      // Department head can edit their department
      if (isDepartmentHead && profile?.deptDat && employee.departmentName === profile.deptDat)
        return false
      // Learner: Only their own row is editable, all others are view-only
      if (isLearner && employee.employeeId !== currentUserId) return true
      // If not admin and not the learner's own row, it's view-only
      return !canEditEmployee(employee)
    },
    [isAdmin, isDepartmentHead, isLearner, currentUserId, profile?.deptDat, canEditEmployee]
  )

  /* ---------------- Filter option lists --------------- */

  const groupValues = useMemo(
    () => getFilterUniqueValues(roleFilteredEmployees.map((e) => e.groupName)),
    [roleFilteredEmployees]
  )
  const departmentValues = useMemo(
    () => getFilterUniqueValues(roleFilteredEmployees.map((e) => e.departmentName)),
    [roleFilteredEmployees]
  )
  const teamValues = useMemo(
    () => getFilterUniqueValues(roleFilteredEmployees.map((e) => e.teamName)),
    [roleFilteredEmployees]
  )

  const hasGroupData = groupValues.length > 0
  const hasDepartmentData = departmentValues.length > 0
  const hasTeamData = teamValues.length > 0
  const hasFilterData = hasGroupData || hasDepartmentData || hasTeamData

  const hasActiveFilters = Object.values(filters).some((arr) => arr.length > 0)

  const toggleFilter = useCallback(
    (field: keyof AttendanceFilterState, value: string) => {
      setFilters((prev) => {
        const current = prev[field]
        return current.includes(value)
          ? { ...prev, [field]: current.filter((v) => v !== value) }
          : { ...prev, [field]: [...current, value] }
      })
    },
    []
  )

  const clearAllFilters = useCallback(() => {
    setFilters({ group: [], department: [], team: [] })
  }, [])

  /* ---------------- Final filtered + searched list --------------- */

  const filteredEmployees = useMemo(() => {
    let list = roleFilteredEmployees

    if (filters.group.length > 0) {
      list = list.filter((e) => filters.group.includes(e.groupName))
    }
    if (filters.department.length > 0) {
      list = list.filter((e) => filters.department.includes(e.departmentName))
    }
    if (filters.team.length > 0) {
      list = list.filter((e) => filters.team.includes(e.teamName))
    }

    const search = deferredSearchTerm.trim().toLowerCase()
    if (search) {
      list = list.filter(
        (e) =>
          e.employeeName.toLowerCase().includes(search) ||
          e.employeeId.toLowerCase().includes(search) ||
          (e.email || "").toLowerCase().includes(search) ||
          e.departmentName.toLowerCase().includes(search) ||
          e.teamName.toLowerCase().includes(search) ||
          e.groupName.toLowerCase().includes(search)
      )
    }

    return list
  }, [roleFilteredEmployees, filters, deferredSearchTerm])

  const hasNoRecords = filteredEmployees.length === 0

  const todayIndex = useMemo(
    () => sessionColumns.findIndex((col) => isTodayDate(col.fullDate)),
    [sessionColumns]
  )

  /* ---------------- Scroll-to-today --------------- */

  const getScrollElement = (outer: HTMLDivElement): HTMLElement => {
    const inner = outer.querySelector<HTMLElement>('[data-slot="table-container"]')
    if (inner && inner.scrollWidth > inner.clientWidth) return inner
    let el: HTMLElement = outer
    while (el.scrollWidth <= el.clientWidth && el.children.length === 1) {
      el = el.children[0] as HTMLElement
    }
    return el
  }

  const pulseTodayColumn = (container: HTMLElement, dateKey: string) => {
    const cells = container.querySelectorAll<HTMLElement>(`[data-date-key="${dateKey}"]`)
    const pulseClasses = [
      "animate-pulse",
      "bg-blue-200/80",
      "ring-2",
      "ring-blue-500",
      "ring-inset",
    ]
    cells.forEach((el) => el.classList.add(...pulseClasses))
    window.setTimeout(() => {
      cells.forEach((el) => el.classList.remove(...pulseClasses))
    }, 1200)
  }

  const scrollToToday = () => {
    const outerContainer = tableContainerRef.current
    if (!outerContainer) return
    const container = getScrollElement(outerContainer)
    const hasOverflow = container.scrollWidth > container.clientWidth

    if (todayIndex === -1) {
      if (hasOverflow) {
        container.scrollTo({
          left: container.scrollWidth - container.clientWidth,
          behavior: "smooth",
        })
      }
      return
    }

    const todayCol = sessionColumns[todayIndex]
    const targetTh = container.querySelector<HTMLTableCellElement>(
      `thead th[data-date-key="${todayCol.key}"]`
    )
    if (!targetTh) {
      if (hasOverflow) {
        container.scrollTo({
          left: container.scrollWidth - container.clientWidth,
          behavior: "smooth",
        })
      }
      return
    }

    const containerRect = container.getBoundingClientRect()
    const targetRect = targetTh.getBoundingClientRect()

    const stickyEmployeeCell = container.querySelector<HTMLTableCellElement>(
      "thead th.sticky.left-0"
    )
    const employeeWidth = stickyEmployeeCell?.getBoundingClientRect().width ?? 250

    const groupHeaderCell = (() => {
      const allHeaderThs = Array.from(
        container.querySelectorAll<HTMLTableCellElement>("thead > tr:first-child > th")
      )
      return (
        allHeaderThs.find((th, idx) => idx === 1 && !th.classList.contains("sticky")) ??
        null
      )
    })()
    const groupWidth = groupHeaderCell?.getBoundingClientRect().width ?? 128

    const nonDateTotalWidth = employeeWidth + groupWidth
    const cellWidth = targetRect.width
    const viewportAvailableWidth = containerRect.width - nonDateTotalWidth
    const cellLeftInContainer = targetRect.left - containerRect.left
    const currentScrollLeft = container.scrollLeft
    const cellAbsoluteLeft = cellLeftInContainer + currentScrollLeft
    const centeringOffset = Math.max(0, (viewportAvailableWidth - cellWidth) / 2)
    const desiredScrollLeft = cellAbsoluteLeft - nonDateTotalWidth - centeringOffset
    const maxScrollLeft = container.scrollWidth - container.clientWidth
    const clampedScrollLeft = Math.min(
      Math.max(0, desiredScrollLeft),
      Math.max(0, maxScrollLeft)
    )

    if (hasOverflow) {
      container.scrollTo({ left: clampedScrollLeft, behavior: "smooth" })
    }

    pulseTodayColumn(container, todayCol.key)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "t") {
        e.preventDefault()
        scrollToToday()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === "Escape" && hasActiveFilters) {
        e.preventDefault()
        clearAllFilters()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveFilters])

  // Show a message for learners who aren't enrolled
  const showNoEnrollmentMessage = isLearner && !currentUserEnrollment

  return (
    <TabsContent value="attendance" className="w-full min-w-0 pt-4">
      <CardHeader className="px-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h4 className="flex items-center gap-2 text-xl font-semibold">
              Attendance Overview
              {isLearner && currentUserEnrollment && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Your Group: {currentUserEnrollment.courseGroupName || `Group ${currentUserEnrollment.courseGroupId}`}
                </Badge>
              )}
            </h4>
            {isDepartmentHead && profile?.deptDat && (
              <p className="text-sm text-muted-foreground">
                Showing attendance for your department ({filteredEmployees.length} learners)
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <InputGroup className="w-[350px]">
              <InputGroupInput
                ref={searchInputRef}
                placeholder="Search by name, dept, team, group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

            {todayIndex !== -1 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={scrollToToday}
                    className="h-8 gap-1.5 border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                  >
                    Today
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scroll to today's column</p>
                </TooltipContent>
              </Tooltip>
            )}

            {hasFilterData && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="relative h-9 w-9">
                        <HugeiconsIcon
                          icon={FilterMailIcon}
                          strokeWidth={2}
                          className="h-4 w-4"
                        />
                        {hasActiveFilters && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background bg-red-600" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter</p>
                  </TooltipContent>
                </Tooltip>

                <DropdownMenuContent className="max-h-[80vh] w-60 overflow-y-auto">
                  {hasGroupData && !isLearner && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Group</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {groupValues.map((value) => (
                            <DropdownMenuCheckboxItem
                              key={value}
                              checked={filters.group.includes(value)}
                              onCheckedChange={() => toggleFilter("group", value)}
                              onSelect={(e) => e.preventDefault()}
                            >
                              {value}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )}

                  {hasDepartmentData && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Department</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {departmentValues.map((value) => (
                            <DropdownMenuCheckboxItem
                              key={value}
                              checked={filters.department.includes(value)}
                              onCheckedChange={() => toggleFilter("department", value)}
                              onSelect={(e) => e.preventDefault()}
                            >
                              {value}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )}

                  {hasTeamData && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Team</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {teamValues.map((value) => (
                            <DropdownMenuCheckboxItem
                              key={value}
                              checked={filters.team.includes(value)}
                              onCheckedChange={() => toggleFilter("team", value)}
                              onSelect={(e) => e.preventDefault()}
                            >
                              {value}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={clearAllFilters}
                    variant="destructive"
                    className="gap-2"
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="h-4 w-4" />
                    Clear All Filters
                    <DropdownMenuShortcut>
                      <Kbd>Esc</Kbd>
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 pt-4">
        {showNoEnrollmentMessage ? (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle>Not Enrolled</EmptyTitle>
              <EmptyDescription className="max-w-xs text-pretty">
                You are not enrolled in this course. Please enroll to view attendance.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : sessionColumns.length === 0 ? (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Calendar01Icon} strokeWidth={1.5} className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle>No Sessions Scheduled</EmptyTitle>
              <EmptyDescription className="max-w-xs text-pretty">
                This course doesn't have any scheduled sessions yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : hasNoRecords ? (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle>No Attendance Records for "{searchTerm}"</EmptyTitle>
              <EmptyDescription className="max-w-xs text-pretty">
                {searchTerm || hasActiveFilters
                  ? "No matching records found for your search or filters."
                  : "No attendance records available for this course."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div
            ref={tableContainerRef}
            className="w-full overflow-x-auto scroll-smooth rounded-md border"
          >
            <Table className="min-w-max">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <BorderedTableHead
                    className="sticky left-0 z-20 border-r-border bg-muted align-middle font-medium whitespace-nowrap shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]"
                    rowSpan={2}
                  >
                    Employee
                  </BorderedTableHead>
                  {!isLearner && (
                    <BorderedTableHead
                      className="bg-muted align-middle font-medium whitespace-nowrap shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]"
                      rowSpan={2}
                    >
                      Group
                    </BorderedTableHead>
                  )}
                  {sessionColumns.map((col) => {
                    const isFuture = isFutureDate(col.fullDate)
                    const isToday = isTodayDate(col.fullDate)
                    return (
                      <BorderedTableHead
                        key={`date-${col.key}`}
                        data-date-key={col.key}
                        className={cn(
                          "text-center align-middle font-medium whitespace-nowrap",
                          isFuture && "opacity-50",
                          isToday && "bg-blue-100/50 text-blue-600"
                        )}
                        colSpan={1}
                      >
                        {col.date}
                      </BorderedTableHead>
                    )
                  })}
                  <BorderedTableHead
                    className="text-center align-middle font-medium whitespace-nowrap"
                    rowSpan={2}
                  >
                    Summary
                  </BorderedTableHead>
                </TableRow>
                <TableRow className="bg-muted/50">
                  {sessionColumns.map((col) => {
                    const isFuture = isFutureDate(col.fullDate)
                    const isToday = isTodayDate(col.fullDate)
                    return (
                      <BorderedTableHead
                        key={`day-${col.key}`}
                        data-date-key={col.key}
                        className={cn(
                          "text-center align-middle text-xs font-medium whitespace-nowrap text-muted-foreground",
                          isFuture && "opacity-50",
                          isToday && "bg-blue-100/50 text-blue-600"
                        )}
                        colSpan={1}
                      >
                        {col.day}
                      </BorderedTableHead>
                    )
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => {
                  const canEdit = canEditEmployee(employee)
                  const isViewOnly = isRowViewOnly(employee)
                  return (
                    <AttendanceRow
                      key={employee.enrollmentId}
                      employee={employee}
                      sessionColumns={sessionColumns}
                      groupSessionsByDate={groupSessionsByDate}
                      attendanceByKey={attendanceByKey}
                      attendanceStatuses={attendanceStatuses}
                      savingAttendance={savingAttendance}
                      loadingAttendanceGroups={loadingAttendanceGroups}
                      canEditRow={canEdit}
                      isViewOnly={isViewOnly}
                      isLearner={isLearner}
                      onCellClick={handleCellOpen}
                    />
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {activeCell && (
        <AttendanceDropdownPortal
          rect={activeCell.rect}
          onSelect={(value) =>
            onAttendanceChange(
              activeCell.sessionId,
              activeCell.employeeId,
              value,
              activeCell.employeeEnrollmentId,
              activeCell.groupId
            )
          }
          onClose={closeCell}
        />
      )}
    </TabsContent>
  )
}