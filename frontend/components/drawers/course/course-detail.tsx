"use client"

import React, { useEffect, useState, useMemo } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Edit03Icon,
  RefreshIcon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import {
  Course,
  COURSE_TYPE_LABELS,
  COURSE_STATUS_LABELS,
} from "@/types/course"
import { mainStore } from "@/store/mainStore"
import { cn } from "@/lib/utils"
import { InformationTab } from "@/components/drawers/course/tabs/InformationTab"
import { GroupsTab } from "@/components/drawers/course/tabs/GroupsTab"
import { LearnersTab } from "@/components/drawers/course/tabs/LearnersTab"
import { SessionsTab } from "@/components/drawers/course/tabs/SessionsTab"
import { GroupChangeTab } from "@/components/drawers/course/tabs/GroupChange.tab"
import { GroupRequestsTab } from "@/components/drawers/course/tabs/GroupRequestTab"
import { ChangeGroupDialogs } from "@/components/dialogs/changeGroup-dialog"
import { ChangeGroupRequestDialogs } from "@/components/dialogs/changeGroupRequest-dialog"

interface CourseDetailProps {
  course: Course
  onEdit: (course: Course) => void
  onBack: () => void
  userRole: string
  onRegister?: (course: Course) => void
  isRegistered?: boolean
}

// Helper function to convert Employee to MentionedLearner
const convertEmployeeToMentionedLearner = (employee: any) => ({
  id: employee.id,
  name: employee.name || employee.full_name || '',
  email: employee.email || '',
  avatar: employee.profile_photo_path || employee.avatar || '',
  department: employee.dept_dat || employee.department || '',
  team: employee.team || '',
  status: (employee.status || employee.emp_status || 'active') as 'active' | 'pending' | 'completed' | 'inactive',
  addedAt: new Date(),
})

export function CourseDetail({
  course,
  onEdit,
  onBack,
  userRole,
  onRegister,
  isRegistered = false,
}: CourseDetailProps) {
  const isAdmin = userRole === "admin"
  const isLearner = userRole === "learner"
  const isApprover = userRole === "approver"

  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isUnenrolling, setIsUnenrolling] = useState(false)
  const [currentUserEnrollment, setCurrentUserEnrollment] = useState<any>(null)
  const [changeGroupDialogOpen, setChangeGroupDialogOpen] = useState(false)
  const [changeGroupRequestDialogOpen, setChangeGroupRequestDialogOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const [isRequestingGroupChange, setIsRequestingGroupChange] = useState(false)
  const [isProcessingRequest, setIsProcessingRequest] = useState(false)

  // Attendance state
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, string>>({})
  const [savingAttendance, setSavingAttendance] = useState<Record<string, boolean>>({})
  const [savedAttendance, setSavedAttendance] = useState<Record<string, boolean>>({})

  const {
    fetch_courseEnrollments,
    enrollments,
    getUserId,
    profile,
    enrollEmployee,
    unenrollEmployee,
    fetchAttendance,
    createAttendance,
    updateAttendance,
    attendances,
    isLoading: isAttendanceLoading,
    // Group change functions
    requestGroupChange,
    approveGroupChange,
    rejectGroupChange,
    adminChangeGroup,
    isAdminChangingGroup,
    groupChangeError,
    groupChangeSuccess,
    clearGroupChangeState,
    // Employee data
    employee_data,
    fetch_EmployeeData,
  } = mainStore()

  const currentUserId = getUserId?.() || null

  // Fetch employees on mount if not already loaded
  useEffect(() => {
    if (employee_data.length === 0) {
      fetch_EmployeeData()
    }
  }, [employee_data.length, fetch_EmployeeData])

  // Clean up group change state when component unmounts
  useEffect(() => {
    return () => {
      clearGroupChangeState?.()
    }
  }, [clearGroupChangeState])

  // Convert employees to MentionedLearners
  const allEmployees = useMemo(() => {
    return employee_data.map(convertEmployeeToMentionedLearner)
  }, [employee_data])

  // Get active enrollments (not cancelled)
  const activeEnrollments = React.useMemo(() => {
    return enrollments.filter((e: any) => e.enrollmentStatus !== "CANCELLED")
  }, [enrollments])

  const TESTING_DATE = new Date()
  // const TESTING_DATE = new Date("2026-08-04")

  // Check if first session has started or passed
  const isFirstSessionStartedOrPassed = React.useMemo(() => {
    if (!course.groups || course.groups.length === 0) return false

    const allSessions = course.groups.flatMap((group: any) =>
      group.sessions?.map((session: any) => ({
        ...session,
        groupId: group.id
      })) || []
    )

    if (allSessions.length === 0) return false

    const sortedSessions = allSessions.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateA - dateB
    })

    const firstSession = sortedSessions[0]
    if (!firstSession || !firstSession.date) return false

    const sessionDate = new Date(firstSession.date)
    // Use TESTING_DATE if provided, otherwise use current date
    const currentDate = TESTING_DATE ? new Date(TESTING_DATE) : new Date()
    sessionDate.setHours(0, 0, 0, 0)
    currentDate.setHours(0, 0, 0, 0)

    return sessionDate.getTime() <= currentDate.getTime()
  }, [course.groups])

  // Check if Change Group button should be disabled
  const isChangeGroupDisabled = React.useMemo(() => {
    if (activeEnrollments.length === 0) return true
    if (!course.groups || course.groups.length <= 1) return true
    if (isFirstSessionStartedOrPassed) return true
    return false
  }, [activeEnrollments, course.groups, isFirstSessionStartedOrPassed])

  const isUserEnrolled =
    !!currentUserEnrollment &&
    currentUserEnrollment.enrollmentStatus === "APPROVED"

  // Check if Change Group Request button should be disabled
  const isChangeGroupRequestDisabled = React.useMemo(() => {
    if (!isUserEnrolled) return true
    if (!course.groups || course.groups.length <= 1) return true
    if (currentUserEnrollment?.groupChangeStatus === "PENDING") return true
    if (isFirstSessionStartedOrPassed) return true
    return false
  }, [isUserEnrolled, course.groups, currentUserEnrollment, isFirstSessionStartedOrPassed])

  // Get tooltip text for disabled buttons
  const getChangeGroupTooltip = () => {
    if (activeEnrollments.length === 0) return "No employees enrolled in this course"
    if (!course.groups || course.groups.length <= 1) return "Need at least 2 groups to change group"
    if (isFirstSessionStartedOrPassed) return "Cannot change group after the first session has started"
    return "Change employee groups"
  }

  const getChangeGroupRequestTooltip = () => {
    if (!isUserEnrolled) return "You are not enrolled in this course"
    if (!course.groups || course.groups.length <= 1) return "Need at least 2 groups to request a change"
    if (currentUserEnrollment?.groupChangeStatus === "PENDING") return "You already have a pending group change request"
    if (isFirstSessionStartedOrPassed) return "Cannot request group change after the first session has started"
    return "Request to change your group"
  }

  // 🆕 Handle enrolling employee from LearnersTab
  const handleEnrollEmployee = async (employeeId: string | number, groupId?: number) => {
    if (!course.id) {
      alert("Course ID is required to enroll")
      return
    }

    // If no groupId provided and it's a trainer course, get the first group
    let targetGroupId = groupId || 1
    if (course.courseType === "trainer" && course.groups && course.groups.length > 0) {
      targetGroupId = parseInt(String(course.groups[0].id).replace("g", ""))
    }

    setIsEnrolling(true)
    try {
      const result = await enrollEmployee(course.id, targetGroupId, employeeId)

      if (result.success) {
        alert(`✅ Employee enrolled successfully!`)
        // Refresh enrollments
        if (course.id) {
          await fetch_courseEnrollments(course.id)
        }
        if (course.courseType === "trainer" && course.groups?.[0]?.id) {
          await fetchAttendance(parseInt(course.id), parseInt(course.groups[0].id))
        }
      } else {
        alert(result.message || "Failed to enroll employee")
      }
    } catch (error) {
      console.error("Error enrolling employee:", error)
      alert("An error occurred while enrolling")
    } finally {
      setIsEnrolling(false)
    }
  }

  // 🆕 Handle unenrolling employee from LearnersTab
  const handleUnenrollEmployee = async (enrollmentId: number) => {
    if (!course.id) {
      alert("Course ID is required to unenroll")
      return
    }

    setIsUnenrolling(true)
    try {
      const result = await unenrollEmployee(course.id, enrollmentId)

      if (result.success) {
        alert(`✅ Employee unenrolled successfully!`)
        // Refresh enrollments
        if (course.id) {
          await fetch_courseEnrollments(course.id)
        }
        if (course.courseType === "trainer" && course.groups?.[0]?.id) {
          await fetchAttendance(parseInt(course.id), parseInt(course.groups[0].id))
        }
      } else {
        alert(result.message || "Failed to unenroll employee")
      }
    } catch (error) {
      console.error("Error unenrolling employee:", error)
      alert("An error occurred while unenrolling")
    } finally {
      setIsUnenrolling(false)
    }
  }

  // Handle group change request
  const handleRequestGroupChange = async (groupId: string) => {
    if (!currentUserEnrollment) {
      alert("You are not enrolled in this course")
      return
    }

    setIsRequestingGroupChange(true)
    try {
      const result = await requestGroupChange(currentUserEnrollment.id, parseInt(groupId))

      if (result.success) {
        alert(result.message || "Group change request submitted successfully!")
        if (course.id) {
          await fetch_courseEnrollments(course.id)
        }
        setChangeGroupRequestDialogOpen(false)
      } else {
        alert(result.message || "Failed to submit group change request")
      }
    } catch (error) {
      console.error("Error requesting group change:", error)
      alert("An error occurred while submitting your request")
    } finally {
      setIsRequestingGroupChange(false)
    }
  }

  // Handle approve group change request
  const handleApproveRequest = async (enrollmentId: number) => {
    if (!confirm("Are you sure you want to approve this group change request?")) {
      return
    }

    setIsProcessingRequest(true)
    try {
      const result = await approveGroupChange(enrollmentId)

      if (result.success) {
        alert(result.message || "Group change request approved successfully!")
        if (course.id) {
          await fetch_courseEnrollments(course.id)
        }
        if (course.courseType === "trainer" && course.groups?.[0]?.id) {
          await fetchAttendance(parseInt(course.id), parseInt(course.groups[0].id))
        }
      } else {
        alert(result.message || "Failed to approve group change request")
      }
    } catch (error) {
      console.error("Error approving group change:", error)
      alert("An error occurred while approving the request")
    } finally {
      setIsProcessingRequest(false)
    }
  }

  // Handle reject group change request
  const handleRejectRequest = async (enrollmentId: number) => {
    if (!confirm("Are you sure you want to reject this group change request?")) {
      return
    }

    setIsProcessingRequest(true)
    try {
      const result = await rejectGroupChange(enrollmentId)

      if (result.success) {
        alert(result.message || "Group change request rejected successfully!")
        if (course.id) {
          await fetch_courseEnrollments(course.id)
        }
      } else {
        alert(result.message || "Failed to reject group change request")
      }
    } catch (error) {
      console.error("Error rejecting group change:", error)
      alert("An error occurred while rejecting the request")
    } finally {
      setIsProcessingRequest(false)
    }
  }

  // Handle admin group change (for LearnersTab)
  const handleAdminChangeGroup = async (enrollmentId: number, newGroupId: number) => {
    try {
      const result = await adminChangeGroup(enrollmentId, newGroupId)
      if (result.success) {
        if (course.id) {
          await fetch_courseEnrollments(course.id)
        }
        alert('Group changed successfully!')
      } else {
        alert(result.message || 'Failed to change group')
      }
    } catch (error) {
      console.error('Failed to change group:', error)
      alert(error instanceof Error ? error.message : 'Failed to change group')
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    if (course.id) {
      await fetch_courseEnrollments(course.id)
      if (course.courseType === "trainer" && course.groups?.[0]?.id) {
        await fetchAttendance(parseInt(course.id), parseInt(course.groups[0].id))
      }
    }
  }

  // Load attendance when course loads and a group is selected
  useEffect(() => {
    const loadAttendance = async () => {
      if (!course.id || course.courseType !== "trainer") return
      const groupId = course.groups?.[0]?.id
      if (!groupId) return
      try {
        await fetchAttendance(parseInt(course.id), parseInt(groupId))
      } catch (error) {
        console.error("Error loading attendance:", error)
      }
    }
    loadAttendance()
  }, [course.id, course.groups])

  useEffect(() => {
    const loadEnrollments = async () => {
      if (!course.id) return
      setIsLoadingEnrollments(true)
      try {
        await fetch_courseEnrollments(course.id)
      } catch (error) {
        console.error("Error loading enrollments:", error)
      } finally {
        setIsLoadingEnrollments(false)
      }
    }
    loadEnrollments()
  }, [course.id])

  useEffect(() => {
    if (enrollments.length > 0 && currentUserId) {
      const userEnrollment = enrollments.find(
        (emp: any) =>
          emp.employeeId === currentUserId &&
          emp.enrollmentStatus !== "CANCELLED"
      )
      setCurrentUserEnrollment(userEnrollment || null)
    } else {
      setCurrentUserEnrollment(null)
    }
  }, [enrollments, currentUserId])

  const getGroupCount = () => {
    if (course.courseType === "trainer") {
      return course.groups?.length || 0
    }
    return 0
  }

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

  const groupCount = getGroupCount()
  const totalSessions = getTotalSessions()

  const pendingRequestsCount = enrollments.filter(
    (e: any) => e.groupChangeStatus === "PENDING"
  ).length

  // Check if registration deadline has passed
  const isRegistrationDeadlinePassed = React.useMemo(() => {
    if (!course.registrationDeadline) return false
    const deadline = new Date(course.registrationDeadline)
    const today = new Date()
    deadline.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    return deadline < today
  }, [course.registrationDeadline])

  // Get employees by group
  const getEmployeesByGroup = (groupId: number) => {
    return enrollments.filter(
      (emp: any) =>
        emp.courseGroupId === groupId && emp.enrollmentStatus !== "CANCELLED"
    )
  }

  // Handle attendance change
  const handleAttendanceChange = async (
    sessionId: string,
    employeeId: string,
    value: string,
    enrollmentId: number,
    groupId: number
  ) => {
    const key = `${sessionId}-${employeeId}`

    setSavingAttendance(prev => ({ ...prev, [key]: true }))
    setAttendanceStatuses(prev => ({ ...prev, [key]: value }))

    try {
      const existingAttendance = attendances.find(
        (a: any) =>
          a.courseSessionId === parseInt(sessionId) &&
          a.enrollmentId === enrollmentId
      )

      const request = {
        enrollmentId,
        courseSessionId: parseInt(sessionId),
        attendanceStatus: value as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
      }

      let result
      if (existingAttendance) {
        result = await updateAttendance(
          parseInt(course.id),
          groupId,
          existingAttendance.id,
          request
        )
      } else {
        result = await createAttendance(
          parseInt(course.id),
          groupId,
          request
        )
      }

      setSavedAttendance(prev => ({ ...prev, [key]: true }))

      setTimeout(() => {
        setSavedAttendance(prev => {
          const newState = { ...prev }
          delete newState[key]
          return newState
        })
      }, 500)

    } catch (error) {
      console.error('❌ Error saving attendance:', error)

      setAttendanceStatuses(prev => {
        const newState = { ...prev }
        delete newState[key]
        return newState
      })

      alert('Failed to save attendance. Please try again.')
    } finally {
      setSavingAttendance(prev => ({ ...prev, [key]: false }))
    }
  }

  // Handle Register
  const handleRegister = async () => {
    if (!course.groups || course.groups.length === 0) {
      alert("No groups available for enrollment")
      return
    }

    const groupId = selectedGroupId || course.groups[0].id
    const groupIdNum = parseInt(groupId)

    setIsEnrolling(true)
    try {
      const result = await enrollEmployee(course.id, groupIdNum)

      if (result.success) {
        alert(result.message || "Successfully enrolled in the course!")
        await fetch_courseEnrollments(course.id)

        if (onRegister) {
          onRegister(course)
        }
      } else {
        alert(result.message || "Failed to enroll in the course")
      }
    } catch (error) {
      console.error("Error enrolling:", error)
      alert("An error occurred while enrolling")
    } finally {
      setIsEnrolling(false)
    }
  }

  // Handle Unenroll
  const handleUnenroll = async () => {
    if (!currentUserEnrollment) {
      alert("You are not enrolled in this course")
      return
    }

    if (!confirm("Are you sure you want to unenroll from this course?")) {
      return
    }

    setIsUnenrolling(true)
    try {
      const result = await unenrollEmployee(course.id, currentUserEnrollment.id)

      if (result.success) {
        alert(result.message || "Successfully unenrolled from the course")
        setCurrentUserEnrollment(null)
        await fetch_courseEnrollments(course.id)

        if (onRegister) {
          onRegister(course)
        }
      } else {
        alert(result.message || "Failed to unenroll from the course")
      }
    } catch (error) {
      console.error("Error unenrolling:", error)
      alert("An error occurred while unenrolling")
    } finally {
      setIsUnenrolling(false)
    }
  }

  if (isLoadingEnrollments) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading course details...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex items-center justify-between gap-4">
        <Tabs defaultValue="information" className="flex-1">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  strokeWidth={2}
                  className="h-4 w-4"
                />
              </Button>
              <TabsList>
                <TabsTrigger value="information">Information</TabsTrigger>
                {course.courseType === "trainer" &&
                  course.groups &&
                  course.groups.length > 0 && (
                    <TabsTrigger value="groups">
                      Groups ({course.groups.length})
                    </TabsTrigger>
                  )}
                {course.courseType === "self-study" && (
                  <TabsTrigger value="sessions">
                    Sessions (
                    {course.self_study_sessions?.length ||
                      course.sessions?.length ||
                      0}
                    )
                  </TabsTrigger>
                )}
                {/* {course.courseType === "trainer" &&
                  isLearner &&
                  isUserEnrolled && (
                    <TabsTrigger value="group-change">Change Group</TabsTrigger>
                  )} */}
                {course.courseType === "trainer" && isAdmin && (
                  <TabsTrigger value="group-requests">
                    Group Requests
                    {pendingRequestsCount > 0 && (
                      <Badge className="ml-2 bg-red-500 px-1.5 text-[10px] text-white">
                        {pendingRequestsCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
                {!isLearner &&
                  <TabsTrigger value="learners">
                    Learners (
                    {(() => {
                      let count = enrollments.filter(
                        (e) => e.enrollmentStatus !== "CANCELLED"
                      )
                      if (isApprover && profile?.team) {
                        count = count.filter((e) => e.teamName === profile.team)
                      }
                      return count.length
                    })()}
                    )
                  </TabsTrigger>
                }

              </TabsList>
            </div>
            <div className="flex items-center gap-2">
              {/* Learner - Request Change Group Button */}
              {isLearner && course.status !== "completed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChangeGroupRequestDialogOpen(true)}
                  className="gap-2"
                  disabled={isChangeGroupRequestDisabled}
                  title={getChangeGroupRequestTooltip()}
                >
                  <HugeiconsIcon
                    icon={RefreshIcon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                  Request Change Group
                  {currentUserEnrollment?.groupChangeStatus === "PENDING" && (
                    <Badge className="ml-1 bg-yellow-500 text-[10px] text-white">
                      Pending
                    </Badge>
                  )}
                </Button>
              )}

              {/* Enrollment Button for Learners */}
              {!isAdmin && (
                <div className="flex items-center gap-2">
                  {/* Group Selection - Only show if there are multiple groups and user is not enrolled */}
                  {course.groups &&
                    course.groups.length > 1 &&
                    !isUserEnrolled && (
                      <select
                        value={selectedGroupId || ""}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={
                          isUserEnrolled ||
                          course.status === "completed" ||
                          isRegistrationDeadlinePassed
                        }
                      >
                        <option value="" disabled>
                          Select a group
                        </option>
                        {course.groups.map((group) => {
                          const groupEmployees = getEmployeesByGroup(
                            parseInt(group.id)
                          )
                          const isFull =
                            group.capacity !== undefined &&
                            groupEmployees.length >=
                            ((group.capacity as number) || 0)

                          return (
                            <option
                              key={group.id}
                              value={group.id}
                              disabled={isFull}
                            >
                              {group.name} ({groupEmployees.length}/
                              {group.capacity === undefined
                                ? "∞"
                                : group.capacity}
                              ){isFull && " (Full)"}
                            </option>
                          )
                        })}
                      </select>
                    )}

                  {isUserEnrolled ? (
                    <Button
                      onClick={handleUnenroll}
                      variant="destructive"
                      size="sm"
                      disabled={isUnenrolling || isRegistrationDeadlinePassed}
                      className="gap-1"
                    >
                      {isUnenrolling ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-current"></span>
                          Unenrolling...
                        </>
                      ) : (
                        "Unenroll"
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleRegister}
                      size="sm"
                      disabled={
                        course.status === "completed" ||
                        isEnrolling ||
                        isRegistrationDeadlinePassed ||
                        (course.groups &&
                          course.groups.length > 1 &&
                          !selectedGroupId)
                      }
                      className="gap-1"
                    >
                      {isEnrolling ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-current"></span>
                          Enrolling...
                        </>
                      ) : course.status === "completed" ? (
                        "Course Completed"
                      ) : isRegistrationDeadlinePassed ? (
                        "Registration Closed"
                      ) : (
                        "Enroll Course"
                      )}
                    </Button>
                  )}
                </div>
              )}

              {/* Admin Buttons */}
              {isAdmin && course.status !== "completed" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChangeGroupDialogOpen(true)}
                    className="gap-2"
                    disabled={isChangeGroupDisabled}
                    title={getChangeGroupTooltip()}
                  >
                    <HugeiconsIcon
                      icon={RefreshIcon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                    Change Group
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onEdit(course)}
                  >
                    <HugeiconsIcon
                      icon={Edit03Icon}
                      strokeWidth={1.5}
                      className="mr-1 h-3 w-3"
                    />
                    Edit Course
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Tab Contents */}
          <InformationTab course={course} />

          {course.courseType === "trainer" &&
            course.groups &&
            course.groups.length > 0 && (
              <GroupsTab
                course={course}
                enrollments={enrollments}
                userRole={userRole}
                currentUserId={currentUserId}
                currentUserEnrollment={currentUserEnrollment}
                profile={profile}
                attendanceRecords={attendances}
                attendanceStatuses={attendanceStatuses}
                savingAttendance={savingAttendance}
                savedAttendance={savedAttendance}
                onAttendanceChange={handleAttendanceChange}
              />
            )}

          {course.courseType === "self-study" && (
            <SessionsTab
              course={course}
              enrollments={enrollments}
              userRole={userRole}
              currentUserId={currentUserId}
              currentUserEnrollment={currentUserEnrollment}
              isUserEnrolled={isUserEnrolled}
              profile={profile}
            />
          )}

          {course.courseType === "trainer" && isLearner && isUserEnrolled && (
            <GroupChangeTab
              course={course}
              currentUserEnrollment={currentUserEnrollment}
              onRequestGroupChange={() => { }}
            />
          )}

          {course.courseType === "trainer" && isAdmin && (
            <GroupRequestsTab
              enrollments={enrollments}
              onRefresh={handleRefresh}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
              isProcessing={isProcessingRequest}
            />
          )}

          <LearnersTab
            enrollments={enrollments}
            userRole={userRole}
            profile={profile}
            enrollmentSearchTerm=""
            onSearchChange={() => { }}
            course={course}
            allEmployees={allEmployees}
            groups={course.groups || []}
            onRefreshEnrollments={async () => {
              if (course.id) {
                await fetch_courseEnrollments(course.id)
              }
            }}
            onAdminChangeGroup={handleAdminChangeGroup}
            isChangingGroup={isAdminChangingGroup}
            groupChangeError={groupChangeError}
            groupChangeSuccess={groupChangeSuccess}
            // 🆕 Pass enrollment functions
            onEnrollEmployee={handleEnrollEmployee}
            onUnenrollEmployee={handleUnenrollEmployee}
            isEnrolling={isEnrolling}
            isUnenrolling={isUnenrolling}
          />
        </Tabs>
      </div>

      {/* Change Group Dialogs */}
      <ChangeGroupDialogs
        course={course}
        enrollments={enrollments}
        open={changeGroupDialogOpen}
        onOpenChange={setChangeGroupDialogOpen}
        onGroupChangeComplete={() => {
          if (course.id) {
            fetch_courseEnrollments(course.id)
          }
        }}
      />

      {/* Change Group Request Dialogs */}
      <ChangeGroupRequestDialogs
        course={course}
        enrollments={enrollments}
        open={changeGroupRequestDialogOpen}
        onOpenChange={setChangeGroupRequestDialogOpen}
        onGroupChangeComplete={() => {
          if (course.id) {
            fetch_courseEnrollments(course.id)
          }
        }}
        currentUserEnrollment={currentUserEnrollment}
        onRequestGroupChange={handleRequestGroupChange}
        isRequesting={isRequestingGroupChange}
      />
    </div>
  )
}