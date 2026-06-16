/* eslint-disable react-hooks/purity */
"use client"

import { useState, useRef } from "react"
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
  NotificationIcon,
  LogoutIcon,
  UserAccountIcon,
  Key02Icon,
  Camera01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CardContent } from "@/components/ui/card"
import ChangePassword from "./dialogs/changePassword-dialog"
import { NotificationsDrawer } from "./drawers/notifications-drawer"
import { logout } from "@/app/actions/auth"  // ✅ Import logout action
import { useRouter } from "next/navigation"   // ✅ Import useRouter

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    department?: string
    team?: string
  }
}) {
  const router = useRouter()  // ✅ Initialize router
  const { isMobile } = useSidebar()
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false)
  const [personalInfoDialogOpen, setPersonalInfoDialogOpen] = useState(false)

  // Profile states
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState(user.avatar)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Change Password Flow States
  const [changePasswordStep, setChangePasswordStep] = useState("old-password")

  // ✅ Updated handleLogout function
  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
      // Optionally show error message to user
    } finally {
      setIsLoading(false)
      setLogoutDialogOpen(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)
      setTimeout(() => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setProfileImage(reader.result as string)
          setIsUploading(false)
        }
        reader.readAsDataURL(file)
      }, 1000)
    }
  }

  const handleRemoveImage = () => {
    setProfileImage("")
  }

  const handleSavePersonalInfo = async () => {
    setIsLoading(true)
    try {
      console.log("Saving profile image:", profileImage)
      setPersonalInfoDialogOpen(false)
    } catch (error) {
      console.error("Failed to save:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset password form function
  const resetPasswordForm = () => {
    setChangePasswordStep("old-password")
  }

  // Change Password Callbacks
  const handleChangePasswordStep = (step: string) => {
    console.log("Change password step:", step)
    setChangePasswordStep(step)
  }

  const handleChangePasswordUpdate = async (data: {
    staffId?: string
    newPassword: string
    oldPassword?: string
  }) => {
    console.log("Password changed successfully")
    setIsLoading(true)
    try {
      // API call to change password
      // await changePassword(data.oldPassword, data.newPassword)
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
    console.log("Close change password dialog")
    setChangePasswordDialogOpen(false)
    resetPasswordForm()
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
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
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
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
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
                    setNotificationDrawerOpen(true)
                  }}
                >
                  <HugeiconsIcon icon={NotificationIcon} strokeWidth={2} />
                  Notifications
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
      <Dialog
        open={personalInfoDialogOpen}
        onOpenChange={setPersonalInfoDialogOpen}
      >
        <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-[500px]">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Personal Information</DialogTitle>
            <DialogDescription>
              View your personal information and update your profile picture.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative">
                <Avatar className="h-24 w-24 cursor-pointer transition-opacity hover:opacity-80">
                  <AvatarImage src={profileImage} alt={user.name} />
                  <AvatarFallback className="text-2xl">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <HugeiconsIcon
                    icon={Camera01Icon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              {isUploading && (
                <p className="text-sm text-muted-foreground">Uploading...</p>
              )}
              {profileImage && profileImage !== user.avatar && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="text-destructive"
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    strokeWidth={2}
                    className="mr-2 h-4 w-4"
                  />
                  Remove Photo
                </Button>
              )}
              <p className="text-center text-xs text-muted-foreground">
                Supported formats: JPG, PNG, GIF (Max 5MB)
              </p>
            </div>

            <Separator className="my-4" />

            {/* Employee Information */}
            <div className="py-2">
              <CardContent className="space-y-4 p-0">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Employee Name
                  </Label>
                  <p className="text-base font-medium">{user.name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Email Address
                  </Label>
                  <p className="text-base font-medium">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Department
                  </Label>
                  <p className="text-base font-medium">
                    {user.department || "Software Engineering"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Team</Label>
                  <p className="text-base font-medium">
                    {user.team || "Block Chain"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Staff ID
                  </Label>
                  <p className="text-base font-medium">25-00287</p>
                </div>
              </CardContent>
            </div>
          </div>

          <DialogFooter className="border-t p-6 pt-4">
            <Button
              variant="outline"
              onClick={() => setPersonalInfoDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePersonalInfo} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notifications Drawer - Separated Component */}
      <NotificationsDrawer
        open={notificationDrawerOpen}
        onOpenChange={setNotificationDrawerOpen}
      />

      {/* Logout Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? You will need to login again to
              access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading ? "Logging out..." : "Logout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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