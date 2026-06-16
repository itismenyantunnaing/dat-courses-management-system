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

interface CreateHolidayDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateHolidayDrawer({
  open,
  onOpenChange,
  onSuccess,
}: CreateHolidayDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<HolidayFormData>({
    name: "",
    date: "",
    description: "",
  })

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // TODO: Replace with your actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Holiday created:", formData)

      onOpenChange(false)
      onSuccess?.()

      // Reset form
      setFormData({
        name: "",
        date: "",
        description: "",
      })
    } catch (error) {
      console.error("Failed to create holiday:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="right-0 left-auto h-full w-full max-w-2xl">
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
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name || !formData.date}
            >
              {isSubmitting ? "Creating..." : "Create Holiday"}
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
