// components/drawers/course/tabs/ScheduleTab.tsx
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  Search01Icon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  ClockIcon,
  File02Icon,
  UserGroupIcon,
  Time02Icon,
  CourseIcon,
  TeacherIcon,
  CircleIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type SessionAttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
type SessionTestRole = "learner" | "admin"

interface Session {
  id: string
  name: string
  courseName: string
  instructor?: string
  instructorEmail?: string
  dayIndex: number // 0 = Monday ... 6 = Sunday
  startHour: number // decimal hours, e.g. 8.5 = 8:30 AM
  endHour: number
  theme: number // index into SESSION_THEMES
}

interface SessionLearnerRow {
  id: string
  learnerName: string
  email: string
  department: string
  team: string
  position: string
  status: SessionAttendanceStatus
  note?: string
  lateMinutes?: number
}

interface SessionDialogState {
  open: boolean
  session: Session | null
}

/* -------------------------------------------------------------------------- */
/*  Config                                                                    */
/* -------------------------------------------------------------------------- */

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
const DOW_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const HOUR_START = 7 // 7 AM
const HOUR_END = 19 // 7 PM
const HOUR_HEIGHT = 64 // px per hour row

const STROKE_WIDTH = 2
const CURRENT_LEARNER_ID = "learner-self-01"

const SESSION_THEMES = [
  {
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-700",
    subtext: "text-blue-600/70",
    hoverRing: "hover:ring-blue-400",
  },
  {
    bg: "bg-purple-50",
    border: "border-purple-400",
    text: "text-purple-700",
    subtext: "text-purple-600/70",
    hoverRing: "hover:ring-purple-400",
  },
  {
    bg: "bg-emerald-50",
    border: "border-emerald-400",
    text: "text-emerald-700",
    subtext: "text-emerald-600/70",
    hoverRing: "hover:ring-emerald-400",
  },
  {
    bg: "bg-amber-50",
    border: "border-amber-400",
    text: "text-amber-700",
    subtext: "text-amber-600/70",
    hoverRing: "hover:ring-amber-400",
  },
  {
    bg: "bg-rose-50",
    border: "border-rose-400",
    text: "text-rose-700",
    subtext: "text-rose-600/70",
    hoverRing: "hover:ring-rose-400",
  },
]

const SESSION_ATTENDANCE_OPTIONS: Array<{
  value: SessionAttendanceStatus
  label: string
  code: string
  icon:
    | typeof CheckmarkCircle02Icon
    | typeof CancelCircleIcon
    | typeof ClockIcon
    | typeof File02Icon
  iconColor: string
  badgeCn: string
  dotCn: string
}> = [
  {
    value: "PRESENT",
    label: "Present",
    code: "P",
    icon: CheckmarkCircle02Icon,
    iconColor: "text-green-600",
    badgeCn: "bg-green-100 text-green-700 border-green-200",
    dotCn: "bg-green-500",
  },
  {
    value: "ABSENT",
    label: "Absent",
    code: "A",
    icon: CancelCircleIcon,
    iconColor: "text-red-600",
    badgeCn: "bg-red-100 text-red-700 border-red-200",
    dotCn: "bg-red-500",
  },
  {
    value: "LATE",
    label: "Late",
    code: "L",
    icon: ClockIcon,
    iconColor: "text-yellow-600",
    badgeCn: "bg-yellow-100 text-yellow-700 border-yellow-200",
    dotCn: "bg-yellow-500",
  },
  {
    value: "EXCUSED",
    label: "Excused",
    code: "E",
    icon: File02Icon,
    iconColor: "text-blue-600",
    badgeCn: "bg-blue-100 text-blue-700 border-blue-200",
    dotCn: "bg-blue-500",
  },
]

const ATTENDANCE_OPTION_BY_VALUE = Object.fromEntries(
  SESSION_ATTENDANCE_OPTIONS.map((o) => [o.value, o])
) as Record<
  SessionAttendanceStatus,
  (typeof SESSION_ATTENDANCE_OPTIONS)[number]
>

const getInitials = (name: string) => {
  if (!name) return "??"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const getWeekStart = (refDate: Date) => {
  const date = new Date(refDate)
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diffToMonday)
  date.setHours(0, 0, 0, 0)
  return date
}

const getWeekDates = (weekStart: Date) =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const formatHourLabel = (hour: number) => {
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour} ${period}`
}

const formatTimeLabel = (hour: number) => {
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = Math.floor(hour % 12 === 0 ? 12 : hour % 12)
  const minutes = Math.round((hour % 1) * 60)
  return minutes === 0
    ? `${displayHour} ${period}`
    : `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`
}

const formatFullDate = (d: Date) => {
  const dow = DOW_LONG[d.getDay()]
  const month = MONTH_SHORT[d.getMonth()]
  return ` ${month} ${d.getDate()} ${d.getFullYear()} (${dow})`
}

const formatWeekRangeLabel = (weekDates: Date[]) => {
  const start = weekDates[0]
  const end = weekDates[6]
  const startMonth = start.toLocaleString("default", { month: "short" })
  const endMonth = end.toLocaleString("default", { month: "short" })
  const year = end.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()} ${year}`
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()} ${year}`
}

/* -------------------------------------------------------------------------- */
/*  Dummy data generator for schedule tab                                    */
/* -------------------------------------------------------------------------- */

// Generate dummy sessions based on the course's groups/sessions
const generateDummySessions = (course: any): Session[] => {
  const sessions: Session[] = []

  if (!course.groups || course.groups.length === 0) {
    return sessions
  }

  const themeColors = [0, 1, 2, 3, 4]
  let themeIndex = 0

  course.groups.forEach((group: any) => {
    if (!group.sessions || group.sessions.length === 0) return

    group.sessions.forEach((session: any, idx: number) => {
      const sessionDate = session.date ? new Date(session.date) : new Date()
      const dayIndex = sessionDate.getDay() === 0 ? 6 : sessionDate.getDay() - 1

      // Parse start and end times
      let startHour = 9
      let endHour = 10
      if (session.startTime) {
        const [h, m] = session.startTime.split(":").map(Number)
        startHour = h + (m || 0) / 60
      }
      if (session.endTime) {
        const [h, m] = session.endTime.split(":").map(Number)
        endHour = h + (m || 0) / 60
      }

      sessions.push({
        id: session.id || `session-${idx}`,
        name: session.name || `Session ${idx + 1}`,
        courseName: course.name || "",
        instructor: session.instructor || course.instructor || "TBA",
        instructorEmail: session.instructorEmail || "",
        dayIndex: dayIndex,
        startHour: startHour,
        endHour: endHour,
        theme: themeColors[themeIndex % themeColors.length],
      })
      themeIndex++
    })
  })

  return sessions
}

// Generate learner data for a session
const generateSessionLearners = (sessionId: string): SessionLearnerRow[] => {
  const pool = [
    {
      id: "l-01",
      name: "John Smith",
      email: "john.smith@company.com",
      department: "Engineering",
      team: "Frontend",
      position: "Engineer",
    },
    {
      id: "l-02",
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      department: "Engineering",
      team: "Backend",
      position: "Engineer",
    },
    {
      id: "l-03",
      name: "Michael Williams",
      email: "michael.williams@company.com",
      department: "Product",
      team: "Product Management",
      position: "Product Manager",
    },
    {
      id: "l-04",
      name: "Emma Brown",
      email: "emma.brown@company.com",
      department: "Design",
      team: "UI Design",
      position: "Designer",
    },
    {
      id: "l-05",
      name: "James Jones",
      email: "james.jones@company.com",
      department: "Marketing",
      team: "Digital Marketing",
      position: "Marketing Lead",
    },
    {
      id: "l-06",
      name: "Lisa Garcia",
      email: "lisa.garcia@company.com",
      department: "Sales",
      team: "Enterprise Sales",
      position: "Account Manager",
    },
    {
      id: "l-07",
      name: "Robert Miller",
      email: "robert.miller@company.com",
      department: "Finance",
      team: "Accounting",
      position: "Accountant",
    },
    {
      id: "l-08",
      name: "Maria Davis",
      email: "maria.davis@company.com",
      department: "HR",
      team: "Recruitment",
      position: "HR Specialist",
    },
    {
      id: "l-09",
      name: "David Rodriguez",
      email: "david.rodriguez@company.com",
      department: "Operations",
      team: "Operations Management",
      position: "Operations Manager",
    },
    {
      id: "l-10",
      name: "Jennifer Martinez",
      email: "jennifer.martinez@company.com",
      department: "Engineering",
      team: "DevOps",
      position: "SRE",
    },
  ]

  const statuses: SessionAttendanceStatus[] = [
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "ABSENT",
    "LATE",
    "EXCUSED",
  ]

  return pool.map((row, idx) => ({
    id: row.id,
    learnerName: row.name,
    email: row.email,
    department: row.department,
    team: row.team,
    position: row.position,
    status: statuses[idx % statuses.length],
    lateMinutes: statuses[idx % statuses.length] === "LATE" ? 15 : undefined,
  }))
}

/* -------------------------------------------------------------------------- */
/*  Role Toggle UI                                                            */
/* -------------------------------------------------------------------------- */

function RoleToggle({
  value,
  onChange,
}: {
  value: SessionTestRole
  onChange: (r: SessionTestRole) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border p-1">
      <Button
        variant={value === "learner" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-3 text-xs"
        onClick={() => onChange("learner")}
      >
        Learner
      </Button>
      <Button
        variant={value === "admin" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-3 text-xs"
        onClick={() => onChange("admin")}
      >
        Admin
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  SessionAttendanceSelect                                                   */
/* -------------------------------------------------------------------------- */

function SessionAttendanceSelect({
  value,
  onChange,
  disabled = false,
  wide = false,
  onOpenChange,
}: {
  value: SessionAttendanceStatus
  onChange: (value: SessionAttendanceStatus) => void
  disabled?: boolean
  wide?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const option = ATTENDANCE_OPTION_BY_VALUE[value]

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as SessionAttendanceStatus)}
      disabled={disabled}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger
        className={cn(
          "border-[1px] border-gray-200 bg-transparent hover:bg-muted/50 focus:ring-0",
          wide ? "w-full" : "w-[56px]",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <SelectValue>
          {wide ? (
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-medium", option.iconColor)}>
                {option.label}
              </span>
            </div>
          ) : (
            <span className={cn("text-xs font-semibold", option.iconColor)}>
              {option.code}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[180px]">
        <SelectGroup>
          <SelectLabel>Attendance Status</SelectLabel>
          {SESSION_ATTENDANCE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex w-full items-center gap-2 pr-8">
                <span className={cn("text-sm", opt.iconColor)}>
                  {opt.label}
                </span>
                <span
                  className={cn(
                    "ml-auto text-xs text-muted-foreground",
                    opt.iconColor
                  )}
                >
                  ({opt.code})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

/* -------------------------------------------------------------------------- */
/*  SessionDetailDialog                                                       */
/* -------------------------------------------------------------------------- */

interface SessionDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session | null
  weekDates: Date[]
  testRole: SessionTestRole
  onTestRoleChange: (r: SessionTestRole) => void
  attendanceRows: SessionLearnerRow[]
  onAttendanceChange: (learnerId: string, next: SessionAttendanceStatus) => void
  onMarkAllPresent: () => void
  currentLearnerId: string
}

function SessionDetailDialog({
  open,
  onOpenChange,
  session,
  weekDates,
  testRole,
  onTestRoleChange,
  attendanceRows,
  onAttendanceChange,
  onMarkAllPresent,
  currentLearnerId,
}: SessionDetailDialogProps) {
  const isAdmin = testRole === "admin"
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)

  const sessionDate = useMemo(() => {
    if (!session) return null
    const d = weekDates[session.dayIndex]
    return d ? new Date(d) : null
  }, [session, weekDates])

  const summary = useMemo(
    () => calculateAttendanceSummary(attendanceRows),
    [attendanceRows]
  )

  const currentLearnerRow = useMemo(
    () => attendanceRows.find((r) => r.id === currentLearnerId) ?? null,
    [attendanceRows, currentLearnerId]
  )

  const handleDropdownOpenChange = (isOpen: boolean) => {
    if (dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }

    if (isOpen) {
      setIsInteractingWithDropdown(true)
    } else {
      dropdownCloseTimer.current = setTimeout(() => {
        setIsInteractingWithDropdown(false)
        dropdownCloseTimer.current = null
      }, 150)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isInteractingWithDropdown) {
      return
    }
    if (!newOpen && dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }
    onOpenChange(newOpen)
  }

  const handlePointerDownOutside = (e: Event) => {
    const target = e.target as HTMLElement
    if (
      target.closest('[role="listbox"]') ||
      target.closest('[role="option"]') ||
      target.closest("[data-dropdown-trigger]")
    ) {
      e.preventDefault()
    }
  }

  const handleSave = () => {
    if (isAdmin) {
      toast.success("Session attendance saved", {
        description: `${summary.present} present · ${summary.absent} absent · ${summary.late} late · ${summary.excused} excused`,
      })
    } else {
      toast.success("Attendance submitted", {
        description: currentLearnerRow
          ? `Your status: ${ATTENDANCE_OPTION_BY_VALUE[currentLearnerRow.status].label}`
          : "Your attendance has been recorded",
      })
    }
    onOpenChange(false)
  }

  if (!session || !sessionDate) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={handlePointerDownOutside}
          onEscapeKeyDown={(e) => {
            if (isInteractingWithDropdown) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>No session</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  const sessionNoMatch = session.name.match(/Session\s+(\d+)/i)
  const sessionNo = sessionNoMatch ? Number(sessionNoMatch[1]) : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-full flex-col p-0 sm:max-w-2xl"
        showCloseButton
        onPointerDownOutside={handlePointerDownOutside}
        onEscapeKeyDown={(e) => {
          if (isInteractingWithDropdown) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader className="gap-3 border-b p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-2 pr-8">
              <DialogTitle className="text-xl leading-tight">
                <span className="block truncate">{session.name}</span>
              </DialogTitle>
            </div>
            <RoleToggle value={testRole} onChange={onTestRoleChange} />
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6">
          <section className="space-y-3">
            <div className="grid grid-cols-[130px_1fr] items-start gap-x-4 gap-y-4 rounded-lg bg-muted/10 pt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <HugeiconsIcon
                  icon={Calendar01Icon}
                  strokeWidth={STROKE_WIDTH}
                  className="h-4 w-4"
                />
                Date
              </div>
              <div>
                <span className="font-medium">
                  {formatFullDate(sessionDate)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <HugeiconsIcon
                  icon={Time02Icon}
                  strokeWidth={STROKE_WIDTH}
                  className="h-4 w-4"
                />
                Time
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {formatTimeLabel(session.startHour)}
                </span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={STROKE_WIDTH}
                  className="h-4 w-4 text-muted-foreground"
                />
                <span className="font-medium">
                  {formatTimeLabel(session.endHour)}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  ({Math.round((session.endHour - session.startHour) * 60)} min)
                </span>
              </div>

              {session.instructor && (
                <>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <HugeiconsIcon
                      icon={TeacherIcon}
                      strokeWidth={STROKE_WIDTH}
                      className="h-4 w-4"
                    />
                    Instructor
                  </div>
                  <div className="text-sm leading-tight font-medium">
                    {session.instructor}
                  </div>
                </>
              )}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            {isAdmin ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-medium text-muted-foreground">
                      Attendance Summary
                    </h4>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl font-bold">
                        {summary.ratePercent}%
                      </h4>
                      <span className="text-sm font-medium text-green-600">
                        P: {summary.present}
                      </span>
                      <span className="text-sm font-medium text-red-600">
                        A: {summary.absent}
                      </span>
                      <span className="text-sm font-medium text-yellow-600">
                        L: {summary.late}
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        E: {summary.excused}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onMarkAllPresent}
                  >
                    Mark all as Present
                  </Button>
                </div>

                <div className="overflow-hidden rounded-lg border">
                  <div className="max-h-[270px] min-w-0 overflow-y-auto">
                    <Table className="border-separate border-spacing-0">
                      <TableHeader className="sticky top-0 z-20 bg-muted/70 backdrop-blur-sm">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="sticky left-0 z-30 h-11 w-[250px] border-r-2 border-r-border bg-muted/90">
                            Employee
                          </TableHead>
                          <TableHead>Attendance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceRows.map((row) => {
                          const opt = ATTENDANCE_OPTION_BY_VALUE[row.status]
                          return (
                            <TableRow key={row.id}>
                              <TableCell className="sticky left-0 z-10 w-[250px] border-r-2 border-r-border bg-background">
                                <div className="flex items-center gap-3 py-0.5">
                                  <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarImage src="" alt={row.learnerName} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(row.learnerName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm leading-tight font-medium">
                                      {row.learnerName}
                                    </div>
                                    <div className="flex gap-1 truncate text-xs text-muted-foreground">
                                      <span className="max-w-[50%] truncate">
                                        {row.department}
                                      </span>
                                      <span className="text-muted-foreground">
                                        •
                                      </span>
                                      <span className="max-w-[50%] truncate">
                                        {row.team}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <SessionAttendanceSelect
                                    value={row.status}
                                    wide
                                    onChange={(next) =>
                                      onAttendanceChange(row.id, next)
                                    }
                                    onOpenChange={handleDropdownOpenChange}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 rounded-lg pb-4">
                {currentLearnerRow ? (
                  <div className="grid grid-cols-[130px_1fr] items-start gap-x-4 gap-y-4">
                    <Label className="flex items-center gap-2 pt-2 text-sm font-medium text-muted-foreground">
                      Your Attendance
                    </Label>
                    <div>
                      <SessionAttendanceSelect
                        value={currentLearnerRow.status}
                        wide
                        onChange={(next) =>
                          onAttendanceChange(currentLearnerRow.id, next)
                        }
                        onOpenChange={handleDropdownOpenChange}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-sm text-muted-foreground">
                    No enrollment record found for you in this session.
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <DialogFooter className="border-t p-6 pt-4">
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            {isAdmin ? "Save Changes" : "Submit Attendance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  ratePercent: number
}

const calculateAttendanceSummary = (
  rows: SessionLearnerRow[]
): AttendanceSummary => {
  const total = rows.length || 1
  const present = rows.filter((r) => r.status === "PRESENT").length
  const absent = rows.filter((r) => r.status === "ABSENT").length
  const late = rows.filter((r) => r.status === "LATE").length
  const excused = rows.filter((r) => r.status === "EXCUSED").length
  const ratePercent = Math.round(((present + late + excused) / total) * 100)
  return { total, present, absent, late, excused, ratePercent }
}

/* -------------------------------------------------------------------------- */
/*  ScheduleTab Component                                                     */
/* -------------------------------------------------------------------------- */

interface ScheduleTabProps {
  course: any
  userRole?: string
}

export function ScheduleTab({ course, userRole }: ScheduleTabProps) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [searchTerm, setSearchTerm] = useState("")
  const [justScrolledToToday, setJustScrolledToToday] = useState(false)
  const [testRole, setTestRole] = useState<SessionTestRole>(
    userRole === "admin" ||
      userRole === "approver" ||
      userRole === "department_head"
      ? "admin"
      : "learner"
  )
  const [dialog, setDialog] = useState<SessionDialogState>({
    open: false,
    session: null,
  })
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Generate sessions from course data
  const sessions = useMemo(() => generateDummySessions(course), [course])

  // Attendance store
  const [attendanceStore, setAttendanceStore] = useState<
    Record<string, SessionLearnerRow[]>
  >({})

  // Initialize attendance store
  useEffect(() => {
    const initial: Record<string, SessionLearnerRow[]> = {}
    sessions.forEach((s) => {
      initial[s.id] = generateSessionLearners(s.id)
    })
    setAttendanceStore(initial)
  }, [sessions])

  // Live current-time indicator (updates each minute)
  const [nowTime, setNowTime] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNowTime(new Date()), 60 * 1000)
    return () => window.clearInterval(id)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "t") {
        e.preventDefault()
        scrollToToday()
      }
    }
    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [weekStart])

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const today = useMemo(() => new Date(), [])

  // Calculate current time position
  const nowHour =
    nowTime.getHours() + nowTime.getMinutes() / 60 + nowTime.getSeconds() / 3600
  const nowInRange = nowHour >= HOUR_START && nowHour <= HOUR_END
  const nowTop =
    nowHour <= HOUR_START
      ? 0
      : nowHour >= HOUR_END
        ? (HOUR_END - HOUR_START) * HOUR_HEIGHT
        : (nowHour - HOUR_START) * HOUR_HEIGHT
  const todayDayIndex = weekDates.findIndex((d) => isSameDay(d, nowTime))

  // Filter sessions based on search
  const filteredSessions = useMemo(() => {
    if (!searchTerm.trim()) return sessions
    const term = searchTerm.toLowerCase().trim()
    return sessions.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.courseName.toLowerCase().includes(term) ||
        (s.instructor ?? "").toLowerCase().includes(term)
    )
  }, [sessions, searchTerm])

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

  const openSessionDialog = useCallback((s: Session) => {
    setDialog({ open: true, session: s })
  }, [])

  const activeRows = dialog.session
    ? (attendanceStore[dialog.session.id] ?? [])
    : []

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

    const container = outerContainer
    const todayDate = new Date()
    const todayWeekIndex = weekDates.findIndex((d) => isSameDay(d, todayDate))

    if (todayWeekIndex === -1) return

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
    <TabsContent value="schedule" className="w-full min-w-0 pt-4">
      <div className="w-full min-w-0 rounded-lg bg-background pb-6">
        {/* ===== Sub Header ===== */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
          <div>
            <InputGroup className="w-[350px]">
              <InputGroupInput
                ref={searchInputRef}
                placeholder="Search sessions..."
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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                >
                  Today
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Scroll to today's column</p>
              </TooltipContent>
            </Tooltip>

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
          </div>
        </div>

        {/* ===== Week grid ===== */}
        <div className="min-w-0 overflow-hidden rounded-sm border">
          <div
            ref={tableContainerRef}
            className="min-w-0 overflow-auto scroll-smooth"
          >
            <div className="grid min-w-[900px] grid-cols-[64px_repeat(7,minmax(140px,1fr))]">
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
                    <div
                      className={cn(
                        "mx-auto mb-1 flex w-fit items-center justify-center gap-1 rounded-lg text-sm font-semibold"
                      )}
                    >
                      <span>{monthName}</span>
                      <span
                        className={cn(
                          isToday &&
                            "flex items-center justify-center rounded-full"
                        )}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "text-xs font-medium text-muted-foreground"
                      )}
                    >
                      {WEEKDAY_LABELS[i]}
                    </div>
                  </div>
                )
              })}

              {/* Time gutter with current time indicator */}
              <div
                className="sticky left-0 z-20 border-t bg-background"
                style={{ height: gridHeight }}
              >
                {Array.from(
                  { length: HOUR_END - HOUR_START },
                  (_, i) => HOUR_START + i
                ).map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute right-3 translate-y-4 text-[11px] font-medium text-muted-foreground"
                    style={{ top: i * HOUR_HEIGHT }}
                  >
                    {formatHourLabel(hour)}
                  </div>
                ))}
                {/* Current-time handle in time gutter (only when today in current week) */}
                {todayDayIndex !== -1 && nowInRange && (
                  <div
                    className="pointer-events-none absolute right-0 z-30 flex translate-x-1/2 translate-y-4 items-center"
                    style={{ top: nowTop }}
                  >
                    <div className="h-3 w-3 rounded-full border-2 border-white bg-red-500 shadow" />
                  </div>
                )}
              </div>

              {weekDates.map((date, dayIndex) => {
                const isToday = isSameDay(date, today)
                const daySessions = filteredSessions.filter(
                  (s) => s.dayIndex === dayIndex
                )

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
                    {Array.from(
                      { length: HOUR_END - HOUR_START },
                      (_, i) => HOUR_START + i
                    ).map((hour, i) => (
                      <div
                        key={hour}
                        className="absolute inset-x-0 border-t border-dashed border-muted"
                        style={{ top: i * HOUR_HEIGHT }}
                      />
                    ))}

                    {/* Current-time red line (only today) */}
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

                    {daySessions.map((session) => {
                      const theme = SESSION_THEMES[session.theme]
                      const top =
                        (session.startHour - HOUR_START) * HOUR_HEIGHT + 14
                      const height =
                        (session.endHour - session.startHour) * HOUR_HEIGHT

                      return (
                        <button
                          type="button"
                          key={session.id}
                          onClick={() => openSessionDialog(session)}
                          className={cn(
                            "group absolute inset-x-1 cursor-pointer overflow-hidden rounded-md border-l-[3px] p-1.5 text-left ring-offset-background transition-all hover:ring-2 hover:ring-offset-1",
                            theme.bg,
                            theme.border,
                            theme.hoverRing
                          )}
                          style={{
                            top: top + 2,
                            height: Math.max(height - 4, 30),
                          }}
                        >
                          <div
                            className={cn(
                              "truncate text-xs font-semibold",
                              theme.text
                            )}
                          >
                            {session.name}
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

        {/* ===== Session Detail Dialog ===== */}
        <SessionDetailDialog
          open={dialog.open}
          onOpenChange={(o) => setDialog((st) => ({ ...st, open: o }))}
          session={dialog.session}
          weekDates={weekDates}
          testRole={testRole}
          onTestRoleChange={setTestRole}
          attendanceRows={activeRows}
          onAttendanceChange={onAttendanceChange}
          onMarkAllPresent={onMarkAllPresent}
          currentLearnerId={CURRENT_LEARNER_ID}
        />
      </div>
    </TabsContent>
  )
}
