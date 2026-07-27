"use client"

import React, {
  useState,
  useMemo,
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
} from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  UserGroupIcon,
  RefreshIcon,
  PlusSignIcon,
  LayoutGridIcon,
  TableIcon,
  Delete02Icon,
  UserAdd01Icon,
  Search01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { mainStore } from "@/store/mainStore"
import { MentionedLearner } from "@/types/course"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface LearnersTabProps {
  enrollments: any[]
  userRole: string
  profile?: any
  enrollmentSearchTerm: string
  onSearchChange: (value: string) => void
  course?: any
  onRefreshEnrollments?: () => Promise<void>
  onAdminChangeGroup?: (
    enrollmentId: number,
    newGroupId: number
  ) => Promise<void>
  isChangingGroup?: boolean
  groupChangeError?: string | null
  groupChangeSuccess?: string | null
  allEmployees?: any[]
  groups?: any[]
  onEnrollEmployee?: (
    employeeId: string | number,
    groupId?: number
  ) => Promise<void>
  onUnenrollEmployee?: (enrollmentId: number) => Promise<void>
  isEnrolling?: boolean
  isUnenrolling?: boolean
}

const getInitials = (name: string) => {
  if (!name) return "??"
  const parts = name.split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

type ViewMode = "table" | "card"

const AVAILABLE_LEARNERS_PER_PAGE = 10

export function LearnersTab({
  enrollments,
  userRole,
  profile,
  enrollmentSearchTerm,
  onSearchChange,
  course,
  onRefreshEnrollments,
  allEmployees = [],
  groups = [],
  onEnrollEmployee,
  onUnenrollEmployee,
  isEnrolling = false,
  isUnenrolling = false,
}: LearnersTabProps) {
  const isApprover = userRole === "approver"
  const isAdmin = userRole === "admin"
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [learnersCommandOpen, setLearnersCommandOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [visibleLearnersCount, setVisibleLearnersCount] = useState(
    AVAILABLE_LEARNERS_PER_PAGE
  )
  const [isEnrollingEmployee, setIsEnrollingEmployee] = useState(false)
  const [isUnenrollingEmployee, setIsUnenrollingEmployee] = useState<
    number | null
  >(null)

  const deferredSearchQuery = useDeferredValue(searchQuery)
  const commandListRef = useRef<HTMLDivElement>(null)
  const isLoadingMoreRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { fetch_courseEnrollments } = mainStore()

  let activeEnrollments = enrollments.filter(
    (e) => e.enrollmentStatus !== "CANCELLED"
  )

  if (isApprover && profile?.team) {
    activeEnrollments = activeEnrollments.filter(
      (employee) => employee.teamName === profile.team
    )
  }

  let filteredEnrollments = activeEnrollments.filter((employee) => {
    if (!enrollmentSearchTerm.trim()) return true
    const searchLower = enrollmentSearchTerm.toLowerCase()
    return (
      (employee.employeeName || "").toLowerCase().includes(searchLower) ||
      (employee.departmentName || "").toLowerCase().includes(searchLower) ||
      (employee.teamName || "").toLowerCase().includes(searchLower) ||
      (employee.courseGroupName || "").toLowerCase().includes(searchLower) ||
      (employee.employeeId || "").toLowerCase().includes(searchLower) ||
      (employee.email || "").toLowerCase().includes(searchLower)
    )
  })

  filteredEnrollments = filteredEnrollments.sort((a, b) => {
    const groupA = a.courseGroupName || ""
    const groupB = b.courseGroupName || ""
    if (groupA !== groupB) {
      return groupA.localeCompare(groupB)
    }
    return (a.employeeName || "").localeCompare(b.employeeName || "")
  })

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

  // Get already enrolled employee IDs
  const enrolledIds = useMemo(() => {
    return new Set(activeEnrollments.map((e: any) => e.employeeId))
  }, [activeEnrollments])

  // Filter available employees (not already enrolled)
  const availableEmployees = useMemo(() => {
    return allEmployees.filter((employee) => !enrolledIds.has(employee.id))
  }, [allEmployees, enrolledIds])

  const displayedLearners = useMemo(() => {
    if (!deferredSearchQuery.trim()) {
      return availableEmployees
    }
    const query = deferredSearchQuery.toLowerCase().trim()
    return availableEmployees.filter((learner) => {
      const searchableFields = [
        learner.name || "",
        learner.email || "",
        learner.department || "",
        learner.team || "",
      ]
      return searchableFields.some((field) =>
        field.toLowerCase().includes(query)
      )
    })
  }, [availableEmployees, deferredSearchQuery])

  const visibleLearners = useMemo(() => {
    return displayedLearners.slice(0, visibleLearnersCount)
  }, [displayedLearners, visibleLearnersCount])

  const hasMoreLearners = visibleLearnersCount < displayedLearners.length

  // Handle scroll to load more
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      const bottom =
        target.scrollHeight - target.scrollTop <= target.clientHeight + 10

      if (bottom && hasMoreLearners && !isLoadingMoreRef.current) {
        isLoadingMoreRef.current = true
        setVisibleLearnersCount((prev) => {
          const newCount = prev + AVAILABLE_LEARNERS_PER_PAGE
          return Math.min(newCount, displayedLearners.length)
        })
        setTimeout(() => {
          isLoadingMoreRef.current = false
        }, 200)
      }
    },
    [hasMoreLearners, displayedLearners.length]
  )

  useEffect(() => {
    if (!learnersCommandOpen) {
      setSearchQuery("")
      setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
    }
  }, [learnersCommandOpen])

  // Keyboard shortcut for search focus (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleEnrollEmployee = async (employee: any) => {
    if (!onEnrollEmployee) {
      alert("Enroll function not available")
      return
    }

    // For trainer courses, get the first group ID
    const isTrainer = course?.courseType === "trainer"
    let groupId = 1

    if (isTrainer && groups.length > 0) {
      groupId = parseInt(String(groups[0].id).replace("g", ""))
    }

    setIsEnrollingEmployee(true)
    try {
      await onEnrollEmployee(employee.id, groupId)
      setLearnersCommandOpen(false)
      setSearchQuery("")
      setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)

      // Refresh enrollments
      if (course?.id) {
        await fetch_courseEnrollments(course.id)
      }
      if (onRefreshEnrollments) {
        await onRefreshEnrollments()
      }
    } catch (error) {
      console.error("Error enrolling employee:", error)
      alert("Failed to enroll employee")
    } finally {
      setIsEnrollingEmployee(false)
    }
  }

  const handleUnenrollEmployee = async (
    enrollmentId: number,
    employeeName: string
  ) => {
    if (!onUnenrollEmployee) {
      alert("Unenroll function not available")
      return
    }

    if (!confirm(`Are you sure you want to unenroll ${employeeName}?`)) {
      return
    }

    setIsUnenrollingEmployee(enrollmentId)
    try {
      await onUnenrollEmployee(enrollmentId)

      // Refresh enrollments
      if (course?.id) {
        await fetch_courseEnrollments(course.id)
      }
      if (onRefreshEnrollments) {
        await onRefreshEnrollments()
      }
    } catch (error) {
      console.error("Error unenrolling employee:", error)
      alert("Failed to unenroll employee")
    } finally {
      setIsUnenrollingEmployee(null)
    }
  }

  // Check if there are no enrolled learners
  const hasNoLearners = activeEnrollments.length === 0

  return (
    <TabsContent value="learners" className="pt-4">
      {hasNoLearners ? (
        // Empty State - No learners enrolled
        <Empty className="h-full">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon
                icon={UserIcon}
                strokeWidth={1.5}
                className="h-12 w-12"
              />
            </EmptyMedia>
            <EmptyTitle>No Learners Enrolled</EmptyTitle>
            <EmptyDescription className="max-w-xs text-pretty">
              Add learners to attend this course.
            </EmptyDescription>
          </EmptyHeader>
          {isAdmin && course && availableEmployees.length > 0 && (
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() => setLearnersCommandOpen(true)}
                disabled={isEnrolling}
              >
                <HugeiconsIcon
                  icon={UserAdd01Icon}
                  strokeWidth={2}
                  className="h-4 w-4"
                />
                Add Learner
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        // Normal view with header and content
        <div>
          <CardHeader className="px-0">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="flex items-center gap-2 text-xl font-semibold">
                  Enrolled Learners
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {/* Updated Search Bar with InputGroup */}
                <InputGroup className="w-sm">
                  <InputGroupInput
                    ref={searchInputRef}
                    placeholder="Search by name, dept, team, or group..."
                    value={enrollmentSearchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
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

                {/* Add Employee Button - Directly opens dialog */}
                {isAdmin && course && availableEmployees.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLearnersCommandOpen(true)}
                    disabled={isEnrolling}
                  >
                    <HugeiconsIcon
                      icon={UserAdd01Icon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                    Add Learner
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pt-4">
            {filteredEnrollments.length === 0 ? (
              <div className="py-8 text-center">
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  strokeWidth={1.5}
                  className="mx-auto h-12 w-12 text-muted-foreground/50"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  {enrollmentSearchTerm
                    ? "No matching learners found"
                    : "No learners enrolled in this course yet"}
                </p>
              </div>
            ) : viewMode === "table" ? (
              // Table View with Delete Button
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-medium">Sr.</TableHead>
                      <TableHead className="text-xs font-medium">
                        Employee ID
                      </TableHead>
                      <TableHead className="text-xs font-medium">
                        Name
                      </TableHead>
                      <TableHead className="text-xs font-medium">
                        Email
                      </TableHead>
                      <TableHead className="text-xs font-medium">
                        Department
                      </TableHead>
                      <TableHead className="text-xs font-medium">
                        Team
                      </TableHead>
                      {course.courseType === "trainer" && (
                        <TableHead className="text-xs font-medium">
                          Group
                        </TableHead>
                      )}
                      <TableHead className="text-xs font-medium">
                        Enrolled At
                      </TableHead>
                      {isAdmin && (
                        <TableHead className="text-center text-xs font-medium">
                          Action
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrollments.map((employee, index) => {
                      const groupIndex =
                        filteredEnrollments.filter(
                          (e) => e.courseGroupName === employee.courseGroupName
                        ).length > 0
                          ? filteredEnrollments.findIndex(
                              (e) =>
                                e.courseGroupName === employee.courseGroupName
                            ) % groupColors.length
                          : index % groupColors.length

                      const isUnenrolling =
                        isUnenrollingEmployee === employee.id

                      return (
                        <TableRow
                          key={employee.id}
                          className="transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="text-center text-xs">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-xs">
                            {employee.employeeId || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={employee.pfImage || ""} />
                                <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                                  {getInitials(employee.employeeName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {employee.employeeName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {employee.email || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {employee.departmentName || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {employee.teamName || "-"}
                          </TableCell>
                          {course.courseType === "trainer" && (
                            <TableCell>
                              <Badge
                                className={cn(
                                  "text-xs font-normal",
                                  groupColors[groupIndex % groupColors.length]
                                )}
                              >
                                {employee.courseGroupName || "-"}
                              </Badge>
                            </TableCell>
                          )}

                          <TableCell className="text-xs text-muted-foreground">
                            {employee.enrolledAt
                              ? format(
                                  new Date(employee.enrolledAt),
                                  "MMM d, yyyy"
                                )
                              : "-"}
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() =>
                                  handleUnenrollEmployee(
                                    employee.id,
                                    employee.employeeName
                                  )
                                }
                                disabled={isUnenrolling}
                              >
                                {isUnenrolling ? (
                                  <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-current" />
                                ) : (
                                  <HugeiconsIcon
                                    icon={Delete02Icon}
                                    strokeWidth={2}
                                    className="h-4 w-4"
                                  />
                                )}
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              // Card View with Delete Button
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEnrollments.map((employee, index) => {
                  const groupIndex =
                    filteredEnrollments.filter(
                      (e) => e.courseGroupName === employee.courseGroupName
                    ).length > 0
                      ? filteredEnrollments.findIndex(
                          (e) => e.courseGroupName === employee.courseGroupName
                        ) % groupColors.length
                      : index % groupColors.length

                  const isUnenrolling = isUnenrollingEmployee === employee.id

                  return (
                    <div
                      key={employee.id}
                      className="flex flex-col rounded-lg border bg-muted/5 p-4 transition-colors hover:bg-muted/10"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={employee.pfImage || ""} />
                          <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                            {getInitials(employee.employeeName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="truncate font-medium">
                                {employee.employeeName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {employee.email || "-"}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  ID: {employee.employeeId || "-"}
                                </Badge>
                                <Badge
                                  className={cn(
                                    "text-[10px]",
                                    groupColors[groupIndex % groupColors.length]
                                  )}
                                >
                                  {employee.courseGroupName || "-"}
                                </Badge>
                              </div>
                            </div>
                            {isAdmin && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() =>
                                  handleUnenrollEmployee(
                                    employee.id,
                                    employee.employeeName
                                  )
                                }
                                disabled={isUnenrolling}
                              >
                                {isUnenrolling ? (
                                  <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-current" />
                                ) : (
                                  <HugeiconsIcon
                                    icon={Delete02Icon}
                                    strokeWidth={2}
                                    className="h-4 w-4"
                                  />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 border-t pt-2 text-xs text-muted-foreground">
                        <span>{employee.departmentName || "-"}</span>
                        <span>•</span>
                        <span>{employee.teamName || "-"}</span>
                        <span>•</span>
                        <span>
                          {employee.enrolledAt
                            ? format(
                                new Date(employee.enrolledAt),
                                "MMM d, yyyy"
                              )
                            : "-"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </div>
      )}

      {/* Add Employee Command Dialog */}
      {isAdmin && course && (
        <CommandDialog
          open={learnersCommandOpen}
          onOpenChange={setLearnersCommandOpen}
        >
          <Command className="gap-3" shouldFilter={false}>
            <CommandInput
              placeholder="Search employees by name, department or team..."
              value={searchQuery}
              onValueChange={(value) => {
                setSearchQuery(value)
                setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
              }}
            />
            <CommandList
              ref={commandListRef}
              onScroll={handleScroll}
              className="max-h-[400px] overflow-y-auto"
            >
              <CommandEmpty>
                {searchQuery && displayedLearners.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No employees found matching "{searchQuery}"
                  </div>
                ) : displayedLearners.length === 0 && !searchQuery ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    All available employees are already enrolled
                  </div>
                ) : null}
              </CommandEmpty>
              <CommandGroup className="gap-2">
                {visibleLearners.map((learner) => (
                  <CommandItem
                    key={learner.id}
                    onSelect={() => handleEnrollEmployee(learner)}
                    className="flex items-center justify-between"
                    disabled={isEnrolling || isEnrollingEmployee}
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={learner.avatar} alt={learner.name} />
                      <AvatarFallback className="rounded-lg">
                        {getInitials(learner.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {learner.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {learner.department} • {learner.team}
                      </span>
                    </div>
                    <CommandShortcut>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                      >
                        <HugeiconsIcon
                          icon={PlusSignIcon}
                          strokeWidth={2}
                          className="h-4 w-4"
                        />
                      </Button>
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>

              {hasMoreLearners && (
                <div className="border-t p-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                      <span>Loading more employees...</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Showing {visibleLearners.length} of{" "}
                      {displayedLearners.length} employees
                    </span>
                  </div>
                </div>
              )}

              {!hasMoreLearners && displayedLearners.length > 0 && (
                <div className="border-t p-3 text-center text-xs text-muted-foreground">
                  Showing all {displayedLearners.length} employees
                </div>
              )}
            </CommandList>
          </Command>
        </CommandDialog>
      )}
    </TabsContent>
  )
}
