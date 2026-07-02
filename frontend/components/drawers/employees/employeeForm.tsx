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
import { useEffect, useState } from "react"
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
    division_options,
    department_options,
    team_options,
    role_options,
    fetch_EmployeeData,
  } = mainStore()

  // Fetch data to populate options when form mounts
  useEffect(() => {
    const loadOptions = async () => {
      setIsLoading(true)
      try {
        // Only fetch if options are empty
        if (!division_options.length || !department_options.length) {
          await fetch_EmployeeData()
        }
      } catch (error) {
        console.error("Failed to fetch employee options:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadOptions()
  }, [])

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
              onValueChange={(value) => handleInputChange("div", value)}
              onOpenChange={onDropdownOpenChange}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {division_options.map(
                    (option: { value: string; label: string }) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    )
                  )}
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

          {/* Department Scrollable Select */}
          <div className="min-w-0 space-y-2">
            <Label htmlFor="dept">
              Department <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.dept_dat}
              onValueChange={(value) => handleInputChange("dept_dat", value)}
              onOpenChange={onDropdownOpenChange}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectGroup>
                  <SelectLabel>Departments</SelectLabel>
                  {department_options.map(
                    (option: { value: string; label: string }) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    )
                  )}
                </SelectGroup>
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
              </SelectContent>
            </Select>
          </div>

          {/* Team Scrollable Select */}
          <div className="min-w-0 space-y-2">
            <Label htmlFor="team">Team</Label>
            <Select
              value={data.team}
              onValueChange={(value) => handleInputChange("team", value)}
              onOpenChange={onDropdownOpenChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectGroup>
                  <SelectLabel>Teams</SelectLabel>
                  {team_options.map(
                    (option: { value: string; label: string }) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    )
                  )}
                </SelectGroup>
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
                  {role_options.map(
                    (option: { value: string; label: string }) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    )
                  )}
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
