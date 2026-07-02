"use client"

import { useState } from "react"
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

interface CreateHolidayDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const getDayName = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { weekday: "long" })
}

export function CreateHolidayDrawer({
  open,
  onOpenChange,
  onSuccess,
}: CreateHolidayDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<HolidayFormData>({
    holidayName: "",
    holidayDate: "",
  })

  const { holiday_data, add_HolidayData } = mainStore()

  const handleSubmit = async () => {
    if (!formData.holidayName || !formData.holidayDate) return

    setIsSubmitting(true)

    try {
      // Create new holiday
      const newHoliday: Holiday = {
        holidayName: formData.holidayName,
        holidayDate: formData.holidayDate,
      }

      const result = await add_HolidayData(newHoliday)

      if (
        result &&
        (result.includes("already exists") || result.includes("Failed"))
      ) {
        alert(result)
        return
      } else {
        alert(result)
      }

      // Reset for

      // Close drawer and trigger success
      onOpenChange(false)
      onSuccess?.()

      // Reset form
      setFormData({
        holidayName: "",
        holidayDate: "",
      })
    } catch (error) {
      console.error("Failed to create holiday:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="right-0 left-auto h-full w-[75%] sm:w-[60%] md:w-[50%] lg:w-[40%] xl:w-[30%]">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>Add New Holiday</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <HolidayForm data={formData} onChange={setFormData} />
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t">
          <div className="flex gap-2">
            <DrawerClose asChild>
              <Button
                variant="outline"
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </DrawerClose>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={
                isSubmitting || !formData.holidayName || !formData.holidayDate
              }
            >
              {isSubmitting ? "Creating..." : "Create Holiday"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
