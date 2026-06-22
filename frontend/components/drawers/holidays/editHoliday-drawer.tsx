/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useState, useEffect } from "react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import {
  HolidayForm,
  HolidayFormData,
} from "@/components/drawers/holidays/holidayForm"
import { mainStore } from "@/store/mainStore"
import { Holiday } from "@/types/holiday"

interface EditHolidayDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  holiday: Holiday | null
  onSuccess?: () => void
}

const getDayName = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

export function EditHolidayDrawer({
  open,
  onOpenChange,
  holiday,
  onSuccess,
}: EditHolidayDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<HolidayFormData>({
    holidayName: "",
    holidayDate: ""
  })
  const [originalFormData, setOriginalFormData] = useState<HolidayFormData>({
    holidayName: "",
    holidayDate: ""
  })

  const { update_HolidayData } = mainStore()

  // Check if form has changes
  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData)
  }

  // Load holiday data when drawer opens
  useEffect(() => {
    if (holiday && open) {
      const newFormData = {
        holidayName: holiday.holidayName || "",
        holidayDate: holiday.holidayDate || "",
      }
      setFormData(newFormData)
      setOriginalFormData(newFormData)
    }
  }, [holiday, open])

  const handleSubmit = async () => {
    if (!hasChanges() || !holiday || holiday.id === undefined) return

    setIsSubmitting(true)

    try {
      const updatedHoliday: Holiday = {
        ...holiday,
        holidayName: formData.holidayName,
        holidayDate: formData.holidayDate,
      }

      const result = await update_HolidayData(holiday.id, updatedHoliday)
      if (result && (result.includes("not found") || result.includes("already exists") || result.includes("Failed"))) {
        alert(result)
        return
      } else {
        alert(result)
      }
      // Close drawer and trigger success
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to update holiday:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="right-0 left-auto h-full w-full max-w-2xl">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>Edit Holiday</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <HolidayForm
              data={formData}
              onChange={setFormData}
              isEdit
            />
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t">
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !hasChanges() ||
                !formData.holidayName ||
                !formData.holidayDate
              }
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
            <DrawerClose asChild>
              <Button
                variant="outline"
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}