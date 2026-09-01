"use client"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import { ClockIcon, Delete02Icon, Edit03Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { FeedbackCategory } from "@/types/feedback"
import { mainStore } from "@/store/mainStore"

interface FeedbackCardProps {
  feedback: {
    id: number
    employee: {
      name: string
      email: string
      department: string
      team: string
      avatar: string
    }
    subject: string
    category?: FeedbackCategory
    description: string
    createdAt: string
    updatedAt?: string
  }
  onClick: () => void
  onDelete: (e: React.MouseEvent, feedbackId: number) => void
  onEdit?: (e: React.MouseEvent, feedbackId: number) => void
  formatTime: (dateString: string) => string
  getInitials: (name: string) => string
  canEdit?: boolean
  canDelete?: boolean
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

export function FeedbackCard({
  feedback,
  onClick,
  onDelete,
  onEdit,
  formatTime,
  getInitials,
  canEdit = false,
  canDelete = false,
}: FeedbackCardProps) {
  const { profile } = mainStore()

  // Get the time to display - use updatedAt if exists, otherwise createdAt
  const getDisplayTime = () => {
    if (feedback.updatedAt) {
      return formatTime(feedback.updatedAt)
    }
    return formatTime(feedback.createdAt)
  }

  // Check if department has valid data (not N/A, not empty, not null)
  const hasDepartment =
    feedback.employee.department &&
    feedback.employee.department !== "N/A" &&
    feedback.employee.department.trim() !== ""

  // Check if team has valid data (not N/A, not empty, not null)
  const hasTeam =
    feedback.employee.team &&
    feedback.employee.team !== "N/A" &&
    feedback.employee.team.trim() !== ""

  // Determine if we should show the department/team section
  const showDepartmentTeam = hasDepartment || hasTeam

  return (
    <Card
      className="group h-full cursor-pointer py-4 transition-all hover:bg-muted/40"
      onClick={onClick}
    >
      <CardContent className="px-4">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h4 className="flex-1 truncate text-base font-medium">{feedback.subject}</h4>
          {/* Category Badge */}
          {feedback.category && (
            <span
              className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryStyles(feedback.category)}`}
            >
              {getCategoryLabel(feedback.category)}
            </span>
          )}
        </div>
        <div className="line-clamp-3 text-sm text-muted-foreground">
          {feedback.description}
        </div>
      </CardContent>
      <CardFooter className="relative border-t px-4 pt-3!">
        <div className="flex w-full items-center justify-between gap-1">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage
                src={feedback.employee.avatar || ""}
                alt={feedback.employee.name}
              />
              <AvatarFallback className="text-xs">
                {getInitials(feedback.employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-sm font-medium">
                {feedback.employee.name}
              </CardTitle>
              {showDepartmentTeam && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {hasDepartment && (
                    <span className="max-w-[50%] truncate">
                      {feedback.employee.department}
                    </span>
                  )}
                  {hasDepartment && hasTeam && (
                    <span className="flex-shrink-0">•</span>
                  )}
                  {hasTeam && (
                    <span className="max-w-[50%] truncate">
                      {feedback.employee.team}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="ml-2 flex flex-shrink-0 items-center gap-1 text-xs whitespace-nowrap text-muted-foreground">
            <HugeiconsIcon
              icon={ClockIcon}
              strokeWidth={2}
              className="h-3 w-3 flex-shrink-0"
            />
            {getDisplayTime()}
          </div>
        </div>

        {/* Action buttons with background and blur */}
        <div className="absolute right-2 bottom-[-2] z-10 flex items-center gap-0.5 rounded-lg bg-background/80 px-1 py-1 opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
          {canEdit && onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(e, feedback.id)
              }}
            >
              <HugeiconsIcon
                icon={Edit03Icon}
                strokeWidth={2}
                className="h-3.5 w-3.5"
              />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive/90"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(e, feedback.id)
              }}
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                strokeWidth={2}
                className="h-3.5 w-3.5"
              />
            </Button>
          )}

        </div>
      </CardFooter>
    </Card>
  )
}
