"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { useEffect, useState, useMemo } from "react"
import { mainStore } from "@/store/mainStore"

export interface EmployeeFormData {
  div: string
  staff_id: string
  name: string
  doorlog: string
  dept_dat: string
  team: string
  emp_status: string
  role: string
  email: string
}

interface EmployeeFormProps {
  data: EmployeeFormData
  onChange: (data: EmployeeFormData) => void
  isEdit?: boolean
  onAddDivision?: () => void
  onAddDepartment?: () => void
  onAddTeam?: () => void
  onDropdownOpenChange?: (isOpen: boolean) => void
}

export function EmployeeForm({
  data,
  onChange,
  isEdit = false,
  onAddDivision,
  onAddDepartment,
  onAddTeam,
  onDropdownOpenChange,
}: EmployeeFormProps) {
  const [isLoading, setIsLoading] = useState(true)

  const {
    fetch_EmployeeData,
    fetch_roles,
    fetch_divisions,
    fetch_dat_departments,
    fetch_teams,
    divisions,
    dat_departments,
    teams,
    roles,
  } = mainStore()

  useEffect(() => {
    const loadOptions = async () => {
      setIsLoading(true)
      try {
        // Fetch all data in parallel for better performance
        await Promise.all([
          fetch_roles(),
          fetch_divisions(),
          fetch_dat_departments(),
          fetch_teams(),
          fetch_EmployeeData()
        ])
      } catch (error) {
        console.error("Failed to fetch employee options:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadOptions()
  }, [])

  // Filter departments based on selected division
  const filteredDepartments = useMemo(() => {
    if (!data.div) return dat_departments

    // Find the selected division
    const selectedDivision = divisions.find(
      (div: any) => div.divisionName === data.div
    )

    if (!selectedDivision) return dat_departments

    // Filter departments that belong to the selected division
    return dat_departments.filter(
      (dept: any) => dept.divisionId === selectedDivision.id
    )
  }, [data.div, dat_departments, divisions])

  // Filter teams based on selected department
  const filteredTeams = useMemo(() => {
    if (!data.dept_dat) return teams

    // Find the selected department
    const selectedDepartment = dat_departments.find(
      (dept: any) => dept.deptName === data.dept_dat
    )

    if (!selectedDepartment) return teams

    // Filter teams that belong to the selected department
    return teams.filter(
      (team: any) => team.departmentDatId === selectedDepartment.id
    )
  }, [data.dept_dat, teams, dat_departments])

  // Handle division change - reset department and team
  const handleDivisionChange = (value: string) => {
    onChange({
      ...data,
      div: value,
      dept_dat: "", // Reset department
      team: "", // Reset team
    })
  }

  // Handle department change - reset team
  const handleDepartmentChange = (value: string) => {
    onChange({
      ...data,
      dept_dat: value,
      team: "", // Reset team
    })
  }

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-muted-foreground">Loading form options...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Basic Information Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Basic Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="staff_id">
              Staff ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="staff_id"
              value={data.staff_id}
              onChange={(e) => handleInputChange("staff_id", e.target.value)}
              placeholder="Enter staff ID"
              required
              className="w-full"
              disabled={isEdit}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter full name"
              required
              className="w-full"
            />
          </div>
          <div className="min-w-0 space-y-2 sm:col-span-2">
            <Label htmlFor="email">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
              required
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Employment Information Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Employment Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Division Select */}
          <div className="min-w-0 space-y-2">
            <Label htmlFor="div">
              Division <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.div}
              onValueChange={handleDivisionChange}
              onOpenChange={onDropdownOpenChange}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {divisions.map((option: any) => (
                    <SelectItem key={option.id} value={option.divisionName}>
                      {option.divisionName}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm font-normal"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddDivision?.()
                    }}
                  >
                    <HugeiconsIcon
                      icon={PlusSignIcon}
                      strokeWidth={2}
                      className="mr-2 h-4 w-4"
                    />
                    Add New Division
                  </Button>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Department Select - Filtered by selected division */}
          <div className="min-w-0 space-y-2">
            <Label htmlFor="dept">
              Department <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.dept_dat}
              onValueChange={handleDepartmentChange}
              onOpenChange={onDropdownOpenChange}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={data.div ? "Select department" : "Select division first"} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectGroup>
                  <SelectLabel>Departments</SelectLabel>
                  {filteredDepartments.length === 0 ? (
                    <SelectItem value="no-departments" disabled>
                      {data.div ? "No departments available for this division" : "Please select a division first"}
                    </SelectItem>
                  ) : (
                    filteredDepartments.map((option: any) => (
                      <SelectItem key={option.id} value={option.deptName}>
                        {option.deptName}
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
                {data.div && (
                  <>
                    <SelectSeparator />
                    <SelectGroup>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm font-normal"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddDepartment?.()
                        }}
                      >
                        <HugeiconsIcon
                          icon={PlusSignIcon}
                          strokeWidth={2}
                          className="mr-2 h-4 w-4"
                        />
                        Add New Department
                      </Button>
                    </SelectGroup>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Team Select - Filtered by selected department */}
          <div className="min-w-0 space-y-2">
            <Label htmlFor="team">Team</Label>
            <Select
              value={data.team}
              onValueChange={(value) => handleInputChange("team", value)}
              onOpenChange={onDropdownOpenChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={data.dept_dat ? "Select team" : "Select department first"} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectGroup>
                  <SelectLabel>Teams</SelectLabel>
                  {filteredTeams.length === 0 ? (
                    <SelectItem value="no-teams" disabled>
                      {data.dept_dat ? "No teams available for this department" : "Please select a department first"}
                    </SelectItem>
                  ) : (
                    filteredTeams.map((option: any) => (
                      <SelectItem key={option.id} value={option.teamName}>
                        {option.teamName}
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
                {data.dept_dat && (
                  <>
                    <SelectSeparator />
                    <SelectGroup>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm font-normal"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddTeam?.()
                        }}
                      >
                        <HugeiconsIcon
                          icon={PlusSignIcon}
                          strokeWidth={2}
                          className="mr-2 h-4 w-4"
                        />
                        Add New Team
                      </Button>
                    </SelectGroup>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Role Select */}
          <div className="min-w-0 space-y-2">
            <Label htmlFor="role">
              Role <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.role}
              onValueChange={(value) => handleInputChange("role", value)}
              onOpenChange={onDropdownOpenChange}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {roles.map((option: any) => (
                    <SelectItem key={option.id} value={option.roleName}>
                      {option.roleName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Status Select */}
          <div className="min-w-0 space-y-2">
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.emp_status}
              onValueChange={(value) => handleInputChange("emp_status", value)}
              onOpenChange={onDropdownOpenChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Door Log Access */}
          <div className="min-w-0 space-y-2">
            <Label htmlFor="doorlog">
              Door Log Access <span className="text-red-500">*</span>
            </Label>
            <Input
              id="doorlog"
              value={data.doorlog}
              onChange={(e) => handleInputChange("doorlog", e.target.value)}
              placeholder="Enter door log access level"
              required
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}