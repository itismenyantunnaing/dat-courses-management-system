"use client"

import { useState, useRef } from "react"
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
import { Attachment01Icon, NotificationIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: number
  actorName: string
  actorAvatar?: string
  action: string
  target: string
  targetBold?: boolean
  time: string
  course?: string // Only for course type
  unread: boolean
  type: "edit" | "create" | "course" | "certificate" | "jlpt"
  category: "all" | "course" | "certificate" | "jlpt"
  actions?: {
    label: string
    variant: "outline" | "default"
    onClick: () => void
  }[]
  attachment?: {
    name: string
    icon?: React.ReactNode
  }
}

// Mock notifications data with categories
const notificationsData: Notification[] = [
  {
    id: 1,
    actorName: "Dr. Sarah Johnson",
    actorAvatar: "/avatars/sarah.jpg",
    action: "published a new course",
    target: "Advanced React Patterns",
    targetBold: true,
    time: "15 mins ago",
    course: "Learning Platform",
    unread: true,
    type: "course",
    category: "course",
  },
  {
    id: 2,
    actorName: "Prof. Michael Chen",
    actorAvatar: "/avatars/michael.jpg",
    action: "updated the",
    target: "JavaScript Mastery",
    targetBold: true,
    time: "1 hour ago",
    course: "Code Academy",
    unread: true,
    type: "course",
    category: "course",
    attachment: {
      name: "JS_Mastery_v2.0.pdf",
    },
  },
  {
    id: 3,
    actorName: "Certification Board",
    actorAvatar: "/avatars/cert-board.jpg",
    action: "issued a new certificate for",
    target: "Full Stack Development",
    targetBold: true,
    time: "2 hours ago",
    course: "Certification Program",
    unread: true,
    type: "certificate",
    category: "certificate",
    actions: [
      { label: "View", variant: "outline", onClick: () => {} },
      { label: "Approve", variant: "default", onClick: () => {} },
    ],
  },
  {
    id: 4,
    actorName: "JLPT Admin",
    actorAvatar: "/avatars/jlpt-admin.jpg",
    action: "announced",
    target: "JLPT N2 Exam Registration",
    targetBold: true,
    time: "3 hours ago",
    course: undefined,
    unread: true,
    type: "jlpt",
    category: "jlpt",
    actions: [{ label: "Enroll Now", variant: "default", onClick: () => {} }],
  },
  {
    id: 5,
    actorName: "Polly",
    actorAvatar: "/avatars/polly.jpg",
    action: "edited",
    target: "Contact page",
    targetBold: true,
    time: "36 mins ago",
    course: undefined,
    unread: false,
    type: "edit",
    category: "all",
  },
  {
    id: 7,
    actorName: "Certification Board",
    actorAvatar: "/avatars/cert-board.jpg",
    action: "updated the",
    target: "Cloud Architecture Certificate",
    targetBold: true,
    time: "5 hours ago",
    course: "Certification Program",
    unread: false,
    type: "certificate",
    category: "certificate",
  },
  {
    id: 8,
    actorName: "Mary",
    actorAvatar: "/avatars/mary.jpg",
    action: "created a new",
    target: "Group 2",
    targetBold: true,
    time: "3 hours ago",
    course: undefined,
    unread: false,
    type: "create",
    category: "all",
  },
  {
    id: 9,
    actorName: "Dima Phizeg",
    actorAvatar: "/avatars/dima.jpg",
    action: "edited",
    target: "ACME 2.1",
    targetBold: true,
    time: "3 hours ago",
    course: undefined,
    unread: false,
    type: "edit",
    category: "all",
    attachment: {
      name: "ACME_guideline.pdf",
    },
  },
  {
    id: 10,
    actorName: "Dr. Emily Watson",
    actorAvatar: "/avatars/emily.jpg",
    action: "announced",
    target: "JLPT N3 Study Group",
    targetBold: true,
    time: "1 day ago",
    course: "JLPT Exam Center",
    unread: false,
    type: "jlpt",
    category: "jlpt",
  },
]

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
}

export function NotificationsDrawer({
  open,
  onOpenChange,
}: NotificationsDrawerProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(notificationsData)
  const [activeTab, setActiveTab] = useState<TabType>("all")
  const tabsScrollRef = useRef<HTMLDivElement>(null)

  const filteredNotifications = notifications.filter(
    (n) => activeTab === "all" || n.category === activeTab
  )

  const unreadCount = notifications.filter((n) => n.unread).length
  const filteredUnreadCount = filteredNotifications.filter(
    (n) => n.unread
  ).length

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    )
  }

  const getTabCount = (tabId: TabType) => {
    if (tabId === "all") return unreadCount
    return notifications.filter((n) => n.category === tabId && n.unread).length
  }

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsScrollRef.current) {
      const scrollAmount = 200
      const newScrollLeft =
        direction === "left"
          ? tabsScrollRef.current.scrollLeft - scrollAmount
          : tabsScrollRef.current.scrollLeft + scrollAmount
      tabsScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      })
    }
  }

  // Helper to render notification content based on type
  const renderNotificationContent = (notification: Notification) => {
    const baseContent = (
      <>
        <span className="font-semibold">{notification.actorName}</span>
        <span className="text-gray-500"> {notification.action} </span>
        {notification.targetBold ? (
          <span className="font-semibold">{notification.target}</span>
        ) : (
          <span>{notification.target}</span>
        )}
      </>
    )

    // For course type, show project name
    if (notification.type === "course" && notification.course) {
      return (
        <>
          {baseContent}
          <span className="text-gray-500"> for </span>
          <span className="font-semibold">{notification.course}</span>
        </>
      )
    }

    return baseContent
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
            {unreadCount > 0 && (
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

        {/* Tabs with scroll */}
        <div className="relative border-b border-gray-100 px-4">
          {/* Scrollable Tabs Container */}
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
        <div className="flex-1 cursor-pointer scrollbar-thin overflow-auto">
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
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 pt-0.5">
                      <Avatar className="h-10 w-10 rounded-full">
                        <AvatarImage
                          src={
                            notification.actorAvatar || "/avatars/default.jpg"
                          }
                          alt={notification.actorName}
                        />
                        <AvatarFallback className="rounded-full text-xs font-semibold text-gray-600">
                          {getInitials(notification.actorName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {/* Title line */}
                      <p className="text-[15px] leading-snug text-gray-900">
                        {renderNotificationContent(notification)}
                      </p>

                      {/* Meta line */}
                      <p className="mt-1 text-[13px] text-gray-400">
                        {notification.time}
                        {notification.type === "course" &&
                          notification.course && (
                            <>
                              <span className="mx-1.5">•</span>
                              {notification.course}
                            </>
                          )}
                        {notification.type === "certificate" &&
                          notification.course && (
                            <>
                              <span className="mx-1.5">•</span>
                              {notification.course}
                            </>
                          )}
                        {notification.type === "jlpt" &&
                          notification.course && (
                            <>
                              <span className="mx-1.5">•</span>
                              {notification.course}
                            </>
                          )}
                      </p>

                      {/* Action buttons */}
                      {notification.actions && (
                        <div className="mt-3 flex items-center gap-2">
                          {notification.actions.map((action, i) => (
                            <Button
                              key={i}
                              variant={action.variant}
                              size="sm"
                              onClick={action.onClick}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Attachment */}
                      {notification.attachment && (
                        <div className="mt-3 flex items-center gap-2">
                          <HugeiconsIcon
                            icon={Attachment01Icon}
                            strokeWidth={2}
                            className="h-4 w-4 text-gray-400"
                          />
                          <span className="text-[13px] text-gray-500">
                            {notification.attachment.name}
                          </span>
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
