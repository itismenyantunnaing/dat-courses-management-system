/* eslint-disable react-hooks/preserve-manual-memoization */
"use client"

import { useEffect, useState, useMemo } from "react"
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserIcon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  ClockIcon,
  AnalyticsUpIcon,
  ProgressIcon,
  UserGroupIcon,
  BookOpenIcon,
  ChampionIcon,
  CourseIcon,
} from "@hugeicons/core-free-icons"
import { StatCard } from "../charts/stat-card"
import { CHART_COLORS, JLPT_COLORS } from "../charts/chart-config"
import { mainStore } from "@/store/mainStore"
import type { RiskDTO } from "@/types/dashboard"
import type { LevelCounts } from "@/types/exam_progress_report"
import type { Employee } from "@/types/employee"

// Chart config for Team Attendance
const attendanceChartConfig = {
  presentCount: {
    label: "Present",
    color: "#22c55e",
  },
  lateCount: {
    label: "Late",
    color: "#eab308",
  },
  excusedCount: {
    label: "Excused",
    color: "#0505be",
  },
  absentCount: {
    label: "Absent",
    color: "#ef4444",
  },
}

// Mock Team Study Progress for stats calculation
const mockTeamStudyProgress = [
  { team: "Team A", progress: 75 },
  { team: "Team B", progress: 65 },
  { team: "Team C", progress: 82 },
  { team: "Team D", progress: 55 },
]

// Chart config for course statistics (same as admin)
const courseChartConfig = {
  enrolled: {
    label: "Enrolled",
    color: "#8EC5FF",
  },
  completed: {
    label: "Completed",
    color: "#2B7FFF",
  },
}

// Chart config for certification progress
const certificationChartConfig = {
  value: {
    label: "Progress",
  },
}

// Chart config for JLPT Distribution
const jlptChartConfig = {
  N1: {
    label: "N1",
    color: "#8b5cf6",
  },
  N2: {
    label: "N2",
    color: "#6366f1",
  },
  N3: {
    label: "N3",
    color: "#3b82f6",
  },
  N4: {
    label: "N4",
    color: "#22c55e",
  },
  N5: {
    label: "N5",
    color: "#eab308",
  },
}

// Colors for pie chart (matching admin)
const COLORS = ['#FF6B6B', '#FFB74D', '#FFD93D', '#8EC5FF', '#2B7FFF', '#FF8A65', '#A1887F', '#4DB6AC', '#7986CB']

// Custom renderer for bar labels (same as admin)
const renderCustomLabel = (props: any) => {
  const { x, y, width, height, value } = props
  const isNegative = value < 0
  const yPosition = isNegative ? y + height + 16 : y - 10

  return (
    <text
      x={x + width / 2}
      y={yPosition}
      fill="#64748b"
      textAnchor="middle"
      fontSize={12}
      fontWeight="500"
    >
      {value}
    </text>
  )
}

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 28) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}


export default function ApproverDashboardContainer() {
  const [selectedCategory, setSelectedCategory] = useState<string>("JLPT Exam Target")
  const [selectedAttendanceCourseGroup, setSelectedAttendanceCourseGroup] = useState<string>("")
  const [selectedCertType, setSelectedCertType] = useState<string>("JLPT")
  const [timeRange, setTimeRange] = useState<string>("90d")
  const [isLoading, setIsLoading] = useState(true)

  const {
    profile,
    fetch_EmployeeData,
    fetch_AllReportData,
    fetch_dat_departments,
    teamDisplayData,
    fetch_teams,
    employee_data,

    // for Employees at Risk
    fetchRiskData,
    riskData,

    // for Course Statistics 
    fetchAll_CourseData,
    fetch_courseCategories,
    courseCategory_data,
    fetchCourseStats,
    courseStats,
    fetchTeamCertificateStats,
    teamCertificateStats,
    fetchDailyAttendance,
    dailyAttendance,

    fetchActiveLearnerCount,
    activeLearnersCount
  } = mainStore()

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await fetch_EmployeeData()
        await fetch_AllReportData()
        await fetch_dat_departments()
        await fetch_teams()
        await fetchAll_CourseData()
        await fetch_courseCategories()
        await fetchCourseStats()
        await fetchRiskData()
        await fetchTeamCertificateStats()
        await fetchDailyAttendance()
        await fetchActiveLearnerCount()
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  console.log(activeLearnersCount)

  // Combine course categories with useMemo
  const combinedCourseCategories = useMemo(() => {
    if (!courseCategory_data) return []

    const trainerCategories = courseCategory_data.trainer || []
    const selfStudyCategories = courseCategory_data.selfStudy || []

    return [...trainerCategories, ...selfStudyCategories]
  }, [courseCategory_data])

  // Set default selected category when data loads
  useEffect(() => {
    if (combinedCourseCategories.length > 0) {
      const firstCategory = combinedCourseCategories[0]
      setSelectedCategory(firstCategory.value)
    }
  }, [combinedCourseCategories])

  // Extract course group attendance data from dailyAttendance filtered by team
  const courseGroupAttendanceData = useMemo(() => {
    const result: Record<string, {
      courseName: string,
      groupName: string,
      dailyAttendance: Array<{ date: string; attendance: number; presentCount: number; totalStudents: number }>
    }> = {}

    if (dailyAttendance && Array.isArray(dailyAttendance) && dailyAttendance.length > 0) {
      dailyAttendance.forEach((dept: any) => {
        if (dept.teams && Array.isArray(dept.teams) && dept.teams.length > 0) {
          dept.teams.forEach((team: any) => {
            // Only include data for the user's team
            if (team.teamName === profile?.team) {
              if (team.courses && Array.isArray(team.courses) && team.courses.length > 0) {
                team.courses.forEach((course: any) => {
                  if (course.groups && Array.isArray(course.groups) && course.groups.length > 0) {
                    course.groups.forEach((group: any) => {
                      const key = `${course.courseName}_${group.groupName}`
                      result[key] = {
                        courseName: course.courseName,
                        groupName: group.groupName,
                        dailyAttendance: group.dailyAttendance || []
                      }
                    })
                  }
                })
              }
            }
          })
        }
      })
    }

    return result
  }, [dailyAttendance, profile?.team])

  // Create course group options for attendance dropdown from dailyAttendance
  const attendanceCourseGroupOptions = useMemo(() => {
    const options: { value: string; label: string }[] = []

    const keys = Object.keys(courseGroupAttendanceData)
    keys.forEach((key) => {
      const data = courseGroupAttendanceData[key]
      options.push({
        value: key,
        label: `${data.courseName} (${data.groupName})`
      })
    })

    return options
  }, [courseGroupAttendanceData])

  // Set default selected attendance course group when data loads
  useEffect(() => {
    if (attendanceCourseGroupOptions.length > 0) {
      setSelectedAttendanceCourseGroup(attendanceCourseGroupOptions[0].value)
    }
  }, [attendanceCourseGroupOptions]);

  // Get available certification types from teamCertificateStats for the user's team
  const availableCertTypes = useMemo(() => {
    if (!teamCertificateStats || !teamCertificateStats.statistics || !profile?.team) {
      return []
    }

    // Get the stats for the user's team
    const teamStats = teamCertificateStats.statistics[profile.team]
    if (!teamStats) {
      return []
    }

    // Return the certification types available for this team
    return Object.keys(teamStats)
  }, [teamCertificateStats, profile?.team])

  // Set default certification type when data loads
  useEffect(() => {
    if (availableCertTypes.length > 0) {
      setSelectedCertType(availableCertTypes[0])
    }
  }, [availableCertTypes])

  // Memoize filtered course data
  const filteredCourseData = useMemo(() => {
    if (!courseStats || !Array.isArray(courseStats)) return []
    if (!selectedCategory) return courseStats

    return courseStats.filter(
      (course) => course.category?.toLowerCase() === selectedCategory?.toLowerCase()
    )
  }, [courseStats, selectedCategory])

  // Get attendance data for selected course group from dailyAttendance
  const getAttendanceData = () => {
    let data: {
      date: string;
      presentCount: number;
      absentCount: number;
      excusedCount: number;
      lateCount: number;
      totalStudents: number;
    }[] = []

    const selectedData = courseGroupAttendanceData[selectedAttendanceCourseGroup]
    if (selectedData) {
      data = selectedData.dailyAttendance.map((item: any) => ({
        date: item.date,
        presentCount: item.presentCount || 0,
        absentCount: item.absentCount || 0,
        excusedCount: item.excusedCount || 0,
        lateCount: item.lateCount || 0,
        totalStudents: item.totalStudents || 1,
      }))
    } else {
      data = []
    }

    // If no data, return empty
    if (data.length === 0) return data

    // Get today's date
    const today = new Date()
    const currentYear = today.getFullYear()

    // Calculate the cutoff date
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    }
    const cutoffDate = new Date(today)
    cutoffDate.setDate(cutoffDate.getDate() - daysToSubtract)

    return data.filter((item) => {
      const dateParts = item.date.split(' ')
      if (dateParts.length === 2) {
        const month = dateParts[0]
        const day = parseInt(dateParts[1])
        const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month)
        if (monthIndex !== -1) {
          // Create date with current year
          const itemDate = new Date(currentYear, monthIndex, day)

          // If the date is in the future (e.g., Dec 25 when it's July), use last year
          if (itemDate > today) {
            itemDate.setFullYear(currentYear - 1)
          }

          return itemDate >= cutoffDate
        }
      }
      return false
    })
  }

  const filteredAttendanceData = getAttendanceData()


  // Get filtered certification data for the user's team
  const filteredCertificationData = useMemo(() => {
    if (!teamCertificateStats || !teamCertificateStats.statistics || !profile?.team) {
      return []
    }

    // Get the stats for the user's team
    const teamStats = teamCertificateStats.statistics[profile.team]
    if (!teamStats) {
      return []
    }

    // Get the specific certification type data
    const certData = teamStats[selectedCertType]
    if (!certData) {
      return []
    }

    // Convert the stat object to array format for pie chart
    return Object.entries(certData).map(([level, value], index) => ({
      name: level,
      value: typeof value === 'number' ? value : 0,
      fill: COLORS[index % COLORS.length]
    }))
  }, [teamCertificateStats, selectedCertType, profile?.team])

  // Memoize stats calculations
  const stats = useMemo(() => {
    const rawData = courseGroupAttendanceData[selectedAttendanceCourseGroup]
    let allAttendanceData: { date: string; attendance: number }[] = []

    if (rawData && rawData.dailyAttendance) {
      allAttendanceData = rawData.dailyAttendance
        .filter((item: any) => item && typeof item.attendance === 'number' && !isNaN(item.attendance))
        .map((item: any) => ({
          date: item.date || '',
          attendance: item.attendance || 0
        }))
    }

    let avgAttendance = 0
    if (allAttendanceData.length > 0) {
      const sum = allAttendanceData.reduce((acc, curr) => acc + (curr.attendance || 0), 0)
      avgAttendance = Math.round(sum / allAttendanceData.length)
    }

    const avgProgress = mockTeamStudyProgress.length > 0
      ? Math.round(mockTeamStudyProgress.reduce((acc, curr) => acc + (curr.progress || 0), 0) / mockTeamStudyProgress.length)
      : 0

    return { avgAttendance, avgProgress }
  }, [courseGroupAttendanceData, selectedAttendanceCourseGroup])

  // Filter at-risk employees by team
  const filteredAtRiskEmployees = useMemo(() => {
    if (!riskData || !riskData.atRiskStudents) {
      return []
    }

    // Filter to only show employees from the user's team
    return riskData.atRiskStudents.filter(
      (employee: RiskDTO) => employee.team === profile?.team
    )
  }, [riskData, profile?.team])

  // Memoize at-risk count (filtered by team)
  const atRiskCount = useMemo(() => {
    return filteredAtRiskEmployees.length
  }, [filteredAtRiskEmployees])

  // Calculate overall completion rate from courseStats
  const overallCompletionRate = useMemo(() => {
    if (!courseStats || !Array.isArray(courseStats) || courseStats.length === 0) {
      return 0
    }

    // Sum all completion rates
    const totalCompletionRate = courseStats.reduce((sum: number, stat: any) => {
      return sum + (stat.completionRate || 0)
    }, 0)

    // Calculate average
    const average = totalCompletionRate / courseStats.length

    // Round to nearest integer
    return Math.round(average)
  }, [courseStats])

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Stats Row - Updated with real data */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Team Members"
          value={employee_data?.filter((employee: Employee) => employee.team === profile?.team)?.length || 0}
          icon={UserGroupIcon}
          description="Active in the system"
        />
        <StatCard
          title="Active Learners"
          value={activeLearnersCount?.totalActiveLearners || 0}
          icon={BookOpenIcon}
          description={`${Math.round(((activeLearnersCount?.totalActiveLearners || 0) / employee_data?.length) * 100)}% of employees`}
        />
        <StatCard
          title="Average Attendance"
          value={`${stats.avgAttendance}%`}
          icon={CheckmarkCircle01Icon}
          description="Team average"
        />
        <StatCard
          title="Completion Rate"
          value={`${overallCompletionRate}%`}
          icon={ChampionIcon}
          description="Overall course completion"
        />
        {/* <StatCard
          title="Employees at Risk"
          value={atRiskCount}
          icon={AlertCircleIcon}
          description="Need attention"
        /> */}
      </div>

      {/* Course Statistics - Category Select (Same as Admin) */}
      <Card className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Course Statistics</CardTitle>
            <CardDescription>
              Enrollment and completion by course
            </CardDescription>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="max-w-[200px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {combinedCourseCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={courseChartConfig}
            className="h-[400px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={filteredCourseData}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              width={800}
              height={400}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

              <Bar dataKey="enrolled" fill="#8EC5FF" radius={4}>
                <LabelList dataKey="enrolled" content={renderCustomLabel} />
              </Bar>
              <Bar dataKey="completed" fill="#2B7FFF" radius={4}>
                <LabelList dataKey="completed" content={renderCustomLabel} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-center gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium">
            <HugeiconsIcon
              icon={AnalyticsUpIcon}
              strokeWidth={2}
              className="h-4 w-4 text-green-600"
            />
            Enrollment up by 5.2% this month
          </div>
          <div className="flex items-center gap-2 leading-none text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#8EC5FF]" />
              <span>Enrolled</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#2B7FFF]" />
              <span>Completed</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Attendance Analysis - Full Width (Filtered by Team) - Stacked Bar Chart */}
      <Card className="pt-0">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Attendance Analysis</CardTitle>
            <CardDescription>
              Daily attendance breakdown for {profile?.team || "your team"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedAttendanceCourseGroup}
              onValueChange={setSelectedAttendanceCourseGroup}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select course group" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {attendanceCourseGroupOptions.length > 0 ? (
                    attendanceCourseGroupOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="block truncate max-w-[180px]" title={option.label}>
                          {option.label}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      No course groups available
                    </SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="w-[140px] rounded-lg"
                aria-label="Select time range"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectGroup>
                  <SelectItem value="90d" className="rounded-lg">
                    Last 3 months
                  </SelectItem>
                  <SelectItem value="30d" className="rounded-lg">
                    Last 30 days
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {filteredAttendanceData.length === 0 ? (
            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
              No attendance data available for {profile?.team}
            </div>
          ) : (
            <ChartContainer
              config={attendanceChartConfig}
              className="aspect-auto h-[350px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={filteredAttendanceData}
                margin={{
                  top: 20,
                  left: 20,
                  right: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={10}
                  interval={0}
                  tickFormatter={(value) => {
                    if (value && value.includes(' ')) {
                      return value
                    }
                    try {
                      const date = new Date(value)
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    } catch {
                      return value
                    }
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${value}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        if (value && value.includes(' ')) {
                          return value
                        }
                        try {
                          return new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        } catch {
                          return value
                        }
                      }}
                      indicator="dot"
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="presentCount"
                  stackId="a"
                  fill="var(--color-presentCount)"
                  radius={[4, 4, 0, 0]}
                  name="Present"
                />
                <Bar
                  dataKey="lateCount"
                  stackId="a"
                  fill="var(--color-lateCount)"
                  radius={[0, 0, 0, 0]}
                  name="Late"
                />
                <Bar
                  dataKey="excusedCount"
                  stackId="a"
                  fill="var(--color-excusedCount)"
                  radius={[0, 0, 0, 0]}
                  name="Excused"
                />
                <Bar
                  dataKey="absentCount"
                  stackId="a"
                  fill="var(--color-absentCount)"
                  radius={[0, 0, 4, 4]}
                  name="Absent"
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex w-full flex-col items-center gap-2">
            <div className="flex flex-wrap items-center gap-4 leading-none font-medium">
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-[#22c55e]" />
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-[#eab308]" />
                <span>Late</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-[#0505be]" />
                <span>Excused</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
                <span>Absent</span>
              </div>
            </div>
            {filteredAttendanceData.length > 0 && (
              <div className="flex items-center gap-2 leading-none text-sm text-muted-foreground">
                <HugeiconsIcon
                  icon={AnalyticsUpIcon}
                  strokeWidth={2}
                  className="h-4 w-4 text-green-600"
                />
                {profile?.team} attendance breakdown
              </div>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Two Column Layout for Team JLPT Distribution and Certification Progress */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Team JLPT Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Team JLPT Distribution</CardTitle>
            <CardDescription>
              JLPT level distribution for {profile?.team || "your team"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              // Filter team display data to match profile.team
              const teamData = teamDisplayData?.filter(
                (item: any) => item.team_name === profile?.team
              ) || [];

              // Transform data for the chart
              const chartData = teamData.map((item: any) => ({
                team: item.team_name,
                N1: item.N1 || 0,
                N2: item.N2 || 0,
                N3: item.N3 || 0,
                N4: item.N4 || 0,
                N5: item.N5 || 0,
              }));

              // Check if we have data to display
              const hasData = chartData.length > 0 && chartData.some(
                (item: LevelCounts) => item.N1 > 0 || item.N2 > 0 || item.N3 > 0 || item.N4 > 0 || item.N5 > 0
              );

              if (!hasData) {
                return (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No JLPT distribution data available for {profile?.team}
                  </div>
                );
              }

              return (
                <ChartContainer
                  config={jlptChartConfig}
                  className="h-[300px] w-full"
                >
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="team"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="N5"
                      stackId="a"
                      fill="var(--color-N5)"
                      radius={[0, 0, 4, 4]}
                    />
                    <Bar
                      dataKey="N4"
                      stackId="a"
                      fill="var(--color-N4)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="N3"
                      stackId="a"
                      fill="var(--color-N3)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="N2"
                      stackId="a"
                      fill="var(--color-N2)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="N1"
                      stackId="a"
                      fill="var(--color-N1)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              );
            })()}
          </CardContent>
          <CardFooter className="flex-col items-center gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              <HugeiconsIcon
                icon={AnalyticsUpIcon}
                strokeWidth={2}
                className="h-4 w-4 text-green-600"
              />
              {profile?.team} JLPT distribution overview
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
                <span>N1</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#6366f1' }} />
                <span>N2</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                <span>N3</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                <span>N4</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#eab308' }} />
                <span>N5</span>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Certification Progress - Pie Chart with Type Select (Filtered by Team) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Certification Progress</CardTitle>
              <CardDescription>
                Certification completion status for {profile?.team || "your team"}
              </CardDescription>
            </div>
            <Select
              value={selectedCertType}
              onValueChange={setSelectedCertType}
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {availableCertTypes.length > 0 ? (
                    availableCertTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="JLPT">JLPT</SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {filteredCertificationData.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                No certification data available for {profile?.team}
              </div>
            ) : (
              <ChartContainer
                config={certificationChartConfig}
                className="mx-auto aspect-square max-h-[250px] w-full pb-0 [&_.recharts-pie-label-text]:fill-foreground"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={filteredCertificationData}
                    dataKey="value"
                    label
                    nameKey="name"
                  >
                    {filteredCertificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
          <CardFooter className="flex-col items-center gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              <HugeiconsIcon
                icon={AnalyticsUpIcon}
                strokeWidth={2}
                className="h-4 w-4 text-green-600"
              />
              {selectedCertType} progress for {profile?.team}
            </div>
            <div className="flex flex-wrap items-center gap-2 leading-none text-muted-foreground">
              {filteredCertificationData.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs">{item.name}</span>
                </div>
              ))}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Employees at Risk - Full Width at Bottom (Filtered by Team) */}
      <Card>
        <CardHeader>
          <CardTitle>Employees at Risk</CardTitle>
          <CardDescription>
            Team members needing attention in {profile?.team || "your team"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : filteredAtRiskEmployees.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No employees at risk in {profile?.team} at this time
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pr-4 pb-2">Name</th>
                    <th className="pr-4 pb-2">Department</th>
                    <th className="pr-4 pb-2">Team</th>
                    <th className="pr-4 pb-2">Course</th>
                    <th className="pr-4 pb-2">Issue</th>
                    <th className="pb-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAtRiskEmployees.map((employee: RiskDTO, index: number) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-sm font-medium">
                        {employee.name}
                      </td>
                      <td className="py-2 pr-4 text-sm text-muted-foreground">
                        <span className="block max-w-[150px] truncate" title={employee.department}>
                          {employee.department}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-sm text-muted-foreground">
                        {employee.team}
                      </td>
                      <td className="py-2 pr-4 text-sm text-muted-foreground">
                        {employee.course || "-"}
                      </td>
                      <td className="py-2 pr-4 text-sm text-muted-foreground">
                        {employee.issue}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={employee.risk}
                            className="h-2 w-20"
                          />
                          <Badge
                            variant={
                              employee.risk > 75 ? "destructive" : "outline"
                            }
                          >
                            {employee.risk}%
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}