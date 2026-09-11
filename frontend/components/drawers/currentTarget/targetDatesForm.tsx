// components/drawers/currentTarget/targetDatesForm.tsx

"use client"

import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { HugeiconsIcon } from "@hugeicons/react"
import { CalendarIcon } from "@hugeicons/core-free-icons"
import { format } from "date-fns"
import { useEffect } from "react"

export interface TargetDatesFormData {
  target1Date: string
  target2Date: string
  examDate: string
}

interface TargetDatesFormProps {
  data: TargetDatesFormData
  onChange: (data: TargetDatesFormData) => void
}

// Utility function to format date as YYYY-MM-DD in local timezone
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Utility function to get today's date in local timezone
const getTodayLocal = (): string => {
  const now = new Date()
  return formatLocalDate(now)
}

// Helper to parse YYYY-MM-DD string into a local Date object
const parseLocalDate = (value: string): Date | undefined => {
  if (!value) return undefined
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(value)) return undefined
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

// Shared trigger button styling (matches Button variant="outline")
const triggerClass =
  "inline-flex h-9 w-full items-center justify-start gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm font-normal shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export function TargetDatesForm({ data, onChange }: TargetDatesFormProps) {
  // Ensure dates are properly formatted when component mounts or data changes
  useEffect(() => {
    // If any date is invalid or in the wrong format, fix it
    const fixedData = { ...data }
    let hasChanges = false

    ;(["target1Date", "target2Date", "examDate"] as const).forEach((field) => {
      const value = data[field]
      if (value && !isValidDateString(value)) {
        // If the date string is invalid, clear it
        fixedData[field] = ""
        hasChanges = true
      }
    })

    if (hasChanges) {
      onChange(fixedData)
    }
  }, [data, onChange])

  const handleInputChange = (
    field: keyof TargetDatesFormData,
    value: string
  ) => {
    // Validate the date string format
    if (value && !isValidDateString(value)) {
      return // Don't update with invalid date
    }

    onChange({
      ...data,
      [field]: value,
    })
  }

  // Helper to validate date string format (YYYY-MM-DD)
  const isValidDateString = (dateString: string): boolean => {
    if (!dateString) return true // Empty is valid
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(dateString)) return false

    const [year, month, day] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    )
  }

  // Get minimum date (today) for validation
  const minDate = getTodayLocal()
  const minDateObj = parseLocalDate(minDate)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Target 1 Date */}
        <div className="space-y-2">
          <Label
            htmlFor="target1Date"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <HugeiconsIcon
              icon={CalendarIcon}
              strokeWidth={2}
              className="h-4 w-4 text-muted-foreground"
            />
            Target Date 1<span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger id="target1Date" className={triggerClass}>
              {data.target1Date ? (
                format(parseLocalDate(data.target1Date)!, "PPP")
              ) : (
                <span className="text-muted-foreground">Pick a date</span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseLocalDate(data.target1Date)}
                defaultMonth={parseLocalDate(data.target1Date) || minDateObj}
                disabled={{ before: minDateObj! }}
                onSelect={(date) => {
                  if (date) {
                    handleInputChange("target1Date", formatLocalDate(date))
                  } else {
                    handleInputChange("target1Date", "")
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-gray-500">
            First target date for Japanese proficiency
          </p>
        </div>

        {/* Target 2 Date */}
        <div className="space-y-2">
          <Label
            htmlFor="target2Date"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <HugeiconsIcon
              icon={CalendarIcon}
              strokeWidth={2}
              className="h-4 w-4 text-muted-foreground"
            />
            Target Date 2<span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger id="target2Date" className={triggerClass}>
              {data.target2Date ? (
                format(parseLocalDate(data.target2Date)!, "PPP")
              ) : (
                <span className="text-muted-foreground">Pick a date</span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseLocalDate(data.target2Date)}
                defaultMonth={parseLocalDate(data.target2Date) || minDateObj}
                disabled={{ before: minDateObj! }}
                onSelect={(date) => {
                  if (date) {
                    handleInputChange("target2Date", formatLocalDate(date))
                  } else {
                    handleInputChange("target2Date", "")
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-gray-500">
            Second target date for Japanese proficiency
          </p>
        </div>
      </div>

      {/* Exam Date */}
      <div className="space-y-2">
        <Label
          htmlFor="examDate"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <HugeiconsIcon
            icon={CalendarIcon}
            strokeWidth={2}
            className="h-4 w-4 text-muted-foreground"
          />
          Exam Date
        </Label>
        <Popover>
          <PopoverTrigger id="examDate" className={triggerClass}>
            {data.examDate ? (
              format(parseLocalDate(data.examDate)!, "PPP")
            ) : (
              <span className="text-muted-foreground">Pick a date</span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={parseLocalDate(data.examDate)}
              defaultMonth={parseLocalDate(data.examDate) || minDateObj}
              disabled={{ before: minDateObj! }}
              onSelect={(date) => {
                if (date) {
                  handleInputChange("examDate", formatLocalDate(date))
                } else {
                  handleInputChange("examDate", "")
                }
              }}
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-gray-500">
          Optional: Date for the JLPT exam
        </p>
      </div>
    </div>
  )
}
