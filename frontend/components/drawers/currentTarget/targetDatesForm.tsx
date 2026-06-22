// components/drawers/currentTarget/targetDatesForm.tsx

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRef, useEffect } from "react"

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
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Utility function to get today's date in local timezone
const getTodayLocal = (): string => {
  const now = new Date()
  return formatLocalDate(now)
}

export function TargetDatesForm({
  data,
  onChange,
}: TargetDatesFormProps) {
  const target1Ref = useRef<HTMLInputElement>(null)
  const target2Ref = useRef<HTMLInputElement>(null)
  const examDateRef = useRef<HTMLInputElement>(null)

  // Ensure dates are properly formatted when component mounts or data changes
  useEffect(() => {
    // If any date is invalid or in the wrong format, fix it
    const fixedData = { ...data }
    let hasChanges = false

    ;(['target1Date', 'target2Date', 'examDate'] as const).forEach((field) => {
      const value = data[field]
      if (value && !isValidDateString(value)) {
        // If the date string is invalid, clear it
        fixedData[field] = ''
        hasChanges = true
      }
    })

    if (hasChanges) {
      onChange(fixedData)
    }
  }, [data, onChange])

  const handleInputChange = (field: keyof TargetDatesFormData, value: string) => {
    // Validate the date string format
    if (value && !isValidDateString(value)) {
      return // Don't update with invalid date
    }
    
    onChange({
      ...data,
      [field]: value,
    })
  }

  // Helper to open date picker
  const openDatePicker = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      if (ref.current.showPicker) {
        ref.current.showPicker()
      } else {
        ref.current.click()
        ref.current.focus()
      }
    }
  }

  // Helper to validate date string format (YYYY-MM-DD)
  const isValidDateString = (dateString: string): boolean => {
    if (!dateString) return true // Empty is valid
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(dateString)) return false
    
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day
  }

  // Get minimum date (today) for validation
  const minDate = getTodayLocal()

  return (
    <div className="space-y-6">
      {/* Target 1 Date */}
      <div className="space-y-2">
        <Label htmlFor="target1Date" className="text-sm font-medium">
          Target 1 Date <span className="text-red-500">*</span>
        </Label>
        <div 
          className="relative" 
          onClick={() => openDatePicker(target1Ref)}
          style={{ cursor: 'pointer' }}
        >
          <Input
            ref={target1Ref}
            id="target1Date"
            type="date"
            value={data.target1Date || ''}
            min={minDate}
            onChange={(e) => handleInputChange("target1Date", e.target.value)}
            required
            className="w-full cursor-pointer"
          />
        </div>
        <p className="text-xs text-gray-500">
          First target date for Japanese proficiency
        </p>
      </div>

      {/* Target 2 Date */}
      <div className="space-y-2">
        <Label htmlFor="target2Date" className="text-sm font-medium">
          Target 2 Date <span className="text-red-500">*</span>
        </Label>
        <div 
          className="relative" 
          onClick={() => openDatePicker(target2Ref)}
          style={{ cursor: 'pointer' }}
        >
          <Input
            ref={target2Ref}
            id="target2Date"
            type="date"
            value={data.target2Date || ''}
            min={minDate}
            onChange={(e) => handleInputChange("target2Date", e.target.value)}
            required
            className="w-full cursor-pointer"
          />
        </div>
        <p className="text-xs text-gray-500">
          Second target date for Japanese proficiency
        </p>
      </div>

      {/* Exam Date */}
      <div className="space-y-2">
        <Label htmlFor="examDate" className="text-sm font-medium">
          Exam Date
        </Label>
        <div 
          className="relative" 
          onClick={() => openDatePicker(examDateRef)}
          style={{ cursor: 'pointer' }}
        >
          <Input
            ref={examDateRef}
            id="examDate"
            type="date"
            value={data.examDate || ''}
            min={minDate}
            onChange={(e) => handleInputChange("examDate", e.target.value)}
            className="w-full cursor-pointer"
          />
        </div>
        <p className="text-xs text-gray-500">
          Optional: Date for the JLPT exam
        </p>
      </div>
    </div>
  )
}