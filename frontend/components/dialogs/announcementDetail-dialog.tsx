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
import { AnnouncementDto, AnnouncementCategory } from "@/types/announcement"
import { Button } from "@/components/ui/button"
import { MessageEdit01Icon, Delete02Icon } from "@hugeicons/core-free-icons"

// Category color mapping
const getCategoryStyles = (category?: AnnouncementCategory) => {
  switch (category) {
    case "COURSE":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    case "EXAM":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    case "OTHER":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  }
}

const getCategoryLabel = (category?: AnnouncementCategory) => {
  switch (category) {
    case "COURSE":
      return "Course"
    case "EXAM":
      return "Exam"
    case "OTHER":
      return "Other"
    default:
      return "Unknown"
  }
}

// Helper function to get initials
const getInitialsDefault = (name: string) => {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface AnnouncementDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement: AnnouncementDto | null
  formatTime: (dateString: string) => string
  getInitials?: (name: string) => string
  onEdit?: (e: React.MouseEvent, announcement: AnnouncementDto) => void
  onDelete?: (e: React.MouseEvent, announcementId: number) => void
  canEdit?: boolean
  canDelete?: boolean
}

export function AnnouncementDetailDialog({
  open,
  onOpenChange,
  announcement,
  formatTime,
  getInitials = getInitialsDefault,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}: AnnouncementDetailDialogProps) {
  if (!announcement) return null

  // Check if department has valid data
  const hasDepartment =
    announcement.departmentName &&
    announcement.departmentName !== "N/A" &&
    announcement.departmentName.trim() !== ""

  const hasTeam =
    announcement.teamName &&
    announcement.teamName !== "N/A" &&
    announcement.teamName.trim() !== ""

  const showDepartmentTeam = hasDepartment || hasTeam

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-[600px]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="pr-8">{announcement.title}</DialogTitle>
          {announcement.category && (
            <div>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryStyles(announcement.category)}`}
              >
                {getCategoryLabel(announcement.category)}
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          <div className="space-y-4">
            <div
              className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground"
              style={{ wordBreak: "break-word" }}
            >
              {announcement.text}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t p-6 pt-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src="" alt={announcement.createdBy || "User"} />
                <AvatarFallback className="text-sm">
                  {getInitials(announcement.createdBy || "User")}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="font-medium">
                  {announcement.createdBy || "Unknown"}
                </p>
                {showDepartmentTeam && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {hasDepartment && (
                      <span className="max-w-[50%] truncate">
                        {announcement.departmentName}
                      </span>
                    )}
                    {hasDepartment && hasTeam && (
                      <span className="flex-shrink-0">•</span>
                    )}
                    {hasTeam && (
                      <span className="max-w-[50%] truncate">
                        {announcement.teamName}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Time */}
              <div className="flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground">
                <HugeiconsIcon
                  icon={ClockIcon}
                  strokeWidth={2}
                  className="h-3 w-3"
                />
                {announcement.createdAt
                  ? formatTime(announcement.createdAt)
                  : "-"}
              </div>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
