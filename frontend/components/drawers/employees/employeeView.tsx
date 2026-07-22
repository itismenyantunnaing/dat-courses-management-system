"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Employee } from "@/types/employee"

interface EmployeeViewProps {
  employee: Employee | null
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

export function EmployeeView({ employee }: EmployeeViewProps) {
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
                src={employee.profile_photo_path || ""}
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
            <InfoRow label="Staff ID" value={employee.id} />
            <InfoRow label="Division" value={employee.div_name} />
            <InfoRow label="Department" value={employee.dept_dat} />
            <InfoRow label="Team" value={employee.team} />
            <InfoRow label="Role" value={employee.role} />
            <InfoRow label="Door Log Access" value={employee.doorlog} />
            <InfoRow label="Core Personnel" value={employee.is_core_personnel ? "Yes" : "No"} />
            <InfoRow label="Japan Business Trip" value={employee.has_japan_business_trip ? "Yes" : "No"} />
            {employee.dob && <InfoRow label="Date of Birth" value={employee.dob} />}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}