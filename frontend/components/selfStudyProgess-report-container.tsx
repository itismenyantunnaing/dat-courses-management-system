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
} from "@hugeicons/core-free-icons"
import React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { mainStore } from "@/store/mainStore"
import { Course } from "@/types/course"

const STROKE_WIDTH = 2

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

// Progress Report Data interface
interface ProgressReportRow {
  id: string
  sr: number
  section: string
  memberName: string
  jlptLevel: string
  certified: string
  examTarget: string
  status: string
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
  percentCompleteCurrent: number
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

  const { courses, fetchAll_CourseData, fetch_studyProgress, studyProgress, fetch_courseEnrollments, enrollments } = mainStore()

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

  console.log(enrollments)

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

    // Calculate total targets from sessions (these are the course totals)
    const totalGrammarTarget = sessions.reduce((sum: number, s: any) => sum + (s.grammarCount || s.grammar_target || 0), 0);
    const totalVocabularyTarget = sessions.reduce((sum: number, s: any) => sum + (s.vocabularyCount || s.vocabulary_target || 0), 0);
    const totalKanjiTarget = sessions.reduce((sum: number, s: any) => sum + (s.kanjiCount || s.kanji_target || 0), 0);
    const totalReadingTarget = sessions.reduce((sum: number, s: any) => sum + (s.readingMinutes || s.reading_target_minutes || 0), 0);
    const totalListeningTarget = sessions.reduce((sum: number, s: any) => sum + (s.listeningMinutes || s.listening_target_minutes || 0), 0);

    // Create a row for EACH session progress entry (no grouping by employee)
    const rows: ProgressReportRow[] = progressArray.map((progress: any, index: number) => {
      const memberName = progress.employee_name || progress.employeeName || progress.memberName || 'Unknown';
      const sessionNo = progress.session_no || index + 1;
      const sessionDate = progress.session_deadline || progress.session_date || '';

      // Determine completion status
      const isCompleted = progress.completion_status === 'COMPLETED';
      const isInProgress = progress.completion_status === 'IN_PROGRESS';
      const percentComplete = isCompleted ? 100 : isInProgress ? 50 : 0;

      // Get session status based on deadline and completion
      const statusInfo = getSessionStatus(sessionDate, progress.completion_status);

      // Format section with date
      const formattedDate = formatDate(sessionDate);
      const sectionDisplay = formattedDate
        ? `Section ${sessionNo} (${formattedDate})`
        : `Section ${sessionNo}`;

      return {
        id: progress.id || `row-${index}`,
        sr: index + 1,
        section: sectionDisplay,
        memberName: memberName,
        jlptLevel: '', // Leave empty as requested
        certified: 'No',
        examTarget: '',
        status: statusInfo.label,
        grammarCurrent: progress.grammar_count || 0,
        grammarTarget: totalGrammarTarget,
        vocabularyCurrent: progress.vocabulary_count || 0,
        vocabularyTarget: totalVocabularyTarget,
        kanjiCurrent: progress.kanji_count || 0,
        kanjiTarget: totalKanjiTarget,
        readingCurrent: progress.reading_minutes || 0,
        readingTarget: totalReadingTarget,
        listeningCurrent: progress.listening_minutes || 0,
        listeningTarget: totalListeningTarget,
        percentCompleteCurrent: percentComplete,
        percentCompleteTarget: 100,
      };
    });

    console.log('✅ Generated rows (all sessions):', rows.length);
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

  // Total columns: 4 (Sr, Section, Member Name, Status) + 2 (JLPT Level) + 6*2 = 18
  const totalColumns = 18

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

          <div className="flex items-center gap-2">
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
                <BorderedTableHead className="align-middle whitespace-nowrap " rowSpan={2}>
                  Section
                </BorderedTableHead>
                <BorderedTableHead className="align-middle whitespace-nowrap " rowSpan={2}>
                  Member Name
                </BorderedTableHead>
                <BorderedTableHead colSpan={2} className="align-middle whitespace-nowrap ">
                  JLPT Level
                </BorderedTableHead>

                {[
                  'Grammar Count',
                  'Vocabulary Count',
                  'Kanji Count',
                  'Reading (min)',
                  'Listening (min)',
                  '% Complete'
                ].map((column) => (
                  <BorderedTableHead key={column} colSpan={2} className="align-middle whitespace-nowrap ">
                    {column}
                  </BorderedTableHead>
                ))}
                <BorderedTableHead className="align-middle whitespace-nowrap " rowSpan={2}>
                  Status
                </BorderedTableHead>
              </TableRow>

              {/* Second header row - Child headers */}
              <TableRow className="bg-muted/30">
                <BorderedTableHead className="align-middle whitespace-nowrap  font-medium">
                  Certified
                </BorderedTableHead>
                <BorderedTableHead className="align-middle whitespace-nowrap  font-medium">
                  Exam Target
                </BorderedTableHead>

                {[
                  'Grammar Count',
                  'Vocabulary Count',
                  'Kanji Count',
                  'Reading (min)',
                  'Listening (min)',
                  '% Complete'
                ].map((column) => (
                  <React.Fragment key={column}>
                    <BorderedTableHead className="align-middle whitespace-nowrap  font-medium">
                      Current
                    </BorderedTableHead>
                    <BorderedTableHead className="align-middle whitespace-nowrap  font-medium">
                      Target
                    </BorderedTableHead>
                  </React.Fragment>
                ))}
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
                paginatedData.map((item) => (
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
                          <AvatarFallback className=" text-primary">
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
                    <BorderedTableCell className="text-center">
                      {item.grammarCurrent}
                    </BorderedTableCell>
                    <BorderedTableCell className="text-center">
                      {item.grammarTarget}
                    </BorderedTableCell>
                    <BorderedTableCell className="text-center">
                      {item.vocabularyCurrent}
                    </BorderedTableCell>
                    <BorderedTableCell className="text-center">
                      {item.vocabularyTarget}
                    </BorderedTableCell>
                    <BorderedTableCell className="text-center">
                      {item.kanjiCurrent}
                    </BorderedTableCell>
                    <BorderedTableCell className="text-center">
                      {item.kanjiTarget}
                    </BorderedTableCell>
                    <BorderedTableCell className="text-center">
                      {item.readingCurrent}
                    </BorderedTableCell>
                    <BorderedTableCell className="text-center">
                      {item.readingTarget}
                    </BorderedTableCell>
                    <BorderedTableCell className="text-center">
                      {item.listeningCurrent}
                    </BorderedTableCell>
                    <BorderedTableCell className="text-center">
                      {item.listeningTarget}
                    </BorderedTableCell>
                    <BorderedTableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 min-w-[40px] rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                              width: `${Math.min(item.percentCompleteCurrent, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium tabular-nums">
                          {item.percentCompleteCurrent}%
                        </span>
                      </div>
                    </BorderedTableCell>
                    <BorderedTableCell className="text-center">
                      {item.percentCompleteTarget}%
                    </BorderedTableCell>
                    <BorderedTableCell>
                      <Badge className={getStatusBadgeClass(item.status)}>
                        {item.status}
                      </Badge>
                    </BorderedTableCell>
                  </TableRow>
                ))
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