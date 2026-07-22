"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import { ClockIcon, Delete02Icon, Edit03Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

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
}

export function FeedbackCard({
  feedback,
  onClick,
  onDelete,
  onEdit,
  formatTime,
  getInitials,
  canEdit = false,
}: FeedbackCardProps) {
  // Get the time to display - use updatedAt if exists, otherwise createdAt
  const getDisplayTime = () => {
    if (feedback.updatedAt) {
      return formatTime(feedback.updatedAt)
    }
    return formatTime(feedback.createdAt)
  }

  return (
    <Card
      className="group h-full cursor-pointer transition-all hover:bg-muted/40"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage
                src={feedback.employee.avatar || ""}
                alt={feedback.employee.name}
              />
              <AvatarFallback className="text-primary">
                {getInitials(feedback.employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-medium truncate">
                {feedback.employee.name}
              </CardTitle>
              <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                <span className="truncate">{feedback.employee.department}</span>
                <span className="flex-shrink-0">•</span>
                <span className="truncate">{feedback.employee.team}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground flex-shrink-0 ml-2">
            <HugeiconsIcon
              icon={ClockIcon}
              strokeWidth={2}
              className="h-3 w-3 flex-shrink-0"
            />
            {getDisplayTime()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative pb-10 pt-1">
        <h4 className="mb-1 text-sm font-medium truncate">{feedback.subject}</h4>
        <div 
          className="line-clamp-2 text-sm text-muted-foreground pr-12"
          style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word'
          }}
        >
          {feedback.description}
        </div>
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {canEdit && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-primary/10"
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
        </div>
      </CardContent>
    </Card>
  )
}