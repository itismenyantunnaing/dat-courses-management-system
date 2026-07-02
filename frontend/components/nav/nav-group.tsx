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
  Upload05Icon,
  Download05Icon,
  Delete02Icon,
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
    action?: "import" | "export" | "delete"
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
  activeTab,
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
  const [dialogTabId, setDialogTabId] = React.useState<string>("all")
  const [deletePreselectedItems, setDeletePreselectedItems] = React.useState<
    string[]
  >([])

  // Get icon for action
  const getActionIcon = (label: string) => {
    switch (label) {
      case "Import data":
        return (
          <HugeiconsIcon
            icon={Upload05Icon}
            strokeWidth={2}
            className="h-4 w-4"
          />
        )
      case "Export data":
        return (
          <HugeiconsIcon
            icon={Download05Icon}
            strokeWidth={2}
            className="h-4 w-4"
          />
        )
      case "Delete data":
        return (
          <HugeiconsIcon
            icon={Delete02Icon}
            strokeWidth={2}
            className="h-4 w-4"
          />
        )
      default:
        return null
    }
  }

  // Wrap actions to handle dialog opening
  const getWrappedActions = (actions?: NavPrimaryActionItem["actions"]) => {
    if (!actions) return []

    return actions.map((action) => {
      // Add icon to action if not already present
      const actionWithIcon = {
        ...action,
        icon: action.icon || getActionIcon(action.label),
      }

      // If action has tabId, we handle it differently
      if (action.tabId) {
        return {
          ...actionWithIcon,
          onClick: () => {
            // Set the tab ID for the dialog
            setDialogTabId(action.tabId || "all")

            // For delete action, set preselected items
            if (action.action === "delete" && action.tabId) {
              setDeletePreselectedItems([action.tabId])
            } else {
              setDeletePreselectedItems([])
            }

            // Then open the appropriate dialog
            switch (action.action) {
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
                // If no specific action, just navigate
                if (action.tabId) {
                  onTabChange?.(action.tabId)
                }
                break
            }
          },
        }
      }

      // If no tabId, use the existing logic
      if (action.label === "Import data") {
        return {
          ...actionWithIcon,
          onClick: () => {
            setDialogTabId("all")
            setDeletePreselectedItems([])
            setIsImportDialogOpen(true)
          },
        }
      }
      if (action.label === "Export data") {
        return {
          ...actionWithIcon,
          onClick: () => {
            setDialogTabId("all")
            setDeletePreselectedItems([])
            setIsExportDialogOpen(true)
          },
        }
      }
      if (action.label === "Delete data") {
        return {
          ...actionWithIcon,
          onClick: () => {
            setDialogTabId("all")
            setDeletePreselectedItems([])
            setIsDeleteDialogOpen(true)
          },
        }
      }
      return actionWithIcon
    })
  }

  const handleDropdownItemClick = (
    action?: "import" | "export" | "delete",
    tabId?: string
  ) => {
    // Set the tab ID for the dialog
    setDialogTabId(tabId || "all")

    // For delete action, only set preselected items if there's a tabId
    // (Master Data doesn't have a tabId, so it won't preselect anything)
    if (action === "delete" && tabId) {
      setDeletePreselectedItems([tabId])
    } else {
      setDeletePreselectedItems([])
    }

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

  // Clean up function for delete dialog
  const handleDeleteDialogClose = (open: boolean) => {
    setIsDeleteDialogOpen(open)
    if (!open) {
      // Reset preselected items when dialog closes
      setDeletePreselectedItems([])
      setDialogTabId("all")
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
              onClick={() =>
                onTabChange?.(item.tabId || item.title.toLowerCase())
              }
              className={cn("cursor-pointer transition-all duration-200")}
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
              onClick={() =>
                onTabChange?.(item.tabId || item.title.toLowerCase())
              }
              className={cn("cursor-pointer transition-all duration-200")}
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
                {wrappedActions.map((action, idx) => {
                  const isDelete = action.label === "Delete data"

                  return (
                    <div key={idx}>
                      {isDelete && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onSelect={() => {
                          if (action.onClick) {
                            action.onClick()
                          } else if (action.tabId) {
                            onTabChange?.(action.tabId)
                          }
                        }}
                        variant={action.destructive ? "destructive" : "default"}
                        className="gap-2"
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </DropdownMenuItem>
                    </div>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        )

      case "dropdown":
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
                    {item.items.map((subItem, subIndex) => {
                      const actionIcon = getActionIcon(subItem.title)

                      return (
                        <div key={subItem.title}>
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              tooltip={subItem.title}
                              isActive={activeTab === subItem.tabId}
                              onClick={() =>
                                handleDropdownItemClick(
                                  subItem.action,
                                  subItem.tabId
                                )
                              }
                              className={cn(
                                "cursor-pointer gap-2 transition-all duration-200",
                                subItem.destructive &&
                                  "text-destructive hover:bg-destructive/10 hover:text-destructive"
                              )}
                            >
                              {actionIcon}
                              <span>{subItem.title}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </div>
                      )
                    })}
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
                        onClick={() =>
                          onTabChange?.(
                            subItem.tabId || subItem.title.toLowerCase()
                          )
                        }
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
        label={dialogTabId}
      />
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        label={dialogTabId}
      />
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogClose}
        preselectedItems={deletePreselectedItems}
      />
    </>
  )
}
