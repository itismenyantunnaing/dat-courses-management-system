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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AnnouncementDto, AnnouncementCategory } from "@/types/announcement"

interface EditAnnouncementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement: AnnouncementDto
  onSubmit: (id: number, title: string, category: AnnouncementCategory, text: string) => Promise<void>  // ✅ Removed createdBy
  isLoading: boolean
}

const categoryOptions = [
  { value: 'COURSE', label: 'Course' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'OTHER', label: 'Other' },
]

export function EditAnnouncementDialog({
  open,
  onOpenChange,
  announcement,
  onSubmit,
  isLoading,
}: EditAnnouncementDialogProps) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<AnnouncementCategory | "">("")
  const [text, setText] = useState("")
  const [originalTitle, setOriginalTitle] = useState("")
  const [originalCategory, setOriginalCategory] = useState<AnnouncementCategory | "">("")
  const [originalText, setOriginalText] = useState("")

  useEffect(() => {
    if (announcement) {
      const newTitle = announcement.title || ""
      const newCategory = announcement.category || ""
      const newText = announcement.text || ""
      setTitle(newTitle)
      setCategory(newCategory as AnnouncementCategory)
      setText(newText)
      setOriginalTitle(newTitle)
      setOriginalCategory(newCategory as AnnouncementCategory)
      setOriginalText(newText)
    }
  }, [announcement])

  const hasChanges =
    title !== originalTitle || 
    category !== originalCategory || 
    text !== originalText

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!announcement?.id || !hasChanges) return
    if (!category) return
    await onSubmit(announcement.id, title, category as AnnouncementCategory, text)
  }

  const handleCancel = () => {
    setTitle(originalTitle)
    setCategory(originalCategory)
    setText(originalText)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
          <DialogDescription>
            Update your announcement. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="Enter announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select 
                value={category} 
                onValueChange={(value) => setCategory(value as AnnouncementCategory)}
                disabled={isLoading}
              >
                <SelectTrigger id="edit-category">
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

            <div className="grid gap-2">
              <Label htmlFor="edit-text">Announcement Text</Label>
              <Textarea
                id="edit-text"
                placeholder="Write your announcement..."
                value={text}
                onChange={(e) => setText(e.target.value)}
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