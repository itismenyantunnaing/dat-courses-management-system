"use client"

import React from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  RefreshIcon,
  ArrowRight01Icon,
  Cancel01Icon,
  Tick02Icon,
  UserSwitchIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface GroupRequestsTabProps {
  enrollments: any[]
  onRefresh: () => void
  onApprove: (enrollmentId: number) => void
  onReject: (enrollmentId: number) => void
  isProcessing?: boolean
}

const getInitials = (name: string) => {
  if (!name) return "??"
  const parts = name.split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// Helper function to get status badge styling
const getRequestStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-500 text-white"
    case "APPROVED":
      return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
    case "REJECTED":
      return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
    default:
      return "bg-gray-500 text-white"
  }
}

export function GroupRequestsTab({
  enrollments,
  onRefresh,
  onApprove,
  onReject,
  isProcessing = false,
}: GroupRequestsTabProps) {
  const pendingRequests = enrollments.filter(
    (e: any) => e.groupChangeStatus === "PENDING"
  )
  const approvedRequests = enrollments.filter(
    (e: any) => e.groupChangeStatus === "APPROVED"
  )
  const rejectedRequests = enrollments.filter(
    (e: any) => e.groupChangeStatus === "REJECTED"
  )

  // Check if there are no pending requests
  const hasNoPendingRequests = pendingRequests.length === 0

  // Render a single request card
  const renderRequestCard = (request: any, status: string) => {
    const isPending = status === "PENDING"
    const statusBadgeClass = getRequestStatusBadge(status)
    const statusLabel = status.charAt(0) + status.slice(1).toLowerCase()

    return (
      <Card
        key={request.id}
        className={cn(
          "group cursor-default py-4 transition-colors hover:bg-muted/40",
          isPending && "border-yellow-200"
        )}
      >
        <CardContent className="relative px-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="mb-4 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={request.pfImage || ""}
                    alt={request.employeeName}
                  />
                  <AvatarFallback className="text-primary">
                    {getInitials(request.employeeName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {request.employeeName}
                  </h3>
                  <span className="text-muted-foreground">
                    {request.email || "-"}
                  </span>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-muted-foreground uppercase">
                    Department
                  </span>
                  {request.departmentName || "-"}
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground uppercase">
                    Team
                  </span>
                  {request.teamName || "-"}
                </div>
                <div className="col-span-2">
                  <span className="block text-xs text-muted-foreground uppercase">
                    Group Change
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {request.courseGroupName || "Unknown"}
                    </span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={1.5}
                      className="h-3 w-3 text-muted-foreground"
                    />
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isPending
                          ? "text-yellow-700"
                          : status === "APPROVED"
                            ? "text-green-700"
                            : "text-red-700"
                      )}
                    >
                      {request.requestedCourseGroupName || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
              {/* Status Badge - Top Right */}
              {/* <div className="absolute top-3 right-3">
                <Badge className={statusBadgeClass}>{statusLabel}</Badge>
              </div> */}
              {/* Action Buttons - Bottom Right, only for pending requests */}
              {isPending && (
                <div className="absolute right-3 bottom-0 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                    onClick={() => onApprove(request.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                    ) : (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        strokeWidth={2}
                        className="h-4 w-4"
                      />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive/90"
                    onClick={() => onReject(request.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                    ) : (
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        strokeWidth={2}
                        className="h-4 w-4"
                      />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TabsContent value="group-requests" className="pt-4">
      {hasNoPendingRequests ? (
        // Empty State - No pending requests
        <Empty className="h-full">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon
                icon={UserSwitchIcon}
                strokeWidth={1.5}
                className="h-12 w-12"
              />
            </EmptyMedia>
            <EmptyTitle>No Group Change Requests</EmptyTitle>
            <EmptyDescription className="max-w-xs text-pretty">
              All group change requests have been processed. New requests will
              appear here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                  Processing...
                </>
              ) : (
                <>
                  <HugeiconsIcon
                    icon={RefreshIcon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                  Refresh
                </>
              )}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        // Normal view with header and content
        <div>
          <CardHeader className="px-0">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="flex items-center gap-2 text-xl font-semibold">
                  Group Change Requests
                </h4>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                    Processing...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={RefreshIcon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {pendingRequests.map((request: any) =>
                renderRequestCard(request, "PENDING")
              )}
            </div>
          </CardContent>
        </div>
      )}
    </TabsContent>
  )
}
