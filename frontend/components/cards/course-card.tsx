// components/cards/course-card.tsx
"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Calendar05Icon,
  ClockIcon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import {
  Course,
  COURSE_TYPE_LABELS,
  COURSE_STATUS_LABELS,
} from "@/types/course"
import { format, differenceInDays, isAfter, isBefore } from "date-fns"
import { cn } from "@/lib/utils"

interface CourseCardProps {
  course: Course
  onView: (course: Course) => void
  isEnrolled?: boolean
  progress?: number // 0-100
}

const statusColors = {
  active: "bg-green-500",
  upcoming: "bg-blue-500",
  completed: "bg-gray-500",
  draft: "bg-yellow-500",
}

// Helper function to get course start date
const getCourseStartDate = (course: Course): Date | null => {
  if (course.courseType === "trainer") {
    const dates = course.groups?.map((g) => g.startDate).filter((d) => d) || []
    if (dates.length === 0) return null
    return new Date(Math.min(...dates.map((d) => d.getTime())))
  }
  return null
}

// Helper function to get course end date
const getCourseEndDate = (course: Course): Date | null => {
  if (course.courseType === "trainer") {
    const dates = course.groups?.map((g) => g.endDate).filter((d) => d) || []
    if (dates.length === 0) return null
    return new Date(Math.max(...dates.map((d) => d.getTime())))
  }
  return null
}

// Helper function to get course start time (from first group's first session)
const getCourseStartTime = (course: Course): string | null => {
  if (course.courseType === "trainer") {
    const firstGroup = course.groups?.[0]
    const firstSession = firstGroup?.sessions?.[0]
    return firstSession?.startTime || firstGroup?.startTime || null
  }
  return null
}

// Helper function to get course end time (from first group's first session)
const getCourseEndTime = (course: Course): string | null => {
  if (course.courseType === "trainer") {
    const firstGroup = course.groups?.[0]
    const firstSession = firstGroup?.sessions?.[0]
    return firstSession?.endTime || firstGroup?.endTime || null
  }
  return null
}

// Helper function to get total sessions
const getTotalSessions = (course: Course): number => {
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

// Helper function to get days until registration closes
const getDaysUntilClose = (
  registrationDeadline: Date | string | undefined
): number | null => {
  if (!registrationDeadline) return null

  const deadline =
    typeof registrationDeadline === "string"
      ? new Date(registrationDeadline)
      : registrationDeadline

  const today = new Date()

  // Reset time to midnight for accurate day comparison
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(0, 0, 0, 0)

  const todayDate = new Date(today)
  todayDate.setHours(0, 0, 0, 0)

  const days = differenceInDays(deadlineDate, todayDate)
  return days
}

export function CourseCard({
  course,
  onView,
  isEnrolled = false,
  progress = 0,
}: CourseCardProps) {
  const startDate = getCourseStartDate(course)
  const endDate = getCourseEndDate(course)
  const startTime = getCourseStartTime(course)
  const endTime = getCourseEndTime(course)

  const isTrainer = course.courseType === "trainer"
  const isSelfStudy = course.courseType === "self-study"
  const isDraft = course.status === "draft"
  const isCompleted = course.status === "completed"
  const totalSessions = getTotalSessions(course)

  // Registration deadline info
  const daysUntilClose = getDaysUntilClose(course.registrationDeadline)
  const isRegistrationClosingSoon =
    daysUntilClose !== null && daysUntilClose <= 7 && daysUntilClose > 0
  const isRegistrationClosed = daysUntilClose !== null && daysUntilClose < 0
  const isDeadlineToday = daysUntilClose !== null && daysUntilClose === 0

  // Format date range
  const dateRange = startDate
    ? endDate
      ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
      : format(startDate, "MMM d, yyyy")
    : "TBD"

  // Format time range
  const timeRange =
    startTime && endTime
      ? `${startTime} - ${endTime}`
      : startTime
        ? `${startTime}`
        : "TBD"

  // Format registration deadline display
  const getRegistrationDisplay = () => {
    if (!course.registrationDeadline) return null

    if (isRegistrationClosed) {
      return {
        text: "Registration Closed",
        className: "text-red-500",
        icon: AlertCircleIcon,
      }
    }
    if (isDeadlineToday) {
      return {
        text: "Last day to register",
        className: "text-orange-500",
        icon: AlertCircleIcon,
      }
    }
    if (daysUntilClose === 1) {
      return {
        text: "Closes tomorrow",
        className: "text-orange-500",
        icon: AlertCircleIcon,
      }
    }
    if (isRegistrationClosingSoon) {
      return {
        text: `Closes in ${daysUntilClose} days`,
        className: "text-orange-500",
        icon: AlertCircleIcon,
      }
    }
    return {
      text: `Registration closes ${format(new Date(course.registrationDeadline), "MMM d, yyyy")}`,
      className: "text-muted-foreground",
      icon: Calendar03Icon,
    }
  }

  const registrationInfo = getRegistrationDisplay()

  return (
    <Card
      className={cn(
        "group overflow-hidden p-0 pbe-4 transition-all hover:border-primary/50",
        isDraft && "opacity-70"
      )}
    >
      {/* Course Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {course.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.imageUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-4xl font-bold text-primary/20">
              {course.title.charAt(0)}
            </span>
          </div>
        )}

        {/* Status Badge */}
        {!isDraft && (
          <div className="absolute top-3 right-3">
            <Badge
              className={cn(
                "border-0 px-2.5 py-1 text-xs font-medium text-white shadow-sm",
                statusColors[course.status]
              )}
            >
              {COURSE_STATUS_LABELS[course.status]}
            </Badge>
          </div>
        )}
        {isDraft && (
          <div className="absolute top-3 right-3">
            <Badge
              variant="outline"
              className="border-yellow-400 bg-yellow-50/90 text-xs font-medium text-yellow-700 backdrop-blur-sm"
            >
              Draft
            </Badge>
          </div>
        )}

        {/* Enrolled Badge - Top Left (if enrolled) */}
        {isEnrolled && (
          <div className="absolute top-3 left-3">
            <Badge className="border-0 bg-green-500/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={1.5}
                className="mr-1 h-3 w-3"
              />
              Enrolled
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4">
        <div className="mb-3 flex items-center gap-1">
          <Badge variant="outline">
            {COURSE_TYPE_LABELS[course.courseType]}
          </Badge>
          {isTrainer && course.trainerName && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                By{" "}
                <span className="font-medium text-primary">
                  {course.trainerName}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Course Name */}
        <h3 className="line-clamp-1 text-xl leading-tight font-semibold">
          {course.title}
        </h3>

        {/* Registration Deadline (only show if not enrolled and not completed and not draft) */}
        {!isEnrolled && !isCompleted && !isDraft && registrationInfo && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs">
            <HugeiconsIcon
              icon={registrationInfo.icon}
              strokeWidth={1.5}
              className={cn("h-3.5 w-3.5", registrationInfo.className)}
            />
            <span className={registrationInfo.className}>
              {registrationInfo.text}
            </span>
          </div>
        )}

        {/* Date and Time Row (only for trainer courses) */}
        {isTrainer && (
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <HugeiconsIcon
                icon={Calendar03Icon}
                strokeWidth={1.5}
                className="h-3.5 w-3.5"
              />
              <span>{dateRange}</span>
            </div>
            <div className="flex items-center gap-1">
              <HugeiconsIcon
                icon={ClockIcon}
                strokeWidth={1.5}
                className="h-3.5 w-3.5"
              />
              <span>{timeRange}</span>
            </div>
          </div>
        )}

        {/* Bottom Row: Total Sessions or Progress Bar + Continue Button */}
        <div className="mt-3 flex items-center justify-between gap-3">
          {/* Left side: Total Sessions (if not enrolled) or Progress Bar (if enrolled) */}
          <div className="min-w-0 flex-1">
            {isEnrolled ? (
              // Progress Bar for enrolled courses
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.min(progress, 100)}%</span>
                </div>
                <Progress
                  value={Math.min(progress, 100)}
                  className="h-2 w-full"
                />
              </div>
            ) : (
              // Total Sessions for non-enrolled courses
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <HugeiconsIcon
                  icon={Calendar05Icon}
                  strokeWidth={1.5}
                  className="h-3.5 w-3.5"
                />
                <span>
                  {totalSessions} {totalSessions === 1 ? "Session" : "Sessions"}
                </span>
              </div>
            )}
          </div>

          {/* Right side: Continue/View Button */}
          <Button
            variant={isEnrolled ? "default" : "outline"}
            size="default"
            onClick={() => onView(course)}
            className="shrink-0 gap-1"
          >
            {isEnrolled ? "Continue" : "View"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
