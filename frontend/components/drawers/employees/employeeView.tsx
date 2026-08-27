"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { resolveUploadUrl } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Course } from "@/types/course"
import type { Employee } from "@/types/employee"
import { useEffect, useState, useMemo } from "react"
import { mainStore } from "@/store/mainStore"
import { CourseCard } from "@/components/cards/course-card"
import { cn } from "@/lib/utils"

interface EmployeeViewProps {
  employee: Employee | null
  courses: Course[]
}

// Helper function to get initials
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Status badge styling
const getStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
    case "inactive":
      return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300"
    default:
      return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300"
  }
}

const statusLabels: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
}

const InfoRow = ({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) => {
  return (
    <div className="flex items-start gap-4 py-3">
      <span className="w-32 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium break-all">{value || "-"}</span>
    </div>
  )
}

// Helper function to get category display name
const getCategoryDisplayName = (category: string, skills: any[]) => {
  // If category is not empty, return it
  if (!category.includes("empty")) {
    return category
  }

  // Category is empty, try to get subcategory
  const subCategory = skills[0]?.subCategoryName

  // Check if subcategory exists and is not empty
  if (subCategory && subCategory !== "empty-1" && subCategory !== "empty-2") {
    return subCategory
  }

  // Both category and subcategory are empty - return null
  return null
}

// Skill item component
const SkillItem = ({ skill }: { skill: any }) => {
  // Get color based on years of experience
  const getYearColor = (years: number) => {
    if (years >= 5) return "text-green-600"
    if (years >= 3) return "text-blue-600"
    if (years >= 1) return "text-yellow-600"
    return "text-gray-500"
  }

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-muted/30 transition-colors rounded-md group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {skill.skillName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* Years */}
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "text-sm font-semibold tabular-nums",
              getYearColor(skill.yearsOfExperience || 0)
            )}>
              {skill.yearsOfExperience?.toFixed(1) || "0"}
            </span>
            <span className="text-xs text-muted-foreground">yrs</span>
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-border" />

          {/* Experience Level */}
          <Badge
            variant="outline"
            className="text-xs font-normal px-2 py-0 h-5"
          >
            {skill.experienceLevel || "N/A"}
          </Badge>
        </div>
      </div>
    </div>
  )
}

export function EmployeeView({ employee, courses }: EmployeeViewProps) {
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)
  const { checkMyEnrollment, fetch_SkillData, skillData, profile } = mainStore()
  const userRole = profile.role.toLowerCase();
  const isAdmin = userRole === "admin"

  // Filter courses when courses prop changes
  useEffect(() => {
    const filterEnrolledCourses = async () => {
      if (!courses || courses.length === 0) {
        setEnrolledCourses([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const enrollmentPromises = courses.map((course) =>
          checkMyEnrollment(course.id, employee?.id)
        )
        const enrollmentResults = await Promise.all(enrollmentPromises)

        const filtered = courses.filter((course, index) => {
          const result = enrollmentResults[index]
          return result.success && result.isEnrolled
        })

        setEnrolledCourses(filtered)
      } catch (error) {
        console.error("Error filtering enrolled courses:", error)
        setEnrolledCourses([])
      } finally {
        setIsLoading(false)
      }
    }

    filterEnrolledCourses()
  }, [courses, checkMyEnrollment, employee?.id])

  // Fetch skills if not already loaded
  useEffect(() => {
    const loadSkills = async () => {
      if (!employee) return

      setIsLoadingSkills(true)
      try {
        // Fetch skills if not loaded
        if (!skillData || skillData.length === 0) {
          await fetch_SkillData()
        }
      } catch (error) {
        console.error("Error loading skills:", error)
      } finally {
        setIsLoadingSkills(false)
      }
    }

    loadSkills()
  }, [employee, fetch_SkillData])

  // Filter skills for the current employee
  const employeeSkills = useMemo(() => {
    if (!skillData || !employee) return []
    return skillData.filter((skill: any) => skill.employeeId === employee.id)
  }, [skillData, employee])

  // Group skills by category or subcategory
  const groupedSkills = useMemo(() => {
    const grouped: Record<string, any[]> = {}

    employeeSkills.forEach((skill: any) => {
      // Use subCategoryName if category is empty, otherwise use category
      const key = skill.categoryName?.includes("empty")
        ? (skill.subCategoryName || "")
        : skill.categoryName

      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(skill)
    })

    return grouped
  }, [employeeSkills])

  if (!employee) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No employee data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={resolveUploadUrl(employee.profile_photo_path) || ""}
                alt={employee.name}
              />
              <AvatarFallback className="text-lg text-primary">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-semibold truncate">{employee.name}</h2>
                <Badge className={getStatusBadge(employee.emp_status)}>
                  {statusLabels[employee.emp_status] || employee.emp_status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{employee.role || "-"}</p>
              <p className="text-sm text-muted-foreground">{employee.email || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-4 text-sm font-semibold uppercase text-muted-foreground">
            Employment Information
          </h3>
          <div className="divide-y">
            {isAdmin && <InfoRow label="Staff ID" value={employee.id} />}
            <InfoRow label="Division" value={employee.div_name} />
            <InfoRow label="Department" value={employee.dept_dat} />
            <InfoRow label="Team" value={employee.team} />
            <InfoRow label="Role" value={employee.role} />
            {isAdmin && <InfoRow label="Door Log Access" value={employee.doorlog} />}
            {isAdmin && <InfoRow label="Joined Date" value={employee.joinedDate} />}
            <InfoRow label="Service Year" value={employee.serviceYear} />
            <InfoRow label="Core Personnel" value={employee.is_core_personnel ? "Yes" : "No"} />
            <InfoRow label="Japan Business Trip" value={employee.has_japan_business_trip ? "Yes" : "No"} />
            {employee.dob && <InfoRow label="Date of Birth" value={employee.dob} />}
          </div>
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Skills
            </h3>
            <Badge variant="secondary" className="text-xs">
              {isLoadingSkills ? "Loading..." : `${employeeSkills.length} skills`}
            </Badge>
          </div>
          <Separator className="mb-4" />

          {isLoadingSkills ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading skills...</div>
            </div>
          ) : employeeSkills.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No skills recorded for this employee
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(groupedSkills).map(([category, skills]) => {
                const displayName = getCategoryDisplayName(category, skills)
                const isOtherCategory = category.includes("empty")

                return (
                  <div key={category}>
                    {/* Separator with optional label */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 border-t border-border" />
                      {displayName ? (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-medium",
                            isOtherCategory ? "text-muted-foreground" : "text-foreground"
                          )}>
                            {displayName}
                          </span>
                        </div>
                      ) : (
                        // No label - show just a small dot
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      )}
                      <div className="flex-1 border-t border-border" />
                    </div>

                    {/* Skills list */}
                    <div className={cn(
                      "rounded-md border overflow-hidden",
                      (isOtherCategory || !displayName) && "border-dashed border-muted-foreground/20"
                    )}>
                      {skills.map((skill, skillIndex) => (
                        <div key={skill.id}>
                          <SkillItem skill={skill} />
                          {skillIndex < skills.length - 1 && (
                            <div className="border-b border-border/50" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrolled Courses Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Enrolled Courses
            </h3>
            <Badge variant="secondary" className="text-xs">
              {isLoading ? "Loading..." : `${enrolledCourses.length} courses`}
            </Badge>
          </div>
          <Separator className="mb-4" />

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading courses...</div>
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No enrolled courses found
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} showViewButton={false} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}