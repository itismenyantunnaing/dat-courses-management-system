"use client"

import { useState, useEffect } from "react"
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
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(null)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { 
    divisions, 
    dat_departments,
    fetch_divisions, 
    fetch_dat_departments,
    fetch_teams 
  } = mainStore()

  // Reset and fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetch_divisions()
      fetch_dat_departments()
      fetch_teams()
      
      if (itemName) {
        setName(itemName)
      }
      
      // Reset parent selections
      setSelectedDivisionId(null)
      setSelectedDepartmentId(null)
      setIsSubmitting(false)
    }
  }, [open, itemName, fetch_divisions, fetch_dat_departments, fetch_teams])

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert(`${itemType} name is required`)
      return
    }

    // Check if any changes were made
    if (name.trim() === itemName && 
        (itemType !== "department" || selectedDivisionId === null) &&
        (itemType !== "team" || selectedDepartmentId === null)) {
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
    setIsSubmitting(false)
    onOpenChange(false)
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

  const hasChanges = () => {
    if (!name.trim()) return false
    if (name.trim() === itemName) {
      // For department, check if division changed
      if (itemType === "department" && selectedDivisionId === null) return false
      // For team, check if department changed
      if (itemType === "team" && selectedDepartmentId === null) return false
      return true
    }
    return true
  }

  // Show parent select for department AND team
  const showParentSelect = itemType === "department" || itemType === "team"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
              >
                <SelectTrigger id="parent-select" className="w-full">
                  <SelectValue placeholder={`Select ${getParentLabel().toLowerCase()}`} />
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
                    ) : (
                      dat_departments.length === 0 ? (
                        <SelectItem value="no-items" disabled>
                          No departments available
                        </SelectItem>
                      ) : (
                        dat_departments.map((dept: any) => (
                          <SelectItem
                            key={dept.id}
                            value={dept.id.toString()}
                          >
                            {dept.deptName || dept.name}
                          </SelectItem>
                        ))
                      )
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

          {/* Show current parent info */}
          {showParentSelect && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium">Current {getParentLabel()}:</span>{" "}
                {itemType === "department" ? (
                  selectedDivisionId ? (
                    divisions.find((d: any) => d.id === selectedDivisionId)?.divisionName || "Select a division"
                  ) : (
                    "Select a division to change"
                  )
                ) : (
                  selectedDepartmentId ? (
                    dat_departments.find((d: any) => d.id === selectedDepartmentId)?.deptName || "Select a department"
                  ) : (
                    "Select a department to change"
                  )
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Select a new {getParentLabel().toLowerCase()} to change the parent, or keep the current selection.
              </p>
            </div>
          )}
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
            disabled={!hasChanges() || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}