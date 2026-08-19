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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AnnouncementCategory } from "@/types/announcement"

interface NewAnnouncementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (title: string, category: AnnouncementCategory, text: string) => void  // ✅ Removed createdBy
  isLoading?: boolean
}

const categoryOptions = [
  { value: 'COURSE', label: 'Course' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'OTHER', label: 'Other' },
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

  const isFormValid = title.trim() !== "" && category !== "" && text.trim() !== ""

  const handleSubmit = () => {
    if (isFormValid) {
      onSubmit(title, category as AnnouncementCategory, text)
      setTitle("")
      setCategory("")
      setText("")
      onOpenChange(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTitle("")
      setCategory("")
      setText("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-[550px]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            Create New Announcement
          </DialogTitle>
          <DialogDescription>
            Create an announcement to share with everyone. All fields are required.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          <div className="space-y-4">
            {/* Title */}
            <div className="flex flex-col gap-1 space-y-2">
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

            {/* Category */}
            <div className="flex flex-col gap-1 space-y-2">
              <Label className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={category} 
                onValueChange={(value) => setCategory(value as AnnouncementCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Text - Removed CreatedBy input */}
            <div className="mt-2 flex flex-col gap-1 space-y-2">
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