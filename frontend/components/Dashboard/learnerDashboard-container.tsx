// app/dashboard/learnerDashboard-container.tsx
"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
} from "@hugeicons/core-free-icons"
import { StatCard } from "../charts/stat-card"
import { CHART_COLORS, JLPT_COLORS } from "../charts/chart-config"

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

const mockAttendanceData = [
  { day: "Mon", value: 95 },
  { day: "Tue", value: 88 },
  { day: "Wed", value: 92 },
  { day: "Thu", value: 85 },
  { day: "Fri", value: 90 },
  { day: "Sat", value: 78 },
  { day: "Sun", value: 82 },
]

const mockUpcomingCourses = [
  { id: 1, title: "JLPT N2 Grammar", date: "2026-07-20", type: "Live" },
  { id: 2, title: "Business Writing", date: "2026-07-22", type: "Self-paced" },
  { id: 3, title: "Speaking Practice", date: "2026-07-25", type: "Live" },
]

const mockNotifications = [
  {
    id: 1,
    message: "New study materials available for JLPT N2",
    priority: "high",
    time: "2 hours ago",
  },
  {
    id: 2,
    message: "Your attendance is at 95% this week",
    priority: "medium",
    time: "5 hours ago",
  },
  {
    id: 3,
    message: "Upcoming quiz on Thursday",
    priority: "low",
    time: "1 day ago",
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

export default function LearnerDashboardContainer() {
  const [attendanceData] = useState(mockAttendanceData)
  const [studyProgress] = useState(mockStudyProgress)

  // Calculate stats
  const totalCourses = 12
  const completedCourses = 8
  const avgAttendance =
    attendanceData.reduce((acc, curr) => acc + curr.value, 0) /
    attendanceData.length

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Courses"
          value={totalCourses}
          icon={BookOpenIcon}
          description={`${completedCourses} completed`}
          trend={{ value: 12, direction: "up" }}
        />
        <StatCard
          title="Attendance"
          value={`${Math.round(avgAttendance)}%`}
          icon={CalendarIcon}
          description="This week's average"
          trend={{ value: 2, direction: "up" }}
        />
        <StatCard
          title="JLPT Level"
          value="N2"
          icon={ChampionIcon}
          description="Target: N1 by December"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Study Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Study Progress</CardTitle>
            <CardDescription>Your course completion status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {studyProgress.map((course, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{course.course}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {course.status}
                    </Badge>
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
          <CardHeader>
            <CardTitle>Attendance This Week</CardTitle>
            <CardDescription>Your daily attendance percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                attendance: { label: "Attendance %", color: CHART_COLORS.blue },
              }}
              className="h-[250px]"
            >
              <AreaChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_COLORS.blue}
                  fill={CHART_COLORS.blue}
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Upcoming Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Courses</CardTitle>
            <CardDescription>Your scheduled learning sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockUpcomingCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{course.title}</p>
                  <p className="text-xs text-muted-foreground">{course.date}</p>
                </div>
                <Badge variant={course.type === "Live" ? "default" : "outline"}>
                  {course.type}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Important updates and reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockNotifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0"
              >
                <Badge
                  className={`mt-0.5 ${
                    notification.priority === "high"
                      ? "bg-red-100 text-red-800"
                      : notification.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {notification.priority}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {notification.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
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
      </Card>
    </div>
  )
}
