/* eslint-disable react-hooks/purity */
"use client"

import { useState } from "react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { NotificationIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

// Sample notifications data
const notificationsData = [
  {
    id: 1,
    title: "New message",
    description: "You have a new message from John",
    time: "2 minutes ago",
  },
  {
    id: 2,
    title: "Update available",
    description: "A new version of the app is available",
    time: "1 hour ago",
  },
  {
    id: 3,
    title: "Meeting reminder",
    description: "Team meeting in 30 minutes",
    time: "3 hours ago",
  },
]

interface NotificationsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationsDrawer({
  open,
  onOpenChange,
}: NotificationsDrawerProps) {
  const [notifications, setNotifications] = useState(notificationsData)

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="right-0 left-auto h-full w-[400px] rounded-l-lg">
        <DrawerHeader className="flex flex-row items-center justify-between px-4 py-4">
          <div className="flex-1">
            <DrawerTitle>Notifications</DrawerTitle>
            <DrawerDescription>
              Your recent notifications and updates
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-4 right-4"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                strokeWidth={2}
              />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-auto px-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <HugeiconsIcon
                icon={NotificationIcon}
                strokeWidth={2}
                className="mb-3 size-12 text-muted-foreground"
              />
              <p className="text-sm text-muted-foreground">
                No new notifications
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex cursor-pointer flex-col space-y-1 rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      {notification.title}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
