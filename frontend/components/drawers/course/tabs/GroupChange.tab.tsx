// components/course/tabs/GroupChangeTab.tsx
"use client"

import React, { useState } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  RefreshIcon,
  ArrowRight01Icon,
  CheckCircle,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

interface GroupChangeTabProps {
  course: any
  currentUserEnrollment: any
  onRequestGroupChange: (groupId: string) => void
}

const getGroupChangeStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-700 border-yellow-200"
    case "APPROVED":
      return "bg-green-100 text-green-700 border-green-200"
    case "REJECTED":
      return "bg-red-100 text-red-700 border-red-200"
    case "NONE":
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

const getGroupChangeStatusLabel = (status: string) => {
  switch (status) {
    case "PENDING":
      return "Pending Review"
    case "APPROVED":
      return "Approved"
    case "REJECTED":
      return "Rejected"
    case "NONE":
    default:
      return "Current Group"
  }
}

export function GroupChangeTab({
  course,
  currentUserEnrollment,
  onRequestGroupChange,
}: GroupChangeTabProps) {
  const [selectedRequestGroupId, setSelectedRequestGroupId] =
    useState<string>("")
  const [isRequestingGroupChange, setIsRequestingGroupChange] = useState(false)

  const handleRequest = () => {
    if (!selectedRequestGroupId) {
      alert("Please select a group to request")
      return
    }

    const selectedGroup = course.groups?.find(
      (g: any) => g.id === selectedRequestGroupId
    )
    const groupName = selectedGroup?.name || `Group ${selectedRequestGroupId}`

    if (
      !confirm(`Are you sure you want to request to change to "${groupName}"?`)
    ) {
      return
    }

    setIsRequestingGroupChange(true)
    onRequestGroupChange(selectedRequestGroupId)
    setIsRequestingGroupChange(false)
  }

  return (
    <TabsContent value="group-change" className="pt-4">
      <Card>
        <CardHeader className="bg-muted/30">
          <h4 className="flex items-center gap-2 text-lg font-semibold">
            <HugeiconsIcon
              icon={RefreshIcon}
              strokeWidth={1.5}
              className="h-5 w-5"
            />
            Request Group Change
          </h4>
          <p className="text-sm text-muted-foreground">
            Request to move to a different group. An admin will review your
            request.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-primary">
                  {currentUserEnrollment?.courseGroupName || "N/A"}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  getGroupChangeStatusColor(
                    currentUserEnrollment?.groupChangeStatus || "NONE"
                  )
                )}
              >
                {getGroupChangeStatusLabel(
                  currentUserEnrollment?.groupChangeStatus || "NONE"
                )}
              </Badge>
            </div>
          </div>

          {currentUserEnrollment?.groupChangeStatus !== "PENDING" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select New Group</Label>
                <Select
                  value={selectedRequestGroupId}
                  onValueChange={setSelectedRequestGroupId}
                  disabled={isRequestingGroupChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a group..." />
                  </SelectTrigger>
                  <SelectContent>
                    {course.groups?.map((group: any) => {
                      const groupId = parseInt(group.id)
                      const isCurrentGroup =
                        groupId === currentUserEnrollment?.courseGroupId

                      return (
                        <SelectItem
                          key={group.id}
                          value={group.id}
                          disabled={isCurrentGroup}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span>
                              {group.name}
                              {isCurrentGroup && " (Current)"}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {selectedRequestGroupId && (
                  <p className="text-xs text-muted-foreground">
                    You are requesting to move to:{" "}
                    {
                      course.groups?.find(
                        (g: any) => g.id === selectedRequestGroupId
                      )?.name
                    }
                  </p>
                )}
              </div>

              <Button
                onClick={handleRequest}
                disabled={!selectedRequestGroupId || isRequestingGroupChange}
                className="w-full gap-2"
              >
                {isRequestingGroupChange ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                    Submit Group Change Request
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                strokeWidth={2}
                className="mx-auto mb-2 h-8 w-8 text-yellow-600"
              />
              <p className="text-sm font-medium text-yellow-700">
                Request Pending
              </p>
              <p className="mt-1 text-xs text-yellow-600">
                Your group change request is being reviewed by an admin. You
                will be notified when it's approved or rejected.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Requested Group:{" "}
                {currentUserEnrollment?.requestedCourseGroupName || "N/A"}
              </p>
            </div>
          )}

          {currentUserEnrollment?.groupChangeStatus === "APPROVED" && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <HugeiconsIcon
                icon={CheckCircle}
                strokeWidth={2}
                className="mx-auto mb-2 h-8 w-8 text-green-600"
              />
              <p className="text-sm font-medium text-green-700">
                Request Approved!
              </p>
              <p className="mt-1 text-xs text-green-600">
                Your group change has been approved. You are now in:{" "}
                {currentUserEnrollment?.courseGroupName}
              </p>
            </div>
          )}

          {currentUserEnrollment?.groupChangeStatus === "REJECTED" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                strokeWidth={2}
                className="mx-auto mb-2 h-8 w-8 text-red-600"
              />
              <p className="text-sm font-medium text-red-700">
                Request Rejected
              </p>
              <p className="mt-1 text-xs text-red-600">
                Your group change request was rejected. You can submit a new
                request.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}
