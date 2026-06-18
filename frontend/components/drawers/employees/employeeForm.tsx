// components/forms/EmployeeForm.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { mainStore } from "@/store/mainStore"

export interface EmployeeFormData {
  div: string
  staff_id: string
  name: string
  doorlog: string
  dept: string
  team: string
  status: string
  role: string
  email: string
  phone?: string
  join_date?: string
  address?: string
}

interface EmployeeFormProps {
  data: EmployeeFormData
  onChange: (data: EmployeeFormData) => void
  isEdit?: boolean
}

export function EmployeeForm({
  data,
  onChange,
  isEdit = false,
}: EmployeeFormProps) {
  const [joinDateOpen, setJoinDateOpen] = useState(false)
  const [joinDate, setJoinDate] = useState<Date | undefined>(
    data.join_date ? new Date(data.join_date) : undefined
  )

  const {
    division_options,
    department_options,
    team_options,
    role_options,
    fetch_EmployeeData,
  } = mainStore()

  // Fetch data to populate options when form mounts
  useEffect(() => {
    if (!division_options.length || !department_options.length) {
      fetch_EmployeeData()
    }
  }, [division_options.length, department_options.length, fetch_EmployeeData])

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    })
  }

  const handleDateSelect = (date: Date | undefined) => {
    setJoinDate(date)
    if (date) {
      const formattedDate = date.toISOString().split("T")[0]
      handleInputChange("join_date", formattedDate)
    } else {
      handleInputChange("join_date", "")
    }
    setJoinDateOpen(false)
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
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={data.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter phone number"
              className="w-full"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="join_date">Join Date</Label>
            <Popover open={joinDateOpen} onOpenChange={setJoinDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="join_date"
                  className="w-full justify-between font-normal"
                >
                  {joinDate ? joinDate.toLocaleDateString() : "Select date"}
                  <HugeiconsIcon icon={CalendarIcon} strokeWidth={2} />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={joinDate}
                  defaultMonth={joinDate}
                  captionLayout="dropdown"
                  onSelect={handleDateSelect}
                />
              </PopoverContent>
            </Popover>
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
              </SelectContent>
            </Select>
          </div>

          {/* Department Scrollable Select */}
          <div className="min-w-0 space-y-2">
            <Label htmlFor="dept">
              Department <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.dept}
              onValueChange={(value) => handleInputChange("dept", value)}
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
              </SelectContent>
            </Select>
          </div>

          {/* Team Scrollable Select */}
          <div className="min-w-0 space-y-2">
            <Label htmlFor="team">Team</Label>
            <Select
              value={data.team}
              onValueChange={(value) => handleInputChange("team", value)}
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
              value={data.status}
              onValueChange={(value) => handleInputChange("status", value)}
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

      {/* <Separator /> */}

      {/* Additional Information Section */}
      {/* <div>
        <h3 className="mb-4 text-lg font-semibold">Additional Information</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={data.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter full address"
              rows={3}
              className="w-full resize-y"
            />
          </div>
        </div>
      </div> */}
    </div>
  )
}
