"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ShieldUserIcon,
  UserGroupIcon,
  UserIcon,
  Tick02Icon,
  ArrowLeft01Icon,
  Settings02Icon,
  DashboardBrowsingIcon,
  DatabaseIcon,
  MessageIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

// Types
interface Permission {
  id: string
  label: string
  description?: string
}

interface PermissionCategory {
  label: string
  permissions: Permission[]
}

interface Role {
  id: string
  name: string
  label: string
  description: string
  icon: any
  iconBg: string
  iconColor: string
  badgeColor: string
  permissions: Record<string, boolean>
}

interface RolePermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (roles: Role[]) => void
}

// Permission categories
const PERMISSION_CATEGORIES: Record<string, PermissionCategory> = {
  dashboard: {
    label: "Dashboard",
    permissions: [
      { id: "view_dashboard", label: "View Dashboard" },
      { id: "export_reports", label: "Export Reports" },
    ],
  },
  employees: {
    label: "Employees",
    permissions: [
      { id: "view_employees", label: "View Employees" },
      { id: "create_employee", label: "Create Employee" },
      { id: "edit_employee", label: "Edit Employee" },
      { id: "delete_employee", label: "Delete Employee" },
      { id: "bulk_import", label: "Bulk Import" },
      { id: "bulk_export", label: "Bulk Export" },
      { id: "bulk_delete", label: "Bulk Delete" },
    ],
  },
  departments: {
    label: "Division & Departments & Teams",
    permissions: [
      { id: "view_divisions", label: "View Divisions" },
      { id: "manage_divisions", label: "Manage Divisions" },
      { id: "view_departments", label: "View Departments" },
      { id: "manage_departments", label: "Manage Departments" },
      { id: "view_teams", label: "View Teams" },
      { id: "manage_teams", label: "Manage Teams" },
    ],
  },
  settings: {
    label: "Settings",
    permissions: [
      { id: "system_configuraiton", label: "System Configuration" },
      { id: "notification_settings", label: "Manage Notification Settings" },
      { id: "manage_roles_permissions", label: "Manage Roles & Permissions" },
      { id: "audit_logs", label: "View Audit Logs" },
    ],
  },
  communications: {
    label: "Communications",
    permissions: [{ id: "send_mails", label: "Send Mails" }],
  },
}

// Default role definitions
const DEFAULT_ROLES: Role[] = [
  {
    id: "admin",
    name: "admin",
    label: "Admin",
    description: "Full access to all features and settings",
    icon: ShieldUserIcon,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    badgeColor: "bg-blue-50 text-blue-700",
    permissions: {
      view_dashboard: true,
      export_reports: true,
      view_employees: true,
      create_employee: true,
      edit_employee: true,
      delete_employee: true,
      bulk_import: true,
      bulk_export: true,
      bulk_delete: true,
      view_divisions: true,
      manage_divisions: true,
      view_departments: true,
      manage_departments: true,
      view_teams: true,
      manage_teams: true,
      system_configuraiton: true,
      notification_settings: true,
      manage_roles_permissions: true,
      audit_logs: true,
      send_mails: true,
    },
  },
  {
    id: "approver",
    name: "approver",
    label: "Approver",
    description: "Can approve requests and manage team members",
    icon: UserGroupIcon,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    badgeColor: "bg-purple-50 text-purple-700",
    permissions: {
      view_dashboard: true,
      export_reports: false,
      view_employees: true,
      create_employee: false,
      edit_employee: false,
      delete_employee: false,
      bulk_import: false,
      bulk_export: false,
      bulk_delete: false,
      view_divisions: true,
      manage_divisions: false,
      view_departments: true,
      manage_departments: true,
      view_teams: true,
      manage_teams: true,
      system_configuraiton: false,
      notification_settings: false,
      manage_roles_permissions: false,
      audit_logs: false,
      send_mails: true,
    },
  },
  {
    id: "learner",
    name: "learner",
    label: "Learner",
    description: "Basic access to view content and learn",
    icon: UserIcon,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    badgeColor: "bg-green-50 text-green-700",
    permissions: {
      view_dashboard: true,
      export_reports: false,
      view_employees: false,
      create_employee: false,
      edit_employee: false,
      delete_employee: false,
      bulk_import: false,
      bulk_export: false,
      bulk_delete: false,
      view_divisions: false,
      manage_divisions: false,
      view_departments: false,
      manage_departments: false,
      view_teams: false,
      manage_teams: false,
      system_configuraiton: false,
      notification_settings: false,
      manage_roles_permissions: false,
      audit_logs: false,
      send_mails: false,
    },
  },
]

// Helper to get member count for each role
const getMemberCount = (roleId: string): number => {
  const counts: Record<string, number> = {
    admin: 1,
    approver: 9,
    learner: 0,
  }
  return counts[roleId] || 0
}

export function RolePermissionsDialog({
  open,
  onOpenChange,
  onSave,
}: RolePermissionsDialogProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES)
  const [isLoading, setIsLoading] = useState(false)

  const currentRole = roles.find((r) => r.id === selectedRoleId)

  const handlePermissionToggle = (permissionId: string) => {
    if (!selectedRoleId) return
    setRoles((prev) =>
      prev.map((role) =>
        role.id === selectedRoleId
          ? {
              ...role,
              permissions: {
                ...role.permissions,
                [permissionId]: !role.permissions[permissionId],
              },
            }
          : role
      )
    )
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      onSave?.(roles)
      onOpenChange(false)
      setSelectedRoleId(null)
    } catch (error) {
      console.error("Failed to save roles:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectRole = (roleId: string) => {
    setSelectedRoleId(roleId)
  }

  const handleBack = () => {
    setSelectedRoleId(null)
  }

  const enabledCount = currentRole
    ? Object.values(currentRole.permissions).filter(Boolean).length
    : 0

  const totalCount = currentRole
    ? Object.keys(currentRole.permissions).length
    : 0

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setSelectedRoleId(null)
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-hidden p-0 sm:max-w-[450px]">
        <DialogHeader className="px-5 pt-5">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              {!selectedRoleId && !currentRole && (
                <>
                  <HugeiconsIcon
                    icon={ShieldUserIcon}
                    strokeWidth={2}
                    className="h-5 w-5 text-gray-500"
                  />
                  Role Permissions
                </>
              )}

              {selectedRoleId && currentRole && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="flex transition-colors hover:text-gray-700"
                  >
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-gray-900">
                        {currentRole.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                    {enabledCount}/{totalCount} permissions
                  </div>
                </div>
              )}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* View 1: Role List */}
        {!selectedRoleId && (
          <div className="pb-6">
            {roles.map((role, index) => {
              const memberCount = getMemberCount(role.id)
              const isLast = index === roles.length - 1

              return (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role.id)}
                  className="group flex w-full items-center gap-3.5 px-5 py-2 text-left transition-colors hover:bg-gray-50"
                  style={{
                    borderBottom: isLast ? "none" : "1px solid #f3f4f6",
                  }}
                >
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${role.iconBg}`}
                  >
                    <HugeiconsIcon
                      icon={role.icon}
                      strokeWidth={2}
                      className={`h-5 w-5 ${role.iconColor}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-gray-900">
                      {role.label}
                    </div>
                    <div className="mt-0.5 text-[13px] text-gray-400">
                      {memberCount} Member{memberCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="h-5 w-5 flex-shrink-0 text-gray-300 transition-colors group-hover:text-gray-400"
                  />
                </button>
              )
            })}
          </div>
        )}

        {/* View 2: Permissions */}
        {selectedRoleId && currentRole && (
          <div className="flex flex-col overflow-hidden">

            {/* Permissions Content - All categories at once */}
            <ScrollArea
              className="flex-1 scrollbar-thin px-5 py-4"
              style={{ maxHeight: "55vh" }}
            >
              <div className="space-y-6">
                {Object.entries(PERMISSION_CATEGORIES).map(
                  ([key, category]) => {
                    const categoryPermissions = category.permissions
                    const catEnabled = categoryPermissions.filter(
                      (p) => currentRole.permissions[p.id]
                    ).length

                    return (
                      <div key={key}>
                        <div className="mb-3 flex items-center gap-2">
                          <h4 className="text-xs font-semibold tracking-wider text-primary uppercase">
                            {category.label}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="ml-1 bg-gray-100 text-[11px] text-gray-500"
                          >
                            {catEnabled}/{categoryPermissions.length}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {categoryPermissions.map((permission) => {
                            const isEnabled =
                              currentRole.permissions[permission.id] || false
                            return (
                              <div
                                key={permission.id}
                                className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 transition-colors hover:bg-gray-50"
                              >
                                <Label
                                  htmlFor={permission.id}
                                  className="cursor-pointer text-[13px] font-medium text-gray-700"
                                >
                                  {permission.label}
                                </Label>
                                <Switch
                                  id={permission.id}
                                  checked={isEnabled}
                                  onCheckedChange={() =>
                                    handlePermissionToggle(permission.id)
                                  }
                                />
                              </div>
                            )
                          })}
                        </div>
                        <Separator className="mt-4 bg-gray-100" />
                      </div>
                    )
                  }
                )}
              </div>
            </ScrollArea>

            <div className="flex flex-shrink-0 justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setSelectedRoleId(null)
                  onOpenChange(false)
                }}
              >
                Cancel
              </Button>

              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
