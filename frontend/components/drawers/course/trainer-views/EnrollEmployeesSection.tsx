"use client"

import React, {
  useState,
  useMemo,
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
} from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PlusSignIcon,
  Delete02Icon,
  UserGroupIcon,
  Add01Icon,
  RefreshIcon,
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { mainStore } from "@/store/mainStore"
import { MentionedLearner } from "@/types/course"
import { cn } from "@/lib/utils"

interface EnrollEmployeesSectionProps {
  allEmployees: MentionedLearner[]
  courseId?: number | string
  onRefreshEnrollments?: () => Promise<void>
  isSubmitting?: boolean
  groups?: any[]
  activeGroupTab?: string
  isTrainer?: boolean
  onAdminChangeGroup?: (
    enrollmentId: number,
    newGroupId: number
  ) => Promise<void>
  isChangingGroup?: boolean
  groupChangeError?: string | null
  groupChangeSuccess?: string | null
  onGroupsChanged?: (groups: any[]) => void
}

// const statusColors: Record<string, string> = {
//     APPROVED: "bg-green-500",
//     PENDING: "bg-yellow-500",
//     CANCELLED: "bg-gray-500",
//     COMPLETED: "bg-blue-500",
// }

// const statusLabels: Record<string, string> = {
//     APPROVED: "Approved",
//     PENDING: "Pending",
//     CANCELLED: "Cancelled",
//     COMPLETED: "Completed",
// }

const AVAILABLE_LEARNERS_PER_PAGE = 10

// Helper function to check if a group ID is temporary
const isTemporaryGroupId = (groupId: string | number): boolean => {
  const idStr = String(groupId)
  return idStr.startsWith("g") && !/^\d+$/.test(idStr)
}

// Helper function to check if an enrollment is in a temporary group
const isEnrollmentInTemporaryGroup = (
  enrollment: any,
  groups: any[]
): boolean => {
  if (isTemporaryGroupId(enrollment.courseGroupId)) {
    return true
  }
  if (typeof enrollment.courseGroupId === "number") {
    const matchingGroup = groups.find((g) => {
      const numericId = parseInt(String(g.id).replace("g", ""))
      return numericId === enrollment.courseGroupId && isTemporaryGroupId(g.id)
    })
    return !!matchingGroup
  }
  return false
}

export const EnrollEmployeesSection: React.FC<EnrollEmployeesSectionProps> = ({
  allEmployees,
  courseId,
  onRefreshEnrollments,
  isSubmitting,
  groups = [],
  activeGroupTab = "",
  isTrainer = false,
  onAdminChangeGroup,
  isChangingGroup,
  groupChangeError,
  groupChangeSuccess,
  onGroupsChanged,
}) => {
  const {
    session,
    enrollments,
    fetch_courseEnrollments,
    enrollEmployee,
    unenrollEmployee,
  } = mainStore()

  const [displayEnrollments, setDisplayEnrollments] = useState<any[]>([])
  const [actualEnrollments, setActualEnrollments] = useState<any[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [visibleLearnersCount, setVisibleLearnersCount] = useState(
    AVAILABLE_LEARNERS_PER_PAGE
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [isEnrollingEmployee, setIsEnrollingEmployee] = useState(false)
  const [isUnenrollingEmployee, setIsUnenrollingEmployee] = useState<
    number | null
  >(null)
  const [learnersCommandOpen, setLearnersCommandOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRedistributing, setIsRedistributing] = useState(false)

  const [changingEmployeeId, setChangingEmployeeId] = useState<number | null>(
    null
  )
  const [selectedNewGroupId, setSelectedNewGroupId] = useState<string>("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const prevGroupsRef = useRef<any[]>([])
  // Track the previous number of groups
  const prevGroupCountRef = useRef<number>(0)

  // Ref for the command list container to detect scroll
  const commandListRef = useRef<HTMLDivElement>(null)
  // Ref to track if we're currently loading more
  const isLoadingMoreRef = useRef(false)

  const currentUserId = session?.userId

  const isActiveGroupTemporary = useMemo(() => {
    if (!isTrainer || !activeGroupTab) return false
    return isTemporaryGroupId(activeGroupTab)
  }, [isTrainer, activeGroupTab])

  useEffect(() => {
    if (!enrollments) return

    if (isLoading) {
      setDisplayEnrollments(enrollments)
      setActualEnrollments(enrollments)
      setIsLoading(false)
      return
    }

    const currentIds = displayEnrollments.map((e: any) => e.id).sort()
    const newIds = enrollments.map((e: any) => e.id).sort()

    if (JSON.stringify(currentIds) !== JSON.stringify(newIds)) {
      setIsTransitioning(true)
      setActualEnrollments(enrollments)

      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current)
      }

      transitionTimerRef.current = setTimeout(() => {
        setDisplayEnrollments(enrollments)
        setIsTransitioning(false)
        transitionTimerRef.current = null
      }, 150)
    }
  }, [enrollments, isLoading, displayEnrollments])

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

  // Function to redistribute enrollments in UI only - ONLY when groups change
  const redistributeEnrollmentsUI = useCallback(
    (newGroups: any[]) => {
      if (!isTrainer || newGroups.length === 0) {
        return
      }

      // Check if the number of groups has changed
      const currentGroupCount = newGroups.length
      const prevGroupCount = prevGroupCountRef.current

      // Only redistribute if groups were added or removed
      if (currentGroupCount === prevGroupCount) {
        return
      }

      prevGroupCountRef.current = currentGroupCount
      setIsRedistributing(true)

      try {
        const activeEnrollments = actualEnrollments.filter(
          (e: any) => e.enrollmentStatus !== "CANCELLED"
        )

        if (activeEnrollments.length === 0) {
          setIsRedistributing(false)
          return
        }

        // ✅ If groups were removed, redistribute employees from removed groups to remaining groups
        if (currentGroupCount < prevGroupCount) {
          const remainingGroupIds = newGroups.map((g) =>
            parseInt(String(g.id).replace("g", ""))
          )

          // Get employees from removed groups (those not in remaining group IDs)
          const employeesFromRemovedGroups = activeEnrollments.filter(
            (e: any) => !remainingGroupIds.includes(e.courseGroupId)
          )

          // Get employees already in remaining groups
          const employeesInRemainingGroups = activeEnrollments.filter(
            (e: any) => remainingGroupIds.includes(e.courseGroupId)
          )

          // Start with employees already in remaining groups
          let redistributedEnrollments = [...employeesInRemainingGroups]

          // Distribute employees from removed groups evenly across remaining groups
          if (
            employeesFromRemovedGroups.length > 0 &&
            remainingGroupIds.length > 0
          ) {
            const totalEmployees = employeesFromRemovedGroups.length
            const numRemainingGroups = remainingGroupIds.length
            const baseCount = Math.floor(totalEmployees / numRemainingGroups)
            const remainder = totalEmployees % numRemainingGroups

            // Sort employees for consistent distribution
            const sortedEmployees = [...employeesFromRemovedGroups].sort(
              (a, b) => a.employeeId - b.employeeId
            )
            let employeeIndex = 0

            // For each remaining group, assign employees from removed groups
            newGroups.forEach((group: any, index: number) => {
              const groupId = parseInt(String(group.id).replace("g", ""))
              const countForGroup = baseCount + (index < remainder ? 1 : 0)
              const employeesForGroup = sortedEmployees.slice(
                employeeIndex,
                employeeIndex + countForGroup
              )
              employeeIndex += countForGroup

              employeesForGroup.forEach((enrollment: any) => {
                redistributedEnrollments.push({
                  ...enrollment,
                  courseGroupId: groupId,
                  courseGroupName: group.name,
                })
              })
            })
          }

          const cancelledEnrollments = actualEnrollments.filter(
            (e: any) => e.enrollmentStatus === "CANCELLED"
          )

          setDisplayEnrollments([
            ...redistributedEnrollments,
            ...cancelledEnrollments,
          ])
          setIsRedistributing(false)
          return
        }

        // ✅ Groups were added - find which groups are new (temporary)
        const tempGroups = newGroups.filter((g) => isTemporaryGroupId(g.id))
        const existingGroups = newGroups.filter(
          (g) => !isTemporaryGroupId(g.id)
        )

        // Start with all active enrollments in their current groups
        let redistributedEnrollments: any[] = []

        // First, keep all employees in their existing groups
        // But update group names to match the new group names
        const existingGroupIds = existingGroups.map((g) =>
          parseInt(String(g.id).replace("g", ""))
        )

        // Keep employees in existing groups
        const employeesInExistingGroups = activeEnrollments.filter((e: any) =>
          existingGroupIds.includes(e.courseGroupId)
        )

        // Update group names for existing groups
        employeesInExistingGroups.forEach((enrollment: any) => {
          const matchingGroup = existingGroups.find((g) => {
            const numericId = parseInt(String(g.id).replace("g", ""))
            return numericId === enrollment.courseGroupId
          })
          if (matchingGroup) {
            redistributedEnrollments.push({
              ...enrollment,
              courseGroupName: matchingGroup.name,
            })
          } else {
            redistributedEnrollments.push(enrollment)
          }
        })

        // Now handle the new temporary groups
        // We need to move SOME employees from existing groups to the new groups
        // to balance the distribution

        // Get employees that are NOT in existing groups (they might be in groups that were removed)
        const employeesNotInExistingGroups = activeEnrollments.filter(
          (e: any) => !existingGroupIds.includes(e.courseGroupId)
        )

        // For each employee not in an existing group, assign them to a new group
        employeesNotInExistingGroups.forEach(
          (enrollment: any, index: number) => {
            // Distribute them evenly across temp groups
            const tempGroupIndex = index % tempGroups.length
            const tempGroup = tempGroups[tempGroupIndex]
            const groupId = parseInt(String(tempGroup.id).replace("g", ""))

            redistributedEnrollments.push({
              ...enrollment,
              courseGroupId: groupId,
              courseGroupName: tempGroup.name,
            })
          }
        )

        // Now, if we have temp groups and we want to redistribute some employees
        // from existing groups to the new groups for balancing, we can do that here
        if (tempGroups.length > 0) {
          // Get employees that are in existing groups
          const employeesInExisting = activeEnrollments.filter((e: any) =>
            existingGroupIds.includes(e.courseGroupId)
          )

          // Calculate how many employees should be in each group for balance
          const totalEmployees = activeEnrollments.length
          const totalGroups = newGroups.length
          const targetPerGroup = Math.floor(totalEmployees / totalGroups)
          const remainder = totalEmployees % totalGroups

          // For each existing group, check if it has too many employees
          existingGroups.forEach((group: any, groupIndex: number) => {
            const groupId = parseInt(String(group.id).replace("g", ""))
            const employeesInThisGroup = redistributedEnrollments.filter(
              (e: any) => e.courseGroupId === groupId
            )

            const targetCount =
              targetPerGroup + (groupIndex < remainder ? 1 : 0)

            // If this group has more employees than target, move some to temp groups
            if (
              employeesInThisGroup.length > targetCount &&
              tempGroups.length > 0
            ) {
              const excessCount = employeesInThisGroup.length - targetCount
              const employeesToMove = employeesInThisGroup.slice(0, excessCount)

              // Remove them from this group
              redistributedEnrollments = redistributedEnrollments.filter(
                (e: any) => !employeesToMove.some((emp: any) => emp.id === e.id)
              )

              // Add them to temp groups
              employeesToMove.forEach((enrollment: any, index: number) => {
                const tempGroupIndex = index % tempGroups.length
                const tempGroup = tempGroups[tempGroupIndex]
                const tempGroupId = parseInt(
                  String(tempGroup.id).replace("g", "")
                )

                redistributedEnrollments.push({
                  ...enrollment,
                  courseGroupId: tempGroupId,
                  courseGroupName: tempGroup.name,
                })
              })
            }
          })
        }

        const cancelledEnrollments = actualEnrollments.filter(
          (e: any) => e.enrollmentStatus === "CANCELLED"
        )

        setDisplayEnrollments([
          ...redistributedEnrollments,
          ...cancelledEnrollments,
        ])
      } catch (error) {
        console.error("Failed to redistribute in UI:", error)
      } finally {
        setIsRedistributing(false)
      }
    },
    [isTrainer, actualEnrollments]
  )

  useEffect(() => {
    if (!isTrainer || !courseId || groups.length === 0 || isLoading) return

    const currentGroupIds = groups
      .map((g) => g.id)
      .sort()
      .join(",")
    const prevGroupIds = prevGroupsRef.current
      .map((g) => g.id)
      .sort()
      .join(",")

    if (currentGroupIds !== prevGroupIds) {
      prevGroupsRef.current = groups
      redistributeEnrollmentsUI(groups)
    }
  }, [groups, isTrainer, courseId, isLoading, redistributeEnrollmentsUI])

  // ✅ Use actualEnrollments for logic (add/remove employee checks)
  const currentGroupEnrolledIds = useMemo(() => {
    if (!isTrainer) return new Set()

    const activeGroup = groups.find((g) => g.id === activeGroupTab)
    if (!activeGroup) return new Set()

    const groupId = parseInt(activeGroup.id.replace("g", ""))
    return new Set(
      actualEnrollments
        .filter(
          (e: any) =>
            e.courseGroupId === groupId && e.enrollmentStatus !== "CANCELLED"
        )
        .map((e: any) => e.employeeId)
    )
  }, [actualEnrollments, isTrainer, groups, activeGroupTab])

  const allEnrolledIds = useMemo(() => {
    return new Set(
      actualEnrollments
        .filter((e: any) => e.enrollmentStatus !== "CANCELLED")
        .map((e: any) => e.employeeId)
    )
  }, [actualEnrollments])

  const allAvailableEmployees = useMemo(() => {
    if (isTrainer) {
      return allEmployees.filter(
        (learner) => !currentGroupEnrolledIds.has(learner.id)
      )
    }
    return allEmployees.filter((learner) => !allEnrolledIds.has(learner.id))
  }, [allEmployees, isTrainer, currentGroupEnrolledIds, allEnrolledIds])

  // ✅ Use displayEnrollments for UI rendering
  const enrolledEmployees = useMemo(() => {
    if (!displayEnrollments || displayEnrollments.length === 0) return []

    if (isTrainer) {
      const activeGroup = groups.find((g) => g.id === activeGroupTab)
      if (!activeGroup) return []

      const groupId = parseInt(activeGroup.id.replace("g", ""))
      return displayEnrollments.filter(
        (e: any) =>
          e.courseGroupId === groupId && e.enrollmentStatus !== "CANCELLED"
      )
    }

    return displayEnrollments.filter(
      (e: any) => e.enrollmentStatus !== "CANCELLED"
    )
  }, [displayEnrollments, isTrainer, groups, activeGroupTab])

  const displayedLearners = useMemo(() => {
    // Filter out the current user
    const filteredEmployees = allAvailableEmployees.filter(
      (learner) => learner.id !== currentUserId
    )

    if (!deferredSearchQuery.trim()) {
      return filteredEmployees
    }

    const query = deferredSearchQuery.toLowerCase().trim()
    return filteredEmployees.filter((learner) => {
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
  }, [allAvailableEmployees, deferredSearchQuery, currentUserId])

  const visibleLearners = useMemo(() => {
    return displayedLearners.slice(0, visibleLearnersCount)
  }, [displayedLearners, visibleLearnersCount])

  const hasMoreLearners = visibleLearnersCount < displayedLearners.length

  // Handle scroll to load more
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      const bottom =
        target.scrollHeight - target.scrollTop <= target.clientHeight + 10 // 10px threshold

      if (bottom && hasMoreLearners && !isLoadingMoreRef.current) {
        isLoadingMoreRef.current = true
        setVisibleLearnersCount((prev) => {
          const newCount = prev + AVAILABLE_LEARNERS_PER_PAGE
          return Math.min(newCount, displayedLearners.length)
        })
        // Reset loading state after a small delay
        setTimeout(() => {
          isLoadingMoreRef.current = false
        }, 200)
      }
    },
    [hasMoreLearners, displayedLearners.length]
  )

  // Reset scroll detection when search query changes
  useEffect(() => {
    isLoadingMoreRef.current = false
    // Reset scroll position when search changes
    if (commandListRef.current) {
      commandListRef.current.scrollTop = 0
    }
  }, [searchQuery])

  const handleSeeMore = useCallback(() => {
    setVisibleLearnersCount((prev) => prev + AVAILABLE_LEARNERS_PER_PAGE)
  }, [])

  useEffect(() => {
    if (!learnersCommandOpen) {
      setSearchQuery("")
      setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
    }
  }, [learnersCommandOpen])

  // ✅ Fixed admin group change handler with better logging
  const handleAdminGroupChange = useCallback(
    async (enrollmentId: number, newGroupId: string) => {
      if (!onAdminChangeGroup) {
        alert("Admin group change function not available")
        return
      }

      // Find the employee in actualEnrollments (source of truth)
      const employee = actualEnrollments.find((e: any) => e.id === enrollmentId)
      if (!employee) {
        alert("Employee not found. Please refresh and try again.")
        setChangingEmployeeId(null)
        setSelectedNewGroupId("")
        setShowConfirmDialog(false)
        return
      }

      // Check if target group is temporary
      if (isTemporaryGroupId(newGroupId)) {
        alert("Cannot move to a temporary group. Please save the course first.")
        setChangingEmployeeId(null)
        setSelectedNewGroupId("")
        setShowConfirmDialog(false)
        return
      }

      // Check if employee is in a temporary group
      if (isEnrollmentInTemporaryGroup(employee, groups)) {
        alert(
          "Cannot change group for an employee in a temporary group. Please save the course first."
        )
        setChangingEmployeeId(null)
        setSelectedNewGroupId("")
        setShowConfirmDialog(false)
        return
      }

      // ✅ Get current group ID as number with better handling
      let currentGroupId: number
      if (typeof employee.courseGroupId === "string") {
        currentGroupId = parseInt(employee.courseGroupId.replace("g", ""))
      } else {
        currentGroupId = employee.courseGroupId
      }

      const newNumericGroupId = parseInt(newGroupId.replace("g", ""))

      // ✅ Check if changing to the same group
      if (currentGroupId === newNumericGroupId) {
        alert("⚠️ Employee is already in this group.")
        setChangingEmployeeId(null)
        setSelectedNewGroupId("")
        setShowConfirmDialog(false)
        return
      }

      try {
        await onAdminChangeGroup(enrollmentId, newNumericGroupId)
        setChangingEmployeeId(null)
        setSelectedNewGroupId("")
        setShowConfirmDialog(false)

        // Refresh enrollments from the API
        await fetch_courseEnrollments(courseId)
        if (onRefreshEnrollments) {
          await onRefreshEnrollments()
        }

        // Update display to match actual data
        const updatedEnrollments = await fetch_courseEnrollments(courseId)
        if (updatedEnrollments) {
          setDisplayEnrollments(updatedEnrollments)
          setActualEnrollments(updatedEnrollments)
        }
      } catch (error) {
        console.error("Error changing group:", error)
        alert(error instanceof Error ? error.message : "Failed to change group")
      }
    },
    [
      onAdminChangeGroup,
      courseId,
      fetch_courseEnrollments,
      onRefreshEnrollments,
      actualEnrollments,
      groups,
    ]
  )

  const handleEnrollEmployee = useCallback(
    async (employee: MentionedLearner) => {
      if (!courseId) {
        alert("Course ID is required to enroll")
        return
      }

      let groupId = 1

      if (isTrainer) {
        const activeGroup = groups.find((g) => g.id === activeGroupTab)
        if (activeGroup) {
          groupId = parseInt(activeGroup.id.replace("g", ""))
        }
      }

      const isAlreadyEnrolled = isTrainer
        ? currentGroupEnrolledIds.has(employee.id)
        : allEnrolledIds.has(employee.id)

      if (isAlreadyEnrolled) {
        alert(
          `${employee.name} is already enrolled in this ${isTrainer ? "group" : "course"}`
        )
        return
      }

      if (isTrainer) {
        const existingEnrollment = actualEnrollments.find(
          (e: any) =>
            e.employeeId === employee.id && e.enrollmentStatus !== "CANCELLED"
        )
        if (existingEnrollment) {
          if (
            !confirm(
              `${employee.name} is currently in "${existingEnrollment.courseGroupName}". Do you want to move them to the current group?`
            )
          ) {
            return
          }
          await unenrollEmployee(courseId, existingEnrollment.id)
        }
      }

      if (
        !confirm(
          `Are you sure you want to enroll ${employee.name} in this ${isTrainer ? "group" : "course"}?`
        )
      ) {
        return
      }

      setIsEnrollingEmployee(true)
      try {
        const result = await enrollEmployee(courseId, groupId, employee.id)

        if (result.success) {
          alert(`✅ ${employee.name} enrolled successfully!`)
          setSearchQuery("")
          setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
          setLearnersCommandOpen(false)

          await fetch_courseEnrollments(courseId)
          if (onRefreshEnrollments) {
            await onRefreshEnrollments()
          }
        } else {
          alert(result.message || "Failed to enroll employee")
        }
      } catch (error) {
        console.error("Error enrolling employee:", error)
        alert("An error occurred while enrolling")
      } finally {
        setIsEnrollingEmployee(false)
      }
    },
    [
      courseId,
      isTrainer,
      groups,
      activeGroupTab,
      currentGroupEnrolledIds,
      allEnrolledIds,
      actualEnrollments,
      enrollEmployee,
      unenrollEmployee,
      fetch_courseEnrollments,
      onRefreshEnrollments,
    ]
  )

  const handleUnenrollEmployee = useCallback(
    async (enrollmentId: number, employeeName: string) => {
      if (!courseId) {
        alert("Course ID is required to unenroll")
        return
      }

      if (
        !confirm(
          `Are you sure you want to unenroll ${employeeName} from this ${isTrainer ? "group" : "course"}?`
        )
      ) {
        return
      }

      setIsUnenrollingEmployee(enrollmentId)
      try {
        const result = await unenrollEmployee(courseId, enrollmentId)

        if (result.success) {
          alert(`✅ ${employeeName} unenrolled successfully!`)

          await fetch_courseEnrollments(courseId)
          if (onRefreshEnrollments) {
            await onRefreshEnrollments()
          }
        } else {
          alert(result.message || "Failed to unenroll employee")
        }
      } catch (error) {
        console.error("Error unenrolling employee:", error)
        alert("An error occurred while unenrolling")
      } finally {
        setIsUnenrollingEmployee(null)
      }
    },
    [
      courseId,
      isTrainer,
      unenrollEmployee,
      fetch_courseEnrollments,
      onRefreshEnrollments,
    ]
  )

  const getInitials = useCallback((name: string) => {
    if (!name) return "??"
    const parts = name.split(" ")
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase()
  }, [])

  const commandItems = useMemo(() => {
    return visibleLearners.map((learner) => (
      <CommandItem
        key={learner.id}
        onSelect={() => {
          handleEnrollEmployee(learner)
          setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
          setSearchQuery("")
        }}
        className="flex items-center justify-between"
        disabled={isEnrollingEmployee}
      >
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage src={learner.avatar} alt={learner.name} />
          <AvatarFallback className="rounded-lg">
            {getInitials(learner.name)}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{learner.name}</span>
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
              icon={Add01Icon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          </Button>
        </CommandShortcut>
      </CommandItem>
    ))
  }, [visibleLearners, isEnrollingEmployee, handleEnrollEmployee, getInitials])

  if (isLoading || isRedistributing) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        {isRedistributing && (
          <span className="ml-3 text-sm text-muted-foreground">
            Redistributing enrollments...
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groupChangeError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-600">
          {groupChangeError}
        </div>
      )}
      {groupChangeSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-2 text-sm text-green-600">
          <span>✅</span>
          {groupChangeSuccess}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <HugeiconsIcon
            icon={UserGroupIcon}
            strokeWidth={1.5}
            className="h-4 w-4"
          />
          Enrolled Employees
          <span className="text-sm font-normal text-muted-foreground">
            ({enrolledEmployees.length})
            {isTransitioning && (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </span>
        </Label>
        {/* ✅ REMOVED isTrainer check - Now available to all users */}
        {!isActiveGroupTemporary && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setLearnersCommandOpen(true)}
            className="gap-2"
            disabled={isSubmitting || isTransitioning}
          >
            <HugeiconsIcon
              icon={PlusSignIcon}
              strokeWidth={2}
              className="h-4 w-4"
            />
            Add Employee
          </Button>
        )}
      </div>

      {enrolledEmployees.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed py-8 text-center text-sm text-muted-foreground">
          No employees enrolled in this {isTrainer ? "group" : "course"} yet
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {enrolledEmployees.map((employee: any) => {
            const isUnenrolling = isUnenrollingEmployee === employee.id
            const isChanging = changingEmployeeId === employee.id

            const isInTemporaryGroup =
              isTrainer && isEnrollmentInTemporaryGroup(employee, groups)

            const availableGroups = isTrainer
              ? groups.filter((g) => {
                  // Skip temporary groups
                  if (isTemporaryGroupId(g.id)) {
                    return false
                  }

                  const groupId = parseInt(String(g.id).replace("g", ""))
                  const currentGroupId =
                    typeof employee.courseGroupId === "string"
                      ? parseInt(employee.courseGroupId.replace("g", ""))
                      : employee.courseGroupId

                  // ✅ Skip the current group
                  return groupId !== currentGroupId
                })
              : []

            return (
              <div
                key={employee.id}
                className="flex flex-col w-full gap-2 rounded-lg border bg-muted/5 px-2 py-3 transition-colors hover:bg-muted/10"
              >
                <div className="flex flex-1 items-center justify-between gap-2">
                  <Avatar className="h-8 w-8 shrink-0 rounded-full">
                    <AvatarImage src={employee.pfImage || ""} />
                    <AvatarFallback className="rounded-full text-sm text-primary">
                      {getInitials(employee.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {employee.employeeName}
                      </span>
                    </div>
                    <div className="flex gap- text-xs text-muted-foreground">
                      <span className="truncate max-w-[50%]">
                        {employee.departmentName}
                      </span>
                      {employee.departmentName && employee.teamName && (
                        <span>•</span>
                      )}
                      {employee.teamName && (
                        <span className="truncate">{employee.teamName}</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {/* {isTrainer && (
                        <>
                          <span className="text-xs text-muted-foreground">
                            •
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Group: {employee.courseGroupName}
                            {isInTemporaryGroup && (
                              <span className="ml-1 text-yellow-500">
                                (Pending Save)
                              </span>
                            )}
                          </span>
                        </>
                      )} */}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(employee.enrolledAt), "MMM d, yyyy")}
                    </span>
                    {/* ✅ REMOVED isInTemporaryGroup check for unenroll button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() =>
                        handleUnenrollEmployee(
                          employee.id,
                          employee.employeeName
                        )
                      }
                      disabled={isUnenrolling || isTransitioning || isChanging}
                    >
                      {isUnenrolling || isTransitioning ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                      ) : (
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          strokeWidth={2}
                          className="h-4 w-4"
                        />
                      )}
                    </Button>
                  </div>
                </div>

                {isTrainer &&
                  onAdminChangeGroup &&
                  !isInTemporaryGroup &&
                  availableGroups.length > 0 && (
                    <div className="mt-1 border-t pt-2">
                      {!isChanging ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-full justify-center gap-1 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => {
                            setChangingEmployeeId(employee.id)
                            setSelectedNewGroupId("")
                            setShowConfirmDialog(false)
                          }}
                          disabled={isChangingGroup}
                        >
                          <HugeiconsIcon
                            icon={RefreshIcon}
                            strokeWidth={2}
                            className="h-3 w-3"
                          />
                          Change Group
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedNewGroupId || undefined}
                            onValueChange={(value) => {
                              setSelectedNewGroupId(value)
                              setShowConfirmDialog(false)
                            }}
                            disabled={isChangingGroup}
                          >
                            <SelectTrigger className="h-7 flex-1 text-xs">
                              <SelectValue placeholder="Select group..." />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              className="z-[9999]"
                            >
                              <SelectGroup>
                                {availableGroups.map((group) => {
                                  const groupId = parseInt(
                                    String(group.id).replace("g", "")
                                  )
                                  const groupEmployees =
                                    displayEnrollments.filter(
                                      (e: any) =>
                                        e.courseGroupId === groupId &&
                                        e.enrollmentStatus !== "CANCELLED"
                                    )
                                  const isFull =
                                    group.capacity !== undefined &&
                                    groupEmployees.length >=
                                      ((group.capacity as number) || 0)

                                  return (
                                    <SelectItem
                                      key={group.id}
                                      value={String(group.id)}
                                      disabled={isFull}
                                      className="text-xs"
                                    >
                                      <div className="flex w-full items-center justify-between gap-3">
                                        <span className="truncate">
                                          {group.name}
                                        </span>
                                        <span className="text-xs whitespace-nowrap text-muted-foreground">
                                          ({groupEmployees.length}/
                                          {group.capacity === undefined
                                            ? "∞"
                                            : group.capacity}
                                          )
                                          {isFull && (
                                            <span className="ml-1 text-red-500">
                                              (Full)
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  )
                                })}
                              </SelectGroup>
                            </SelectContent>
                          </Select>

                          {!showConfirmDialog ? (
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                disabled={
                                  !selectedNewGroupId || isChangingGroup
                                }
                                onClick={() => setShowConfirmDialog(true)}
                              >
                                Confirm
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setChangingEmployeeId(null)
                                  setSelectedNewGroupId("")
                                  setShowConfirmDialog(false)
                                }}
                                disabled={isChangingGroup}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="h-7 bg-green-600 px-2 text-xs hover:bg-green-700"
                                onClick={() => {
                                  if (selectedNewGroupId) {
                                    handleAdminGroupChange(
                                      employee.id,
                                      selectedNewGroupId
                                    )
                                  }
                                }}
                                disabled={
                                  !selectedNewGroupId || isChangingGroup
                                }
                              >
                                {isChangingGroup ? (
                                  <span className="flex items-center gap-1">
                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Changing...
                                  </span>
                                ) : (
                                  "Yes"
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setShowConfirmDialog(false)
                                }}
                                disabled={isChangingGroup}
                              >
                                No
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            )
          })}
        </div>
      )}

      {/* ✅ REMOVED isTrainer check - CommandDialog available to all users */}
      {!isActiveGroupTemporary && (
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
              <CommandGroup className="gap-2">{commandItems}</CommandGroup>

              {hasMoreLearners && (
                <div className="border-t p-4">
                  <div className="flex flex-col items-center gap-3">
                    {/* Loading indicator at the bottom */}
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
    </div>
  )
}
