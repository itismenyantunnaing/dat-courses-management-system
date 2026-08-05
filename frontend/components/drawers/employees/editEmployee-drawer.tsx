"use client"

import { useState, useEffect, useRef } from "react"
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
import { EmployeeView } from "@/components/drawers/employees/employeeView"
import { AddDivDeptTeamDialog } from "@/components/dialogs/createDivDeptTeam-dialog"
import type { Employee } from "@/types/employee"
import { mainStore } from "@/store/mainStore"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit03Icon } from "@hugeicons/core-free-icons"
import type { Course } from "@/types/course"

interface EditEmployeeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  courses: Course[] | null
  onSuccess?: () => void
}

export function EditEmployeeDrawer({
  open,
  onOpenChange,
  employee,
  courses,
  onSuccess,
}: EditEmployeeDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)
  const { update_EmployeeData, add_division } = mainStore()

  // State for Add Item Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addItemType, setAddItemType] = useState<
    "division" | "department" | "team"
  >("division")

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

  // Reset edit mode when drawer opens/closes
  useEffect(() => {
    if (!open) {
      setIsEditMode(false)
    }
  }, [open])

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

  const handleAddItem = (type: "division" | "department" | "team") => {
    setAddItemType(type)
    setAddDialogOpen(true)
  }

  const handleItemAdded = async (name: string) => {
    await add_division(name)
    alert(
      `✅ ${addItemType.charAt(0).toUpperCase() + addItemType.slice(1)} "${name}" added successfully!`
    )

    // Auto-select the newly added item in the form
    if (addItemType === "division") {
      setFormData((prev) => ({ ...prev, div: name }))
      setOriginalFormData((prev) => ({ ...prev, div: name }))
    } else if (addItemType === "department") {
      setFormData((prev) => ({ ...prev, dept_dat: name }))
      setOriginalFormData((prev) => ({ ...prev, dept_dat: name }))
    } else if (addItemType === "team") {
      setFormData((prev) => ({ ...prev, team: name }))
      setOriginalFormData((prev) => ({ ...prev, team: name }))
    }
  }

  const handleSubmit = async () => {
    if (!hasChanges()) {
      return
    }

    // Validate required fields
    if (
      !formData.staff_id ||
      !formData.name ||
      !formData.email ||
      !formData.div ||
      !formData.dept_dat ||
      !formData.role ||
      !formData.doorlog ||
      !formData.emp_status
    ) {
      console.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      // Map form data to Employee type - PRESERVE ALL ORIGINAL FIELDS
      const updatedEmployee: Employee = {
        // Keep all original employee data
        ...employee!,
        // Override with updated values from form
        id: formData.staff_id,
        name: formData.name,
        email: formData.email,
        doorlog: formData.doorlog,
        position:  "",
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
      const result = await update_EmployeeData(employee!.id, updatedEmployee)
      if (
        result &&
        (result.includes("not found") ||
          result.includes("already exists") ||
          result.includes("Failed"))
      ) {
        alert(result)
        return
      } else {
        alert(result)
      }

      setIsEditMode(false)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to update employee:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDropdownOpenChange = (isOpen: boolean) => {
    // Clear any pending timer
    if (dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }

    if (isOpen) {
      setIsInteractingWithDropdown(true)
    } else {
      // Delay setting to false to prevent drawer from closing when clicking outside dropdown
      dropdownCloseTimer.current = setTimeout(() => {
        setIsInteractingWithDropdown(false)
        dropdownCloseTimer.current = null
      }, 150)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Don't close if we're interacting with a dropdown
    if (!newOpen && isInteractingWithDropdown) {
      return
    }
    // Clear any pending timer when drawer closes
    if (!newOpen && dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }
    onOpenChange(newOpen)
  }

  // Handle pointer down outside - only prevent if clicking on dropdown
  const handlePointerDownOutside = (e: Event) => {
    const target = e.target as HTMLElement
    // Allow closing when clicking on the overlay or outside
    // But prevent if clicking on dropdown items or the select trigger
    if (
      target.closest('[role="listbox"]') ||
      target.closest('[role="option"]') ||
      target.closest("[data-dropdown-trigger]")
    ) {
      e.preventDefault()
    }
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleCancelEdit = () => {
    // Reset form data to original
    setFormData(originalFormData)
    setIsEditMode(false)
  }

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
        <DrawerContent
          className="right-0 left-auto h-full w-[85%] sm:w-[70%] md:w-[60%] lg:w-[50%] xl:w-[40%]"
          onPointerDownOutside={handlePointerDownOutside}
          onEscapeKeyDown={(e) => {
            // Prevent escape key from closing when dropdown is open
            if (isInteractingWithDropdown) {
              e.preventDefault()
            }
          }}
        >
          <DrawerHeader className="shrink-0 border-b">
            <div className="flex items-center justify-between">
              <DrawerTitle>
                {isEditMode ? "Edit Employee" : "Employee Details"}
              </DrawerTitle>
              {!isEditMode && employee && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                  className="gap-1"
                >
                  <HugeiconsIcon
                    icon={Edit03Icon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                  Edit
                </Button>
              )}
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-4">
              {isEditMode ? (
                <EmployeeForm
                  data={formData}
                  onChange={setFormData}
                  isEdit
                  onAddDivision={() => handleAddItem("division")}
                  onAddDepartment={() => handleAddItem("department")}
                  onAddTeam={() => handleAddItem("team")}
                  onDropdownOpenChange={handleDropdownOpenChange}
                />
              ) : (
                <EmployeeView employee={employee} courses={courses}/>
              )}
            </div>
          </div>

          <DrawerFooter className="shrink-0 border-t">
            {isEditMode ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !hasChanges()}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1">
                    Close
                  </Button>
                </DrawerClose>
              </div>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Add Item Dialog */}
      <AddDivDeptTeamDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        itemType={addItemType}
        onAdd={handleItemAdded}
      />
    </>
  )
}
