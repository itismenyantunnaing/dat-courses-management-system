// components/drawers/currentTarget/currentTargetForm.tsx

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
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"
import { mainStore } from "@/store/mainStore"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Employee } from "@/types/employee"

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
}

// Options for dropdowns (only for select fields)
const JLPT_LEVELS = [
  { value: "N1", label: "N1" },
  { value: "N2", label: "N2" },
  { value: "N3", label: "N3" },
  { value: "N4", label: "N4" },
  { value: "N5", label: "N5" },
]

const EXAM_TYPES = [
  { value: "JLPT", label: "JLPT" },
  { value: "NAT_TEST", label: "NAT_TEST" },
  { value: "TOP_J", label: "TOP_J" },
  { value: "BJT", label: "BJT" },
]

const CONFIDENCE_LEVELS = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
]

export function CurrentTargetForm({
  data,
  onChange,
  isEdit = false,
  showEmployeeSelect = true,
  employeeOptions = [],
}: CurrentTargetFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("")
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false)
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
  }, [])

  // Generate employee options if not provided
  const employeeSelectOptions = employeeOptions.length > 0 
    ? employeeOptions 
    : employee_data?.map((emp: Employee) => ({
        value: emp.id,
        label: `${emp.id} - ${emp.name}`,
      })) || []

  // Filter employees based on search term
  const filteredEmployeeOptions = employeeSelectOptions.filter((option) =>
    option.label.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  )

  const handleInputChange = (field: keyof CurrentTargetFormData, value: any) => {
    onChange({
      ...data,
      [field]: value,
    })
  }

  //  Handle switch change - auto clear exam fields when set to false
  const handleWantToSitExamChange = (checked: boolean) => {
    onChange({
      ...data,
      wantToSitExam: checked,
      // ✅ Auto clear fields when unchecked
      examTargetLevel: checked ? data.examTargetLevel : "",
      confidenceLevel: checked ? data.confidenceLevel : "",
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
      {/* Employee Selection Section */}
      {showEmployeeSelect && (
        <>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Employee Selection</h3>
            <div className="grid gap-4 sm:grid-cols-1">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="employeeId">
                  Select Employee <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Select
                    value={data.employeeId}
                    onValueChange={(value) => {
                      handleInputChange("employeeId", value)
                      setIsEmployeeDropdownOpen(false)
                      setEmployeeSearchTerm("")
                    }}
                    onOpenChange={(open) => {
                      setIsEmployeeDropdownOpen(open)
                      if (!open) {
                        setEmployeeSearchTerm("")
                      }
                    }}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Search and select an employee..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {/* Search Input inside dropdown */}
                      <div className="sticky top-0 z-10 bg-popover p-2 border-b">
                        <div className="relative">
                          <HugeiconsIcon
                            icon={Search01Icon}
                            strokeWidth={2}
                            className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground"
                          />
                          <Input
                            placeholder="Search employees..."
                            value={employeeSearchTerm}
                            onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                            className="pl-9"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <SelectGroup>
                        <SelectLabel>Employees</SelectLabel>
                        {filteredEmployeeOptions.length === 0 ? (
                          <div className="py-2 px-2 text-sm text-muted-foreground text-center">
                            No employees found
                          </div>
                        ) : (
                          filteredEmployeeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Certified Level Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Certified Level</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="jlptNatTest">JLPT / NAT Test</Label>
            <Select
              value={data.jlptNatTest}
              onValueChange={(value) => handleInputChange("jlptNatTest", value)}
            >
              <SelectTrigger className="w-full">
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
            <Label htmlFor="jlptHighestLevel">JLPT Highest Level (Certified)</Label>
            <Select
              value={data.jlptHighestLevel}
              onValueChange={(value) => handleInputChange("jlptHighestLevel", value)}
            >
              <SelectTrigger className="w-full">
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
            <Label htmlFor="otherJapaneseLevel">Other Japanese Level (Certified)</Label>
            <Input
              id="otherJapaneseLevel"
              value={data.otherJapaneseLevel || ""}
              onChange={(e) => handleInputChange("otherJapaneseLevel", e.target.value)}
              placeholder="e.g., Business Japanese, etc."
              className="w-full"
            />
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="preferredLearningGroup">Preferred Learning Group</Label>
            <Input
              id="preferredLearningGroup"
              value={data.preferredLearningGroup || ""}
              onChange={(e) => handleInputChange("preferredLearningGroup", e.target.value)}
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
            <Label htmlFor="currentCommunicationLevel">Current Communication Level</Label>
            <Input
              id="currentCommunicationLevel"
              value={data.currentCommunicationLevel || ""}
              onChange={(e) => handleInputChange("currentCommunicationLevel", e.target.value)}
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
              value={data.target1JlptNatLevel}
              onValueChange={(value) => handleInputChange("target1JlptNatLevel", value)}
            >
              <SelectTrigger className="w-full">
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
            <Label htmlFor="target1CommunicationLevel">Communication Level</Label>
            <Input
              id="target1CommunicationLevel"
              value={data.target1CommunicationLevel || ""}
              onChange={(e) => handleInputChange("target1CommunicationLevel", e.target.value)}
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
              value={data.target2JlptNatLevel}
              onValueChange={(value) => handleInputChange("target2JlptNatLevel", value)}
            >
              <SelectTrigger className="w-full">
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
            <Label htmlFor="target2CommunicationLevel">Communication Level</Label>
            <Input
              id="target2CommunicationLevel"
              value={data.target2CommunicationLevel || ""}
              onChange={(e) => handleInputChange("target2CommunicationLevel", e.target.value)}
              placeholder="e.g., Fluent, Business Level, Conversational, Basic, None"
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Current Learning Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Current Learning Level and Method</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="currentLearningLevel">Japanese Level (Current Learning)</Label>
            <Select
              value={data.currentLearningLevel}
              onValueChange={(value) => handleInputChange("currentLearningLevel", value)}
            >
              <SelectTrigger className="w-full">
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
              onChange={(e) => handleInputChange("learningMethod", e.target.value)}
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
            <Label htmlFor="wantToSitExam">Want to sit JLPT exam on Jul 2026</Label>
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
              onValueChange={(value) => handleInputChange("examTargetLevel", value)}
              disabled={!data.wantToSitExam}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={data.wantToSitExam ? "Select target level" : "Disabled"} />
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
            <Label htmlFor="confidenceLevel">Confidence Level to Pass Exam</Label>
            <Select
              value={data.confidenceLevel || ""}
              onValueChange={(value) => handleInputChange("confidenceLevel", value)}
              disabled={!data.wantToSitExam}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={data.wantToSitExam ? "Select confidence level" : "Disabled"} />
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