// components/course/tabs/GroupRequestsTab.tsx
"use client"

import React from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserGroupIcon,
  RefreshIcon,
  ArrowRight01Icon,
  CheckCircle,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"

interface GroupRequestsTabProps {
  enrollments: any[]
  onRefresh: () => void
  onApprove: (enrollmentId: number) => void
  onReject: (enrollmentId: number) => void
}

const getInitials = (name: string) => {
  if (!name) return "??"
  const parts = name.split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export function GroupRequestsTab({
  enrollments,
  onRefresh,
  onApprove,
  onReject,
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

  return (
    <TabsContent value="group-requests" className="pt-4">
      <Card>
        <CardHeader className="bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="flex items-center gap-2 text-lg font-semibold">
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  strokeWidth={1.5}
                  className="h-5 w-5"
                />
                Group Change Requests
              </h4>
              <p className="text-sm text-muted-foreground">
                Review and manage group change requests from learners
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="gap-2"
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                strokeWidth={2}
                className="h-4 w-4"
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {pendingRequests.length === 0 &&
          approvedRequests.length === 0 &&
          rejectedRequests.length === 0 ? (
            <div className="py-8 text-center">
              <HugeiconsIcon
                icon={UserGroupIcon}
                strokeWidth={1.5}
                className="mx-auto h-12 w-12 text-muted-foreground/50"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                No group change requests found
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingRequests.length > 0 && (
                <div>
                  <h5 className="mb-3 flex items-center gap-2 text-sm font-medium text-yellow-700">
                    <Badge className="bg-yellow-500 text-white">
                      Pending ({pendingRequests.length})
                    </Badge>
                  </h5>
                  <div className="space-y-3">
                    {pendingRequests.map((request: any) => (
                      <div
                        key={request.id}
                        className="rounded-lg border border-yellow-200 bg-yellow-50/30 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-1 items-start gap-3">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={request.pfImage || ""} />
                              <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                                {getInitials(request.employeeName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">
                                {request.employeeName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {request.email}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-muted-foreground">
                                  Current:{" "}
                                  <span className="font-medium">
                                    {request.courseGroupName}
                                  </span>
                                </span>
                                <HugeiconsIcon
                                  icon={ArrowRight01Icon}
                                  strokeWidth={1.5}
                                  className="h-3 w-3 text-muted-foreground"
                                />
                                <span className="text-muted-foreground">
                                  Requested:{" "}
                                  <span className="font-medium text-yellow-700">
                                    {request.requestedCourseGroupName ||
                                      "Unknown"}
                                  </span>
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Department: {request.departmentName} • Team:{" "}
                                {request.teamName}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              size="sm"
                              className="h-8 gap-1 bg-green-600 text-white hover:bg-green-700"
                              onClick={() => onApprove(request.id)}
                            >
                              <HugeiconsIcon
                                icon={CheckCircle}
                                strokeWidth={2}
                                className="h-3 w-3"
                              />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 gap-1"
                              onClick={() => onReject(request.id)}
                            >
                              <HugeiconsIcon
                                icon={Cancel01Icon}
                                strokeWidth={2}
                                className="h-3 w-3"
                              />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {approvedRequests.length > 0 && (
                <div>
                  <h5 className="mb-3 flex items-center gap-2 text-sm font-medium text-green-700">
                    <Badge className="bg-green-500 text-white">
                      Approved ({approvedRequests.length})
                    </Badge>
                  </h5>
                  <div className="space-y-2">
                    {approvedRequests.map((request: any) => (
                      <div
                        key={request.id}
                        className="rounded-lg border border-green-200 bg-green-50/30 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={request.pfImage || ""} />
                              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                                {getInitials(request.employeeName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {request.employeeName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Old: {request.courseGroupName}</span>
                                <HugeiconsIcon
                                  icon={ArrowRight01Icon}
                                  strokeWidth={1.5}
                                  className="h-3 w-3"
                                />
                                <span className="font-medium text-green-700">
                                  New:{" "}
                                  {request.requestedCourseGroupName ||
                                    request.courseGroupName}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-green-500 text-[10px] text-white">
                            Approved
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rejectedRequests.length > 0 && (
                <div>
                  <h5 className="mb-3 flex items-center gap-2 text-sm font-medium text-red-700">
                    <Badge className="bg-red-500 text-white">
                      Rejected ({rejectedRequests.length})
                    </Badge>
                  </h5>
                  <div className="space-y-2">
                    {rejectedRequests.map((request: any) => (
                      <div
                        key={request.id}
                        className="rounded-lg border border-red-200 bg-red-50/30 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={request.pfImage || ""} />
                              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                                {getInitials(request.employeeName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {request.employeeName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Requested:{" "}
                                {request.requestedCourseGroupName || "Unknown"}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-red-500 text-[10px] text-white">
                            Rejected
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}
