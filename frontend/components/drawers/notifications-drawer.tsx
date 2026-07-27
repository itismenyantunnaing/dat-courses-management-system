"use client"

import { useState, useRef, useEffect } from "react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import { NotificationIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { mainStore } from "@/store/mainStore"

interface Notification {
  id: number
  message: string
  time: string
  unread: boolean
  type: "COURSE" | "CERTIFICATE" | "JLPT_EXAM"
  category: "all" | "course" | "certificate" | "jlpt"
  certificateId?: number | null
  courseId?: number | null
  actions?: {
    label: string
    variant: "outline" | "default"
    onClick: () => void
  }[]
}

// Tab configuration
const TABS = [
  { id: "all", label: "All" },
  { id: "course", label: "Course" },
  { id: "certificate", label: "Certificate" },
  { id: "jlpt", label: "JLPT Exam" },
] as const

type TabType = (typeof TABS)[number]["id"]

interface NotificationsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction?: (action: 'view-course' | 'view-certificate', id: number) => void
}

export function NotificationsDrawer({
  open,
  onOpenChange,
  onAction,
}: NotificationsDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all")
  const tabsScrollRef = useRef<HTMLDivElement>(null)

  const {
    notifications: storeNotifications,
    unreadCount,
    fetch_Notifications,
    fetch_UnreadCount,
    mark_NotificationRead,
    mark_AllNotificationsRead,
    isLoading,
    profile
  } = mainStore()

  const employeeId = profile?.id;

  useEffect(() => {
    if (open && employeeId) {
      fetch_Notifications(employeeId, false)
      fetch_UnreadCount(employeeId)
    }
  }, [open, employeeId, fetch_Notifications, fetch_UnreadCount])

  // Transform API notifications to UI format
  const transformNotifications = (): Notification[] => {
    if (!storeNotifications || storeNotifications.length === 0) {
      return []
    }

    return storeNotifications.map((notif: any) => {
      // Map backend type to category
      let category: Notification["category"] = "all"
      if (notif.type === "COURSE") category = "course"
      else if (notif.type === "CERTIFICATE") category = "certificate"
      else if (notif.type === "JLPT_EXAM") category = "jlpt"

      return {
        id: notif.id,
        message: notif.message || "",
        time: formatTime(notif.createdAt),
        unread: !notif.read,
        type: notif.type,
        category: category,
        certificateId: notif.certificateId,
        courseId: notif.courseId,
        actions: getActionsForType(notif),
      }
    })
  }

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "Just now"
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} mins ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getActionsForType = (notif: any) => {
    const actions = []

    if (notif.type === "COURSE" && notif.courseId) {
      actions.push({
        label: "View Course",
        variant: "outline" as const,
        onClick: () => {
          onOpenChange(false)
          // Call the onAction callback with the course ID
          onAction?.('view-course', notif.courseId)
        }
      })
    } else if (notif.type === "CERTIFICATE" && notif.certificateId) {
      actions.push({
        label: "View Certificate",
        variant: "outline" as const,
        onClick: () => {
          onOpenChange(false)
          // Call the onAction callback with the certificate ID
          onAction?.('view-certificate', notif.certificateId)
        }
      })
    }

    return actions.length > 0 ? actions : undefined
  }

  const notifications = transformNotifications()

  const filteredNotifications = notifications.filter(
    (n) => activeTab === "all" || n.category === activeTab
  )

  const handleMarkAllAsRead = async () => {
    if (employeeId) {
      await mark_AllNotificationsRead(employeeId)
      await fetch_Notifications(employeeId, false)
      await fetch_UnreadCount(employeeId)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    if (employeeId) {
      await mark_NotificationRead(id, employeeId)
      await fetch_Notifications(employeeId, false)
      await fetch_UnreadCount(employeeId)
    }
  }

  const getTabCount = (tabId: TabType) => {
    if (tabId === "all") {
      return unreadCount || 0
    }
    return notifications.filter((n) => n.category === tabId && n.unread).length
  }

  if (isLoading && notifications.length === 0) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="right-0 left-auto h-full w-[500px] rounded-l-2xl border-l border-gray-100 bg-white shadow-2xl">
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-gray-400">Loading notifications...</p>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="right-0 left-auto h-full w-[500px] rounded-l-2xl border-l border-gray-100 bg-white shadow-2xl">
        {/* Header */}
        <DrawerHeader className="flex flex-row items-start justify-between border-gray-100 px-5 pt-5">
          <div>
            <DrawerTitle className="text-lg font-semibold text-gray-900">
              Notifications
            </DrawerTitle>
          </div>
          <div className="flex items-center gap-2">
            {(unreadCount || 0) > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
              >
                Mark all as read
              </Button>
            )}
          </div>
        </DrawerHeader>

        {/* Tabs */}
        <div className="relative border-b border-gray-100 px-4">
          <div
            ref={tabsScrollRef}
            className="scrollbar-none overflow-x-auto"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabType)}
              className="w-full"
            >
              <TabsList variant="line" className="w-max gap-1">
                {TABS.map((tab) => {
                  const count = getTabCount(tab.id)
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 whitespace-nowrap"
                    >
                      {tab.label}
                      {count > 0 && (
                        <Badge
                          variant="secondary"
                          className="flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                        >
                          {count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              <TabsContent value="all" className="mt-0" />
              <TabsContent value="course" className="mt-0" />
              <TabsContent value="certificate" className="mt-0" />
              <TabsContent value="jlpt" className="mt-0" />
            </Tabs>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 scrollbar-thin overflow-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HugeiconsIcon
                icon={NotificationIcon}
                strokeWidth={2}
                className="mb-3 h-12 w-12 text-gray-300"
              />
              <p className="text-sm text-gray-400">
                No {activeTab === "all" ? "" : activeTab} notifications
              </p>
            </div>
          ) : (
            <div>
              {filteredNotifications.map((notification, index) => {
                const isLast = index === filteredNotifications.length - 1

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative flex gap-3 px-5 py-4 transition-colors hover:bg-gray-50",
                      !isLast && "border-b border-gray-100"
                    )}
                    onClick={() => {
                      if (notification.unread && employeeId) {
                        handleMarkAsRead(notification.id)
                      }
                    }}
                  >
                    {/* System Icon - No avatar, just a bell icon */}
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <HugeiconsIcon
                          icon={NotificationIcon}
                          strokeWidth={2}
                          className="h-5 w-5 text-gray-500"
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-snug text-gray-900">
                        {notification.message}
                      </p>

                      <p className="mt-1 text-[13px] text-gray-400">
                        {notification.time}
                      </p>

                      {/* Action buttons */}
                      {notification.actions && notification.actions.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          {notification.actions.map((action, i) => (
                            <Button
                              key={i}
                              variant={action.variant}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                action.onClick()
                              }}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Unread dot */}
                    {notification.unread && (
                      <div className="flex-shrink-0 pt-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}