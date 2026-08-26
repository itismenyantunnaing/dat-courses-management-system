"use client"

import { useState, useRef } from "react"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AnnouncementCategory } from "@/types/announcement"

interface NewAnnouncementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    title: string,
    category: AnnouncementCategory,
    text: string
  ) => void
  isLoading?: boolean
}

const categoryOptions = [
  { value: "COURSE", label: "Course" },
  { value: "EXAM", label: "Exam" },
  { value: "OTHER", label: "Other" },
]

export function NewAnnouncementDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: NewAnnouncementDialogProps) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<AnnouncementCategory | "">("")
  const [text, setText] = useState("")
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)

  const isFormValid =
    title.trim() !== "" && category !== "" && text.trim() !== ""

  const handleSubmit = () => {
    if (isFormValid) {
      onSubmit(title, category as AnnouncementCategory, text)
      setTitle("")
      setCategory("")
      setText("")
      onOpenChange(false)
    }
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
      setTitle("")
      setCategory("")
      setText("")
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
        className="flex max-h-[90vh] flex-col p-0 sm:max-w-[550px]"
        onPointerDownOutside={handlePointerDownOutside}
        onEscapeKeyDown={(e) => {
          // Prevent escape key from closing when dropdown is open
          if (isInteractingWithDropdown) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            Create New Announcement
          </DialogTitle>
          <DialogDescription>
            Create an announcement to share with everyone. All fields are
            required.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          <div className="space-y-4">
            {/* Title and Category in one row */}
            <div className="flex gap-2">
              <div className="flex w-full flex-col gap-1">
                <Label className="text-sm font-medium">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Enter announcement title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={(value) =>
                    setCategory(value as AnnouncementCategory)
                  }
                  onOpenChange={handleDropdownOpenChange}
                >
                  <SelectTrigger>
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

            {/* Text */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">
                Announcement Text <span className="text-destructive">*</span>
              </Label>
              <textarea
                className="min-h-[150px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Write your announcement here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t p-6 pt-4">
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? "Creating..." : "Create Announcement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
