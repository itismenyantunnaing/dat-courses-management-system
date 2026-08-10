/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/preserve-manual-memoization */
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



// Certification Types - dynamically generated from the data
const getCertificationTypes = (overallCertificateStats: any) => {
  if (!overallCertificateStats || !overallCertificateStats.statistics) {
    return ["JLPT", "NAT_TEST"]
  }
  return Object.keys(overallCertificateStats.statistics)
}

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

const certificationChartConfig = {
  value: {
    label: "Progress",
  },
}

// Colors for pie chart
const COLORS = ['#FF6B6B', '#FFB74D', '#FFD93D', '#8EC5FF', '#2B7FFF', '#FF8A65', '#A1887F', '#4DB6AC', '#7986CB']

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
  const [jlptDepartment, setJlptDepartment] =
    useState<string>("All Departments")
  const [jlptTeam, setJlptTeam] = useState<string>("All Teams")

  // Separate filters for Communication
  const [commDepartment, setCommDepartment] =
    useState<string>("All Departments")
  const [commTeam, setCommTeam] = useState<string>("All Teams")

  const [selectedCategory, setSelectedCategory] =
    useState<string>("JLPT Exam Target")
  const [selectedAttendanceCourseGroup, setSelectedAttendanceCourseGroup] = useState<string>("All")
  const [selectedCertType, setSelectedCertType] = useState<string>("JLPT")
  const [timeRange, setTimeRange] = useState<string>("90d")
  const [isLoading, setIsLoading] = useState(true)
  const {
    fetch_EmployeeData,
    fetch_AllReportData,
    fetch_dat_departments,
    dat_departments,
    teamDisplayData,
    fetch_teams,
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
    fetchOverallCertificateStats,
    overallCertificateStats,
    fetchTeamCertificateStats,
    teamCertificateStats,
    fetchDailyAttendance,
    dailyAttendance,

    fetchActiveLearnerCount,
    activeLearnersCount
  } = mainStore()

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
        await fetchOverallCertificateStats()
        await fetchDailyAttendance()
        await fetchActiveLearnerCount()
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [fetchAll_CourseData, fetchCourseStats, fetchDailyAttendance, fetchOverallCertificateStats, fetchRiskData, fetch_AllReportData, fetch_EmployeeData, fetch_courseCategories, fetch_dat_departments, fetch_teams])

  // Create department options with "All Departments" prepended
  const departmentOptions = useMemo(() => {
    const options = [{ id: "all", deptName: "All Departments" }]

    if (
      dat_departments &&
      Array.isArray(dat_departments) &&
      dat_departments.length > 0
    ) {
      // Map DepartmentData to the expected shape
      const mappedDepartments = dat_departments.map((dept: any) => ({
        id: dept.id?.toString() || dept.deptId?.toString() || "",
        deptName: dept.deptName || dept.department || dept.name || ""
      }))
      options.push(...mappedDepartments)
    }

    return options
  }, [dat_departments])


  // Get unique teams from teamDisplayData
  const allTeams = useMemo(() => {
    if (
      teamDisplayData &&
      Array.isArray(teamDisplayData) &&
      teamDisplayData.length > 0
    ) {
      return teamDisplayData.map((item: any) => item.team_name)
    }
    return []
  }, [teamDisplayData])

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


  const combinedCourseCategories = useMemo(() => {
    if (!courseCategory_data) return []

    // Combine trainer and selfStudy arrays
    const trainerCategories = courseCategory_data.trainer || []
    const selfStudyCategories = courseCategory_data.selfStudy || []

    // Merge them into one array
    return [...trainerCategories, ...selfStudyCategories]
  }, [courseCategory_data])

  // Extract course group attendance data from dailyAttendance - AGGREGATED BY DATE
  const courseGroupAttendanceData = useMemo(() => {
    const result: Record<string, {
      courseName: string,
      groupName: string,
      dailyAttendance: Array<{
        date: string;
        attendance: number;
        presentCount: number;
        absentCount: number;
        excusedCount: number;
        lateCount: number;
        totalStudents: number;
      }>
    }> = {}

    if (dailyAttendance && Array.isArray(dailyAttendance) && dailyAttendance.length > 0) {
      dailyAttendance.forEach((dept: any) => {
        if (dept.teams && Array.isArray(dept.teams) && dept.teams.length > 0) {
          dept.teams.forEach((team: any) => {
            if (team.courses && Array.isArray(team.courses) && team.courses.length > 0) {
              team.courses.forEach((course: any) => {
                if (course.groups && Array.isArray(course.groups) && course.groups.length > 0) {
                  course.groups.forEach((group: any) => {
                    const key = `${course.courseName}_${group.groupName}`

                    // Initialize if not exists
                    if (!result[key]) {
                      result[key] = {
                        courseName: course.courseName,
                        groupName: group.groupName,
                        dailyAttendance: []
                      }
                    }

                    // Aggregate attendance by date
                    if (group.dailyAttendance && Array.isArray(group.dailyAttendance)) {
                      group.dailyAttendance.forEach((day: any) => {
                        const existingDay = result[key].dailyAttendance.find(
                          (item) => item.date === day.date
                        )

                        if (existingDay) {
                          // Add to existing date
                          existingDay.presentCount += day.presentCount || 0
                          existingDay.absentCount += day.absentCount || 0
                          existingDay.excusedCount += day.excusedCount || 0
                          existingDay.lateCount += day.lateCount || 0
                          existingDay.totalStudents += day.totalStudents || 0
                        } else {
                          // Create new date entry
                          result[key].dailyAttendance.push({
                            date: day.date,
                            attendance: day.attendance || 0,
                            presentCount: day.presentCount || 0,
                            absentCount: day.absentCount || 0,
                            excusedCount: day.excusedCount || 0,
                            lateCount: day.lateCount || 0,
                            totalStudents: day.totalStudents || 0
                          })
                        }
                      })
                    }
                  })
                }
              })
            }
          })
        }
      })
    }

    return result
  }, [dailyAttendance])

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

  // Set default selected values when data loads
  useEffect(() => {
    if (combinedCourseCategories.length > 0) {
      const firstCategory = combinedCourseCategories[0]
      setSelectedCategory(firstCategory.value)
    }
    if (attendanceCourseGroupOptions.length > 0) {
      setSelectedAttendanceCourseGroup(attendanceCourseGroupOptions[0].value)
    }
  }, [combinedCourseCategories, attendanceCourseGroupOptions]);

  // Get available certification types
  const certificationTypes = useMemo(() => {
    if (!overallCertificateStats || !overallCertificateStats.statistics) {
      return ["JLPT", "NAT_TEST"]
    }
    return Object.keys(overallCertificateStats.statistics)
  }, [overallCertificateStats])

  // Set default certification type when data loads
  useEffect(() => {
    if (overallCertificateStats && overallCertificateStats.statistics) {
      const types = Object.keys(overallCertificateStats.statistics)
      if (types.length > 0 && !selectedCertType) {
        setSelectedCertType(types[0])
      }
    }
  }, [overallCertificateStats])

  // Get teams for JLPT department
  const getJlptTeams = (dept: string) => {
    if (dept === "All Departments") {
      return ["All Teams", ...allTeams]
    }

    if (
      teamDisplayData &&
      Array.isArray(teamDisplayData) &&
      teamDisplayData.length > 0
    ) {
      const filteredTeams = teamDisplayData
        .filter((item: any) => {
          const deptItem = dat_departments?.find(
            (d: any) => d.id === item.deptId
          )
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

    if (
      teamDisplayData &&
      Array.isArray(teamDisplayData) &&
      teamDisplayData.length > 0
    ) {
      const filteredTeams = teamDisplayData
        .filter((item: any) => {
          const deptItem = dat_departments?.find(
            (d: any) => d.id === item.deptId
          )
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
    let filteredTeams: any[] = []

    if (jlptDepartment === "All Departments" && jlptTeam === "All Teams") {
      filteredTeams = teamDisplayData || []
    } else if (
      jlptDepartment !== "All Departments" &&
      jlptTeam === "All Teams"
    ) {
      const deptItem = dat_departments?.find(
        (d: any) => d.deptName === jlptDepartment
      )
      if (deptItem) {
        filteredTeams = (teamDisplayData || []).filter(
          (item: any) => item.deptId === deptItem.id
        )
      }
    } else if (jlptTeam !== "All Teams") {
      filteredTeams = (teamDisplayData || []).filter(
        (item: any) => item.team_name === jlptTeam
      )
    }

    const levels = ["N1", "N2", "N3", "N4", "N5"]
    const aggregatedData = levels.map((level) => {
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
    let filteredTeams: any[] = []

    if (commDepartment === "All Departments" && commTeam === "All Teams") {
      filteredTeams = teamDisplayData || []
    } else if (
      commDepartment !== "All Departments" &&
      commTeam === "All Teams"
    ) {
      const deptItem = dat_departments?.find(
        (d: any) => d.deptName === commDepartment
      )
      if (deptItem) {
        filteredTeams = (teamDisplayData || []).filter(
          (item: any) => item.deptId === deptItem.id
        )
      }
    } else if (commTeam !== "All Teams") {
      filteredTeams = (teamDisplayData || []).filter(
        (item: any) => item.team_name === commTeam
      )
    }

    const levels = [
      "Level 0",
      "Level 1 | G1",
      "Level 1 | G2",
      "Level 1 | G3",
      "Level 2 | G1",
      "Level 2 | G2",
      "Level 2 | G3",
      "Level 3",
    ]
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
      (course: any) => course.category.toLowerCase() === selectedCategory
    )
  }

  const filteredCourseData = getFilteredCourseData()

  // Get attendance data for selected course group from dailyAttendance - AGGREGATED
  const getAttendanceData = () => {
    let data: {
      date: string;
      attendance?: number;
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
    }

    // If no data, return empty
    if (data.length === 0) return data

    // Filter by time range - handle date format "Jul 23"
    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    // Check if dates are in the future and adjust year accordingly
    const currentYear = referenceDate.getFullYear()

    // Determine the correct year for each date
    return data.filter((item) => {
      const dateParts = item.date.split(' ')
      if (dateParts.length === 2) {
        const month = dateParts[0]
        const day = parseInt(dateParts[1])
        const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month)
        if (monthIndex !== -1) {
          // Try current year first
          let fullDate = new Date(currentYear, monthIndex, day)
          // If this date is in the future, use last year
          if (fullDate > referenceDate) {
            fullDate = new Date(currentYear - 1, monthIndex, day)
          }
          return fullDate >= startDate
        }
      }
      // Fallback: try parsing as is
      const date = new Date(item.date)
      return date >= startDate
    })
  }
  const filteredAttendanceData = getAttendanceData()

  // Calculate attendance trend (percentage change)
  const attendanceTrend = useMemo(() => {
    const data = filteredAttendanceData
    if (!data || data.length < 2) return { value: 0, direction: 'up' as const }

    // Get first and last attendance values
    const firstValue = data[0]?.attendance || 0
    const lastValue = data[data.length - 1]?.attendance || 0

    if (firstValue === 0) return { value: 0, direction: 'up' as const }

    // Calculate percentage change
    const change = ((lastValue - firstValue) / firstValue) * 100
    const direction = change >= 0 ? 'up' as const : 'down' as const

    return {
      value: Math.abs(Math.round(change * 10) / 10),
      direction
    }
  }, [filteredAttendanceData])


  // Get certification data based on selected type
  const getCertificationData = () => {
    if (!overallCertificateStats || !overallCertificateStats.statistics) {
      return []
    }

    const selectedStat = overallCertificateStats.statistics[selectedCertType]
    if (!selectedStat) return []

    // Convert the stat object to array format for pie chart
    return Object.entries(selectedStat).map(([level, value], index) => ({
      name: level,
      value: typeof value === 'number' ? value : 0, // Convert to percentage
      fill: COLORS[index % COLORS.length]
    }))
  }

  const filteredCertificationData = getCertificationData()

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
      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={employee_data?.length}
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
          title="Total Courses"
          value={courses?.length}
          icon={CourseIcon}
          description="Available for learning"
        />
        <StatCard
          title="Completion Rate"
          value={`${overallCompletionRate}%`}
          icon={ChampionIcon}
          description="Overall course completion"
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
          {/* <div className="flex gap-2 leading-none font-medium">
            <HugeiconsIcon
              icon={AnalyticsUpIcon}
              strokeWidth={2}
              className="h-4 w-4 text-green-600"
            />
            Enrollment up by 5.2% this month
          </div> */}
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

      {/* Third Row - Attendance Analysis Full Width - Interactive Stacked Bar Chart */}
      <Card className="pt-0">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Attendance Analysis</CardTitle>
            <CardDescription>
              Daily attendance breakdown by course group
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
                  {attendanceCourseGroupOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="block truncate max-w-[180px]" title={option.label}>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
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
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No attendance data available
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
                  allowDecimals={false}
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
                <Bar
                  dataKey="presentCount"
                  stackId="a"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  name="Present"
                />
                <Bar
                  dataKey="lateCount"
                  stackId="a"
                  fill="#eab308"
                  radius={[0, 0, 0, 0]}
                  name="Late"
                />
                <Bar
                  dataKey="excusedCount"
                  stackId="a"
                  fill="#0505be"
                  radius={[0, 0, 0, 0]}
                  name="Excused"
                />
                <Bar
                  dataKey="absentCount"
                  stackId="a"
                  fill="#ef4444"
                  radius={[0, 0, 4, 4]}
                  name="Absent"
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2">
          <div className="flex flex-wrap items-center gap-4 leading-none text-sm">
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
            <div className="flex items-center gap-2 leading-none font-medium text-muted-foreground">
              Showing attendance breakdown for selected course group
            </div>
          )}
        </CardFooter>
        {/* <CardFooter>
    <div className="flex w-full flex-col items-center gap-2">
      {filteredAttendanceData.length < 2 ? (
        <div className="flex items-center gap-2 leading-none font-medium text-muted-foreground">
          Insufficient data to calculate trend
        </div>
      ) : (
        <div className="flex items-center gap-2 leading-none font-medium">
          <HugeiconsIcon
            icon={AnalyticsUpIcon}
            strokeWidth={2}
            className={`h-4 w-4 ${attendanceTrend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}
          />
          Attendance {attendanceTrend.direction === 'up' ? 'up' : 'down'} by {attendanceTrend.value}% this month
        </div>
      )}
    </div>
  </CardFooter> */}
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
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {certificationTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredCertificationData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              No data available
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

      {/* Employees at Risk with Department and Team */}
      <Card>
        <CardHeader>
          <CardTitle>Employees at Risk</CardTitle>
          <CardDescription>Employees needing attention</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : !riskData ||
            !riskData.atRiskStudents ||
            riskData.atRiskStudents.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No employees at risk at this time
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
                  {riskData.atRiskStudents.map((employee: any, index: number) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-sm font-medium">
                        {employee.name}
                      </td>
                      <td className="py-2 pr-4 text-sm text-muted-foreground">
                        <span
                          className="block max-w-[150px] truncate"
                          title={employee.department}
                        >
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