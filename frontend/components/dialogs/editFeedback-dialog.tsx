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
import { FeedbackSuggestionDto } from "@/types/feedback"

interface EditFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feedback: FeedbackSuggestionDto
  onSubmit: (id: number, subject: string, description: string) => Promise<void>
  isLoading: boolean
}

export function EditFeedbackDialog({
  open,
  onOpenChange,
  feedback,
  onSubmit,
  isLoading,
}: EditFeedbackDialogProps) {
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (feedback) {
      setSubject(feedback.subject || "")
      setDescription(feedback.description || "")
    }
  }, [feedback])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback?.id) return
    await onSubmit(feedback.id, subject, description)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Feedback</DialogTitle>
          <DialogDescription>
            Update your feedback. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}