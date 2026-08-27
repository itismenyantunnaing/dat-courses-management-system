// components/drawers/currentTarget/currentTargetForm.tsx

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"
import { mainStore } from "@/store/mainStore"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Employee } from "@/types/employee"
import { UserIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  PlusSignIcon,
  CancelIcon,
  Building04Icon,
  BriefcaseIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { resolveUploadUrl } from "@/lib/utils"

export interface CurrentTargetFormData {
  // Employee selection
  employeeId: string
  employeeName?: string

  // Certified Levels
  jlptNatTest: string
  jlptHighestLevel: string
  otherJapaneseLevel: string
  preferredLearningGroup: string

  // Current Level
  currentCommunicationLevel: string

  // Target 1 Levels
  target1JlptNatLevel: string
  target1CommunicationLevel: string

  // Target 2 Levels
  target2JlptNatLevel: string
  target2CommunicationLevel: string

  // Current Learning
  currentLearningLevel: string
  learningMethod: string

  // JLPT Exam Target
  wantToSitExam: boolean
  examTargetLevel: string
  confidenceLevel: string
}

interface CurrentTargetFormProps {
  data: CurrentTargetFormData
  onChange: (data: CurrentTargetFormData) => void
  isEdit?: boolean
  showEmployeeSelect?: boolean
  employeeOptions?: { value: string; label: string }[]
  onDropdownOpenChange?: (isOpen: boolean) => void
}

// Options for dropdowns with empty option
const JLPT_LEVELS = [
  { value: "None", label: "None" },
  { value: "N1", label: "N1" },
  { value: "N2", label: "N2" },
  { value: "N3", label: "N3" },
  { value: "N4", label: "N4" },
  { value: "N5", label: "N5" },
]

const EXAM_TYPES = [
  { value: "", label: "None" },
  { value: "JLPT", label: "JLPT" },
  { value: "NAT_TEST", label: "NAT_TEST" },
  { value: "TOP_J", label: "TOP_J" },
  { value: "BJT", label: "BJT" },
]

const CONFIDENCE_LEVELS = [
  { value: "None", label: "None" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
]

// Helper function to get avatar URL or fallback
const getEmployeeAvatar = (employee: Employee | null) => {
  if (!employee) return null
  if (employee.profile_photo_path && employee.profile_photo_path !== "") {
    return resolveUploadUrl(employee.profile_photo_path)
  }
  return null
}

// Helper function to get initials from employee name
const getEmployeeInitials = (employee: Employee | null) => {
  if (!employee || !employee.name) return "U"
  return employee.name.charAt(0).toUpperCase()
}

export function CurrentTargetForm({
  data,
  onChange,
  isEdit = false,
  showEmployeeSelect = true,
  employeeOptions = [],
  onDropdownOpenChange,
}: CurrentTargetFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { employee_data, fetch_EmployeeData } = mainStore()

  // Fetch employees for the select dropdown
  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoading(true)
      try {
        if (!employee_data || employee_data.length === 0) {
          await fetch_EmployeeData()
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadEmployees()
  }, [fetch_EmployeeData, employee_data])

  // Get employee options - Always use employee_data for full employee objects
  const employeeSelectOptions = employee_data?.map((emp: Employee) => ({
    value: emp.id,
    label: `${emp.id} - ${emp.name}`,
    employee: emp, // This contains all employee fields including dept_dat and team
  })) || []

  // If employeeOptions is provided from parent, use it but also try to find full employee data
  const getFullEmployeeOption = (option: { value: string; label: string }) => {
    // Try to find the full employee data from employee_data
    const fullEmployee = employee_data?.find((emp: Employee) => emp.id === option.value)
    if (fullEmployee) {
      return {
        ...option,
        employee: fullEmployee
      }
    }
    // If not found, create a minimal employee object with just the ID and name
    return {
      ...option,
      employee: {
        id: option.value,
        name: option.label.split('-')[1]?.trim() || option.label,
        dept_dat: '',
        team: '',
        div_name: '',
        profile_photo_path: ''
      } as Employee
    }
  }

  // Use provided employeeOptions if available, otherwise use employee_data
  const options = employeeOptions.length > 0 
    ? employeeOptions.map(getFullEmployeeOption)
    : employeeSelectOptions

  // Get selected employee details
  const selectedEmployee = employee_data?.find(
    (emp: Employee) => emp.id === data.employeeId
  )

  // Filter employees based on search
  const filteredEmployees = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleInputChange = (
    field: keyof CurrentTargetFormData,
    value: any
  ) => {
    onChange({
      ...data,
      [field]: value,
    })
  }

  // Handle switch change - auto clear exam fields when set to false
  const handleWantToSitExamChange = (checked: boolean) => {
    onChange({
      ...data,
      wantToSitExam: checked,
      examTargetLevel: checked ? data.examTargetLevel : "",
      confidenceLevel: checked ? data.confidenceLevel : "",
    })
  }

  const handleSelectEmployee = (employee: any) => {
    const employeeId = employee.value || employee.id
    const employeeName = employee.label || employee.name
    onChange({
      ...data,
      employeeId: employeeId,
      employeeName: employeeName,
    })
    setSearchOpen(false)
    setSearchQuery("")
  }

  const handleRemoveEmployee = () => {
    onChange({
      ...data,
      employeeId: "",
      employeeName: "",
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
      {/* Employee Info Header - Show when editing */}
      {isEdit && selectedEmployee && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 rounded-full">
              <AvatarImage 
                src={getEmployeeAvatar(selectedEmployee) || undefined} 
                alt={selectedEmployee.name}
              />
              <AvatarFallback className="rounded-full bg-primary/10 text-primary">
                {getEmployeeInitials(selectedEmployee)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{selectedEmployee.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                ID: {selectedEmployee.id}
              </p>
              {/* Department and Team info */}
              <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mt-0.5">
                {selectedEmployee.dept_dat && (
                  <>
                    <span className="truncate">Dept: {selectedEmployee.dept_dat}</span>
                  </>
                )}
                {selectedEmployee.team && (
                  <>
                    <span className="mx-0.5">•</span>
                    <span className="truncate">Team: {selectedEmployee.team}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Selection Section */}
      {showEmployeeSelect && (
        <>
          <div>
            <div className="grid gap-4 sm:grid-cols-1">
              <div className="min-w-0 space-y-2">
                <Label>
                  Select Employee <span className="text-red-500">*</span>
                </Label>
                
                {data.employeeId && selectedEmployee ? (
                  // Show selected employee as badge with details
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="flex max-w-[600px] items-center gap-2 px-3 py-5 text-sm font-normal"
                    >
                      <Avatar className="h-7 w-7 rounded-full">
                        <AvatarImage 
                          src={getEmployeeAvatar(selectedEmployee) || undefined} 
                          alt={selectedEmployee.name}
                        />
                        <AvatarFallback className="rounded-full bg-primary/10 text-xs text-primary">
                          {getEmployeeInitials(selectedEmployee)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-medium">
                            {selectedEmployee.name}
                          </span>
                        </div>
                        
                      </div>
                      <button
                        onClick={handleRemoveEmployee}
                        className="flex-shrink-0 rounded-full p-0.5 transition-colors hover:bg-muted"
                      >
                        <HugeiconsIcon
                          icon={CancelIcon}
                          strokeWidth={2}
                          className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                        />
                      </button>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchOpen(true)}
                      className="text-xs flex-shrink-0"
                    >
                      <HugeiconsIcon
                        icon={PlusSignIcon}
                        strokeWidth={2}
                        className="mr-1 h-3 w-3"
                      />
                      Change
                    </Button>
                  </div>
                ) : data.employeeId ? (
                  // Fallback when employee not found in employee_data
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="px-3 py-2">
                      <span className="text-xs">ID: {data.employeeId}</span>
                      <button
                        onClick={handleRemoveEmployee}
                        className="ml-2 flex-shrink-0 rounded-full p-0.5 transition-colors hover:bg-muted"
                      >
                        <HugeiconsIcon
                          icon={CancelIcon}
                          strokeWidth={2}
                          className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                        />
                      </button>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchOpen(true)}
                      className="text-xs flex-shrink-0"
                    >
                      <HugeiconsIcon
                        icon={PlusSignIcon}
                        strokeWidth={2}
                        className="mr-1 h-3 w-3"
                      />
                      Change
                    </Button>
                  </div>
                ) : (
                  // Show select button
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => setSearchOpen(true)}
                  >
                    <HugeiconsIcon
                      icon={Search01Icon}
                      strokeWidth={2}
                      className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0"
                    />
                    <span className="truncate">Search and select an employee...</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Employee Search Command Dialog */}
      <CommandDialog
        open={searchOpen}
        onOpenChange={(newOpen) => {
          setSearchOpen(newOpen)
          if (!newOpen) {
            setSearchQuery("")
          }
        }}
      >
        <Command>
          <div className="border-b px-3 py-2">
            <CommandInput
              placeholder="Search employees..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>

          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty>No employees found.</CommandEmpty>

            <CommandGroup>
              {filteredEmployees.map((option) => {
                const isSelected = data.employeeId === option.value
                const employee = option.employee
                const avatarUrl = getEmployeeAvatar(employee)
                const initials = getEmployeeInitials(employee)
                
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelectEmployee(option)}
                    className="group flex cursor-pointer items-center gap-3 px-3 py-2"
                  >
                    <Avatar className="h-8 w-8 rounded-full">
                      <AvatarImage 
                        src={avatarUrl || undefined} 
                        alt={employee?.name || option.label}
                      />
                      <AvatarFallback className="rounded-full bg-primary/10 text-xs text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {employee.name}
                        </span>
                        {isSelected && (
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">
                            Selected
                          </Badge>
                        )}
                      </div>
                      {employee && (
                        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                          {employee.dept_dat && (
                            <>
                              <span className="truncate max-w-[120px]">Dept: {employee.dept_dat}</span>
                            </>
                          )}
                          {employee.team && (
                            <>
                              <span className="mx-0.5">•</span>
                              <span className="truncate max-w-[120px]">Team: {employee.team}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      {/* Certified Level Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Certified Level</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="jlptNatTest">JLPT / NAT Test</Label>
            <Select
              value={data.jlptNatTest || ""}
              onValueChange={(value) => handleInputChange("jlptNatTest", value)}
              onOpenChange={onDropdownOpenChange}
            >
              <SelectTrigger className="w-full" data-dropdown-trigger>
                <SelectValue placeholder="Select exam type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {EXAM_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="jlptHighestLevel">
              JLPT Highest Level (Certified)
            </Label>
            <Select
              value={data.jlptHighestLevel || ""}
              onValueChange={(value) =>
                handleInputChange("jlptHighestLevel", value)
              }
              onOpenChange={onDropdownOpenChange}
            >
              <SelectTrigger className="w-full" data-dropdown-trigger>
                <SelectValue placeholder="Select JLPT level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {JLPT_LEVELS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="otherJapaneseLevel">
              Other Japanese Level (Certified)
            </Label>
            <Select
              value={data.otherJapaneseLevel || ""}
              onValueChange={(value) =>
                handleInputChange("otherJapaneseLevel", value)
              }
              onOpenChange={onDropdownOpenChange}
            >
              <SelectTrigger className="w-full" data-dropdown-trigger>
                <SelectValue placeholder="Select JLPT level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {JLPT_LEVELS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="preferredLearningGroup">
              Preferred Learning Group
            </Label>
            <Input
              id="preferredLearningGroup"
              value={data.preferredLearningGroup || ""}
              onChange={(e) =>
                handleInputChange("preferredLearningGroup", e.target.value)
              }
              placeholder="e.g., Morning Group, Evening Group, etc."
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Current Level Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Current Level</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2 sm:col-span-2">
            <Label htmlFor="currentCommunicationLevel">
              Current Communication Level
            </Label>
            <Input
              id="currentCommunicationLevel"
              value={data.currentCommunicationLevel || ""}
              onChange={(e) =>
                handleInputChange("currentCommunicationLevel", e.target.value)
              }
              placeholder="e.g., Fluent, Business Level, Conversational, Basic, None"
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Target 1 Levels Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Target 1 Levels</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="target1JlptNatLevel">JLPT / NAT Test Level</Label>
            <Select
              value={data.target1JlptNatLevel || ""}
              onValueChange={(value) =>
                handleInputChange("target1JlptNatLevel", value)
              }
              onOpenChange={onDropdownOpenChange}
            >
              <SelectTrigger className="w-full" data-dropdown-trigger>
                <SelectValue placeholder="Select target JLPT level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {JLPT_LEVELS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="target1CommunicationLevel">
              Communication Level
            </Label>
            <Input
              id="target1CommunicationLevel"
              value={data.target1CommunicationLevel || ""}
              onChange={(e) =>
                handleInputChange("target1CommunicationLevel", e.target.value)
              }
              placeholder="e.g., Fluent, Business Level, Conversational, Basic, None"
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Target 2 Levels Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Target 2 Levels</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="target2JlptNatLevel">JLPT / NAT Test Level</Label>
            <Select
              value={data.target2JlptNatLevel || ""}
              onValueChange={(value) =>
                handleInputChange("target2JlptNatLevel", value)
              }
              onOpenChange={onDropdownOpenChange}
            >
              <SelectTrigger className="w-full" data-dropdown-trigger>
                <SelectValue placeholder="Select target JLPT level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {JLPT_LEVELS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="target2CommunicationLevel">
              Communication Level
            </Label>
            <Input
              id="target2CommunicationLevel"
              value={data.target2CommunicationLevel || ""}
              onChange={(e) =>
                handleInputChange("target2CommunicationLevel", e.target.value)
              }
              placeholder="e.g., Fluent, Business Level, Conversational, Basic, None"
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Current Learning Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          Current Learning Level and Method
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="currentLearningLevel">
              Japanese Level (Current Learning)
            </Label>
            <Select
              value={data.currentLearningLevel || ""}
              onValueChange={(value) =>
                handleInputChange("currentLearningLevel", value)
              }
              onOpenChange={onDropdownOpenChange}
            >
              <SelectTrigger className="w-full" data-dropdown-trigger>
                <SelectValue placeholder="Select current learning level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {JLPT_LEVELS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="learningMethod">Learning Method</Label>
            <Input
              id="learningMethod"
              value={data.learningMethod || ""}
              onChange={(e) =>
                handleInputChange("learningMethod", e.target.value)
              }
              placeholder="e.g., Self-study, Group Class, Private Tutor, Online Course, etc."
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* JLPT Exam Target Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">JLPT Exam Target</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="wantToSitExam">
              Want to sit JLPT exam on Jul 2026
            </Label>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="wantToSitExam"
                checked={data.wantToSitExam}
                onCheckedChange={handleWantToSitExamChange}
              />
              <Label htmlFor="wantToSitExam" className="cursor-pointer">
                {data.wantToSitExam ? "Yes" : "No"}
              </Label>
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="examTargetLevel">If Yes, Which Level?</Label>
            <Select
              value={data.examTargetLevel || ""}
              onValueChange={(value) =>
                handleInputChange("examTargetLevel", value)
              }
              onOpenChange={onDropdownOpenChange}
              disabled={!data.wantToSitExam}
            >
              <SelectTrigger className="w-full" data-dropdown-trigger>
                <SelectValue
                  placeholder={
                    data.wantToSitExam ? "Select target level" : "Disabled"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {JLPT_LEVELS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-2 sm:col-span-2">
            <Label htmlFor="confidenceLevel">
              Confidence Level to Pass Exam
            </Label>
            <Select
              value={data.confidenceLevel || ""}
              onValueChange={(value) =>
                handleInputChange("confidenceLevel", value)
              }
              onOpenChange={onDropdownOpenChange}
              disabled={!data.wantToSitExam}
            >
              <SelectTrigger className="w-full" data-dropdown-trigger>
                <SelectValue
                  placeholder={
                    data.wantToSitExam ? "Select confidence level" : "Disabled"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CONFIDENCE_LEVELS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}