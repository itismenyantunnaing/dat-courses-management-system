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
import { Holiday } from "@/types/holiday"

interface EditHolidayDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  holiday: Holiday | null
  onSuccess?: () => void
}

export function EditHolidayDrawer({
  open,
  onOpenChange,
  holiday,
  onSuccess,
}: EditHolidayDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<HolidayFormData>({
    name: "",
    date: "",
    description: "",
  })
  const [originalFormData, setOriginalFormData] = useState<HolidayFormData>({
    name: "",
    date: "",
    description: "",
  })

  // Check if form has changes
  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData)
  }

  // Load holiday data when drawer opens
  useEffect(() => {
    if (holiday && open) {
      const newFormData = {
        name: holiday.name || "",
        date: holiday.date || "",
        description: holiday.description || "",
      }
      setFormData(newFormData)
      setOriginalFormData(newFormData)
    }
  }, [holiday, open])

  const handleSubmit = async () => {
    if (!hasChanges()) return

    setIsSubmitting(true)

    try {
      // TODO: Replace with your actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Holiday updated:", { id: holiday?.id, ...formData })

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
            <HolidayForm data={formData} onChange={setFormData} isEdit />
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
                !formData.name ||
                !formData.date
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
