// components/course/tabs/LearnersTab.tsx
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
  Delete02Icon,
  UserAdd01Icon,
  Search01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { format } from "date-fns"
import { cn, resolveUploadUrl } from "@/lib/utils"
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
import { AddLearnerDialogs } from "@/components/dialogs/addLearner-dialog"
import { toast } from "sonner"
import { dialog } from "@/components/dialogs/import-export-confirm-dialog"

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

// Bordered Table Cell component (matching employee-container)
const BorderedTableCell = ({
  children,
  className = "",
  selected = false,
  ...props
}: React.ComponentProps<typeof TableCell> & { selected?: boolean }) => (
  <TableCell
    className={cn("border-r border-l", selected && "bg-muted/50", className)}
    {...props}
  >
    {children}
  </TableCell>
)

const BorderedTableHead = ({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof TableHead>) => (
  <TableHead className={`border-r border-l ${className}`} {...props}>
    {children}
  </TableHead>
)

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
  const isDepartmentHead = userRole === "department_head"
  const isDivisionHead = userRole === "division_head"
  const isApprover = userRole === "approver"
  const isAdmin = userRole === "admin"

  // Allow view all learners for Department Head, Division Head, and Approver
  // Only restrict for regular learners
  const isRestrictedView = userRole === "learner"
  const canManageLearners = isAdmin

  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [addLearnerOpen, setAddLearnerOpen] = useState(false)
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

  // Only filter for learners (regular users)
  // Department Head, Division Head, and Approver can see ALL learners
  if (isRestrictedView) {
    // For approver (but not department_head or division_head), only show their team
    if (isApprover && profile?.team) {
      activeEnrollments = activeEnrollments.filter(
        (employee) => employee.teamName === profile.team
      )
    }
    // For department_head, only show their department
    if (isDepartmentHead && profile?.deptDat) {
      activeEnrollments = activeEnrollments.filter(
        (employee) => employee.departmentName === profile.deptDat
      )
    }
    // For division_head, only show their division (if applicable)
    // Add division filtering logic here if needed
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
  // For Department Head, Division Head, and Approver - show all available employees
  // For regular learners - show none (they can't add learners)
  const availableEmployees = useMemo(() => {
    // Only admins and managers can add learners
    if (!canManageLearners) {
      return []
    }

    let employees = allEmployees.filter(
      (employee) => !enrolledIds.has(employee.id)
    )

    // Only filter by department/team for restricted views
    if (isRestrictedView) {
      // Filter by department for department_head
      if (isDepartmentHead && profile?.deptDat) {
        employees = employees.filter(
          (employee) => employee.department === profile.deptDat
        )
      }
      // Filter by team for approver
      if (isApprover && profile?.team) {
        employees = employees.filter(
          (employee) => employee.team === profile.team
        )
      }
    }

    return employees
  }, [allEmployees, enrolledIds, isDepartmentHead, isApprover, isRestrictedView, profile?.deptDat, profile?.team, canManageLearners])

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

  // Updated: Accept either employee object or employee ID + groupId
  const handleEnrollEmployee = async (employeeOrId: any, groupId?: number) => {
    if (!onEnrollEmployee) {
      toast.info("Enroll function not available")
      return
    }

    const employeeId =
      typeof employeeOrId === "object" ? employeeOrId.id : employeeOrId
    const employeeName =
      typeof employeeOrId === "object"
        ? employeeOrId.name
        : String(employeeOrId)

    const isTrainer = course?.courseType === "trainer"

    if (isTrainer && !groupId) {
      console.error("No group ID provided for trainer course")
      toast.info("Please select a group for this course")
      return
    }

    try {
      await onEnrollEmployee(employeeId, groupId)
    } catch (error) {
      console.error(` Error enrolling ${employeeName}:`, error)
      throw error // Re-throw so AddLearnerDialogs can catch it
    }
  }

  const handleUnenrollEmployee = async (
    enrollmentId: number,
    employeeName: string
  ) => {
    if (!onUnenrollEmployee) {
      toast.info("Unenroll function not available")
      return
    }
    const confirmed = await dialog.confirm(
      "Confirm Unenrollment",
      `Are you sure you want to unenroll ${employeeName}?`,
      "Confirm",
      "Cancel",
      undefined,
      true // isDestructive
    )

    if (!confirmed) {
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
      toast.error("Failed to unenroll employee")
    } finally {
      setIsUnenrollingEmployee(null)
    }
  }

  // Check if there are no enrolled learners
  const hasNoLearners = activeEnrollments.length === 0

  // Get the columns for the table
  const getTableColumns = () => {
    const columns = [
      { field: "sr", header: "Sr." },
      { field: "name", header: "Name" },
      { field: "email", header: "Email" },
      { field: "division", header: "Division" },
      { field: "department", header: "Department" },
      { field: "team", header: "Team" },
    ]

    if (course?.courseType === "trainer") {
      columns.push({ field: "group", header: "Group" })
    }

    columns.push(
      { field: "enrolledAt", header: "Enrolled At" }
    )

    if (canManageLearners) {
      columns.push({ field: "action", header: "Action" })
    }

    return columns
  }

  const tableColumns = getTableColumns()

  // Determine the title/label for the view
  const getViewLabel = () => {
    if (isDepartmentHead && profile?.deptDat) {
      return `Showing learners from your department (${activeEnrollments.length} total)`
    }
    if (isDivisionHead) {
      return `Showing learners from your division (${activeEnrollments.length} total)`
    }
    if (isApprover && profile?.team && isRestrictedView) {
      return `Showing learners from your team (${activeEnrollments.length} total)`
    }
    return `All enrolled learners (${activeEnrollments.length} total)`
  }

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
              {isDepartmentHead && profile?.deptDat && isRestrictedView
                ? `No learners from your department (${profile.deptDat}) are enrolled in this course.`
                : "Add learners to attend this course."}
            </EmptyDescription>
          </EmptyHeader>
          {canManageLearners && course && availableEmployees.length > 0 && (
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() => setAddLearnerOpen(true)}
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

                {/* Add Employee Button - Opens the AddLearnerDialogs */}
                {canManageLearners &&
                  course &&
                  availableEmployees.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddLearnerOpen(true)}
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
                    : isDepartmentHead && profile?.deptDat && isRestrictedView
                      ? `No learners from your department (${profile.deptDat}) are enrolled in this course yet`
                      : "No learners enrolled in this course yet"}
                </p>
              </div>
            ) : viewMode === "table" ? (
              // Table View with Bordered Cells - Matching employee-container design
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {tableColumns.map((col) => (
                        <BorderedTableHead
                          key={col.field}
                          className="align-middle font-medium whitespace-nowrap"
                        >
                          {col.header}
                        </BorderedTableHead>
                      ))}
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
                          <BorderedTableCell className="text-center text-xs">
                            {index + 1}
                          </BorderedTableCell>
                          <BorderedTableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={resolveUploadUrl(
                                    employee.profilePhotoPath
                                  )}
                                />
                                <AvatarFallback className="text-xs text-primary">
                                  {getInitials(employee.employeeName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {employee.employeeName}
                              </span>
                            </div>
                          </BorderedTableCell>
                          <BorderedTableCell>
                            {employee.email || "-"}
                          </BorderedTableCell>
                          <BorderedTableCell>
                            {employee.divisionName || "-"}
                          </BorderedTableCell>
                          <BorderedTableCell>
                            {employee.departmentName || "-"}
                          </BorderedTableCell>
                          <BorderedTableCell>
                            {employee.teamName || "-"}
                          </BorderedTableCell>
                          {course?.courseType === "trainer" && (
                            <BorderedTableCell>
                              {employee.courseGroupName || "-"}
                            </BorderedTableCell>
                          )}
                          <BorderedTableCell>
                            {employee.enrolledAt
                              ? format(
                                  new Date(employee.enrolledAt),
                                  "MMM d, yyyy"
                                )
                              : "-"}
                          </BorderedTableCell>
                          {canManageLearners && (
                            <BorderedTableCell className="text-center">
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
                            </BorderedTableCell>
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
                          <AvatarImage
                            src={resolveUploadUrl(employee.profilePhotoPath)}
                          />
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
                              {/* Mock Test in Card View - View Only */}
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  Mock Test:
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {employee.mockTestAttempt ?? 0}
                                </Badge>
                              </div>
                            </div>
                            {canManageLearners && (
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

      {/* Add Learner Dialogs */}
      {canManageLearners && course && (
        <AddLearnerDialogs
          course={course}
          enrollments={enrollments}
          allEmployees={availableEmployees}
          groups={groups}
          open={addLearnerOpen}
          onOpenChange={setAddLearnerOpen}
          onEnrollEmployee={handleEnrollEmployee}
          onRefreshEnrollments={onRefreshEnrollments}
          onAddComplete={() => {
            // Refresh enrollments after adding
            if (course?.id) {
              fetch_courseEnrollments(course.id)
            }
            if (onRefreshEnrollments) {
              onRefreshEnrollments()
            }
          }}
        />
      )}
    </TabsContent>
  )
}