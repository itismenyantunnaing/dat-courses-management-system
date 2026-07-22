// app/components/dialogs/new-feedback-dialog.tsx
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
import { HugeiconsIcon } from "@hugeicons/react"
import { MailSend02Icon } from "@hugeicons/core-free-icons"

interface NewFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (subject: string, description: string) => void
  isLoading?: boolean
}

export function NewFeedbackDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: NewFeedbackDialogProps) {
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")

  const isFormValid = subject.trim() !== "" && description.trim() !== ""

  const handleSubmit = () => {
    if (isFormValid) {
      onSubmit(subject, description)
      setSubject("")
      setDescription("")
      onOpenChange(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSubject("")
      setDescription("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-[550px]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            Submit new feedback or suggestion.
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          <div className="space-y-4">
            {/* Subject */}
            <div className="flex flex-col gap-1 space-y-2">
              <label className="text-sm font-medium">
                Subject <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter feedback subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="mt-2 flex flex-col gap-1 space-y-2">
              <label className="text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                className="min-h-[200px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Write your feedback here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
            {isLoading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
