"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mainStore } from "@/store/mainStore"

interface EditDivDeptTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemType: "division" | "department" | "team"
  itemName: string
  onEdit: (oldName: string, newName: string, parentId?: number) => void
}

export function EditDivDeptTeamDialog({
  open,
  onOpenChange,
  itemType,
  itemName,
  onEdit,
}: EditDivDeptTeamDialogProps) {
  const [name, setName] = useState("")
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(
    null
  )
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)

  const {
    divisions,
    dat_departments,
    fetch_divisions,
    fetch_dat_departments,
    fetch_teams,
    teams,
  } = mainStore()

  // Reset and fetch data when dialog opens
  useEffect(() => {
    if (open) {
      setIsDataLoaded(false)
      fetch_divisions()
      fetch_dat_departments()
      fetch_teams()

      if (itemName) {
        setName(itemName)
      }

      setIsSubmitting(false)
    }
  }, [open, itemName, fetch_divisions, fetch_dat_departments, fetch_teams])

  // Find and set the current parent when data is loaded
  useEffect(() => {
    if (!open || isDataLoaded) return

    if (itemType === "department") {
      // Find the department by name to get its divisionId
      const department = dat_departments.find(
        (d: any) => d.deptName === itemName
      )
      if (department && department.divisionId) {
        // Check if the division exists in the list
        const divisionExists = divisions.some(
          (d: any) => d.id === department.divisionId
        )
        if (divisionExists) {
          setSelectedDivisionId(department.divisionId)
          setIsDataLoaded(true)
          return
        }
      }

      // If department not found or division doesn't exist, auto-select first division
      if (divisions.length > 0 && selectedDivisionId === null) {
        setSelectedDivisionId(divisions[0].id)
        setIsDataLoaded(true)
      }
    } else if (itemType === "team") {
      // Find the team by name to get its departmentDatId
      const team = teams.find((t: any) => t.teamName === itemName)
      if (team && team.departmentDatId) {
        // Check if the department exists in the list
        const departmentExists = dat_departments.some(
          (d: any) => d.id === team.departmentDatId
        )
        if (departmentExists) {
          setSelectedDepartmentId(team.departmentDatId)
          setIsDataLoaded(true)
          return
        }
      }

      // If team not found or department doesn't exist, auto-select first department
      if (dat_departments.length > 0 && selectedDepartmentId === null) {
        setSelectedDepartmentId(dat_departments[0].id)
        setIsDataLoaded(true)
      }
    } else {
      setIsDataLoaded(true)
    }
  }, [
    open,
    itemType,
    itemName,
    divisions,
    dat_departments,
    teams,
    selectedDivisionId,
    selectedDepartmentId,
    isDataLoaded,
  ])

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert(`${itemType} name is required`)
      return
    }

    // Check if any changes were made
    if (
      name.trim() === itemName &&
      (itemType !== "department" || selectedDivisionId === null) &&
      (itemType !== "team" || selectedDepartmentId === null)
    ) {
      onOpenChange(false)
      return
    }

    // Validate parent selection for department
    if (itemType === "department" && !selectedDivisionId) {
      alert("Please select a division")
      return
    }

    // Validate parent selection for team
    if (itemType === "team" && !selectedDepartmentId) {
      alert("Please select a department")
      return
    }

    setIsSubmitting(true)

    try {
      // Call the appropriate edit function
      if (itemType === "division") {
        await onEdit(itemName, name.trim())
      } else if (itemType === "department") {
        await onEdit(itemName, name.trim(), selectedDivisionId!)
      } else if (itemType === "team") {
        // Team needs departmentDatId
        await onEdit(itemName, name.trim(), selectedDepartmentId!)
      }

      setName("")
      setSelectedDivisionId(null)
      setSelectedDepartmentId(null)
      setIsDataLoaded(false)
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating item:", error)
      alert(`Failed to update ${itemType}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setName("")
    setSelectedDivisionId(null)
    setSelectedDepartmentId(null)
    setIsDataLoaded(false)
    onOpenChange(false)
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
      // Delay setting to false to prevent dialog from closing when clicking outside dropdown
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
    // Clear any pending timer when dialog closes
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

  const getTitle = () => {
    switch (itemType) {
      case "division":
        return "Edit Division"
      case "department":
        return "Edit Department"
      case "team":
        return "Edit Team"
      default:
        return "Edit Item"
    }
  }

  const getDescription = () => {
    switch (itemType) {
      case "division":
        return "Update the name of the division. This will update all associated employee records."
      case "department":
        return "Update the name or division of the department. This will update all associated employee records."
      case "team":
        return "Update the name or department of the team. This will update all associated employee records."
      default:
        return "Update the name of the item."
    }
  }

  const getLabel = () => {
    switch (itemType) {
      case "division":
        return "Division Name"
      case "department":
        return "Department Name"
      case "team":
        return "Team Name"
      default:
        return "Name"
    }
  }

  const getParentLabel = () => {
    switch (itemType) {
      case "department":
        return "Division"
      case "team":
        return "Department"
      default:
        return "Parent"
    }
  }

  const getCurrentParentName = () => {
    if (itemType === "department") {
      if (selectedDivisionId) {
        const division = divisions.find((d: any) => d.id === selectedDivisionId)
        return division?.divisionName || division?.name || "Unknown Division"
      }
      return "No division selected"
    } else if (itemType === "team") {
      if (selectedDepartmentId) {
        const department = dat_departments.find(
          (d: any) => d.id === selectedDepartmentId
        )
        if (department) {
          return `${department.deptName || department.name} (${department.divisionName || "No Division"})`
        }
        return "Unknown Department"
      }
      return "No department selected"
    }
    return ""
  }

  const hasChanges = () => {
    if (!name.trim()) return false

    // If name changed, always allow save
    if (name.trim() !== itemName) return true

    // If name is the same, check if parent changed
    if (itemType === "department") {
      // Find the current department to get its original divisionId
      const department = dat_departments.find(
        (d: any) => d.deptName === itemName
      )
      if (department) {
        const originalDivisionId = department.divisionId
        return (
          selectedDivisionId !== null &&
          selectedDivisionId !== originalDivisionId
        )
      }
      return false
    }

    if (itemType === "team") {
      // Find the current team to get its original departmentDatId
      const team = teams.find((t: any) => t.teamName === itemName)
      if (team) {
        const originalDepartmentId = team.departmentDatId
        return (
          selectedDepartmentId !== null &&
          selectedDepartmentId !== originalDepartmentId
        )
      }
      return false
    }

    return false
  }

  // Show parent select for department AND team
  const showParentSelect = itemType === "department" || itemType === "team"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onPointerDownOutside={handlePointerDownOutside}
        onEscapeKeyDown={(e) => {
          // Prevent escape key from closing when dropdown is open
          if (isInteractingWithDropdown) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Show Parent Select for Department or Team */}
          {showParentSelect && (
            <div className="space-y-2">
              <Label htmlFor="parent-select">
                {getParentLabel()} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={
                  itemType === "department"
                    ? selectedDivisionId?.toString() || ""
                    : selectedDepartmentId?.toString() || ""
                }
                onValueChange={(value) => {
                  if (itemType === "department") {
                    setSelectedDivisionId(Number(value))
                  } else {
                    setSelectedDepartmentId(Number(value))
                  }
                }}
                onOpenChange={handleDropdownOpenChange}
                disabled={!isDataLoaded}
              >
                <SelectTrigger
                  id="parent-select"
                  className="w-full"
                  data-dropdown-trigger
                >
                  <SelectValue
                    placeholder={`Select ${getParentLabel().toLowerCase()}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {itemType === "department" ? (
                      divisions.length === 0 ? (
                        <SelectItem value="no-items" disabled>
                          No divisions available
                        </SelectItem>
                      ) : (
                        divisions.map((division: any) => (
                          <SelectItem
                            key={division.id}
                            value={division.id.toString()}
                          >
                            {division.divisionName || division.name}
                          </SelectItem>
                        ))
                      )
                    ) : dat_departments.length === 0 ? (
                      <SelectItem value="no-items" disabled>
                        No departments available
                      </SelectItem>
                    ) : (
                      dat_departments.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.deptName || dept.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {itemType === "department" && divisions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No divisions available. Please create a division first.
                </p>
              )}
              {itemType === "team" && dat_departments.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No departments available. Please create a department first.
                </p>
              )}
            </div>
          )}

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="item-name">
              {getLabel()} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="item-name"
              placeholder={`Enter ${itemType} name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && hasChanges()) {
                  handleSubmit()
                }
              }}
              autoFocus
            />
          </div>

          
        </div>
        <DialogFooter className="flex gap-2">
          <Button
            className="flex-1"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!hasChanges() || isSubmitting || !isDataLoaded}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
