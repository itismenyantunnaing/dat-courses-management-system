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
import { NavUser } from "@/components/nav-user"
import { NavGroup } from "./nav-group"
import { getSidebarConfig } from "./sidebar-config"

export function AppSidebar({
  onTabChange,
  activeTab,
  userRole = "admin",
  ...props
}: {
  onTabChange?: (tab: string) => void
  activeTab?: string
  userRole?: "admin" | "learner" | "approver"
} & React.ComponentProps<typeof Sidebar>) {
  // Get data based on user role
  const data = getSidebarConfig(userRole)

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
        {/* Loop through nav groups */}
        {data.navGroups.map((group, index) => (
          <NavGroup
            key={index}
            items={group.items}
            sidebarGroupLabel={group.groupLabel}
            onTabChange={onTabChange}
            activeTab={activeTab}
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
