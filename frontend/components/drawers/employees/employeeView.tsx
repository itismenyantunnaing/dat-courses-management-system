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
      <span className="w-32 shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
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
    <div className="group flex items-center justify-between rounded-md px-4 py-3 transition-colors hover:bg-muted/30">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
            {skill.skillName}
          </p>
        </div>
      </div>

      <div className="ml-4 flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Years */}
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                getYearColor(skill.yearsOfExperience || 0)
              )}
            >
              {skill.yearsOfExperience?.toFixed(1) || "0"}
            </span>
            <span className="text-xs text-muted-foreground">yrs</span>
          </div>

          {/* Separator */}
          <div className="h-5 w-px bg-border" />

          {/* Experience Level */}
          <Badge
            variant="outline"
            className="h-5 px-2 py-0 text-xs font-normal"
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
  const userRole = profile.role.toLowerCase()
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
        ? skill.subCategoryName || ""
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
      <div className="grid grid-cols-3 gap-2">
        {/* Profile Header */}
        <CardContent className="px-4">
          <div className="flex flex-col gap-2">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={resolveUploadUrl(employee.profile_photo_path) || ""}
                alt={employee.name}
              />
              <AvatarFallback className="text-lg text-primary">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 className="truncate text-xl font-semibold">
                {employee.name}
              </h2>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{employee.id}</p>
                  <Badge className={getStatusBadge(employee.emp_status)}>
                    {statusLabels[employee.emp_status] || employee.emp_status}
                  </Badge>
                </div>
              )}

              {/* <p className="text-sm text-muted-foreground">
                {employee.role || "-"}
              </p> */}
              <p className="truncate text-sm text-muted-foreground">
                {employee.email || "-"}
              </p>
            </div>
          </div>
        </CardContent>

        {/* Employment Information */}
        <CardContent className="col-span-2 px-0">
          {/* <div className="divide-y">
            <InfoRow label="Division" value={employee.div_name} />
            <InfoRow label="Department" value={employee.dept_dat} />
            <InfoRow label="Team" value={employee.team} />
            {isAdmin && (
              <InfoRow label="Door Log Access" value={employee.doorlog} />
            )}
            {isAdmin && (
              <InfoRow label="Joined Date" value={employee.joinedDate} />
            )}
            <InfoRow label="Service Year" value={employee.serviceYear} />
            <InfoRow
              label="Core Personnel"
              value={employee.is_core_personnel ? "Yes" : "No"}
            />
            <InfoRow
              label="Japan Business Trip"
              value={employee.has_japan_business_trip ? "Yes" : "No"}
            />
            {employee.dob && (
              <InfoRow label="Date of Birth" value={employee.dob} />
            )}
          </div> */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="block text-xs text-muted-foreground uppercase">
                Div
              </span>
              {employee.div_name || "-"}
            </div>
            <div className="col-span-2">
              <span className="block text-xs text-muted-foreground uppercase">
                Dept
              </span>
              {employee.dept_dat || "-"}
            </div>
            <div>
              <span className="block text-xs text-muted-foreground uppercase">
                Door Log
              </span>
              {employee.doorlog || "-"}
            </div>
            <div className="col-span-2">
              <span className="block text-xs text-muted-foreground uppercase">
                Team
              </span>
              {employee.team || "-"}
            </div>
            <div>
              <span className="block text-xs text-muted-foreground uppercase">
                Service year
              </span>
              {employee.serviceYear || "-"}
            </div>
            <div className="col-span-2">
              <span className="block text-xs text-muted-foreground uppercase">
                Joined Date
              </span>
              {employee.joinedDate || "-"}
            </div>
          </div>
        </CardContent>
      </div>

      {/* Skills Section */}
      <CardContent className="pt-6 px-0">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Skills
          </h3>
          <Badge variant="secondary" className="text-xs">
            {isLoadingSkills ? "Loading..." : `${employeeSkills.length} skill${employeeSkills.length > 1 ? "s" : ""}`}
          </Badge>
        </div>
        <Separator className="mb-4" />

        {isLoadingSkills ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">
              Loading skills...
            </div>
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
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex-1 border-t border-border" />
                    {displayName ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isOtherCategory
                              ? "text-muted-foreground"
                              : "text-foreground"
                          )}
                        >
                          {displayName}
                        </span>
                      </div>
                    ) : (
                      // No label - show just a small dot
                      <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                    )}
                    <div className="flex-1 border-t border-border" />
                  </div>

                  {/* Skills list */}
                  <div
                    className={cn(
                      "overflow-hidden rounded-md border",
                      (isOtherCategory || !displayName) &&
                        "border-dashed border-muted-foreground/20"
                    )}
                  >
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

      {/* Enrolled Courses Section */}
      <CardContent className="pt-6 px-0">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Enrolled Courses
          </h3>
          <Badge variant="secondary" className="text-xs">
            {isLoading ? "Loading..." : `${enrolledCourses.length} courses`}
          </Badge>
        </div>
        <Separator className="mb-4" />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">
              Loading courses...
            </div>
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No enrolled courses found
          </div>
        ) : (
          <div className="space-y-3 grid grid-cols-2 gap-2">
            {enrolledCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                showViewButton={false}
              />
            ))}
          </div>
        )}
      </CardContent>
    </div>
  )
}
