// components/course/tabs/GroupsTab.tsx
"use client"

import React from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tabs as TabsComponent,
  TabsList as TabsListComponent,
  TabsTrigger as TabsTriggerComponent,
  TabsContent as TabsContentComponent,
} from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar05Icon,
  User02Icon,
  Calendar03Icon,
  Alert01Icon,
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
  onAttendanceChange,
}: GroupsTabProps) {
  const isAdmin = userRole === "admin"
  const isLearner = userRole === "learner"
  const isApprover = userRole === "approver"
  const TESTING_DATE = new Date("2026-08-4")

  const getEmployeesByGroup = (groupId: number) => {
    return enrollments.filter(
      (emp) =>
        emp.courseGroupId === groupId && emp.enrollmentStatus !== "CANCELLED"
    )
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

  return (
    <TabsContent value="groups" className="pt-4">
      <div className="space-y-6">
        {course.groups
          .filter((group: any) => {
            if (isAdmin || isApprover) return true
            if (isLearner && currentUserEnrollment) {
              return parseInt(group.id) === currentUserEnrollment.courseGroupId
            }
            return false
          })
          .map((group: any, index: number) => {
            const groupEmployees = getEmployeesByGroup(parseInt(group.id))
            const uniqueStatuses = getUniqueStatuses(groupEmployees)

            return (
              <Card key={index} className="overflow-hidden">
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
                    <Badge
                      variant={
                        group.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {group.status || "Active"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* Group Sessions with Attendance */}
                  <div className="mb-4">
                    <h5 className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <HugeiconsIcon
                        icon={Calendar05Icon}
                        strokeWidth={1.5}
                        className="h-4 w-4"
                      />
                      Sessions & Attendance ({group.sessions.length})
                    </h5>

                    {(userRole === "learner" || isAdmin || isApprover) && (
                      <div className="space-y-4">
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

                          const canEditAttendance =
                            isAdmin ||
                            (userRole === "learner" && (isToday || isPast))
                          const isSessionLocked =
                            userRole === "learner" &&
                            (isFutureSession || isOverdue)

                          return (
                            <Card
                              key={idx}
                              className={cn(
                                "border-muted bg-muted/5",
                                isFutureSession &&
                                  userRole === "learner" &&
                                  "opacity-70",
                                isOverdue &&
                                  userRole === "learner" &&
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
                                <div className="mb-3 flex items-center justify-between">
                                  <div className="flex items-center gap-4">
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
                                  {isSessionLocked &&
                                    userRole === "learner" && (
                                      <div className="flex items-center gap-1 text-xs">
                                        {isFutureSession ? (
                                          <span className="flex items-center gap-1 text-blue-500">
                                            <HugeiconsIcon
                                              icon={Calendar03Icon}
                                              strokeWidth={2}
                                              className="h-3 w-3"
                                            />
                                            Coming Soon
                                          </span>
                                        ) : isOverdue ? (
                                          <span className="flex items-center gap-1 text-red-500">
                                            <HugeiconsIcon
                                              icon={Alert01Icon}
                                              strokeWidth={2}
                                              className="h-3 w-3"
                                            />
                                            Locked
                                          </span>
                                        ) : null}
                                      </div>
                                    )}
                                </div>

                                {/* Attendance Table - Simplified for brevity */}
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
                                          {!isApprover && (
                                            <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                                              Action
                                            </th>
                                          )}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {groupEmployees
                                          .filter((employee) => {
                                            if (userRole === "learner") {
                                              return (
                                                employee.employeeId ===
                                                currentUserId
                                              )
                                            }
                                            if (
                                              userRole === "approver" &&
                                              profile?.team
                                            ) {
                                              return (
                                                employee.teamName ===
                                                profile.team
                                              )
                                            }
                                            return true
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

                                            const canEdit =
                                              isAdmin ||
                                              (userRole === "learner" &&
                                                canEditAttendance &&
                                                employee.employeeId ===
                                                  currentUserId)

                                            return (
                                              <tr
                                                key={employee.id}
                                                className="border-b border-muted/50"
                                              >
                                                <td className="px-2 py-2">
                                                  <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                      <AvatarImage
                                                        src={
                                                          employee.pfImage || ""
                                                        }
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
                                                      {
                                                        attendance.attendanceStatus
                                                      }
                                                    </Badge>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                      {isFutureSession &&
                                                      userRole === "learner"
                                                        ? "Pending"
                                                        : "Not recorded"}
                                                    </span>
                                                  )}
                                                </td>
                                                {!isApprover && (
                                                  <td className="px-2 py-2">
                                                    {canEdit ? (
                                                      <div className="flex items-center gap-2">
                                                        <select
                                                          value={currentStatus}
                                                          onChange={(e) =>
                                                            onAttendanceChange(
                                                              sessionId,
                                                              employee.id.toString(),
                                                              e.target.value,
                                                              employee.id,
                                                              parseInt(group.id)
                                                            )
                                                          }
                                                          disabled={
                                                            isSaving ||
                                                            isSessionLocked
                                                          }
                                                          className="h-7 w-[130px] rounded-md border bg-background px-2 text-xs"
                                                        >
                                                          <option value="">
                                                            Select status
                                                          </option>
                                                          <option value="PRESENT">
                                                            ✅ Present
                                                          </option>
                                                          <option value="ABSENT">
                                                            ❌ Absent
                                                          </option>
                                                          <option value="LATE">
                                                            ⏰ Late
                                                          </option>
                                                          <option value="EXCUSED">
                                                            📝 Excused
                                                          </option>
                                                        </select>
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
                                                          : isOverdue
                                                            ? "Locked"
                                                            : "No access"}
                                                      </span>
                                                    )}
                                                  </td>
                                                )}
                                              </tr>
                                            )
                                          })}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                      No employees enrolled in this group yet.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Enrolled Employees for this Group */}
                  {groupEmployees.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h5 className="flex items-center gap-2 text-sm font-medium">
                          <HugeiconsIcon
                            icon={User02Icon}
                            strokeWidth={1.5}
                            className="h-4 w-4"
                          />
                          Enrolled Employees (
                          {isApprover && profile?.team
                            ? groupEmployees.filter(
                                (e) => e.teamName === profile.team
                              ).length
                            : groupEmployees.length}
                          )
                        </h5>
                        {isApprover && profile?.team && (
                          <Badge
                            variant="outline"
                            className="border-blue-200 bg-blue-50 text-[10px] text-blue-600"
                          >
                            Team: {profile.team}
                          </Badge>
                        )}
                      </div>

                      <TabsComponent
                        defaultValue={uniqueStatuses[0]?.toLowerCase() || "all"}
                        className="mb-4"
                      >
                        <TabsListComponent className="mb-3">
                          {uniqueStatuses.map((status) => {
                            const statusEmployees = getEmployeesByStatus(
                              groupEmployees,
                              status
                            )
                            const filteredEmployees =
                              isApprover && profile?.team
                                ? statusEmployees.filter(
                                    (e) => e.teamName === profile.team
                                  )
                                : statusEmployees

                            return (
                              filteredEmployees.length > 0 && (
                                <TabsTriggerComponent
                                  key={status}
                                  value={status.toLowerCase()}
                                  className="text-xs"
                                >
                                  {capitalizeFirstLetter(status)} (
                                  {filteredEmployees.length})
                                </TabsTriggerComponent>
                              )
                            )
                          })}
                        </TabsListComponent>

                        {uniqueStatuses.map((status) => {
                          const statusEmployees = getEmployeesByStatus(
                            groupEmployees,
                            status
                          )
                          const filteredEmployees =
                            isApprover && profile?.team
                              ? statusEmployees.filter(
                                  (e) => e.teamName === profile.team
                                )
                              : statusEmployees

                          return (
                            filteredEmployees.length > 0 && (
                              <TabsContentComponent
                                key={status}
                                value={status.toLowerCase()}
                              >
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                  {filteredEmployees.map((employee) => (
                                    <div
                                      key={employee.id}
                                      className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                                    >
                                      <Avatar className="h-10 w-10 shrink-0">
                                        <AvatarImage
                                          src={employee.pfImage || ""}
                                        />
                                        <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                                          {getInitials(employee.employeeName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0 flex-1">
                                        <p
                                          className="truncate text-sm font-medium"
                                          title={employee.employeeName}
                                        >
                                          {employee.employeeName}
                                        </p>
                                        <p
                                          className="truncate text-xs text-muted-foreground"
                                          title={`${employee.departmentName} • ${employee.teamName}`}
                                        >
                                          {truncateText(
                                            employee.departmentName,
                                            25
                                          )}
                                          {employee.teamName &&
                                            ` • ${truncateText(employee.teamName, 20)}`}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TabsContentComponent>
                            )
                          )
                        })}
                      </TabsComponent>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

        {isLearner && !currentUserEnrollment && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              You are not enrolled in any group for this course.
            </p>
          </div>
        )}
      </div>
    </TabsContent>
  )
}
