// components/cards/course-card.tsx
"use client"

import React from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  UserGroupIcon,
  ClockIcon,
} from "@hugeicons/core-free-icons"
import {
  Course,
  COURSE_TYPE_LABELS,
  COURSE_STATUS_LABELS,
} from "@/types/course"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface CourseCardProps {
  course: Course
  onView: (course: Course) => void
}

export function CourseCard({ course, onView }: CourseCardProps) {
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
      if (hasUnlimited) return "unlimited"
      const total = capacities.reduce(
        (sum, c) => sum + (typeof c === "number" ? c : 0),
        0
      )
      return total
    }
    return "unlimited" // Self-study doesn't have capacity
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
    // Self-study - use sessions date or null
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
    // Self-study - use sessions date or null
    const sessions = course.self_study_sessions?.length > 0 ? course.self_study_sessions : course.sessions
    if (sessions?.length > 0) {
      const dates = sessions.map((s) => s.date).filter((d) => d)
      if (dates.length === 0) return null
      return new Date(Math.max(...dates.map((d) => d.getTime())))
    }
    return null
  }

  const getStartTime = () => {
    if (course.courseType === "trainer" && course.groups?.length > 0) {
      const times = course.groups
        .flatMap((g) => g.sessions)
        .map((s) => s.startTime)
        .filter((t) => t)
      if (times.length === 0) return null
      // Return the earliest start time
      return times.sort()[0]
    }
    const sessions = course.self_study_sessions?.length > 0 ? course.self_study_sessions : course.sessions
    if (sessions?.length > 0) {
      const times = sessions.map((s) => s.startTime).filter((t) => t)
      if (times.length === 0) return null
      return times.sort()[0]
    }
    return null
  }

  const getEndTime = () => {
    if (course.courseType === "trainer" && course.groups?.length > 0) {
      const times = course.groups
        .flatMap((g) => g.sessions)
        .map((s) => s.endTime)
        .filter((t) => t)
      if (times.length === 0) return null
      // Return the latest end time
      return times.sort()[times.length - 1]
    }
    const sessions = course.self_study_sessions?.length > 0 ? course.self_study_sessions : course.sessions
    if (sessions?.length > 0) {
      const times = sessions.map((s) => s.endTime).filter((t) => t)
      if (times.length === 0) return null
      return times.sort()[times.length - 1]
    }
    return null
  }

  const totalSessions = getTotalSessions()
  const totalCapacity = getTotalCapacity()
  const groupCount = getGroupCount()
  const startDate = getStartDate()
  const endDate = getEndDate()
  const startTime = getStartTime()
  const endTime = getEndTime()

  const statusColors = {
    active: "bg-green-500",
    upcoming: "bg-blue-500",
    completed: "bg-gray-500",
    draft: "bg-yellow-500",
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null
    try {
      // Parse time string (assuming format like "09:00" or "09:00:00")
      const [hours, minutes] = timeString.split(":").map(Number)
      const date = new Date()
      date.setHours(hours, minutes, 0, 0)
      return format(date, "h:mm a")
    } catch {
      return timeString
    }
  }

  const formattedStartTime = formatTime(startTime)
  const formattedEndTime = formatTime(endTime)

  return (
    <Card className="gap-2 overflow-hidden pt-0 pb-3 transition-all hover:shadow-lg">
      {/* Image */}
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
            <span className="text-4xl font-bold text-primary/20">
              {course.title.charAt(0)}
              {course.title.split(' ').length > 1 && course.title.split(' ')[1]?.[0] || ''}
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
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

      {/* Content */}
      <CardHeader className="space-y-1 px-3 pb-1">
        <h3 className="line-clamp-1 text-base font-semibold">{course.title}</h3>
        <Badge className="border-0 bg-secondary/90 text-xs font-medium text-secondary-foreground backdrop-blur-sm">
          {COURSE_TYPE_LABELS[course.courseType]}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon
            icon={Calendar03Icon}
            strokeWidth={1.5}
            className="h-4 w-4 shrink-0"
          />
          <span>
            {startDate ? format(startDate, "MMM d, yyyy") : "TBD"}
            {endDate && ` - ${format(endDate, "MMM d, yyyy")}`}
          </span>
        </div>

        {(formattedStartTime || formattedEndTime) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HugeiconsIcon
              icon={ClockIcon}
              strokeWidth={1.5}
              className="h-4 w-4 shrink-0"
            />
            <span>
              {formattedStartTime && formattedEndTime
                ? `${formattedStartTime} - ${formattedEndTime}`
                : formattedStartTime || formattedEndTime}
            </span>
          </div>
        )}

        {course.courseType === "trainer" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HugeiconsIcon
              icon={UserGroupIcon}
              strokeWidth={1.5}
              className="h-4 w-4 shrink-0"
            />
            <span>
              Total Capacity:{" "}
              {typeof totalCapacity === "number" ? totalCapacity : "Unlimited"}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onView(course)}
        >
          View detail
        </Button>
      </CardFooter>
    </Card>
  )
}
