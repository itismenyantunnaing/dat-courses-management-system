// components/drawers/course/course-detail.tsx
"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  UserGroupIcon,
  Edit03Icon,
  BookOpenIcon,
  ClockIcon,
  UserIcon,
  Calendar05Icon,
  InformationCircleIcon,
  Megaphone02Icon,
  User02Icon,
  UserMinus01Icon,
} from "@hugeicons/core-free-icons"
import {
  Course,
  COURSE_TYPE_LABELS,
  COURSE_STATUS_LABELS,
  isJLPTType,
} from "@/types/course"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { mainStore } from "@/store/mainStore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CourseDetailProps {
  course: Course
  onEdit: (course: Course) => void
  onBack: () => void
  userRole: string
  onRegister?: (course: Course) => void
  isRegistered?: boolean
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

// Mock announcements - you can replace this with actual data from your course
const getMockAnnouncements = (courseId: string) => {
  return [
    {
      id: "1",
      title: "Welcome to the Course!",
      content:
        "Welcome everyone! Please review the course materials before the first session.",
      createdAt: new Date(2026, 5, 20),
      author: "Instructor",
      priority: "high" as const,
    },
    {
      id: "2",
      title: "Schedule Update",
      content:
        "Please note that the session on July 15th has been rescheduled to July 16th.",
      createdAt: new Date(2026, 5, 22),
      author: "Admin",
      priority: "medium" as const,
    },
    {
      id: "3",
      title: "Course Materials Available",
      content:
        "The course materials for Week 1 are now available in the resources section.",
      createdAt: new Date(2026, 5, 23),
      author: "Instructor",
      priority: "low" as const,
    },
  ]
}

// Helper function to get initials from name
const getInitials = (name: string) => {
  if (!name) return "??"
  const parts = name.split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 30) => {
  if (!text) return ""
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
}

// Helper function to capitalize first letter
const capitalizeFirstLetter = (str: string) => {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function CourseDetail({
  course,
  onEdit,
  onBack,
  userRole,
  onRegister,
  isRegistered = false,
}: CourseDetailProps) {
  const isAdmin = userRole === "ADMIN" || userRole === "APPROVER"
  const isLearner = userRole === "LEARNER" || userRole === "STUDENT"
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isUnenrolling, setIsUnenrolling] = useState(false)
  const [enrolledEmployees, setEnrolledEmployees] = useState<EnrolledEmployee[]>([])
  const [currentUserEnrollment, setCurrentUserEnrollment] = useState<EnrolledEmployee | null>(null)
  const {
    fetch_courseEnrollments,
    enrollEmployee,
    unenrollEmployee,
    getMyEnrollment,
    getUserId
  } = mainStore();

  // Get current user ID
  const currentUserId = getUserId?.() || null

  // Check if current user is enrolled
  useEffect(() => {
    if (enrolledEmployees.length > 0 && currentUserId) {
      const userEnrollment = enrolledEmployees.find(
        emp => emp.employeeId === currentUserId
      )
      setCurrentUserEnrollment(userEnrollment || null)
    } else {
      setCurrentUserEnrollment(null)
    }
  }, [enrolledEmployees, currentUserId])

  useEffect(() => {
    const loadEnrollments = async () => {
      setIsLoadingEnrollments(true)
      try {
        const result = await fetch_courseEnrollments(course.id)
        console.log('Enrollment result:', result)

        if (Array.isArray(result)) {
          console.log('Setting enrollments from array:', result)
          setEnrolledEmployees(result)
        } else if (result && result.success && Array.isArray(result.data)) {
          console.log('Setting enrollments from result.data:', result.data)
          setEnrolledEmployees(result.data)
        } else if (result && result.data && Array.isArray(result.data)) {
          console.log('Setting enrollments from data:', result.data)
          setEnrolledEmployees(result.data)
        } else {
          console.log('Unexpected result format:', result)
          setEnrolledEmployees([])
        }
      } catch (error) {
        console.error('Error loading enrollments:', error)
        setEnrolledEmployees([])
      } finally {
        setIsLoadingEnrollments(false)
      }
    }

    if (course.id) {
      loadEnrollments()
    }
  }, [fetch_courseEnrollments, course.id])

  // Group employees by courseGroupId
  const getEmployeesByGroup = (groupId: number) => {
    return enrolledEmployees.filter(emp => emp.courseGroupId === groupId)
  }

  // Get unique statuses from enrolled employees
  const getUniqueStatuses = (employees: EnrolledEmployee[]) => {
    const statuses = employees.map(emp => emp.enrollmentStatus)
    return [...new Set(statuses)]
  }

  // Filter employees by status
  const getEmployeesByStatus = (employees: EnrolledEmployee[], status: string) => {
    return employees.filter(emp => emp.enrollmentStatus === status)
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

  const getTotalCapacity = () => {
    if (course.courseType === "trainer") {
      const capacities = course.groups?.map((g) => g.capacity) || []
      const hasUnlimited = capacities.some((c) => c === "unlimited")
      if (hasUnlimited) return "Unlimited"
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
    const sessions = course.self_study_sessions?.length > 0 ? course.self_study_sessions : course.sessions
    if (sessions?.length > 0) {
      const dates = sessions.map((s) => s.date).filter((d) => d)
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
    const sessions = course.self_study_sessions?.length > 0 ? course.self_study_sessions : course.sessions
    if (sessions?.length > 0) {
      const dates = sessions.map((s) => s.date).filter((d) => d)
      if (dates.length === 0) return null
      return new Date(Math.max(...dates.map((d) => d.getTime())))
    }
    return null
  }

  const totalSessions = getTotalSessions()
  const totalCapacity = getTotalCapacity()
  const groupCount = getGroupCount()
  const startDate = getStartDate()
  const endDate = getEndDate()

  const statusColors = {
    active: "bg-green-500",
    upcoming: "bg-blue-500",
    completed: "bg-gray-500",
    draft: "bg-yellow-500",
  }

  // Get announcements for this course
  const announcements = getMockAnnouncements(course.id)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-red-500"
      case "medium":
        return "border-l-4 border-yellow-500"
      case "low":
        return "border-l-4 border-blue-500"
      default:
        return "border-l-4 border-gray-300"
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700"
      case "medium":
        return "bg-yellow-100 text-yellow-700"
      case "low":
        return "bg-blue-100 text-blue-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  // In course-detail.tsx, update the handleRegister function
  const handleRegister = async () => {
    if (!course.groups || course.groups.length === 0) {
      alert('No groups available for enrollment')
      return
    }

    // Get the first group ID (you might want to let user select which group)
    const firstGroupId = parseInt(course.groups[0].id)

    setIsEnrolling(true)
    try {
      const result = await enrollEmployee(course.id, firstGroupId)

      if (result.success) {
        alert(result.message || 'Successfully enrolled in the course!')

        // Refresh enrollments to show updated list
        const refreshResult = await fetch_courseEnrollments(course.id)
        if (Array.isArray(refreshResult)) {
          setEnrolledEmployees(refreshResult)
        }

        // Call the parent onRegister callback if provided
        if (onRegister) {
          onRegister(course)
        }
      } else {
        alert(result.message || 'Failed to enroll in the course')
      }
    } catch (error) {
      console.error('Error enrolling:', error)
      alert('An error occurred while enrolling')
    } finally {
      setIsEnrolling(false)
    }
  }

  // Update the enrollment status check
  useEffect(() => {
    if (enrolledEmployees.length > 0 && currentUserId) {
      const enrollment = enrolledEmployees.find(
        emp => emp.employeeId === currentUserId
      )
      setCurrentUserEnrollment(enrollment || null)
    } else {
      setCurrentUserEnrollment(null)
    }
  }, [enrolledEmployees, currentUserId])

  const handleUnenroll = async () => {
    if (!currentUserEnrollment) {
      alert('You are not enrolled in this course')
      return
    }

    if (!confirm('Are you sure you want to unenroll from this course?')) {
      return
    }

    setIsUnenrolling(true)
    try {
      const result = await unenrollEmployee(course.id, currentUserEnrollment.id)

      if (result.success) {
        alert(result.message || 'Successfully unenrolled from the course')
        setCurrentUserEnrollment(null)

        // Refresh enrollments to show updated list
        const refreshResult = await fetch_courseEnrollments(course.id)
        if (Array.isArray(refreshResult)) {
          setEnrolledEmployees(refreshResult)
        }

        // Call the parent onRegister callback if provided
        if (onRegister) {
          onRegister(course)
        }
      } else {
        alert(result.message || 'Failed to unenroll from the course')
      }
    } catch (error) {
      console.error('Error unenrolling:', error)
      alert('An error occurred while unenrolling')
    } finally {
      setIsUnenrolling(false)
    }
  }

  // Show loading state while fetching enrollments
  if (isLoadingEnrollments) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading course details...</p>
        </div>
      </div>
    )
  }

  const isUserEnrolled = !!currentUserEnrollment && currentUserEnrollment.enrollmentStatus === 'APPROVED'

  return (
    <div className="flex h-full gap-6">
      {/* Left Side - Sticky Course Header */}
      <div className="sticky top-0 h-fit w-[320px] shrink-0">
        <Card className="gap-2 overflow-hidden pt-0 pb-3">
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            {course.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.imageUrl}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <span className="text-6xl font-bold text-primary/20">
                  {course.title.charAt(0)}
                </span>
              </div>
            )}

            <div className="absolute top-3 right-3 flex gap-2">
              <Badge
                className={cn(
                  "border-0 px-3 py-1 text-xs font-medium text-white",
                  statusColors[course.status]
                )}
              >
                {COURSE_STATUS_LABELS[course.status]}
              </Badge>
            </div>
          </div>

          <CardHeader className="space-y-4 px-3">
            <div className="space-y-2">
              <h1 className="text-xl leading-tight font-bold">
                {course.title}
              </h1>
              <Badge className="border-0 bg-secondary/90 text-xs font-medium text-secondary-foreground backdrop-blur-sm">
                {COURSE_TYPE_LABELS[course.courseType]}
              </Badge>
            </div>

            {/* Quick Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  strokeWidth={1.5}
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
                <span className="text-muted-foreground">
                  {startDate ? format(startDate, "MMM d, yyyy") : "TBD"}
                  {endDate && ` - ${format(endDate, "MMM d, yyyy")}`}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={BookOpenIcon}
                  strokeWidth={1.5}
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
                <span className="text-muted-foreground capitalize">
                  {course.category}
                </span>
              </div>

              {course.courseType === "trainer" && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon
                      icon={UserGroupIcon}
                      strokeWidth={1.5}
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                    />
                    <span className="text-muted-foreground">
                      Capacity: {totalCapacity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon
                      icon={UserGroupIcon}
                      strokeWidth={1.5}
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                    />
                    <span className="text-muted-foreground">
                      {groupCount} Group{groupCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </>
              )}

              {course.courseType === "self-study" && course.selfStudyType && (
                <div className="flex items-center gap-2 text-sm">
                  <HugeiconsIcon
                    icon={BookOpenIcon}
                    strokeWidth={1.5}
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                  />
                  <span className="text-muted-foreground capitalize">
                    {course.selfStudyType}
                  </span>
                </div>
              )}

              {/* Registration Deadline */}
              {course.registrationDeadline && (
                <div className="flex items-center gap-2 text-sm">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    strokeWidth={1.5}
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                  />
                  <span className="text-muted-foreground">
                    Registration Deadline: {format(course.registrationDeadline, "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons - Edit for Admin/Approver, Register/Unenroll for Learner */}
            {isAdmin && (
              <Button onClick={() => onEdit(course)} className="w-full gap-2">
                <HugeiconsIcon
                  icon={Edit03Icon}
                  strokeWidth={1.5}
                  className="h-4 w-4"
                />
                Edit Course
              </Button>
            )}

            {isLearner && (
              <div className="flex gap-2">
                <Button
                  onClick={handleRegister}
                  className="flex-1 gap-2"
                  disabled={isUserEnrolled || course.status === "completed" || isEnrolling}
                  variant={isUserEnrolled ? "outline" : "default"}
                >
                  {isEnrolling ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></span>
                      Enrolling...
                    </>
                  ) : isUserEnrolled ? (
                    "Registered"
                  ) : course.status === "completed" ? (
                    "Course Completed"
                  ) : (
                    "Enroll course"
                  )}
                </Button>

                {isUserEnrolled && (
                  <Button
                    onClick={handleUnenroll}
                    variant="destructive"
                    className="gap-2"
                    disabled={isUnenrolling}
                  >
                    {isUnenrolling ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                        Unenrolling...
                      </>
                    ) : (
                      "Unenroll"
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
        </Card>
      </div>

      {/* Right Side - Tabs Content */}
      <div className="min-w-0 flex-1">
        <Tabs defaultValue="information" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="information">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                strokeWidth={1.5}
                className="h-4 w-4"
              />
              Information
            </TabsTrigger>
            {course.courseType === "trainer" &&
              course.groups &&
              course.groups.length > 0 && (
                <TabsTrigger value="groups">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    strokeWidth={1.5}
                    className="h-4 w-4"
                  />
                  Groups ({course.groups.length})
                </TabsTrigger>
              )}
            {course.courseType === "self-study" && (
              <TabsTrigger value="sessions">
                <HugeiconsIcon
                  icon={Calendar05Icon}
                  strokeWidth={1.5}
                  className="h-4 w-4"
                />
                Sessions ({course.self_study_sessions?.length || course.sessions?.length || 0})
              </TabsTrigger>
            )}
            <TabsTrigger value="announcements">
              <HugeiconsIcon
                icon={Megaphone02Icon}
                strokeWidth={1.5}
                className="h-4 w-4"
              />
              Announcements ({announcements.length})
            </TabsTrigger>
          </TabsList>

          {/* Information Tab */}
          <TabsContent value="information">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      strokeWidth={1.5}
                      className="h-5 w-5 shrink-0 text-muted-foreground"
                    />
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-muted-foreground">
                        {startDate ? format(startDate, "MMM d, yyyy") : "TBD"}
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
                            {totalCapacity}
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
                          <p className="text-muted-foreground">
                            {totalSessions}
                          </p>
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
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Groups Tab - Now with Enrolled Employees */}
          {course.courseType === "trainer" &&
            course.groups &&
            course.groups.length > 0 && (
              <TabsContent value="groups">
                <div className="space-y-6">
                  {course.groups.map((group, index) => {
                    const groupEmployees = getEmployeesByGroup(parseInt(group.id))
                    const uniqueStatuses = getUniqueStatuses(groupEmployees)

                    return (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-semibold">Group {index + 1}: {group.name}</h4>
                              <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span>
                                  <span className="font-medium">Capacity:</span>{" "}
                                  {group.capacity === "unlimited" ? "Unlimited" : group.capacity}
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
                                  {group.startDate ? format(group.startDate, "MMM d, yyyy") : "TBD"}
                                </span>
                                {group.endDate && (
                                  <span>
                                    <span className="font-medium">End:</span>{" "}
                                    {format(group.endDate, "MMM d, yyyy")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge variant={group.status === "ACTIVE" ? "default" : "secondary"}>
                              {group.status || "Active"}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-4">
                          {/* Group Sessions */}
                          <div className="mb-4">
                            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <HugeiconsIcon
                                icon={Calendar05Icon}
                                strokeWidth={1.5}
                                className="h-4 w-4"
                              />
                              Sessions ({group.sessions.length})
                            </h5>
                            <div className="grid gap-2">
                              {group.sessions.map((session, idx) => (
                                <div key={idx} className="flex items-center gap-4 text-sm border-b border-muted pb-2 last:border-0">
                                  <span className="font-medium">Session {session.sessionNo || idx + 1}</span>
                                  <span className="text-muted-foreground">
                                    {session.date ? format(session.date, "MMM d, yyyy") : "TBD"}
                                  </span>
                                  {session.startTime && session.endTime && (
                                    <span className="text-muted-foreground">
                                      {session.startTime} - {session.endTime}
                                    </span>
                                  )}
                                  <Badge variant="outline" className="ml-auto text-[10px]">
                                    {session.status || "Planned"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Enrolled Employees for this Group - with Status Tabs */}
                          {groupEmployees.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-medium flex items-center gap-2">
                                  <HugeiconsIcon
                                    icon={User02Icon}
                                    strokeWidth={1.5}
                                    className="h-4 w-4"
                                  />
                                  Enrolled Employees ({groupEmployees.length})
                                </h5>
                              </div>

                              {/* Status Tabs */}
                              <Tabs defaultValue={uniqueStatuses[0]?.toLowerCase() || "all"} className="mb-4">
                                <TabsList className="mb-3">
                                  {uniqueStatuses.map((status) => (
                                    <TabsTrigger key={status} value={status.toLowerCase()} className="text-xs">
                                      {capitalizeFirstLetter(status)} ({getEmployeesByStatus(groupEmployees, status).length})
                                    </TabsTrigger>
                                  ))}
                                </TabsList>

                                {/* Status filtered employees */}
                                {uniqueStatuses.map((status) => (
                                  <TabsContent key={status} value={status.toLowerCase()}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {getEmployeesByStatus(groupEmployees, status).map((employee) => (
                                        <div key={employee.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                                          <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarImage src={employee.pfImage || ""} />
                                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                              {getInitials(employee.employeeName)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate" title={employee.employeeName}>
                                              {employee.employeeName}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate" title={`${employee.departmentName} • ${employee.teamName}`}>
                                              {truncateText(employee.departmentName, 25)}
                                              {employee.teamName && ` • ${truncateText(employee.teamName, 20)}`}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </TabsContent>
                                ))}
                              </Tabs>
                            </div>
                          )}

                          {/* No employees message */}
                          {groupEmployees.length === 0 && (
                            <div className="flex items-center justify-center rounded-lg border border-dashed p-6 text-center">
                              <div>
                                <HugeiconsIcon
                                  icon={User02Icon}
                                  strokeWidth={1.5}
                                  className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2"
                                />
                                <p className="text-sm text-muted-foreground">
                                  No employees enrolled in this group yet
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>
            )}

          {/* Sessions Tab */}
          {course.courseType === "self-study" && (
            <TabsContent value="sessions">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sessions</h3>
                <div className="flex flex-col gap-3">
                  {(course.self_study_sessions?.length > 0 ? course.self_study_sessions : course.sessions || []).map((session, index) => (
                    <Card key={index} className="overflow-hidden bg-muted/5 border-muted transition-colors hover:bg-muted/10">
                      <div className="flex flex-col sm:flex-row">
                        <div className="flex-1 p-4 border-b sm:border-b-0 sm:border-r bg-muted/10 flex items-center justify-between sm:justify-start gap-4 min-w-[140px]">
                          <span className="font-semibold text-sm">Session {index + 1}</span>
                          <Badge variant="outline" className="text-[10px] uppercase h-5">
                            {session.status || "Planned"}
                          </Badge>
                        </div>

                        <div className="flex-[2] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-xs">
                            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.5} className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground font-medium">
                              {session.date ? format(session.date, "MMM d, yyyy (EEE)") : "TBD"}
                            </span>
                          </div>

                          {isJLPTType(course.selfStudyType as any) ? (
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                              {session.kanjiCount !== undefined && (
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-muted-foreground">Kanji:</span>
                                  <span className="font-semibold">{session.kanjiCount}</span>
                                </div>
                              )}
                              {session.vocabularyCount !== undefined && (
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-muted-foreground">Vocab:</span>
                                  <span className="font-semibold">{session.vocabularyCount}</span>
                                </div>
                              )}
                              {session.grammarCount !== undefined && (
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-muted-foreground">Grammar:</span>
                                  <span className="font-semibold">{session.grammarCount}</span>
                                </div>
                              )}
                              {session.readingMinutes !== undefined && (
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-muted-foreground">Reading:</span>
                                  <span className="font-semibold">{session.readingMinutes}m</span>
                                </div>
                              )}
                              {session.listeningMinutes !== undefined && (
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-muted-foreground">Listening:</span>
                                  <span className="font-semibold">{session.listeningMinutes}m</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            session.link && (
                              <div className="flex items-center gap-2 text-[11px]">
                                <HugeiconsIcon icon={Megaphone02Icon} strokeWidth={1.5} className="h-4 w-4 text-muted-foreground" />
                                <a
                                  href={session.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary font-medium hover:underline truncate max-w-[200px]"
                                >
                                  Resources Link
                                </a>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Announcements</h3>
                {isAdmin && (
                  <Button size="sm" className="gap-2">
                    <HugeiconsIcon
                      icon={Megaphone02Icon}
                      strokeWidth={1.5}
                      className="h-4 w-4"
                    />
                    New Announcement
                  </Button>
                )}
              </div>

              {announcements.length > 0 ? (
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className={cn(
                        "rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5",
                        getPriorityColor(announcement.priority)
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {announcement.title}
                            </h4>
                            <Badge
                              className={cn(
                                "text-xs font-medium",
                                getPriorityBadgeColor(announcement.priority)
                              )}
                            >
                              {announcement.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {announcement.content}
                          </p>
                          <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                            <span>By: {announcement.author}</span>
                            <span>
                              {format(announcement.createdAt, "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex shrink-0 gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <HugeiconsIcon
                                icon={Edit03Icon}
                                strokeWidth={1.5}
                                className="h-4 w-4"
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <HugeiconsIcon
                                icon={ClockIcon}
                                strokeWidth={1.5}
                                className="h-4 w-4"
                              />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                  <HugeiconsIcon
                    icon={Megaphone02Icon}
                    strokeWidth={1.5}
                    className="h-12 w-12 text-muted-foreground/50"
                  />
                  <h4 className="mt-4 text-lg font-semibold">
                    No Announcements
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    There are no announcements for this course yet.
                  </p>
                  {isAdmin && (
                    <Button className="mt-4 gap-2">
                      <HugeiconsIcon
                        icon={Megaphone02Icon}
                        strokeWidth={1.5}
                        className="h-4 w-4"
                      />
                      Create First Announcement
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}