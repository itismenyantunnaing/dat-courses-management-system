"use client"

import { useState } from "react"
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

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemType: "division" | "department" | "team"
  onAdd: (name: string) => void
}

export function AddDivDeptTeamDialog({
  open,
  onOpenChange,
  itemType,
  onAdd,
}: AddItemDialogProps) {
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = () => {
    if (!name.trim()) return

    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      onAdd(name.trim())
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
        return "Enter the name of the new department. This will be available for selection in the employee form."
      case "team":
        return "Enter the name of the new team. This will be available for selection in the employee form."
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
              placeholder={getPlaceholder()}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
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
          <Button className="flex-1" onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}