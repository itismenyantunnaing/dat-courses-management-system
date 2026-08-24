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
  const {
    add_EmployeeData,
    add_division,
    add_dat_department,
    add_team,
    divisions,
    dat_departments
  } = mainStore()

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
    dept_dir: "",
    position: "", // Added position
    team: "",
    emp_status: "active",
    role: "",
    email: "",
    joinedDate: "",
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
        position: formData.position || "",
        emp_status: formData.emp_status,
        is_core_personnel: false,
        has_japan_business_trip: false,
        noti_setting: true,
        div_name: formData.div,
        dept_dir: formData.dept_dir || null,
        dept_dat: formData.dept_dat,
        team: formData.team,
        role: formData.role,
        dob: "",
        joinedDate: formData.joinedDate || "",
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
        dept_dir: "",
        team: "",
        emp_status: "active",
        role: "",
        email: "",
        joinedDate: "",
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

  const handleItemAdded = async (name: string) => {
    let result = null;

    // Call the appropriate function based on the type
    if (addItemType === "division") {
      result = await add_division(name);

      if (result && result.success) {
        alert(`✅ Division "${name}" added successfully!`);
        setFormData((prev) => ({ ...prev, div: name }));
      } else {
        alert(`❌ Failed to add division: ${result?.error || 'Unknown error'}`);
      }

    } else if (addItemType === "department") {

      // You need to get the division ID from the selected division
      // Find the selected division from the divisions list
      const selectedDivision = divisions.find((div: any) =>
        div.divisionName === formData.div || div.id === formData.div
      );

      if (!selectedDivision) {
        alert('❌ Please select a division first before adding a department');
        return;
      }

      const divisionId = selectedDivision.id || selectedDivision.divisionId;

      // Find if the division has the ID
      let finalDivisionId = divisionId;
      if (!finalDivisionId && divisions.length > 0) {
        // If the divisions list has items with id
        const divWithId = divisions.find((d: any) => d.id);
        if (divWithId) {
          // Try to find the matching division by name
          const match = divisions.find((d: any) => d.divisionName === formData.div);
          if (match) {
            finalDivisionId = match.id;
          } else {
            // If we can't find it, use the first division's ID
            finalDivisionId = divisions[0]?.id;
          }
        }
      }

      if (!finalDivisionId) {
        alert('❌ Could not find division ID. Please select a valid division.');
        return;
      }

      result = await add_dat_department(finalDivisionId, name);

      if (result && result.success) {
        alert(`✅ Department "${name}" added successfully!`);
        setFormData((prev) => ({ ...prev, dept_dat: name }));
      } else {
        alert(`❌ Failed to add department: ${result?.error || 'Unknown error'}`);
      }

    } else if (addItemType === "team") {

      // You need to get the department ID from the selected department
      const selectedDepartment = dat_departments.find((dept: any) =>
        dept.deptName === formData.dept_dat || dept.id === formData.dept_dat
      );

      if (!selectedDepartment) {
        alert('❌ Please select a department first before adding a team');
        return;
      }

      const departmentId = selectedDepartment.id || selectedDepartment.departmentDatId;

      if (!departmentId) {
        alert('❌ Could not find department ID. Please select a valid department.');
        return;
      }

      result = await add_team(departmentId, name);

      if (result && result.success) {
        alert(`✅ Team "${name}" added successfully!`);
        setFormData((prev) => ({ ...prev, team: name }));
      } else {
        alert(`❌ Failed to add team: ${result?.error || 'Unknown error'}`);
      }
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