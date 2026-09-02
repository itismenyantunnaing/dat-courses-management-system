// app/components/nav-user.tsx
/* eslint-disable react-hooks/purity */
"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { resolveUploadUrl } from "@/lib/utils"
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
import { LogoutDialog } from "./dialogs/logout-dialog"
import { SettingDialog } from "./dialogs/setting-dialog"
import { logout } from "@/app/actions/auth"
import { mainStore } from "@/store/mainStore"

export function NavUser() {
  const { isMobile } = useSidebar()
  const {
    profile,
    employeeProfile,
    fetch_EmployeeProfile
  } = mainStore()

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false)
  const [personalInfoDialogOpen, setPersonalInfoDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [rolePermissionsDialogOpen, setRolePermissionsDialogOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)

  // Fetch employee profile when component mounts
  useEffect(() => {
    if (profile?.id) {
      fetch_EmployeeProfile(profile.id)
    }
  }, [profile?.id, fetch_EmployeeProfile])

  // Use employeeProfile for image if available, fallback to profile
  const displayProfile = {
    ...profile,
    profilePhotoPath: employeeProfile?.profilePhotoPath || profile?.profilePhotoPath || profile?.avatar || null,
    isCorePersonnel: employeeProfile?.isCorePersonnel ?? profile?.isCorePersonnel ?? false,
    hasJapanBusinessTrip: employeeProfile?.hasJapanBusinessTrip ?? profile?.hasJapanBusinessTrip ?? false,
    dob: employeeProfile?.dob || profile?.dob || null,
  }

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
      // Add your API call here
    } catch (error) {
      console.error("Failed to save:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleDropdownOpenChange = (isOpen: boolean) => {
    // Clear any pending timer
    if (dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }

    if (isOpen) {
      setIsInteractingWithDropdown(true)
    } else {
      // Delay setting to false to prevent drawer from closing when clicking outside dropdown
      dropdownCloseTimer.current = setTimeout(() => {
        setIsInteractingWithDropdown(false)
        dropdownCloseTimer.current = null
      }, 150)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Don't close if we're interacting with a dropdown
    if (!newOpen && isInteractingWithDropdown) {
      return
    }
    // Clear any pending timer when drawer closes
    if (!newOpen && dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }
    onOpenChange(newOpen)
  }


  const handleSaveSettings = async (
    updatedConfig: any,
    updatedNotificationSettings: any
  ) => {
    setIsLoading(true)
    try {

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
                      resolveUploadUrl(displayProfile.profilePhotoPath) ||
                      "/avatars/default.jpg"
                    }
                    alt={displayProfile.name}
                  />
                  <AvatarFallback className="rounded-full">
                    {displayProfile.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayProfile.name}</span>
                  <span className="truncate text-xs">{displayProfile.email}</span>
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
                        resolveUploadUrl(displayProfile.profilePhotoPath) ||
                        "/avatars/default.jpg"
                      }
                      alt={displayProfile.name}
                    />
                    <AvatarFallback className="rounded-full">
                      {displayProfile.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayProfile.name}</span>
                    <span className="truncate text-xs">{displayProfile.email}</span>
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
                {profile.role.toLowerCase() === "admin" &&
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      setSettingsDialogOpen(true)
                    }}
                  >
                    <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
                    Setting
                  </DropdownMenuItem>
                }
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

      {/* Personal Information Dialog - Pass displayProfile instead of profile */}
      <PersonalInformationDialog
        open={personalInfoDialogOpen}
        onOpenChange={setPersonalInfoDialogOpen}
        profile={displayProfile}
        onSave={handleSavePersonalInfo}
        onDropdownOpenChange={handleDropdownOpenChange}
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
    </>
  )
}