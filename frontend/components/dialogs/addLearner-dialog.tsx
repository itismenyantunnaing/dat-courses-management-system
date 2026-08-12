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
  RefreshIcon,
  PlusSignIcon,
  CancelIcon,
  UserGroupIcon,
  UserAdd01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Course } from "@/types/course"
import { mainStore } from "@/store/mainStore"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

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
  onEnrollEmployee?: (employeeId: string | number, groupId?: number) => Promise<void>
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
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [visibleLearnersCount, setVisibleLearnersCount] = useState(AVAILABLE_LEARNERS_PER_PAGE)

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
    return allEmployees.filter((employee) => !enrolledIds.has(String(employee.id)))
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
        if (typeof group.id === 'string' && group.id.startsWith('g')) {
          groupId = parseInt(group.id.substring(1))
        } else {
          groupId = parseInt(String(group.id))
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

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
  }, [searchQuery])

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
        target.scrollHeight - target.scrollTop <= target.clientHeight + 10

      if (bottom && hasMoreLearners && !isLoadingMoreRef.current) {
        isLoadingMoreRef.current = true
        setVisibleLearnersCount((prev) => {
          const newCount = prev + AVAILABLE_LEARNERS_PER_PAGE
          return Math.min(newCount, filteredData.length)
        })
        setTimeout(() => {
          isLoadingMoreRef.current = false
        }, 200)
      }
    },
    [hasMoreLearners, filteredData.length]
  )

  // Reset visible count when search dialog closes
  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery("")
      setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
    }
  }, [searchOpen])

  const clearSelection = () => {
    setSelectedEmployees([])
    setSelectedGroup("")
  }

  const resetDialog = () => {
    onOpenChange(false)
    setSelectedEmployees([])
    setSelectedGroup("")
    setSearchQuery("")
    setIsSubmitting(false)
    setProgress({ current: 0, total: 0 })
    setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
  }

  // Handle the actual enrollment - Individual API calls
  const handleEnroll = async () => {
    if (selectedEmployees.length === 0 || !selectedGroup) {
      return
    }

    setIsSubmitting(true)
    setProgress({ current: 0, total: selectedEmployees.length })

    const failedEmployees: string[] = []
    const successEmployees: string[] = []

    try {
      // Parse the group ID - make sure we're using the correct value
      const groupId = parseInt(selectedGroup)
      
      console.log('📝 Enrolling to group:', groupId)

      // Loop through each employee and enroll them individually
      for (let i = 0; i < selectedEmployees.length; i++) {
        const employee = selectedEmployees[i]
        
        try {
          if (onEnrollEmployee) {
            // Pass the selected group ID
            await onEnrollEmployee(employee.id, groupId)
            successEmployees.push(employee.name)
          } else {
            throw new Error("Enroll function not available")
          }
        } catch (error) {
          console.error(`❌ Failed to enroll ${employee.name}:`, error)
          failedEmployees.push(employee.name)
        }

        // Update progress
        setProgress({ current: i + 1, total: selectedEmployees.length })
      }

      // Show results
      let message = ""
      if (successEmployees.length > 0) {
        message += `✅ Successfully enrolled ${successEmployees.length} employee(s): ${successEmployees.join(", ")}\n`
      }
      if (failedEmployees.length > 0) {
        message += `❌ Failed to enroll ${failedEmployees.length} employee(s): ${failedEmployees.join(", ")}`
      }

      if (failedEmployees.length === 0) {
        alert(`✅ All ${successEmployees.length} employee(s) enrolled successfully!`)
      } else if (successEmployees.length === 0) {
        alert(`❌ Failed to enroll all employees. Please try again.`)
      } else {
        alert(message)
      }

      // Refresh enrollments data
      if (course.id) {
        await fetch_courseEnrollments(course.id)
      }

      if (onRefreshEnrollments) {
        await onRefreshEnrollments()
      }

      // Call the callback if provided
      if (onAddComplete) {
        onAddComplete()
      }

      // Reset and close if all succeeded
      if (failedEmployees.length === 0) {
        resetDialog()
      }

    } catch (error: any) {
      console.error('❌ Error in enrollment process:', error)
      alert(`❌ Failed to enroll employees: ${error.message || 'Unknown error'}`)
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
    const willFit = remaining === Infinity || remaining >= selectedEmployees.length
    
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
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            resetDialog()
          }
          onOpenChange(open)
        }}
      >
        <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-[550px]">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon
                icon={UserAdd01Icon}
                strokeWidth={1.5}
                className="h-5 w-5"
              />
              Add Learners to Course
            </DialogTitle>
            <DialogDescription>
              Select employees and choose a group for them.
              {selectedEmployees.length > 0 && (
                <span className="ml-2 font-medium text-primary">
                  ({selectedEmployees.length} employee
                  {selectedEmployees.length > 1 ? "s" : ""} selected)
                </span>
              )}
              {isSubmitting && (
                <span className="ml-2 text-blue-600">
                  (Processing: {progress.current}/{progress.total})
                </span>
              )}
            </DialogDescription>
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
                
                {availableEmployees.length === 0 && selectedEmployees.length === 0 && (
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
                      console.log('Selected group value changed to:', value)
                      setSelectedGroup(value)
                    }}
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
                              : "Choose a group..."
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
                              const willFit = group.capacity === 0 || group.remaining >= selectedEmployees.length
                              const isFull = group.capacity !== 0 && group.remaining === 0

                              return (
                                <SelectItem
                                  key={group.id}
                                  value={String(group.id)}
                                  disabled={!willFit && group.capacity !== 0}
                                >
                                  <div className="flex w-full items-center justify-between">
                                    <span>{group.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {group.count}/
                                      {group.capacity === 0 ? "∞" : group.capacity} members
                                      {selectedEmployees.length > 0 && (
                                        <span
                                          className={cn(
                                            "ml-2",
                                            willFit
                                              ? "text-green-600"
                                              : "text-red-500"
                                          )}
                                        >
                                          {willFit
                                            ? `✓ ${selectedEmployees.length} will fit`
                                            : `✗ Only ${group.remaining} spots left`}
                                        </span>
                                      )}
                                      {isFull && (
                                        <span className="ml-1 text-red-500">
                                          (Full)
                                        </span>
                                      )}
                                      {!isFull && group.remaining > 0 && group.remaining <= 3 && group.capacity !== 0 && (
                                        <span className="ml-1 text-yellow-600">
                                          ({group.remaining} spot
                                          {group.remaining > 1 ? "s" : ""} left)
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
                  {selectedEmployees.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Please select employees first to see available groups
                    </p>
                  )}
                  {selectedEmployees.length > 0 && selectedGroup && availability && (
                    <div className={cn(
                      "rounded-lg border p-2 text-xs",
                      availability.willFit
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    )}>
                      <span className="font-medium">
                        {availability.willFit ? "✓" : "✗"} 
                        {" "}{selectedEmployees.length} employee
                        {selectedEmployees.length > 1 ? "s" : ""}
                      </span>
                      {" will be added to "}
                      <span className="font-medium">
                        {course.groups?.find(
                          (g) => g.id === selectedGroup
                        )?.name || selectedGroup}
                      </span>
                      {!availability.willFit && availability.capacity !== 0 && (
                        <span className="ml-1">
                          (Only {availability.remaining} spot{availability.remaining > 1 ? "s" : ""} available)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              {selectedEmployees.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={UserGroupIcon}
                        strokeWidth={1.5}
                        className="h-4 w-4 text-muted-foreground"
                      />
                      <span className="font-medium">
                        {selectedEmployees.length} employee
                        {selectedEmployees.length > 1 ? "s" : ""} selected
                      </span>
                      {selectedGroup && course.courseType === "trainer" && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium text-primary">
                            {course.groups?.find(
                              (g) => g.id === selectedGroup
                            )?.name || selectedGroup}
                          </span>
                        </>
                      )}
                    </div>
                    {!isSubmitting && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSelection}
                        className="h-7 px-2 text-xs"
                      >
                        <HugeiconsIcon
                          icon={CancelIcon}
                          strokeWidth={2}
                          className="mr-1 h-3 w-3"
                        />
                        Clear Selection
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedEmployees.slice(0, 5).map((emp) => (
                      <Badge
                        key={emp.id}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {emp.name}
                      </Badge>
                    ))}
                    {selectedEmployees.length > 5 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{selectedEmployees.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex border-t p-6 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={resetDialog}
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
                <>
                  <HugeiconsIcon
                    icon={UserAdd01Icon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                  Enroll ({selectedEmployees.length})
                </>
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
        <Command className="gap-3" shouldFilter={false}>
          <div className="border-b p-3">
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
                    className="group flex cursor-pointer items-center gap-3"
                  >
                    <Avatar className="h-8 w-8 rounded-full">
                      <AvatarImage src={employee.avatar || ""} />
                      <AvatarFallback className="rounded-full">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {employee.name}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="max-w-[45%] truncate">
                          {employee.department || "N/A"}
                        </span>
                        {employee.department && employee.team && (
                          <span>•</span>
                        )}
                        <span className="truncate">
                          {employee.team || "N/A"}
                        </span>
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

            {hasMoreLearners && (
              <div className="border-t p-4">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                    <span>Loading more employees...</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Showing {visibleLearners.length} of {filteredData.length} employees
                  </span>
                </div>
              </div>
            )}

            {!hasMoreLearners && filteredData.length > 0 && (
              <div className="border-t p-3 text-center text-xs text-muted-foreground">
                Showing all {filteredData.length} employees
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
                  className="flex cursor-pointer items-center gap-3"
                >
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage src={employee.avatar || ""} />
                    <AvatarFallback className="rounded-full">
                      {getInitials(employee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {employee.name}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="truncate">
                        {employee.department || "N/A"}
                      </span>
                      {employee.department && employee.team && (
                        <span>•</span>
                      )}
                      <span className="truncate">
                        {employee.team || "N/A"}
                      </span>
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