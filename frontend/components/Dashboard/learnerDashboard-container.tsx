// app/dashboard/learnerDashboard-container.tsx
"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  ChampionIcon,
  UserIcon,
  BellIcon,
  CheckmarkCircle01Icon,
  Attachment01Icon,
  NotificationIcon,
  BookIcon,
  Certificate01Icon,
  Calendar01Icon,
  ArrowRight01Icon,
  UserGroupIcon,
  VideoIcon,
  PresentationIcon,
  File01Icon,
  Message01Icon,
  PenToolIcon,
  PlayIcon,
  ChevronDownIcon,
  TargetIcon,
  CheckmarkBadge01Icon,
  ProgressIcon,
  TimerIcon,
  DashboardBrowsingIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { StatCard } from "../charts/stat-card"
import { CHART_COLORS, JLPT_COLORS } from "../charts/chart-config"
import { NotificationsDrawer } from "../drawers/notifications-drawer"

// Types
interface Session {
  id: number
  courseId: number
  courseTitle: string
  courseType: "trainer" | "self-study"
  date: string
  startTime: string
  endTime: string
  status: "active" | "upcoming"
  attendanceStatus?: "present" | "absent" | "late" | "excused" | null
  // Self-study progress
  progress?: {
    kanji: { completed: number; target: number }
    vocab: { completed: number; target: number }
    grammar: { completed: number; target: number }
    reading: { completed: number; target: number }
    listening: { completed: number; target: number }
  }
}

// Mock data
const mockJLPTData = {
  current: [
    { level: "N1", value: 15 },
    { level: "N2", value: 25 },
    { level: "N3", value: 35 },
    { level: "N4", value: 20 },
    { level: "N5", value: 5 },
  ],
  target: [
    { level: "N1", value: 30 },
    { level: "N2", value: 35 },
    { level: "N3", value: 20 },
    { level: "N4", value: 10 },
    { level: "N5", value: 5 },
  ],
}

const mockStudyProgress = [
  { course: "JLPT N2 Preparation", progress: 75, status: "In Progress" },
  { course: "Business Japanese", progress: 45, status: "In Progress" },
  { course: "Kanji Mastery", progress: 90, status: "Almost Done" },
  { course: "Conversation Practice", progress: 30, status: "In Progress" },
]

// Mock attendance data by course
const mockAttendanceDataByCourse: Record<
  string,
  { day: string; value: number }[]
> = {
  "JLPT N2 Grammar": [
    { day: "Mon", value: 95 },
    { day: "Tue", value: 88 },
    { day: "Wed", value: 92 },
    { day: "Thu", value: 85 },
    { day: "Fri", value: 90 },
    { day: "Sat", value: 78 },
    { day: "Sun", value: 82 },
  ],
  "Business Writing": [
    { day: "Mon", value: 80 },
    { day: "Tue", value: 75 },
    { day: "Wed", value: 85 },
    { day: "Thu", value: 90 },
    { day: "Fri", value: 88 },
    { day: "Sat", value: 70 },
    { day: "Sun", value: 75 },
  ],
  "Kanji Mastery": [
    { day: "Mon", value: 100 },
    { day: "Tue", value: 95 },
    { day: "Wed", value: 98 },
    { day: "Thu", value: 92 },
    { day: "Fri", value: 96 },
    { day: "Sat", value: 85 },
    { day: "Sun", value: 88 },
  ],
  "Conversation Practice": [
    { day: "Mon", value: 70 },
    { day: "Tue", value: 65 },
    { day: "Wed", value: 75 },
    { day: "Thu", value: 80 },
    { day: "Fri", value: 72 },
    { day: "Sat", value: 60 },
    { day: "Sun", value: 68 },
  ],
}

// Mock upcoming sessions - limited to 3
const mockUpcomingSessions: Session[] = [
  {
    id: 1,
    courseId: 1,
    courseTitle: "JLPT N2 Grammar",
    courseType: "trainer",
    date: "2026-07-20",
    startTime: "09:00:00",
    endTime: "10:00:00",
    status: "active",
    attendanceStatus: null,
  },
  {
    id: 2,
    courseId: 2,
    courseTitle: "Business Writing",
    courseType: "trainer",
    date: "2026-07-22",
    startTime: "14:00:00",
    endTime: "15:30:00",
    status: "upcoming",
    attendanceStatus: "present",
  },
  {
    id: 3,
    courseId: 3,
    courseTitle: "Kanji Mastery",
    courseType: "self-study",
    date: "2026-07-25",
    startTime: "",
    endTime: "",
    status: "active",
    progress: {
      kanji: { completed: 5, target: 10 },
      vocab: { completed: 3, target: 10 },
      grammar: { completed: 2, target: 10 },
      reading: { completed: 0, target: 10 },
      listening: { completed: 0, target: 10 },
    },
  },
]

// Mock notifications - limited to 4
const mockNotifications = [
  {
    id: 1,
    actorName: "Dr. Sarah Johnson",
    actorAvatar: "/avatars/sarah.jpg",
    action: "published a new course",
    target: "Advanced React Patterns",
    targetBold: true,
    time: "15 mins ago",
    project: "Learning Platform",
    unread: true,
    type: "course",
  },
  {
    id: 2,
    actorName: "Prof. Michael Chen",
    actorAvatar: "/avatars/michael.jpg",
    action: "updated the",
    target: "JavaScript Mastery",
    targetBold: true,
    time: "1 hour ago",
    project: "Code Academy",
    unread: true,
    type: "course",
    attachment: {
      name: "JS_Mastery_v2.0.pdf",
    },
  },
  {
    id: 3,
    actorName: "Certification Board",
    actorAvatar: "/avatars/cert-board.jpg",
    action: "issued a new certificate for",
    target: "Full Stack Development",
    targetBold: true,
    time: "2 hours ago",
    project: "Certification Program",
    unread: true,
    type: "certificate",
    actions: [
      { label: "View", variant: "outline" },
      { label: "Approve", variant: "default" },
    ],
  },
  {
    id: 4,
    actorName: "JLPT Admin",
    actorAvatar: "/avatars/jlpt-admin.jpg",
    action: "announced",
    target: "JLPT N2 Exam Registration",
    targetBold: true,
    time: "3 hours ago",
    project: "JLPT Exam Center",
    unread: true,
    type: "jlpt",
    actions: [{ label: "Enroll", variant: "default" }],
  },
]

const mockRecentActivities = [
  {
    id: 1,
    action: "Completed lesson 5",
    course: "JLPT N2 Grammar",
    time: "2 hours ago",
  },
  {
    id: 2,
    action: "Started new course",
    course: "Business Japanese",
    time: "1 day ago",
  },
  {
    id: 3,
    action: "Scored 85% on quiz",
    course: "Kanji Mastery",
    time: "2 days ago",
  },
]

const getInitials = (name: string) => {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"
  )
}

// Attendance status options
const ATTENDANCE_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
]

const getAttendanceStatusBadge = (status: string | null) => {
  if (!status) return null
  switch (status) {
    case "present":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          Present
        </Badge>
      )
    case "absent":
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          Absent
        </Badge>
      )
    case "late":
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          Late
        </Badge>
      )
    case "excused":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          Excused
        </Badge>
      )
    default:
      return null
  }
}

// Course options for dropdown
const COURSE_OPTIONS = [
  { value: "all", label: "All Courses" },
  { value: "JLPT N2 Grammar", label: "JLPT N2 Grammar" },
  { value: "Business Writing", label: "Business Writing" },
  { value: "Kanji Mastery", label: "Kanji Mastery" },
  { value: "Conversation Practice", label: "Conversation Practice" },
]

export default function LearnerDashboardContainer() {
  const [attendanceData] = useState(mockAttendanceDataByCourse)
  const [studyProgress] = useState(mockStudyProgress)
  const [notifications] = useState(mockNotifications)
  const [upcomingSessions, setUpcomingSessions] =
    useState<Session[]>(mockUpcomingSessions)
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>("all")

  // Self-study progress state
  const [selfStudyProgress, setSelfStudyProgress] = useState<{
    [key: number]: {
      kanji: number
      vocab: number
      grammar: number
      reading: number
      listening: number
    }
  }>({})

  // Calculate stats
  const totalCourses = 12
  const completedCourses = 8

  // Get current attendance data based on selected course
  const currentAttendanceData =
    selectedCourse === "all"
      ? attendanceData["JLPT N2 Grammar"] // Default to first course for "all"
      : attendanceData[selectedCourse] || attendanceData["JLPT N2 Grammar"]

  const avgAttendance = currentAttendanceData
    ? currentAttendanceData.reduce((acc, curr) => acc + curr.value, 0) /
    currentAttendanceData.length
    : 0

  // Session stats
  const totalSessions = upcomingSessions.length
  const activeSessions = upcomingSessions.filter(
    (s) => s.status === "active"
  ).length
  const upcomingSessionsCount = upcomingSessions.filter(
    (s) => s.status === "upcoming"
  ).length

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleAttendanceChange = (sessionId: number, value: string) => {
    setUpcomingSessions((prev) =>
      prev.map((session) => {
        if (session.id === sessionId) {
          return {
            ...session,
            attendanceStatus: value as
              "present" | "absent" | "late" | "excused" | null,
          }
        }
        return session
      })
    )
  }

  const handleProgressChange = (
    sessionId: number,
    field: string,
    value: number
  ) => {
    setSelfStudyProgress((prev) => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [field]: value,
      },
    }))
  }

  const handleSaveProgress = (sessionId: number) => {
    console.log(
      "Saving progress for session:",
      sessionId,
      selfStudyProgress[sessionId]
    )
    // Here you would save to your backend
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Active
          </Badge>
        )
      case "upcoming":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Upcoming
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <div className="container mx-auto space-y-6 p-6">
        {/* Stats Row - 4 cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Courses"
            value={totalCourses}
            icon={BookOpenIcon}
            description={`${completedCourses} completed`}
            trend={{ value: 12, direction: "up" }}
          />
          <StatCard
            title="Average Attendance"
            value={`${Math.round(avgAttendance)}%`}
            icon={CalendarIcon}
            description="This week's average"
            trend={{ value: 2, direction: "up" }}
          />
          <StatCard
            title="Total Sessions"
            value={totalSessions}
            icon={DashboardBrowsingIcon}
            description={`${activeSessions} active`}
          />
          <StatCard
            title="JLPT Level"
            value="N2"
            icon={ChampionIcon}
            description="Target: N1 by December"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Study Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your courses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {studyProgress.map((course, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">
                        {course.course}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {course.progress}%
                    </span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Attendance Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Attendance This Week</CardTitle>
              </div>
              {/* <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select> */}
            </CardHeader>
            <CardContent className="space-y-4">
              {studyProgress.map((course, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">
                        {course.course}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {course.progress}%
                    </span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <div className="flex w-full items-start gap-2 text-sm">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 leading-none font-medium">
                    Average attendance: {Math.round(avgAttendance)}%
                    {avgAttendance >= 80 ? (
                      <span className="text-green-600">✓ Great job!</span>
                    ) : avgAttendance >= 60 ? (
                      <span className="text-yellow-600">Keep it up!</span>
                    ) : (
                      <span className="text-red-600">Needs improvement</span>
                    )}
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* Upcoming Sessions - Limited to 3 */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>
                Your scheduled learning sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[500px] space-y-4 overflow-y-auto">
              {upcomingSessions.slice(0, 3).map((session) => (
                <div
                  key={session.id}
                  className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{session.courseTitle}</h4>
                        {session.courseType === "trainer" ? (
                          <Badge variant="outline" className="text-xs">
                            <HugeiconsIcon
                              icon={UserGroupIcon}
                              strokeWidth={2}
                              className="mr-1 h-3 w-3"
                            />
                            Trainer-led
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <HugeiconsIcon
                              icon={BookOpenIcon}
                              strokeWidth={2}
                              className="mr-1 h-3 w-3"
                            />
                            Self-study
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <HugeiconsIcon
                          icon={CalendarIcon}
                          strokeWidth={2}
                          className="h-3.5 w-3.5"
                        />
                        <span>
                          {new Date(session.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {session.courseType === "trainer" &&
                          <>
                            <span>•</span>
                            <HugeiconsIcon
                              icon={ClockIcon}
                              strokeWidth={2}
                              className="h-3.5 w-3.5"
                            />
                            <span>
                              {session.startTime.slice(0, 5)} -{" "}
                              {session.endTime.slice(0, 5)}
                            </span>
                          </>
                        }

                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(session.status)}
                    </div>
                  </div>

                  {/* Trainer-led session - Simple dropdown for learner */}
                  {session.courseType === "trainer" && (
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Attendance:
                        </span>
                        {session.attendanceStatus ? (
                          getAttendanceStatusBadge(session.attendanceStatus)
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not marked
                          </span>
                        )}
                      </div>
                      <Select
                        value={session.attendanceStatus || ""}
                        onValueChange={(value) =>
                          handleAttendanceChange(session.id, value)
                        }
                      >
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                          <SelectValue placeholder="Mark status" />
                        </SelectTrigger>
                        <SelectContent>
                          {ATTENDANCE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full",
                                    option.value === "present" &&
                                    "bg-green-500",
                                    option.value === "absent" && "bg-red-500",
                                    option.value === "late" && "bg-yellow-500",
                                    option.value === "excused" && "bg-blue-500"
                                  )}
                                />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Self-study session - Progress inputs */}
                  {session.courseType === "self-study" && session.progress && (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { key: "kanji", label: "Kanji" },
                          { key: "vocab", label: "Vocab" },
                          { key: "grammar", label: "Grammar" },
                          { key: "reading", label: "Reading (min)" },
                          { key: "listening", label: "Listening (min)" },
                        ].map((item) => (
                          <div key={item.key} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              {item.label}
                            </Label>
                            <Input
                              type="number"
                              value={
                                selfStudyProgress[session.id]?.[
                                item.key as keyof (typeof selfStudyProgress)[number]
                                ] ?? 0
                              }
                              onChange={(e) =>
                                handleProgressChange(
                                  session.id,
                                  item.key,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="h-8 text-center text-xs"
                              min={0}
                            />
                            <div className="text-center text-[10px] text-muted-foreground">
                              Target:{" "}
                              {
                                session.progress?.[
                                  item.key as keyof typeof session.progress
                                ]?.target
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleSaveProgress(session.id)}
                      >
                        Save Progress
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notifications - Limited to 4 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b py-0">
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Important updates and reminders
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                className="justify-center gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => setNotificationsDrawerOpen(true)}
              >
                All Notifications
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  className="h-4 w-4"
                />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[400px] scrollbar-thin space-y-4 overflow-y-auto">
              {notifications.slice(0, 4).map((notification, index) => {
                const isLast = index === notifications.slice(0, 4).length - 1
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative flex gap-3 transition-colors",
                      !isLast && "border-b border-gray-100 pb-4"
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 pt-0.5">
                      <Avatar className="h-10 w-10 rounded-full">
                        <AvatarImage
                          src={
                            notification.actorAvatar || "/avatars/default.jpg"
                          }
                          alt={notification.actorName}
                        />
                        <AvatarFallback className="rounded-full text-xs font-semibold text-gray-600">
                          {getInitials(notification.actorName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-snug text-gray-900">
                        <span className="font-semibold">
                          {notification.actorName}
                        </span>
                        <span className="text-gray-500">
                          {" "}
                          {notification.action}{" "}
                        </span>
                        {notification.targetBold ? (
                          <span className="font-semibold">
                            {notification.target}
                          </span>
                        ) : (
                          <span>{notification.target}</span>
                        )}
                        {notification.type === "share" && (
                          <span className="text-gray-500"> with you</span>
                        )}
                        {notification.type === "create" && (
                          <span className="text-gray-500"> for </span>
                        )}
                        {notification.type === "create" && (
                          <span className="font-semibold">
                            {notification.project}
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-[13px] text-gray-400">
                        {notification.time}
                        <span className="mx-1.5">•</span>
                        {notification.project}
                      </p>
                      {notification.actions && (
                        <div className="mt-3 flex items-center gap-2">
                          {notification.actions.map((action, i) => (
                            <Button
                              key={i}
                              variant={action.variant as "outline" | "default"}
                              size="sm"
                              onClick={() =>
                                console.log(`Action: ${action.label}`)
                              }
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      {notification.attachment && (
                        <div className="mt-3 flex items-center gap-2">
                          <HugeiconsIcon
                            icon={Attachment01Icon}
                            strokeWidth={2}
                            className="h-4 w-4 text-gray-400"
                          />
                          <span className="text-[13px] text-gray-500">
                            {notification.attachment.name}
                          </span>
                        </div>
                      )}
                    </div>
                    {notification.unread && (
                      <div className="flex-shrink-0 pt-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Your latest learning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivities.map((activity, index) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-background">
                      <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        strokeWidth={2}
                        className="h-3 w-3 text-muted-foreground"
                      />
                    </div>
                    {index < mockRecentActivities.length - 1 && (
                      <div className="absolute top-6 h-12 w-px bg-border" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-muted-foreground"> in </span>
                      <span className="font-medium">{activity.course}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* Notifications Drawer */}
      <NotificationsDrawer
        open={notificationsDrawerOpen}
        onOpenChange={setNotificationsDrawerOpen}
      />
    </>
  )
}
