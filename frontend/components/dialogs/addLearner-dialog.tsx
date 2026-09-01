"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PlusSignIcon,
  CancelIcon,
  UserGroupIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Course } from "@/types/course"
import { mainStore } from "@/store/mainStore"
import { toast } from "sonner"

// Spinner component using Hugeicons (matching sendMail dialog)
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

interface Employee {
  id: number
  name: string
  email: string
  department: string
  team: string
  avatar?: string
}

interface EnrolledEmployee {
  id: number
  employeeId: string
  employeeName: string
  email: string
  departmentId: number
  departmentName: string
  teamId: number
  teamName: string
  position: string
  courseGroupId: number
  courseGroupName: string
  enrollmentStatus: string
  enrolledAt: string
  pfImage?: string
}

interface AddLearnerDialogsProps {
  course: Course
  enrollments: EnrolledEmployee[]
  allEmployees: Employee[]
  groups: any[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEnrollEmployee?: (
    employeeId: string | number,
    groupId?: number
  ) => Promise<void>
  onRefreshEnrollments?: () => Promise<void>
  onAddComplete?: () => void
}

const getInitials = (name: string) => {
  if (!name) return "??"
  const parts = name.split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const isTemporaryGroupId = (groupId: string | number): boolean => {
  const idStr = String(groupId)
  return idStr.startsWith("g") && !/^\d+$/.test(idStr)
}

const getEnrolledEmployees = (enrollments: EnrolledEmployee[]) => {
  return enrollments.filter((e) => e.enrollmentStatus !== "CANCELLED")
}

const AVAILABLE_LEARNERS_PER_PAGE = 10

export function AddLearnerDialogs({
  course,
  enrollments,
  allEmployees,
  groups,
  open,
  onOpenChange,
  onEnrollEmployee,
  onRefreshEnrollments,
  onAddComplete,
}: AddLearnerDialogsProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewAllOpen, setViewAllOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  })
  const [visibleLearnersCount, setVisibleLearnersCount] = useState(
    AVAILABLE_LEARNERS_PER_PAGE
  )
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // Add dropdown interaction state
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)

  const commandListRef = useRef<HTMLDivElement>(null)
  const isLoadingMoreRef = useRef(false)

  // Get the store functions
  const { fetch_courseEnrollments } = mainStore()

  // Get enrolled employee IDs
  const enrolledIds = React.useMemo(() => {
    return new Set(getEnrolledEmployees(enrollments).map((e) => e.employeeId))
  }, [enrollments])

  // Get available employees (not already enrolled)
  const availableEmployees = React.useMemo(() => {
    return allEmployees.filter(
      (employee) => !enrolledIds.has(String(employee.id))
    )
  }, [allEmployees, enrolledIds])

  const getUniqueGroups = () => {
    // Get groups from course
    const courseGroups = course.groups || groups || []

    // Only show groups that exist in the course
    return courseGroups
      .filter((g) => !isTemporaryGroupId(g.id))
      .map((group) => {
        // Make sure we're parsing the ID correctly
        let groupId: number
        if (typeof group.id === "string" && group.id.startsWith("g")) {
          groupId = parseInt(group.id.substring(1))
        } else {
          groupId = typeof group.id === "string" ? parseInt(group.id) : group.id
        }

        const enrolledInGroup = getEnrolledEmployees(enrollments).filter(
          (emp) => emp.courseGroupId === groupId
        )
        const capacity = group.capacity || 0
        const currentCount = enrolledInGroup.length
        const remaining = capacity === 0 ? Infinity : capacity - currentCount

        return {
          id: groupId,
          name: group.name || `Group ${groupId}`,
          count: currentCount,
          capacity: capacity,
          remaining: remaining,
        }
      })
      .sort((a, b) => a.id - b.id)
  }

  // Auto-select the first group if only one exists
  useEffect(() => {
    if (
      course.courseType === "trainer" &&
      selectedEmployees.length > 0 &&
      !selectedGroup
    ) {
      const groups = getUniqueGroups()
      if (groups.length === 1) {
        setSelectedGroup(String(groups[0].id))
      }
    }
  }, [selectedEmployees, course.courseType, selectedGroup])

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
  }, [searchQuery])

  // Add dropdown interaction handlers
  const handleDropdownOpenChange = (isOpen: boolean) => {
    // Clear any pending timer
    if (dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }

    if (isOpen) {
      setIsInteractingWithDropdown(true)
    } else {
      // Delay setting to false to prevent dialog from closing when clicking outside dropdown
      dropdownCloseTimer.current = setTimeout(() => {
        setIsInteractingWithDropdown(false)
        dropdownCloseTimer.current = null
      }, 150)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Don't close if we're interacting with a dropdown
    if (!newOpen && isInteractingWithDropdown) {
      return
    }
    // Clear any pending timer when dialog closes
    if (!newOpen && dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }
    if (!newOpen) {
      resetDialog()
    }
    onOpenChange(newOpen)
  }

  // Handle pointer down outside - only prevent if clicking on dropdown
  const handlePointerDownOutside = (e: Event) => {
    const target = e.target as HTMLElement
    // Allow closing when clicking on the overlay or outside
    // But prevent if clicking on dropdown items or the select trigger
    if (
      target.closest('[role="listbox"]') ||
      target.closest('[role="option"]') ||
      target.closest("[data-dropdown-trigger]")
    ) {
      e.preventDefault()
    }
  }

  const getFilteredData = () => {
    let filteredData: Employee[] = []

    // Show all available employees filtered by search query
    filteredData = availableEmployees.filter((employee) => {
      const searchLower = searchQuery.toLowerCase().trim()
      if (!searchLower) return true

      return (
        employee.name.toLowerCase().includes(searchLower) ||
        employee.email?.toLowerCase().includes(searchLower) ||
        employee.department?.toLowerCase().includes(searchLower) ||
        employee.team?.toLowerCase().includes(searchLower)
      )
    })

    return filteredData
  }

  const filteredData = getFilteredData()

  // Get visible learners with pagination
  const visibleLearners = filteredData.slice(0, visibleLearnersCount)
  const hasMoreLearners = visibleLearnersCount < filteredData.length

  // Handle scroll to load more
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      const bottom =
        target.scrollHeight - target.scrollTop <= target.clientHeight + 50

      if (bottom && hasMoreLearners && !isLoadingMoreRef.current) {
        isLoadingMoreRef.current = true
        setIsLoadingMore(true)

        setTimeout(() => {
          setVisibleLearnersCount((prev) => {
            const newCount = prev + AVAILABLE_LEARNERS_PER_PAGE
            return Math.min(newCount, filteredData.length)
          })
          setIsLoadingMore(false)
          setTimeout(() => {
            isLoadingMoreRef.current = false
          }, 100)
        }, 300)
      }
    },
    [hasMoreLearners, filteredData.length]
  )

  // Reset visible count when search dialog closes
  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery("")
      setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
      setIsLoadingMore(false)
      isLoadingMoreRef.current = false
    }
  }, [searchOpen])

  const clearSelection = () => {
    setSelectedEmployees([])
    setSelectedGroup("")
  }

  const clearSelectionAndClose = () => {
    setSelectedEmployees([])
    setSelectedGroup("")
    setViewAllOpen(false) // Close the view all dialog
  }

  const resetDialog = () => {
    setSelectedEmployees([])
    setSelectedGroup("")
    setSearchQuery("")
    setIsSubmitting(false)
    setProgress({ current: 0, total: 0 })
    setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
  }

  const handleEnroll = async () => {
    if (selectedEmployees.length === 0) {
      toast.warning("Please select at least one employee")
      return
    }

    // For trainer courses, ensure a group is selected and has capacity
    if (course.courseType === "trainer" && !selectedGroup) {
      const groups = getUniqueGroups()
      if (groups.length === 1) {
        setSelectedGroup(String(groups[0].id))
        setTimeout(() => {
          handleEnroll()
        }, 100)
        return
      }
      toast.warning("Please select a group for the employees")
      return
    }

    // Check if the selected group has enough capacity
    if (course.courseType === "trainer" && selectedGroup) {
      const groupId = parseInt(selectedGroup)
      const group = getUniqueGroups().find((g) => g.id === groupId)

      if (
        group &&
        group.capacity !== 0 &&
        group.remaining < selectedEmployees.length
      ) {
        toast.warning(
          `The selected group (${groupId}) only has ${group.remaining} spot${group.remaining > 1 ? "s" : ""} available, but you selected ${selectedEmployees.length} employee${selectedEmployees.length > 1 ? "s" : ""}. Please select a group with enough capacity or remove some employees.`
        )
        return
      }
    }

    setIsSubmitting(true)
    setProgress({ current: 0, total: selectedEmployees.length })

    const failedEmployees: string[] = []
    const successEmployees: string[] = []

    try {
      let groupId: number | undefined = undefined

      if (course.courseType === "trainer" && selectedGroup) {
        groupId = parseInt(selectedGroup)
      }
      // Process employees with sequential enrollment to avoid race conditions
      for (let i = 0; i < selectedEmployees.length; i++) {
        const employee = selectedEmployees[i]

        try {
          if (onEnrollEmployee) {
            await onEnrollEmployee(employee.id, groupId)
            successEmployees.push(employee.name)
          } else {
            throw new Error("Enroll function not available")
          }
        } catch (error: any) {
          console.error(` Failed to enroll ${employee.name}:`, error)
          failedEmployees.push(employee.name)
          if (error.message) {
            console.error("Error message:", error.message)
          }
        }

        // Update progress
        setProgress({ current: i + 1, total: selectedEmployees.length })

        // Add small delay between enrollments to avoid rate limiting
        if (i < selectedEmployees.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300))
        }
      }

      // Show results - ONLY ONCE at the end
      if (successEmployees.length > 0 && failedEmployees.length === 0) {
        toast.success(
          `${successEmployees.length} employee${successEmployees.length > 1 ? "s" : ""} enrolled successfully!`
        )
      } else if (successEmployees.length > 0 && failedEmployees.length > 0) {
        toast.success(
          ` Successfully enrolled ${successEmployees.length} employee${successEmployees.length > 1 ? "s" : ""}: ${successEmployees.join(", ")}\n\n Failed to enroll ${failedEmployees.length} employee${failedEmployees.length > 1 ? "s" : ""}: ${failedEmployees.join(", ")}`
        )
      } else if (successEmployees.length === 0 && failedEmployees.length > 0) {
        toast.error(
          `Failed to enroll all ${failedEmployees.length} employee${failedEmployees.length > 1 ? "s" : ""}. Please try again.`
        )
      }

      // Refresh enrollments data
      if (course.id) {
        await fetch_courseEnrollments(course.id)
      }

      if (onRefreshEnrollments) {
        await onRefreshEnrollments()
      }

      if (onAddComplete) {
        onAddComplete()
      }

      // Reset and close if all succeeded
      if (failedEmployees.length === 0) {
        resetDialog()
        onOpenChange(false)
      }
    } catch (error: any) {
      console.error(" Error in enrollment process:", error)
      toast.error(
        `Failed to enroll employees: ${error.message || "Unknown error"}`
      )
    } finally {
      setIsSubmitting(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  // Check if selected employees fit in the selected group
  const getGroupAvailability = () => {
    if (!selectedGroup || selectedEmployees.length === 0) return null

    const groupId = parseInt(selectedGroup)
    const group = getUniqueGroups().find((g) => g.id === groupId)

    if (!group) return null

    const remaining = group.capacity === 0 ? Infinity : group.remaining
    const willFit =
      remaining === Infinity || remaining >= selectedEmployees.length

    return {
      remaining,
      willFit,
      capacity: group.capacity,
    }
  }

  const availability = getGroupAvailability()

  return (
    <>
      {/* Add Learner Dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="flex max-h-[90vh] flex-col p-0 sm:max-w-[500px]"
          onPointerDownOutside={handlePointerDownOutside}
          onEscapeKeyDown={(e) => {
            // Prevent escape key from closing when dropdown is open
            if (isInteractingWithDropdown) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              Add Learners to Course
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="space-y-4">
              {/* Select Employees Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Select Employees <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchOpen(true)}
                      className="h-7 gap-1 text-xs"
                      disabled={isSubmitting || availableEmployees.length === 0}
                    >
                      <HugeiconsIcon
                        icon={PlusSignIcon}
                        strokeWidth={2}
                        className="h-3.5 w-3.5"
                      />
                      Add
                    </Button>
                    {selectedEmployees.length > 0 && !isSubmitting && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={clearSelection}
                        className="h-7 gap-1 text-xs"
                      >
                        <HugeiconsIcon
                          icon={CancelIcon}
                          strokeWidth={2}
                          className="h-3.5 w-3.5"
                        />
                        Remove All
                      </Button>
                    )}
                  </div>
                </div>

                {availableEmployees.length === 0 &&
                  selectedEmployees.length === 0 && (
                    <div className="rounded-lg border-2 border-dashed p-4 text-center">
                      <span className="text-sm text-muted-foreground">
                        All available employees are already enrolled
                      </span>
                    </div>
                  )}

                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedEmployees.length > 0 ? (
                    <>
                      {selectedEmployees.slice(0, 6).map((employee) => (
                        <Badge
                          key={employee.id}
                          variant="secondary"
                          className="flex cursor-pointer items-center px-2 py-1.5 text-sm font-normal hover:bg-muted/80"
                          onClick={() => !isSubmitting && setViewAllOpen(true)}
                        >
                          <span className="text-xs">{employee.name}</span>
                          {!isSubmitting && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedEmployees((prev) =>
                                  prev.filter((emp) => emp.id !== employee.id)
                                )
                                if (selectedEmployees.length === 1) {
                                  setSelectedGroup("")
                                }
                              }}
                              className="rounded-full p-0.5 transition-colors hover:bg-muted"
                            >
                              <HugeiconsIcon
                                icon={CancelIcon}
                                strokeWidth={2}
                                className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                              />
                            </button>
                          )}
                        </Badge>
                      ))}
                      {selectedEmployees.length > 6 && (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer px-3 py-1.5 text-sm font-medium hover:bg-muted/80"
                          onClick={() => !isSubmitting && setViewAllOpen(true)}
                        >
                          +{selectedEmployees.length - 6} more
                        </Badge>
                      )}
                    </>
                  ) : (
                    <div className="w-full rounded-lg border-2 border-dashed p-4 text-center">
                      <span className="text-sm text-muted-foreground">
                        No employees selected
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Select Group */}
              {course.courseType === "trainer" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Select Group <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedGroup}
                    onValueChange={(value) => {
                      setSelectedGroup(value)
                    }}
                    onOpenChange={handleDropdownOpenChange}
                    disabled={selectedEmployees.length === 0 || isSubmitting}
                  >
                    <SelectTrigger
                      className={cn(
                        "w-full",
                        (selectedEmployees.length === 0 || isSubmitting) &&
                          "cursor-not-allowed opacity-50"
                      )}
                    >
                      <SelectValue
                        placeholder={
                          selectedEmployees.length > 0
                            ? isSubmitting
                              ? "Processing..."
                              : "Choose a group"
                            : "Select employees first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {selectedEmployees.length === 0 ? (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            Please select employees first
                          </div>
                        ) : (
                          (() => {
                            const groups = getUniqueGroups()

                            if (!groups || groups.length === 0) {
                              return (
                                <div className="px-2 py-4 text-center text-sm text-yellow-600">
                                  ⚠️ No groups available.
                                </div>
                              )
                            }

                            return groups.map((group) => {
                              const willFit =
                                group.capacity === 0 ||
                                group.remaining >= selectedEmployees.length
                              const isFull =
                                group.capacity !== 0 && group.remaining === 0

                              return (
                                <SelectItem
                                  className="w-full"
                                  key={group.id}
                                  value={String(group.id)}
                                  disabled={false} // Always show all groups, even if full
                                >
                                  <div className="flex items-center gap-2">
                                    {group.name}
                                    <span className="text-xs text-muted-foreground">
                                      ({group.count}/
                                      {group.capacity === 0
                                        ? "∞"
                                        : group.capacity}
                                      ) learner{group.capacity > 1 ? "s" : ""}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {isFull && (
                                        <span className="text-red-500">
                                          (Full)
                                        </span>
                                      )}
                                      {!isFull && (
                                        <span className="text-green-500">
                                          (Available)
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </SelectItem>
                              )
                            })
                          })()
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex border-t p-6 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                resetDialog()
                onOpenChange(false)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={
                selectedEmployees.length === 0 ||
                (course.courseType === "trainer" && !selectedGroup) ||
                isSubmitting
              }
              onClick={handleEnroll}
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></span>
                  Enrolling ({progress.current}/{progress.total})...
                </>
              ) : (
                <>Enroll</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Search Command Dialog with Infinite Scroll - No Group Tabs */}
      <CommandDialog
        open={searchOpen}
        onOpenChange={(newOpen) => {
          setSearchOpen(newOpen)
          if (!newOpen) {
            setSearchQuery("")
            setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
          }
        }}
      >
        <Command shouldFilter={false}>
          <div className="border-b p-2">
            <CommandInput
              placeholder="Search employees by name, department or team..."
              value={searchQuery}
              onValueChange={(value) => {
                setSearchQuery(value)
                setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
              }}
              className="border-0 focus:ring-0"
            />
          </div>

          <CommandList
            ref={commandListRef}
            onScroll={handleScroll}
            className="max-h-[400px] overflow-y-auto"
          >
            <CommandEmpty>
              {searchQuery && filteredData.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No employees found matching "{searchQuery}"
                </div>
              ) : filteredData.length === 0 && !searchQuery ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No employees available to enroll
                </div>
              ) : null}
            </CommandEmpty>
            <CommandGroup className="gap-2">
              {visibleLearners.map((employee) => {
                const isSelected = selectedEmployees.some(
                  (selected) => selected.id === employee.id
                )
                return (
                  <CommandItem
                    key={employee.id}
                    onSelect={() => {
                      if (isSelected) {
                        setSelectedEmployees((prev) =>
                          prev.filter((emp) => emp.id !== employee.id)
                        )
                        if (selectedEmployees.length === 1) {
                          setSelectedGroup("")
                        }
                      } else {
                        setSelectedEmployees((prev) => [...prev, employee])
                      }
                    }}
                    className="group flex cursor-pointer items-center gap-2"
                  >
                    <Avatar className="h-8 w-8 rounded-full">
                      <AvatarImage src={employee.avatar || ""} />
                      <AvatarFallback className="text-xs">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="w-[80%] text-sm leading-tight">
                      <span className="truncate font-medium">
                        {employee.name}
                      </span>
                      <div className="flex max-w-full items-center gap-1 text-xs text-muted-foreground">
                        {employee.department && (
                          <span className="max-w-[45%] truncate">
                            {employee.department}
                          </span>
                        )}
                        {employee.department && employee.team && <span>•</span>}
                        {employee.team && (
                          <span className="max-w-[45%] truncate">
                            {employee.team}
                          </span>
                        )}
                      </div>
                    </div>
                    <CommandShortcut>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isSelected) {
                            setSelectedEmployees((prev) =>
                              prev.filter((emp) => emp.id !== employee.id)
                            )
                            if (selectedEmployees.length === 1) {
                              setSelectedGroup("")
                            }
                          } else {
                            setSelectedEmployees((prev) => [...prev, employee])
                          }
                        }}
                        className={`rounded-full p-1 ${isSelected ? "" : "opacity-0 transition-opacity group-hover:opacity-100"} hover:bg-muted`}
                      >
                        <HugeiconsIcon
                          icon={isSelected ? CancelIcon : PlusSignIcon}
                          strokeWidth={2}
                          className="h-4 w-4 text-muted-foreground hover:text-foreground"
                        />
                      </button>
                    </CommandShortcut>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            {/* Loading more indicator - matching sendMail design */}
            {hasMoreLearners && (
              <div className="mt-2 pt-2">
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="h-4 w-4 text-primary" />
                    <span>Loading more employees...</span>
                  </div>
                </div>
              </div>
            )}

            {/* All loaded indicator */}
            {!hasMoreLearners &&
              filteredData.length > 0 &&
              searchQuery.trim().length === 0 && (
                <div className="mt-2 border-t pt-2">
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    You've reached the end of the list ({filteredData.length}{" "}
                    employees)
                  </p>
                </div>
              )}

            {/* Search results count */}
            {searchQuery.trim().length > 0 && filteredData.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <p className="py-2 text-center text-xs text-muted-foreground">
                  Found {filteredData.length} employee
                  {filteredData.length !== 1 ? "s" : ""} matching "{searchQuery}
                  "
                </p>
              </div>
            )}
          </CommandList>
        </Command>
      </CommandDialog>

      {/* View All Selected Employees Dialog */}
      <CommandDialog open={viewAllOpen} onOpenChange={setViewAllOpen}>
        <Command>
          <div className="border-b px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Selected Employees ({selectedEmployees.length})
              </span>
              {!isSubmitting && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onPointerDown={(e) => {
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      clearSelectionAndClose()
                    }}
                    className="h-7 gap-1 text-xs"
                  >
                    <HugeiconsIcon
                      icon={CancelIcon}
                      strokeWidth={2}
                      className="h-3.5 w-3.5"
                    />
                    Remove All
                  </Button>
                </div>
              )}
            </div>
          </div>
          <CommandList>
            <CommandGroup>
              {selectedEmployees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  onSelect={() => {
                    if (!isSubmitting) {
                      setSelectedEmployees((prev) =>
                        prev.filter((emp) => emp.id !== employee.id)
                      )
                      if (selectedEmployees.length === 1) {
                        setSelectedGroup("")
                      }
                    }
                  }}
                  className="group flex cursor-pointer items-center gap-2"
                >
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage src={employee.avatar || ""} />
                    <AvatarFallback className="text-xs">
                      {getInitials(employee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-[80%] text-sm leading-tight">
                    <span className="truncate font-medium">
                      {employee.name}
                    </span>
                    <div className="flex max-w-full items-center gap-1 text-xs text-muted-foreground">
                      {employee.department && (
                        <span className="max-w-[45%] truncate">
                          {employee.department}
                        </span>
                      )}
                      {employee.department && employee.team && <span>•</span>}
                      {employee.team && (
                        <span className="max-w-[45%] truncate">
                          {employee.team}
                        </span>
                      )}
                    </div>
                  </div>
                  {!isSubmitting && (
                    <CommandShortcut>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEmployees((prev) =>
                            prev.filter((emp) => emp.id !== employee.id)
                          )
                          if (selectedEmployees.length === 1) {
                            setSelectedGroup("")
                          }
                        }}
                        className="rounded-full p-1 transition-colors hover:bg-muted"
                      >
                        <HugeiconsIcon
                          icon={CancelIcon}
                          strokeWidth={2}
                          className="h-4 w-4"
                        />
                      </button>
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {selectedEmployees.length === 0 && (
              <CommandEmpty>No employees selected.</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
