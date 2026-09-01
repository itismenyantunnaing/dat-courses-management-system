"use client"

import React, { useEffect, useState, useRef } from "react"
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
  Tabs as TabsComponent,
  TabsList as TabsListComponent,
  TabsTrigger as TabsTriggerComponent,
} from "@/components/ui/tabs"
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
import { cn, resolveUploadUrl } from "@/lib/utils"
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
  profilePhotoPath?: string
  groupChangeStatus?: string
  requestedCourseGroupId?: number
  requestedCourseGroupName?: string
}

interface ChangeGroupDialogsProps {
  course: Course
  enrollments: EnrolledEmployee[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupChangeComplete?: () => void
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

export function ChangeGroupDialogs({
  course,
  enrollments,
  open,
  onOpenChange,
  onGroupChangeComplete,
}: ChangeGroupDialogsProps) {
  const [selectedEmployeesForChange, setSelectedEmployeesForChange] = useState<
    EnrolledEmployee[]
  >([])
  const [selectedGroupForChange, setSelectedGroupForChange] =
    useState<string>("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchTab, setSearchTab] = useState<string>("")
  const [viewAllOpen, setViewAllOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  })
  // Add loading more state
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // Add dropdown interaction state
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)

  // Get the store functions
  const { adminChangeGroup, fetch_courseEnrollments } = mainStore()

  const getUniqueGroups = () => {
    const enrolledEmployees = getEnrolledEmployees(enrollments)
    const groupIds = [
      ...new Set(enrolledEmployees.map((emp) => emp.courseGroupId)),
    ]
    return groupIds
      .map((groupId) => {
        const group = course.groups?.find((g) => parseInt(g.id) === groupId)
        return {
          id: groupId,
          name: group?.name || `Group ${groupId}`,
          count: enrolledEmployees.filter(
            (emp) => emp.courseGroupId === groupId
          ).length,
        }
      })
      .sort((a, b) => Number(a.id) - Number(b.id))
  }

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
      resetChangeGroupDialog()
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

  // Set default tab to Group 1 when dialog opens
  useEffect(() => {
    if (searchOpen) {
      const groups = getUniqueGroups()
      if (groups.length > 0) {
        const group1 = groups.find((g) => Number(g.id) === 1)
        setSearchTab(String(group1?.id || groups[0].id))
      }
    }
  }, [searchOpen])

  const getFilteredData = () => {
    const enrolledEmployees = getEnrolledEmployees(enrollments)
    let filteredData: EnrolledEmployee[] = []

    if (searchTab) {
      const groupId = parseInt(searchTab)
      filteredData = enrolledEmployees.filter(
        (employee) =>
          employee.courseGroupId === groupId &&
          (employee.employeeName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
            employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.employeeId
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()))
      )
    }

    return filteredData
  }

  const filteredData = getFilteredData()

  const clearSelection = () => {
    setSelectedEmployeesForChange([])
    setSelectedGroupForChange("")
  }

  const clearSelectionAndClose = () => {
    setSelectedEmployeesForChange([])
    setSelectedGroupForChange("")
    setViewAllOpen(false) // Close the view all dialog
  }

  const resetChangeGroupDialog = () => {
    setSelectedEmployeesForChange([])
    setSelectedGroupForChange("")
    setSearchQuery("")
    setSearchTab("")
    setIsSubmitting(false)
    setProgress({ current: 0, total: 0 })
  }

  // Handle the actual group change - Individual API calls
  const handleGroupChange = async () => {
    if (selectedEmployeesForChange.length === 0 || !selectedGroupForChange) {
      return
    }

    setIsSubmitting(true)
    setProgress({ current: 0, total: selectedEmployeesForChange.length })

    const failedEmployees: string[] = []
    const successEmployees: string[] = []

    try {
      const newGroupId = parseInt(selectedGroupForChange)

      // Loop through each employee and change their group individually
      for (let i = 0; i < selectedEmployeesForChange.length; i++) {
        const employee = selectedEmployeesForChange[i]

        try {
          // Call the individual adminChangeGroup API
          const result = await adminChangeGroup(employee.id, newGroupId)

          if (result.success) {
            successEmployees.push(employee.employeeName)
          } else {
            failedEmployees.push(employee.employeeName)
          }
        } catch (error) {
          console.error(
            ` Failed to change group for ${employee.employeeName}:`,
            error
          )
          failedEmployees.push(employee.employeeName)
        }

        // Update progress
        setProgress({
          current: i + 1,
          total: selectedEmployeesForChange.length,
        })
      }

      // Show results
      let message = ""

      if (failedEmployees.length === 0) {
        toast.success(
          `${successEmployees.length} learner${successEmployees.length > 1 ? "s" : ""} moved successfully!`
        )
      } else if (successEmployees.length === 0) {
        toast.error(`Failed to move all learners. Please try again.`)
      } else {
        if (successEmployees.length > 0) {
          message += ` Successfully moved ${successEmployees.length} learner${successEmployees.length > 1 ? "s" : ""}: ${successEmployees.join(", ")}\n`
          toast.success(message)
        }
        if (failedEmployees.length > 0) {
          message += ` Failed to move ${failedEmployees.length} learner${failedEmployees.length > 1 ? "s" : ""}(s): ${failedEmployees.join(", ")}`
          toast.error(message)
        }
      }

      // Refresh enrollments data
      if (course.id) {
        await fetch_courseEnrollments(course.id)
      }

      // Call the callback if provided
      if (onGroupChangeComplete) {
        onGroupChangeComplete()
      }

      // Reset and close if all succeeded
      if (failedEmployees.length === 0) {
        resetChangeGroupDialog()
        onOpenChange(false)
      }
    } catch (error: any) {
      console.error(" Error in group change process:", error)
      toast.error(
        `Failed to change groups: ${error.message || "Unknown error"}`
      )
    } finally {
      setIsSubmitting(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  return (
    <>
      {/* Change Group Dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="flex max-h-[90vh] flex-col p-0 sm:max-w-[550px]"
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
              Change leaners
            </DialogTitle>
            <DialogDescription>
              Select learners and choose a new group for them.
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
                      disabled={isSubmitting}
                    >
                      <HugeiconsIcon
                        icon={PlusSignIcon}
                        strokeWidth={2}
                        className="h-3.5 w-3.5"
                      />
                      Add
                    </Button>
                    {selectedEmployeesForChange.length > 0 && !isSubmitting && (
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
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedEmployeesForChange.length > 0 ? (
                    <>
                      {selectedEmployeesForChange
                        .slice(0, 6)
                        .map((employee) => (
                          <Badge
                            key={employee.id}
                            variant="secondary"
                            className="flex cursor-pointer items-center px-2 py-1.5 text-sm font-normal hover:bg-muted/80"
                            onClick={() =>
                              !isSubmitting && setViewAllOpen(true)
                            }
                          >
                            <span className="text-xs">
                              {employee.employeeName}
                            </span>
                            {!isSubmitting && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedEmployeesForChange((prev) =>
                                    prev.filter((emp) => emp.id !== employee.id)
                                  )
                                  if (selectedEmployeesForChange.length === 1) {
                                    setSelectedGroupForChange("")
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
                      {selectedEmployeesForChange.length > 6 && (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer px-3 py-1.5 text-sm font-medium hover:bg-muted/80"
                          onClick={() => !isSubmitting && setViewAllOpen(true)}
                        >
                          +{selectedEmployeesForChange.length - 6} more
                        </Badge>
                      )}
                    </>
                  ) : (
                    <div className="w-full rounded-lg border-2 border-dashed p-4 text-center">
                      <span className="text-sm text-muted-foreground">
                        No employee selected
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Select Group - Shows all groups including full ones */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Select New Group <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedGroupForChange}
                  onValueChange={setSelectedGroupForChange}
                  onOpenChange={handleDropdownOpenChange}
                  disabled={
                    selectedEmployeesForChange.length === 0 || isSubmitting
                  }
                >
                  <SelectTrigger
                    className={cn(
                      "w-full",
                      (selectedEmployeesForChange.length === 0 ||
                        isSubmitting) &&
                        "cursor-not-allowed opacity-50"
                    )}
                  >
                    <SelectValue
                      placeholder={
                        selectedEmployeesForChange.length > 0
                          ? isSubmitting
                            ? "Processing..."
                            : "Choose a group..."
                          : "Select employees first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {selectedEmployeesForChange.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          Please select employees first
                        </div>
                      ) : (
                        (() => {
                          // Show ALL groups except the ones employees are currently in
                          const availableGroups = course.groups?.filter((g) => {
                            const groupId = parseInt(g.id)
                            if (isTemporaryGroupId(g.id)) return false
                            // Don't show groups that employees are already in
                            if (
                              selectedEmployeesForChange.some(
                                (e) => e.courseGroupId === groupId
                              )
                            )
                              return false
                            return true
                          })

                          if (
                            !availableGroups ||
                            availableGroups.length === 0
                          ) {
                            return (
                              <div className="px-2 py-4 text-center text-sm text-yellow-600">
                                ⚠️ No other groups available.
                              </div>
                            )
                          }

                          return availableGroups.map((group) => {
                            const groupId = parseInt(group.id)
                            const groupEmployees = enrollments.filter(
                              (e) =>
                                e.courseGroupId === groupId &&
                                e.enrollmentStatus !== "CANCELLED"
                            )
                            const capacity = group.capacity || 0
                            const currentCount = groupEmployees.length
                            const remaining = capacity - currentCount
                            const totalSelected =
                              selectedEmployeesForChange.length

                            // Check if group is full
                            const isFull =
                              capacity > 0 && remaining < totalSelected

                            return (
                              <SelectItem
                                key={group.id}
                                value={group.id}
                                disabled={isFull}
                                className={cn(
                                  isFull && "cursor-not-allowed opacity-60"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{group.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({currentCount}/
                                    {capacity === 0 ? "∞" : capacity}) learner
                                    {capacity > 1 ? "s" : ""}
                                    {isFull ? (
                                      <span className="ml-2 font-medium text-red-500">
                                        (Full)
                                      </span>
                                    ) : (
                                      <span className="ml-2 text-green-600">
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
            </div>
          </div>

          <DialogFooter className="flex border-t p-6 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                resetChangeGroupDialog()
                onOpenChange(false)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={
                selectedEmployeesForChange.length === 0 ||
                !selectedGroupForChange ||
                isSubmitting
              }
              onClick={handleGroupChange}
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></span>
                  Processing ({progress.current}/{progress.total})...
                </>
              ) : (
                <>Change</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Search Command Dialog */}
      <CommandDialog
        open={searchOpen}
        onOpenChange={(newOpen) => {
          setSearchOpen(newOpen)
          if (!newOpen) {
            setSearchQuery("")
          }
        }}
      >
        <Command>
          <div className="border-b py-2">
            <div className="px-1">
              <TabsComponent value={searchTab} onValueChange={setSearchTab}>
                <TabsListComponent
                  className="grid w-full"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(getUniqueGroups().length, 1)}, 1fr)`,
                  }}
                >
                  {getUniqueGroups().map((group) => (
                    <TabsTriggerComponent
                      key={group.id}
                      value={String(group.id)}
                      className="flex items-center gap-1 text-xs"
                    >
                      {group.name}
                    </TabsTriggerComponent>
                  ))}
                </TabsListComponent>
              </TabsComponent>
            </div>
            <CommandInput
              placeholder="Search employees..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>

          <CommandList>
            <CommandGroup>
              {filteredData.map((employee) => {
                const isSelected = selectedEmployeesForChange.some(
                  (selected) => selected.id === employee.id
                )
                return (
                  <CommandItem
                    key={employee.id}
                    onSelect={() => {
                      if (isSelected) {
                        setSelectedEmployeesForChange((prev) =>
                          prev.filter((emp) => emp.id !== employee.id)
                        )
                      } else {
                        setSelectedEmployeesForChange((prev) => [
                          ...prev,
                          employee,
                        ])
                      }
                    }}
                    className="group flex cursor-pointer items-center gap-2"
                  >
                    <Avatar className="h-8 w-8 rounded-full">
                      <AvatarImage
                        src={resolveUploadUrl(employee.profilePhotoPath)}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(employee.employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="w-[80%] text-sm leading-tight">
                      <span className="truncate font-medium">
                        {employee.employeeName}
                      </span>
                      <div className="flex max-w-full items-center gap-1 text-xs text-muted-foreground">
                        {employee.departmentName && (
                          <span className="max-w-[45%] truncate">
                            {employee.departmentName}
                          </span>
                        )}
                        {employee.departmentName && employee.teamName && (
                          <span>•</span>
                        )}
                        {employee.teamName && (
                          <span className="max-w-[45%] truncate">
                            {employee.teamName}
                          </span>
                        )}
                      </div>
                    </div>
                    <CommandShortcut>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isSelected) {
                            setSelectedEmployeesForChange((prev) =>
                              prev.filter((emp) => emp.id !== employee.id)
                            )
                          } else {
                            setSelectedEmployeesForChange((prev) => [
                              ...prev,
                              employee,
                            ])
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
            {filteredData.length === 0 && searchQuery && (
              <CommandEmpty>
                No employee found matching "{searchQuery}"
              </CommandEmpty>
            )}
            {filteredData.length === 0 && !searchQuery && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No employee in this group
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
                Selected Employees ({selectedEmployeesForChange.length})
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
              {selectedEmployeesForChange.map((employee) => (
                <CommandItem
                  key={employee.id}
                  onSelect={() => {
                    if (!isSubmitting) {
                      setSelectedEmployeesForChange((prev) =>
                        prev.filter((emp) => emp.id !== employee.id)
                      )
                      if (selectedEmployeesForChange.length === 1) {
                        setSelectedGroupForChange("")
                      }
                    }
                  }}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage
                      src={resolveUploadUrl(employee.profilePhotoPath)}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(employee.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-[80%] text-sm leading-tight">
                    <span className="truncate font-medium">
                      {employee.employeeName}
                    </span>
                    <div className="flex max-w-full items-center gap-1 text-xs text-muted-foreground">
                      {employee.departmentName && (
                        <span className="max-w-[45%] truncate">
                          {employee.departmentName}
                        </span>
                      )}
                      {employee.departmentName && employee.teamName && (
                        <span>•</span>
                      )}
                      {employee.teamName && (
                        <span className="max-w-[45%] truncate">
                          {employee.teamName}
                        </span>
                      )}
                    </div>
                  </div>
                  {!isSubmitting && (
                    <CommandShortcut>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEmployeesForChange((prev) =>
                            prev.filter((emp) => emp.id !== employee.id)
                          )
                          if (selectedEmployeesForChange.length === 1) {
                            setSelectedGroupForChange("")
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
            {selectedEmployeesForChange.length === 0 && (
              <CommandEmpty>No employees selected.</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
