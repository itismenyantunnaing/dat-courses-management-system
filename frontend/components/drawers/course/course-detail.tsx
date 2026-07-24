"use client"

import React, { useEffect, useState } from "react"
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

interface CourseDetailProps {
  course: Course
  onEdit: (course: Course) => void
  onBack: () => void
  userRole: string
  onRegister?: (course: Course) => void
  isRegistered?: boolean
}

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
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")

  const {
    fetch_courseEnrollments,
    enrollments,
    getUserId,
    profile,
    enrollEmployee,
    unenrollEmployee,
  } = mainStore()

  const currentUserId = getUserId?.() || null

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

  const isUserEnrolled =
    !!currentUserEnrollment &&
    currentUserEnrollment.enrollmentStatus === "APPROVED"

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
    return deadline.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)
  }, [course.registrationDeadline])

  // Get employees by group
  const getEmployeesByGroup = (groupId: number) => {
    return enrollments.filter(
      (emp: any) =>
        emp.courseGroupId === groupId && emp.enrollmentStatus !== "CANCELLED"
    )
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
                {course.courseType === "trainer" &&
                  isLearner &&
                  isUserEnrolled && (
                    <TabsTrigger value="group-change">Change Group</TabsTrigger>
                  )}
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
              </TabsList>
            </div>
            <div className="flex items-center gap-2">
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

              {/* Edit Button for Admin */}
              {isAdmin && course.status !== "completed" && (
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
                attendanceRecords={[]}
                attendanceStatuses={{}}
                savingAttendance={{}}
                savedAttendance={{}}
                onAttendanceChange={() => {}}
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
              onRequestGroupChange={() => {}}
            />
          )}

          {course.courseType === "trainer" && isAdmin && (
            <GroupRequestsTab
              enrollments={enrollments}
              onRefresh={() => {}}
              onApprove={() => {}}
              onReject={() => {}}
            />
          )}

          <LearnersTab
            enrollments={enrollments}
            userRole={userRole}
            profile={profile}
            enrollmentSearchTerm=""
            onSearchChange={() => {}}
            onOpenChangeGroup={() => setChangeGroupDialogOpen(true)}
          />
        </Tabs>
      </div>

      {/* Change Group Dialogs */}
      <ChangeGroupDialogs
        course={course}
        enrollments={enrollments}
        open={changeGroupDialogOpen}
        onOpenChange={setChangeGroupDialogOpen}
      />
    </div>
  )
}
