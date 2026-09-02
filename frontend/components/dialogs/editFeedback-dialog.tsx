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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FeedbackSuggestionDto, FeedbackCategory } from "@/types/feedback"

interface EditFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feedback: FeedbackSuggestionDto
  onSubmit: (
    id: number,
    subject: string,
    category: FeedbackCategory,
    description: string
  ) => Promise<void>
  isLoading: boolean
}

const categoryOptions = [
  { value: "COURSE", label: "Course" },
  { value: "MANAGEMENT", label: "Management" },
  { value: "SYSTEM", label: "System" },
]

export function EditFeedbackDialog({
  open,
  onOpenChange,
  feedback,
  onSubmit,
  isLoading,
}: EditFeedbackDialogProps) {
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState<FeedbackCategory | "">("")
  const [description, setDescription] = useState("")
  const [originalSubject, setOriginalSubject] = useState("")
  const [originalCategory, setOriginalCategory] = useState<
    FeedbackCategory | ""
  >("")
  const [originalDescription, setOriginalDescription] = useState("")
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (feedback) {
      const newSubject = feedback.subject || ""
      const newCategory = feedback.category || ""
      const newDescription = feedback.description || ""
      setSubject(newSubject)
      setCategory(newCategory as FeedbackCategory)
      setDescription(newDescription)
      setOriginalSubject(newSubject)
      setOriginalCategory(newCategory as FeedbackCategory)
      setOriginalDescription(newDescription)
    }
  }, [feedback])

  // Check if there are any changes
  const hasChanges =
    subject !== originalSubject ||
    category !== originalCategory ||
    description !== originalDescription

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback?.id || !hasChanges) return
    if (!category) {
      // Show error if category is not selected
      return
    }
    await onSubmit(
      feedback.id,
      subject,
      category as FeedbackCategory,
      description
    )
  }

  // Reset to original values when canceling
  const handleCancel = () => {
    setSubject(originalSubject)
    setCategory(originalCategory)
    setDescription(originalDescription)
    onOpenChange(false)
  }

  // Add dropdown interaction handlers
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
    if (!newOpen) {
      setSubject(originalSubject)
      setCategory(originalCategory)
      setDescription(originalDescription)
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onPointerDownOutside={handlePointerDownOutside}
        onEscapeKeyDown={(e) => {
          // Prevent escape key from closing when dropdown is open
          if (isInteractingWithDropdown) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit Feedback</DialogTitle>
          <DialogDescription>
            Update your feedback. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex gap-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="edit-subject">Subject</Label>
                <Input
                  id="edit-subject"
                  placeholder="Enter feedback subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(value) =>
                    setCategory(value as FeedbackCategory)
                  }
                  onOpenChange={handleDropdownOpenChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe your feedback in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              type="submit"
              disabled={isLoading || !hasChanges || !category}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
