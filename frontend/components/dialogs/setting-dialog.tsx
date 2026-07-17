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
  Setting06Icon,
  EyeIcon,
  ViewOffIcon,
  CourseIcon,
  BookOpenIcon,
  Certificate01Icon,
  Settings02Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: {
    fileUploadSize: number
    sessionTimeout: number
    jwtExpiry: number
    maxLoginAttempts: number
    smtp: {
      gmailHost: string
      gmailPassword: string
      gmailDefault: boolean
      outlookHost: string
      outlookPassword: string
      outlookDefault: boolean
    }
  }
  notificationSettings: {
    courseAnnouncements: boolean
    jlptExamAnnouncements: boolean
    certificateUpdates: boolean
    systemNotifications: boolean
    emailNotifications: boolean
  }
  onSave: (config: any, notificationSettings: any) => Promise<void>
  isLoading?: boolean
}

export function SettingDialog({
  open,
  onOpenChange,
  config: initialConfig,
  notificationSettings: initialNotificationSettings,
  onSave,
  isLoading = false,
}: SettingsDialogProps) {
  const [config, setConfig] = useState(initialConfig)
  const [notificationSettings, setNotificationSettings] = useState(
    initialNotificationSettings
  )
  const [hasChanges, setHasChanges] = useState(false)
  const [showGmailPassword, setShowGmailPassword] = useState(false)
  const [showOutlookPassword, setShowOutlookPassword] = useState(false)

  // Check if there are changes whenever config or notification settings update
  useEffect(() => {
    const configChanged =
      JSON.stringify(config) !== JSON.stringify(initialConfig)
    const notificationChanged =
      JSON.stringify(notificationSettings) !==
      JSON.stringify(initialNotificationSettings)
    setHasChanges(configChanged || notificationChanged)
  }, [config, initialConfig, notificationSettings, initialNotificationSettings])

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setConfig(initialConfig)
      setNotificationSettings(initialNotificationSettings)
      setHasChanges(false)
    }
  }, [open, initialConfig, initialNotificationSettings])

  const handleSave = async () => {
    if (hasChanges) {
      await onSave(config, notificationSettings)
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
                        />
                        <Label
                          htmlFor="outlook-default"
                          className="cursor-pointer text-sm"
                        >
                          Use as Default
                        </Label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex flex-1 items-center gap-2">
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
                          className="flex-1"
                          placeholder="smtp.office365.com"
                        />
                      </div>
                      <div className="relative flex flex-1 items-center">
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
                          className="flex-1 pr-10"
                          placeholder="Enter Outlook password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowOutlookPassword(!showOutlookPassword)
                          }
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                        />
                        <Label
                          htmlFor="gmail-default"
                          className="cursor-pointer text-sm"
                        >
                          Use as Default
                        </Label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex flex-1">
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
                          className="flex-1"
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div className="relative flex flex-1 items-center">
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
                          className="flex-1 pr-10"
                          placeholder="Enter Gmail password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowGmailPassword(!showGmailPassword)
                          }
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

            {/* Notification Settings Section */}
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
                    checked={notificationSettings.courseAnnouncements}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        courseAnnouncements: checked,
                      })
                    }
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
                    checked={notificationSettings.jlptExamAnnouncements}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        jlptExamAnnouncements: checked,
                      })
                    }
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
                    checked={notificationSettings.certificateUpdates}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        certificateUpdates: checked,
                      })
                    }
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
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: checked,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t p-6 pt-4">
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
