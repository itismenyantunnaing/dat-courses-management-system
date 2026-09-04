import React, { useState, useEffect, useMemo, useRef } from "react"
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
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CircleIcon,
  UserGroupIcon,
  AlertCircleIcon,
  Calendar01Icon,
  ArrowRight01Icon,
  Time02Icon,
  TeacherIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { mainStore } from "@/store/mainStore"
import {
  STROKE_WIDTH,
  SESSION_THEMES,
  SESSION_ATTENDANCE_OPTIONS,
  ATTENDANCE_OPTION_BY_VALUE,
} from "@/components/schedule/constants/schedule.constants"
import {
  Session,
  SessionTestRole,
  SessionLearnerRow,
  SessionAttendanceStatus,
  SessionProgressRow,
  SelfStudyProgressFields,
  StudyColumnRange,
  SELF_STUDY_COLUMNS,
} from "@/types/schedule"
import {
  formatFullDate,
  formatTimeLabel,
  calculateAttendanceSummary,
  calculateProgressSummary,
  getLearnerCompletion,
  getInitials,
} from "@/components/schedule/utils/schedule.utils"

// TESTING_DATE - set to null for real date, or a specific date for testing
// (same pattern as AttendanceTab / ProgressTab)
// const TESTING_DATE: Date | null = new Date("2026-09-11")
const TESTING_DATE: Date | null = null

const getEffectiveToday = () => TESTING_DATE ?? new Date()

interface SessionDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session | null
  weekDates: Date[]
  studyColumns: StudyColumnRange[]
  attendanceRows: SessionLearnerRow[]
  onAttendanceChange: (learnerId: string, next: SessionAttendanceStatus) => void
  onNoteChange: (learnerId: string, note: string) => void
  onMarkAllPresent: () => void
  progressRows: SessionProgressRow[]
  onProgressChange: (
    learnerId: string,
    field: keyof SelfStudyProgressFields,
    value: number
  ) => void
  currentLearnerId: string
}

// Updated parseSessionId to include empId for self-study sessions
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

// Sub-component: RoleToggle
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

// Sub-component: SessionAttendanceSelect
function SessionAttendanceSelect({
  value,
  onChange,
  disabled = false,
  wide = false,
  isUpcoming = false,
  onOpenChange,
}: {
  value: SessionAttendanceStatus
  onChange: (value: SessionAttendanceStatus) => void
  disabled?: boolean
  wide?: boolean
  isUpcoming?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const option = ATTENDANCE_OPTION_BY_VALUE[value]

  // Future/upcoming sessions can't be marked yet — hide the select box
  // entirely and show a plain, non-interactive placeholder instead
  // (same rule as AttendanceTab, where future session cells are locked).
  if (isUpcoming) {
    return (
      <span
        className={cn(
          "inline-flex h-9 items-center text-xs font-medium text-muted-foreground/70",
          wide && "w-full"
        )}
      >
        —
      </span>
    )
  }

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

// Sub-component: SelfStudyProgressFieldRow
function SelfStudyProgressFieldRow({
  label,
  current,
  target,
  onChange,
  isUpcoming = false,
}: {
  label: string
  current: number
  target: number
  onChange: (value: number) => void
  isUpcoming?: boolean
}) {
  const [localValue, setLocalValue] = useState(String(current))

  useEffect(() => {
    setLocalValue(String(current))
  }, [current])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value

    // Allow empty string for user to clear the field
    if (raw === "") {
      setLocalValue("")
      onChange(0)
      return
    }

    const parsed = Number(raw)
    if (!Number.isNaN(parsed)) {
      // Clamp the value to target (max) and 0 (min)
      const clampedValue = Math.max(0, Math.min(parsed, target))
      setLocalValue(String(clampedValue))
      onChange(clampedValue)
    } else {
      setLocalValue(raw)
    }
  }

  const handleBlur = () => {
    // On blur, ensure the value is within bounds
    const numValue = Number(localValue) || 0
    const clampedValue = Math.max(0, Math.min(numValue, target))
    if (numValue !== clampedValue) {
      setLocalValue(String(clampedValue))
      onChange(clampedValue)
    }
  }

  // If upcoming, show placeholder (no input)
  if (isUpcoming) {
    return (
      <div className="flex justify-between pr-12">
        <Label className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-24 items-center justify-center text-sm text-muted-foreground/70">
            -
          </span>
          <span className="text-sm text-muted-foreground">/ {target}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-between pr-12">
      <Label className="text-sm font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={target}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="h-8 w-24 border-gray-200 text-center text-sm"
        />
        <span className="text-sm text-muted-foreground">/ {target}</span>
      </div>
    </div>
  )
}

// Sub-component: AttendanceStatTile
function AttendanceStatTile({
  label,
  value,
  dotCn,
  valueColor,
}: {
  label: string
  value: number
  dotCn: string
  valueColor: string
}) {
  return (
    <div className="min-w-[96px] rounded-lg border bg-muted/20 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", dotCn)} />
        {label}
      </div>
      <div className={cn("mt-0.5 text-2xl leading-none font-bold", valueColor)}>
        {value}
      </div>
    </div>
  )
}

// Sub-component: SessionAttendanceTable
function SessionAttendanceTable({
  rows,
  onAttendanceChange,
  onDropdownOpenChange,
  isUpcoming = false,
}: {
  rows: SessionLearnerRow[]
  onAttendanceChange: (learnerId: string, status: SessionAttendanceStatus) => void
  onDropdownOpenChange?: (isOpen: boolean) => void
  isUpcoming?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="max-h-[270px] min-w-0 overflow-y-auto">
        <Table className="border-separate border-spacing-0">
          <TableHeader className="sticky top-0 z-20 bg-muted/70 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-30 h-11 w-[250px] border-r-2 border-r-border bg-muted/90">
                Learner
              </TableHead>
              <TableHead>Attendance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
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
                        <span className="text-muted-foreground">•</span>
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
                      isUpcoming={isUpcoming}
                      onChange={(next) => onAttendanceChange(row.id, next)}
                      onOpenChange={onDropdownOpenChange}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Sub-component: SessionProgressTable
function SessionProgressTable({ rows }: { rows: SessionProgressRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="max-h-[320px] min-w-0 overflow-x-auto overflow-y-auto">
        <Table className="border-separate border-spacing-0">
          <TableHeader className="sticky top-0 z-20 bg-muted/70 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-30 h-11 w-[220px] border-r-2 border-r-border bg-muted/90">
                Learner
              </TableHead>
              {SELF_STUDY_COLUMNS.map((col) => (
                <TableHead
                  key={col.key}
                  className="text-center whitespace-nowrap"
                  colSpan={2}
                >
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="text-center whitespace-nowrap">
                Complete
              </TableHead>
            </TableRow>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-30 h-11 w-[220px] border-r-2 border-r-border bg-muted/90" />
              {SELF_STUDY_COLUMNS.map((col) => (
                <React.Fragment key={col.key}>
                  <TableHead className="text-center text-xs font-medium whitespace-nowrap text-muted-foreground">
                    Current
                  </TableHead>
                  <TableHead className="text-center text-xs font-medium whitespace-nowrap text-muted-foreground">
                    Target
                  </TableHead>
                </React.Fragment>
              ))}
              <TableHead className="text-center text-xs font-medium whitespace-nowrap text-muted-foreground">
                %
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const completion = getLearnerCompletion(row)
              return (
                <TableRow key={row.id}>
                  <TableCell className="sticky left-0 z-10 w-[220px] border-r-2 border-r-border bg-background">
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
                          <span className="text-muted-foreground">•</span>
                          <span className="max-w-[50%] truncate">
                            {row.team}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  {SELF_STUDY_COLUMNS.map((col) => {
                    const currentKey =
                      `${col.key}Current` as keyof SelfStudyProgressFields
                    const targetKey =
                      `${col.key}Target` as keyof SelfStudyProgressFields
                    return (
                      <React.Fragment key={col.key}>
                        <TableCell className="text-center whitespace-nowrap">
                          <span className="text-sm font-medium">
                            {row[currentKey] as number}
                          </span>
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <span className="text-sm text-muted-foreground">
                            {row[targetKey] as number}
                          </span>
                        </TableCell>
                      </React.Fragment>
                    )
                  })}
                  <TableCell className="text-center whitespace-nowrap">
                    <Badge
                      className={cn(
                        "font-medium",
                        completion >= 80
                          ? "bg-green-100 text-green-700"
                          : completion >= 50
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      )}
                    >
                      {completion}%
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Main SessionDetailDialog Component
export function SessionDetailDialog({
  open,
  onOpenChange,
  session,
  weekDates,
  studyColumns,
  attendanceRows,
  onAttendanceChange,
  onNoteChange,
  onMarkAllPresent,
  progressRows,
  onProgressChange,
  currentLearnerId,
  userRole,
}: SessionDetailDialogProps) {
  const {
    attendances,
    enrollments,
    studyProgress,
    createAttendance,
    updateAttendance,
    add_studyProgress,
    update_studyProgress,
  } = mainStore()

  const isAdmin = userRole === "admin" ||
    userRole === "approver" ||
    userRole === "department_head"
  const isSelfStudy = session?.type === "self-study"
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const sessionDate = useMemo(() => {
    if (!session || isSelfStudy) return null
    const d = weekDates[session.dayIndex]
    return d ? new Date(d) : null
  }, [session, weekDates, isSelfStudy])

  const studyRange = useMemo(() => {
    if (!session || !isSelfStudy || session.weekIndex == null) return null
    return studyColumns[session.weekIndex] ?? null
  }, [session, isSelfStudy, studyColumns])

  const summary = useMemo(
    () => calculateAttendanceSummary(attendanceRows),
    [attendanceRows]
  )

  const progressSummary = useMemo(
    () => calculateProgressSummary(progressRows),
    [progressRows]
  )

  const currentLearnerRow = useMemo(
    () => attendanceRows.find((r) => r.id === currentLearnerId) ?? null,
    [attendanceRows, currentLearnerId]
  )

  const currentLearnerProgress = useMemo(
    () => progressRows.find((r) => r.id === currentLearnerId) ?? null,
    [progressRows, currentLearnerId]
  )
  const getSessionStatus = (): { label: string; variant: string } => {
    const now = new Date(getEffectiveToday())
    now.setHours(0, 0, 0, 0)

    if (isSelfStudy) {
      // ✅ Use the correct property name: sessionDate (not date)
      const sessionDeadline = (session as any)?.sessionDate

      if (sessionDeadline) {
        const deadlineDate = new Date(sessionDeadline)
        deadlineDate.setHours(0, 0, 0, 0)

        const isCompleted = currentLearnerProgress
          ? getLearnerCompletion(currentLearnerProgress) >= 100
          : false

        if (deadlineDate < now) {
          return isCompleted
            ? {
              label: "Completed",
              variant: "bg-green-100 text-green-700 border-green-200",
            }
            : {
              label: "Overdue",
              variant: "bg-red-100 text-red-700 border-red-200",
            }
        } else if (deadlineDate.getTime() === now.getTime()) {
          return {
            label: "In Progress",
            variant: "bg-blue-100 text-blue-700 border-blue-200",
          }
        } else {
          return {
            label: "Upcoming",
            variant: "bg-yellow-100 text-yellow-700 border-yellow-200",
          }
        }
      }

      // Fallback to studyRange if no sessionDate is set
      if (!studyRange) {
        return {
          label: "Upcoming",
          variant: "bg-yellow-100 text-yellow-700 border-yellow-200",
        }
      }

      const startDate = new Date(studyRange.start)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(studyRange.end)
      endDate.setHours(0, 0, 0, 0)

      if (endDate < now) {
        const allCompleted = progressRows.every((row) => {
          return getLearnerCompletion(row) >= 100
        })
        return allCompleted
          ? {
            label: "Completed",
            variant: "bg-green-100 text-green-700 border-green-200",
          }
          : {
            label: "Overdue",
            variant: "bg-red-100 text-red-700 border-red-200",
          }
      } else if (startDate <= now && now <= endDate) {
        return {
          label: "In Progress",
          variant: "bg-blue-100 text-blue-700 border-blue-200",
        }
      } else {
        return {
          label: "Upcoming",
          variant: "bg-yellow-100 text-yellow-700 border-yellow-200",
        }
      }
    } else {
      if (!sessionDate)
        return {
          label: "Upcoming",
          variant: "bg-yellow-100 text-yellow-700 border-yellow-200",
        }

      const sessionDateObj = new Date(sessionDate)
      sessionDateObj.setHours(0, 0, 0, 0)

      if (sessionDateObj < now) {
        return {
          label: "Completed",
          variant: "bg-green-100 text-green-700 border-green-200",
        }
      } else if (sessionDateObj.getTime() === now.getTime()) {
        return {
          label: "Today",
          variant: "bg-blue-100 text-blue-700 border-blue-200",
        }
      } else {
        return {
          label: "Upcoming",
          variant: "bg-yellow-100 text-yellow-700 border-yellow-200",
        }
      }
    }
  }

  const sessionStatus = getSessionStatus()

  const isUpcomingSession = sessionStatus.label === "Upcoming"

  const firstUpcomingWeekIndex = useMemo(() => {
    if (!isSelfStudy) return -1

    const today = new Date(getEffectiveToday())
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < studyColumns.length; i++) {
      const range = studyColumns[i]
      if (!range) continue
      const endDate = new Date(range.end)
      endDate.setHours(0, 0, 0, 0)
      // If the end date is > today, this week's session is upcoming
      if (endDate > today) {
        return i
      }
    }

    return -1
  }, [isSelfStudy, studyColumns])

  const isSelfStudyProgressEditable = useMemo(() => {
    if (!isSelfStudy || !session || session.weekIndex == null) {
      return false
    }

    if (isAdmin) {
      return false
    }

    const empId = (session as any)?.employeeId
    if (empId !== currentLearnerId) {
      return false
    }

    const status = getSessionStatus()

    // ✅ "In Progress" sessions are editable
    if (status.label === "In Progress") {
      return true
    }

    // ✅ For "Upcoming" sessions:
    if (status.label === "Upcoming") {

      const isFirstUpcoming = session.weekIndex === firstUpcomingWeekIndex
      return isFirstUpcoming
    }

    return false
  }, [isSelfStudy, session, studyColumns, isAdmin, currentLearnerId, currentLearnerProgress, firstUpcomingWeekIndex])

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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (isSelfStudy) {
        if (session) {
          const parsed = parseSessionId(session.id)
          const courseId = parsed?.courseId
            ? isNaN(Number(parsed.courseId))
              ? parsed.courseId
              : Number(parsed.courseId)
            : null
          const sessionNoMatch = session.name.match(/Session\s+(\d+)/i)
          const sessionNo = sessionNoMatch ? Number(sessionNoMatch[1]) : null

          // Get the employee ID from the parsed session or from the session object
          const empId = parsed?.empId || (session as any).employeeId

          // Get the session ID from the session object
          const selfStudySessionId = (session as any).originalSessionId

          if (courseId) {
            // Get progress list from store - handle both array and object formats
            let progressList: any[] = []
            if (Array.isArray(studyProgress)) {
              progressList = studyProgress
            } else if (studyProgress && typeof studyProgress === 'object') {
              if (Array.isArray((studyProgress as any).progress)) {
                progressList = (studyProgress as any).progress
              } else if (Array.isArray((studyProgress as any).data)) {
                progressList = (studyProgress as any).data
              }
            }

            // Determine which rows to save
            let rowsToSave: SessionProgressRow[] = []

            if (isAdmin) {
              // Admin saves all rows
              rowsToSave = progressRows
            } else if (empId) {
              // For learners, only save their own progress - match by id
              rowsToSave = progressRows.filter((row) => row.id === empId)
              // If no match by id, try by learnerName (fallback)
              if (rowsToSave.length === 0) {
                rowsToSave = progressRows.filter(
                  (row) => row.learnerName === (session as any).employeeName
                )
              }
            } else {
              // Fallback: use currentLearnerProgress
              rowsToSave = currentLearnerProgress ? [currentLearnerProgress] : []
            }

            // If still no rows to save, use the first row from progressRows as fallback
            if (rowsToSave.length === 0 && progressRows.length > 0) {
              rowsToSave = [progressRows[0]]
            }

            if (rowsToSave.length === 0) {
              toast.warning("No progress data to save")
              setIsSaving(false)
              onOpenChange(false)
              return
            }

            let savedCount = 0
            for (const row of rowsToSave) {
              // Find the enrollment ID for this employee
              let enrollmentId: number | null = null
              for (const e of enrollments) {
                const eRec = e as Record<string, unknown>
                const eEmpId =
                  typeof eRec.employeeId === "string"
                    ? eRec.employeeId
                    : typeof eRec.employee_id === "string"
                      ? eRec.employee_id
                      : null
                const eCourseId =
                  typeof eRec.courseId === "number"
                    ? eRec.courseId
                    : typeof eRec.courseId === "string"
                      ? parseInt(eRec.courseId, 10)
                      : NaN
                const eId =
                  typeof eRec.id === "number"
                    ? eRec.id
                    : typeof eRec.id === "string"
                      ? parseInt(eRec.id, 10)
                      : NaN
                if (
                  eEmpId === row.id &&
                  eCourseId === Number(courseId) &&
                  !isNaN(eId)
                ) {
                  enrollmentId = eId
                  break
                }
              }

              // Build the payload for the API - match the format from ProgressTab
              const payload = {
                enrollment_id: enrollmentId,
                employee_id: row.id,
                employeeId: row.id,
                self_study_session_id: selfStudySessionId ? parseInt(selfStudySessionId) : null,
                session_no: sessionNo ?? 1,
                sessionNo: sessionNo ?? 1,
                grammar_count: row.grammarCurrent,
                grammarCurrent: row.grammarCurrent,
                vocabulary_count: row.vocabularyCurrent,
                vocabularyCurrent: row.vocabularyCurrent,
                kanji_count: row.kanjiCurrent,
                kanjiCurrent: row.kanjiCurrent,
                reading_minutes: row.readingCurrent,
                readingCurrent: row.readingCurrent,
                listening_minutes: row.listeningCurrent,
                listeningCurrent: row.listeningCurrent,
                file_path: null,
                filepath: null,
                completion_status: "IN_PROGRESS",
              }

              // Find existing progress record
              let existingId: number | string | null = null
              for (const p of progressList) {
                const pRec = p as Record<string, unknown>
                const pEmp =
                  typeof pRec.employee_id === "string"
                    ? pRec.employee_id
                    : typeof pRec.employeeId === "string"
                      ? pRec.employeeId
                      : null
                const pSess =
                  typeof pRec.session_no === "number"
                    ? pRec.session_no
                    : typeof pRec.sessionNo === "number"
                      ? pRec.sessionNo
                      : null
                const pSelfStudySessionId =
                  typeof pRec.self_study_session_id === "number"
                    ? pRec.self_study_session_id
                    : typeof pRec.self_study_session_id === "string"
                      ? parseInt(pRec.self_study_session_id, 10)
                      : null
                const pId =
                  typeof pRec.id === "number" || typeof pRec.id === "string"
                    ? pRec.id
                    : typeof pRec.progressId === "number" || typeof pRec.progressId === "string"
                      ? pRec.progressId
                      : null

                // Match by employee ID AND session number (or self_study_session_id)
                if (
                  pEmp === row.id &&
                  (sessionNo != null ? pSess === sessionNo : true)
                ) {
                  existingId = pId
                  break
                }
              }

              try {
                let result
                if (existingId != null) {
                  // Update existing progress
                  result = await update_studyProgress(courseId, existingId, payload)
                } else {
                  // Create new progress
                  result = await add_studyProgress(courseId, payload)
                }

                if (result?.success !== false) {
                  savedCount++
                } else {
                  console.warn("Failed to save progress row:", row.id, result?.message)
                }
              } catch (err) {
                console.warn("Failed to save progress row:", row.id, err)
              }
            }

            // Show success message
            if (isAdmin) {
              toast.success("Progress reviewed", {
                description: `${progressSummary.ratePercent}% average completion across ${progressRows.length} learners`,
              })
            } else {
              toast.success("Progress saved", {
                description: savedCount > 0
                  ? `${savedCount} record(s) updated`
                  : "Your progress has been recorded",
              })
            }
          } else {
            toast.error("Course ID not found")
          }
        }
      } else {
        // ============ TRAINER ATTENDANCE LOGIC ============
        if (session && isAdmin) {
          const parsed = parseSessionId(session.id)
          const courseId = parsed?.courseId
            ? Number(parsed.courseId)
            : NaN
          const groupId = parsed?.groupId
            ? Number(parsed.groupId)
            : NaN
          const sessionId = parsed?.sessionId
            ? Number(parsed.sessionId)
            : NaN
          const sessionNoMatch = session.name.match(/Session\s+(\d+)/i)
          const sessionNo = sessionNoMatch ? Number(sessionNoMatch[1]) : null

          if (!isNaN(courseId) && !isNaN(groupId)) {
            for (const row of attendanceRows) {
              let enrollmentId: number = NaN
              for (const e of enrollments) {
                const eRec = e as Record<string, unknown>
                const empId =
                  typeof eRec.employeeId === "string"
                    ? eRec.employeeId
                    : typeof eRec.employee_id === "string"
                      ? eRec.employee_id
                      : null
                const eCourseId =
                  typeof eRec.courseId === "number"
                    ? eRec.courseId
                    : typeof eRec.courseId === "string"
                      ? Number(eRec.courseId)
                      : NaN
                const eGroupId =
                  typeof eRec.courseGroupId === "number"
                    ? eRec.courseGroupId
                    : typeof eRec.courseGroupId === "string"
                      ? Number(eRec.courseGroupId)
                      : NaN
                const eId =
                  typeof eRec.id === "number"
                    ? eRec.id
                    : typeof eRec.id === "string"
                      ? Number(eRec.id)
                      : NaN
                if (
                  empId === row.id &&
                  eCourseId === courseId &&
                  eGroupId === groupId &&
                  !isNaN(eId)
                ) {
                  enrollmentId = eId
                  break
                }
              }

              if (isNaN(enrollmentId)) continue

              let existingAttendanceId: number | null = null
              let fallbackCourseSessionId: number = 0
              for (const a of attendances) {
                const aRec = a as Record<string, unknown>
                const aEmpId =
                  typeof aRec.employeeId === "string"
                    ? aRec.employeeId
                    : typeof aRec.employee_id === "string"
                      ? aRec.employee_id
                      : null
                const aSessionId =
                  typeof aRec.courseSessionId === "number"
                    ? aRec.courseSessionId
                    : typeof aRec.courseSessionId === "string"
                      ? Number(aRec.courseSessionId)
                      : NaN
                const aSessionNo =
                  typeof aRec.sessionNo === "number" ? aRec.sessionNo : null
                const aGroupId =
                  typeof aRec.groupId === "number"
                    ? aRec.groupId
                    : typeof aRec.groupId === "string"
                      ? Number(aRec.groupId)
                      : NaN
                const aId =
                  typeof aRec.id === "number"
                    ? aRec.id
                    : typeof aRec.id === "string"
                      ? Number(aRec.id)
                      : NaN
                const sessMatches = !isNaN(sessionId)
                  ? aSessionId === sessionId
                  : sessionNo != null
                    ? aSessionNo === sessionNo
                    : false
                if (
                  aEmpId === row.id &&
                  aGroupId === groupId &&
                  sessMatches
                ) {
                  if (!isNaN(aId)) existingAttendanceId = aId
                  if (!isNaN(aSessionId)) fallbackCourseSessionId = aSessionId
                  break
                }
              }

              const payload = {
                enrollmentId,
                courseSessionId: !isNaN(sessionId)
                  ? sessionId
                  : fallbackCourseSessionId || 0,
                attendanceStatus: row.status,
              }

              try {
                if (existingAttendanceId != null) {
                  await updateAttendance(
                    courseId,
                    groupId,
                    existingAttendanceId,
                    payload
                  )
                } else {
                  await createAttendance(courseId, groupId, payload)
                }
              } catch (err) {
                console.warn(
                  "Failed to save attendance row:",
                  row.id,
                  err
                )
              }
            }

            toast.success("Session attendance saved", {
              description: `${summary.present} present · ${summary.absent} absent · ${summary.late} late · ${summary.excused} excused`,
            })
          } else {
            toast.success("Session attendance saved", {
              description: `${summary.present} present · ${summary.absent} absent · ${summary.late} late · ${summary.excused} excused`,
            })
          }
        } else {
          toast.success("Attendance submitted", {
            description: currentLearnerRow
              ? `Your status: ${ATTENDANCE_OPTION_BY_VALUE[currentLearnerRow.status].label}`
              : "Your attendance has been recorded",
          })
        }
      }
    } finally {
      setIsSaving(false)
    }
    onOpenChange(false)
  }

  if (!session || (isSelfStudy ? !studyRange : !sessionDate)) {
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
        className={cn(
          "flex max-h-[90vh] w-full flex-col p-0",
          isSelfStudy ? "sm:max-w-4xl" : "sm:max-w-2xl",
          !isAdmin && isSelfStudy ? "sm:max-w-2xl" : ""
        )}
        showCloseButton
        onPointerDownOutside={handlePointerDownOutside}
        onEscapeKeyDown={(e) => {
          if (isInteractingWithDropdown) {
            e.preventDefault()
          }
        }}
      >
        {/* Header */}
        <DialogHeader className="gap-3 border-b p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-2 pr-8">
              <DialogTitle className="text-xl leading-tight">
                <span className="block truncate">{session.courseName}</span>
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div
          className={cn(
            "flex-1 space-y-6 overflow-y-auto px-6",
            isSelfStudy && isAdmin ? "pb-10" : ""
          )}
        >
          {/* Session Info grid */}
          <section className="space-y-3">
            <div className="grid grid-cols-[130px_1fr] items-start gap-x-4 gap-y-4 rounded-lg bg-muted/10 pt-4">
              {/* Session Number */}
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <HugeiconsIcon
                  icon={CircleIcon}
                  strokeWidth={STROKE_WIDTH}
                  className="h-4 w-4"
                />
                Session No.
              </div>
              <div>
                {sessionNo ? (
                  <span className="font-medium">Session {sessionNo}</span>
                ) : (
                  <span className="font-medium">{session.name}</span>
                )}
              </div>

              {/* Group */}
              {session.group && session.group !== "Self-Study" && (
                <>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <HugeiconsIcon
                      icon={UserGroupIcon}
                      strokeWidth={STROKE_WIDTH}
                      className="h-4 w-4"
                    />
                    Group
                  </div>
                  <div className="text-sm leading-tight font-medium">
                    {session.group}
                  </div>
                </>
              )}

              {/* Status */}
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  strokeWidth={STROKE_WIDTH}
                  className="h-4 w-4"
                />
                Status
              </div>
              <div>
                <Badge className={cn("border", sessionStatus.variant)}>
                  {sessionStatus.label}
                </Badge>
              </div>

              {/* Date / Duration */}
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <HugeiconsIcon
                  icon={Calendar01Icon}
                  strokeWidth={STROKE_WIDTH}
                  className="h-4 w-4"
                />
                {isSelfStudy ? "Duration" : "Date"}
              </div>
              {isSelfStudy && studyRange ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {formatFullDate(studyRange.start).trim()}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={STROKE_WIDTH}
                    className="h-4 w-4 text-muted-foreground"
                  />
                  <span className="font-medium">
                    {formatFullDate(studyRange.end).trim()}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({session.durationDays ?? 7} days)
                  </span>
                </div>
              ) : (
                <div>
                  <span className="font-medium">
                    {sessionDate ? formatFullDate(sessionDate) : "—"}
                  </span>
                </div>
              )}

              {/* Time */}
              {!isSelfStudy && (
                <>
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
                      ({Math.round((session.endHour - session.startHour) * 60)}{" "}
                      min)
                    </span>
                  </div>
                </>
              )}

              {/* Instructor */}
              {session.group && session.group !== "Self-Study" &&
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
                    {session.instructor ?? "TBA"}
                  </div>
                </>
              }

            </div>
          </section>

          <Separator />

          {isSelfStudy ? (
            /* Progress Section (self-study) */
            <section className="space-y-3">
              {isAdmin ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                      <h4 className="font-medium text-muted-foreground">
                        Progress Summary
                      </h4>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-bold">
                          {progressSummary.ratePercent}%
                        </h4>
                        <span className="text-sm text-muted-foreground">
                          {progressSummary.totalCurrent} /{" "}
                          {progressSummary.totalTarget} completed across{" "}
                          {progressRows.length} learners
                        </span>
                      </div>
                    </div>
                  </div>
                  <SessionProgressTable rows={progressRows} />
                </div>
              ) : (
                <div className="space-y-4 rounded-lg pb-4">
                  {currentLearnerProgress ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 items-center gap-x-4 gap-y-3">
                        {SELF_STUDY_COLUMNS.map((col) => {
                          const currentKey = `${col.key}Current` as keyof SelfStudyProgressFields
                          const targetKey = `${col.key}Target` as keyof SelfStudyProgressFields
                          const currentValue = currentLearnerProgress[currentKey] ?? 0
                          const targetValue = currentLearnerProgress[targetKey] ?? 0

                          // Log to debug
                          console.log(`${col.key}: current=${currentValue}, target=${targetValue}`)

                          return (
                            <SelfStudyProgressFieldRow
                              key={col.key}
                              label={col.label}
                              current={currentValue}
                              target={targetValue}
                              isUpcoming={!isSelfStudyProgressEditable}
                              onChange={(val) =>
                                onProgressChange(
                                  currentLearnerProgress.id,
                                  currentKey,
                                  val
                                )
                              }
                            />
                          )
                        })}
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
          ) : (
            /* Attendance Section (trainer-provided) */
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
                      disabled={isUpcomingSession}
                    >
                      Mark all as Present
                    </Button>
                  </div>
                  <SessionAttendanceTable
                    rows={attendanceRows}
                    onAttendanceChange={onAttendanceChange}
                    onDropdownOpenChange={handleDropdownOpenChange}
                    isUpcoming={isUpcomingSession}
                  />
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
                          isUpcoming={isUpcomingSession}
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
          )}
        </div>

        {/* Footer */}
        {!(isSelfStudy && isAdmin) && (
          <DialogFooter className="border-t p-6 pt-4">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : isAdmin
                  ? "Save Changes"
                  : isSelfStudy
                    ? "Save Progress"
                    : "Submit Attendance"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}