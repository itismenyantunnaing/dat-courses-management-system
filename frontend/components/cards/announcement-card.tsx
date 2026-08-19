"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { ClockIcon, Delete02Icon, Edit03Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { AnnouncementCategory } from "@/types/announcement"

interface AnnouncementCardProps {
  announcement: {
    id: number
    title: string
    text: string
    category?: AnnouncementCategory
    createdBy: string
    createdAt: string
    updatedAt?: string
  }
  onClick: () => void
  onDelete: (e: React.MouseEvent, announcementId: number) => void
  onEdit?: (e: React.MouseEvent, announcementId: number) => void
  formatTime: (dateString: string) => string
  canEdit?: boolean
}

// Category color mapping
const getCategoryStyles = (category?: AnnouncementCategory) => {
  switch (category) {
    case 'COURSE':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'EXAM':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'OTHER':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

// Category label mapping
const getCategoryLabel = (category?: AnnouncementCategory) => {
  switch (category) {
    case 'COURSE':
      return 'Course'
    case 'EXAM':
      return 'Exam'
    case 'OTHER':
      return 'Other'
    default:
      return 'Unknown'
  }
}

export function AnnouncementCard({
  announcement,
  onClick,
  onDelete,
  onEdit,
  formatTime,
  canEdit = false,
}: AnnouncementCardProps) {
  // Get the time to display - use updatedAt if exists, otherwise createdAt
  const getDisplayTime = () => {
    if (announcement.updatedAt) {
      return formatTime(announcement.updatedAt)
    }
    return formatTime(announcement.createdAt)
  }

  return (
    <Card
      className="group h-full cursor-pointer transition-all hover:bg-muted/40"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-1">
          {/* Top row: Title + Time */}
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="min-w-0 flex-1 truncate text-base font-medium">
              {announcement.title}
            </CardTitle>
            <div className="flex flex-shrink-0 items-center gap-1 text-xs whitespace-nowrap text-muted-foreground">
              <HugeiconsIcon
                icon={ClockIcon}
                strokeWidth={2}
                className="h-3 w-3 flex-shrink-0"
              />
              {getDisplayTime()}
            </div>
          </div>

          {/* Bottom row: Created By + Category */}
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="min-w-0 truncate">
              By: {announcement.createdBy}
            </span>
            {announcement.category && (
              <>
                <span className="flex-shrink-0">•</span>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryStyles(announcement.category)}`}>
                  {getCategoryLabel(announcement.category)}
                </span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative pt-0">
        <div
          className="line-clamp-3 text-sm text-muted-foreground"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {announcement.text}
        </div>
        {/* Action buttons with background and blur */}
        <div className="absolute right-3 bottom-2 z-10 flex items-center gap-0.5 rounded-lg bg-background/80 px-1 py-1 opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
          {canEdit && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(e, announcement.id)
              }}
            >
              <HugeiconsIcon
                icon={Edit03Icon}
                strokeWidth={2}
                className="h-3.5 w-3.5"
              />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive/90"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(e, announcement.id)
            }}
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              strokeWidth={2}
              className="h-3.5 w-3.5"
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}