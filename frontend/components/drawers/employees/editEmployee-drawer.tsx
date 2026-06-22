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
import { EmployeeForm, EmployeeFormData } from "@/components/drawers/employees/employeeForm"
import type { Employee } from "@/types/employee"
import { mainStore } from "@/store/mainStore"

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
  const { update_EmployeeData } = mainStore()
  
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
  const [originalFormData, setOriginalFormData] = useState<EmployeeFormData>({
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

  // Check if form has changes
  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData)
  }

  // Load employee data when drawer opens
  useEffect(() => {
    if (employee && open) {
      const newFormData = {
        div: employee.div_name || "",
        staff_id: employee.id || "",
        name: employee.name || "",
        doorlog: employee.doorlog || "",
        dept_dat: employee.dept_dat || "",
        team: employee.team || "",
        emp_status: employee.emp_status || "active",
        role: employee.role || "",
        email: employee.email || "",
      }
      setFormData(newFormData)
      setOriginalFormData(newFormData)
    }
  }, [employee, open])

  const handleSubmit = async () => {


    if (!hasChanges()) {
      console.log("No changes to save")
      return
    }

    // Validate required fields
    if (!formData.staff_id || !formData.name || !formData.email || 
        !formData.div || !formData.dept_dat || !formData.role || 
        !formData.doorlog || !formData.emp_status) {
      console.error("Please fill in all required fields")
      return
    }


    setIsSubmitting(true)

    try {

      // TODO: Replace with your actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Employee updated:", { id: employee?.id, ...formData })

      // Map form data to Employee type - PRESERVE ALL ORIGINAL FIELDS
      const updatedEmployee: Employee = {
        // Keep all original employee data
        ...employee!,
        // Override with updated values from form
        id: formData.staff_id,
        name: formData.name,
        email: formData.email,
        doorlog: formData.doorlog,
        position: formData.role,
        emp_status: formData.emp_status,
        div_name: formData.div,
        dept_dat: formData.dept_dat,
        team: formData.team,
        role: formData.role,
        // Preserve these fields from original employee
        is_core_personnel: employee?.is_core_personnel || false,
        has_japan_business_trip: employee?.has_japan_business_trip || false,
        noti_setting: employee?.noti_setting || true,
        dept_dir: employee?.dept_dir || null,
        dob: employee?.dob || "",
        profile_photo_path: employee?.profile_photo_path || "",
      }


      // Call the store's update method
      await update_EmployeeData(employee!.id, updatedEmployee)

    

      // Call the store's update method
      const result = await update_EmployeeData(employee!.id, updatedEmployee)
      if (result && (result.includes("not found") || result.includes("already exists") || result.includes("Failed"))) {
        alert(result)
        return
      } else {
        alert(result)
      }

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