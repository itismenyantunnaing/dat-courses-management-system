// components/drawers/course/tabs/ProgressTab.tsx
"use client"

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react"
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
  Search01Icon,
  FilterMailIcon,
  Delete02Icon,
  ChartIcon,
  Loading03Icon,
  SaveIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
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
  EmptyContent,
} from "@/components/ui/empty"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { mainStore } from "@/store/mainStore"
import { isJLPTType } from "@/types/course"
import { toast } from "sonner"

interface ProgressTabProps {
  userRole: string
  profile?: any
  course?: any
  enrollments?: any[]
  currentUserId?: string | null
  currentUserEnrollment?: any
  studyProgress?: any
  onRefreshProgress?: () => void
}

// Column configuration
const STUDY_COLUMNS = [
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "kanji", label: "Kanji" },
  { key: "reading", label: "Reading (min)" },
  { key: "listening", label: "Listening (min)" },
]

// View modes
const VIEW_MODES = {
  SESSION: "session",
  OVERALL: "overall",
} as const

type ViewMode = (typeof VIEW_MODES)[keyof typeof VIEW_MODES]

// Filter state type
type FilterState = {
  status: string[]
  viewMode: ViewMode[]
  session: string[]
}

// Spinner component
const Spinner = ({ className, ...props }: React.ComponentProps<"svg">) => {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

// Loading spinner with text
const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <Spinner />
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
}

// Helper function to get initials
const getInitials = (name: string) => {
  if (!name) return "??"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

// TESTING_DATE - set to null for real date, or a specific date for testing
const TESTING_DATE: Date | null = null
// const TESTING_DATE: Date | null = new Date("2026-09-23")

const getEffectiveToday = () => TESTING_DATE ?? new Date()

// Helper function to get session status based on deadline and completion
const getSessionStatus = (deadline: string | Date | undefined, isCompleted: boolean) => {
  if (!deadline) return "unknown"

  let date: Date
  if (typeof deadline === "string") {
    date = new Date(deadline)
    if (isNaN(date.getTime())) return "unknown"
  } else if (deadline instanceof Date) {
    date = deadline
    if (isNaN(date.getTime())) return "unknown"
  } else {
    return "unknown"
  }

  const currentDate = getEffectiveToday()
  const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
  const deadlineStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (isCompleted) return "Completed"
  if (deadlineStart.getTime() === todayStart.getTime()) return "In Progress"
  if (deadlineStart.getTime() < todayStart.getTime()) return "Overdue"
  if (deadlineStart.getTime() > todayStart.getTime()) return "Upcoming"

  return "unknown"
}

// Status badge styling
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "Completed":
      return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950 border-green-200"
    case "In Progress":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 border-blue-200"
    case "Overdue":
      return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 border-red-200"
    case "Upcoming":
      return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-950 border-yellow-200"
    default:
      return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300"
  }
}

// Bordered table cell
const BorderedTableCell = ({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof TableCell>) => (
  <TableCell className={cn("border-r border-l", className)} {...props}>
    {children}
  </TableCell>
)

// Bordered table head
const BorderedTableHead = ({
  children,
  className = "",
  colSpan = 1,
  rowSpan = 1,
  ...props
}: React.ComponentProps<typeof TableHead> & { colSpan?: number; rowSpan?: number }) => (
  <TableHead
    className={cn("border-r border-l text-center", className)}
    colSpan={colSpan}
    rowSpan={rowSpan}
    {...props}
  >
    {children}
  </TableHead>
)

// Editable field component with auto-clamp
const EditableField = ({
  value,
  onChange,
  disabled = false,
  type = "number",
  className = "",
  max = Infinity,
}: {
  value: number | string
  onChange: (value: string) => void
  disabled?: boolean
  type?: string
  className?: string
  max?: number
}) => {
  const [localValue, setLocalValue] = useState(String(value))

  useEffect(() => {
    setLocalValue(String(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const numValue = parseInt(newValue) || 0

    let clampedValue = newValue
    if (numValue > max && max !== Infinity) {
      clampedValue = String(max)
      setLocalValue(clampedValue)
      onChange(clampedValue)
      return
    }

    setLocalValue(newValue)
    onChange(newValue)
  }

  if (disabled) {
    return (
      <span className={cn("text-sm", className)}>
        {value}
      </span>
    )
  }

  const getInputWidth = (val: string | number) => {
    const str = String(val)
    const length = str.length
    const width = Math.min(Math.max(50 + (length - 1) * 12, 50), 120)
    return `${width}px`
  }

  const currentValue = localValue || "0"
  const width = getInputWidth(currentValue)

  return (
    <div className="flex items-center justify-center gap-1">
      <Input
        type={type}
        value={localValue}
        min={0}
        onChange={handleChange}
        style={{ width }}
        className={cn(
          "h-8 border-gray-200 text-center text-sm",
          className
        )}
        disabled={disabled}
      />
    </div>
  )
}

interface ProgressRow {
  id: string
  session: string
  sessionNo: number
  sessionDeadline: string
  memberName: string
  departmentName: string
  teamName: string
  status: string
  isUpcoming: boolean
  isToday: boolean
  isOverdue: boolean
  // Current session data
  grammarCurrent: number
  grammarTarget: number
  vocabularyCurrent: number
  vocabularyTarget: number
  kanjiCurrent: number
  kanjiTarget: number
  readingCurrent: number
  readingTarget: number
  listeningCurrent: number
  listeningTarget: number
  // Cumulative totals
  totalGrammarCurrent: number
  totalGrammarTarget: number
  totalVocabularyCurrent: number
  totalVocabularyTarget: number
  totalKanjiCurrent: number
  totalKanjiTarget: number
  totalReadingCurrent: number
  totalReadingTarget: number
  totalListeningCurrent: number
  totalListeningTarget: number
  percentCompleteCurrent: number
  percentCompleteActual: number
  percentCompleteTarget: number
  // Mock attempts
  mockAttempts: number
  // Editable flag
  isEditable: boolean
  // Employee enrollment ID for mock test
  enrollmentId: number
}

export function ProgressTab({
  userRole,
  profile,
  course,
  enrollments = [],
  currentUserId,
  currentUserEnrollment,
  studyProgress,
  onRefreshProgress,
}: ProgressTabProps) {
  // ============ 1. All useState declarations ============
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [isLoading, setIsLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [progressInputs, setProgressInputs] = useState<Record<string, any>>({})
  const [originalInputs, setOriginalInputs] = useState<Record<string, any>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [mockTestInputs, setMockTestInputs] = useState<Record<number, number>>({})
  const [originalMockTestInputs, setOriginalMockTestInputs] = useState<Record<number, number>>({})

  const isLearner = userRole === "learner"
  const isAdmin = userRole === "admin"
  const isApprover = userRole === "approver" || userRole === "department_head" || userRole === "division_head"
  const isDepartmentHead = userRole === "department_head"

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES.SESSION)

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    viewMode: [],
    session: [],
  })

  // ============ 2. Store hooks ============
  const {
    add_studyProgress,
    update_studyProgress,
    updateMockTest,
  } = mainStore()

  // Check if this is a JLPT self-study course
  const isJLPT = course?.selfStudyType ? isJLPTType(course.selfStudyType) : false

  // ============ 3. Define functions that don't depend on any data ============
  const toggleFilter = useCallback((field: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[field]
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) }
      } else {
        return { ...prev, [field]: [...current, value] }
      }
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({
      status: [],
      viewMode: [],
      session: [],
    })
  }, [])

  // ============ 4. Define progressData using useMemo ============
  const progressData = useMemo(() => {
    if (!course?.self_study_sessions || !studyProgress?.progress) {
      return []
    }

    const sessions = course.self_study_sessions || []
    const progressRecords = studyProgress.progress || []

    // Get filtered enrollments based on user role
    let filteredEnrollments = enrollments.filter(
      (e: any) => e.enrollmentStatus !== "CANCELLED"
    )

    if (isLearner) {
      // Learner only sees their own progress
      filteredEnrollments = filteredEnrollments.filter(
        (e: any) => e.employeeId === currentUserId
      )
    } else if (isDepartmentHead && profile?.deptDat) {
      // Department head only sees their department
      filteredEnrollments = filteredEnrollments.filter(
        (e: any) => e.departmentName === profile.deptDat
      )
    } else if (isApprover && profile?.team) {
      // Approver only sees their team
      filteredEnrollments = filteredEnrollments.filter(
        (e: any) => e.teamName === profile.team
      )
    }

    const data: ProgressRow[] = []

    filteredEnrollments.forEach((enrollment: any) => {
      let cumulativeGrammarActual = 0
      let cumulativeVocabularyActual = 0
      let cumulativeKanjiActual = 0
      let cumulativeReadingActual = 0
      let cumulativeListeningActual = 0
      let cumulativeGrammarTarget = 0
      let cumulativeVocabularyTarget = 0
      let cumulativeKanjiTarget = 0
      let cumulativeReadingTarget = 0
      let cumulativeListeningTarget = 0

      // Total targets
      const totalGrammarTarget = sessions.reduce((sum: number, s: any) => sum + (s.grammarCount || 0), 0)
      const totalVocabularyTarget = sessions.reduce((sum: number, s: any) => sum + (s.vocabularyCount || 0), 0)
      const totalKanjiTarget = sessions.reduce((sum: number, s: any) => sum + (s.kanjiCount || 0), 0)
      const totalReadingTarget = sessions.reduce((sum: number, s: any) => sum + (s.readingMinutes || 0), 0)
      const totalListeningTarget = sessions.reduce((sum: number, s: any) => sum + (s.listeningMinutes || 0), 0)

      // Initialize mock test input
      const mockAttempts = enrollment.mockTestAttempt || 0
      if (!mockTestInputs[enrollment.id]) {
        setMockTestInputs(prev => ({
          ...prev,
          [enrollment.id]: mockAttempts
        }))
        setOriginalMockTestInputs(prev => ({
          ...prev,
          [enrollment.id]: mockAttempts
        }))
      }

      sessions.forEach((session: any, index: number) => {
        const sessionNo = index + 1
        const sessionId = session.id.toString()

        // Find progress for this session and employee
        const progress = progressRecords.find(
          (p: any) =>
            p.self_study_session_id === parseInt(sessionId) &&
            p.employee_id === enrollment.employeeId
        )

        const isCompleted = progress?.completion_status === "COMPLETED"
        const sessionDeadline = progress?.session_deadline || session.date

        // Get current values
        const currentGrammar = progress?.grammar_count || 0
        const currentVocabulary = progress?.vocabulary_count || 0
        const currentKanji = progress?.kanji_count || 0
        const currentReading = progress?.reading_minutes || 0
        const currentListening = progress?.listening_minutes || 0

        const sessionGrammarTarget = session.grammarCount || 0
        const sessionVocabularyTarget = session.vocabularyCount || 0
        const sessionKanjiTarget = session.kanjiCount || 0
        const sessionReadingTarget = session.readingMinutes || 0
        const sessionListeningTarget = session.listeningMinutes || 0

        cumulativeGrammarActual += currentGrammar
        cumulativeVocabularyActual += currentVocabulary
        cumulativeKanjiActual += currentKanji
        cumulativeReadingActual += currentReading
        cumulativeListeningActual += currentListening

        cumulativeGrammarTarget += sessionGrammarTarget
        cumulativeVocabularyTarget += sessionVocabularyTarget
        cumulativeKanjiTarget += sessionKanjiTarget
        cumulativeReadingTarget += sessionReadingTarget
        cumulativeListeningTarget += sessionListeningTarget

        // Determine status using the enhanced getSessionStatus with TESTING_DATE
        const status = getSessionStatus(sessionDeadline, isCompleted)
        const isFuture = status === "Upcoming"
        const isToday = status === "In Progress"

        // Calculate percentages for current session
        const percentCurrent = sessionGrammarTarget > 0 && sessionVocabularyTarget > 0 &&
          sessionKanjiTarget > 0 && sessionReadingTarget > 0 && sessionListeningTarget > 0
          ? Math.round(
            ((currentGrammar / sessionGrammarTarget) * 100 +
              (currentVocabulary / sessionVocabularyTarget) * 100 +
              (currentKanji / sessionKanjiTarget) * 100 +
              (currentReading / sessionReadingTarget) * 100 +
              (currentListening / sessionListeningTarget) * 100) / 5
          )
          : 0

        // Calculate overall percentages
        const percentActual = totalGrammarTarget > 0 && totalVocabularyTarget > 0 &&
          totalKanjiTarget > 0 && totalReadingTarget > 0 && totalListeningTarget > 0
          ? Math.round(
            ((cumulativeGrammarActual / totalGrammarTarget) * 100 +
              (cumulativeVocabularyActual / totalVocabularyTarget) * 100 +
              (cumulativeKanjiActual / totalKanjiTarget) * 100 +
              (cumulativeReadingActual / totalReadingTarget) * 100 +
              (cumulativeListeningActual / totalListeningTarget) * 100) / 5
          )
          : 0

        const percentTarget = totalGrammarTarget > 0 && totalVocabularyTarget > 0 &&
          totalKanjiTarget > 0 && totalReadingTarget > 0 && totalListeningTarget > 0
          ? Math.round(
            ((cumulativeGrammarTarget / totalGrammarTarget) * 100 +
              (cumulativeVocabularyTarget / totalVocabularyTarget) * 100 +
              (cumulativeKanjiTarget / totalKanjiTarget) * 100 +
              (cumulativeReadingTarget / totalReadingTarget) * 100 +
              (cumulativeListeningTarget / totalListeningTarget) * 100) / 5
          )
          : 0

        // Determine if this row should be editable (only learner's own row, not completed, and not overdue)
        // Allow editing for: In Progress (today) and the next upcoming session
        const isOverdue = status === "Overdue"
        const isInProgress = status === "In Progress"
        const isUpcoming = status === "Upcoming"

        // Find the first upcoming session index
        const firstUpcomingIndex = sessions.findIndex((s: any, idx: number) => {
          const progressRecord = progressRecords.find(
            (p: any) =>
              p.self_study_session_id === parseInt(s.id.toString()) &&
              p.employee_id === enrollment.employeeId
          )
          const isCompleted = progressRecord?.completion_status === "COMPLETED"
          const deadline = progressRecord?.session_deadline || s.date
          const status = getSessionStatus(deadline, isCompleted)
          return status === "Upcoming"
        })

        // Session is editable if:
        // 1. It's the learner's own row
        // 2. Not completed
        // 3. Not overdue (overdue sessions are locked)
        // 4. Either: it's "In Progress" (today) OR it's the first upcoming session
        const isEditable =
          isLearner &&
          enrollment.employeeId === currentUserId &&
          !isCompleted &&
          !isOverdue &&
          (isInProgress || (isUpcoming && index === firstUpcomingIndex))

        // Initialize progress inputs
        const progressKey = `${enrollment.id}-${sessionId}`
        if (!progressInputs[progressKey]) {
          setProgressInputs(prev => ({
            ...prev,
            [progressKey]: {
              grammar: currentGrammar,
              vocabulary: currentVocabulary,
              kanji: currentKanji,
              reading: currentReading,
              listening: currentListening,
            }
          }))
          setOriginalInputs(prev => ({
            ...prev,
            [progressKey]: {
              grammar: currentGrammar,
              vocabulary: currentVocabulary,
              kanji: currentKanji,
              reading: currentReading,
              listening: currentListening,
            }
          }))
        }

        data.push({
          id: progressKey,
          session: `Session ${sessionNo}`,
          sessionNo: sessionNo,
          sessionDeadline: sessionDeadline ? formatDate(sessionDeadline) : "",
          memberName: enrollment.employeeName || enrollment.name || "",
          departmentName: enrollment.departmentName || "",
          teamName: enrollment.teamName || "",
          status: status,
          isUpcoming: isFuture,
          isToday: isInProgress,
          isOverdue: isOverdue,
          grammarCurrent: currentGrammar,
          grammarTarget: sessionGrammarTarget,
          vocabularyCurrent: currentVocabulary,
          vocabularyTarget: sessionVocabularyTarget,
          kanjiCurrent: currentKanji,
          kanjiTarget: sessionKanjiTarget,
          readingCurrent: currentReading,
          readingTarget: sessionReadingTarget,
          listeningCurrent: currentListening,
          listeningTarget: sessionListeningTarget,
          totalGrammarCurrent: cumulativeGrammarActual,
          totalGrammarTarget: cumulativeGrammarTarget,
          totalVocabularyCurrent: cumulativeVocabularyActual,
          totalVocabularyTarget: cumulativeVocabularyTarget,
          totalKanjiCurrent: cumulativeKanjiActual,
          totalKanjiTarget: cumulativeKanjiTarget,
          totalReadingCurrent: cumulativeReadingActual,
          totalReadingTarget: cumulativeReadingTarget,
          totalListeningCurrent: cumulativeListeningActual,
          totalListeningTarget: cumulativeListeningTarget,
          percentCompleteCurrent: percentCurrent,
          percentCompleteActual: percentActual,
          percentCompleteTarget: percentTarget,
          mockAttempts: mockAttempts,
          isEditable: isEditable,
          enrollmentId: enrollment.id,
        })
      })
    })

    return data
  }, [course, studyProgress, enrollments, isLearner, isDepartmentHead, isApprover, currentUserId, profile])

  // Check for unsaved changes (including mock test)
  useEffect(() => {
    // Check progress inputs
    const hasProgressChanges = Object.keys(progressInputs).some((key) => {
      const current = progressInputs[key]
      const original = originalInputs[key]
      if (!original) return false
      return (
        current.grammar !== original.grammar ||
        current.vocabulary !== original.vocabulary ||
        current.kanji !== original.kanji ||
        current.reading !== original.reading ||
        current.listening !== original.listening
      )
    })

    // Check mock test inputs
    const hasMockTestChanges = Object.keys(mockTestInputs).some((key) => {
      const enrollmentId = parseInt(key)
      const current = mockTestInputs[enrollmentId]
      const original = originalMockTestInputs[enrollmentId]
      return current !== original
    })

    setHasUnsavedChanges(hasProgressChanges || hasMockTestChanges)
  }, [progressInputs, originalInputs, mockTestInputs, originalMockTestInputs])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?"
        return e.returnValue
      }
    }

    document.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      document.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  // ============ 5. Define computed values that depend on progressData ============
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>()
    progressData.forEach((item) => {
      if (item.status) {
        statuses.add(item.status)
      }
    })
    return Array.from(statuses).sort()
  }, [progressData])

  const uniqueSessions = useMemo(() => {
    const sessions = new Set<string>()
    progressData.forEach((item) => {
      if (item.session) {
        sessions.add(item.session)
      }
    })
    return Array.from(sessions).sort((a, b) => {
      const numA = parseInt(a.replace("Session ", ""))
      const numB = parseInt(b.replace("Session ", ""))
      return numA - numB
    })
  }, [progressData])

  // ============ 6. Define hasActiveFilters and other computed values ============
  const hasActiveFilters = Object.values(filters).some(
    (filterArray) => filterArray.length > 0
  )

  const hasStatusData = uniqueStatuses.length > 0
  const hasSessionData = uniqueSessions.length > 0
  const hasFilterData = hasStatusData || hasSessionData

  // ============ 7. Define functions that depend on progressData ============
  // Handle input change for editable fields
  const handleInputChange = useCallback((rowId: string, field: string, value: string) => {
    // Allow empty string for user to clear the field
    if (value === "") {
      setProgressInputs(prev => ({
        ...prev,
        [rowId]: {
          ...prev[rowId],
          [field]: 0,
        }
      }))
      return
    }

    const numValue = parseInt(value) || 0

    // Find the session to get max values
    const row = progressData.find(item => item.id === rowId)
    if (!row) return

    // Auto-clamp to target
    let maxValue = Infinity
    if (field === "grammar") maxValue = row.grammarTarget
    else if (field === "vocabulary") maxValue = row.vocabularyTarget
    else if (field === "kanji") maxValue = row.kanjiTarget
    else if (field === "reading") maxValue = row.readingTarget
    else if (field === "listening") maxValue = row.listeningTarget

    const clampedValue = Math.min(numValue, maxValue)

    setProgressInputs(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [field]: clampedValue,
      }
    }))
  }, [progressData])

  // Handle mock test input change
  const handleMockTestChange = useCallback((enrollmentId: number, value: string) => {
    const numValue = parseInt(value) || 0
    const clampedValue = Math.max(0, numValue)

    setMockTestInputs(prev => ({
      ...prev,
      [enrollmentId]: clampedValue
    }))
  }, [])

  // Handle save all progress
  const handleSaveAll = useCallback(async () => {
    setIsSavingAll(true)

    try {
      // Collect all changed rows
      const changedRows: { rowId: string; inputs: any }[] = []

      Object.keys(progressInputs).forEach((key) => {
        const current = progressInputs[key]
        const original = originalInputs[key]
        if (original) {
          const hasChanged =
            current.grammar !== original.grammar ||
            current.vocabulary !== original.vocabulary ||
            current.kanji !== original.kanji ||
            current.reading !== original.reading ||
            current.listening !== original.listening

          if (hasChanged) {
            changedRows.push({ rowId: key, inputs: current })
          }
        }
      })

      // Save each changed row
      const savePromises = changedRows.map(({ rowId, inputs }) => {
        const row = progressData.find(item => item.id === rowId)
        if (!row) return Promise.resolve()

        const sessionId = row.id.split('-')[1]
        const enrollmentId = parseInt(row.id.split('-')[0])

        const progressDataPayload = {
          enrollment_id: enrollmentId,
          self_study_session_id: parseInt(sessionId),
          kanji_count: inputs.kanji || 0,
          vocabulary_count: inputs.vocabulary || 0,
          grammar_count: inputs.grammar || 0,
          reading_minutes: inputs.reading || 0,
          listening_minutes: inputs.listening || 0,
          completion_status: "IN_PROGRESS",
        }

        // Check if all targets are met
        const allTargetsMet =
          (inputs.kanji || 0) >= row.kanjiTarget &&
          (inputs.vocabulary || 0) >= row.vocabularyTarget &&
          (inputs.grammar || 0) >= row.grammarTarget &&
          (inputs.reading || 0) >= row.readingTarget &&
          (inputs.listening || 0) >= row.listeningTarget

        if (allTargetsMet) {
          progressDataPayload.completion_status = "COMPLETED"
        }

        // Find existing progress
        const existingProgress = studyProgress?.progress?.find(
          (p: any) =>
            p.self_study_session_id === parseInt(sessionId) &&
            p.employee_id === currentUserId
        )

        if (existingProgress) {
          return update_studyProgress(
            course.id,
            existingProgress.id,
            progressDataPayload
          )
        } else {
          return add_studyProgress(course.id, progressDataPayload)
        }
      })

      // Save mock test changes
      const mockTestSavePromises = Object.keys(mockTestInputs).map(async (key) => {
        const enrollmentId = parseInt(key)
        const current = mockTestInputs[enrollmentId]
        const original = originalMockTestInputs[enrollmentId]

        if (current !== original) {
          const result = await updateMockTest(course.id, enrollmentId, current)
          if (result.success) {
            // Update original
            setOriginalMockTestInputs(prev => ({
              ...prev,
              [enrollmentId]: current
            }))
          }
          return result
        }
        return { success: true }
      })

      const allPromises = [...savePromises, ...mockTestSavePromises]
      const results = await Promise.all(allPromises)
      const allSuccess = results.every((r) => r?.success !== false)

      if (allSuccess) {
        const totalChanges = changedRows.length + mockTestSavePromises.length
        toast.success(`Successfully saved ${totalChanges} change(s)`)
        // Update original inputs to match current
        setOriginalInputs(prev => {
          const newOriginal = { ...prev }
          changedRows.forEach(({ rowId, inputs }) => {
            newOriginal[rowId] = { ...inputs }
          })
          return newOriginal
        })
        setHasUnsavedChanges(false)
        // Refresh data using the parent callback
        if (onRefreshProgress) {
          await onRefreshProgress()
        }
      } else {
        toast.error("Some changes failed to save")
      }
    } catch (error) {
      console.error("Error saving progress:", error)
      toast.error("An error occurred while saving progress")
    } finally {
      setIsSavingAll(false)
    }
  }, [progressInputs, originalInputs, progressData, studyProgress, course.id, currentUserId, update_studyProgress, add_studyProgress, mockTestInputs, originalMockTestInputs, updateMockTest, onRefreshProgress])

  // ============ 8. Keyboard shortcuts ============
  // Keyboard shortcut for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      // Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        if (hasUnsavedChanges) {
          handleSaveAll()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [hasUnsavedChanges, handleSaveAll])

  // Keyboard shortcut for clearing filters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        e.key === "Escape" &&
        !target.closest("input") &&
        !target.closest("textarea") &&
        hasActiveFilters
      ) {
        e.preventDefault()
        clearAllFilters()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [hasActiveFilters, clearAllFilters])

  // ============ 9. Filter data based on search term and filters ============
  const filteredData = useMemo(() => {
    let filtered = progressData

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((item) => {
        const memberName = (item.memberName || "").toLowerCase()
        const session = (item.session || "").toLowerCase()
        const status = (item.status || "").toLowerCase()
        const department = (item.departmentName || "").toLowerCase()
        const team = (item.teamName || "").toLowerCase()
        return (
          memberName.includes(searchLower) ||
          session.includes(searchLower) ||
          status.includes(searchLower) ||
          department.includes(searchLower) ||
          team.includes(searchLower)
        )
      })
    }

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter((item) => filters.status.includes(item.status))
    }

    // Apply session filter
    if (filters.session.length > 0) {
      filtered = filtered.filter((item) =>
        filters.session.includes(item.session)
      )
    }

    return filtered
  }, [searchTerm, progressData, filters])

  // ============ 10. Pagination calculations ============
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  const getPageNumbers = (totalPages: number, currentPage: number) => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i)
      pages.push("...")
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1)
      pages.push("...")
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push("...")
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  const hasData = filteredData.length > 0
  const hasAnyData = progressData.length > 0

  // Check if user can view this tab
  const canViewProgress = isJLPT && (isLearner || isAdmin || isApprover)

  // If not JLPT or not authorized, show empty state
  if (!canViewProgress) {
    return (
      <TabsContent value="progress" className="w-full min-w-0 pt-4">
        <Empty className="m-auto min-h-[300px] max-w-[500px] rounded-lg">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon
                icon={ChartIcon}
                strokeWidth={2}
                className="h-12 w-12 text-muted-foreground"
              />
            </EmptyMedia>
            <EmptyTitle>Progress Not Available</EmptyTitle>
            <EmptyDescription className="text-center text-pretty">
              {!isJLPT
                ? "Progress tracking is only available for JLPT self-study courses."
                : "You don't have permission to view progress for this course."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </TabsContent>
    )
  }

  if (isLoading) {
    return (
      <TabsContent value="progress" className="w-full min-w-0 pt-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner text="Loading progress data..." />
          </div>
        </div>
      </TabsContent>
    )
  }

  // Show empty state if no progress data
  if (!hasAnyData) {
    return (
      <TabsContent value="progress" className="w-full min-w-0 pt-4">
        <Empty className="m-auto min-h-[300px] max-w-[500px] rounded-lg">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon
                icon={ChartIcon}
                strokeWidth={2}
                className="h-12 w-12 text-muted-foreground"
              />
            </EmptyMedia>
            <EmptyTitle>No Progress Data</EmptyTitle>
            <EmptyDescription className="text-center text-pretty">
              {isLearner
                ? "You haven't started any sessions yet. Start your first session to track progress."
                : "No progress data available for this course yet."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </TabsContent>
    )
  }

  // Group data by enrollment ID for mock test
  const groupedByEnrollment = useMemo(() => {
    const groups: Record<number, ProgressRow[]> = {}
    paginatedData.forEach((item) => {
      if (!groups[item.enrollmentId]) {
        groups[item.enrollmentId] = []
      }
      groups[item.enrollmentId].push(item)
    })
    return groups
  }, [paginatedData])

  // ============ 11. Render ============
  return (
    <TabsContent value="progress" className="w-full min-w-0 pt-4">
      <CardHeader className="px-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h4 className="flex items-center gap-2 text-xl font-semibold">
              Progress Overview
              {isDepartmentHead && profile?.deptDat && (
                <p className="text-sm text-muted-foreground">
                  Showing progress for your department ({filteredData.length} records)
                </p>
              )}
            </h4>
            {hasUnsavedChanges && (
              <Badge variant="default" className="bg-yellow-500 text-white animate-pulse">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <InputGroup className="w-sm">
              <InputGroupInput
                ref={searchInputRef}
                placeholder="Search by member, session, dept, team..."
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

            {/* Save Changes Button */}
            {hasUnsavedChanges && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveAll}
                disabled={isSavingAll}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isSavingAll ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={SaveIcon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                    Save Changes
                    <Kbd className="ml-1 bg-blue-700 text-white">Ctrl+S</Kbd>
                  </>
                )}
              </Button>
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
                  {/* View Mode Filter */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>View Mode</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuCheckboxItem
                          checked={viewMode === VIEW_MODES.SESSION}
                          onCheckedChange={() => {
                            setViewMode(VIEW_MODES.SESSION)
                          }}
                          onSelect={(e) => e.preventDefault()}
                        >
                          Session Breakdown
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={viewMode === VIEW_MODES.OVERALL}
                          onCheckedChange={() => {
                            setViewMode(VIEW_MODES.OVERALL)
                          }}
                          onSelect={(e) => e.preventDefault()}
                        >
                          Overall Progress
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  {/* Session Filter */}
                  {hasSessionData && (
                    <>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Session</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {uniqueSessions.map((session) => (
                              <DropdownMenuCheckboxItem
                                key={session}
                                checked={filters.session.includes(session)}
                                onCheckedChange={() =>
                                  toggleFilter("session", session)
                                }
                                onSelect={(e) => e.preventDefault()}
                              >
                                {session}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    </>
                  )}

                  {/* Status Filter */}
                  {hasStatusData && (
                    <>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {uniqueStatuses.map((status) => (
                              <DropdownMenuCheckboxItem
                                key={status}
                                checked={filters.status.includes(status)}
                                onCheckedChange={() =>
                                  toggleFilter("status", status)
                                }
                                onSelect={(e) => e.preventDefault()}
                              >
                                {status}
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
        {hasData ? (
          <>
            <div className="relative overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  {/* First header row - Parent headers with colSpan */}
                  <TableRow className="bg-muted/50">
                    <BorderedTableHead
                      className="align-middle whitespace-nowrap"
                      rowSpan={2}
                    >
                      Session
                    </BorderedTableHead>
                    <BorderedTableHead
                      className="align-middle whitespace-nowrap"
                      rowSpan={2}
                    >
                      Session deadline
                    </BorderedTableHead>
                    <BorderedTableHead
                      className="w-[250px] align-middle whitespace-nowrap"
                      rowSpan={2}
                    >
                      Member Name
                    </BorderedTableHead>

                    {/* Show either Session or Overall columns based on view mode */}
                    {viewMode === VIEW_MODES.SESSION
                      ? // Session columns - individual session data
                      STUDY_COLUMNS.map((column) => (
                        <BorderedTableHead
                          key={column.key}
                          colSpan={2}
                          className="align-middle whitespace-nowrap"
                        >
                          {column.label}
                        </BorderedTableHead>
                      ))
                      : // Overall columns - cumulative totals
                      STUDY_COLUMNS.map((column) => (
                        <BorderedTableHead
                          key={`total-${column.key}`}
                          colSpan={2}
                          className="align-middle whitespace-nowrap"
                        >
                          Total {column.label}
                        </BorderedTableHead>
                      ))}

                    {/* % Complete - shows different sub-headers based on view mode */}
                    <BorderedTableHead
                      className="align-middle whitespace-nowrap"
                      colSpan={viewMode === VIEW_MODES.SESSION ? 1 : 2}
                    >
                      % Complete
                    </BorderedTableHead>

                    {/* Mock Attempts - Single column with rowSpan */}
                    <BorderedTableHead
                      className="align-middle whitespace-nowrap"
                      rowSpan={2}
                    >
                      Mock <br />
                      Test Attempts
                    </BorderedTableHead>

                    <BorderedTableHead
                      className="align-middle whitespace-nowrap"
                      rowSpan={2}
                    >
                      Status
                    </BorderedTableHead>
                  </TableRow>

                  {/* Second header row - Child headers */}
                  <TableRow className="bg-muted/30">
                    {/* Show either Session or Overall column headers based on view mode */}
                    {viewMode === VIEW_MODES.SESSION
                      ? // Session columns - Current/Target pairs
                      STUDY_COLUMNS.map((column) => (
                        <React.Fragment key={column.key}>
                          <BorderedTableHead className="align-middle font-medium whitespace-nowrap">
                            Current
                          </BorderedTableHead>
                          <BorderedTableHead className="align-middle font-medium whitespace-nowrap">
                            Target
                          </BorderedTableHead>
                        </React.Fragment>
                      ))
                      : // Overall columns - Current/Target pairs
                      STUDY_COLUMNS.map((column) => (
                        <React.Fragment key={`total-${column.key}`}>
                          <BorderedTableHead className="align-middle font-medium whitespace-nowrap">
                            Current
                          </BorderedTableHead>
                          <BorderedTableHead className="align-middle font-medium whitespace-nowrap">
                            Target
                          </BorderedTableHead>
                        </React.Fragment>
                      ))}

                    {/* % Complete sub-headers */}
                    {viewMode === VIEW_MODES.SESSION ? (
                      <BorderedTableHead className="align-middle font-medium whitespace-nowrap">
                        Current
                      </BorderedTableHead>
                    ) : (
                      <>
                        <BorderedTableHead className="align-middle font-medium whitespace-nowrap">
                          Actual
                        </BorderedTableHead>
                        <BorderedTableHead className="align-middle font-medium whitespace-nowrap">
                          Target
                        </BorderedTableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {Object.entries(groupedByEnrollment).map(([enrollmentId, rows]) => {
                    const firstRow = rows[0]
                    const isEditable = isLearner && firstRow.enrollmentId === currentUserEnrollment?.id
                    const mockValue = mockTestInputs[parseInt(enrollmentId)] ?? firstRow.mockAttempts

                    return rows.map((item, index) => {
                      const isUpcoming = item.isUpcoming
                      const isToday = item.isToday
                      const isRowEditable = item.isEditable
                      const inputs = progressInputs[item.id] || {}

                      return (
                        <TableRow
                          key={item.id}
                          className={cn(
                            "transition-colors",
                            isUpcoming && !isRowEditable && "opacity-50",
                            isToday && "bg-blue-50/50",
                            isRowEditable && "hover:bg-blue-50/30",
                            item.status === "Overdue" && "bg-red-50/20"
                          )}
                        >
                          <BorderedTableCell className="text-center">
                            {item.sessionNo}
                          </BorderedTableCell>
                          <BorderedTableCell>
                            {item.sessionDeadline}
                          </BorderedTableCell>
                          <BorderedTableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback className="text-xs">
                                  {getInitials(item.memberName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex w-full flex-col">
                                <span className="truncate text-sm font-medium">
                                  {item.memberName}
                                </span>
                                <span className="flex gap-1 truncate text-xs text-muted-foreground">
                                  <span className="max-w-[50%] truncate">
                                    {item.departmentName}
                                  </span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="max-w-[50%] truncate">
                                    {item.teamName}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </BorderedTableCell>

                          {/* Show either Session or Overall data based on view mode */}
                          {viewMode === VIEW_MODES.SESSION
                            ? // Session columns - individual session data with editable fields
                            STUDY_COLUMNS.flatMap(({ key }) => {
                              const currentKey = `${key}Current`
                              const targetKey = `${key}Target`
                              const fieldKey = key
                              const value = inputs[fieldKey] !== undefined ? inputs[fieldKey] : item[currentKey]

                              // Determine if this should be treated as "upcoming" for display purposes
                              // Only show "-" for upcoming sessions that are NOT editable
                              const showUpcomingPlaceholder = isUpcoming && !isRowEditable

                              return [
                                <BorderedTableCell
                                  key={`${key}-current`}
                                  className="text-center"
                                >
                                  {showUpcomingPlaceholder ? (
                                    "-"
                                  ) : isRowEditable ? (
                                    <EditableField
                                      value={value}
                                      onChange={(val) => handleInputChange(item.id, fieldKey, val)}
                                      disabled={isSavingAll}
                                      max={item[targetKey]}
                                    />
                                  ) : (
                                    <span className="text-sm font-medium">
                                      {item[currentKey]}
                                    </span>
                                  )}
                                </BorderedTableCell>,
                                <BorderedTableCell
                                  key={`${key}-target`}
                                  className="text-center"
                                >
                                  {item[targetKey]}
                                </BorderedTableCell>,
                              ]
                            })
                            : // Overall columns - CUMULATIVE totals (read-only)
                            STUDY_COLUMNS.flatMap(({ key }) => {
                              const totalCurrentKey = `total${key.charAt(0).toUpperCase() + key.slice(1)}Current`
                              const totalTargetKey = `total${key.charAt(0).toUpperCase() + key.slice(1)}Target`

                              return [
                                <BorderedTableCell
                                  key={`total-${key}-current`}
                                  className="text-center"
                                >
                                  {isUpcoming && !isRowEditable ? (
                                    "-"
                                  ) : (
                                    <span className="text-sm font-medium">
                                      {item[totalCurrentKey]}
                                    </span>
                                  )}
                                </BorderedTableCell>,
                                <BorderedTableCell
                                  key={`total-${key}-target`}
                                  className="text-center"
                                >
                                  {item[totalTargetKey]}
                                </BorderedTableCell>,
                              ]
                            })}

                          {/* % Complete */}
                          {viewMode === VIEW_MODES.SESSION ? (
                            <BorderedTableCell className="text-center">
                              {isUpcoming && !isRowEditable
                                ? "-"
                                : `${item.percentCompleteCurrent}%`}
                            </BorderedTableCell>
                          ) : (
                            <>
                              <BorderedTableCell className="text-center">
                                {isUpcoming && !isRowEditable
                                  ? "-"
                                  : `${item.percentCompleteActual}%`}
                              </BorderedTableCell>
                              <BorderedTableCell className="text-center">
                                {`${item.percentCompleteTarget}%`}
                              </BorderedTableCell>
                            </>
                          )}

                          {/* Mock Attempts - Single column with rowSpan */}
                          {index === 0 && (
                            <BorderedTableCell
                              className="text-center"
                              rowSpan={rows.length}
                            >
                              {isEditable ? (
                                <Input
                                  type="number"
                                  min={0}
                                  value={mockValue}
                                  onChange={(e) => handleMockTestChange(parseInt(enrollmentId), e.target.value)}
                                  className="h-8 w-20 border-gray-200 text-center text-sm"
                                  disabled={isSavingAll}
                                />
                              ) : (
                                <span className="text-sm font-medium">
                                  {mockValue}
                                </span>
                              )}
                            </BorderedTableCell>
                          )}

                          {/* Status */}
                          <BorderedTableCell>
                            <Badge className={getStatusBadgeClass(item.status)}>
                              {item.status}
                            </Badge>
                          </BorderedTableCell>
                        </TableRow>
                      )
                    })
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredData.length > 0 && (
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Field orientation="horizontal" className="w-fit">
                  <FieldLabel htmlFor="select-rows-per-page">
                    <span className="font-normal text-muted-foreground">
                      Rows per page
                    </span>
                  </FieldLabel>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-15" id="select-rows-per-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectGroup>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <div className="text-sm text-muted-foreground">
                  Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{" "}
                  {Math.min(startIndex + itemsPerPage, filteredData.length)} of{" "}
                  {filteredData.length} records
                </div>

                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }}
                        className={
                          currentPage === 1 || filteredData.length === 0
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                    {getPageNumbers(totalPages, currentPage).map(
                      (page, index) => (
                        <PaginationItem key={index}>
                          {page === "..." ? (
                            <span className="px-2">...</span>
                          ) : (
                            <PaginationLink
                              href="#"
                              isActive={currentPage === page}
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(page as number)
                              }}
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }}
                        className={
                          currentPage === totalPages ||
                            filteredData.length === 0
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          // Empty state
          <Empty className="m-auto min-h-[300px] max-w-[500px] rounded-lg">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon
                  icon={ChartIcon}
                  strokeWidth={2}
                  className="h-12 w-12 text-muted-foreground"
                />
              </EmptyMedia>
              <EmptyTitle>
                {searchTerm || hasActiveFilters
                  ? `No Matching Records for ${searchTerm}`
                  : "No Progress Data Available"}
              </EmptyTitle>
              <EmptyDescription className="text-center text-pretty">
                {searchTerm || hasActiveFilters ? (
                  <>Try adjusting your search or filters.</>
                ) : (
                  "No progress data available for this course."
                )}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {searchTerm ||
                (hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      clearAllFilters()
                    }}
                  >
                    Clear
                  </Button>
                ))}
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </TabsContent>
  )
}
