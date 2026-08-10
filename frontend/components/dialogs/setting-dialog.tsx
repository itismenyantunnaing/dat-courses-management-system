// app/components/dialogs/settings-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  EyeIcon,
  ViewOffIcon,
  CourseIcon,
  BookOpenIcon,
  Certificate01Icon,
  Mail01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { mainStore } from "@/store/mainStore"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingDialog({
  open,
  onOpenChange,
}: SettingsDialogProps) {
  const { 
    systemConfig, 
    fetch_SystemConfig, 
    update_SystemConfig,
    notificationSettings: storeNotificationSettings,
    fetch_NotificationSettings,
    update_NotificationSettings,
    isLoading,
    isSaving,
    isUpdating,
    profile
  } = mainStore();

  const employeeId = profile?.id;

  // Local states
  const [isLoadingInitial, setIsLoadingInitial] = useState(false)

  // Transform backend config to dialog config format
  const getInitialConfig = () => {
    if (!systemConfig) {
      return {
        fileUploadSize: 10,
        sessionTimeout: 30,
        jwtExpiry: 24,
        maxLoginAttempts: 5,
        smtp: {
          gmailHost: "",
          gmailPort: "",
          gmailUsername: "",
          gmailPassword: "",
          gmailDefault: true,
          outlookHost: "",
          outlookPort: "",
          outlookUsername: "",
          outlookPassword: "",
          outlookDefault: false
        }
      }
    }
    return {
      fileUploadSize: systemConfig.fileUploadSizeMb,
      sessionTimeout: systemConfig.sessionTimeoutMinutes,
      jwtExpiry: systemConfig.jwtExpiryHours,
      maxLoginAttempts: systemConfig.maxLoginAttempts,
      smtp: {
        gmailHost: systemConfig.gmailHost || "",
        gmailPort: systemConfig.gmailPort || "",
        gmailUsername: systemConfig.gmailUsername || "",
        gmailPassword: systemConfig.gmailPassword || "",
        gmailDefault: systemConfig.activeSmtpProvider === "GMAIL",
        outlookHost: systemConfig.outlookHost || "",
        outlookPort: systemConfig.outlookPort || "",
        outlookUsername: systemConfig.outlookUsername || "",
        outlookPassword: systemConfig.outlookPassword || "",
        outlookDefault: systemConfig.activeSmtpProvider === "OUTLOOK"
      }
    }
  }

  const [config, setConfig] = useState(getInitialConfig())
  const [initialConfig, setInitialConfig] = useState(getInitialConfig())
  const [hasChanges, setHasChanges] = useState(false)
  const [showGmailPassword, setShowGmailPassword] = useState(false)
  const [showOutlookPassword, setShowOutlookPassword] = useState(false)
  
  // Local copy of notification settings for editing
  const [localSettings, setLocalSettings] = useState({
    courseAnnouncements: true,
    examAnnouncements: true,
    certificateUpdates: true,
    emailNotifications: true,
  })

  // Fetch system config and notification settings when dialog opens
  useEffect(() => {
    if (open && employeeId) {
      setIsLoadingInitial(true)
      Promise.all([
        fetch_SystemConfig(),
        fetch_NotificationSettings(employeeId)
      ]).finally(() => {
        setIsLoadingInitial(false)
      })
    } else if (open && !employeeId) {
      setIsLoadingInitial(true)
      fetch_SystemConfig().finally(() => {
        setIsLoadingInitial(false)
      })
    }
  }, [open, employeeId])

  // Update local settings when store data changes
  useEffect(() => {
    if (storeNotificationSettings) {
      setLocalSettings({
        courseAnnouncements: storeNotificationSettings.courseAnnouncements ?? true,
        examAnnouncements: storeNotificationSettings.examAnnouncements ?? true,
        certificateUpdates: storeNotificationSettings.certificateUpdates ?? true,
        emailNotifications: storeNotificationSettings.emailNotifications ?? true,
      })
    }
  }, [storeNotificationSettings])

  // Update local config and initial config when systemConfig is loaded
  useEffect(() => {
    if (systemConfig) {
      const newConfig = getInitialConfig()
      setConfig(newConfig)
      setInitialConfig(newConfig)
    }
  }, [systemConfig])

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      const newInitialConfig = getInitialConfig()
      setConfig(newInitialConfig)
      setInitialConfig(newInitialConfig)
      
      if (storeNotificationSettings) {
        setLocalSettings({
          courseAnnouncements: storeNotificationSettings.courseAnnouncements ?? true,
          examAnnouncements: storeNotificationSettings.examAnnouncements ?? true,
          certificateUpdates: storeNotificationSettings.certificateUpdates ?? true,
          emailNotifications: storeNotificationSettings.emailNotifications ?? true,
        })
      }
      setHasChanges(false)
    }
  }, [open])

  // Simple deep equality check for config objects
  const configEqual = (a: any, b: any) => {
    if (a === b) return true
    if (!a || !b) return false
    
    const keys = Object.keys(a)
    if (keys.length !== Object.keys(b).length) return false
    
    for (const key of keys) {
      if (key === "smtp") {
        const smtpKeys = Object.keys(a[key])
        if (smtpKeys.length !== Object.keys(b[key]).length) return false
        for (const smtpKey of smtpKeys) {
          if (a[key][smtpKey] !== b[key][smtpKey]) return false
        }
      } else if (a[key] !== b[key]) {
        return false
      }
    }
    return true
  }

  // Check for changes
  useEffect(() => {
    if (!storeNotificationSettings) return

    const configChanged = !configEqual(config, initialConfig)
    
    const storeSettings = {
      courseAnnouncements: storeNotificationSettings.courseAnnouncements ?? true,
      examAnnouncements: storeNotificationSettings.examAnnouncements ?? true,
      certificateUpdates: storeNotificationSettings.certificateUpdates ?? true,
      emailNotifications: storeNotificationSettings.emailNotifications ?? true,
    }
    
    const notificationChanged = 
      localSettings.courseAnnouncements !== storeSettings.courseAnnouncements ||
      localSettings.examAnnouncements !== storeSettings.examAnnouncements ||
      localSettings.certificateUpdates !== storeSettings.certificateUpdates ||
      localSettings.emailNotifications !== storeSettings.emailNotifications

    setHasChanges(configChanged || notificationChanged)
  }, [config, initialConfig, localSettings, storeNotificationSettings])

  const handleSave = async () => {
    if (!hasChanges) return

    try {
      // Save system config if changed
      if (!configEqual(config, initialConfig)) {
        const backendConfig = {
          fileUploadSizeMb: config.fileUploadSize,
          sessionTimeoutMinutes: config.sessionTimeout,
          jwtExpiryHours: config.jwtExpiry,
          maxLoginAttempts: config.maxLoginAttempts,
          activeSmtpProvider: config.smtp.gmailDefault ? "GMAIL" : "OUTLOOK",
          gmailHost: config.smtp.gmailHost,
          gmailPort: config.smtp.gmailPort,
          gmailUsername: config.smtp.gmailUsername,
          gmailPassword: config.smtp.gmailPassword,
          outlookHost: config.smtp.outlookHost,
          outlookPort: config.smtp.outlookPort,
          outlookUsername: config.smtp.outlookUsername,
          outlookPassword: config.smtp.outlookPassword,
        }
        await update_SystemConfig(backendConfig)
      }

      // Save notification settings if changed
      const storeSettings = {
        courseAnnouncements: storeNotificationSettings?.courseAnnouncements ?? true,
        examAnnouncements: storeNotificationSettings?.examAnnouncements ?? true,
        certificateUpdates: storeNotificationSettings?.certificateUpdates ?? true,
        emailNotifications: storeNotificationSettings?.emailNotifications ?? true,
      }
      
      const notificationChanged = 
        localSettings.courseAnnouncements !== storeSettings.courseAnnouncements ||
        localSettings.examAnnouncements !== storeSettings.examAnnouncements ||
        localSettings.certificateUpdates !== storeSettings.certificateUpdates ||
        localSettings.emailNotifications !== storeSettings.emailNotifications

      if (notificationChanged && employeeId) {
        const settingsToSave = {
          employeeId: employeeId,
          courseAnnouncements: localSettings.courseAnnouncements,
          examAnnouncements: localSettings.examAnnouncements,
          certificateUpdates: localSettings.certificateUpdates,
          emailNotifications: localSettings.emailNotifications,
        }
        
        await update_NotificationSettings(settingsToSave)
        await fetch_NotificationSettings(employeeId)
      }

      await fetch_SystemConfig()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const handleGmailDefaultChange = (checked: boolean) => {
    setConfig({
      ...config,
      smtp: {
        ...config.smtp,
        gmailDefault: checked,
        outlookDefault: checked ? false : config.smtp.outlookDefault,
      },
    })
  }

  const handleOutlookDefaultChange = (checked: boolean) => {
    setConfig({
      ...config,
      smtp: {
        ...config.smtp,
        outlookDefault: checked,
        gmailDefault: checked ? false : config.smtp.gmailDefault,
      },
    })
  }

  const isNotificationSaving = isUpdating || isLoading
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-[650px]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure system settings and notification preferences.
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {isLoadingInitial ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <HugeiconsIcon
                icon={Loading03Icon}
                role="status"
                aria-label="Loading"
                className="size-4 animate-spin"
              />
              <p className="text-sm text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="space-y-6">
              {/* System Configuration Section */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  System Configuration
                </h3>

                {/* File Upload Size & Session Timeout */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-start gap-2">
                    <Label className="text-sm font-medium">
                      File Upload Size
                    </Label>
                    <div className="flex w-full items-center gap-2">
                      <Input
                        type="number"
                        value={config.fileUploadSize}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            fileUploadSize: parseInt(e.target.value) || 0,
                          })
                        }
                        min={1}
                        step={1}
                        disabled={isSaving || isLoading}
                      />
                      <span className="text-sm text-muted-foreground">MB</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2">
                    <Label className="text-sm font-medium">Session Timeout</Label>
                    <div className="flex w-full items-center gap-2">
                      <Input
                        type="number"
                        value={config.sessionTimeout}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            sessionTimeout: parseInt(e.target.value) || 0,
                          })
                        }
                        min={1}
                        step={5}
                        disabled={isSaving || isLoading}
                      />
                      <span className="text-sm text-muted-foreground">
                        minutes
                      </span>
                    </div>
                  </div>
                </div>

                {/* JWT Expiry & Max Login Attempts */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-start gap-2">
                    <Label className="text-sm font-medium">JWT Expiry</Label>
                    <div className="flex w-full items-center gap-2">
                      <Input
                        type="number"
                        value={config.jwtExpiry}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            jwtExpiry: parseInt(e.target.value) || 0,
                          })
                        }
                        min={1}
                        step={1}
                        disabled={isSaving || isLoading}
                      />
                      <span className="text-sm text-muted-foreground">hours</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2">
                    <Label className="text-sm font-medium">
                      Max Login Attempts
                    </Label>
                    <div className="flex w-full items-center gap-2">
                      <Input
                        type="number"
                        value={config.maxLoginAttempts}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            maxLoginAttempts: parseInt(e.target.value) || 0,
                          })
                        }
                        min={1}
                        step={1}
                        disabled={isSaving || isLoading}
                      />
                      <span className="text-sm text-muted-foreground">
                        attempts
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* SMTP Configuration */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">
                    SMTP Configuration
                  </Label>

                  <div className="flex flex-col gap-4">
                    {/* Outlook */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        <Label className="text-sm font-medium">Outlook</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="outlook-default"
                            checked={config.smtp.outlookDefault}
                            onCheckedChange={handleOutlookDefaultChange}
                            disabled={isSaving || isLoading}
                          />
                          <Label
                            htmlFor="outlook-default"
                            className="cursor-pointer text-sm"
                          >
                            Use as Default
                          </Label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="text"
                          value={config.smtp.outlookHost}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              smtp: {
                                ...config.smtp,
                                outlookHost: e.target.value,
                              },
                            })
                          }
                          placeholder="smtp.office365.com"
                          disabled={isSaving || isLoading}
                        />
                        <Input
                          type="number"
                          value={config.smtp.outlookPort}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              smtp: {
                                ...config.smtp,
                                outlookPort: parseInt(e.target.value) || 587,
                              },
                            })
                          }
                          placeholder="Port"
                          disabled={isSaving || isLoading}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="email"
                          value={config.smtp.outlookUsername}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              smtp: {
                                ...config.smtp,
                                outlookUsername: e.target.value,
                              },
                            })
                          }
                          placeholder="Outlook Email"
                          disabled={isSaving || isLoading}
                        />
                        <div className="relative">
                          <Input
                            type={showOutlookPassword ? "text" : "password"}
                            value={config.smtp.outlookPassword}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                smtp: {
                                  ...config.smtp,
                                  outlookPassword: e.target.value,
                                },
                              })
                            }
                            className="pr-10"
                            placeholder="Outlook Password"
                            disabled={isSaving || isLoading}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowOutlookPassword(!showOutlookPassword)
                            }
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            disabled={isSaving || isLoading}
                          >
                            <HugeiconsIcon
                              icon={showOutlookPassword ? ViewOffIcon : EyeIcon}
                              strokeWidth={2}
                              className="h-4 w-4"
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Gmail */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between gap-2">
                        <Label className="text-sm font-medium">Gmail</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="gmail-default"
                            checked={config.smtp.gmailDefault}
                            onCheckedChange={handleGmailDefaultChange}
                            disabled={isSaving || isLoading}
                          />
                          <Label
                            htmlFor="gmail-default"
                            className="cursor-pointer text-sm"
                          >
                            Use as Default
                          </Label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="text"
                          value={config.smtp.gmailHost}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              smtp: {
                                ...config.smtp,
                                gmailHost: e.target.value,
                              },
                            })
                          }
                          placeholder="smtp.gmail.com"
                          disabled={isSaving || isLoading}
                        />
                        <Input
                          type="number"
                          value={config.smtp.gmailPort}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              smtp: {
                                ...config.smtp,
                                gmailPort: parseInt(e.target.value) || 587,
                              },
                            })
                          }
                          placeholder="Port"
                          disabled={isSaving || isLoading}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="email"
                          value={config.smtp.gmailUsername}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              smtp: {
                                ...config.smtp,
                                gmailUsername: e.target.value,
                              },
                            })
                          }
                          placeholder="Gmail Email"
                          disabled={isSaving || isLoading}
                        />
                        <div className="relative">
                          <Input
                            type={showGmailPassword ? "text" : "password"}
                            value={config.smtp.gmailPassword}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                smtp: {
                                  ...config.smtp,
                                  gmailPassword: e.target.value,
                                },
                              })
                            }
                            className="pr-10"
                            placeholder="Gmail Password"
                            disabled={isSaving || isLoading}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowGmailPassword(!showGmailPassword)
                            }
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            disabled={isSaving || isLoading}
                          >
                            <HugeiconsIcon
                              icon={showGmailPassword ? ViewOffIcon : EyeIcon}
                              strokeWidth={2}
                              className="h-4 w-4"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Settings Section - Using storeNotificationSettings directly */}
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  Notification Settings
                </h3>

                <div className="space-y-4">
                  {/* Course Announcements */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={CourseIcon}
                          strokeWidth={2}
                          className="h-4 w-4 text-muted-foreground"
                        />
                        <Label
                          className="cursor-pointer text-sm font-medium"
                          htmlFor="course-announcements"
                        >
                          Course Announcements
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new courses and course changes
                      </p>
                    </div>
                    <Switch
                      id="course-announcements"
                      checked={localSettings.courseAnnouncements}
                      onCheckedChange={(checked) =>
                        setLocalSettings({
                          ...localSettings,
                          courseAnnouncements: checked,
                        })
                      }
                      disabled={isSaving || isLoading || isNotificationSaving}
                    />
                  </div>

                  {/* JLPT Exam Announcements */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={BookOpenIcon}
                          strokeWidth={2}
                          className="h-4 w-4 text-muted-foreground"
                        />
                        <Label
                          className="cursor-pointer text-sm font-medium"
                          htmlFor="jlpt-exam-announcements"
                        >
                          JLPT Exam Announcements
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Get notified about JLPT exam schedules
                      </p>
                    </div>
                    <Switch
                      id="jlpt-exam-announcements"
                      checked={localSettings.examAnnouncements}
                      onCheckedChange={(checked) =>
                        setLocalSettings({
                          ...localSettings,
                          examAnnouncements: checked,
                        })
                      }
                      disabled={isSaving || isLoading || isNotificationSaving}
                    />
                  </div>

                  {/* Certificate Updates */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={Certificate01Icon}
                          strokeWidth={2}
                          className="h-4 w-4 text-muted-foreground"
                        />
                        <Label
                          className="cursor-pointer text-sm font-medium"
                          htmlFor="certificate-updates"
                        >
                          Certificate Updates
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about certificate status and renewals
                      </p>
                    </div>
                    <Switch
                      id="certificate-updates"
                      checked={localSettings.certificateUpdates}
                      onCheckedChange={(checked) =>
                        setLocalSettings({
                          ...localSettings,
                          certificateUpdates: checked,
                        })
                      }
                      disabled={isSaving || isLoading || isNotificationSaving}
                    />
                  </div>

                  {/* Email Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={Mail01Icon}
                          strokeWidth={2}
                          className="h-4 w-4 text-muted-foreground"
                        />
                        <Label
                          className="cursor-pointer text-sm font-medium"
                          htmlFor="email-notifications"
                        >
                          Email Notifications
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Receive notification emails for all alerts
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={localSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setLocalSettings({
                          ...localSettings,
                          emailNotifications: checked,
                        })
                      }
                      disabled={isSaving || isLoading || isNotificationSaving}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t p-6">
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving || isLoading || isNotificationSaving}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={
              isSaving || 
              isLoading || 
              isLoadingInitial || 
              isNotificationSaving ||
              !hasChanges
            }
          >
            {isSaving || isNotificationSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}