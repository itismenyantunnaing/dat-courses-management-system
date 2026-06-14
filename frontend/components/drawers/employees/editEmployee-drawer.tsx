// components/drawers/employees/EditEmployeeDrawer.tsx
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
import { EmployeeForm, EmployeeFormData } from "@/components/drawers/employees/employeeForm"

interface EditEmployeeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  onSuccess?: () => void
}

export function EditEmployeeDrawer({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EditEmployeeDrawerProps) {
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
  const [originalFormData, setOriginalFormData] = useState<EmployeeFormData>({
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

  // Check if form has changes
  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData)
  }

  // Load employee data when drawer opens
  useEffect(() => {
    if (employee && open) {
      const newFormData = {
        div: employee.div || "",
        staff_id: employee.staff_id || "",
        name: employee.name || "",
        doorlog: employee.doorlog || "",
        dept: employee.dept || "",
        team: employee.team || "",
        status: employee.status || "active",
        role: employee.role || "",
        email: employee.email || "",
        phone: employee.phone || "",
        join_date: employee.join_date || "",
        address: employee.address || "",
      }
      setFormData(newFormData)
      setOriginalFormData(newFormData)
    }
  }, [employee, open])

  const handleSubmit = async () => {
    if (!hasChanges()) return

    setIsSubmitting(true)

    try {
      // TODO: Replace with your actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Employee updated:", { id: employee?.id, ...formData })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to update employee:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="right-0 left-auto h-full w-full max-w-2xl">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>Edit Employee</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <EmployeeForm data={formData} onChange={setFormData} isEdit />
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t">
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || !hasChanges()}
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
