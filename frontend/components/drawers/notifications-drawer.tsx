// components/drawers/notifications-drawer.tsx
"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
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

  // Get from mainStore (database)
  const {
    notifications: dbNotifications,
    unreadCount,
    fetch_Notifications,
    fetch_UnreadCount,
    mark_NotificationRead,
    mark_AllNotificationsRead,
    isLoading,
    profile
  } = mainStore()

  const employeeId = profile?.id;

  // Load database notifications when drawer opens
  useEffect(() => {
    if (open && employeeId) {
      fetch_Notifications(employeeId, false)
      fetch_UnreadCount(employeeId)
    }
  }, [open, employeeId, fetch_Notifications, fetch_UnreadCount])

  const formatTime = (timestamp: string | Date) => {
    if (!timestamp) return "Just now"
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
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

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: number) => {
    if (employeeId) {
      try {
        // Call the store function which already handles optimistic updates
        await mark_NotificationRead(notificationId, employeeId)
        // After marking as read, refresh the list to ensure consistency
        await fetch_Notifications(employeeId, false)
        await fetch_UnreadCount(employeeId)
        console.log(`✅ Notification ${notificationId} marked as read`)
      } catch (error) {
        console.error("Failed to mark notification as read:", error)
      }
    }
  }

  // Handle action click (View Course / View Certificate)
  const handleActionClick = async (notification: Notification, actionType: 'view-course' | 'view-certificate', id: number) => {
    // Mark as read first if unread
    if (notification.unread) {
      await markNotificationAsRead(notification.id)
    }
    
    // Close drawer and execute action
    onOpenChange(false)
    onAction?.(actionType, id)
  }

  // Handle marking all as read
  const handleMarkAllAsRead = async () => {
    if (employeeId) {
      try {
        await mark_AllNotificationsRead(employeeId)
        await fetch_Notifications(employeeId, false)
        await fetch_UnreadCount(employeeId)
        console.log('✅ All notifications marked as read')
      } catch (error) {
        console.error("Failed to mark all as read:", error)
      }
    }
  }

  // Handle clicking on notification (mark as read)
  const handleNotificationClick = async (notification: Notification) => {
    if (notification.unread) {
      await markNotificationAsRead(notification.id)
    }
  }

  // Format notifications with proper unread status
  const allNotifications: Notification[] = useMemo(() => {
    if (!dbNotifications || dbNotifications.length === 0) return []
    
    return dbNotifications.map((notif: any) => {
      let category: Notification["category"] = "all"
      if (notif.type === "COURSE") category = "course"
      else if (notif.type === "CERTIFICATE") category = "certificate"
      else if (notif.type === "JLPT_EXAM") category = "jlpt"

      return {
        id: notif.id,
        message: notif.message || "",
        time: formatTime(notif.createdAt),
        unread: !notif.isRead, // Use the read status from the store
        type: notif.type,
        category: category,
        certificateId: notif.certificateId,
        courseId: notif.courseId,
      }
    }).sort((a, b) => {
      // Unread notifications come first
      if (a.unread && !b.unread) return -1
      if (!a.unread && b.unread) return 1
      
      // If both have same read status, sort by time (newest first)
      const timeA = new Date(a.time).getTime() || 0
      const timeB = new Date(b.time).getTime() || 0
      return timeB - timeA
    })
  }, [dbNotifications])

  const filteredNotifications = allNotifications.filter(
    (n) => activeTab === "all" || n.category === activeTab
  )

  // Get unread count from the store
  const getTabCount = (tabId: TabType) => {
    if (tabId === "all") {
      return unreadCount || 0
    }
    return allNotifications.filter((n) => n.category === tabId && n.unread).length
  }

  if (isLoading && !dbNotifications?.length) {
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
  console.log(dbNotifications)
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
                Mark all as read ({unreadCount})
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
                
                // Determine the action type for this notification
                let actionType: 'view-course' | 'view-certificate' | null = null
                let actionId: number | null = null
                
                if (notification.courseId) {
                  actionType = 'view-course'
                  actionId = notification.courseId
                } else if (notification.certificateId) {
                  actionType = 'view-certificate'
                  actionId = notification.certificateId
                }

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative flex gap-3 px-5 py-4 transition-all duration-200 hover:bg-gray-50 cursor-pointer",
                      !isLast && "border-b border-gray-100",
                      !notification.unread && "hover:bg-gray-50/50"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* System Icon - changes color based on read/unread */}
                    <div className="flex-shrink-0 pt-0.5">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-200",
                        notification.unread ? "bg-green-100" : "bg-gray-100"
                      )}>
                        <HugeiconsIcon
                          icon={NotificationIcon}
                          strokeWidth={2}
                          className={cn(
                            "h-5 w-5 transition-colors duration-200",
                            notification.unread ? "text-green-600" : "text-gray-400"
                          )}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "text-[15px] leading-snug transition-colors duration-200",
                        notification.unread ? "text-gray-900 font-medium" : "text-gray-600"
                      )}>
                        {notification.message}
                      </p>

                      <p className="mt-1 text-[13px] text-gray-400">
                        {notification.time}
                      </p>

                      {/* Action buttons */}
                      {actionType && actionId && (
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleActionClick(notification, actionType, actionId)
                            }}
                          >
                            View {actionType === 'view-course' ? 'Course' : 'Certificate'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Unread dot */}
                    {notification.unread && (
                      <div className="flex-shrink-0 pt-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
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