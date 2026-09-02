"use client"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import { ClockIcon } from "@hugeicons/core-free-icons"
import { FeedbackSuggestionDto, FeedbackCategory } from "@/types/feedback"

interface FeedbackDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feedback: FeedbackSuggestionDto | null
  getDisplayTime: (feedbackItem: FeedbackSuggestionDto | null) => string
  getInitials: (name: string) => string
  resolveUploadUrl: (path?: string) => string
}

// Category color mapping
const getCategoryStyles = (category?: FeedbackCategory) => {
  switch (category) {
    case "COURSE":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    case "MANAGEMENT":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    case "SYSTEM":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  }
}

// Category label mapping
const getCategoryLabel = (category?: FeedbackCategory) => {
  switch (category) {
    case "COURSE":
      return "Course"
    case "MANAGEMENT":
      return "Management"
    case "SYSTEM":
      return "System"
    default:
      return "Unknown"
  }
}

export function FeedbackDetailDialog({
  open,
  onOpenChange,
  feedback,
  getDisplayTime,
  getInitials,
  resolveUploadUrl,
}: FeedbackDetailDialogProps) {
  if (!feedback) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-[600px]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="max-w-[92%] truncate">
            {feedback.subject}
          </DialogTitle>
          {/* Category Badge - right below the title */}
          {feedback.category && (
            <div>
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryStyles(feedback.category)}`}
              >
                {getCategoryLabel(feedback.category)}
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          <div className="space-y-4">
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {feedback.description}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t p-6 pt-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex flex-1 items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={resolveUploadUrl(feedback.profilePhotoPath) || ""}
                  alt={
                    feedback.employeeName || `Employee ${feedback.employeeId}`
                  }
                />
                <AvatarFallback className="text-sm">
                  {feedback.employeeName
                    ? getInitials(feedback.employeeName)
                    : feedback.employeeId?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">
                  {feedback.employeeName || `Employee ${feedback.employeeId}`}
                </p>
                <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                  {feedback.department && (
                    <>
                      <span className="max-w-[50%] truncate">
                        {feedback.department}
                      </span>
                      <span>•</span>
                    </>
                  )}
                  {feedback.team && (
                    <span className="max-w-[50%] truncate">{feedback.team}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground">
              <HugeiconsIcon
                icon={ClockIcon}
                strokeWidth={2}
                className="h-3 w-3"
              />
              {getDisplayTime(feedback)}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
