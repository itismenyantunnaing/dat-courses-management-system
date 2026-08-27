// EmployeeForm.tsx - Updated with Dir Department and Position

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
import { PlusSignIcon, CalendarIcon } from "@hugeicons/core-free-icons"
import { useEffect, useState, useMemo } from "react"
import { mainStore } from "@/store/mainStore"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

export interface EmployeeFormData {
  div: string
  staff_id: string
  name: string
  doorlog: string
  dept_dat: string
  dept_dir: string
  position: string // Added position field
  team: string
  emp_status: string
  role: string
  email: string
  joinedDate?: string
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

// Helper component for truncated select items with tooltip
const TruncatedSelectItem = ({
  value,
  label,
  disabled = false,
}: {
  value: string
  label: string
  disabled?: boolean
}) => {
  return (
    <SelectItem value={value} disabled={disabled}>
      {label.length > 30 ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-[275px] truncate">{label}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">{label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span className="block max-w-[200px] truncate">{label}</span>
      )}
    </SelectItem>
  )
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
  const [isLoading, setIsLoading] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    data.joinedDate ? new Date(data.joinedDate) : undefined
  )

  const {
    employee_data,
    divisions,
    dat_departments,
    teams,
    roles,
    fetchAll_CourseData,
    courses,
    enrollments,
    departmentDirOptions,
    fetchDepartmentDirOptions,
    profile,
  } = mainStore()

  const userRole = profile.role.toLowerCase();
  const isAdmin = userRole === "admin"

  useEffect(() => {
    const loadData = async () => {
      await fetchAll_CourseData()
      await fetchDepartmentDirOptions()
    }
    loadData()
  }, [fetchAll_CourseData, fetchDepartmentDirOptions])

  // Filter departments based on selected division
  const filteredDepartments = useMemo(() => {
    if (!data.div) return dat_departments

    const selectedDivision = divisions.find(
      (div: any) => div.divisionName === data.div
    )

    if (!selectedDivision) return dat_departments

    return dat_departments.filter(
      (dept: any) => dept.divisionId === selectedDivision.id
    )
  }, [data.div])

  // Filter teams based on selected department
  const filteredTeams = useMemo(() => {
    if (!data.dept_dat) return teams

    const selectedDepartment = dat_departments.find(
      (dept: any) => dept.deptName === data.dept_dat
    )

    if (!selectedDepartment) return teams

    return teams.filter(
      (team: any) => team.departmentDatId === selectedDepartment.id
    )
  }, [data.dept_dat])

  const handleDivisionChange = (value: string) => {
    onChange({
      ...data,
      div: value,
      dept_dat: "",
      team: "",
    })
  }

  const handleDepartmentChange = (value: string) => {
    onChange({
      ...data,
      dept_dat: value,
      team: "",
    })
  }

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    })
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}`
      handleInputChange("joinedDate", formattedDate)
    } else {
      handleInputChange("joinedDate", "")
    }
    setDatePickerOpen(false)
  }

  const getDayOfWeek = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]
    return days[date.getDay()]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-muted-foreground">Loading...</p>
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
          <div className="min-w-0 space-y-2">
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
          <div className="min-w-0 space-y-2">
            <Label htmlFor="joinedDate">
              Joined Date
            </Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="joinedDate"
                  className="w-full justify-between font-normal"
                >
                  {selectedDate
                    ? format(selectedDate, "PPP")
                    : "Select joined date"}
                  <HugeiconsIcon icon={CalendarIcon} strokeWidth={2} />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  defaultMonth={selectedDate}
                  captionLayout="dropdown"
                  onSelect={handleDateSelect}
                />
              </PopoverContent>
            </Popover>
            {data.joinedDate && (
              <p className="mt-1 text-xs text-muted-foreground">
                Day: {getDayOfWeek(data.joinedDate)}
              </p>
            )}
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
              disabled={!isAdmin}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {divisions.map((option: any) => (
                    <TruncatedSelectItem
                      key={option.id}
                      value={option.divisionName}
                      label={option.divisionName}
                    />
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

          {/* Department (Dat Department) Select - Filtered by selected division */}
          <div className="min-w-0 space-y-2">
            <Label htmlFor="dept_dat">
              Dat Department <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.dept_dat}
              onValueChange={handleDepartmentChange}
              onOpenChange={onDropdownOpenChange}
              disabled={!isAdmin}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    data.div ? "Select department" : "Select division first"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectGroup>
                  <SelectLabel>Departments</SelectLabel>
                  {filteredDepartments.length === 0 ? (
                    <TruncatedSelectItem
                      value="no-departments"
                      label={
                        data.div
                          ? "No departments available for this division"
                          : "Please select a division first"
                      }
                      disabled
                    />
                  ) : (
                    filteredDepartments.map((option: any) => (
                      <TruncatedSelectItem
                        key={option.id}
                        value={option.deptName}
                        label={option.deptName}
                      />
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
              disabled={!isAdmin}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    data.dept_dat ? "Select team" : "Select department first"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectGroup>
                  <SelectLabel>Teams</SelectLabel>
                  {filteredTeams.length === 0 ? (
                    <TruncatedSelectItem
                      value="no-teams"
                      label={
                        data.dept_dat
                          ? "No teams available for this department"
                          : "Please select a department first"
                      }
                      disabled
                    />
                  ) : (
                    filteredTeams.map((option: any) => (
                      <TruncatedSelectItem
                        key={option.id}
                        value={option.teamName}
                        label={option.teamName}
                      />
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
              disabled={!isAdmin}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {roles.map((option: any) => (
                    <TruncatedSelectItem
                      key={option.id}
                      value={option.roleName}
                      label={option.roleName}
                    />
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

          {/* Dir Department and Position - Side by side */}
          <div className="col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Dir Department */}
              <div className="min-w-0 space-y-2">
                <Label htmlFor="dept_dir" className="text-muted-foreground">
                  Dir Department <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Select
                  value={data.dept_dir || ""}
                  onValueChange={(value) => handleInputChange("dept_dir", value)}
                  onOpenChange={onDropdownOpenChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select dir department" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectGroup>
                      <SelectLabel>Dir Departments</SelectLabel>
                      {departmentDirOptions && departmentDirOptions.length > 0 ? (
                        departmentDirOptions.map((dept: string) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))
                      ) : (
                        <TruncatedSelectItem
                          value="no-departments"
                          label="No dir departments available"
                          disabled
                        />
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Position */}
              <div className="min-w-0 space-y-2">
                <Label htmlFor="position" className="text-muted-foreground">
                  Position <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Input
                  id="position"
                  value={data.position || ""}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                  placeholder="Enter position"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}