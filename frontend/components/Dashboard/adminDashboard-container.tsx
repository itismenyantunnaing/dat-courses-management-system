// app/dashboard/adminDashboard-container.tsx
"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  UserGroupIcon,
  BookOpenIcon,
  ChampionIcon,
  CourseIcon,
  AnalyticsUpIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { StatCard } from "../charts/stat-card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { mainStore } from "@/store/mainStore"

// Mock data
const mockTotalStats = {
  totalEmployees: 156,
  activeLearners: 132,
  totalCourses: 48,
  completionRate: 72,
}



// Certification Types
const certificationTypes = [
  { value: "JLPT", label: "JLPT" },
  { value: "NAT-test", label: "NAT-test" },
  { value: "TopJ", label: "TopJ" },
  { value: "BJT", label: "BJT" },
]

// Updated Course Statistics with all course categories
const mockCourseStatistics = [
  // JLPT Exam Target Courses
  {
    name: "JLPT-ETC-N1",
    enrolled: 45,
    completed: 28,
    category: "JLPT Exam Target",
  },
  {
    name: "JLPT-ETC-N2",
    enrolled: 52,
    completed: 35,
    category: "JLPT Exam Target",
  },
  {
    name: "JLPT-ETC-N3",
    enrolled: 38,
    completed: 20,
    category: "JLPT Exam Target",
  },
  {
    name: "JLPT-ETC-N4",
    enrolled: 28,
    completed: 15,
    category: "JLPT Exam Target",
  },
  {
    name: "JLPT-ETC-N5",
    enrolled: 20,
    completed: 10,
    category: "JLPT Exam Target",
  },
  // JLPT Exam Practice Courses
  {
    name: "JLPT-EPC-N1",
    enrolled: 40,
    completed: 22,
    category: "JLPT Exam Practice",
  },
  {
    name: "JLPT-EPC-N2",
    enrolled: 48,
    completed: 30,
    category: "JLPT Exam Practice",
  },
  {
    name: "JLPT-EPC-N3",
    enrolled: 35,
    completed: 18,
    category: "JLPT Exam Practice",
  },
  {
    name: "JLPT-EPC-N4",
    enrolled: 25,
    completed: 12,
    category: "JLPT Exam Practice",
  },
  {
    name: "JLPT-EPC-N5",
    enrolled: 18,
    completed: 8,
    category: "JLPT Exam Practice",
  },
  // Technical Japanese Courses
  {
    name: "TJPN-N1",
    enrolled: 32,
    completed: 20,
    category: "Technical Japanese",
  },
  {
    name: "TJPN-N2",
    enrolled: 38,
    completed: 25,
    category: "Technical Japanese",
  },
  {
    name: "TJPN-N3",
    enrolled: 30,
    completed: 18,
    category: "Technical Japanese",
  },
  {
    name: "TJPN-N4",
    enrolled: 22,
    completed: 12,
    category: "Technical Japanese",
  },
  {
    name: "TJPN-N5",
    enrolled: 16,
    completed: 8,
    category: "Technical Japanese",
  },
  // Building A Professional Mindset
  {
    name: "Info Security Mgmt",
    enrolled: 25,
    completed: 15,
    category: "Professional Mindset",
  },
  {
    name: "20 Rules for Pros",
    enrolled: 28,
    completed: 18,
    category: "Professional Mindset",
  },
  {
    name: "DAT Professional Ethic",
    enrolled: 22,
    completed: 14,
    category: "Professional Mindset",
  },
  {
    name: "Business Guidelines",
    enrolled: 20,
    completed: 12,
    category: "Professional Mindset",
  },
  // NGLP Courses
  { name: "NGLPC-N1", enrolled: 30, completed: 18, category: "NGLP" },
  { name: "NGLPC-N2", enrolled: 35, completed: 22, category: "NGLP" },
  { name: "NGLPC-N3", enrolled: 28, completed: 15, category: "NGLP" },
  { name: "NGLPC-N4", enrolled: 20, completed: 10, category: "NGLP" },
  { name: "NGLPC-N5", enrolled: 15, completed: 7, category: "NGLP" },
  { name: "BJC-N1", enrolled: 30, completed: 18, category: "NGLP" },
  { name: "BJC-N2", enrolled: 35, completed: 22, category: "NGLP" },
  { name: "BJC-N3", enrolled: 28, completed: 15, category: "NGLP" },
  { name: "BJC-N4", enrolled: 20, completed: 10, category: "NGLP" },
  { name: "BJC-N5", enrolled: 15, completed: 7, category: "NGLP" },
  {
    name: "Organizational Behavior",
    enrolled: 18,
    completed: 10,
    category: "NGLP",
  },
  {
    name: "Project Mgmt Practices",
    enrolled: 22,
    completed: 14,
    category: "NGLP",
  },
  // Offshore Certification
  {
    name: "OffshoreC-Level-1",
    enrolled: 15,
    completed: 10,
    category: "Offshore Certification",
  },
  {
    name: "OffshoreC-Level-2",
    enrolled: 12,
    completed: 6,
    category: "Offshore Certification",
  },
  {
    name: "OffshoreC-Level-2 Target",
    enrolled: 8,
    completed: 3,
    category: "Offshore Certification",
  },
  {
    name: "OffshoreC-Level-2 Comp",
    enrolled: 10,
    completed: 8,
    category: "Offshore Certification",
  },
  {
    name: "OffshoreC-Level-2 Brush",
    enrolled: 6,
    completed: 4,
    category: "Offshore Certification",
  },
]

// Mock Attendance Data by Course Category
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

// Mock Certification Progress Data for Pie Chart
const mockCertificationProgressData = [
  { name: "JLPT N1", value: 3, fill: "#FF6B6B" },
  { name: "JLPT N2", value: 6, fill: "#FFB74D" },
  { name: "JLPT N3", value: 8, fill: "#FFD93D" },
  { name: "JLPT N4", value: 4, fill: "#8EC5FF" },
  { name: "JLPT N5", value: 7, fill: "#2B7FFF" },
]

// Chart configs
const jlptChartConfig = {
  current: {
    label: "Current",
    color: "#8EC5FF",
  },
  target: {
    label: "Target",
    color: "#2B7FFF",
  },
}

const communicationChartConfig = {
  current: {
    label: "Current",
    color: "#8EC5FF",
  },
  target: {
    label: "Target",
    color: "#2B7FFF",
  },
}

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

const attendanceChartConfig = {
  attendance: {
    label: "Attendance %",
    color: "var(--chart-1)",
  },
}

const certificationChartConfig = {
  value: {
    label: "Progress",
  },
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

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 28) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

// Truncated Select Item component
const TruncatedSelectItem = ({
  value,
  label,
  disabled = false,
  maxLength = 28,
}: {
  value: string
  label: string
  disabled?: boolean
  maxLength?: number
}) => {
  const needsTruncation = label.length > maxLength
  const displayLabel = needsTruncation ? truncateText(label, maxLength) : label

  if (!needsTruncation) {
    return (
      <SelectItem value={value} disabled={disabled}>
        {label}
      </SelectItem>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <SelectItem value={value} disabled={disabled} className="max-w-full">
            <span className="block truncate">{displayLabel}</span>
          </SelectItem>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function AdminDashboardContainer() {
  // Separate filters for JLPT
  const [jlptDepartment, setJlptDepartment] = useState<string>("All Departments")
  const [jlptTeam, setJlptTeam] = useState<string>("All Teams")

  // Separate filters for Communication
  const [commDepartment, setCommDepartment] = useState<string>("All Departments")
  const [commTeam, setCommTeam] = useState<string>("All Teams")

  const [selectedCategory, setSelectedCategory] =
    useState<string>("JLPT Exam Target")
  const [selectedAttendanceCategory, setSelectedAttendanceCategory] =
    useState<string>("JLPT Exam Target")
  const [selectedCertType, setSelectedCertType] = useState<string>("JLPT")
  const [isLoading, setIsLoading] = useState(true)
  const {
    fetch_EmployeeData,
    fetch_AllData,
    fetch_dat_departments,
    dat_departments,
    teamDisplayData,
    fetch_teams,
    teams,
    apiResponse,
    employee_data,

    // for Employees at Risk
    fetchRiskData,
    riskData,

    // for Course Statistics 
    fetchAll_CourseData,
    courses,
    fetch_courseCategories,
    courseCategory_data,
    fetchCourseStats,
    courseStats,
  } = mainStore()

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await fetch_EmployeeData()
        await fetch_AllData()
        await fetch_dat_departments()
        await fetch_teams()
        await fetchAll_CourseData()
        await fetch_courseCategories()
        await fetchCourseStats()
        await fetchRiskData()
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [fetchAll_CourseData, fetchCourseStats, fetchRiskData, fetch_AllData, fetch_EmployeeData, fetch_courseCategories, fetch_dat_departments, fetch_teams])

  // Create department options with "All Departments" prepended
  const departmentOptions = useMemo(() => {
    const options = [{ id: 'all', deptName: 'All Departments' }]

    if (dat_departments && Array.isArray(dat_departments) && dat_departments.length > 0) {
      options.push(...dat_departments)
    }

    return options
  }, [dat_departments])

  // Get unique teams from teamDisplayData
  const allTeams = useMemo(() => {
    if (teamDisplayData && Array.isArray(teamDisplayData) && teamDisplayData.length > 0) {
      return teamDisplayData.map((item: any) => item.team_name)
    }
    return []
  }, [teamDisplayData])

  const combinedCourseCategories = useMemo(() => {
    if (!courseCategory_data) return [];

    // Combine trainer and selfStudy arrays
    const trainerCategories = courseCategory_data.trainer || [];
    const selfStudyCategories = courseCategory_data.selfStudy || [];

    // Merge them into one array
    return [...trainerCategories, ...selfStudyCategories];
  }, [courseCategory_data]);

  // Set default selected values to the first category when data loads
  useEffect(() => {
    if (combinedCourseCategories.length > 0) {
      const firstCategory = combinedCourseCategories[0];
      setSelectedCategory(firstCategory.value);
      setSelectedAttendanceCategory(firstCategory.value);
    }
  }, [combinedCourseCategories]);


  // Get teams for JLPT department
  const getJlptTeams = (dept: string) => {
    if (dept === "All Departments") {
      return ["All Teams", ...allTeams]
    }

    if (teamDisplayData && Array.isArray(teamDisplayData) && teamDisplayData.length > 0) {
      const filteredTeams = teamDisplayData
        .filter((item: any) => {
          const deptItem = dat_departments?.find((d: any) => d.id === item.deptId)
          return deptItem?.deptName === dept
        })
        .map((item: any) => item.team_name)

      if (filteredTeams.length > 0) {
        return ["All Teams", ...filteredTeams]
      }
    }

    return ["All Teams"]
  }

  // Get teams for Communication department
  const getCommTeams = (dept: string) => {
    if (dept === "All Departments") {
      return ["All Teams", ...allTeams]
    }

    if (teamDisplayData && Array.isArray(teamDisplayData) && teamDisplayData.length > 0) {
      const filteredTeams = teamDisplayData
        .filter((item: any) => {
          const deptItem = dat_departments?.find((d: any) => d.id === item.deptId)
          return deptItem?.deptName === dept
        })
        .map((item: any) => item.team_name)

      if (filteredTeams.length > 0) {
        return ["All Teams", ...filteredTeams]
      }
    }

    return ["All Teams"]
  }

  // Get filtered JLPT data
  const getFilteredJLPTData = () => {
    let filteredTeams = []

    if (jlptDepartment === "All Departments" && jlptTeam === "All Teams") {
      filteredTeams = teamDisplayData || []
    } else if (jlptDepartment !== "All Departments" && jlptTeam === "All Teams") {
      const deptItem = dat_departments?.find((d: any) => d.deptName === jlptDepartment)
      if (deptItem) {
        filteredTeams = (teamDisplayData || []).filter((item: any) => item.deptId === deptItem.id)
      }
    } else if (jlptTeam !== "All Teams") {
      filteredTeams = (teamDisplayData || []).filter((item: any) => item.team_name === jlptTeam)
    }

    const levels = ['N1', 'N2', 'N3', 'N4', 'N5']
    const aggregatedData = levels.map(level => {
      let current = 0
      let target = 0

      filteredTeams.forEach((team: any) => {
        current += team[level] || 0
        target += team[`target1_${level}`] || 0
      })

      return { level, current, target }
    })

    return aggregatedData
  }

  // Get filtered Communication data
  const getFilteredCommunicationData = () => {
    let filteredTeams = []

    if (commDepartment === "All Departments" && commTeam === "All Teams") {
      filteredTeams = teamDisplayData || []
    } else if (commDepartment !== "All Departments" && commTeam === "All Teams") {
      const deptItem = dat_departments?.find((d: any) => d.deptName === commDepartment)
      if (deptItem) {
        filteredTeams = (teamDisplayData || []).filter((item: any) => item.deptId === deptItem.id)
      }
    } else if (commTeam !== "All Teams") {
      filteredTeams = (teamDisplayData || []).filter((item: any) => item.team_name === commTeam)
    }

    const levels = ['Level 0', 'Level 1 | G1', 'Level 1 | G2', 'Level 1 | G3', 'Level 2 | G1', 'Level 2 | G2', 'Level 2 | G3', 'Level 3']
    const aggregatedData = levels.map((level, index) => {
      let current = 0
      let target = 0

      filteredTeams.forEach((team: any) => {
        current += team[`current_comm_${index}`] || 0
        target += team[`target1_comm_${index}`] || 0
      })

      return { level, current, target }
    })

    return aggregatedData
  }

  const filteredJLPTData = getFilteredJLPTData()
  const filteredCommunicationData = getFilteredCommunicationData()

  // Filter course data based on selected category
  const getFilteredCourseData = () => {
    return courseStats.filter(
      (course) => course.category.toLowerCase() === selectedCategory
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

  const filteredCertificationData = mockCertificationProgressData



  // Update JLPT teams when JLPT department changes
  const handleJlptDepartmentChange = (dept: string) => {
    setJlptDepartment(dept)
    setJlptTeam("All Teams")
  }



  // Update Communication teams when Communication department changes
  const handleCommDepartmentChange = (dept: string) => {
    setCommDepartment(dept)
    setCommTeam("All Teams")
  }

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }
  console.log("AAAAAAAAAAA")
  console.log(courseStats)

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={employee_data?.length}
          icon={UserGroupIcon}
          description="Active in the system"
          trend={{ value: 8, direction: "up" }}
        />
        <StatCard
          title="Active Learners"
          value={mockTotalStats.activeLearners}
          icon={BookOpenIcon}
          description={`${Math.round((mockTotalStats.activeLearners / mockTotalStats.totalEmployees) * 100)}% of employees`}
          trend={{ value: 5, direction: "up" }}
        />
        <StatCard
          title="Total Courses"
          value={courses?.length}
          icon={CourseIcon}
          description="Available for learning"
          trend={{ value: 12, direction: "up" }}
        />
        <StatCard
          title="Completion Rate"
          value={`${mockTotalStats.completionRate}%`}
          icon={ChampionIcon}
          description="Overall course completion"
          trend={{ value: 3, direction: "up" }}
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

      {/* Second Row - JLPT Statistics and Communication Level */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* JLPT Statistics with Department and Team Select */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>JLPT Statistics</CardTitle>
              <CardDescription>Current vs target JLPT levels</CardDescription>
            </div>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <Select
                value={jlptDepartment}
                onValueChange={handleJlptDepartmentChange}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {departmentOptions.map((dept: any) => (
                      <TruncatedSelectItem
                        key={dept.id || dept.deptName}
                        value={dept.deptName}
                        label={dept.deptName}
                        maxLength={28}
                      />
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={jlptTeam} onValueChange={setJlptTeam}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {getJlptTeams(jlptDepartment).map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={jlptChartConfig}
              className="h-[250px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={filteredJLPTData}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="level"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="current" fill="#8EC5FF" radius={4}>
                  <LabelList dataKey="current" content={renderCustomLabel} />
                </Bar>
                <Bar dataKey="target" fill="#2B7FFF" radius={4}>
                  <LabelList dataKey="target" content={renderCustomLabel} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-center gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              Target distribution shows improvement across all levels
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#8EC5FF]" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#2B7FFF]" />
                <span>Target</span>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Communication Level Statistics with Department and Team Select */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Communication Level Statistics</CardTitle>
              <CardDescription>
                Current vs target communication levels
              </CardDescription>
            </div>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <Select
                value={commDepartment}
                onValueChange={handleCommDepartmentChange}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {departmentOptions.map((dept: any) => (
                      <TruncatedSelectItem
                        key={dept.id || dept.deptName}
                        value={dept.deptName}
                        label={dept.deptName}
                        maxLength={28}
                      />
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={commTeam} onValueChange={setCommTeam}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {getCommTeams(commDepartment).map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={communicationChartConfig}
              className="h-[300px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={filteredCommunicationData}
                layout="vertical"
                margin={{
                  right: 10,
                }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="level"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value}
                  width={90}
                />
                <XAxis type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="current" fill="#8EC5FF" radius={4}>
                  <LabelList
                    dataKey="current"
                    position="right"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
                <Bar dataKey="target" fill="#2B7FFF" radius={4}>
                  <LabelList
                    dataKey="target"
                    position="right"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              <HugeiconsIcon
                icon={AnalyticsUpIcon}
                strokeWidth={2}
                className="h-4 w-4 text-green-600"
              />
              Communication levels showing improvement
            </div>
            <div className="flex flex-wrap items-center gap-2 leading-none text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#8EC5FF]" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#2B7FFF]" />
                <span>Target</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Third Row - Attendance Analysis with Course Category Select */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Analysis with Course Category Select */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Attendance Analysis</CardTitle>
              <CardDescription>
                Monthly attendance trends by course category
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
              config={attendanceChartConfig}
              className="h-[250px] w-full"
            >
              <AreaChart
                accessibilityLayer
                data={getAttendanceData()}
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
                Attendance up by 5.2% this month
              </div>
              <div className="flex items-center gap-2 leading-none text-muted-foreground">
                January - June 2026
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Certification Progress - Pie Chart with Type Select only */}
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

      {/* Fourth Row - Employees at Risk with Department and Team */}
      <Card>
        <CardHeader>
          <CardTitle>Employees at Risk</CardTitle>
          <CardDescription>Employees needing attention</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !riskData || !riskData.atRiskStudents || riskData.atRiskStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No employees at risk at this time
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pr-4 pb-2">Name</th>
                    <th className="pr-4 pb-2">Course</th>
                    <th className="pr-4 pb-2">Department</th>
                    <th className="pr-4 pb-2">Team</th>
                    <th className="pr-4 pb-2">Issue</th>
                    <th className="pb-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {riskData.atRiskStudents.map((employee, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-sm font-medium">
                        {employee.name}
                      </td>
                      <td className="py-2 pr-4 text-sm text-muted-foreground">
                        {employee.course || '-'}
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
                        {employee.issue}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <Progress value={employee.risk} className="h-2 w-20" />
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

