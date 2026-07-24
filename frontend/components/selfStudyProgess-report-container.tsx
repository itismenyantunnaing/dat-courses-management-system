"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Loading03Icon,
  Clock01Icon,
  GraduationCapIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ViewIcon,
  EyeOffIcon,
} from "@hugeicons/core-free-icons"
import React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { mainStore } from "@/store/mainStore"
import { Course } from "@/types/course"
import { Label } from "@/components/ui/label"

const STROKE_WIDTH = 2

// Column configuration - Single source of truth
const STUDY_COLUMNS = [
  { key: 'grammar', label: 'Grammar Count' },
  { key: 'vocabulary', label: 'Vocabulary Count' },
  { key: 'kanji', label: 'Kanji Count' },
  { key: 'reading', label: 'Reading (min)' },
  { key: 'listening', label: 'Listening (min)' }
];

// View modes
const VIEW_MODES = {
  SESSION: 'session',           // Session Breakdown - each session's numbers
  OVERALL: 'overall'            // Overall Progress - cumulative totals
} as const;

type ViewMode = typeof VIEW_MODES[keyof typeof VIEW_MODES];

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
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return '';
  }
}

// Helper function to get session status based on deadline and completion
const getSessionStatus = (deadline: string, completionStatus: string) => {
  if (!deadline) return { label: 'Unknown', variant: 'outline' };

  const now = new Date();
  const deadlineDate = new Date(deadline);

  // If completed
  if (completionStatus === 'COMPLETED') {
    return { label: 'Completed', variant: 'success' };
  }

  // If in progress
  if (completionStatus === 'IN_PROGRESS') {
    return { label: 'In Progress', variant: 'warning' };
  }

  // Check if overdue (deadline is in the past)
  if (deadlineDate < now) {
    return { label: 'Overdue', variant: 'destructive' };
  }

  // Any deadline in the future → Upcoming
  return { label: 'Upcoming', variant: 'default' };
}

// Status badge styling
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'Completed':
      return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950 border-green-200";
    case 'In Progress':
      return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 border-blue-200";
    case 'Overdue':
      return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 border-red-200";
    case 'Upcoming':
      return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-950 border-yellow-200";
    case 'Active':
      return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-950 border-gray-200";
    default:
      return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-950";
  }
}

// Bordered table cell
const BorderedTableCell = ({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof TableCell>) => (
  <TableCell
    className={cn("border-r border-l", className)}
    {...props}
  >
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

interface ProgressReportRow {
  id: string
  sr: number
  section: string
  memberName: string
  jlptLevel: string
  certified: string
  examTarget: string
  status: string
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
}

export default function SelfStudyProgressReportContainer() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [reportData, setReportData] = useState<ProgressReportRow[]>([])
  const [filteredData, setFilteredData] = useState<ProgressReportRow[]>([])
  const hasLoadedRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // View mode filter - only one at a time
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES.SESSION)

  const { courses, fetchAll_CourseData, fetch_studyProgress, studyProgress, fetchEmployeeTargetLevel } = mainStore()

  // Load courses on mount
  useEffect(() => {
    const loadCourses = async () => {
      if (hasLoadedRef.current) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        await fetchAll_CourseData()
        hasLoadedRef.current = true
      } catch (error) {
        console.error("Error loading courses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCourses()
  }, [fetchAll_CourseData])

  // Filter self-study courses
  const selfStudyCourses = useMemo(() => {
    return courses.filter((course: Course) => {
      const hasSelfStudySessions = course.self_study_sessions && course.self_study_sessions.length > 0
      const isSelfStudy = course.courseType === 'self-study' || course.selfStudyType === 'jlpt' || course.selfStudyType === 'other'
      return hasSelfStudySessions && isSelfStudy
    })
  }, [courses])

  // Set default selected course when courses load
  useEffect(() => {
    if (selfStudyCourses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(selfStudyCourses[0].id)
    }
  }, [selfStudyCourses, selectedCourseId])

  console.log(studyProgress)
  

  // Fetch progress data when course is selected
  useEffect(() => {
    const loadProgress = async () => {
      if (!selectedCourseId) return

      setIsLoading(true)
      try {
        await fetch_studyProgress(selectedCourseId)
      } catch (error) {
        console.error("Error loading progress:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (selectedCourseId) {
      loadProgress()
    }
  }, [selectedCourseId, fetch_studyProgress])

  // Transform progress data into report rows
  useEffect(() => {
    let progressArray = [];

    if (studyProgress) {
      if (studyProgress.progress && Array.isArray(studyProgress.progress)) {
        progressArray = studyProgress.progress;
      } else if (Array.isArray(studyProgress)) {
        progressArray = studyProgress;
      } else if (studyProgress.data && Array.isArray(studyProgress.data)) {
        progressArray = studyProgress.data;
      } else if (typeof studyProgress === 'object') {
        const values = Object.values(studyProgress);
        if (values.length > 0 && values.some(v => typeof v === 'object' && v !== null && (v.employee_id || v.employee_name))) {
          progressArray = values;
        }
      }
    }

    if (progressArray.length === 0) {
      setReportData([]);
      setFilteredData([]);
      return;
    }

    const selectedCourse = selfStudyCourses.find((c: Course) => c.id === selectedCourseId);
    const sessions = selectedCourse?.self_study_sessions || [];

    // Calculate total targets for the entire course
    const totalGrammarTarget = sessions.reduce((sum: number, s: any) => sum + (s.grammarCount || s.grammar_target || 0), 0);
    const totalVocabularyTarget = sessions.reduce((sum: number, s: any) => sum + (s.vocabularyCount || s.vocabulary_target || 0), 0);
    const totalKanjiTarget = sessions.reduce((sum: number, s: any) => sum + (s.kanjiCount || s.kanji_target || 0), 0);
    const totalReadingTarget = sessions.reduce((sum: number, s: any) => sum + (s.readingMinutes || s.reading_target_minutes || 0), 0);
    const totalListeningTarget = sessions.reduce((sum: number, s: any) => sum + (s.listeningMinutes || s.listening_target_minutes || 0), 0);

    // Group progress by employee
    const groupedByEmployee = new Map();

    progressArray.forEach((progress: any) => {
      const employeeKey = progress.employee_id || progress.employeeId || progress.memberId;

      if (!groupedByEmployee.has(employeeKey)) {
        groupedByEmployee.set(employeeKey, {
          employee_id: employeeKey,
          employee_name: progress.employee_name || progress.employeeName || progress.memberName || 'Unknown',
          progressEntries: []
        });
      }

      groupedByEmployee.get(employeeKey).progressEntries.push(progress);
    });

    // Sort each employee's progress entries by session number
    groupedByEmployee.forEach((employee: any) => {
      employee.progressEntries.sort((a: any, b: any) => (a.session_no || 0) - (b.session_no || 0));
    });

    // Create rows
    const rows: ProgressReportRow[] = [];

    groupedByEmployee.forEach((employee: any) => {
      // Initialize cumulative totals
      let cumulativeGrammarActual = 0;
      let cumulativeVocabularyActual = 0;
      let cumulativeKanjiActual = 0;
      let cumulativeReadingActual = 0;
      let cumulativeListeningActual = 0;

      let cumulativeGrammarTarget = 0;
      let cumulativeVocabularyTarget = 0;
      let cumulativeKanjiTarget = 0;
      let cumulativeReadingTarget = 0;
      let cumulativeListeningTarget = 0;

      employee.progressEntries.forEach((progress: any, index: number) => {
        const sessionNo = progress.session_no || index + 1;
        const sessionDate = progress.session_deadline || progress.session_date || '';

        // Find matching session for individual targets
        const matchingSession = sessions.find((s: any) => {
          const sessionId = s.id?.toString();
          const progressSessionId = progress.self_study_session_id?.toString();
          return sessionId === progressSessionId || s.session_no === progress.session_no;
        });

        // Get individual session targets
        const sessionGrammarTarget = matchingSession?.grammarCount || matchingSession?.grammar_target || 0;
        const sessionVocabularyTarget = matchingSession?.vocabularyCount || matchingSession?.vocabulary_target || 0;
        const sessionKanjiTarget = matchingSession?.kanjiCount || matchingSession?.kanji_target || 0;
        const sessionReadingTarget = matchingSession?.readingMinutes || matchingSession?.reading_target_minutes || 0;
        const sessionListeningTarget = matchingSession?.listeningMinutes || matchingSession?.listening_target_minutes || 0;

        // Current values - individual session progress
        const currentGrammar = progress.grammar_count || 0;
        const currentVocabulary = progress.vocabulary_count || 0;
        const currentKanji = progress.kanji_count || 0;
        const currentReading = progress.reading_minutes || 0;
        const currentListening = progress.listening_minutes || 0;

        // Update cumulative totals
        cumulativeGrammarActual += currentGrammar;
        cumulativeVocabularyActual += currentVocabulary;
        cumulativeKanjiActual += currentKanji;
        cumulativeReadingActual += currentReading;
        cumulativeListeningActual += currentListening;

        cumulativeGrammarTarget += sessionGrammarTarget;
        cumulativeVocabularyTarget += sessionVocabularyTarget;
        cumulativeKanjiTarget += sessionKanjiTarget;
        cumulativeReadingTarget += sessionReadingTarget;
        cumulativeListeningTarget += sessionListeningTarget;

        // Calculate % Complete Actual (cumulative actual / total target)
        const grammarPercentActual = totalGrammarTarget > 0 ? Math.round((cumulativeGrammarActual / totalGrammarTarget) * 100) : 0;
        const vocabularyPercentActual = totalVocabularyTarget > 0 ? Math.round((cumulativeVocabularyActual / totalVocabularyTarget) * 100) : 0;
        const kanjiPercentActual = totalKanjiTarget > 0 ? Math.round((cumulativeKanjiActual / totalKanjiTarget) * 100) : 0;
        const readingPercentActual = totalReadingTarget > 0 ? Math.round((cumulativeReadingActual / totalReadingTarget) * 100) : 0;
        const listeningPercentActual = totalListeningTarget > 0 ? Math.round((cumulativeListeningActual / totalListeningTarget) * 100) : 0;

        // Calculate % Complete Target (cumulative target / total target)
        const grammarPercentTarget = totalGrammarTarget > 0 ? Math.round((cumulativeGrammarTarget / totalGrammarTarget) * 100) : 0;
        const vocabularyPercentTarget = totalVocabularyTarget > 0 ? Math.round((cumulativeVocabularyTarget / totalVocabularyTarget) * 100) : 0;
        const kanjiPercentTarget = totalKanjiTarget > 0 ? Math.round((cumulativeKanjiTarget / totalKanjiTarget) * 100) : 0;
        const readingPercentTarget = totalReadingTarget > 0 ? Math.round((cumulativeReadingTarget / totalReadingTarget) * 100) : 0;
        const listeningPercentTarget = totalListeningTarget > 0 ? Math.round((cumulativeListeningTarget / totalListeningTarget) * 100) : 0;

        // Calculate % Complete Progress (cumulative actual / cumulative target)
        const grammarPercentProgress = cumulativeGrammarTarget > 0 ? Math.round((cumulativeGrammarActual / cumulativeGrammarTarget) * 100) : 0;
        const vocabularyPercentProgress = cumulativeVocabularyTarget > 0 ? Math.round((cumulativeVocabularyActual / cumulativeVocabularyTarget) * 100) : 0;
        const kanjiPercentProgress = cumulativeKanjiTarget > 0 ? Math.round((cumulativeKanjiActual / cumulativeKanjiTarget) * 100) : 0;
        const readingPercentProgress = cumulativeReadingTarget > 0 ? Math.round((cumulativeReadingActual / cumulativeReadingTarget) * 100) : 0;
        const listeningPercentProgress = cumulativeListeningTarget > 0 ? Math.round((cumulativeListeningActual / cumulativeListeningTarget) * 100) : 0;

        // Overall percentages (average of all 5 categories)
        const overallPercentActual = Math.round((grammarPercentActual + vocabularyPercentActual + kanjiPercentActual + readingPercentActual + listeningPercentActual) / 5);
        const overallPercentTarget = Math.round((grammarPercentTarget + vocabularyPercentTarget + kanjiPercentTarget + readingPercentTarget + listeningPercentTarget) / 5);

        // Calculate Current (individual session completion)
        const grammarCurrentPercent = sessionGrammarTarget > 0 ? Math.round((currentGrammar / sessionGrammarTarget) * 100) : 0;
        const vocabularyCurrentPercent = sessionVocabularyTarget > 0 ? Math.round((currentVocabulary / sessionVocabularyTarget) * 100) : 0;
        const kanjiCurrentPercent = sessionKanjiTarget > 0 ? Math.round((currentKanji / sessionKanjiTarget) * 100) : 0;
        const readingCurrentPercent = sessionReadingTarget > 0 ? Math.round((currentReading / sessionReadingTarget) * 100) : 0;
        const listeningCurrentPercent = sessionListeningTarget > 0 ? Math.round((currentListening / sessionListeningTarget) * 100) : 0;

        const overallPercentCurrent = Math.round((grammarCurrentPercent + vocabularyCurrentPercent + kanjiCurrentPercent + readingCurrentPercent + listeningCurrentPercent) / 5);

        // Get session status
        const statusInfo = getSessionStatus(sessionDate, progress.completion_status);

        // Format section with date
        const formattedDate = formatDate(sessionDate);
        const sectionDisplay = formattedDate
          ? `Section ${sessionNo} (${formattedDate})`
          : `Section ${sessionNo}`;

        rows.push({
          id: progress.id || `row-${rows.length}`,
          sr: rows.length + 1,
          section: sectionDisplay,
          memberName: employee.employee_name,
          jlptLevel: '',
          certified: 'No',
          examTarget: '',
          status: statusInfo.label,
          // Current session values - INDIVIDUAL session progress
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
          // CUMULATIVE TOTALS - for the "Total" columns
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
          // % Complete
          percentCompleteCurrent: overallPercentCurrent,
          percentCompleteActual: overallPercentActual,
          percentCompleteTarget: overallPercentTarget,
        });
      });
    });

    setReportData(rows);
    setFilteredData(rows);
    setCurrentPage(1);
  }, [studyProgress, selectedCourseId, selfStudyCourses]);

  // Filter data based on search term
  useEffect(() => {
    if (!reportData.length) return

    let filtered = reportData

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = reportData.filter((item) => {
        const memberName = (item.memberName || "").toLowerCase()
        const section = (item.section || "").toLowerCase()
        const status = (item.status || "").toLowerCase()
        return memberName.includes(searchLower) ||
          section.includes(searchLower) ||
          status.includes(searchLower)
      })
    }

    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, reportData])

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

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

  // Calculate total columns dynamically based on view mode
  const getTotalColumns = () => {
    const baseColumns = 4 + 2 + 1 // Sr, Section, Member Name, JLPT Level (2), Status
    const percentColumns = viewMode === VIEW_MODES.SESSION ? 1 : 2 // Session: 1 (Current), Overall: 2 (Actual + Target)
    const dataColumns = STUDY_COLUMNS.length * 2 // Each column has Current + Target
    return baseColumns + dataColumns + percentColumns
  }

  const totalColumns = getTotalColumns()

  const handleCourseChange = (value: string) => {
    setSelectedCourseId(value)
    setCurrentPage(1)
    setSearchTerm("")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner text="Loading study progress data..." />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pt-4 pb-6">
      <CardContent className="px-0">
        {/* Header with Title, Search and Course Filter */}
        <div className="mb-6 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <HugeiconsIcon
                icon={GraduationCapIcon}
                strokeWidth={2}
                className="h-5 w-5 text-primary"
              />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Self-Study Progress Report
              </h2>
              <p className="text-sm text-muted-foreground">
                Track study progress across all members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Filter - Select */}
            <div className="flex items-center gap-2">
              <Label htmlFor="view-mode" className="text-sm whitespace-nowrap">
                View:
              </Label>
              <Select
                value={viewMode}
                onValueChange={(value) => setViewMode(value as ViewMode)}
              >
                <SelectTrigger className="w-[200px]" id="view-mode">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={VIEW_MODES.SESSION}>
                      📊 Session Breakdown
                    </SelectItem>
                    <SelectItem value={VIEW_MODES.OVERALL}>
                      📈 Overall Progress
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Select value={selectedCourseId} onValueChange={handleCourseChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {selfStudyCourses.map((course: Course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <InputGroup className="w-full sm:w-80">
              <InputGroupInput
                ref={searchInputRef}
                placeholder="Search by member, section, or status..."
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
          </div>
        </div>

        {/* Table with nested headers */}
        <div className="relative mx-4 overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              {/* First header row - Parent headers with colSpan */}
              <TableRow className="bg-muted/50">
                <BorderedTableHead className="align-middle whitespace-nowrap" rowSpan={2}>
                  Sr.
                </BorderedTableHead>
                <BorderedTableHead className="align-middle whitespace-nowrap" rowSpan={2}>
                  Section
                </BorderedTableHead>
                <BorderedTableHead className="align-middle whitespace-nowrap" rowSpan={2}>
                  Member Name
                </BorderedTableHead>
                <BorderedTableHead colSpan={2} className="align-middle whitespace-nowrap">
                  JLPT Level
                </BorderedTableHead>

                {/* Show either Session or Overall columns based on view mode */}
                {viewMode === VIEW_MODES.SESSION ? (
                  // Session columns - individual session data
                  STUDY_COLUMNS.map((column) => (
                    <BorderedTableHead
                      key={column.key}
                      colSpan={2}
                      className="align-middle whitespace-nowrap"
                    >
                      {column.label}
                    </BorderedTableHead>
                  ))
                ) : (
                  // Overall columns - cumulative totals
                  STUDY_COLUMNS.map((column) => (
                    <BorderedTableHead
                      key={`total-${column.key}`}
                      colSpan={2}
                      className="align-middle whitespace-nowrap"
                    >
                      Total {column.label}
                    </BorderedTableHead>
                  ))
                )}

                {/* % Complete - shows different sub-headers based on view mode */}
                <BorderedTableHead
                  className="align-middle whitespace-nowrap"
                  colSpan={viewMode === VIEW_MODES.SESSION ? 1 : 2}
                >
                  % Complete
                </BorderedTableHead>
                <BorderedTableHead className="align-middle whitespace-nowrap" rowSpan={2}>
                  Status
                </BorderedTableHead>
              </TableRow>

              {/* Second header row - Child headers */}
              <TableRow className="bg-muted/30">
                <BorderedTableHead className="align-middle whitespace-nowrap font-medium">
                  Certified
                </BorderedTableHead>
                <BorderedTableHead className="align-middle whitespace-nowrap font-medium">
                  Exam Target
                </BorderedTableHead>

                {/* Show either Session or Overall column headers based on view mode */}
                {viewMode === VIEW_MODES.SESSION ? (
                  // Session columns - Current/Target pairs
                  STUDY_COLUMNS.map((column) => (
                    <React.Fragment key={column.key}>
                      <BorderedTableHead className="align-middle whitespace-nowrap font-medium">
                        Current
                      </BorderedTableHead>
                      <BorderedTableHead className="align-middle whitespace-nowrap font-medium">
                        Target
                      </BorderedTableHead>
                    </React.Fragment>
                  ))
                ) : (
                  // Overall columns - Current/Target pairs
                  STUDY_COLUMNS.map((column) => (
                    <React.Fragment key={`total-${column.key}`}>
                      <BorderedTableHead className="align-middle whitespace-nowrap font-medium">
                        Current
                      </BorderedTableHead>
                      <BorderedTableHead className="align-middle whitespace-nowrap font-medium">
                        Target
                      </BorderedTableHead>
                    </React.Fragment>
                  ))
                )}

                {/* % Complete sub-headers - changes based on view mode */}
                {viewMode === VIEW_MODES.SESSION ? (
                  // Session view: Only show "Current"
                  <BorderedTableHead className="align-middle whitespace-nowrap font-medium">
                    Current
                  </BorderedTableHead>
                ) : (
                  // Overall view: Show "Actual" and "Target"
                  <>
                    <BorderedTableHead className="align-middle whitespace-nowrap font-medium">
                      Actual
                    </BorderedTableHead>
                    <BorderedTableHead className="align-middle whitespace-nowrap font-medium">
                      Target
                    </BorderedTableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <BorderedTableCell
                    colSpan={totalColumns}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {selfStudyCourses.length === 0 ? (
                      "No self-study courses available"
                    ) : searchTerm ? (
                      <>No results found matching "{searchTerm}"</>
                    ) : (
                      "No study progress data available"
                    )}
                  </BorderedTableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => {
                  const isUpcoming = item.status === 'Upcoming';
                  
                  return (
                    <TableRow
                      key={item.id}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <BorderedTableCell className="text-center">
                        {item.sr}
                      </BorderedTableCell>
                      <BorderedTableCell>
                        <Badge variant="outline" className="font-normal">
                          {item.section}
                        </Badge>
                      </BorderedTableCell>
                      <BorderedTableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-primary">
                              {getInitials(item.memberName)}
                            </AvatarFallback>
                          </Avatar>
                          {item.memberName}
                        </div>
                      </BorderedTableCell>
                      <BorderedTableCell>
                        <Badge variant="secondary" className="font-mono">
                          {item.jlptLevel || '-'}
                        </Badge>
                      </BorderedTableCell>
                      <BorderedTableCell>
                        {item.examTarget || '-'}
                      </BorderedTableCell>

                      {/* Show either Session or Overall data based on view mode */}
                      {viewMode === VIEW_MODES.SESSION ? (
                        // Session columns - individual session data
                        STUDY_COLUMNS.flatMap(({ key }) => {
                          const currentKey = `${key}Current`;
                          const targetKey = `${key}Target`;
                          return [
                            <BorderedTableCell key={`${key}-current`} className="text-center">
                              {isUpcoming ? '-' : item[currentKey]}
                            </BorderedTableCell>,
                            <BorderedTableCell key={`${key}-target`} className="text-center">
                              {item[targetKey]}
                            </BorderedTableCell>
                          ];
                        })
                      ) : (
                        // Overall columns - CUMULATIVE totals
                        STUDY_COLUMNS.flatMap(({ key }) => {
                          const totalCurrentKey = `total${key.charAt(0).toUpperCase() + key.slice(1)}Current`;
                          const totalTargetKey = `total${key.charAt(0).toUpperCase() + key.slice(1)}Target`;
                          return [
                            <BorderedTableCell key={`total-${key}-current`} className="text-center font-semibold text-primary">
                              {isUpcoming ? '-' : item[totalCurrentKey]}
                            </BorderedTableCell>,
                            <BorderedTableCell key={`total-${key}-target`} className="text-center font-semibold text-primary">
                              {item[totalTargetKey]}
                            </BorderedTableCell>
                          ];
                        })
                      )}

                      {/* % Complete - changes based on view mode */}
                      {viewMode === VIEW_MODES.SESSION ? (
                        // Session view: Only show "Current"
                        <BorderedTableCell className="text-center">
                          {isUpcoming ? '-' : `${item.percentCompleteCurrent}%`}
                        </BorderedTableCell>
                      ) : (
                        // Overall view: Show "Actual" and "Target"
                        <>
                          <BorderedTableCell>
                            {isUpcoming ? (
                              '-'
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 min-w-[40px] rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{
                                      width: `${Math.min(item.percentCompleteActual, 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-medium tabular-nums">
                                  {item.percentCompleteActual}%
                                </span>
                              </div>
                            )}
                          </BorderedTableCell>
                          <BorderedTableCell className="text-center">
                            {`${item.percentCompleteTarget}%`}
                          </BorderedTableCell>
                        </>
                      )}
                      <BorderedTableCell>
                        <Badge className={getStatusBadgeClass(item.status)}>
                          {item.status}
                        </Badge>
                      </BorderedTableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="mt-4 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
            <Field orientation="horizontal" className="w-fit">
              <FieldLabel htmlFor="select-rows-per-page">
                Rows per page
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
                {getPageNumbers(totalPages, currentPage).map((page, index) => (
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
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }}
                    className={
                      currentPage === totalPages || filteredData.length === 0
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </div>
  )
}