// components/course/tabs/InformationTab.tsx
"use client"

import React from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  TeacherFreeIcons,
  Calendar03Icon,
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  Calendar05Icon,
  UserIcon,
  CheckCircle,
  Alert01Icon,
} from "@hugeicons/core-free-icons"
import { Course } from "@/types/course"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface InformationTabProps {
  course: Course
  enrollments?: any[]
  userRole?: string
  currentUserId?: string | null
  profile?: any
  attendanceRecords?: any[]
  attendanceStatuses?: Record<string, string>
  savingAttendance?: Record<string, boolean>
  savedAttendance?: Record<string, boolean>
  loadingAttendanceGroups?: Record<number, boolean>
  onAttendanceChange?: (
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

// Attendance status options with labels and icons
const ATTENDANCE_OPTIONS = [
  { value: "PRESENT", label: "Present", icon: "✅" },
  { value: "ABSENT", label: "Absent", icon: "❌" },
  { value: "LATE", label: "Late", icon: "⏰" },
  { value: "EXCUSED", label: "Excused", icon: "📝" },
]

export function InformationTab({ 
  course, 
  enrollments = [],
  userRole = "learner",
  currentUserId = null,
  profile,
  attendanceRecords = [],
  attendanceStatuses = {},
  savingAttendance = {},
  savedAttendance = {},
  loadingAttendanceGroups = {},
  onAttendanceChange,
}: InformationTabProps) {
  const isAdmin = userRole === "admin"
  const isApprover = userRole === "approver"
  const isLearner = userRole === "learner"
  const isDepartmentHead = userRole === "department_head"
  const isDivisionHead = userRole === "division_head"
  const canViewAllGroups = isAdmin || isApprover

  const TESTING_DATE = new Date()

  const getTotalSessions = () => {
    if (course.courseType === "trainer") {
      return (
        course.groups?.reduce(
          (total, group) => total + group.sessions.length,
          0
        ) || 0
      )
    }
    return course.self_study_sessions?.length || course.sessions?.length || 0
  }

  const getTotalCapacity = () => {
    if (course.courseType === "trainer") {
      const capacities = course.groups?.map((g) => g.capacity) || []
      const hasUnlimited = capacities.some((c) => c === undefined)
      if (hasUnlimited) return undefined
      const total = capacities.reduce(
        (sum, c) => sum + (typeof c === "number" ? c : 0),
        0
      )
      return total.toString()
    }
    return "N/A"
  }

  const getGroupCount = () => {
    if (course.courseType === "trainer") {
      return course.groups?.length || 0
    }
    return 0
  }

  const getStartDate = () => {
    if (course.courseType === "trainer" && course.groups?.length > 0) {
      const dates = course.groups.map((g) => g.startDate).filter((d) => d)
      if (dates.length === 0) return null
      return new Date(Math.min(...dates.map((d) => d.getTime())))
    }
    return null
  }

  const getEndDate = () => {
    if (course.courseType === "trainer" && course.groups?.length > 0) {
      const dates = course.groups.map((g) => g.endDate).filter((d) => d)
      if (dates.length === 0) return null
      return new Date(Math.max(...dates.map((d) => d.getTime())))
    }
    return null
  }

  const getEmployeesByGroup = (groupId: number) => {
    let employees = enrollments.filter(
      (emp) =>
        emp.courseGroupId === groupId && emp.enrollmentStatus !== "CANCELLED"
    )
    
    if (isDepartmentHead && profile?.deptDat) {
      employees = employees.filter(
        (emp) => emp.departmentName === profile.deptDat
      )
    }
    
    return employees
  }

  const getAttendanceForSession = (sessionId: number, enrollmentId: number) => {
    return attendanceRecords.find(
      (record) =>
        record.courseSessionId === sessionId &&
        record.enrollmentId === enrollmentId
    )
  }

  const getAttendanceLabel = (status: string) => {
    const option = ATTENDANCE_OPTIONS.find((opt) => opt.value === status)
    return option ? `${option.icon} ${option.label}` : status
  }

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

  const totalSessions = getTotalSessions()
  const totalCapacity = getTotalCapacity()
  const groupCount = getGroupCount()
  const startDate = getStartDate()
  const endDate = getEndDate()

  // Get active enrollments
  const activeEnrollments = enrollments.filter(
    (e) => e.enrollmentStatus !== "CANCELLED"
  )

  let filteredEnrollments = activeEnrollments
  if (isApprover && profile?.team) {
    filteredEnrollments = filteredEnrollments.filter(
      (employee) => employee.teamName === profile.team
    )
  }
  if (isDepartmentHead && profile?.deptDat) {
    filteredEnrollments = filteredEnrollments.filter(
      (employee) => employee.departmentName === profile.deptDat
    )
  }

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

  const getSessionStatus = (sessionDate: Date | string | undefined) => {
    if (!sessionDate) return "unknown"

    let date: Date
    if (typeof sessionDate === "string") {
      date = new Date(sessionDate)
      if (isNaN(date.getTime())) return "unknown"
    } else if (sessionDate instanceof Date) {
      date = sessionDate
      if (isNaN(date.getTime())) return "unknown"
    } else {
      return "unknown"
    }

    const currentDate = TESTING_DATE || new Date()

    if (currentDate.toDateString() === date.toDateString()) {
      return "today"
    }
    if (currentDate.getTime() > date.getTime()) {
      return "overdue"
    }
    if (currentDate.getTime() < date.getTime()) {
      return "future"
    }
    return "unknown"
  }

  return (
    <TabsContent value="information" className="pt-4">
      <div className="space-y-6">
        {/* Course Description */}
        {course.description && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Description
            </h4>
            <p className="text-sm">{course.description}</p>
          </div>
        )}

        {/* Course Info Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-3">
            {course.courseType === "trainer" && (
              <div className="flex items-center gap-3 text-sm">
                <HugeiconsIcon
                  icon={TeacherFreeIcons}
                  strokeWidth={1.5}
                  className="h-5 w-5 shrink-0 text-muted-foreground"
                />
                <div>
                  <p className="font-medium">Trainer Name</p>
                  <p className="text-muted-foreground">
                    {course.trainerName || "TBD"}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <HugeiconsIcon
                icon={Calendar03Icon}
                strokeWidth={1.5}
                className="h-5 w-5 shrink-0 text-muted-foreground"
              />
              <div>
                <p className="font-medium">Duration</p>
                <p className="text-muted-foreground">
                  {startDate
                    ? format(startDate, "MMM d, yyyy")
                    : course.courseType === "self-study"
                      ? "Dynamic Schedule"
                      : "TBD"}
                  {endDate && ` - ${format(endDate, "MMM d, yyyy")}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <HugeiconsIcon
                icon={BookOpenIcon}
                strokeWidth={1.5}
                className="h-5 w-5 shrink-0 text-muted-foreground"
              />
              <div>
                <p className="font-medium">Category</p>
                <p className="text-muted-foreground capitalize">
                  {course.category}
                </p>
              </div>
            </div>

            {course.registrationDeadline && (
              <div className="flex items-center gap-3 text-sm">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  strokeWidth={1.5}
                  className="h-5 w-5 shrink-0 text-muted-foreground"
                />
                <div>
                  <p className="font-medium">Registration Deadline</p>
                  <p className="text-muted-foreground">
                    {format(course.registrationDeadline, "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {course.courseType === "trainer" && (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    strokeWidth={1.5}
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <p className="font-medium">Total Capacity</p>
                    <p className="text-muted-foreground">
                      {totalCapacity || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <HugeiconsIcon
                    icon={Calendar05Icon}
                    strokeWidth={1.5}
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <p className="font-medium">Total Sessions</p>
                    <p className="text-muted-foreground">{totalSessions}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <HugeiconsIcon
                    icon={UserIcon}
                    strokeWidth={1.5}
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <p className="font-medium">Number of Groups</p>
                    <p className="text-muted-foreground">{groupCount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    strokeWidth={1.5}
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <p className="font-medium">Total Enrolled</p>
                    <p className="text-muted-foreground">
                      {filteredEnrollments.length}
                    </p>
                  </div>
                </div>
              </>
            )}

            {course.courseType === "self-study" && (
              <>
                {course.selfStudyType && (
                  <div className="flex items-center gap-3 text-sm">
                    <HugeiconsIcon
                      icon={BookOpenIcon}
                      strokeWidth={1.5}
                      className="h-5 w-5 shrink-0 text-muted-foreground"
                    />
                    <div>
                      <p className="font-medium">Study Type</p>
                      <p className="text-muted-foreground capitalize">
                        {course.selfStudyType}
                      </p>
                    </div>
                  </div>
                )}
                {course.selfStudyType?.toLowerCase().trim() !== "other" && (
                  <>
                    {course.totalKanji && (
                      <div className="flex items-center gap-3 text-sm">
                        <HugeiconsIcon
                          icon={ClockIcon}
                          strokeWidth={1.5}
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <div>
                          <p className="font-medium">Total Kanji</p>
                          <p className="text-muted-foreground">
                            {course.totalKanji}
                          </p>
                        </div>
                      </div>
                    )}

                    {course.totalVocabulary && (
                      <div className="flex items-center gap-3 text-sm">
                        <HugeiconsIcon
                          icon={ClockIcon}
                          strokeWidth={1.5}
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <div>
                          <p className="font-medium">Total Vocabulary</p>
                          <p className="text-muted-foreground">
                            {course.totalVocabulary}
                          </p>
                        </div>
                      </div>
                    )}

                    {course.totalGrammar && (
                      <div className="flex items-center gap-3 text-sm">
                        <HugeiconsIcon
                          icon={ClockIcon}
                          strokeWidth={1.5}
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <div>
                          <p className="font-medium">Total Grammar</p>
                          <p className="text-muted-foreground">
                            {course.totalGrammar}
                          </p>
                        </div>
                      </div>
                    )}

                    {course.totalReadingMinutes && (
                      <div className="flex items-center gap-3 text-sm">
                        <HugeiconsIcon
                          icon={ClockIcon}
                          strokeWidth={1.5}
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <div>
                          <p className="font-medium">Total Reading Minutes</p>
                          <p className="text-muted-foreground">
                            {course.totalReadingMinutes}
                          </p>
                        </div>
                      </div>
                    )}

                    {course.totalListeningMinutes && (
                      <div className="flex items-center gap-3 text-sm">
                        <HugeiconsIcon
                          icon={ClockIcon}
                          strokeWidth={1.5}
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <div>
                          <p className="font-medium">Total Listening Minutes</p>
                          <p className="text-muted-foreground">
                            {course.totalListeningMinutes}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Learners Section - From Learners Tab */}
        {filteredEnrollments.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <HugeiconsIcon
                icon={UserGroupIcon}
                strokeWidth={1.5}
                className="h-4 w-4"
              />
              Enrolled Learners ({filteredEnrollments.length})
              {isApprover && !isDepartmentHead && profile?.team && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Team: {profile.team}
                </Badge>
              )}
              {isDepartmentHead && profile?.deptDat && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Dept: {profile.deptDat}
                </Badge>
              )}
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEnrollments.slice(0, 9).map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={employee.pfImage || ""} />
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                      {getInitials(employee.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {employee.employeeName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {truncateText(employee.departmentName || "-", 25)}
                      {employee.teamName && ` • ${truncateText(employee.teamName, 20)}`}
                    </p>
                  </div>
                  {course.courseType === "trainer" && (
                    <Badge className="text-[10px]">
                      {employee.courseGroupName || "-"}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            {filteredEnrollments.length > 9 && (
              <p className="mt-2 text-sm text-muted-foreground">
                + {filteredEnrollments.length - 9} more learners
              </p>
            )}
          </div>
        )}

        {/* Groups & Sessions Section - From Groups Tab */}
        {course.courseType === "trainer" && course.groups && course.groups.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <HugeiconsIcon
                icon={Calendar05Icon}
                strokeWidth={1.5}
                className="h-4 w-4"
              />
              Groups & Sessions ({course.groups.length})
            </h4>
            <div className="space-y-4">
              {course.groups
                .filter((group: any) => {
                  if (isAdmin) return true
                  if (isDepartmentHead) {
                    const groupId = parseInt(group.id)
                    return hasDepartmentEmployees(groupId)
                  }
                  if (isApprover) return true
                  if (isLearner) {
                    // Learners can only see their enrolled group
                    const userEnrollment = enrollments.find(
                      (e) => e.employeeId === currentUserId && e.enrollmentStatus !== "CANCELLED"
                    )
                    if (userEnrollment) {
                      return parseInt(group.id) === userEnrollment.courseGroupId
                    }
                    return false
                  }
                  return false
                })
                .map((group: any, index: number) => {
                  const groupId = parseInt(group.id)
                  const groupEmployees = getEmployeesByGroup(groupId)
                  const firstSessionUpcoming = isFirstSessionUpcoming(group.sessions)
                  const isLoadingAttendance = loadingAttendanceGroups[groupId] || false

                  return (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="bg-muted/30 pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-semibold">{group.name}</h5>
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span>Capacity: {group.capacity === undefined ? "Unlimited" : group.capacity}</span>
                              <span>Enrolled: {groupEmployees.length}</span>
                              <span>Sessions: {group.sessions.length}</span>
                              {group.startDate && (
                                <span>Start: {format(group.startDate, "MMM d")}</span>
                              )}
                              {group.endDate && (
                                <span>End: {format(group.endDate, "MMM d")}</span>
                              )}
                            </div>
                          </div>
                          <Badge variant={group.status === "ACTIVE" ? "default" : "secondary"}>
                            {group.status || "Active"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {group.sessions.slice(0, 4).map((session: any, idx: number) => {
                            const sessionDate = session.date ? new Date(session.date) : null
                            const currentDate = TESTING_DATE || new Date()
                            const isFutureSession = sessionDate
                              ? sessionDate.getTime() > currentDate.getTime()
                              : false
                            const isToday = sessionDate
                              ? sessionDate.toDateString() === currentDate.toDateString()
                              : false
                            const isPast = sessionDate
                              ? sessionDate.getTime() < currentDate.getTime() && !isToday
                              : false
                            const isOverdue = isPast && !isToday

                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "rounded-lg border bg-muted/5 p-2",
                                  isFutureSession && "opacity-70",
                                  isOverdue && "border-red-200 bg-red-50/5"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">
                                    Session {session.sessionNo || idx + 1}
                                  </span>
                                  <div className="flex items-center gap-1">
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
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {sessionDate && format(sessionDate, "MMM d, yyyy")}
                                  {session.startTime && session.endTime && (
                                    <span className="ml-2">
                                      {session.startTime} - {session.endTime}
                                    </span>
                                  )}
                                </div>
                                {!firstSessionUpcoming && groupEmployees.length > 0 && (
                                  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <span>👥 {groupEmployees.length} enrolled</span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                          {group.sessions.length > 4 && (
                            <div className="col-span-full text-center text-xs text-muted-foreground">
                              + {group.sessions.length - 4} more sessions
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </TabsContent>
  )
}