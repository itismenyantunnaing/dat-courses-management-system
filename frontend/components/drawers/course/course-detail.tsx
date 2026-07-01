// components/drawers/course/course-detail.tsx
"use client"

import React from "react"
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
  UserAdd01Icon,
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

interface CourseDetailProps {
  course: Course
  onEdit: (course: Course) => void
  onBack: () => void
  userRole: string
  onRegister?: (course: Course) => void
  isRegistered?: boolean
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

  const handleRegister = () => {
    if (onRegister) {
      onRegister(course)
    }
  }

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
            </div>

            {/* Action Button - Edit for Admin/Approver, Register for Learner */}
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
              <Button
                onClick={handleRegister}
                className="w-full gap-2"
                disabled={isRegistered || course.status === "completed"}
                variant={isRegistered ? "outline" : "default"}
              >
                {isRegistered
                  ? "Registered"
                  : course.status === "completed"
                    ? "Course Completed"
                    : "Enroll course"}
              </Button>
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
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Groups Tab */}
          {course.courseType === "trainer" &&
            course.groups &&
            course.groups.length > 0 && (
              <TabsContent value="groups">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {course.groups.map((group, index) => (
                      <div key={index} className="rounded-lg border p-4">
                        <h4 className="font-medium">Group {index + 1}</h4>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <p>
                            <span className="font-medium">Start:</span>{" "}
                            {group.startDate
                              ? format(group.startDate, "MMM d, yyyy")
                              : "TBD"}
                          </p>
                          <p>
                            <span className="font-medium">End:</span>{" "}
                            {group.endDate
                              ? format(group.endDate, "MMM d, yyyy")
                              : "TBD"}
                          </p>
                          <p>
                            <span className="font-medium">Capacity:</span>{" "}
                            {group.capacity === "unlimited"
                              ? "Unlimited"
                              : group.capacity}
                          </p>
                          <p>
                            <span className="font-medium">Sessions:</span>{" "}
                            {group.sessions.length}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
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
