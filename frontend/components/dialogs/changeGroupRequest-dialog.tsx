// components/course/dialogs/changeGroupRequest-dialog.tsx
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
  RefreshIcon,
  PlusSignIcon,
  CancelIcon,
  UserGroupIcon,
  Loading01Icon,
  ArrowRight01Icon,
  AlertCircleIcon,
  CheckCircle,
  Time02Icon,
} from "@hugeicons/core-free-icons"
import { cn, resolveUploadUrl } from "@/lib/utils"
import { Course } from "@/types/course"
import { mainStore } from "@/store/mainStore"
import { toast } from "sonner"
import { dialog } from "./import-export-confirm-dialog"
import { Span } from "next/dist/trace"

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
  currentUserEnrollment?: any
  onRequestGroupChange?: (groupId: string) => void
  isRequesting?: boolean
}

const getGroupChangeStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-700 border-yellow-200"
    case "APPROVED":
      return "bg-green-100 text-green-700 border-green-200"
    case "REJECTED":
      return "bg-red-100 text-red-700 border-red-200"
    case "NONE":
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

const getGroupChangeStatusLabel = (status: string) => {
  switch (status) {
    case "PENDING":
      return "Pending Review"
    case "APPROVED":
      return "Approved"
    case "REJECTED":
      return "Rejected"
    case "NONE":
    default:
      return "Current Group"
  }
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

export function ChangeGroupRequestDialogs({
  course,
  enrollments,
  open,
  onOpenChange,
  onGroupChangeComplete,
  currentUserEnrollment,
  onRequestGroupChange,
  isRequesting = false,
}: ChangeGroupDialogsProps) {
  const [selectedRequestGroupId, setSelectedRequestGroupId] =
    useState<string>("")
  // Add dropdown interaction state
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)

  const handleRequest = async () => {
    if (!selectedRequestGroupId) {
      toast.warning("Please select a group to request")
      return
    }

    const selectedGroup = course.groups?.find(
      (g: any) => g.id === selectedRequestGroupId
    )
    const groupName = selectedGroup?.name || `Group ${selectedRequestGroupId}`


    if (onRequestGroupChange) {
      onRequestGroupChange(selectedRequestGroupId)
    }
  }

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

  const { adminChangeGroup, fetch_courseEnrollments } = mainStore()

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

  const resetChangeGroupDialog = () => {
    onOpenChange(false)
    setSelectedEmployeesForChange([])
    setSelectedGroupForChange("")
    setSearchQuery("")
    setSearchTab("")
    setIsSubmitting(false)
    setProgress({ current: 0, total: 0 })
  }

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

      for (let i = 0; i < selectedEmployeesForChange.length; i++) {
        const employee = selectedEmployeesForChange[i]

        try {
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

        setProgress({
          current: i + 1,
          total: selectedEmployeesForChange.length,
        })
      }

      let message = ""

      if (failedEmployees.length === 0) {
        toast.success(
          ` All ${successEmployees.length} employee(s) moved successfully!`
        )
      } else if (successEmployees.length === 0) {
        toast.error(`Failed to move all employees. Please try again.`)
      } else {
        if (successEmployees.length > 0) {
          message += ` Successfully moved ${successEmployees.length} employee(s): ${successEmployees.join(", ")}\n`
          toast.success(message)
        }
        if (failedEmployees.length > 0) {
          message += ` Failed to move ${failedEmployees.length} employee(s): ${failedEmployees.join(", ")}`
          toast.error(message)
        }
      }

      if (course.id) {
        await fetch_courseEnrollments(course.id)
      }

      if (onGroupChangeComplete) {
        onGroupChangeComplete()
      }

      if (failedEmployees.length === 0) {
        resetChangeGroupDialog()
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

  // Helper function to get group capacity info
  const getGroupCapacityInfo = (groupId: string) => {
    const group = course.groups?.find((g: any) => g.id === groupId)
    if (!group) return null

    const groupIdNum = parseInt(groupId)
    const groupEmployees = enrollments.filter(
      (e) =>
        e.courseGroupId === groupIdNum && e.enrollmentStatus !== "CANCELLED"
    )
    const capacity = group.capacity || 0
    const currentCount = groupEmployees.length
    const remaining = capacity - currentCount
    const isFull = capacity > 0 && remaining <= 0

    return { capacity, currentCount, remaining, isFull }
  }

  return (
    <>
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
              Request Group Change
            </DialogTitle>
            <DialogDescription>
              Request to move to a different group. An admin will review your
              request.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-2">
            <div className="space-y-4">
              {/* Select New Group with Capacity */}
              <div className="mt-4 space-y-2">
                {currentUserEnrollment?.groupChangeStatus !== "PENDING" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select New Group</Label>
                      <Select
                        value={selectedRequestGroupId}
                        onValueChange={setSelectedRequestGroupId}
                        disabled={isRequesting}
                        onOpenChange={handleDropdownOpenChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a group..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {course.groups?.map((group: any) => {
                              const groupId = group.id
                              const groupIdNum = parseInt(groupId)
                              const isCurrentGroup =
                                groupIdNum ===
                                currentUserEnrollment?.courseGroupId

                              const capacityInfo = getGroupCapacityInfo(groupId)
                              const isFull = capacityInfo?.isFull || false
                              const currentCount =
                                capacityInfo?.currentCount || 0
                              const capacity = capacityInfo?.capacity || 0

                              return (
                                <SelectItem
                                  key={group.id}
                                  value={group.id}
                                  disabled={isCurrentGroup}
                                >
                                  <div className="flex w-full items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">
                                        {group.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        ({currentCount}/
                                        {capacity === 0 ? "∞" : capacity}){" "}
                                        learner{capacity > 1 && "s"}
                                      </span>
                                      {isFull && !isCurrentGroup && capacity > 0 && (
                                        <span className="text-xs text-red-500">
                                          (Full)
                                        </span>
                                      )}
                                      {!isFull && !isCurrentGroup && (
                                        <span className="text-xs text-green-500">
                                          (Available)
                                        </span>
                                      )}
                                      {isCurrentGroup && (
                                        <span className="text-xs text-gray-500">
                                          (Current)
                                        </span>
                                      )}
                                      {capacity === 0 && (
                                        <Badge
                                          variant="outline"
                                          className="border-blue-200 text-[10px] text-blue-700"
                                        >
                                          (Unlimited)
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {/* {selectedRequestGroupId && (
                        <div className="rounded-lg border bg-blue-50 p-2 text-xs text-blue-700">
                          <span className="font-medium">
                            Requesting to move to:
                          </span>{" "}
                          {
                            course.groups?.find(
                              (g: any) => g.id === selectedRequestGroupId
                            )?.name
                          }
                          {(() => {
                            const info = getGroupCapacityInfo(
                              selectedRequestGroupId
                            )
                            if (info) {
                              return (
                                <span className="ml-2 text-muted-foreground">
                                  ({info.currentCount}/
                                  {info.capacity === 0 ? "∞" : info.capacity}{" "}
                                  members
                                  {info.isFull &&
                                    info.capacity > 0 &&
                                    " - Full"}
                                  {!info.isFull &&
                                    info.capacity > 0 &&
                                    ` - ${info.remaining} spots available`}
                                  {info.capacity === 0 && " - Unlimited"})
                                </span>
                              )
                            }
                            return null
                          })()}
                        </div>
                      )} */}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg p-4 text-center">
                    <HugeiconsIcon
                      icon={Time02Icon}
                      strokeWidth={2}
                      className="mx-auto mb-2 h-8 w-8 text-yellow-600"
                    />
                    <p className="text-sm text-yellow-600">
                      Pending request to
                    </p>
                    <p className="mt-1 text-xl font-medium text-yellow-600">
                      {currentUserEnrollment?.requestedCourseGroupName}
                    </p>
                    <p className="mt-4 px-10 text-xs text-muted-foreground">
                      Your group change request is being reviewed by an admin.
                      You will be notified when it's approved or rejected.
                    </p>
                  </div>
                )}

                {currentUserEnrollment?.groupChangeStatus === "APPROVED" && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                    <HugeiconsIcon
                      icon={CheckCircle}
                      strokeWidth={2}
                      className="mx-auto mb-2 h-8 w-8 text-green-600"
                    />
                    <p className="text-sm font-medium text-green-700">
                      Request Approved!
                    </p>
                    <p className="mt-1 text-xs text-green-600">
                      Your group change has been approved. You are now in:{" "}
                      {currentUserEnrollment?.courseGroupName}
                    </p>
                  </div>
                )}

                {currentUserEnrollment?.groupChangeStatus === "REJECTED" && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                    <HugeiconsIcon
                      icon={AlertCircleIcon}
                      strokeWidth={2}
                      className="mx-auto mb-2 h-8 w-8 text-red-600"
                    />
                    <p className="text-sm font-medium text-red-700">
                      Request Rejected
                    </p>
                    <p className="mt-1 px-12 text-xs text-red-600">
                      Your previous group change request was rejected. You can submit a
                      new request.
                    </p>
                  </div>
                )}
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
            {currentUserEnrollment?.groupChangeStatus !== "PENDING" && (
              <Button
                onClick={handleRequest}
                disabled={!selectedRequestGroupId || isRequesting}
                className="flex-1 gap-2"
              >
                {isRequesting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                    Submitting Request...
                  </>
                ) : (
                  <>Submit Group Request</>
                )}
              </Button>
            )}
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
            <CommandEmpty>No results found.</CommandEmpty>
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
                    className="group flex cursor-pointer items-center gap-3"
                  >
                    <Avatar className="h-8 w-8 rounded-full">
                      <AvatarImage
                        src={resolveUploadUrl(employee.profilePhotoPath)}
                      />
                      <AvatarFallback className="rounded-full">
                        {getInitials(employee.employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {employee.employeeName}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="max-w-[45%] truncate">
                          {employee.departmentName || "N/A"}
                        </span>
                        {employee.departmentName && employee.teamName && (
                          <span>•</span>
                        )}
                        <span className="truncate">
                          {employee.teamName || "N/A"}
                        </span>
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
                No employees found matching "{searchQuery}"
              </CommandEmpty>
            )}
            {filteredData.length === 0 && !searchQuery && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No employees in this group
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
                    onClick={() => {
                      setSelectedEmployeesForChange([])
                      setSelectedGroupForChange("")
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
                    <AvatarFallback className="rounded-full">
                      {getInitials(employee.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {employee.employeeName}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="truncate">
                        {employee.departmentName || "N/A"}
                      </span>
                      {employee.departmentName && employee.teamName && (
                        <span>•</span>
                      )}
                      <span className="truncate">
                        {employee.teamName || "N/A"}
                      </span>
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
