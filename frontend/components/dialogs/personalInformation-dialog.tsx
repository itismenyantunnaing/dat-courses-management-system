// app/components/dialogs/personal-information-dialog.tsx
"use client"

import { useState, useRef, useEffect } from "react"
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
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserAccountIcon,
  Camera01Icon,
  Delete02Icon,
  BriefcaseIcon,
  UserIcon,
  AwardIcon,
  CodeIcon,
  Language,
  ClockIcon,
} from "@hugeicons/core-free-icons"

// Custom progress bar component
const ProgressBar = ({
  value,
  className,
}: {
  value: number
  className?: string
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100)
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className || ""}`}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-300"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  )
}

interface PersonalInformationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: any
  onSave: (image: string) => Promise<void>
}

export function PersonalInformationDialog({
  open,
  onOpenChange,
  profile,
  onSave,
}: PersonalInformationDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState(
    profile?.profilePhotoPath || profile?.avatar || ""
  )
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (profile) {
      setProfileImage(profile.profilePhotoPath || profile.avatar || "")
    }
  }, [profile])

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

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(profileImage)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Helper function to get progress percentage (max 10 years)
  const getExperienceProgress = (years: number) => {
    return Math.min((years / 10) * 100, 100)
  }

  if (!profile) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-[700px]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Personal Information</DialogTitle>
          <DialogDescription>
            View and manage your personal information and profile.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <Avatar className="h-24 w-24 cursor-pointer transition-opacity hover:opacity-80">
                <AvatarImage
                  src={profileImage || "/avatars/default.jpg"}
                  alt={profile.name}
                />
                <AvatarFallback className="text-2xl">
                  {profile.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U"}
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
            {profileImage &&
              profileImage !== profile.profilePhotoPath &&
              profileImage !== profile.avatar && (
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

          {/* Basic Information */}
          <div className="py-2">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <HugeiconsIcon
                icon={UserAccountIcon}
                strokeWidth={2}
                className="h-4 w-4"
              />
              Basic Information
            </h3>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Employee Name
                  </Label>
                  <p className="text-base font-medium">{profile.name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Staff ID
                  </Label>
                  <p className="text-base font-medium">
                    {profile.staffId || profile.id || "Not assigned"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Email Address
                  </Label>
                  <p className="text-base font-medium">{profile.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Role</Label>
                  <p className="text-base font-medium">
                    {profile.role || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Status
                  </Label>
                  <Badge
                    className={getStatusColor(
                      profile.empStatus || profile.status || ""
                    )}
                  >
                    {profile.empStatus || profile.status || "Unknown"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </div>

          <Separator className="my-4" />

          {/* Department & Team */}
          <div className="py-2">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <HugeiconsIcon
                icon={BriefcaseIcon}
                strokeWidth={2}
                className="h-4 w-4"
              />
              Department & Team
            </h3>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Department
                  </Label>
                  <p className="text-base font-medium">
                    {profile.department || profile.deptDat || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Division
                  </Label>
                  <p className="text-base font-medium">
                    {profile.divName || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Team</Label>
                  <p className="text-base font-medium">
                    {profile.team || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Door Log
                  </Label>
                  <p className="text-base font-medium">
                    {profile.doorlog || "Not specified"}
                  </p>
                </div>
              </div>
            </CardContent>
          </div>

          {/* Technical Skills */}
          {profile.technicalSkills && profile.technicalSkills.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="py-2">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <HugeiconsIcon
                    icon={CodeIcon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                  Technical Skills
                </h3>
                <CardContent className="space-y-4 p-0">
                  {profile.technicalSkills.map((category: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                      <Label className="text-sm font-medium">
                        {!category.categoryName.includes("empty") &&
                          category.categoryName}
                      </Label>
                      {category.subCategories.map(
                        (sub: any, subIdx: number) => (
                          <div key={subIdx} className="ml-4 space-y-2">
                            <p className="text-sm text-muted-foreground">
                              {!sub.subCategoryName.includes("empty") &&
                                sub.subCategoryName}
                            </p>
                            <div className="space-y-2">
                              {sub.skills.map(
                                (skill: any, skillIdx: number) => {
                                  const years = skill.yearsOfExperience
                                  const progress = getExperienceProgress(years)

                                  return (
                                    <div
                                      key={skillIdx}
                                      className="rounded-lg border bg-muted/5 p-3"
                                    >
                                      <div className="mb-1 flex items-center justify-between">
                                        <span className="font-medium">
                                          {skill.skillName}
                                        </span>
                                        <div className="text-sm font-semibold text-muted-foreground">
                                          {years.toFixed(1)} years
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <ProgressBar
                                          value={progress}
                                          className="flex-1"
                                        />
                                        <span className="min-w-[40px] text-xs text-muted-foreground">
                                          {Math.round(progress)}%
                                        </span>
                                      </div>
                                    </div>
                                  )
                                }
                              )}
                            </div>
                          </div>
                        )
                      )}
                      <Separator className="my-3" />
                    </div>
                  ))}
                </CardContent>
              </div>
            </>
          )}

          {/* Development Skills */}
          {profile.developmentSkills &&
            profile.developmentSkills.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="py-2">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <HugeiconsIcon
                      icon={UserIcon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                    Development Skills
                  </h3>
                  <CardContent className="space-y-3 p-0">
                    {profile.developmentSkills.map(
                      (skill: any, idx: number) => {
                        const years = skill.yearsOfExperience
                        const progress = getExperienceProgress(years)

                        return (
                          <div
                            key={idx}
                            className="rounded-lg border bg-muted/5 p-3"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {skill.developmentTypeName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {skill.processName}
                                </p>
                              </div>
                              <div className="text-sm font-semibold text-muted-foreground">
                                {years.toFixed(1)} years
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                              <ProgressBar
                                value={progress}
                                className="flex-1"
                              />
                              <span className="min-w-[40px] text-xs text-muted-foreground">
                                {Math.round(progress)}%
                              </span>
                            </div>
                          </div>
                        )
                      }
                    )}
                  </CardContent>
                </div>
              </>
            )}

          {/* Language Skills */}
          {profile.languageSkill && (
            <>
              <Separator className="my-4" />
              <div className="py-2">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <HugeiconsIcon
                    icon={Language}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                  Language Skills
                </h3>
                <CardContent className="space-y-2 p-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        JLPT Level
                      </Label>
                      <p className="text-base font-medium">
                        {profile.languageSkill.jlptHighestLevel ||
                          "Not specified"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        Language Level
                      </Label>
                      <p className="text-base font-medium">
                        Level {profile.languageSkill.languageSkillLevel}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </div>
            </>
          )}

          {/* Management Skills */}
          {profile.managementSkill && (
            <>
              <Separator className="my-4" />
              <div className="py-2">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <HugeiconsIcon
                    icon={AwardIcon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                  Management Skills
                </h3>
                <CardContent className="space-y-2 p-0">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        Education
                      </Label>
                      <p className="text-base font-medium">
                        {profile.managementSkill.educationScore}/5
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        Management Experience
                      </Label>
                      <p className="text-base font-medium">
                        Level{" "}
                        {profile.managementSkill.managementExperienceLevel}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        QCD
                      </Label>
                      <p className="text-base font-medium">
                        {profile.managementSkill.qcdScore}/5
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        Report/Consult
                      </Label>
                      <p className="text-base font-medium">
                        {profile.managementSkill.reportConsultScore}/5
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        Total Level
                      </Label>
                      <p className="text-base font-medium">
                        Level {profile.managementSkill.totalLevel}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </div>
            </>
          )}

          {/* Additional Info */}
          <Separator className="my-4" />
          <div className="py-2">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <HugeiconsIcon
                icon={ClockIcon}
                strokeWidth={2}
                className="h-4 w-4"
              />
              Additional Information
            </h3>
            <CardContent className="space-y-2 p-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Core Personnel
                  </Label>
                  <p className="text-base font-medium">
                    {profile.isCorePersonnel ? "Yes" : "No"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Japan Business Trip
                  </Label>
                  <p className="text-base font-medium">
                    {profile.hasJapanBusinessTrip ? "Yes" : "No"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Date of Birth
                  </Label>
                  <p className="text-base font-medium">
                    {profile.dob || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Notifications
                  </Label>
                  <p className="text-base font-medium">
                    {profile.notiSetting ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
            </CardContent>
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
          <Button className="flex-1" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
