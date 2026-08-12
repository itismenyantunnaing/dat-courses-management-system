"use client"

import React from "react"
import { resolveUploadUrl } from "@/lib/utils"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar05Icon,
  User02Icon,
  Calendar03Icon,
  Alert01Icon,
  Tick02Icon,
  ChevronDownIcon,
  LoaderCircle,
} from "@hugeicons/core-free-icons"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface GroupsTabProps {
  course: any
  enrollments: any[]
  userRole: string
  currentUserId: string | null
  currentUserEnrollment: any
  profile?: any
  attendanceRecords: any[]
  attendanceStatuses: Record<string, string>
  savingAttendance: Record<string, boolean>
  savedAttendance: Record<string, boolean>
  loadingAttendanceGroups?: Record<number, boolean>
  onAttendanceChange: (
    sessionId: string,
    employeeId: string,
    value: string,
    enrollmentId: number,
    groupId: number
  ) => void
}

const getInitials = (name: string) => {
  if (!name) return "??"
  const parts = name.split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const truncateText = (text: string, maxLength: number = 30) => {
  if (!text) return ""
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
}

const capitalizeFirstLetter = (str: string) => {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Attendance status options with labels and icons
const ATTENDANCE_OPTIONS = [
  { value: "PRESENT", label: "Present", icon: "✅" },
  { value: "ABSENT", label: "Absent", icon: "❌" },
  { value: "LATE", label: "Late", icon: "⏰" },
  { value: "EXCUSED", label: "Excused", icon: "📝" },
]

export function GroupsTab({
  course,
  enrollments,
  userRole,
  currentUserId,
  currentUserEnrollment,
  profile,
  attendanceRecords,
  attendanceStatuses,
  savingAttendance,
  savedAttendance,
  loadingAttendanceGroups = {},
  onAttendanceChange,
}: GroupsTabProps) {
  // Check if user is admin
  const isAdmin = userRole === "admin"

  // Check if user is an approver (includes Approver, Division_Head, Department_Head)
  const isApprover = userRole === "approver" ||
    userRole === "division_head" ||
    userRole === "department_head"

  // Check if user is a learner
  const isLearner = userRole === "learner"

  // Check if user is Department_Head specifically
  const isDepartmentHead = userRole === "department_head"
  const isDivisionHead = userRole === "division_head"

  // Check if user has admin or approver permissions (can see all groups)
  const canViewAllGroups = isAdmin || isApprover

  const TESTING_DATE = new Date()
  // const TESTING_DATE = new Date("2026-08-13")

  const getEmployeesByGroup = (groupId: number) => {
    let employees = enrollments.filter(
      (emp) =>
        emp.courseGroupId === groupId && emp.enrollmentStatus !== "CANCELLED"
    )

    // For Department_Head, filter by department
    if (isDepartmentHead && profile?.deptDat) {
      employees = employees.filter(
        (emp) => emp.departmentName === profile.deptDat
      )
    }

    // if (isDivisionHead && profile) {
    //   employees = employees.filter(
    //     (emp) => emp.departmentName === profile.deptDat
    //   )
    // }


    return employees
  }

  const getUniqueStatuses = (employees: any[]) => {
    const statuses = employees
      .filter((emp) => emp.enrollmentStatus !== "CANCELLED")
      .map((emp) => emp.enrollmentStatus)
    return [...new Set(statuses)]
  }

  const getEmployeesByStatus = (employees: any[], status: string) => {
    return employees.filter(
      (emp) =>
        emp.enrollmentStatus === status && emp.enrollmentStatus !== "CANCELLED"
    )
  }

  const getAttendanceForSession = (sessionId: number, enrollmentId: number) => {
    return attendanceRecords.find(
      (record) =>
        record.courseSessionId === sessionId &&
        record.enrollmentId === enrollmentId
    )
  }

  // Get display label for attendance status
  const getAttendanceLabel = (status: string) => {
    const option = ATTENDANCE_OPTIONS.find((opt) => opt.value === status)
    return option ? `${option.icon} ${option.label}` : status
  }

  // Check if the first session is upcoming
  const isFirstSessionUpcoming = (sessions: any[]) => {
    if (!sessions || sessions.length === 0) return false
    const sortedSessions = [...sessions].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateA - dateB
    })
    const firstSession = sortedSessions[0]
    if (!firstSession || !firstSession.date) return false
    const currentDate = TESTING_DATE || new Date()
    const sessionDate = new Date(firstSession.date)
    return sessionDate.getTime() > currentDate.getTime()
  }

  // Check if a group has any employees from the department
  const hasDepartmentEmployees = (groupId: number) => {
    if (!isDepartmentHead || !profile?.deptDat) return true

    const groupEmployees = enrollments.filter(
      (emp) =>
        emp.courseGroupId === groupId &&
        emp.enrollmentStatus !== "CANCELLED" &&
        emp.departmentName === profile.deptDat
    )

    return groupEmployees.length > 0
  }

  return (
    <TabsContent value="groups" className="pt-4">
      <div className="space-y-6">
        {course.groups
          .filter((group: any) => {
            // Admin can see all groups
            if (isAdmin) return true

            // Department_Head: only show groups that have at least one employee from their department
            if (isDepartmentHead) {
              const groupId = parseInt(group.id)
              return hasDepartmentEmployees(groupId)
            }

            // Approver (non-department_head) can see all groups
            if (isApprover) return true

            // Learners can only see their enrolled group
            if (isLearner && currentUserEnrollment) {
              return parseInt(group.id) === currentUserEnrollment.courseGroupId
            }
            return false
          })
          .map((group: any, index: number) => {
            const groupId = parseInt(group.id)
            const groupEmployees = getEmployeesByGroup(groupId)
            const uniqueStatuses = getUniqueStatuses(groupEmployees)
            const isLoadingAttendance = loadingAttendanceGroups[groupId] || false

            // Check if first session is upcoming
            const firstSessionUpcoming = isFirstSessionUpcoming(group.sessions)

            return (
              <div key={index} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold">{group.name}</h4>
                      <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>
                          <span className="font-medium">Capacity:</span>{" "}
                          {group.capacity === undefined
                            ? "Unlimited"
                            : group.capacity}
                        </span>
                        <span>
                          <span className="font-medium">Enrolled:</span>{" "}
                          {groupEmployees.length}

                        </span>
                        <span>
                          <span className="font-medium">Sessions:</span>{" "}
                          {group.sessions.length}
                        </span>
                        <span>
                          <span className="font-medium">Start:</span>{" "}
                          {group.startDate
                            ? format(group.startDate, "MMM d, yyyy")
                            : "TBD"}
                        </span>
                        {group.endDate && (
                          <span>
                            <span className="font-medium">End:</span>{" "}
                            {format(group.endDate, "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLoadingAttendance && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <HugeiconsIcon
                            icon={LoaderCircle}
                            strokeWidth={2}
                            className="h-3 w-3 animate-spin"
                          />
                          Loading...
                        </Badge>
                      )}
                      <Badge
                        variant={
                          group.status === "ACTIVE" ? "default" : "secondary"
                        }
                      >
                        {group.status || "Active"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* Group Sessions - Always show sessions but hide attendance table if first session is upcoming */}
                  <div className="mb-4">
                    <h5 className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <HugeiconsIcon
                        icon={Calendar05Icon}
                        strokeWidth={1.5}
                        className="h-4 w-4"
                      />
                      Sessions & Attendance ({group.sessions.length})
                      {isLoadingAttendance && (
                        <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                      )}
                    </h5>

                    {/* Show sessions for all users with access */}
                    {(isLearner || canViewAllGroups) && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {group.sessions.map((session: any, idx: number) => {
                          const sessionId = session.id
                          const sessionDate = session.date
                            ? new Date(session.date)
                            : null
                          const currentDate = TESTING_DATE || new Date()

                          const isFutureSession = sessionDate
                            ? sessionDate.getTime() > currentDate.getTime()
                            : false
                          const isToday = sessionDate
                            ? sessionDate.toDateString() ===
                            currentDate.toDateString()
                            : false
                          const isPast = sessionDate
                            ? sessionDate.getTime() < currentDate.getTime() &&
                            !isToday
                            : false
                          const isOverdue = isPast && !isToday

                          // Only restrict editing for future sessions
                          const isSessionLocked = isFutureSession

                          // Allow editing for all users (admins, approvers, learners) except for future sessions
                          const canEditAttendance =
                            !isFutureSession && // Can edit if not future
                            (isAdmin || isApprover || isLearner) // All roles can edit

                          return (
                            <Card
                              key={idx}
                              className={cn(
                                "border-muted bg-muted/5",
                                isFutureSession &&
                                (isLearner || isApprover) &&
                                "opacity-70",
                                isOverdue &&
                                isLearner &&
                                "border-red-200 bg-red-50/5",
                                isOverdue &&
                                isAdmin &&
                                "border-orange-200 bg-orange-50/5",
                                isFutureSession &&
                                isAdmin &&
                                "border-blue-200 bg-blue-50/5"
                              )}
                            >
                              <div className="p-3">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium">
                                      Session {session.sessionNo || idx + 1}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {sessionDate
                                        ? format(sessionDate, "MMM d, yyyy")
                                        : "TBD"}
                                    </span>
                                    {session.startTime && session.endTime && (
                                      <span className="text-xs text-muted-foreground">
                                        {session.startTime} - {session.endTime}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {session.status || ""}
                                    </Badge>
                                    {isFutureSession && (
                                      <Badge className="bg-blue-500 text-[10px] text-white">
                                        Upcoming
                                      </Badge>
                                    )}
                                    {isOverdue && (
                                      <Badge className="bg-red-500 text-[10px] text-white">
                                        Overdue
                                      </Badge>
                                    )}
                                    {isToday && (
                                      <Badge className="bg-green-500 text-[10px] text-white">
                                        Today
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {isSessionLocked && (
                                  <div className="mb-2 flex items-center gap-1 text-xs">
                                    <span className="flex items-center gap-1 text-blue-500">
                                      <HugeiconsIcon
                                        icon={Calendar03Icon}
                                        strokeWidth={2}
                                        className="h-3 w-3"
                                      />
                                      Coming Soon - Attendance will be available when session starts
                                    </span>
                                  </div>
                                )}

                                {/* Attendance Table - Hidden if first session is upcoming */}
                                {!firstSessionUpcoming ? (
                                  isLoadingAttendance ? (
                                    <div className="flex items-center justify-center py-8">
                                      <div className="text-center">
                                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                          Loading attendance data...
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      {groupEmployees.length > 0 ? (
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="border-b">
                                              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                                                Employee
                                              </th>
                                              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                                                Department
                                              </th>
                                              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                                                Status
                                              </th>
                                              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                                                Action
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {groupEmployees
                                              .filter((employee) => {
                                                // Learners can only see themselves
                                                if (isLearner) {
                                                  return (
                                                    employee.employeeId ===
                                                    currentUserId
                                                  )
                                                }
                                                // Department_Head: only see employees from their department
                                                if (isDepartmentHead && profile?.deptDat) {
                                                  return (
                                                    employee.departmentName === profile.deptDat
                                                  )
                                                }
                                                // Approver (non-department_head) can see all
                                                if (isApprover) {
                                                  return true
                                                }
                                                // Admins can see all
                                                if (isAdmin) {
                                                  return true
                                                }
                                                return false
                                              })
                                              .map((employee) => {
                                                const attendance =
                                                  getAttendanceForSession(
                                                    parseInt(sessionId),
                                                    employee.id
                                                  )
                                                const key = `${sessionId}-${employee.id}`
                                                const currentStatus =
                                                  attendanceStatuses[key] ||
                                                  attendance?.attendanceStatus ||
                                                  ""
                                                const isSaving =
                                                  savingAttendance[key] || false

                                                // Check if user can edit this specific employee's attendance
                                                const canEdit =
                                                  canEditAttendance && (
                                                    // Admin can edit all
                                                    isAdmin ||
                                                    // Department_Head can edit employees in their department
                                                    (isDepartmentHead &&
                                                     profile?.deptDat &&
                                                     employee.departmentName === profile.deptDat) ||
                                                    // Approver (non-department_head) can ONLY edit their own attendance
                                                    (isApprover && !isDepartmentHead &&
                                                      employee.employeeId === currentUserId) ||
                                                    // Learner can only edit their own
                                                    (isLearner &&
                                                      employee.employeeId === currentUserId)
                                                  )

                                                return (
                                                  <tr
                                                    key={employee.id}
                                                    className="border-b border-muted/50"
                                                  >
                                                    <td className="px-2 py-2">
                                                      <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                          <AvatarImage
                                                            src={resolveUploadUrl(employee.profilePhotoPath)}
                                                          />
                                                          <AvatarFallback className="text-[10px]">
                                                            {getInitials(
                                                              employee.employeeName
                                                            )}
                                                          </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs font-medium">
                                                          {truncateText(
                                                            employee.employeeName,
                                                            20
                                                          )}
                                                        </span>
                                                      </div>
                                                    </td>
                                                    <td className="px-2 py-2 text-xs text-muted-foreground">
                                                      {truncateText(
                                                        employee.departmentName,
                                                        20
                                                      )}
                                                    </td>
                                                    <td className="px-2 py-2">
                                                      {attendance &&
                                                        attendance.attendanceStatus ? (
                                                        <Badge className="border-green-200 bg-green-100 text-[10px] text-green-700">
                                                          {getAttendanceLabel(
                                                            attendance.attendanceStatus
                                                          )}
                                                        </Badge>
                                                      ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                          {isFutureSession
                                                            ? "Pending"
                                                            : "Not recorded"}
                                                        </span>
                                                      )}
                                                    </td>
                                                    <td className="px-2 py-2">
                                                      {canEdit ? (
                                                        <div className="flex items-center gap-2">
                                                          <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                              className={cn(
                                                                "flex h-7 w-[130px] items-center justify-between rounded-md border bg-background px-2 text-xs",
                                                                isSaving &&
                                                                "cursor-not-allowed opacity-50",
                                                                isSessionLocked &&
                                                                "cursor-not-allowed opacity-50"
                                                              )}
                                                              disabled={
                                                                isSaving ||
                                                                isSessionLocked
                                                              }
                                                            >
                                                              <span>
                                                                {currentStatus
                                                                  ? getAttendanceLabel(
                                                                    currentStatus
                                                                  )
                                                                  : "Select status"}
                                                              </span>
                                                              <HugeiconsIcon
                                                                icon={
                                                                  ChevronDownIcon
                                                                }
                                                                strokeWidth={2}
                                                                className="h-3 w-3"
                                                              />
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                              align="start"
                                                              className="w-[150px]"
                                                            >
                                                              {ATTENDANCE_OPTIONS.map(
                                                                (option) => (
                                                                  <DropdownMenuItem
                                                                    key={
                                                                      option.value
                                                                    }
                                                                    onClick={() =>
                                                                      onAttendanceChange(
                                                                        sessionId,
                                                                        employee.id.toString(),
                                                                        option.value,
                                                                        employee.id,
                                                                        groupId
                                                                      )
                                                                    }
                                                                    className={cn(
                                                                      "text-xs",
                                                                      currentStatus ===
                                                                      option.value &&
                                                                      "bg-accent"
                                                                    )}
                                                                  >
                                                                    <span className="mr-2">
                                                                      {
                                                                        option.icon
                                                                      }
                                                                    </span>
                                                                    {
                                                                      option.label
                                                                    }
                                                                    {currentStatus ===
                                                                      option.value && (
                                                                        <HugeiconsIcon
                                                                          icon={
                                                                            Tick02Icon
                                                                          }
                                                                          strokeWidth={
                                                                            2
                                                                          }
                                                                          className="ml-auto h-3 w-3"
                                                                        />
                                                                      )}
                                                                  </DropdownMenuItem>
                                                                )
                                                              )}
                                                            </DropdownMenuContent>
                                                          </DropdownMenu>
                                                          {isSaving ? (
                                                            <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-primary"></span>
                                                          ) : savedAttendance[
                                                            key
                                                          ] ? (
                                                            <span className="text-green-500">
                                                              ✓
                                                            </span>
                                                          ) : null}
                                                        </div>
                                                      ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                          {isFutureSession
                                                            ? "Coming Soon"
                                                            : ""}
                                                        </span>
                                                      )}
                                                    </td>
                                                  </tr>
                                                )
                                              })}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                          {isDepartmentHead
                                            ? "No employees from your department are enrolled in this group yet."
                                            : "No employees enrolled in this group yet."}
                                        </div>
                                      )}
                                    </div>
                                  )
                                ) : (
                                  <div className="py-6 text-center text-sm text-muted-foreground">
                                    Attendance tracking will be available after the first session starts.
                                  </div>
                                )}
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            )
          })}

        {isLearner && !currentUserEnrollment && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              You are not enrolled in any group for this course.
            </p>
          </div>
        )}

        {isDepartmentHead && course.groups && course.groups.length > 0 && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Showing groups with employees from your department ({profile?.deptDat || "Unknown Department"})
          </div>
        )}
      </div>
    </TabsContent>
  )
}