// app/dashboard/approverDashboard-container.tsx
"use client"

import * as React from "react"
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
} from "@hugeicons/core-free-icons"
import { StatCard } from "../charts/stat-card"
import { CHART_COLORS, JLPT_COLORS } from "../charts/chart-config"

// Mock data
const mockTeamJLPTDistribution = [
  { team: "Team A", N1: 5, N2: 10, N3: 8, N4: 3, N5: 2 },
  { team: "Team B", N1: 3, N2: 7, N3: 12, N4: 5, N5: 1 },
  { team: "Team C", N1: 8, N2: 6, N3: 4, N4: 2, N5: 0 },
  { team: "Team D", N1: 2, N2: 4, N3: 6, N4: 8, N5: 3 },
]

// Chart config for Team JLPT Distribution
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

const mockTeamAttendance = [
  { team: "Team A", attendance: 92 },
  { team: "Team B", attendance: 85 },
  { team: "Team C", attendance: 88 },
  { team: "Team D", attendance: 78 },
]

// Chart config for Team Attendance
const attendanceChartConfig = {
  attendance: {
    label: "Attendance %",
    color: CHART_COLORS.blue,
  },
}

// Mock Team Study Progress for stats calculation
const mockTeamStudyProgress = [
  { team: "Team A", progress: 75 },
  { team: "Team B", progress: 65 },
  { team: "Team C", progress: 82 },
  { team: "Team D", progress: 55 },
]

// Course categories for filtering
const courseCategories = [
  { value: "JLPT Exam Target", label: "JLPT Exam Target" },
  { value: "JLPT Exam Practice", label: "JLPT Exam Practice" },
  { value: "Technical Japanese", label: "Technical Japanese" },
  { value: "Professional Mindset", label: "Professional Mindset" },
  { value: "NGLP", label: "NGLP" },
  { value: "Offshore Certification", label: "Offshore Certification" },
]

// Certification Types
const certificationTypes = [
  { value: "JLPT", label: "JLPT" },
  { value: "NAT-test", label: "NAT-test" },
  { value: "TopJ", label: "TopJ" },
  { value: "BJT", label: "BJT" },
]

// Course Statistics Data for Approver Dashboard
const mockCourseStatistics = [
  // JLPT Exam Target Courses
  {
    name: "JLPT-ETC-N1",
    enrolled: 12,
    completed: 8,
    category: "JLPT Exam Target",
  },
  {
    name: "JLPT-ETC-N2",
    enrolled: 15,
    completed: 10,
    category: "JLPT Exam Target",
  },
  {
    name: "JLPT-ETC-N3",
    enrolled: 10,
    completed: 6,
    category: "JLPT Exam Target",
  },
  {
    name: "JLPT-ETC-N4",
    enrolled: 8,
    completed: 4,
    category: "JLPT Exam Target",
  },
  {
    name: "JLPT-ETC-N5",
    enrolled: 6,
    completed: 3,
    category: "JLPT Exam Target",
  },
  // JLPT Exam Practice Courses
  {
    name: "JLPT-EPC-N1",
    enrolled: 10,
    completed: 6,
    category: "JLPT Exam Practice",
  },
  {
    name: "JLPT-EPC-N2",
    enrolled: 14,
    completed: 8,
    category: "JLPT Exam Practice",
  },
  {
    name: "JLPT-EPC-N3",
    enrolled: 9,
    completed: 5,
    category: "JLPT Exam Practice",
  },
  {
    name: "JLPT-EPC-N4",
    enrolled: 7,
    completed: 3,
    category: "JLPT Exam Practice",
  },
  {
    name: "JLPT-EPC-N5",
    enrolled: 5,
    completed: 2,
    category: "JLPT Exam Practice",
  },
  // Technical Japanese Courses
  {
    name: "TJPN-N1",
    enrolled: 8,
    completed: 5,
    category: "Technical Japanese",
  },
  {
    name: "TJPN-N2",
    enrolled: 10,
    completed: 7,
    category: "Technical Japanese",
  },
  {
    name: "TJPN-N3",
    enrolled: 8,
    completed: 4,
    category: "Technical Japanese",
  },
  {
    name: "TJPN-N4",
    enrolled: 6,
    completed: 3,
    category: "Technical Japanese",
  },
  {
    name: "TJPN-N5",
    enrolled: 4,
    completed: 2,
    category: "Technical Japanese",
  },
  // Building A Professional Mindset
  {
    name: "Info Security Mgmt",
    enrolled: 7,
    completed: 4,
    category: "Professional Mindset",
  },
  {
    name: "20 Rules for Pros",
    enrolled: 8,
    completed: 5,
    category: "Professional Mindset",
  },
  {
    name: "DAT Professional Ethic",
    enrolled: 6,
    completed: 3,
    category: "Professional Mindset",
  },
  {
    name: "Business Guidelines",
    enrolled: 5,
    completed: 3,
    category: "Professional Mindset",
  },
  // NGLP Courses
  { name: "NGLPC-N1", enrolled: 8, completed: 4, category: "NGLP" },
  { name: "NGLPC-N2", enrolled: 10, completed: 6, category: "NGLP" },
  { name: "NGLPC-N3", enrolled: 7, completed: 4, category: "NGLP" },
  { name: "NGLPC-N4", enrolled: 5, completed: 2, category: "NGLP" },
  { name: "NGLPC-N5", enrolled: 4, completed: 2, category: "NGLP" },
  { name: "BJC-N1", enrolled: 8, completed: 5, category: "NGLP" },
  { name: "BJC-N2", enrolled: 10, completed: 6, category: "NGLP" },
  { name: "BJC-N3", enrolled: 7, completed: 4, category: "NGLP" },
  { name: "BJC-N4", enrolled: 5, completed: 2, category: "NGLP" },
  { name: "BJC-N5", enrolled: 4, completed: 2, category: "NGLP" },
  {
    name: "Organizational Behavior",
    enrolled: 5,
    completed: 3,
    category: "NGLP",
  },
  {
    name: "Project Mgmt Practices",
    enrolled: 6,
    completed: 4,
    category: "NGLP",
  },
  // Offshore Certification
  {
    name: "OffshoreC-Level-1",
    enrolled: 4,
    completed: 3,
    category: "Offshore Certification",
  },
  {
    name: "OffshoreC-Level-2",
    enrolled: 3,
    completed: 2,
    category: "Offshore Certification",
  },
  {
    name: "OffshoreC-Level-2 Target",
    enrolled: 2,
    completed: 1,
    category: "Offshore Certification",
  },
  {
    name: "OffshoreC-Level-2 Comp",
    enrolled: 3,
    completed: 2,
    category: "Offshore Certification",
  },
  {
    name: "OffshoreC-Level-2 Brush",
    enrolled: 2,
    completed: 1,
    category: "Offshore Certification",
  },
]

// Chart config for course statistics
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

// Mock Attendance Data by Course Category for Approver
const mockAttendanceDataByCategory: Record<
  string,
  { month: string; attendance: number }[]
> = {
  "JLPT Exam Target": [
    { month: "Jan", attendance: 85 },
    { month: "Feb", attendance: 88 },
    { month: "Mar", attendance: 82 },
    { month: "Apr", attendance: 90 },
    { month: "May", attendance: 87 },
    { month: "Jun", attendance: 92 },
  ],
  "JLPT Exam Practice": [
    { month: "Jan", attendance: 80 },
    { month: "Feb", attendance: 83 },
    { month: "Mar", attendance: 79 },
    { month: "Apr", attendance: 85 },
    { month: "May", attendance: 82 },
    { month: "Jun", attendance: 88 },
  ],
  "Technical Japanese": [
    { month: "Jan", attendance: 78 },
    { month: "Feb", attendance: 82 },
    { month: "Mar", attendance: 85 },
    { month: "Apr", attendance: 80 },
    { month: "May", attendance: 88 },
    { month: "Jun", attendance: 86 },
  ],
  "Professional Mindset": [
    { month: "Jan", attendance: 82 },
    { month: "Feb", attendance: 86 },
    { month: "Mar", attendance: 80 },
    { month: "Apr", attendance: 84 },
    { month: "May", attendance: 88 },
    { month: "Jun", attendance: 85 },
  ],
  NGLP: [
    { month: "Jan", attendance: 72 },
    { month: "Feb", attendance: 75 },
    { month: "Mar", attendance: 78 },
    { month: "Apr", attendance: 82 },
    { month: "May", attendance: 79 },
    { month: "Jun", attendance: 84 },
  ],
  "Offshore Certification": [
    { month: "Jan", attendance: 75 },
    { month: "Feb", attendance: 78 },
    { month: "Mar", attendance: 72 },
    { month: "Apr", attendance: 76 },
    { month: "May", attendance: 80 },
    { month: "Jun", attendance: 77 },
  ],
}

// Mock Certification Progress Data for Pie Chart (removed Business Japanese)
const mockCertificationProgressData = [
  { name: "JLPT N1", value: 30, fill: "#FF6B6B" },
  { name: "JLPT N2", value: 60, fill: "#FFB74D" },
  { name: "JLPT N3", value: 85, fill: "#FFD93D" },
  { name: "JLPT N4", value: 45, fill: "#8EC5FF" },
  { name: "JLPT N5", value: 70, fill: "#2B7FFF" },
]

// Updated Employees at Risk with Department and Team
const mockEmployeesAtRisk = [
  {
    name: "Sato T.",
    issue: "Low attendance",
    risk: 80,
    department: "Infrastructure Implementation and Operation Dept",
    team: "Infra Team 1",
  },
  {
    name: "Yamada K.",
    issue: "Low progress",
    risk: 70,
    department: "Offshore Development Dept-2",
    team: "OD2 Team 1",
  },
  {
    name: "Tanaka M.",
    issue: "Low attendance",
    risk: 65,
    department: "Application Development Dept",
    team: "App Dev Team 2",
  },
  {
    name: "Watanabe J.",
    issue: "Low progress",
    risk: 90,
    department: "Offshore Development Dept-1",
    team: "OD1 Team 2",
  },
  {
    name: "Suzuki H.",
    issue: "Low attendance",
    risk: 55,
    department: "BOD-ACE",
    team: "ACE Team 1",
  },
  {
    name: "Ito K.",
    issue: "Low progress",
    risk: 75,
    department: "Finance Department",
    team: "Finance Team 1",
  },
  {
    name: "Nakamura R.",
    issue: "Low attendance",
    risk: 60,
    department: "HR/Admin Department",
    team: "HR Team",
  },
  {
    name: "Kobayashi M.",
    issue: "Low progress",
    risk: 85,
    department: "BOD-DIR",
    team: "DIR Team 1",
  },
]

// Custom renderer for bar labels on top
const renderCustomLabelTop = (props: any) => {
  const { x, y, width, value } = props
  return (
    <text
      x={x + width / 2}
      y={y - 10}
      fill="#64748b"
      textAnchor="middle"
      fontSize={12}
      fontWeight="500"
    >
      {value}%
    </text>
  )
}

// Custom renderer for bar labels
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

export default function ApproverDashboardContainer() {
  // Set default to "JLPT Exam Target"
  const [selectedCategory, setSelectedCategory] =
    React.useState<string>("JLPT Exam Target")
  const [selectedCertType, setSelectedCertType] = React.useState<string>("JLPT")
  const [selectedAttendanceCategory, setSelectedAttendanceCategory] =
    React.useState<string>("JLPT Exam Target")

  // Calculate stats
  const totalEmployees = 48
  const avgAttendance =
    mockTeamAttendance.reduce((acc, curr) => acc + curr.attendance, 0) /
    mockTeamAttendance.length
  const avgProgress =
    mockTeamStudyProgress.reduce((acc, curr) => acc + curr.progress, 0) /
    mockTeamStudyProgress.length
  const atRiskCount = mockEmployeesAtRisk.length

  // Filter course data based on selected category
  const getFilteredCourseData = () => {
    return mockCourseStatistics.filter(
      (course) => course.category === selectedCategory
    )
  }

  const filteredCourseData = getFilteredCourseData()

  // Get attendance data for selected category
  const getAttendanceData = () => {
    return (
      mockAttendanceDataByCategory[selectedAttendanceCategory] ||
      mockAttendanceDataByCategory["JLPT Exam Target"]
    )
  }

  const attendanceData = getAttendanceData()

  // Filter certification data based on type
  const getFilteredCertificationData = () => {
    // In a real app, this would filter based on the selected type
    // For demo, we're showing all data with a filter indicator
    return mockCertificationProgressData
  }

  const filteredCertificationData = getFilteredCertificationData()

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Team Members"
          value={totalEmployees}
          icon={UserIcon}
          description="Active learners"
          trend={{ value: 5, direction: "up" }}
        />
        <StatCard
          title="Average Attendance"
          value={`${Math.round(avgAttendance)}%`}
          icon={CheckmarkCircle01Icon}
          description="Team average"
          trend={{ value: 3, direction: "up" }}
        />
        <StatCard
          title="Average Progress"
          value={`${Math.round(avgProgress)}%`}
          icon={ProgressIcon}
          description="Course completion"
          trend={{ value: 2, direction: "up" }}
        />
        <StatCard
          title="Employees at Risk"
          value={atRiskCount}
          icon={AlertCircleIcon}
          description="Need attention"
          trend={{ value: 1, direction: "down" }}
        />
      </div>

      {/* Course Statistics - Category Select */}
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
                {courseCategories.map((category) => (
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

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Team JLPT Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Team JLPT Distribution</CardTitle>
            <CardDescription>
              JLPT level distribution across teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={jlptChartConfig}
              className="h-[300px] w-full"
            >
              <BarChart accessibilityLayer data={mockTeamJLPTDistribution}>
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
          </CardContent>
          <CardFooter className="flex-col items-center gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              <HugeiconsIcon
                icon={AnalyticsUpIcon}
                strokeWidth={2}
                className="h-4 w-4 text-green-600"
              />
              JLPT N1 and N2 levels showing improvement
            </div>
          </CardFooter>
        </Card>

        {/* Team Attendance with Course Category Select */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Team Attendance</CardTitle>
              <CardDescription>
                Attendance trends by course category
              </CardDescription>
            </div>
            <Select
              value={selectedAttendanceCategory}
              onValueChange={setSelectedAttendanceCategory}
            >
              <SelectTrigger className="max-w-[200px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {courseCategories.map((category) => (
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
              config={attendanceChartConfig}
              className="h-[250px] w-full"
            >
              <AreaChart
                accessibilityLayer
                data={attendanceData}
                margin={{
                  left: 10,
                  right: 10,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Area
                  dataKey="attendance"
                  type="natural"
                  fill="#D3E7FF"
                  fillOpacity={0.4}
                  stroke="#9FCEFF"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter>
            <div className="flex w-full flex-col items-center gap-2">
              <div className="flex items-center gap-2 leading-none font-medium">
                <HugeiconsIcon
                  icon={AnalyticsUpIcon}
                  strokeWidth={2}
                  className="h-4 w-4 text-green-600"
                />
                Attendance up by 3.2% this month
              </div>
              <div className="flex items-center gap-2 leading-none text-muted-foreground">
                January - June 2026
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Employees at Risk with Department and Team */}
        <Card>
          <CardHeader>
            <CardTitle>Employees at Risk</CardTitle>
            <CardDescription>Team members needing attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pr-4 pb-2">Name</th>
                    <th className="pr-4 pb-2">Department</th>
                    <th className="pr-4 pb-2">Team</th>
                    <th className="pr-4 pb-2">Issue</th>
                    <th className="pb-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {mockEmployeesAtRisk.map((employee, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-sm font-medium">
                        {employee.name}
                      </td>
                      <td className="py-2 pr-4 text-sm text-muted-foreground">
                        <span className="block max-w-[150px] truncate">
                          {employee.department}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-sm text-muted-foreground">
                        {employee.team}
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
          </CardContent>
        </Card>

        {/* Certification Progress - Pie Chart with Type Select */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Certification Progress</CardTitle>
              <CardDescription>Certification completion status</CardDescription>
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
                  {certificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
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
          </CardContent>
          <CardFooter className="flex-col items-center gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              <HugeiconsIcon
                icon={AnalyticsUpIcon}
                strokeWidth={2}
                className="h-4 w-4 text-green-600"
              />
              {selectedCertType} progress showing improvement
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
    </div>
  )
}
