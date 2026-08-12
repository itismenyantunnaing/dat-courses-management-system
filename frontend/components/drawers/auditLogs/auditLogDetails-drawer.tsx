"use client"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ClockIcon,
} from "@hugeicons/core-free-icons"
import { resolveUploadUrl} from "@/lib/utils"

// Types - Updated to match API response
interface AuditLog {
  id: number
  employeeId: string
  employeeName: string | null
  employeeRole: string | null
  employeeProfilePhotoPath: string | null
  action: string
  module: string
  oldValue: string | null
  newValue: string | null
  description: string
  ipAddress: string
  createdAt: string
}

interface AuditLogDetailsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: AuditLog | null
}

// Helper to get initials
const getInitials = (name: string | null) => {
  if (!name) return "U"
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"
  )
}

// Helper to parse JSON or return as is
const parseJSON = (value: string | null) => {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

// Helper to format JSON for display
const formatJSON = (value: string | null) => {
  if (!value) return "-"
  try {
    const parsed = JSON.parse(value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return value
  }
}

// Helper to get changed fields (for diff view)
const getChangedFields = (oldValue: string | null, newValue: string | null) => {
  const old = parseJSON(oldValue)
  const newVal = parseJSON(newValue)

  if (
    !old ||
    !newVal ||
    typeof old !== "object" ||
    typeof newVal !== "object"
  ) {
    return null
  }

  const changes: { field: string; old: any; new: any }[] = []
  const allKeys = new Set([...Object.keys(old), ...Object.keys(newVal)])

  allKeys.forEach((key) => {
    if (old[key] !== newVal[key]) {
      changes.push({
        field: key,
        old: old[key] ?? "null",
        new: newVal[key] ?? "null",
      })
    }
  })

  return changes
}

// Get action badge color
const getActionBadge = (action: string) => {
  switch (action?.toUpperCase()) {
    case "CREATE":
      return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
    case "UPDATE":
      return "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
    case "DELETE":
      return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
    default:
      return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300"
  }
}

// Helper to format values for display
const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'object') {
    // For nested objects, show a summary or JSON string
    if (Array.isArray(value)) {
      return `Array(${value.length})`
    }
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

// Format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AuditLogDetailsDrawer({
  open,
  onOpenChange,
  log,
}: AuditLogDetailsDrawerProps) {
  if (!log) return null

  const changes = getChangedFields(log.oldValue, log.newValue)

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="right-0 left-auto h-full w-[90%] sm:w-[80%] md:w-[65%] lg:w-[55%] xl:w-[45%]">
        <DrawerHeader className="shrink-0 border-b">
          <div className="flex items-center gap-2">
            <div className="flex w-full items-center justify-between gap-2">
              <DrawerTitle className="text-lg font-semibold">
                Audit Log Details
              </DrawerTitle>
              <div className="flex items-center gap-1 text-muted-foreground">
                <HugeiconsIcon
                  icon={ClockIcon}
                  strokeWidth={2}
                  className="h-4 w-4"
                />
                <p className="text-sm">
                  {formatDate(log.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Employee Info with Avatar */}
          <div className="mb-6 flex w-full items-center justify-between">
            <div className="flex items-center gap-2 rounded-lg py-2">
              <Avatar className="h-12 w-12 rounded-full">
                <AvatarImage
                    src={
                        resolveUploadUrl(log.employeeProfilePhotoPath) ||
                        "/avatars/default.jpg"
                    }
                  alt={log.employeeName || "User"}
                />
                <AvatarFallback className="rounded-full text-sm font-medium">
                  {getInitials(log.employeeName)}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="text-base font-semibold">
                  {log.employeeName || "Unknown User"}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{log.employeeId}</span>
                  {log.employeeRole && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {log.employeeRole}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium">IP Address</h4>
              <p className="text-sm text-muted-foreground">{log.ipAddress}</p>
            </div>
          </div>

          {/* Description */}
          {log.description && (
            <div className="mb-4 rounded-lg border p-3">
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">Description</h4>
              <p className="text-sm">{log.description}</p>
            </div>
          )}

          {/* Changes Section - Old and New Value in one row */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold">Changes</h4>
              <Badge className={getActionBadge(log.action)}>{log.action}</Badge>
              <span className="text-sm text-muted-foreground">in</span>
              <Badge variant="outline" className="text-xs">
                {log.module}
              </Badge>
            </div>

            {/* If there are changes, show diff view */}
            {changes && changes.length > 0 ? (
              <div className="space-y-3">
                {changes.map((change, idx) => (
                  <div key={idx} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {change.field}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        changed
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-red-50 p-2 dark:bg-red-950/20">
                        <p className="text-[10px] font-medium text-red-600 dark:text-red-400">
                          Old Value
                        </p>
                        <div className="font-mono text-sm text-red-700 dark:text-red-300 break-all">
                          {typeof change.old === 'object' ? (
                            <pre className="whitespace-pre-wrap text-xs select-text">
                              {JSON.stringify(change.old, null, 2)}
                            </pre>
                          ) : (
                            <span className="select-text">{String(change.old)}</span>
                          )}
                        </div>
                      </div>
                      <div className="rounded-md bg-green-50 p-2 dark:bg-green-950/20">
                        <p className="text-[10px] font-medium text-green-600 dark:text-green-400">
                          New Value
                        </p>
                        <div className="font-mono text-sm font-medium text-green-700 dark:text-green-300 break-all">
                          {typeof change.new === 'object' ? (
                            <pre className="whitespace-pre-wrap text-xs select-text">
                              {JSON.stringify(change.new, null, 2)}
                            </pre>
                          ) : (
                            <span className="select-text">{String(change.new)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Show full JSON if no specific changes detected
              <div className="grid grid-cols-2 gap-3">
                {/* Old Value */}
                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Old Value
                  </p>
                  {log.oldValue ? (
                    <pre className="max-h-60 overflow-auto rounded bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap break-all">
                      {formatJSON(log.oldValue)}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No previous value
                    </p>
                  )}
                </div>

                {/* New Value */}
                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    New Value
                  </p>
                  {log.newValue ? (
                    <pre className="max-h-60 overflow-auto rounded bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap break-all">
                      {formatJSON(log.newValue)}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No new value
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}