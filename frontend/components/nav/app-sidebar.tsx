"use client"

import * as React from "react"
import Image from "next/image"
import DATLogo from "../../public/DAT Logo.png"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserGroupIcon,
  LibraryIcon,
  DashboardBrowsingIcon,
  DiplomaIcon,
  ComputerVideoCallIcon,
  DatabaseIcon,
} from "@hugeicons/core-free-icons"
import { NavUser } from "@/components/nav-user"
import { NavGroup } from "./nav-group"
import { importTabs, VISIBLE_TABS_COUNT } from "../nav/tabs-config"


const STROKE_WIDTH = 2

const data = {
  user: {
    name: "Nyan Tun Naing",
    email: "itismenyantunnaing@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  NavDashboard: [
    {
      title: "My Dashboard",
      tabId: "dashboard",
      type: "primary" as const,
      icon: (
        <HugeiconsIcon
          icon={DashboardBrowsingIcon}
          strokeWidth={STROKE_WIDTH}
        />
      ),
    },
  ],
  NavManage: [
    {
      title: "Master Data",
      tabId: "master",
      type: "dropdown" as const,
      icon: <HugeiconsIcon icon={DatabaseIcon} strokeWidth={STROKE_WIDTH} />,
      isActive: false,
      items: [
        {
          title: "Import data",
          action: "import" as const,
        },
        {
          title: "Export data",
          action: "export" as const,
        },
        {
          title: "Delete data",
          action: "delete" as const,
        },
      ],
    },
    ...importTabs.map((tab) => ({
      title: tab.label,
      tabId: tab.id,
      type: "primary" as const,
      icon: <HugeiconsIcon icon={tab.icon} strokeWidth={STROKE_WIDTH} />,
    }))
  ],
  NavAnnouncements: [
    {
      title: "Seminar",
      tabId: "seminar",
      type: "primary" as const,
      icon: (
        <HugeiconsIcon
          icon={ComputerVideoCallIcon}
          strokeWidth={STROKE_WIDTH}
        />
      ),
    },
    {
      title: "Exams",
      tabId: "exams",
      type: "primary" as const,
      icon: <HugeiconsIcon icon={DiplomaIcon} strokeWidth={STROKE_WIDTH} />,
    },
  ],
}

export function AppSidebar({
  onTabChange,
  activeTab,
  ...props
}: {
  onTabChange?: (tab: string) => void
  activeTab?: string
} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex h-8 w-full items-center justify-center">
              <Image
                src={DATLogo}
                alt="Picture of the DAT Logo"
                className="h-full w-auto object-contain"
              />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup
          items={data.NavDashboard}
          sidebarGroupLabel="Dashboard"
          onTabChange={onTabChange}
          activeTab={activeTab}
        />
        <NavGroup
          items={data.NavManage}
          sidebarGroupLabel="Manage"
          onTabChange={onTabChange}
          activeTab={activeTab}
        />
        <NavGroup
          items={data.NavAnnouncements}
          sidebarGroupLabel="Announcements"
          onTabChange={onTabChange}
          activeTab={activeTab}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}