// components/course/tabs/AttendanceTab.tsx
"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
interface AttendanceTabProps {
  userRole: string
  profile?: any
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

// Map status values to display codes
const STATUS_TO_CODE: Record<string, string> = {
  PRESENT: "P",
  ABSENT: "A",
  LATE: "L",
  EXCUSED: "E",
}

// Map status values to display labels for legend
const STATUS_TO_LABEL: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
}

// Dummy attendance data - matches the image structure
interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  profilePhotoPath?: string
  email: string
  departmentName: string
  teamName: string
  divisionName: string
  groupName: string
  attendance: {
    [date: string]: string // "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
  }
}

// Filter state type
type AttendanceFilterState = {
  group: string[]
  department: string[]
  team: string[]
}

// Generate dynamic session dates (30 days including past, present, and future)
const generateSessionDates = () => {
  const dates = []
  const today = new Date()

  // Start from 20 days ago
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 20)

  // Generate 30 days of sessions
  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)

    const month = currentDate.getMonth() + 1
    const dayNum = currentDate.getDate()
    const dateStr = `${currentDate.toLocaleString("default", { month: "short" })} ${String(dayNum).padStart(2, "0")}`
    const dayStr = currentDate.toLocaleString("default", { weekday: "short" })
    const key = `day-${String(i + 1).padStart(2, "0")}`

    dates.push({
      date: dateStr,
      day: dayStr,
      key: key,
      month: month,
      dayNum: dayNum,
      fullDate: currentDate, // Store full date for comparison
    })
  }

  return dates
}

// Generate session dates
const SESSION_DATES = generateSessionDates()

// Helper to check if a session date is in the future
const isFutureSession = (dateObj: {
  date: string
  day: string
  month: number
  dayNum: number
  fullDate?: Date
}) => {
  const today = new Date()
  const currentYear = today.getFullYear()
  const sessionDate = new Date(currentYear, dateObj.month - 1, dateObj.dayNum)

  // Set both dates to start of day for accurate comparison
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )
  const sessionStart = new Date(
    sessionDate.getFullYear(),
    sessionDate.getMonth(),
    sessionDate.getDate()
  )

  return sessionStart > todayStart
}

// Helper to check if a session date is today
const isTodaySession = (dateObj: {
  date: string
  day: string
  month: number
  dayNum: number
  fullDate?: Date
}) => {
  const today = new Date()
  const currentYear = today.getFullYear()
  const sessionDate = new Date(currentYear, dateObj.month - 1, dateObj.dayNum)

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )
  const sessionStart = new Date(
    sessionDate.getFullYear(),
    sessionDate.getMonth(),
    sessionDate.getDate()
  )

  return sessionStart.getTime() === todayStart.getTime()
}

// Helper to get full date key for attendance lookup
const getDateKey = (dateObj: { date: string; day: string }) => {
  return `${dateObj.date} ${dateObj.day}`
}

// Helper to generate random attendance status with weighted probabilities
const generateRandomAttendance = (seed: number): string => {
  // Weighted toward PRESENT with some variety
  const statuses = [
    { status: "PRESENT", weight: 55 },
    { status: "ABSENT", weight: 15 },
    { status: "LATE", weight: 10 },
    { status: "EXCUSED", weight: 20 },
  ]

  const totalWeight = statuses.reduce((sum, s) => sum + s.weight, 0)
  let random = ((seed * 9301 + 49297) % 233280) / 233280 // Simple PRNG
  let weightSum = 0

  for (const s of statuses) {
    weightSum += s.weight / totalWeight
    if (random < weightSum) {
      return s.status
    }
  }
  return "PRESENT"
}

// Generate consistent attendance for a specific employee
const generateEmployeeAttendance = (employeeId: number) => {
  const attendance: { [date: string]: string } = {}
  let seed = employeeId * 12345 + 6789

  SESSION_DATES.forEach((dateObj) => {
    const dateKey = getDateKey(dateObj)
    // Generate deterministic but varied attendance
    seed = (seed * 9301 + 49297) % 233280
    attendance[dateKey] = generateRandomAttendance(seed)
  })

  return attendance
}

// Groups data
const GROUPS = [
  "Group A - Frontend",
  "Group B - Backend",
  "Group C - Full Stack",
  "Group D - Mobile",
  "Group E - DevOps",
  "Group F - Cloud",
  "Group G - Data Science",
  "Group H - UI/UX",
]

// Top 10 employees with realistic data and groups
const generateDummyData = (): AttendanceRecord[] => {
  const employees: AttendanceRecord[] = []

  // Top 10 employees with realistic data
  const employeeData = [
    {
      id: "1",
      firstName: "John",
      lastName: "Smith",
      department: "Engineering",
      team: "Frontend",
      division: "Tech",
      group: "Group A - Frontend",
    },
    {
      id: "2",
      firstName: "Sarah",
      lastName: "Johnson",
      department: "Engineering",
      team: "Backend",
      division: "Tech",
      group: "Group B - Backend",
    },
    {
      id: "3",
      firstName: "Michael",
      lastName: "Williams",
      department: "Product",
      team: "Product Management",
      division: "Product",
      group: "Group C - Full Stack",
    },
    {
      id: "4",
      firstName: "Emma",
      lastName: "Brown",
      department: "Design",
      team: "UI Design",
      division: "Design",
      group: "Group H - UI/UX",
    },
    {
      id: "5",
      firstName: "James",
      lastName: "Jones",
      department: "Marketing",
      team: "Digital Marketing",
      division: "Marketing",
      group: "Group G - Data Science",
    },
    {
      id: "6",
      firstName: "Lisa",
      lastName: "Garcia",
      department: "Sales",
      team: "Enterprise Sales",
      division: "Sales",
      group: "Group D - Mobile",
    },
    {
      id: "7",
      firstName: "Robert",
      lastName: "Miller",
      department: "Finance",
      team: "Accounting",
      division: "Finance",
      group: "Group E - DevOps",
    },
    {
      id: "8",
      firstName: "Maria",
      lastName: "Davis",
      department: "HR",
      team: "Recruitment",
      division: "HR",
      group: "Group F - Cloud",
    },
    {
      id: "9",
      firstName: "David",
      lastName: "Rodriguez",
      department: "Operations",
      team: "Operations Management",
      division: "Operations",
      group: "Group C - Full Stack",
    },
    {
      id: "10",
      firstName: "Jennifer",
      lastName: "Martinez",
      department: "Engineering",
      team: "DevOps",
      division: "Tech",
      group: "Group E - DevOps",
    },
  ]

  employeeData.forEach((emp, index) => {
    const employeeId = `ZY${String(190 + parseInt(emp.id)).padStart(3, "0")}`
    const name = `${emp.firstName} ${emp.lastName}`

    employees.push({
      id: emp.id,
      employeeId,
      employeeName: name,
      profilePhotoPath: "",
      email: `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@company.com`,
      departmentName: emp.department,
      teamName: emp.team,
      divisionName: emp.division,
      groupName: emp.group,
      attendance: generateEmployeeAttendance(parseInt(emp.id)),
    })
  })

  return employees
}

const DUMMY_ATTENDANCE_DATA = generateDummyData()

// Legend items for attendance status using the new options
const LEGEND_ITEMS = ATTENDANCE_OPTIONS.map((option) => ({
  code: STATUS_TO_CODE[option.value] || option.value.substring(0, 1),
  label: option.label,
  color: option.color,
  icon: option.icon,
}))

// Bordered Table Cell component - removed selected prop
const BorderedTableCell = ({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof TableCell>) => (
  <TableCell className={cn("border-r border-l", className)} {...props}>
    {children}
  </TableCell>
)

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

// Get badge variant for attendance code
const getAttendanceBadge = (status: string) => {
  const baseStyles =
    "text-xs font-medium px-1.5 py-0.5 rounded min-w-[40px] text-center"

  const option = ATTENDANCE_OPTIONS.find((opt) => opt.value === status)
  if (option) {
    return cn(baseStyles, option.badgeColor)
  }

  // Fallback
  return cn(baseStyles, "bg-gray-100 text-gray-600")
}

// Get status code (short form)
const getStatusCode = (status: string): string => {
  return STATUS_TO_CODE[status] || status.substring(0, 1)
}

// Get summary statistics for an employee
const getAttendanceSummary = (record: AttendanceRecord) => {
  const attendanceValues = Object.values(record.attendance)
  const total = attendanceValues.length
  const present = attendanceValues.filter((v) => v === "PRESENT").length
  const absent = attendanceValues.filter((v) => v === "ABSENT").length
  const late = attendanceValues.filter((v) => v === "LATE").length
  const excused = attendanceValues.filter((v) => v === "EXCUSED").length
  const attendanceRate =
    total > 0 ? Math.round(((present + excused) / total) * 100) : 0

  return {
    total,
    present,
    absent,
    late,
    excused,
    attendanceRate,
  }
}

// Get unique values for filter fields
const getFilterUniqueValues = (
  records: AttendanceRecord[],
  field: keyof AttendanceRecord
) => {
  const values = new Set<string>()
  records.forEach((record) => {
    const value = record[field] as string
    if (value && value.trim()) {
      values.add(value.trim())
    }
  })
  return Array.from(values).sort()
}

// Attendance select component
const AttendanceSelect = ({
  value,
  onChange,
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) => {
  const selectedOption = ATTENDANCE_OPTIONS.find((opt) => opt.value === value)

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "w-[50px] border-[1px] border-gray-200 bg-transparent hover:bg-muted/50 focus:ring-0",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <SelectValue>
          {selectedOption && (
            <span className={`text-xs font-medium ${selectedOption.iconColor}`}>
              {STATUS_TO_CODE[value] || value.substring(0, 1)}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Attendance Status</SelectLabel>
          {ATTENDANCE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <span className={`${option.iconColor}`}>{option.label}</span>
                <span
                  className={`ml-auto text-xs text-muted-foreground ${option.iconColor}`}
                >
                  ({STATUS_TO_CODE[option.value]})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function AttendanceTab({ userRole, profile }: AttendanceTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [attendanceData, setAttendanceData] = useState(DUMMY_ATTENDANCE_DATA)
  const [justScrolledToToday, setJustScrolledToToday] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const isDepartmentHead = userRole === "department_head"
  const isApprover = userRole === "approver"
  const isAdmin = userRole === "admin"

  // Filter state
  const [filters, setFilters] = useState<AttendanceFilterState>({
    group: [],
    department: [],
    team: [],
  })

  // Handle attendance status change
  const handleAttendanceChange = (
    employeeId: string,
    dateKey: string,
    newStatus: string
  ) => {
    setAttendanceData((prevData) =>
      prevData.map((record) => {
        if (record.id === employeeId) {
          return {
            ...record,
            attendance: {
              ...record.attendance,
              [dateKey]: newStatus,
            },
          }
        }
        return record
      })
    )
  }

  // Filter attendance records based on user role
  let filteredRecords = attendanceData

  if (isApprover && profile?.team) {
    filteredRecords = filteredRecords.filter(
      (record) => record.teamName === profile.team
    )
  }

  if (isDepartmentHead && profile?.deptDat) {
    filteredRecords = filteredRecords.filter(
      (record) => record.departmentName === profile.deptDat
    )
  }

  // Get unique values for filters from filtered data
  const groupValues = getFilterUniqueValues(filteredRecords, "groupName")
  const departmentValues = getFilterUniqueValues(
    filteredRecords,
    "departmentName"
  )
  const teamValues = getFilterUniqueValues(filteredRecords, "teamName")

  const hasGroupData = groupValues.length > 0
  const hasDepartmentData = departmentValues.length > 0
  const hasTeamData = teamValues.length > 0
  const hasFilterData = hasGroupData || hasDepartmentData || hasTeamData

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    (filterArray) => filterArray.length > 0
  )

  // Helper to toggle filter values
  const toggleFilter = (field: keyof AttendanceFilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[field]
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) }
      } else {
        return { ...prev, [field]: [...current, value] }
      }
    })
  }

  // Helper to clear all filters
  const clearAllFilters = () => {
    setFilters({
      group: [],
      department: [],
      team: [],
    })
  }

  // Apply group filters
  if (filters.group.length > 0) {
    filteredRecords = filteredRecords.filter((record) =>
      filters.group.includes(record.groupName)
    )
  }

  // Apply department filters
  if (filters.department.length > 0) {
    filteredRecords = filteredRecords.filter((record) =>
      filters.department.includes(record.departmentName)
    )
  }

  // Apply team filters
  if (filters.team.length > 0) {
    filteredRecords = filteredRecords.filter((record) =>
      filters.team.includes(record.teamName)
    )
  }

  // Apply search filter
  filteredRecords = filteredRecords.filter((record) => {
    if (!searchTerm.trim()) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      record.employeeName.toLowerCase().includes(searchLower) ||
      record.employeeId.toLowerCase().includes(searchLower) ||
      record.email.toLowerCase().includes(searchLower) ||
      record.departmentName.toLowerCase().includes(searchLower) ||
      record.teamName.toLowerCase().includes(searchLower) ||
      record.groupName.toLowerCase().includes(searchLower)
    )
  })

  const hasNoRecords = filteredRecords.length === 0

  // Find today's column index
  const todayIndex = SESSION_DATES.findIndex((dateObj) =>
    isTodaySession(dateObj)
  )

  // shadcn/ui's <Table> renders its own inner wrapper div around <table>
  // with overflow-x-auto (data-slot="table-container"). That inner div -
  // not the outer div we attach tableContainerRef to - is the element that
  // actually has horizontal overflow and scrolls. Scrolling the outer ref
  // directly is a no-op because it never overflows itself. Resolve the
  // real scrollable element at call time instead of assuming it's the ref.
  const getScrollElement = (outer: HTMLDivElement): HTMLElement => {
    const inner = outer.querySelector<HTMLElement>(
      '[data-slot="table-container"]'
    )
    if (inner && inner.scrollWidth > inner.clientWidth) return inner

    // Fallback: walk down through single-child wrappers until we find
    // whichever element actually has overflow, in case the table UI
    // primitive doesn't use the data-slot marker in this project's version.
    let el: HTMLElement = outer
    while (el.scrollWidth <= el.clientWidth && el.children.length === 1) {
      el = el.children[0] as HTMLElement
    }
    return el
  }

  // Scroll to today's column using getBoundingClientRect for cross-browser accuracy
  const scrollToToday = () => {
    const outerContainer = tableContainerRef.current
    if (!outerContainer) return

    // This is the element we actually scroll and measure scrollWidth/scrollLeft on.
    const container = getScrollElement(outerContainer)

    // Edge case: no horizontal overflow → nothing to scroll, just pulse highlight if today exists
    const hasOverflow = container.scrollWidth > container.clientWidth
    if (todayIndex === -1) {
      // Fallback: today not in SESSION_DATES range → scroll to rightmost (newest) column
      if (hasOverflow) {
        container.scrollTo({
          left: container.scrollWidth - container.clientWidth,
          behavior: "smooth",
        })
      }
      return
    }

    const todayDateObj = SESSION_DATES[todayIndex]

    // Robust query: prefer the date-row th (has data-date-key); fall back to the matching date cell in tbody first column group
    const targetTh = container.querySelector<HTMLTableCellElement>(
      `thead th[data-date-key="${todayDateObj.key}"]`
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

    // Measure all geometry once, pre-scroll, using getBoundingClientRect for accuracy
    const containerRect = container.getBoundingClientRect()
    const targetRect = targetTh.getBoundingClientRect()

    // Measure the two fixed-width non-date columns that precede the date columns:
    // 1) Sticky Employee column (sticky.left-0) — measure actual rendered width
    const stickyEmployeeCell = container.querySelector<HTMLTableCellElement>(
      "thead th.sticky.left-0"
    )
    const employeeWidth =
      stickyEmployeeCell?.getBoundingClientRect().width ?? 250

    // 2) Group column (the next non-date, non-sticky column right after Employee)
    //    Query by its text + the fact it's the only other rowSpan={2} non-sticky th before date columns
    const groupHeaderCell = (() => {
      const allHeaderThs = Array.from(
        container.querySelectorAll<HTMLTableCellElement>(
          "thead > tr:first-child > th"
        )
      )
      // Find the th at index 1 (between sticky Employee at 0 and the first date column)
      return (
        allHeaderThs.find(
          (th, idx) => idx === 1 && !th.classList.contains("sticky")
        ) ?? null
      )
    })()
    const groupWidth = groupHeaderCell?.getBoundingClientRect().width ?? 128 // reasonable fallback

    const nonDateTotalWidth = employeeWidth + groupWidth

    const cellWidth = targetRect.width
    const viewportAvailableWidth = containerRect.width - nonDateTotalWidth

    // Distance from today cell's left edge to the container's left edge (in viewport coords)
    const cellLeftInContainer = targetRect.left - containerRect.left

    // Current scroll position in the container
    const currentScrollLeft = container.scrollLeft

    // Absolute left of the cell in the scrollable content:
    //   (cell's left relative to scrolled view) + (how far we've scrolled)
    const cellAbsoluteLeft = cellLeftInContainer + currentScrollLeft

    // We want the cell to sit just right of the pinned columns, roughly centered in
    // the remaining viewport space — but clamped so we never over-scroll past 0.
    const centeringOffset = Math.max(
      0,
      (viewportAvailableWidth - cellWidth) / 2
    )

    // Desired scrollLeft so that after scrolling:
    //   (cellAbsoluteLeft - desiredScrollLeft) ≈ nonDateTotalWidth + centeringOffset
    const desiredScrollLeft =
      cellAbsoluteLeft - nonDateTotalWidth - centeringOffset

    const maxScrollLeft = container.scrollWidth - container.clientWidth
    const clampedScrollLeft = Math.min(
      Math.max(0, desiredScrollLeft),
      Math.max(0, maxScrollLeft)
    )

    if (hasOverflow) {
      container.scrollTo({
        left: clampedScrollLeft,
        behavior: "smooth",
      })
    }

    // Transient pulse highlight: trigger regardless of whether we actually scrolled
    // (if everything already fits, drawing attention to today still makes sense)
    setJustScrolledToToday(true)
    window.setTimeout(() => setJustScrolledToToday(false), 1200)
  }

  // Keyboard shortcut for today (Ctrl+T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "t") {
        e.preventDefault()
        scrollToToday()
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }

      // Check for Escape key - clear filters
      if (e.key === "Escape" && hasActiveFilters) {
        e.preventDefault()
        clearAllFilters()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [hasActiveFilters])

  return (
    <TabsContent value="attendance" className="w-full min-w-0 pt-4">
      <CardHeader className="px-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h4 className="flex items-center gap-2 text-xl font-semibold">
              Attendance Overview
            </h4>
            {isDepartmentHead && profile?.deptDat && (
              <p className="text-sm text-muted-foreground">
                Showing attendance for your department ({filteredRecords.length}{" "}
                learners)
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

            {/* Filter Dropdown */}
            {hasFilterData && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="relative h-9 w-9"
                      >
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
                  {/* Group Filter */}
                  {hasGroupData && (
                    <>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Group</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {groupValues.map((value) => (
                              <DropdownMenuCheckboxItem
                                key={value}
                                checked={filters.group.includes(value)}
                                onCheckedChange={() =>
                                  toggleFilter("group", value)
                                }
                                onSelect={(e) => e.preventDefault()}
                              >
                                {value}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    </>
                  )}

                  {/* Department Filter */}
                  {hasDepartmentData && (
                    <>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          Department
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {departmentValues.map((value) => (
                              <DropdownMenuCheckboxItem
                                key={value}
                                checked={filters.department.includes(value)}
                                onCheckedChange={() =>
                                  toggleFilter("department", value)
                                }
                                onSelect={(e) => e.preventDefault()}
                              >
                                {value}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    </>
                  )}

                  {/* Team Filter */}
                  {hasTeamData && (
                    <>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Team</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {teamValues.map((value) => (
                              <DropdownMenuCheckboxItem
                                key={value}
                                checked={filters.team.includes(value)}
                                onCheckedChange={() =>
                                  toggleFilter("team", value)
                                }
                                onSelect={(e) => e.preventDefault()}
                              >
                                {value}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  {/* Clear Filters Button */}
                  <DropdownMenuItem
                    onClick={clearAllFilters}
                    variant="destructive"
                    className="gap-2"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
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
        {hasNoRecords ? (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  strokeWidth={1.5}
                  className="h-12 w-12"
                />
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
                {/* First Row - Date */}
                <TableRow className="bg-muted/50">
                  <BorderedTableHead
                    className="sticky left-0 z-20 border-r-border bg-muted align-middle font-medium whitespace-nowrap shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]"
                    rowSpan={2}
                  >
                    Employee
                  </BorderedTableHead>
                  <BorderedTableHead
                    className="bg-muted align-middle font-medium whitespace-nowrap shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]"
                    rowSpan={2}
                  >
                    Group
                  </BorderedTableHead>
                  {SESSION_DATES.map((dateObj) => {
                    const isFuture = isFutureSession(dateObj)
                    const isToday = isTodaySession(dateObj)
                    return (
                      <BorderedTableHead
                        key={`date-${dateObj.key}`}
                        data-date-key={dateObj.key}
                        className={cn(
                          "text-center align-middle font-medium whitespace-nowrap transition-colors duration-200",
                          isFuture && "opacity-50",
                          isToday && "bg-blue-100/50 text-blue-600",
                          isToday &&
                            justScrolledToToday &&
                            "animate-pulse bg-blue-200/80 ring-2 ring-blue-500 ring-inset"
                        )}
                        colSpan={1}
                      >
                        {dateObj.date}
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
                {/* Second Row - Day */}
                <TableRow className="bg-muted/50">
                  {SESSION_DATES.map((dateObj) => {
                    const isFuture = isFutureSession(dateObj)
                    const isToday = isTodaySession(dateObj)
                    return (
                      <BorderedTableHead
                        key={`day-${dateObj.key}`}
                        className={cn(
                          "text-center align-middle text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors duration-200",
                          isFuture && "opacity-50",
                          isToday && "bg-blue-100/50 text-blue-600",
                          isToday &&
                            justScrolledToToday &&
                            "animate-pulse bg-blue-200/80 ring-2 ring-blue-500 ring-inset"
                        )}
                        colSpan={1}
                      >
                        {dateObj.day}
                      </BorderedTableHead>
                    )
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => {
                  const summary = getAttendanceSummary(record)
                  return (
                    <TableRow key={record.id} className="transition-colors">
                      <BorderedTableCell className="sticky left-0 z-10 w-[250px] border-r-border bg-background shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage
                              src={resolveUploadUrl(record.profilePhotoPath)}
                            />
                            <AvatarFallback className="text-xs text-primary">
                              {getInitials(record.employeeName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex w-full flex-col">
                            <span className="truncate text-sm font-medium">
                              {record.employeeName}
                            </span>
                            <span className="flex gap-1 truncate text-xs text-muted-foreground">
                              <span className="max-w-[50%] truncate">
                                {record.departmentName}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="max-w-[50%] truncate">
                                {record.teamName}
                              </span>
                            </span>
                          </div>
                        </div>
                      </BorderedTableCell>
                      <BorderedTableCell>{record.groupName}</BorderedTableCell>
                      {SESSION_DATES.map((dateObj) => {
                        const dateKey = getDateKey(dateObj)
                        const status = record.attendance[dateKey] || "ABSENT"
                        const isFuture = isFutureSession(dateObj)
                        const isToday = isTodaySession(dateObj)

                        return (
                          <BorderedTableCell
                            key={`${record.id}-${dateObj.key}`}
                            className={cn(
                              "text-center transition-colors duration-200",
                              isFuture && "opacity-50",
                              isToday && "bg-blue-100/50",
                              isToday &&
                                justScrolledToToday &&
                                "animate-pulse bg-blue-200/80 ring-2 ring-blue-500 ring-inset"
                            )}
                          >
                            <AttendanceSelect
                              value={status}
                              onChange={(newStatus) =>
                                handleAttendanceChange(
                                  record.id,
                                  dateKey,
                                  newStatus
                                )
                              }
                              disabled={isFuture}
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
                            <span className="text-xs text-green-600">
                              P: {summary.present}
                            </span>
                            <span className="text-xs text-red-600">
                              A: {summary.absent}
                            </span>
                            <span className="text-xs text-yellow-600">
                              L: {summary.late}
                            </span>
                            <span className="text-xs text-blue-600">
                              E: {summary.excused}
                            </span>
                          </div>
                        </div>
                      </BorderedTableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </TabsContent>
  )
}
