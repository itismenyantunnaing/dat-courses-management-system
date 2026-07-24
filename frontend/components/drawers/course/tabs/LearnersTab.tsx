// components/course/tabs/LearnersTab.tsx
"use client"

import React from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, RefreshIcon } from "@hugeicons/core-free-icons"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface LearnersTabProps {
  enrollments: any[]
  userRole: string
  profile?: any
  enrollmentSearchTerm: string
  onSearchChange: (value: string) => void
  onOpenChangeGroup: () => void
}

const getInitials = (name: string) => {
  if (!name) return "??"
  const parts = name.split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const truncateText = (text: string, maxLength: number = 30) => {
  if (!text) return ""
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
}

export function LearnersTab({
  enrollments,
  userRole,
  profile,
  enrollmentSearchTerm,
  onSearchChange,
  onOpenChangeGroup,
}: LearnersTabProps) {
  const isApprover = userRole === "approver"

  let activeEnrollments = enrollments.filter(
    (e) => e.enrollmentStatus !== "CANCELLED"
  )

  if (isApprover && profile?.team) {
    activeEnrollments = activeEnrollments.filter(
      (employee) => employee.teamName === profile.team
    )
  }

  let filteredEnrollments = activeEnrollments.filter((employee) => {
    if (!enrollmentSearchTerm.trim()) return true
    const searchLower = enrollmentSearchTerm.toLowerCase()
    return (
      (employee.employeeName || "").toLowerCase().includes(searchLower) ||
      (employee.departmentName || "").toLowerCase().includes(searchLower) ||
      (employee.teamName || "").toLowerCase().includes(searchLower) ||
      (employee.courseGroupName || "").toLowerCase().includes(searchLower) ||
      (employee.employeeId || "").toLowerCase().includes(searchLower) ||
      (employee.email || "").toLowerCase().includes(searchLower)
    )
  })

  filteredEnrollments = filteredEnrollments.sort((a, b) => {
    const groupA = a.courseGroupName || ""
    const groupB = b.courseGroupName || ""
    if (groupA !== groupB) {
      return groupA.localeCompare(groupB)
    }
    return (a.employeeName || "").localeCompare(b.employeeName || "")
  })

  const groupColors = [
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-purple-100 text-purple-700 border-purple-200",
    "bg-pink-100 text-pink-700 border-pink-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-orange-100 text-orange-700 border-orange-200",
    "bg-cyan-100 text-cyan-700 border-cyan-200",
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-lime-100 text-lime-700 border-lime-200",
    "bg-emerald-100 text-emerald-700 border-emerald-200",
  ]

  return (
    <TabsContent value="learners" className="pt-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="flex items-center gap-2 text-lg font-semibold">
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  strokeWidth={1.5}
                  className="h-5 w-5"
                />
                Enrolled Learners
              </h4>
              <p className="text-sm text-muted-foreground">
                {isApprover && profile?.team
                  ? `Learners from your team enrolled in this course (${activeEnrollments.length} active)`
                  : `All learners enrolled in this course (${activeEnrollments.length} active)`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenChangeGroup}
                className="gap-2"
                disabled={activeEnrollments.length === 0}
              >
                <HugeiconsIcon
                  icon={RefreshIcon}
                  strokeWidth={2}
                  className="h-4 w-4"
                />
                Change Group
              </Button>
              <Input
                placeholder="Filter by name, dept, team, or group..."
                value={enrollmentSearchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-8 w-[250px] text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {filteredEnrollments.length === 0 ? (
            <div className="py-8 text-center">
              <HugeiconsIcon
                icon={UserGroupIcon}
                strokeWidth={1.5}
                className="mx-auto h-12 w-12 text-muted-foreground/50"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                {enrollmentSearchTerm
                  ? "No matching learners found"
                  : "No learners enrolled in this course yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-medium">Sr.</TableHead>
                    <TableHead className="text-xs font-medium">
                      Employee ID
                    </TableHead>
                    <TableHead className="text-xs font-medium">Name</TableHead>
                    <TableHead className="text-xs font-medium">Email</TableHead>
                    <TableHead className="text-xs font-medium">
                      Department
                    </TableHead>
                    <TableHead className="text-xs font-medium">Team</TableHead>
                    <TableHead className="text-xs font-medium">Group</TableHead>
                    <TableHead className="text-xs font-medium">
                      Enrolled At
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments.map((employee, index) => {
                    const groupIndex =
                      filteredEnrollments.filter(
                        (e) => e.courseGroupName === employee.courseGroupName
                      ).length > 0
                        ? filteredEnrollments.findIndex(
                            (e) =>
                              e.courseGroupName === employee.courseGroupName
                          ) % groupColors.length
                        : index % groupColors.length

                    return (
                      <TableRow
                        key={employee.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="text-center text-xs">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {employee.employeeId || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={employee.pfImage || ""} />
                              <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                                {getInitials(employee.employeeName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {employee.employeeName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {employee.email || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {employee.departmentName || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {employee.teamName || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "text-xs font-normal",
                              groupColors[groupIndex % groupColors.length]
                            )}
                          >
                            {employee.courseGroupName || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {employee.enrolledAt
                            ? format(new Date(employee.enrolledAt), "MMM d, yyyy")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}