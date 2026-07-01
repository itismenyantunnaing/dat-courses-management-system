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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EditDivDeptTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemType: "division" | "department" | "team"
  itemName: string
  onEdit: (oldName: string, newName: string) => void
}

export function EditDivDeptTeamDialog({
  open,
  onOpenChange,
  itemType,
  itemName,
  onEdit,
}: EditDivDeptTeamDialogProps) {
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset name when dialog opens or item changes
  useEffect(() => {
    if (open && itemName) {
      setName(itemName)
    }
  }, [open, itemName])

  const handleSubmit = () => {
    if (!name.trim() || name.trim() === itemName) {
      // If name is empty or unchanged, just close
      if (name.trim() === itemName) {
        onOpenChange(false)
      }
      return
    }

    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      onEdit(itemName, name.trim())
      setName("")
      setIsSubmitting(false)
      onOpenChange(false)
    }, 500)
  }

  const handleClose = () => {
    setName("")
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
        return "Update the name of the department. This will update all associated employee records."
      case "team":
        return "Update the name of the team. This will update all associated employee records."
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

  const hasChanges = name.trim() !== "" && name.trim() !== itemName

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="item-name">{getLabel()}</Label>
            <Input
              id="item-name"
              placeholder={`Enter ${itemType} name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && hasChanges) {
                  handleSubmit()
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="flex">
          <Button className="flex-1" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!hasChanges || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
