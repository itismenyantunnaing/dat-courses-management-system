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
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { mainStore } from "@/store/mainStore"

interface AddDivDeptTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemType: "division" | "department" | "team"
  onAdd: (name: string, parentId?: number) => void
}

export function AddDivDeptTeamDialog({
  open,
  onOpenChange,
  itemType,
  onAdd,
}: AddDivDeptTeamDialogProps) {
  const [name, setName] = useState("")
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(
    null
  )
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)

  const {
    divisions,
    dat_departments,
    fetch_divisions,
    fetch_dat_departments,
    fetch_teams,
  } = mainStore()

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetch_divisions()
      fetch_dat_departments()
      fetch_teams()
      // Reset form
      setName("")
      setSelectedDivisionId(null)
      setSelectedDepartmentId(null)
      setIsSubmitting(false)
    }
  }, [open, fetch_divisions, fetch_dat_departments, fetch_teams])

  const handleSubmit = async () => {
    if (!name.trim()) return

    // Validate parent selection
    if (itemType === "department" && !selectedDivisionId) {
      alert("Please select a division first")
      return
    }

    if (itemType === "team" && !selectedDepartmentId) {
      alert("Please select a department first")
      return
    }

    setIsSubmitting(true)

    try {
      if (itemType === "division") {
        await onAdd(name.trim())
      } else if (itemType === "department") {
        await onAdd(name.trim(), selectedDivisionId!)
      } else if (itemType === "team") {
        await onAdd(name.trim(), selectedDepartmentId!)
      }

      // Reset and close on success
      setName("")
      setSelectedDivisionId(null)
      setSelectedDepartmentId(null)
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding item:", error)
      alert(`Failed to add ${itemType}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setName("")
    setSelectedDivisionId(null)
    setSelectedDepartmentId(null)
    setIsSubmitting(false)
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
        return "Add New Division"
      case "department":
        return "Add New Department"
      case "team":
        return "Add New Team"
      default:
        return "Add New Item"
    }
  }

  const getDescription = () => {
    switch (itemType) {
      case "division":
        return "Enter the name of the new division. This will be available for selection in the employee form."
      case "department":
        return "Select a division and enter the name of the new department. This will be available for selection in the employee form."
      case "team":
        return "Select a department and enter the name of the new team. This will be available for selection in the employee form."
      default:
        return "Enter the name of the new item."
    }
  }

  const getPlaceholder = () => {
    switch (itemType) {
      case "division":
        return "e.g., Engineering Division"
      case "department":
        return "e.g., IT Department"
      case "team":
        return "e.g., Frontend Team"
      default:
        return "Enter name..."
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

  const isFormValid = () => {
    if (!name.trim()) return false
    if (itemType === "department" && !selectedDivisionId) return false
    if (itemType === "team" && !selectedDepartmentId) return false
    return true
  }

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
          {/* For Department: Show Division Select */}
          {(itemType === "department" || itemType === "team") && (
            <div className="space-y-2">
              <Label htmlFor="parent-select">
                {itemType === "department" ? "Division" : "Department"}{" "}
                <span className="text-red-500">*</span>
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
              >
                <SelectTrigger
                  id="parent-select"
                  className="w-full"
                  data-dropdown-trigger
                >
                  <SelectValue
                    placeholder={`Select ${itemType === "department" ? "division" : "department"}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {itemType === "department" ? (
                      // Show divisions for department creation
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
                    ) : // Show departments for team creation
                    dat_departments.length === 0 ? (
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
              placeholder={getPlaceholder()}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isFormValid()) {
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
            disabled={!isFormValid() || isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
