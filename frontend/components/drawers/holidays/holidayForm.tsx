// components/drawers/holidays/holidayForm.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { useState } from "react"

export interface HolidayFormData {
  name: string
  date: string
  description?: string
}

interface HolidayFormProps {
  data: HolidayFormData
  onChange: (data: HolidayFormData) => void
  isEdit?: boolean
}

export function HolidayForm({
  data,
  onChange,
  isEdit = false,
}: HolidayFormProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    data.date ? new Date(data.date) : undefined
  )

  const handleInputChange = (field: keyof HolidayFormData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    })
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const formattedDate = date.toISOString().split("T")[0]
      handleInputChange("date", formattedDate)
    } else {
      handleInputChange("date", "")
    }
    setDatePickerOpen(false)
  }

  // Get day of week for display
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

  return (
    <div className="space-y-6">
      {/* Basic Information Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Basic Information</h3>
        <div className="flex gap-3">
          <div className="flex-1 space-y-4">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="name">
                Holiday Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter holiday name"
                required
                className="w-full"
              />
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className="w-full justify-between font-normal"
                  >
                    {selectedDate
                      ? selectedDate.toLocaleDateString()
                      : "Select date"}
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
              {data.date && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Day: {getDayOfWeek(data.date)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Additional Information Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Additional Information</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter holiday description (optional)"
              rows={3}
              className="w-full resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
