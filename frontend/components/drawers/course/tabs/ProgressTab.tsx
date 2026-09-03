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
  Search01Icon,
  FilterMailIcon,
  Delete02Icon,
  ChartIcon,
  Loading03Icon,
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

interface ProgressTabProps {
  userRole: string
  profile?: any
  courseId?: string
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

// Helper function to check if a session date is in the future
const isFutureSession = (sessionNo: number) => {
  const today = new Date()
  // Sessions 1-5 are past, sessions 6-7 are current, sessions 8-10 are future
  // This gives us a good mix for testing
  if (sessionNo <= 5) return false // Past sessions
  if (sessionNo <= 7) return false // Current sessions (today or within a few days)
  return true // Future sessions
}

// Helper function to check if a session date is today
const isTodaySession = (sessionNo: number) => {
  // For testing, let's say session 6 is today
  return sessionNo === 6
}

// Helper function to get session status based on deadline and completion
const getSessionStatus = (sessionNo: number, completionStatus: string) => {
  // For testing, we'll use the session number to determine status
  if (sessionNo <= 5) {
    const completed = Math.random() > 0.2
    return completed ? "Completed" : "In Progress"
  } else if (sessionNo <= 7) {
    return "In Progress"
  } else {
    return "Upcoming"
  }
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
  ...props
}: React.ComponentProps<typeof TableHead> & { colSpan?: number }) => (
  <TableHead
    className={cn("border-r border-l text-center", className)}
    colSpan={colSpan}
    {...props}
  >
    {children}
  </TableHead>
)

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
}

// Editable field component
const EditableField = ({
  value,
  onChange,
  disabled = false,
  isUpcoming = false,
  type = "number",
  className = "",
}: {
  value: number | string
  onChange: (value: string) => void
  disabled?: boolean
  isUpcoming?: boolean
  type?: string
  className?: string
}) => {
  const [localValue, setLocalValue] = useState(String(value))

  useEffect(() => {
    setLocalValue(String(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    onChange(newValue)
  }

  if (disabled || isUpcoming) {
    return (
      <span className={cn("text-sm", isUpcoming && "opacity-50", className)}>
        {isUpcoming ? "-" : value}
      </span>
    )
  }

  return (
    <Input
      type={type}
      value={localValue}
      onChange={handleChange}
      className={cn(
        "h-8 w-full max-w-[70px] border-gray-200 text-center text-sm",
        className
      )}
      disabled={disabled || isUpcoming}
    />
  )
}

// Generate dummy data with session status based on current date
const generateDummyProgressData = (): ProgressRow[] => {
  const employees = [
    { name: "John Smith", department: "Engineering", team: "Frontend" },
    { name: "Sarah Johnson", department: "Engineering", team: "Backend" },
    {
      name: "Michael Williams",
      department: "Product",
      team: "Product Management",
    },
    { name: "Emma Brown", department: "Design", team: "UI Design" },
    { name: "James Jones", department: "Marketing", team: "Digital Marketing" },
    { name: "Lisa Garcia", department: "Sales", team: "Enterprise Sales" },
    { name: "Robert Miller", department: "Finance", team: "Accounting" },
    { name: "Maria Davis", department: "HR", team: "Recruitment" },
    {
      name: "David Rodriguez",
      department: "Operations",
      team: "Operations Management",
    },
    { name: "Jennifer Martinez", department: "Engineering", team: "DevOps" },
  ]

  const sessions = 10
  const data: ProgressRow[] = []

  employees.forEach((employee, empIndex) => {
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
    const totalGrammarTarget = 500
    const totalVocabularyTarget = 400
    const totalKanjiTarget = 300
    const totalReadingTarget = 200
    const totalListeningTarget = 200

    for (let i = 0; i < sessions; i++) {
      const sessionNo = i + 1
      const isFuture = isFutureSession(sessionNo)
      const isToday = isTodaySession(sessionNo)

      // Generate dates with specific offsets for testing
      let sessionDate: Date
      if (sessionNo <= 5) {
        // Past sessions (1-15 days ago)
        sessionDate = new Date()
        sessionDate.setDate(sessionDate.getDate() - (20 - sessionNo * 2))
      } else if (sessionNo <= 7) {
        // Current sessions (today to 2 days ago)
        sessionDate = new Date()
        sessionDate.setDate(sessionDate.getDate() - (7 - sessionNo))
      } else {
        // Future sessions (1-10 days ahead)
        sessionDate = new Date()
        sessionDate.setDate(sessionDate.getDate() + (sessionNo - 7))
      }

      const dateStr = formatDate(sessionDate.toISOString())

      // Random progress (60-100% for past/current, 0% for future)
      let progressMultiplier = 0.6 + Math.random() * 0.4
      if (isFuture) {
        progressMultiplier = 0 // Future sessions have no progress
      }

      const sessionGrammarTarget = 50 + Math.floor(Math.random() * 30)
      const sessionVocabularyTarget = 40 + Math.floor(Math.random() * 25)
      const sessionKanjiTarget = 30 + Math.floor(Math.random() * 20)
      const sessionReadingTarget = 20 + Math.floor(Math.random() * 15)
      const sessionListeningTarget = 20 + Math.floor(Math.random() * 15)

      const currentGrammar = Math.floor(
        sessionGrammarTarget * progressMultiplier
      )
      const currentVocabulary = Math.floor(
        sessionVocabularyTarget * progressMultiplier
      )
      const currentKanji = Math.floor(sessionKanjiTarget * progressMultiplier)
      const currentReading = Math.floor(
        sessionReadingTarget * progressMultiplier
      )
      const currentListening = Math.floor(
        sessionListeningTarget * progressMultiplier
      )

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

      // Determine status
      let status
      if (isFuture) {
        status = "Upcoming"
      } else if (sessionNo <= 5) {
        const completed = Math.random() > 0.2
        status = completed ? "Completed" : "In Progress"
      } else {
        status = Math.random() > 0.3 ? "In Progress" : "Completed"
      }

      // Calculate percentages
      const overallPercentCurrent =
        sessionGrammarTarget > 0 &&
        sessionVocabularyTarget > 0 &&
        sessionKanjiTarget > 0 &&
        sessionReadingTarget > 0 &&
        sessionListeningTarget > 0
          ? Math.round(
              ((currentGrammar / sessionGrammarTarget) * 100 +
                (currentVocabulary / sessionVocabularyTarget) * 100 +
                (currentKanji / sessionKanjiTarget) * 100 +
                (currentReading / sessionReadingTarget) * 100 +
                (currentListening / sessionListeningTarget) * 100) /
                5
            )
          : 0

      const overallPercentActual =
        totalGrammarTarget > 0 &&
        totalVocabularyTarget > 0 &&
        totalKanjiTarget > 0 &&
        totalReadingTarget > 0 &&
        totalListeningTarget > 0
          ? Math.round(
              ((cumulativeGrammarActual / totalGrammarTarget) * 100 +
                (cumulativeVocabularyActual / totalVocabularyTarget) * 100 +
                (cumulativeKanjiActual / totalKanjiTarget) * 100 +
                (cumulativeReadingActual / totalReadingTarget) * 100 +
                (cumulativeListeningActual / totalListeningTarget) * 100) /
                5
            )
          : 0

      const overallPercentTarget =
        totalGrammarTarget > 0 &&
        totalVocabularyTarget > 0 &&
        totalKanjiTarget > 0 &&
        totalReadingTarget > 0 &&
        totalListeningTarget > 0
          ? Math.round(
              ((cumulativeGrammarTarget / totalGrammarTarget) * 100 +
                (cumulativeVocabularyTarget / totalVocabularyTarget) * 100 +
                (cumulativeKanjiTarget / totalKanjiTarget) * 100 +
                (cumulativeReadingTarget / totalReadingTarget) * 100 +
                (cumulativeListeningTarget / totalListeningTarget) * 100) /
                5
            )
          : 0

      // Mock attempts (only for past and current sessions)
      const mockAttempts =
        !isFuture && i >= 3 ? Math.floor(Math.random() * 5) + 1 : 0

      data.push({
        id: `${empIndex}-${i}`,
        session: `Session ${sessionNo}`,
        sessionNo: sessionNo,
        sessionDeadline: dateStr || `Day ${sessionNo}`,
        memberName: employee.name,
        departmentName: employee.department,
        teamName: employee.team,
        status: status,
        isUpcoming: isFuture,
        isToday: isToday,
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
        percentCompleteCurrent: overallPercentCurrent,
        percentCompleteActual: overallPercentActual,
        percentCompleteTarget: overallPercentTarget,
        mockAttempts: mockAttempts,
      })
    }
  })

  return data
}

export function ProgressTab({ userRole, profile, courseId }: ProgressTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [isLoading, setIsLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // For testing: toggle between learner and admin roles
  const [testRole, setTestRole] = useState<string>(userRole || "learner")
  const isLearner = testRole === "learner"
  const isAdmin = testRole === "admin"

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES.SESSION)

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    viewMode: [],
    session: [],
  })

  // Generate dummy data
  const reportData = useMemo(() => generateDummyProgressData(), [])

  // Get unique status values from report data
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>()
    reportData.forEach((item) => {
      if (item.status) {
        statuses.add(item.status)
      }
    })
    return Array.from(statuses).sort()
  }, [reportData])

  // Get unique session values from report data
  const uniqueSessions = useMemo(() => {
    const sessions = new Set<string>()
    reportData.forEach((item) => {
      if (item.session) {
        sessions.add(item.session)
      }
    })
    return Array.from(sessions).sort((a, b) => {
      const numA = parseInt(a.replace("Session ", ""))
      const numB = parseInt(b.replace("Session ", ""))
      return numA - numB
    })
  }, [reportData])

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    (filterArray) => filterArray.length > 0
  )

  const hasStatusData = uniqueStatuses.length > 0
  const hasSessionData = uniqueSessions.length > 0
  const hasFilterData = hasStatusData || hasSessionData

  // Filter data based on search term and filters
  const filteredData = useMemo(() => {
    let filtered = reportData

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
  }, [searchTerm, reportData, filters])

  // Helper to toggle filter values
  const toggleFilter = (field: keyof FilterState, value: string) => {
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
      status: [],
      viewMode: [],
      session: [],
    })
  }

  // Handle field value change
  const handleFieldChange = (itemId: string, field: string, value: string) => {
    // In a real implementation, this would update the data
    console.log(`Updated ${field} for ${itemId} to ${value}`)
  }

  // Keyboard shortcut for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

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
  }, [hasActiveFilters])

  // Pagination calculations
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
  const hasAnyData = reportData.length > 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner text="Loading progress data..." />
        </div>
      </div>
    )
  }

  return (
    <TabsContent value="progress" className="w-full min-w-0 pt-4">
      <CardHeader className="px-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="flex items-center gap-2 text-xl font-semibold">
              Progress Overview
            </h4>
          </div>
          <div className="flex items-center gap-2">
            {/* Role Toggle for Testing */}
            <div className="flex items-center gap-2 rounded-md border p-1">
              <Button
                variant={isLearner ? "default" : "ghost"}
                size="sm"
                onClick={() => setTestRole("learner")}
                className="h-7 px-3 text-xs"
              >
                Learner
              </Button>
              <Button
                variant={isAdmin ? "default" : "ghost"}
                size="sm"
                onClick={() => setTestRole("admin")}
                className="h-7 px-3 text-xs"
              >
                Admin
              </Button>
            </div>

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

                    {/* Mock Attempts - Single column now */}
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
                  {paginatedData.map((item) => {
                    const isUpcoming = item.isUpcoming
                    const isToday = item.isToday

                    return (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "transition-colors",
                          isUpcoming && "opacity-50",
                          isToday && "bg-blue-50"
                        )}
                      >
                        <BorderedTableCell className="text-center">
                          {item.session}
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
                          ? // Session columns - individual session data
                            STUDY_COLUMNS.flatMap(({ key }) => {
                              const currentKey = `${key}Current`
                              const targetKey = `${key}Target`
                              return [
                                <BorderedTableCell
                                  key={`${key}-current`}
                                  className="text-center"
                                >
                                  {isUpcoming ? (
                                    "-"
                                  ) : (
                                    <EditableField
                                      value={item[currentKey]}
                                      onChange={(val) =>
                                        handleFieldChange(
                                          item.id,
                                          `${key}Current`,
                                          val
                                        )
                                      }
                                      disabled={!isLearner}
                                      isUpcoming={isUpcoming}
                                    />
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
                          : // Overall columns - CUMULATIVE totals
                            STUDY_COLUMNS.flatMap(({ key }) => {
                              const totalCurrentKey = `total${key.charAt(0).toUpperCase() + key.slice(1)}Current`
                              const totalTargetKey = `total${key.charAt(0).toUpperCase() + key.slice(1)}Target`
                              return [
                                <BorderedTableCell
                                  key={`total-${key}-current`}
                                  className="text-center"
                                >
                                  {isUpcoming ? (
                                    "-"
                                  ) : (
                                    <span className="text-sm">
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
                            {isUpcoming
                              ? "-"
                              : `${item.percentCompleteCurrent}%`}
                          </BorderedTableCell>
                        ) : (
                          <>
                            <BorderedTableCell className="text-center">
                              {isUpcoming
                                ? "-"
                                : `${item.percentCompleteActual}%`}
                            </BorderedTableCell>
                            <BorderedTableCell className="text-center">
                              {`${item.percentCompleteTarget}%`}
                            </BorderedTableCell>
                          </>
                        )}

                        {/* Mock Attempts - Single column */}
                        <BorderedTableCell className="text-center">
                          {!isUpcoming && item.mockAttempts > 0
                            ? item.mockAttempts
                            : "-"}
                        </BorderedTableCell>

                        <BorderedTableCell>
                          <Badge className={getStatusBadgeClass(item.status)}>
                            {item.status}
                          </Badge>
                        </BorderedTableCell>
                      </TableRow>
                    )
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
