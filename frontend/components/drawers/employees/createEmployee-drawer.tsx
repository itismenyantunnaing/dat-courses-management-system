// components/drawers/employees/CreateEmployeeDrawer.tsx
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
  EmployeeForm,
  EmployeeFormData,
} from "@/components/drawers/employees/employeeForm"

interface CreateEmployeeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateEmployeeDrawer({
  open,
  onOpenChange,
  onSuccess,
}: CreateEmployeeDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<EmployeeFormData>({
    div: "",
    staff_id: "",
    name: "",
    doorlog: "",
    dept: "",
    team: "",
    status: "active",
    role: "",
    email: "",
    phone: "",
    join_date: "",
    address: "",
  })

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // TODO: Replace with your actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Employee created:", formData)

      onOpenChange(false)
      onSuccess?.()

      // Reset form
      setFormData({
        div: "",
        staff_id: "",
        name: "",
        doorlog: "",
        dept: "",
        team: "",
        status: "active",
        role: "",
        email: "",
        phone: "",
        join_date: "",
        address: "",
      })
    } catch (error) {
      console.error("Failed to create employee:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="right-0 left-auto h-full w-full max-w-2xl">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>Add New Employee</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <EmployeeForm data={formData} onChange={setFormData} />
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t">
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Employee"}
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
