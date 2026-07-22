/* eslint-disable react-hooks/purity */
"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UnfoldMoreIcon,
  LogoutIcon,
  UserAccountIcon,
  Key02Icon,
  Settings01Icon,
  ShieldUserIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import ChangePassword from "./dialogs/changePassword-dialog"
import { PersonalInformationDialog } from "./dialogs/personalInformation-dialog"
import { RolePermissionsDialog } from "./dialogs/rolePermissions-dialog"
import { LogoutDialog } from "./dialogs/logout-dialog"
import { SettingDialog } from "./dialogs/setting-dialog"
import { logout } from "@/app/actions/auth"
import { mainStore } from "@/store/mainStore"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { profile } = mainStore()

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false)
  const [personalInfoDialogOpen, setPersonalInfoDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [rolePermissionsDialogOpen, setRolePermissionsDialogOpen] =
    useState(false)

  const [isLoading, setIsLoading] = useState(false)

  // Configuration states - Outlook is default
  const [config, setConfig] = useState({
    fileUploadSize: 5,
    sessionTimeout: 30,
    jwtExpiry: 24,
    maxLoginAttempts: 5,
    smtp: {
      gmailHost: "smtp.gmail.com",
      gmailPassword: "",
      gmailDefault: false,
      outlookHost: "smtp.office365.com",
      outlookPassword: "",
      outlookDefault: true,
    },
  })

  // Notification Settings states
  const [notificationSettings, setNotificationSettings] = useState({
    courseAnnouncements: true,
    jlptExamAnnouncements: true,
    certificateUpdates: true,
    systemNotifications: true,
    emailNotifications: true,
  })

  // Change Password Flow States
  const [changePasswordStep, setChangePasswordStep] = useState("old-password")

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoading(false)
      setLogoutDialogOpen(false)
    }
  }

  const handleSavePersonalInfo = async (image: string) => {
    setIsLoading(true)
    try {
      console.log("Saving profile image:", image)
      // Add your API call here
    } catch (error) {
      console.error("Failed to save:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async (
    updatedConfig: any,
    updatedNotificationSettings: any
  ) => {
    setIsLoading(true)
    try {
      console.log("Saving settings:", {
        updatedConfig,
        updatedNotificationSettings,
      })
      setConfig(updatedConfig)
      setNotificationSettings(updatedNotificationSettings)
      setSettingsDialogOpen(false)
    } catch (error) {
      console.error("Failed to save settings:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const resetPasswordForm = () => {
    setChangePasswordStep("old-password")
  }

  const handleChangePasswordStep = (step: string) => {
    setChangePasswordStep(step)
  }

  const handleChangePasswordUpdate = async (data: {
    staffId?: string
    newPassword: string
    oldPassword?: string
  }) => {
    setIsLoading(true)
    try {
      console.log("Password updated successfully")
      setChangePasswordDialogOpen(false)
      resetPasswordForm()
    } catch (error) {
      console.error("Failed to change password:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePasswordClose = () => {
    setChangePasswordDialogOpen(false)
    resetPasswordForm()
  }

  if (!profile) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="animate-pulse">
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="flex-1">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="mt-1 h-3 w-32 rounded bg-muted" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage
                    src={
                      profile.profilePhotoPath ||
                      profile.avatar ||
                      "/avatars/default.jpg"
                    }
                    alt={profile.name}
                  />
                  <AvatarFallback className="rounded-full">
                    {profile.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{profile.name}</span>
                  <span className="truncate text-xs">{profile.email}</span>
                </div>
                <HugeiconsIcon
                  icon={UnfoldMoreIcon}
                  strokeWidth={2}
                  className="ml-auto size-4"
                />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage
                      src={
                        profile.profilePhotoPath ||
                        profile.avatar ||
                        "/avatars/default.jpg"
                      }
                      alt={profile.name}
                    />
                    <AvatarFallback className="rounded-full">
                      {profile.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{profile.name}</span>
                    <span className="truncate text-xs">{profile.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    setPersonalInfoDialogOpen(true)
                  }}
                >
                  <HugeiconsIcon icon={UserAccountIcon} strokeWidth={2} />
                  Personal Information
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    setChangePasswordDialogOpen(true)
                  }}
                >
                  <HugeiconsIcon icon={Key02Icon} strokeWidth={2} />
                  Change password
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    setSettingsDialogOpen(true)
                  }}
                >
                  <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
                  Setting
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    setRolePermissionsDialogOpen(true)
                  }}
                >
                  <HugeiconsIcon icon={ShieldUserIcon} strokeWidth={2} />
                  Manage role permissions
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                  e.preventDefault()
                  setLogoutDialogOpen(true)
                }}
              >
                <HugeiconsIcon icon={LogoutIcon} strokeWidth={2} /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Personal Information Dialog */}
      <PersonalInformationDialog
        open={personalInfoDialogOpen}
        onOpenChange={setPersonalInfoDialogOpen}
        profile={profile}
        onSave={handleSavePersonalInfo}
      />

      {/* Setting Dialog */}
      <SettingDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        config={config}
        notificationSettings={notificationSettings}
        onSave={handleSaveSettings}
        isLoading={isLoading}
      />

      {/* Logout Dialog */}
      <LogoutDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={handleLogout}
        isLoading={isLoading}
      />

      {/* Change Password Dialog */}
      <Dialog
        open={changePasswordDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetPasswordForm()
          }
          setChangePasswordDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <ChangePassword
            flow="change"
            step={changePasswordStep}
            onStepChange={handleChangePasswordStep}
            onPasswordUpdate={handleChangePasswordUpdate}
            onClose={handleChangePasswordClose}
          />
        </DialogContent>
      </Dialog>

      {/* Role Permissions Dialog */}
      <RolePermissionsDialog
        open={rolePermissionsDialogOpen}
        onOpenChange={setRolePermissionsDialogOpen}
        onSave={(roles) => {
          console.log("Roles saved:", roles)
          // Handle save logic here
        }}
      />
    </>
  )
}
