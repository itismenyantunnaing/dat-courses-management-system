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
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { StatCard } from "../charts/stat-card"
import { CHART_COLORS, JLPT_COLORS } from "../charts/chart-config"
import { mainStore } from "@/store/mainStore"
import type { RiskDTO } from "@/types/dashboard"
import type { LevelCounts } from "@/types/exam_progress_report"
import type { Employee } from "@/types/employee"
import { cn } from "@/lib/utils"

// Spinner component
const Spinner = ({ className, ...props }: React.ComponentProps<"svg">) => {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
    />
  )
}

// Spinner with text
const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <Spinner />
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
}

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
const COLORS = [
  "#FF6B6B",
  "#FFB74D",
  "#FFD93D",
  "#8EC5FF",
  "#2B7FFF",
  "#FF8A65",
  "#A1887F",
  "#4DB6AC",
  "#7986CB",
]

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
  const [selectedCategory, setSelectedCategory] =
    useState<string>("JLPT Exam Target")
  const [selectedAttendanceCourseGroup, setSelectedAttendanceCourseGroup] =
    useState<string>("")
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

    // for Certificate Statistics
    fetchTeamCertificateStats,
    teamCertificateStats,
    fetchDepartmentCertificateStats,
    departmentCertificateStats,
    fetchDivisionCertificateStats,
    divisionCertificateStats,

    // for Attendance
    fetchDailyAttendance,
    dailyAttendance,

    fetchActiveLearnerCount,
    activeLearnersCount,
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

        // Fetch certificate stats based on role
        const userRole = profile?.role?.toLowerCase() || ""
        if (userRole === "admin") {
          await fetchTeamCertificateStats()
          await fetchDepartmentCertificateStats()
          await fetchDivisionCertificateStats()
        } else if (userRole === "division_head") {
          await fetchDivisionCertificateStats()
        } else if (userRole === "department_head") {
          await fetchDepartmentCertificateStats()
        } else if (userRole === "approver") {
          await fetchTeamCertificateStats()
        }

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

  // Filter courseStats based on user role
  const filteredCourseStats = useMemo(() => {
    // Check if we have courseStats
    if (!courseStats) {
      return []
    }

    // If courseStats is not an array but has the nested structure
    if (!Array.isArray(courseStats) && courseStats?.divisions) {
      // Get user properties - using camelCase as they appear in your profile
      const userRole = profile?.role?.toLowerCase() || ""
      const userTeam = profile?.team?.toLowerCase() || ""
      const userDept = profile?.deptDat?.toLowerCase() || ""
      const userDiv = profile?.divName?.toLowerCase() || ""

      let allCourses: any[] = []

      // For Department Head: Use department.courses directly
      if (userRole === "department_head") {
        courseStats.divisions.forEach((division: any) => {
          division.departments?.forEach((department: any) => {
            const deptName = department.departmentName?.toLowerCase() || ""
            if (deptName === userDept) {
              if (department.courses && department.courses.length > 0) {
                department.courses.forEach((course: any) => {
                  allCourses.push({
                    ...course,
                    divisionName: division.divisionName,
                    departmentName: department.departmentName,
                  })
                })
              }
            }
          })
        })

        return allCourses
      }

      // For Division Head: Use division.courses directly
      if (userRole === "division_head") {
        courseStats.divisions.forEach((division: any) => {
          const divName = division.divisionName?.toLowerCase() || ""
          if (divName === userDiv) {
            if (division.courses && division.courses.length > 0) {
              division.courses.forEach((course: any) => {
                allCourses.push({
                  ...course,
                  divisionName: division.divisionName,
                  divisionId: division.divisionId,
                })
              })
            }
          }
        })

        return allCourses
      }

      // For Approver: Use team.courses
      if (userRole === "approver") {
        courseStats.divisions.forEach((division: any) => {
          division.departments?.forEach((department: any) => {
            department.teams?.forEach((team: any) => {
              const teamName = team.teamName?.toLowerCase() || ""
              if (teamName === userTeam) {
                if (team.courses && team.courses.length > 0) {
                  team.courses.forEach((course: any) => {
                    allCourses.push({
                      ...course,
                      divisionName: division.divisionName,
                      departmentName: department.departmentName,
                      teamName: team.teamName,
                    })
                  })
                }
              }
            })
          })
        })

        return allCourses
      }

      // For Admin: Use department.courses
      if (userRole === "admin") {
        courseStats.divisions.forEach((division: any) => {
          division.departments?.forEach((department: any) => {
            if (department.courses && department.courses.length > 0) {
              department.courses.forEach((course: any) => {
                allCourses.push({
                  ...course,
                  divisionName: division.divisionName,
                  departmentName: department.departmentName,
                })
              })
            }
          })
        })

        return allCourses
      }

      // Default: return empty
      return []
    } else if (Array.isArray(courseStats)) {
      return courseStats
    } else {
      return []
    }
  }, [courseStats, profile])

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

  // Extract course group attendance data from dailyAttendance filtered by role
  const courseGroupAttendanceData = useMemo(() => {
    const result: Record<
      string,
      {
        courseName: string
        groupName: string
        dailyAttendance: Array<{
          date: string
          attendance: number
          presentCount: number
          totalStudents: number
        }>
      }
    > = {}

    if (
      !dailyAttendance ||
      !Array.isArray(dailyAttendance) ||
      dailyAttendance.length === 0
    ) {
      return result
    }

    const userRole = profile?.role?.toLowerCase() || ""
    const userTeam = profile?.team?.toLowerCase() || ""
    const userDept = profile?.deptDat?.toLowerCase() || ""
    const userDiv = profile?.divName?.toLowerCase() || ""

    let processedCount = 0

    // For Department Head: Aggregate data across all teams in the department
    if (userRole === "department_head") {
      // Create a map to aggregate data by course + group
      const aggregatedMap: Record<
        string,
        {
          courseName: string
          groupName: string
          dailyAttendanceMap: Record<
            string,
            {
              date: string
              presentCount: number
              absentCount: number
              excusedCount: number
              lateCount: number
              totalStudents: number
              attendance: number
            }
          >
        }
      > = {}

      dailyAttendance.forEach((division: any) => {
        division.departments?.forEach((department: any) => {
          const deptName = department.departmentName?.toLowerCase() || ""

          // Only process the user's department
          if (deptName !== userDept) {
            return
          }

          department.teams?.forEach((team: any) => {
            team.courses?.forEach((course: any) => {
              const courseName = course.courseName || ""

              course.groups?.forEach((group: any) => {
                const groupName = group.groupName || ""
                const key = `${courseName}_${groupName}`

                // Initialize if not exists
                if (!aggregatedMap[key]) {
                  aggregatedMap[key] = {
                    courseName: courseName,
                    groupName: groupName,
                    dailyAttendanceMap: {},
                  }
                }

                // Aggregate daily attendance data
                group.dailyAttendance?.forEach((day: any) => {
                  const date = day.date || ""

                  if (!aggregatedMap[key].dailyAttendanceMap[date]) {
                    aggregatedMap[key].dailyAttendanceMap[date] = {
                      date: date,
                      presentCount: 0,
                      absentCount: 0,
                      excusedCount: 0,
                      lateCount: 0,
                      totalStudents: 0,
                      attendance: 0,
                    }
                  }

                  // Sum up the counts
                  aggregatedMap[key].dailyAttendanceMap[date].presentCount +=
                    day.presentCount || 0
                  aggregatedMap[key].dailyAttendanceMap[date].absentCount +=
                    day.absentCount || 0
                  aggregatedMap[key].dailyAttendanceMap[date].excusedCount +=
                    day.excusedCount || 0
                  aggregatedMap[key].dailyAttendanceMap[date].lateCount +=
                    day.lateCount || 0
                  aggregatedMap[key].dailyAttendanceMap[date].totalStudents +=
                    day.totalStudents || 0
                })
              })
            })
          })
        })
      })

      // Convert aggregated map to result format
      Object.keys(aggregatedMap).forEach((key) => {
        const data = aggregatedMap[key]
        const dailyAttendanceData = Object.values(data.dailyAttendanceMap).map(
          (day: any) => ({
            date: day.date,
            presentCount: day.presentCount,
            absentCount: day.absentCount,
            excusedCount: day.excusedCount,
            lateCount: day.lateCount,
            totalStudents: day.totalStudents,
            attendance:
              day.totalStudents > 0
                ? Math.round((day.presentCount / day.totalStudents) * 100)
                : 0,
          })
        )

        // Sort by date
        dailyAttendanceData.sort((a, b) => {
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          return dateA.getTime() - dateB.getTime()
        })

        result[key] = {
          courseName: data.courseName,
          groupName: data.groupName,
          dailyAttendance: dailyAttendanceData,
        }
        processedCount++
      })

      return result
    }

    // For Division Head: Aggregate data across all departments and teams in the division
    if (userRole === "division_head") {
      // Create a map to aggregate data by course + group
      const aggregatedMap: Record<
        string,
        {
          courseName: string
          groupName: string
          dailyAttendanceMap: Record<
            string,
            {
              date: string
              presentCount: number
              absentCount: number
              excusedCount: number
              lateCount: number
              totalStudents: number
              attendance: number
            }
          >
        }
      > = {}

      dailyAttendance.forEach((division: any) => {
        const divName = division.divisionName?.toLowerCase() || ""

        // Only process the user's division
        if (divName !== userDiv) {
          return
        }

        division.departments?.forEach((department: any) => {
          department.teams?.forEach((team: any) => {
            team.courses?.forEach((course: any) => {
              const courseName = course.courseName || ""

              course.groups?.forEach((group: any) => {
                const groupName = group.groupName || ""
                const key = `${courseName}_${groupName}`

                // Initialize if not exists
                if (!aggregatedMap[key]) {
                  aggregatedMap[key] = {
                    courseName: courseName,
                    groupName: groupName,
                    dailyAttendanceMap: {},
                  }
                }

                // Aggregate daily attendance data
                group.dailyAttendance?.forEach((day: any) => {
                  const date = day.date || ""

                  if (!aggregatedMap[key].dailyAttendanceMap[date]) {
                    aggregatedMap[key].dailyAttendanceMap[date] = {
                      date: date,
                      presentCount: 0,
                      absentCount: 0,
                      excusedCount: 0,
                      lateCount: 0,
                      totalStudents: 0,
                      attendance: 0,
                    }
                  }

                  // Sum up the counts
                  aggregatedMap[key].dailyAttendanceMap[date].presentCount +=
                    day.presentCount || 0
                  aggregatedMap[key].dailyAttendanceMap[date].absentCount +=
                    day.absentCount || 0
                  aggregatedMap[key].dailyAttendanceMap[date].excusedCount +=
                    day.excusedCount || 0
                  aggregatedMap[key].dailyAttendanceMap[date].lateCount +=
                    day.lateCount || 0
                  aggregatedMap[key].dailyAttendanceMap[date].totalStudents +=
                    day.totalStudents || 0
                })
              })
            })
          })
        })
      })

      // Convert aggregated map to result format
      Object.keys(aggregatedMap).forEach((key) => {
        const data = aggregatedMap[key]
        const dailyAttendanceData = Object.values(data.dailyAttendanceMap).map(
          (day: any) => ({
            date: day.date,
            presentCount: day.presentCount,
            absentCount: day.absentCount,
            excusedCount: day.excusedCount,
            lateCount: day.lateCount,
            totalStudents: day.totalStudents,
            attendance:
              day.totalStudents > 0
                ? Math.round((day.presentCount / day.totalStudents) * 100)
                : 0,
          })
        )

        // Sort by date
        dailyAttendanceData.sort((a, b) => {
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          return dateA.getTime() - dateB.getTime()
        })

        result[key] = {
          courseName: data.courseName,
          groupName: data.groupName,
          dailyAttendance: dailyAttendanceData,
        }
        processedCount++
      })

      return result
    }

    // For Admin, Approver: Use the existing filtering logic (no aggregation)
    dailyAttendance.forEach((division: any) => {
      const divName = division.divisionName?.toLowerCase() || ""

      // For Admin: process all divisions
      // For Approver: process all divisions but filter by team later

      division.departments?.forEach((department: any) => {
        const deptName = department.departmentName?.toLowerCase() || ""

        department.teams?.forEach((team: any) => {
          const teamName = team.teamName?.toLowerCase() || ""

          // For Approver: only process their team
          if (userRole === "approver" && teamName !== userTeam) {
            return
          }

          team.courses?.forEach((course: any) => {
            const courseName = course.courseName || ""

            course.groups?.forEach((group: any) => {
              const groupName = group.groupName || ""
              const key = `${courseName}_${groupName}`

              const dailyAttendanceData =
                group.dailyAttendance?.map((day: any) => ({
                  date: day.date || "",
                  presentCount: day.presentCount || 0,
                  absentCount: day.absentCount || 0,
                  excusedCount: day.excusedCount || 0,
                  lateCount: day.lateCount || 0,
                  totalStudents: day.totalStudents || 1,
                  attendance: day.presentPercentage || 0,
                })) || []

              if (dailyAttendanceData.length > 0) {
                result[key] = {
                  courseName: courseName,
                  groupName: groupName,
                  dailyAttendance: dailyAttendanceData,
                }
                processedCount++
              }
            })
          })
        })
      })
    })

    return result
  }, [dailyAttendance, profile])

  // Create course group options for attendance dropdown from dailyAttendance
  const attendanceCourseGroupOptions = useMemo(() => {
    const options: { value: string; label: string }[] = []

    const keys = Object.keys(courseGroupAttendanceData)
    keys.forEach((key) => {
      const data = courseGroupAttendanceData[key]
      options.push({
        value: key,
        label: `${data.courseName} (${data.groupName})`,
      })
    })

    return options
  }, [courseGroupAttendanceData])

  // Set default selected attendance course group when data loads
  useEffect(() => {
    if (attendanceCourseGroupOptions.length > 0) {
      setSelectedAttendanceCourseGroup(attendanceCourseGroupOptions[0].value)
    }
  }, [attendanceCourseGroupOptions])

  // Get certificate stats based on user role
  const certificateStats = useMemo(() => {
    const userRole = profile?.role?.toLowerCase() || ""

    if (userRole === "admin") {
      return teamCertificateStats
    } else if (userRole === "division_head") {
      return divisionCertificateStats
    } else if (userRole === "department_head") {
      return departmentCertificateStats
    } else if (userRole === "approver") {
      return teamCertificateStats
    }
    return teamCertificateStats
  }, [
    profile,
    teamCertificateStats,
    departmentCertificateStats,
    divisionCertificateStats,
  ])

  // Get available certification types
  const availableCertTypes = useMemo(() => {
    if (!certificateStats || !certificateStats.statistics) {
      return []
    }

    const userRole = profile?.role?.toLowerCase() || ""
    const stats = certificateStats.statistics

    let certData: any = null

    if (userRole === "approver" && profile?.team) {
      // Teams: { teamName: { certType: { level: count } } }
      certData = stats[profile.team]
    } else if (userRole === "department_head" && profile?.deptDat) {
      // Departments: { departmentName: { teamName: { certType: { level: count } } } }
      const deptData = stats[profile.deptDat]
      if (deptData) {
        // Combine all teams' certificate data in the department
        certData = {}
        Object.values(deptData).forEach((teamData: any) => {
          Object.entries(teamData).forEach(([certType, levels]) => {
            if (!certData[certType]) {
              certData[certType] = {}
            }
            Object.entries(levels as Record<string, number>).forEach(
              ([level, count]) => {
                certData[certType][level] =
                  (certData[certType][level] || 0) + count
              }
            )
          })
        })
      }
    } else if (userRole === "division_head" && profile?.divName) {
      // Divisions: { divisionName: { departmentName: { teamName: { certType: { level: count } } } } }
      const divData = stats[profile.divName]
      if (divData) {
        // Combine all departments and teams' certificate data in the division
        certData = {}
        Object.values(divData).forEach((deptData: any) => {
          Object.values(deptData).forEach((teamData: any) => {
            Object.entries(teamData).forEach(([certType, levels]) => {
              if (!certData[certType]) {
                certData[certType] = {}
              }
              Object.entries(levels as Record<string, number>).forEach(
                ([level, count]) => {
                  certData[certType][level] =
                    (certData[certType][level] || 0) + count
                }
              )
            })
          })
        })
      }
    } else if (userRole === "admin") {
      // Admin: Combine all teams
      certData = {}
      Object.values(stats).forEach((teamData: any) => {
        Object.entries(teamData).forEach(([certType, levels]) => {
          if (!certData[certType]) {
            certData[certType] = {}
          }
          Object.entries(levels as Record<string, number>).forEach(
            ([level, count]) => {
              certData[certType][level] =
                (certData[certType][level] || 0) + count
            }
          )
        })
      })
    }

    return certData ? Object.keys(certData) : []
  }, [certificateStats, profile])

  // Set default certification type when data loads
  useEffect(() => {
    if (availableCertTypes.length > 0) {
      setSelectedCertType(availableCertTypes[0])
    }
  }, [availableCertTypes])

  // Memoize filtered course data based on selected category
  const filteredCourseData = useMemo(() => {
    if (!filteredCourseStats || !Array.isArray(filteredCourseStats)) return []
    if (!selectedCategory) return filteredCourseStats

    return filteredCourseStats.filter(
      (course) =>
        course.category?.toLowerCase() === selectedCategory?.toLowerCase()
    )
  }, [filteredCourseStats, selectedCategory])

  // Get attendance data for selected course group from dailyAttendance
  const getAttendanceData = () => {
    let data: {
      date: string
      presentCount: number
      absentCount: number
      excusedCount: number
      lateCount: number
      totalStudents: number
    }[] = []

    const selectedData =
      courseGroupAttendanceData[selectedAttendanceCourseGroup]
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
      const dateParts = item.date.split(" ")
      if (dateParts.length === 2) {
        const month = dateParts[0]
        const day = parseInt(dateParts[1])
        const monthIndex = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ].indexOf(month)
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

  // Get filtered certification data
  const filteredCertificationData = useMemo(() => {
    if (
      !certificateStats ||
      !certificateStats.statistics ||
      !selectedCertType
    ) {
      return []
    }

    const userRole = profile?.role?.toLowerCase() || ""
    const stats = certificateStats.statistics

    let certData: any = null

    if (userRole === "approver" && profile?.team) {
      // Teams: { teamName: { certType: { level: count } } }
      const teamData = stats[profile.team]
      if (teamData) {
        certData = teamData[selectedCertType]
      }
    } else if (userRole === "department_head" && profile?.deptDat) {
      // Departments: { departmentName: { teamName: { certType: { level: count } } } }
      const deptData = stats[profile.deptDat]
      if (deptData) {
        // Combine all teams' certificate data for the selected cert type
        const combined: Record<string, number> = {}
        Object.values(deptData).forEach((teamData: any) => {
          if (teamData[selectedCertType]) {
            Object.entries(teamData[selectedCertType]).forEach(
              ([level, count]) => {
                combined[level] = (combined[level] || 0) + count
              }
            )
          }
        })
        certData = combined
      }
    } else if (userRole === "division_head" && profile?.divName) {
      // Divisions: { divisionName: { departmentName: { teamName: { certType: { level: count } } } } }
      const divData = stats[profile.divName]
      if (divData) {
        // Combine all departments and teams' certificate data for the selected cert type
        const combined: Record<string, number> = {}
        Object.values(divData).forEach((deptData: any) => {
          Object.values(deptData).forEach((teamData: any) => {
            if (teamData[selectedCertType]) {
              Object.entries(teamData[selectedCertType]).forEach(
                ([level, count]) => {
                  combined[level] = (combined[level] || 0) + count
                }
              )
            }
          })
        })
        certData = combined
      }
    } else if (userRole === "admin") {
      // Admin: Combine all teams
      const combined: Record<string, number> = {}
      Object.values(stats).forEach((teamData: any) => {
        if (teamData[selectedCertType]) {
          Object.entries(teamData[selectedCertType]).forEach(
            ([level, count]) => {
              combined[level] = (combined[level] || 0) + count
            }
          )
        }
      })
      certData = combined
    }

    if (!certData) {
      return []
    }

    // Convert the stat object to array format for pie chart
    return Object.entries(certData).map(([level, value], index) => ({
      name: level,
      value: typeof value === "number" ? value : 0,
      fill: COLORS[index % COLORS.length],
    }))
  }, [certificateStats, selectedCertType, profile])

  // Calculate average attendance based on user role
  const avgAttendance = useMemo(() => {
    if (
      !dailyAttendance ||
      !Array.isArray(dailyAttendance) ||
      dailyAttendance.length === 0
    ) {
      return 0
    }

    const userRole = profile?.role?.toLowerCase() || ""
    const userTeam = profile?.team?.toLowerCase() || ""
    const userDept = profile?.deptDat?.toLowerCase() || ""
    const userDiv = profile?.divName?.toLowerCase() || ""

    // Helper function to calculate average from items
    const calculateAverage = (
      items: any[],
      field: string = "averageAttendance"
    ) => {
      if (!items || items.length === 0) return 0
      const total = items.reduce((sum: number, item: any) => {
        const val = item[field] || 0
        return sum + val
      }, 0)
      return total / items.length
    }

    // Helper function to get attendance value (from API or calculated)
    const getAttendanceValue = (item: any, childItems: any[] | null = null) => {
      // If API has a value greater than 0, use it
      if (item.averageAttendance && item.averageAttendance > 0) {
        return item.averageAttendance
      }

      // If API returns 0 or null, try to calculate from children
      if (childItems && childItems.length > 0) {
        return calculateAverage(childItems)
      }

      return 0
    }

    // Admin: Average of all division averageAttendance
    if (userRole === "admin") {
      if (dailyAttendance.length === 0) return 0

      const total = dailyAttendance.reduce((sum: number, div: any) => {
        const avg = getAttendanceValue(div, div.departments)
        return sum + avg
      }, 0)

      const avg = Math.round(total / dailyAttendance.length)
      return avg
    }

    // Division Head: Use division's averageAttendance
    if (userRole === "division_head") {
      const division = dailyAttendance.find(
        (d: any) => d.divisionName?.toLowerCase() === userDiv
      )

      if (division) {
        const avg = getAttendanceValue(division, division.departments)
        const roundedAvg = Math.round(avg)
        return roundedAvg
      }
      return 0
    }

    // Department Head: Use department's averageAttendance
    if (userRole === "department_head") {
      for (const division of dailyAttendance) {
        const department = division.departments?.find(
          (d: any) => d.departmentName?.toLowerCase() === userDept
        )
        if (department) {
          const avg = getAttendanceValue(department, department.teams)
          const roundedAvg = Math.round(avg)
          return roundedAvg
        }
      }
      return 0
    }

    // Approver: Use team's averageAttendance
    if (userRole === "approver") {
      for (const division of dailyAttendance) {
        for (const department of division.departments || []) {
          const team = department.teams?.find(
            (t: any) => t.teamName?.toLowerCase() === userTeam
          )
          if (team) {
            const avg = Math.round(team.averageAttendance || 0)
            return avg
          }
        }
      }
      return 0
    }

    // Default: return 0
    return 0
  }, [dailyAttendance, profile])

  // Filter at-risk employees based on user role
  const filteredAtRiskEmployees = useMemo(() => {
    if (!riskData || !riskData.atRiskStudents) {
      return []
    }

    const userRole = profile?.role?.toLowerCase() || ""
    const userTeam = profile?.team?.toLowerCase() || ""
    const userDept = profile?.deptDat?.toLowerCase() || ""
    const userDiv = profile?.divName?.toLowerCase() || ""

    // Approver: Show only employees from their team
    if (userRole === "approver") {
      return riskData.atRiskStudents.filter(
        (employee: RiskDTO) => employee.team?.toLowerCase() === userTeam
      )
    }

    // Department Head: Show only employees from their department
    if (userRole === "department_head") {
      return riskData.atRiskStudents.filter(
        (employee: RiskDTO) => employee.department?.toLowerCase() === userDept
      )
    }

    // Division Head: Show only employees from their division
    if (userRole === "division_head") {
      return riskData.atRiskStudents.filter(
        (employee: RiskDTO) => employee.division?.toLowerCase() === userDiv
      )
    }

    // Default: Return all (or empty based on your preference)
    return riskData.atRiskStudents
  }, [riskData, profile])

  // Memoize at-risk count (filtered by team)
  const atRiskCount = useMemo(() => {
    return filteredAtRiskEmployees.length
  }, [filteredAtRiskEmployees])

  // Calculate completion rate based on user role
  const completionRate = useMemo(() => {
    if (!courseStats || !courseStats.divisions) return 0

    const userRole = profile?.role?.toLowerCase() || ""
    const userTeam = profile?.team?.toLowerCase() || ""
    const userDept = profile?.deptDat?.toLowerCase() || ""
    const userDiv = profile?.divName?.toLowerCase() || ""

    // For Admin: Average of all division completion rates
    if (userRole === "admin") {
      const divisions = courseStats.divisions || []
      if (divisions.length === 0) return 0
      const total = divisions.reduce(
        (sum: number, div: any) => sum + (div.averageCompletionRate || 0),
        0
      )
      return Math.round(total / divisions.length)
    }

    // For Division Head: Use the division's averageCompletionRate
    if (userRole === "division_head") {
      const division = courseStats.divisions.find(
        (d: any) => d.divisionName?.toLowerCase() === userDiv
      )
      return Math.round(division?.averageCompletionRate || 0)
    }

    // For Department Head: Use the department's averageCompletionRate
    if (userRole === "department_head") {
      for (const division of courseStats.divisions) {
        const department = division.departments?.find(
          (d: any) => d.departmentName?.toLowerCase() === userDept
        )
        if (department) {
          return Math.round(department.averageCompletionRate || 0)
        }
      }
      return 0
    }

    // For Approver: Use the team's averageCompletionRate
    if (userRole === "approver") {
      for (const division of courseStats.divisions) {
        for (const department of division.departments || []) {
          const team = department.teams?.find(
            (t: any) => t.teamName?.toLowerCase() === userTeam
          )
          if (team) {
            return Math.round(team.averageCompletionRate || 0)
          }
        }
      }
      return 0
    }

    // Default: return 0
    return 0
  }, [courseStats, profile])

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner text="Loading dashboard..." />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-6">
      <CardContent className="space-y-4 px-0">
        {/* Stats Row - Updated with real data */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Members"
            value={activeLearnersCount?.totalEmployees || 0}
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
            value={`${avgAttendance}%`}
            icon={CheckmarkCircle01Icon}
            description={
              profile?.role?.toLowerCase() === "admin"
                ? "Across all divisions"
                : profile?.role?.toLowerCase() === "division_head"
                  ? `Attendance rate by division`
                  : profile?.role?.toLowerCase() === "department_head"
                    ? `Attendance rate by department`
                    : profile?.role?.toLowerCase() === "approver"
                      ? `Attendance rate by team`
                      : "Team attendance rate"
            }
          />
          <StatCard
            title="Course Completion Rate"
            value={`${completionRate}%`}
            icon={ChampionIcon}
            description={
              profile?.role?.toLowerCase() === "admin"
                ? "Average course completion across all divisions"
                : profile?.role?.toLowerCase() === "division_head"
                  ? `Average course completion by division`
                  : profile?.role?.toLowerCase() === "department_head"
                    ? `Average course completion by department`
                    : profile?.role?.toLowerCase() === "approver"
                      ? `Average course completion by team`
                      : "Overall course completion rate"
            }
          />
        </div>

        {/* Course Statistics - Category Select (Filtered by Role) */}
        <Card className="col-span-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Course Statistics</CardTitle>
              <CardDescription>
                {profile?.role === "approver" &&
                  `Enrollment and completion for ${profile?.team || "your team"}`}
                {profile?.role === "department_head" &&
                  `Enrollment and completion for ${profile?.dept_dat || "your department"}`}
                {profile?.role === "division_head" &&
                  `Enrollment and completion for ${profile?.div_name || "your division"}`}
                {!profile?.role && "Enrollment and completion by course"}
              </CardDescription>
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
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
            {filteredCourseData.length === 0 ? (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                No course data available for your{" "}
                {profile?.role === "approver"
                  ? "team"
                  : profile?.role === "department_head"
                    ? "department"
                    : "division"}
              </div>
            ) : (
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
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />

                  <Bar dataKey="enrolled" fill="#8EC5FF" radius={4}>
                    <LabelList dataKey="enrolled" content={renderCustomLabel} />
                  </Bar>
                  <Bar dataKey="completed" fill="#2B7FFF" radius={4}>
                    <LabelList
                      dataKey="completed"
                      content={renderCustomLabel}
                    />
                  </Bar>
                </BarChart>
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
              {filteredCourseData.length > 0 && (
                <>
                  Showing filtered course data by{" "}
                  {profile?.role?.toLowerCase() === "admin" &&
                    "all departments"}
                  {profile?.role?.toLowerCase() === "approver" &&
                    `team: ${profile?.team || "your team"}`}
                  {profile?.role?.toLowerCase() === "department_head" &&
                    `department: ${profile?.deptDat || "your department"}`}
                  {profile?.role?.toLowerCase() === "division_head" &&
                    `division: ${profile?.divName || "your division"}`}
                  {!profile?.role && "your role"}
                </>
              )}
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
                {profile?.role?.toLowerCase() === "admin"
                  ? "Daily attendance breakdown across all teams"
                  : profile?.role?.toLowerCase() === "division_head"
                    ? `Daily attendance breakdown for ${profile?.divName || "your division"}`
                    : profile?.role?.toLowerCase() === "department_head"
                      ? `Daily attendance breakdown for ${profile?.deptDat || "your department"}`
                      : `Daily attendance breakdown for ${profile?.team || "your team"}`}
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
                          <span
                            className="block max-w-[180px] truncate"
                            title={option.label}
                          >
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
                      if (value && value.includes(" ")) {
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
                          if (value && value.includes(" ")) {
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
                <div className="flex items-center gap-2 text-sm leading-none text-muted-foreground">
                  <HugeiconsIcon
                    icon={AnalyticsUpIcon}
                    strokeWidth={2}
                    className="h-4 w-4 text-green-600"
                  />
                  {profile?.role?.toLowerCase() === "admin"
                    ? "All teams attendance breakdown"
                    : profile?.role?.toLowerCase() === "division_head"
                      ? `${profile?.divName || "Division"} attendance breakdown`
                      : profile?.role?.toLowerCase() === "department_head"
                        ? `${profile?.deptDat || "Department"} attendance breakdown`
                        : profile?.role?.toLowerCase() === "approver"
                          ? `${profile?.team || "Team"} attendance breakdown`
                          : "Attendance breakdown"}
                </div>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Two Column Layout for Team JLPT Distribution and Certification Progress */}
        <div className="grid gap-4 md:grid-cols-2">
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
                const teamData =
                  teamDisplayData?.filter(
                    (item: any) => item.team_name === profile?.team
                  ) || []

                // Transform data for the chart
                const chartData = teamData.map((item: any) => ({
                  team: item.team_name,
                  N1: item.N1 || 0,
                  N2: item.N2 || 0,
                  N3: item.N3 || 0,
                  N4: item.N4 || 0,
                  N5: item.N5 || 0,
                }))

                // Check if we have data to display
                const hasData =
                  chartData.length > 0 &&
                  chartData.some(
                    (item: LevelCounts) =>
                      item.N1 > 0 ||
                      item.N2 > 0 ||
                      item.N3 > 0 ||
                      item.N4 > 0 ||
                      item.N5 > 0
                  )

                if (!hasData) {
                  return (
                    <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                      No JLPT distribution data available for {profile?.team}
                    </div>
                  )
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
                      <ChartTooltip
                        content={<ChartTooltipContent hideLabel />}
                      />
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
                )
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
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "#8b5cf6" }}
                  />
                  <span>N1</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "#6366f1" }}
                  />
                  <span>N2</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "#3b82f6" }}
                  />
                  <span>N3</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "#22c55e" }}
                  />
                  <span>N4</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "#eab308" }}
                  />
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
                  Certification completion status for{" "}
                  {profile?.role?.toLowerCase() === "division_head"
                    ? profile?.divName || "your division"
                    : profile?.role?.toLowerCase() === "department_head"
                      ? profile?.deptDat || "your department"
                      : profile?.team || "your team"}
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
                      <th className="pr-4 pb-2">Division</th>
                      <th className="pr-4 pb-2">Department</th>
                      <th className="pr-4 pb-2">Team</th>
                      <th className="pr-4 pb-2">Course</th>
                      <th className="pr-4 pb-2">Issue</th>
                      <th className="pb-2">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAtRiskEmployees.map(
                      (employee: RiskDTO, index: number) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-2 pr-4 text-sm font-medium">
                            {employee.name}
                          </td>
                          <td className="py-2 pr-4 text-sm text-muted-foreground">
                            <span
                              className="block max-w-[150px] truncate"
                              title={employee.division}
                            >
                              {employee.division}
                            </span>
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
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </div>
  )
}
