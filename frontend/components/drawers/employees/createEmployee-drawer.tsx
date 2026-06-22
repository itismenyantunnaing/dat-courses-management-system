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
import { mainStore } from "@/store/mainStore"
import { Employee } from "@/types/employee"

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
  const { add_EmployeeData } = mainStore()

  const [formData, setFormData] = useState<EmployeeFormData>({
    div: "",
    staff_id: "",
    name: "",
    doorlog: "",
    dept_dat: "",
    team: "",
    emp_status: "active",
    role: "",
    email: "",
  })

  // Check if all required fields are filled
  const isFormValid =
    formData.staff_id.trim() !== "" &&
    formData.name.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.div.trim() !== "" &&
    formData.dept_dat.trim() !== "" &&
    formData.role.trim() !== "" &&
    formData.doorlog.trim() !== "" &&
    formData.emp_status.trim() !== ""

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.staff_id || !formData.name || !formData.email ||
      !formData.div || !formData.dept_dat || !formData.role ||
      !formData.doorlog || !formData.emp_status) {
      console.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      // Map form data to Employee type
      const newEmployee: Employee = {
        id: formData.staff_id,
        name: formData.name,
        email: formData.email,
        doorlog: formData.doorlog,
        position: formData.role, // Using role as position
        emp_status: formData.emp_status,
        is_core_personnel: false,
        has_japan_business_trip: false,
        noti_setting: true,
        div_name: formData.div,
        dept_dir: null,
        dept_dat: formData.dept_dat,
        team: formData.team,
        role: formData.role,
        dob: "", // Add if needed
        profile_photo_path: "", // Add if needed
      }

      // Call the store's add method
      const result = await add_EmployeeData(newEmployee);
      if (result && (result.includes("already exists") || result.includes("Failed"))) {
        alert(result)
        return
      } else {
        alert(result)
      }


      // Reset form
      setFormData({
        div: "",
        staff_id: "",
        name: "",
        doorlog: "",
        dept_dat: "",
        team: "",
        emp_status: "active",
        role: "",
        email: "",
      })

      onOpenChange(false)
      onSuccess?.()

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
              disabled={isSubmitting || !isFormValid}
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