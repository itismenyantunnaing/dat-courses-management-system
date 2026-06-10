"use client"

import React from "react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  MoreHorizontalCircle01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ImportDialog } from "../dialogs/import-dialog"
import { ExportDialog } from "../dialogs/export-dialog"
import { DeleteDialog } from "../dialogs/delete-dialog"
import { cn } from "@/lib/utils"

// Re-export for backwards compatibility
export {
  allTabs,
  importTabs,
  exportTabs,
  deleteOptions,
  VISIBLE_TABS_COUNT,
} from "./tabs-config"

type BaseNavItem = {
  title: string
  tabId?: string   
  icon?: React.ReactNode
}

type NavPrimaryItem = BaseNavItem & {
  type: "primary"
}

type NavPrimaryActionItem = BaseNavItem & {
  type: "primary-action"
  actions?: {
    label: string
    icon?: React.ReactNode
    tabId?: string   
    onClick?: () => void
    destructive?: boolean
  }[]
}

type NavDropdownItem = BaseNavItem & {
  type: "dropdown"
  isActive?: boolean
  items: {
    title: string
    tabId?: string   
    action?: "import" | "export" | "delete"
    destructive?: boolean
  }[]
}

type MixedNavItem = NavPrimaryItem | NavPrimaryActionItem | NavDropdownItem

export function NavGroup({
  items,
  sidebarGroupLabel,
  onTabChange,
  activeTab
}: {
  items: MixedNavItem[]
  sidebarGroupLabel?: string
  onTabChange?: (tab: string) => void 
  activeTab?: string                  
}) {
  const { isMobile } = useSidebar()
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  const getWrappedActions = (actions?: NavPrimaryActionItem["actions"]) => {
    if (!actions) return []

    return actions.map((action) => {
      if (action.label === "Import data") {
        return { ...action, onClick: () => setIsImportDialogOpen(true) }
      }
      if (action.label === "Export data") {
        return { ...action, onClick: () => setIsExportDialogOpen(true) }
      }
      if (action.label === "Delete data") {
        return { ...action, onClick: () => setIsDeleteDialogOpen(true) }
      }
      return action
    })
  }

  const handleDropdownItemClick = (action?: "import" | "export" | "delete", tabId?: string) => {
    // If tabId exists, navigate first
    if (tabId) {
      onTabChange?.(tabId)
    }
    // Then open dialog if action exists
    switch (action) {
      case "import":
        setIsImportDialogOpen(true)
        break
      case "export":
        setIsExportDialogOpen(true)
        break
      case "delete":
        setIsDeleteDialogOpen(true)
        break
      default:
        break
    }
  }

  const renderMenuItem = (item: MixedNavItem) => {
    switch (item.type) {
      case "primary":
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={activeTab === item.tabId}
              onClick={() => onTabChange?.(item.tabId || item.title.toLowerCase())}
              className={cn("transition-all duration-200 cursor-pointer")}
            >
              {item.icon}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )

      case "primary-action":
        const wrappedActions = getWrappedActions(item.actions)

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={activeTab === item.tabId}
              onClick={() => onTabChange?.(item.tabId || item.title.toLowerCase())}
              className={cn("transition-all duration-200 cursor-pointer")}
            >
              {item.icon}
              <span>{item.title}</span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="aria-expanded:bg-muted"
                >
                  <HugeiconsIcon
                    icon={MoreHorizontalCircle01Icon}
                    strokeWidth={2}
                  />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                {wrappedActions.slice(0, -1).map((action, idx) => (
                  <DropdownMenuItem
                    key={idx}
                    onSelect={() => {
                      if (action.tabId) {
                        onTabChange?.(action.tabId)
                      } else if (action.onClick) {
                        action.onClick()
                      }
                    }}
                    variant={action.destructive ? "destructive" : "default"}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                ))}
                {wrappedActions.length > 1 && <DropdownMenuSeparator />}
                {wrappedActions.length > 0 && (
                  <DropdownMenuItem
                    key="last"
                    onSelect={() => {
                      const lastAction = wrappedActions[wrappedActions.length - 1]
                      if (lastAction.tabId) {
                        onTabChange?.(lastAction.tabId)
                      } else if (lastAction.onClick) {
                        lastAction.onClick()
                      }
                    }}
                    variant="destructive"
                  >
                    {wrappedActions[wrappedActions.length - 1].icon}
                    <span>
                      {wrappedActions[wrappedActions.length - 1].label}
                    </span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        )

      case "dropdown":
        // Check if this is the Master Data dropdown (has items with actions)
        const hasActions = item.items.some((subItem) => subItem.action)

        if (hasActions) {
          // Master Data dropdown with action items
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={cn("transition-all duration-200")}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                      className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="ml-4 border-l px-4">
                    {item.items.map((subItem) => (
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton
                          tooltip={subItem.title}
                          isActive={activeTab === subItem.tabId}
                          onClick={() => handleDropdownItemClick(subItem.action, subItem.tabId)}
                          className={cn(
                            "transition-all duration-200 cursor-pointer",
                            subItem.destructive &&
                              "text-destructive hover:bg-destructive/10 hover:text-destructive"
                          )}
                        >
                          <span>{subItem.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </ul>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        }

        // Regular dropdown with navigation items
        return (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  className={cn("transition-all duration-200")}
                >
                  {item.icon}
                  <span>{item.title}</span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="ml-4 border-l px-4">
                  {item.items.map((subItem) => (
                    <SidebarMenuItem key={subItem.title}>
                      <SidebarMenuButton
                        tooltip={subItem.title}
                        isActive={activeTab === subItem.tabId}
                        onClick={() => onTabChange?.(subItem.tabId || subItem.title.toLowerCase())}
                        className="cursor-pointer"
                      >
                        <span>{subItem.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </ul>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        )

      default:
        return null
    }
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>{sidebarGroupLabel}</SidebarGroupLabel>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>{items.map((item) => renderMenuItem(item))}</SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  )
}