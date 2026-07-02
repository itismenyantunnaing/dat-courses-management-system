"use client"

import { useState, useRef } from "react"
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
import { AddDivDeptTeamDialog } from "@/components/dialogs/createDivDeptTeam-dialog"
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
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)
  const { add_EmployeeData } = mainStore()

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
      // Map form data to Employee type
      const newEmployee: Employee = {
        id: formData.staff_id,
        name: formData.name,
        email: formData.email,
        doorlog: formData.doorlog,
        position: formData.role,
        emp_status: formData.emp_status,
        is_core_personnel: false,
        has_japan_business_trip: false,
        noti_setting: true,
        div_name: formData.div,
        dept_dir: null,
        dept_dat: formData.dept_dat,
        team: formData.team,
        role: formData.role,
        dob: "",
        profile_photo_path: "",
      }

      const result = await add_EmployeeData(newEmployee)
      if (
        result &&
        (result.includes("already exists") || result.includes("Failed"))
      ) {
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

  const handleAddItem = (type: "division" | "department" | "team") => {
    setAddItemType(type)
    setAddDialogOpen(true)
  }

  const handleItemAdded = (name: string) => {
    console.log(`Added new ${addItemType}: ${name}`)
    alert(
      `✅ ${addItemType.charAt(0).toUpperCase() + addItemType.slice(1)} "${name}" added successfully!`
    )

    // Auto-select the newly added item in the form
    if (addItemType === "division") {
      setFormData((prev) => ({ ...prev, div: name }))
    } else if (addItemType === "department") {
      setFormData((prev) => ({ ...prev, dept_dat: name }))
    } else if (addItemType === "team") {
      setFormData((prev) => ({ ...prev, team: name }))
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
            <DrawerTitle>Add New Employee</DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-4">
              <EmployeeForm
                data={formData}
                onChange={setFormData}
                onAddDivision={() => handleAddItem("division")}
                onAddDepartment={() => handleAddItem("department")}
                onAddTeam={() => handleAddItem("team")}
                onDropdownOpenChange={handleDropdownOpenChange}
              />
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
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? "Creating..." : "Create Employee"}
              </Button>
            </div>
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
