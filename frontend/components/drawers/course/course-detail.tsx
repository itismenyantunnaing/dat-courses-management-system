// components/drawers/course/course-detail.tsx
"use client"

import React, { useEffect, useState, useMemo } from "react"
import { resolveUploadUrl } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Edit03Icon,
  ArrowLeft01Icon,
  UserSwitchIcon,
} from "@hugeicons/core-free-icons"
import {
  Course,
  COURSE_TYPE_LABELS,
  COURSE_STATUS_LABELS,
  isJLPTType,
} from "@/types/course"
import { mainStore } from "@/store/mainStore"
import { cn } from "@/lib/utils"
import { InformationTab } from "@/components/drawers/course/tabs/InformationTab"
import { GroupsTab } from "@/components/drawers/course/tabs/GroupsTab"
import { LearnersTab } from "@/components/drawers/course/tabs/LearnersTab"
import { SessionsTab } from "@/components/drawers/course/tabs/SessionsTab"
import { GroupChangeTab } from "@/components/drawers/course/tabs/GroupChangeTab"
import { GroupRequestsTab } from "@/components/drawers/course/tabs/GroupRequestsTab"
import { AttendanceTab } from "@/components/drawers/course/tabs/AttendanceTab"
import { ProgressTab } from "@/components/drawers/course/tabs/ProgressTab"
import { ChangeGroupDialogs } from "@/components/dialogs/changeLearners-dialog"
import { ChangeGroupRequestDialogs } from "@/components/dialogs/changeGroupRequest-dialog"
import { toast } from "sonner"
import { dialog } from "@/components/dialogs/import-export-confirm-dialog"

interface CourseDetailProps {
  course: Course
  onEdit: (course: Course) => void
  onBack: () => void
  userRole: string | undefined
  onRegister?: (course: Course) => void
  isRegistered?: boolean
}

// Helper function to convert Employee to MentionedLearner
const convertEmployeeToMentionedLearner = (employee: any) => ({
  id: employee.id,
  name: employee.name || employee.full_name || "",
  email: employee.email || "",
  avatar:
    resolveUploadUrl(employee.profile_photo_path) || employee.avatar || "",
  department: employee.dept_dat || employee.department || "",
  team: employee.team || "",
  status: (employee.status || employee.emp_status || "active") as
    "active" | "pending" | "completed" | "inactive",
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
  const isApprover =
    userRole === "approver" ||
    userRole === "division_head" ||
    userRole === "department_head"

  const canRequestGroupChange = isLearner || isApprover

  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isUnenrolling, setIsUnenrolling] = useState(false)
  const [currentUserEnrollment, setCurrentUserEnrollment] = useState<any>(null)
  const [changeGroupDialogOpen, setChangeGroupDialogOpen] = useState(false)
  const [changeGroupRequestDialogOpen, setChangeGroupRequestDialogOpen] =
    useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const [isRequestingGroupChange, setIsRequestingGroupChange] = useState(false)
  const [isProcessingRequest, setIsProcessingRequest] = useState(false)
  const [activeTab, setActiveTab] = useState("information")
  const [loadingAttendanceGroups, setLoadingAttendanceGroups] = useState<
    Record<number, boolean>
  >({})

  // Attendance state
  const [attendanceStatuses, setAttendanceStatuses] = useState<
    Record<string, string>
  >({})
  const [savingAttendance, setSavingAttendance] = useState<
    Record<string, boolean>
  >({})
  const [savedAttendance, setSavedAttendance] = useState<
    Record<string, boolean>
  >({})

  const {
    fetch_courseEnrollments,
    enrollments: allEnrollments,
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
    studyProgress,
    fetch_studyProgress,
  } = mainStore()

  const currentUserId = getUserId?.() || null

  const enrollments = React.useMemo(() => {
    const parsedCourseId = parseInt(course.id?.toString() ?? "")
    if (isNaN(parsedCourseId)) return []
    return allEnrollments.filter(
      (e: any) => e.courseId === parsedCourseId
    )
  }, [allEnrollments, course.id])

  // Fetch employees on mount if not already loaded
  useEffect(() => {
    if (employee_data.length === 0) {
      fetch_EmployeeData()
    }
  }, [employee_data.length, fetch_EmployeeData])

  // useEffect to fetch studyProgress when course loads
  useEffect(() => {
    // Fetch studyProgress for JLPT self-study courses
    if (course?.id && course?.selfStudyType && isJLPTType(course.selfStudyType)) {
      fetch_studyProgress(course.id)
    }
  }, [course?.id, course?.selfStudyType, fetch_studyProgress])

  // Filter studyProgress by employee_id === current user's ID and log it
  useEffect(() => {
    if (studyProgress?.progress && currentUserId) {
      const filteredProgress = studyProgress.progress.filter(
        (p: any) => p.employee_id === currentUserId
      )
    }
  }, [studyProgress, currentUserId])

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

    const allSessions = course.groups.flatMap(
      (group: any) =>
        group.sessions?.map((session: any) => ({
          ...session,
          groupId: group.id,
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
    // if (currentUserEnrollment?.groupChangeStatus === "PENDING") return true
    if (isFirstSessionStartedOrPassed) return true
    return false
  }, [
    isUserEnrolled,
    course.groups,
    currentUserEnrollment,
    isFirstSessionStartedOrPassed,
  ])

  // Check if user has started any progress (any count > 0 for session 1 or 2)
  const hasStartedProgress = useMemo(() => {
    if (!studyProgress?.progress || !currentUserId) return false

    // Filter progress for current user
    const userProgress = studyProgress.progress.filter(
      (p: any) => p.employee_id === currentUserId
    )

    // Check if any progress record has any count > 0
    // Only check sessions 1 and 2 (session_no 1 or 2)
    const hasProgress = userProgress.some((p: any) => {
      // Only check session 1 or 2
      if (p.session_no !== 1 && p.session_no !== 2) return false

      return (
        (p.grammar_count || 0) > 0 ||
        (p.kanji_count || 0) > 0 ||
        (p.vocabulary_count || 0) > 0 ||
        (p.reading_minutes || 0) > 0 ||
        (p.listening_minutes || 0) > 0
      )
    })

    return hasProgress
  }, [studyProgress, currentUserId])

  // Check if first session date is in the future
  const isFirstSessionFuture = useMemo(() => {
    if (!course.self_study_sessions || course.self_study_sessions.length === 0) {
      return false
    }

    // Sort sessions by date to get the first one
    const sortedSessions = [...course.self_study_sessions].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    const firstSession = sortedSessions[0]
    if (!firstSession || !firstSession.date) return false

    const sessionDate = new Date(firstSession.date)
    const today = new Date()
    sessionDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    return sessionDate.getTime() > today.getTime()
  }, [course.self_study_sessions])

  // Check if unenroll should be disabled
  const isUnenrollDisabled = useMemo(() => {
    // Disable if user has started progress (any count > 0 for session 1 or 2)
    if (hasStartedProgress) return true

    // Disable if first session is in the future
    if (isFirstSessionFuture) return true

    return false
  }, [hasStartedProgress, isFirstSessionFuture])

  // Get tooltip text for disabled buttons (kept for reference but no longer used)
  const getChangeGroupTooltip = () => {
    if (activeEnrollments.length === 0)
      return "No employees enrolled in this course"
    if (!course.groups || course.groups.length <= 1)
      return "Need at least 2 groups to change group"
    if (isFirstSessionStartedOrPassed)
      return "Cannot change group after the first session has started"
    return "Change employee groups"
  }

  const getChangeGroupRequestTooltip = () => {
    if (!isUserEnrolled) return "You are not enrolled in this course"
    if (!course.groups || course.groups.length <= 1)
      return "Need at least 2 groups to request a change"
    if (currentUserEnrollment?.groupChangeStatus === "PENDING")
      return "You already have a pending group change request"
    if (isFirstSessionStartedOrPassed)
      return "Cannot request group change after the first session has started"
    return "Request to change your group"
  }

  // Helper function to refresh attendance for all groups
  const refreshAllGroupAttendance = async () => {
    if (!course.id || course.courseType !== "trainer") return
    if (!course.groups || course.groups.length === 0) return

    try {
      // Set loading state for all groups
      const groupIds = course.groups
        .map((group: any) => parseInt(group.id))
        .filter((id: number) => !isNaN(id))
      setLoadingAttendanceGroups((prev) => {
        const newState = { ...prev }
        groupIds.forEach((id) => {
          newState[id] = true
        })
        return newState
      })

      // Fetch attendance for each group in parallel
      const attendancePromises = course.groups.map((group: any) => {
        const groupId = parseInt(group.id)
        if (isNaN(groupId)) return Promise.resolve()
        return fetchAttendance(parseInt(course.id), groupId)
      })

      await Promise.all(attendancePromises)
    } catch (error) {
      console.error("Error loading attendance for groups:", error)
    } finally {
      // Clear loading state
      setLoadingAttendanceGroups((prev) => {
        const newState = { ...prev }
        course.groups.forEach((group: any) => {
          const id = parseInt(group.id)
          if (!isNaN(id)) {
            delete newState[id]
          }
        })
        return newState
      })
    }
  }

  const handleEnrollEmployee = async (
    employeeId: string | number,
    groupId?: number
  ) => {
    if (!course.id) {
      toast.info("Course ID is required to enroll")
      return
    }

    // Check if employee is already enrolled
    const existingEnrollment = enrollments.find(
      (e: any) =>
        e.employeeId === employeeId && e.enrollmentStatus !== "CANCELLED"
    )

    if (existingEnrollment) {
      // If already enrolled, offer to change group instead
      const confirmChange = confirm(
        `This employee is already enrolled in "${existingEnrollment.courseGroupName || "Group " + existingEnrollment.courseGroupId}". Would you like to change their group instead?`
      )

      if (confirmChange && existingEnrollment.id) {
        // Change their group using adminChangeGroup
        try {
          const targetGroupId =
            groupId ||
            parseInt(String(course.groups?.[0]?.id || "1").replace("g", ""))
          const result = await adminChangeGroup(
            existingEnrollment.id,
            targetGroupId
          )
          if (result.success) {
            toast.success(
              ` Employee moved to Group ${targetGroupId} successfully!`
            )
            if (course.id) {
              await fetch_courseEnrollments(course.id)
              await refreshAllGroupAttendance()
            }
          } else {
            toast.error(result.message || "Failed to change group")
          }
        } catch (error) {
          console.error("Error changing group:", error)
          toast.error("Failed to change group")
        }
        return
      }
      return
    }

    // Use the provided groupId or fallback to first group only if not provided
    let targetGroupId = groupId

    if (
      !targetGroupId &&
      course.courseType === "trainer" &&
      course.groups &&
      course.groups.length > 0
    ) {
      targetGroupId = parseInt(String(course.groups[0].id).replace("g", ""))
    }

    if (!targetGroupId) {
      targetGroupId = 1
    }

    setIsEnrolling(true)
    try {
      const result = await enrollEmployee(course.id, targetGroupId, employeeId)

      if (result.success) {
        if (course.id) {
          await fetch_courseEnrollments(course.id)
          await refreshAllGroupAttendance()
        }
      } else {
        toast.error(result.message || "Failed to enroll employee")
      }
    } catch (error) {
      console.error("Error enrolling employee:", error)
      toast.error("An error occurred while enrolling")
    } finally {
      setIsEnrolling(false)
    }
  }

  // 🆕 Handle unenrolling employee from LearnersTab
  const handleUnenrollEmployee = async (enrollmentId: number) => {
    if (!course.id) {
      toast.warning("Course ID is required to unenroll")
      return
    }

    setIsUnenrolling(true)
    try {
      const result = await unenrollEmployee(course.id, enrollmentId)

      if (result.success) {
        toast.success(` Employee unenrolled successfully!`)
        // Refresh enrollments
        if (course.id) {
          await fetch_courseEnrollments(course.id)
          await refreshAllGroupAttendance()
        }
      } else {
        toast.error(result.message || "Failed to unenroll employee")
      }
    } catch (error) {
      console.error("Error unenrolling employee:", error)
      toast.error("An error occurred while unenrolling")
    } finally {
      setIsUnenrolling(false)
    }
  }

  // Handle group change request
  const handleRequestGroupChange = async (groupId: string) => {
    if (!currentUserEnrollment) {
      toast.warning("You are not enrolled in this course")
      return
    }

    setIsRequestingGroupChange(true)
    try {
      const result = await requestGroupChange(
        currentUserEnrollment.id,
        parseInt(groupId)
      )

      if (result.success) {
        toast.success(
          result.message || "Group change request submitted successfully!"
        )
        if (course.id) {
          await fetch_courseEnrollments(course.id)
        }
        setChangeGroupRequestDialogOpen(false)
      } else {
        toast.error(result.message || "Failed to submit group change request")
      }
    } catch (error) {
      console.error("Error requesting group change:", error)
      toast.error("An error occurred while submitting your request")
    } finally {
      setIsRequestingGroupChange(false)
    }
  }

  // Handle approve group change request
  const handleApproveRequest = async (enrollmentId: number) => {
    const confirmed = await dialog.confirm(
      "Approve Group Change",
      "Are you sure you want to approve this group change request?",
      "Yes, Approve",
      "Cancel"
    )

    if (!confirmed) {
      return
    }

    setIsProcessingRequest(true)
    try {
      const result = await approveGroupChange(enrollmentId)

      if (result.success) {
        toast.success(
          result.message || "Group change request approved successfully!"
        )
        if (course.id) {
          await fetch_courseEnrollments(course.id)
          await refreshAllGroupAttendance()
        }
      } else {
        toast.error(result.message || "Failed to approve group change request")
      }
    } catch (error) {
      console.error("Error approving group change:", error)
      toast.error("An error occurred while approving the request")
    } finally {
      setIsProcessingRequest(false)
    }
  }

  // Handle reject group change request
  const handleRejectRequest = async (enrollmentId: number) => {
    const confirmed = await dialog.confirm(
      "Reject Group Change",
      "Are you sure you want to reject this group change request?",
      "Yes, Reject",
      "Cancel",
      undefined,
      true // isDestructive
    )

    if (!confirmed) {
      return
    }

    setIsProcessingRequest(true)
    try {
      const result = await rejectGroupChange(enrollmentId)

      if (result.success) {
        toast.success(
          result.message || "Group change request rejected successfully!"
        )
        if (course.id) {
          await fetch_courseEnrollments(course.id)
        }
      } else {
        toast.error(result.message || "Failed to reject group change request")
      }
    } catch (error) {
      console.error("Error rejecting group change:", error)
      toast.error("An error occurred while rejecting the request")
    } finally {
      setIsProcessingRequest(false)
    }
  }

  // Handle admin group change (for LearnersTab)
  const handleAdminChangeGroup = async (
    enrollmentId: number,
    newGroupId: number
  ) => {
    try {
      const result = await adminChangeGroup(enrollmentId, newGroupId)
      if (result.success) {
        if (course.id) {
          await fetch_courseEnrollments(course.id)
          await refreshAllGroupAttendance()
        }
        toast.success("Group changed successfully!")
      } else {
        toast.error(result.message || "Failed to change group")
      }
    } catch (error) {
      console.error("Failed to change group:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to change group"
      )
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    if (course.id) {
      await fetch_courseEnrollments(course.id)
      await refreshAllGroupAttendance()
    }
  }

  // Load attendance for all groups when course loads
  useEffect(() => {
    refreshAllGroupAttendance()
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

    setSavingAttendance((prev) => ({ ...prev, [key]: true }))
    setAttendanceStatuses((prev) => ({ ...prev, [key]: value }))

    try {
      const existingAttendance = attendances.find(
        (a: any) =>
          a.courseSessionId === parseInt(sessionId) &&
          a.enrollmentId === enrollmentId
      )

      const request = {
        enrollmentId,
        courseSessionId: parseInt(sessionId),
        attendanceStatus: value as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
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
        result = await createAttendance(parseInt(course.id), groupId, request)
      }

      // Refresh attendance for all groups after change
      await refreshAllGroupAttendance()

      setSavedAttendance((prev) => ({ ...prev, [key]: true }))

      setTimeout(() => {
        setSavedAttendance((prev) => {
          const newState = { ...prev }
          delete newState[key]
          return newState
        })
      }, 500)
    } catch (error) {
      console.error(" Error saving attendance:", error)

      setAttendanceStatuses((prev) => {
        const newState = { ...prev }
        delete newState[key]
        return newState
      })

      toast.error("Failed to save attendance. Please try again.")
    } finally {
      setSavingAttendance((prev) => ({ ...prev, [key]: false }))
    }
  }

  // Handle Register
  const handleRegister = async () => {
    if (!course.groups || course.groups.length === 0) {
      toast.info("No groups available for enrollment")
      return
    }

    const groupId = selectedGroupId || course.groups[0].id
    const groupIdNum = parseInt(groupId)

    setIsEnrolling(true)
    try {
      const result = await enrollEmployee(course.id, groupIdNum)

      if (result.success) {
        toast.success(result.message || "Successfully enrolled in the course!")
        await fetch_courseEnrollments(course.id)
        await refreshAllGroupAttendance()

        if (onRegister) {
          onRegister(course)
        }
      } else {
        toast.error(result.message || "Failed to enroll in the course")
      }
    } catch (error) {
      console.error("Error enrolling:", error)
      toast.error("An error occurred while enrolling")
    } finally {
      setIsEnrolling(false)
    }
  }

  // Handle Unenroll
  const handleUnenroll = async () => {
    if (!currentUserEnrollment) {
      toast.info("You are not enrolled in this course")
      return
    }

    const confirmed = await dialog.confirm(
      "Confirm Unenrollment",
      "Are you sure you want to unenroll from this course?",
      "Yes, Unenroll",
      "Cancel",
      undefined,
      true // isDestructive
    )

    if (!confirmed) {
      return
    }

    setIsUnenrolling(true)
    try {
      const result = await unenrollEmployee(course.id, currentUserEnrollment.id)

      if (result.success) {
        toast.success(
          result.message || "Successfully unenrolled from the course"
        )
        setCurrentUserEnrollment(null)
        await fetch_courseEnrollments(course.id)
        await refreshAllGroupAttendance()

        if (onRegister) {
          onRegister(course)
        }
      } else {
        toast.error(result.message || "Failed to unenroll from the course")
      }
    } catch (error) {
      console.error("Error unenrolling:", error)
      toast.error("An error occurred while unenrolling")
    } finally {
      setIsUnenrolling(false)
    }
  }

  // Memoized tab counts
  const tabCounts = useMemo(() => {
    // Get total learners (excluding cancelled)
    const totalLearners = enrollments.filter(
      (e: any) => e.enrollmentStatus !== "CANCELLED"
    ).length

    // Get learners count based on approver's team
    let approverLearners = totalLearners
    if (isApprover && profile?.team) {
      approverLearners = enrollments.filter(
        (e: any) =>
          e.enrollmentStatus !== "CANCELLED" && e.teamName === profile.team
      ).length
    }

    return {
      groups: course.groups?.length || 0,
      sessions:
        course.self_study_sessions?.length || course.sessions?.length || 0,
      learners: isApprover ? approverLearners : totalLearners,
      groupRequests: enrollments.filter(
        (e: any) => e.groupChangeStatus === "PENDING"
      ).length,
    }
  }, [
    enrollments,
    course.groups,
    course.self_study_sessions,
    course.sessions,
    isApprover,
    profile,
  ])

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
    <div className="flex w-full min-w-0 flex-col gap-4">
      {/* Tabs */}
      <div className="flex items-center justify-between gap-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex w-full min-w-0 flex-1"
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  strokeWidth={2}
                  className="h-4 w-4"
                />
              </Button>
              <TabsList className="h-auto">
                <TabsTrigger value="information" className="gap-2">
                  Information
                </TabsTrigger>
                {/* 
                {course.courseType === "trainer" &&
                  course.groups &&
                  course.groups.length > 0 && (
                    <TabsTrigger value="groups" className="gap-2">
                      Groups
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-5 px-1.5 text-xs",
                          activeTab === "groups"
                            ? "bg-secondary"
                            : "bg-muted-foreground/20 text-muted-foreground"
                        )}
                      >
                        {tabCounts.groups}
                      </Badge>
                    </TabsTrigger>
                  )} */}

                {/* {course.courseType === "self-study" && (
                  <TabsTrigger value="sessions" className="gap-2">
                    Sessions
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 px-1.5 text-xs",
                        activeTab === "sessions"
                          ? "bg-secondary"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {tabCounts.sessions}
                    </Badge>
                  </TabsTrigger>
                )} */}

                {/* ✅ Attendance Tab - visible for all users */}
                {course.courseType === "trainer" &&
                  (isAdmin || isUserEnrolled) &&
                  course.groups &&
                  course.groups.length > 0 && (
                    <TabsTrigger value="attendance" className="gap-2">
                      Attendance
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-5 px-1.5 text-xs",
                          activeTab === "attendance"
                            ? "bg-secondary"
                            : "bg-muted-foreground/20 text-muted-foreground"
                        )}
                      >
                        {tabCounts.learners}
                      </Badge>
                    </TabsTrigger>
                  )}


                {/* ✅ Progress Tab - visible for all users */}
                {course.courseType === "self-study" && course.selfStudyType === "jlpt" && (
                  <TabsTrigger value="progress" className="gap-2">
                    Progress
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 px-1.5 text-xs",
                        activeTab === "progress"
                          ? "bg-secondary"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {tabCounts.learners}
                    </Badge>
                  </TabsTrigger>

                )}

                {course.courseType === "trainer" && isAdmin && (
                  <TabsTrigger value="group-requests" className="gap-2">
                    Group Requests
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 px-1.5 text-xs",
                        activeTab === "group-requests"
                          ? "bg-secondary"
                          : tabCounts.groupRequests > 0
                            ? "bg-red-500 text-white"
                            : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {tabCounts.groupRequests}
                    </Badge>
                  </TabsTrigger>
                )}

                {!isLearner && (
                  <TabsTrigger value="learners" className="gap-2">
                    Learners
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 px-1.5 text-xs",
                        activeTab === "learners"
                          ? "bg-secondary"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {tabCounts.learners}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            <div className="flex items-center gap-2">
              {/* Request Change Group Button - Hidden when disabled */}
              {canRequestGroupChange &&
                course.status !== "completed" &&
                !isChangeGroupRequestDisabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChangeGroupRequestDialogOpen(true)}
                    className="gap-2"
                  >
                    <HugeiconsIcon
                      icon={UserSwitchIcon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                    Request Group Change
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
                    // Only show Unenroll button if registration deadline not passed
                    // AND (not a self-study JLPT course OR not unenroll disabled)
                    !isRegistrationDeadlinePassed &&
                      (!(course.courseType === "self-study" && course.selfStudyType === "jlpt") || !isUnenrollDisabled) && (
                      <Button
                        onClick={handleUnenroll}
                        variant="destructive"
                        size="sm"
                        disabled={isUnenrolling}
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
                    )
                  ) : (
                    <Button
                      onClick={handleRegister}
                      size="sm"
                      disabled={
                        course.status === "completed" ||
                        isEnrolling ||
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
                  {/* Change Group Button - Hidden when disabled */}
                  {!isChangeGroupDisabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChangeGroupDialogOpen(true)}
                      className="gap-2"
                    >
                      <HugeiconsIcon
                        icon={UserSwitchIcon}
                        strokeWidth={2}
                        className="h-4 w-4"
                      />
                      Change Learners
                    </Button>
                  )}
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
          {activeTab === "information" && (
            <InformationTab
              course={course}
              enrollments={enrollments}
              userRole={userRole}
              profile={profile}
              enrollmentSearchTerm=""
              onSearchChange={() => { }}
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
              onEnrollEmployee={handleEnrollEmployee}
              onUnenrollEmployee={handleUnenrollEmployee}
              isEnrolling={isEnrolling}
              isUnenrolling={isUnenrolling}
              // SessionsTab props
              currentUserEnrollment={currentUserEnrollment}
              isUserEnrolled={isUserEnrolled}
            />
          )}

          {/* ✅ Attendance Tab Content */}

          {activeTab === "attendance" &&
            course.courseType === "trainer" && (
              <AttendanceTab
                course={course}
                enrollments={enrollments}
                userRole={userRole || "learner"}
                currentUserId={currentUserId}
                currentUserEnrollment={currentUserEnrollment}
                profile={profile}
                attendanceRecords={attendances}
                attendanceStatuses={attendanceStatuses}
                savingAttendance={savingAttendance}
                savedAttendance={savedAttendance}
                loadingAttendanceGroups={loadingAttendanceGroups}
                onAttendanceChange={handleAttendanceChange}
              />
            )}

          {/* ✅ Progress Tab Content */}
          {activeTab === "progress" && course.courseType === "self-study" && (
            <ProgressTab
              userRole={userRole || "learner"}
              profile={profile}
              course={course}
              enrollments={enrollments}
              currentUserId={currentUserId}
              currentUserEnrollment={currentUserEnrollment}
              studyProgress={studyProgress}
              onRefreshProgress={() => fetch_studyProgress(course.id)}
            />
          )}

          {activeTab === "groups" &&
            course.courseType === "trainer" &&
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
                loadingAttendanceGroups={loadingAttendanceGroups}
              />
            )}

          {activeTab === "sessions" && course.courseType === "self-study" && (
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

          {activeTab === "group-change" &&
            course.courseType === "trainer" &&
            isLearner &&
            isUserEnrolled && (
              <GroupChangeTab
                course={course}
                currentUserEnrollment={currentUserEnrollment}
                onRequestGroupChange={() => { }}
              />
            )}

          {activeTab === "group-requests" &&
            course.courseType === "trainer" &&
            isAdmin && (
              <GroupRequestsTab
                enrollments={enrollments}
                onRefresh={handleRefresh}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
                isProcessing={isProcessingRequest}
                course={course}
              />
            )}

          {activeTab === "learners" && !isLearner && (
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
              onEnrollEmployee={handleEnrollEmployee}
              onUnenrollEmployee={handleUnenrollEmployee}
              isEnrolling={isEnrolling}
              isUnenrolling={isUnenrolling}
            />
          )}
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
            refreshAllGroupAttendance()
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
            refreshAllGroupAttendance()
          }
        }}
        currentUserEnrollment={currentUserEnrollment}
        onRequestGroupChange={handleRequestGroupChange}
        isRequesting={isRequestingGroupChange}
      />
    </div>
  )
}


