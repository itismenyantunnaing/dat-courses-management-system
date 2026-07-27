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
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
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
  Loading03Icon,
  CalendarIcon,
  UserGroupIcon,
  PlaneIcon,
} from "@hugeicons/core-free-icons"
import { mainStore } from "@/store/mainStore"

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
}

export function PersonalInformationDialog({
  open,
  onOpenChange,
}: PersonalInformationDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form fields state
  const [isCorePersonnel, setIsCorePersonnel] = useState<boolean>(false)
  const [hasJapanBusinessTrip, setHasJapanBusinessTrip] = useState<boolean>(false)
  const [dob, setDob] = useState<string>("")

  // Store initial values for change detection
  const [initialValues, setInitialValues] = useState({
    isCorePersonnel: false,
    hasJapanBusinessTrip: false,
    dob: "",
    profilePhotoPath: "",
  })

  // Track if image was removed
  const [imageRemoved, setImageRemoved] = useState(false)

  // Get store actions and state
  const {
    employeeProfile,
    fetch_EmployeeProfile,
    update_EmployeeProfileFields,
    update_ProfileImage,
    delete_ProfileImage,
    isUpdating,
    isLoading,
    profile,
  } = mainStore()

  const employeeId = profile?.id

  // Fetch employee profile when dialog opens
  useEffect(() => {
    if (open && employeeId) {
      fetch_EmployeeProfile(employeeId)
    }
  }, [open, employeeId, fetch_EmployeeProfile])

  // Update form fields when profile data loads
  useEffect(() => {
    
    if (employeeProfile) {
      const corePersonnel = employeeProfile.isCorePersonnel ?? false
      const japanTrip = employeeProfile.hasJapanBusinessTrip ?? false
      const dobValue = employeeProfile.dob || ""
      const photoPath = employeeProfile.profilePhotoPath || ""


      setIsCorePersonnel(corePersonnel)
      setHasJapanBusinessTrip(japanTrip)
      setDob(dobValue)

      setInitialValues({
        isCorePersonnel: corePersonnel,
        hasJapanBusinessTrip: japanTrip,
        dob: dobValue,
        profilePhotoPath: photoPath,
      })
      
      // Reset image removed flag when profile loads
      setImageRemoved(false)
      setSelectedFile(null)
      setPreviewImage("")
    } else if (profile) {
      const corePersonnel = profile.isCorePersonnel ?? false
      const japanTrip = profile.hasJapanBusinessTrip ?? false
      const dobValue = profile.dob || ""
      const photoPath = profile.profilePhotoPath || profile.avatar || ""


      setIsCorePersonnel(corePersonnel)
      setHasJapanBusinessTrip(japanTrip)
      setDob(dobValue)

      setInitialValues({
        isCorePersonnel: corePersonnel,
        hasJapanBusinessTrip: japanTrip,
        dob: dobValue,
        profilePhotoPath: photoPath,
      })
      
      setImageRemoved(false)
      setSelectedFile(null)
      setPreviewImage("")
    }
  }, [employeeProfile, profile])

  // Reset preview and image removed state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setPreviewImage("")
      setImageRemoved(false)
    }
  }, [open])

  // Check if there are any changes
  const hasChanges = () => {
    const hasImageChange = 
      selectedFile !== null || 
      imageRemoved || // Check if image was removed
      (previewImage !== "" && previewImage !== initialValues.profilePhotoPath)
    
    const hasFieldChanges =
      isCorePersonnel !== initialValues.isCorePersonnel ||
      hasJapanBusinessTrip !== initialValues.hasJapanBusinessTrip ||
      dob !== initialValues.dob

    const hasChangesValue = hasImageChange || hasFieldChanges
    
    return hasChangesValue
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit. Please choose a smaller file.")
        return
      }

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!validTypes.includes(file.type)) {
        alert("Please upload a valid image file (JPG, PNG, or GIF).")
        return
      }

      setSelectedFile(file)
      setImageRemoved(false) // Reset removed flag when uploading new image
      setIsUploading(true)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setPreviewImage("")
    setImageRemoved(true) // Mark image as removed
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    if (!employeeId) {
      console.error("❌ No employee ID found")
      return
    }

    if (!hasChanges()) {
      onOpenChange(false)
      return
    }

    setIsSaving(true)
    try {
      // 1. Handle image changes
      if (imageRemoved) {
        // Remove existing image from server
        try {
          const result = await delete_ProfileImage(employeeId)
        } catch (deleteError) {
          console.error("❌ Error deleting image:", deleteError)
          // Continue with other updates even if image deletion fails
        }
      } else if (selectedFile) {
        // Upload new profile image
        try {
          const result = await update_ProfileImage(employeeId, selectedFile)
        } catch (uploadError) {
          console.error("❌ Error uploading image:", uploadError)
          // Continue with other updates even if image upload fails
        }
      } 
      // 2. Handle field changes
      const fieldChanges: {
        isCorePersonnel?: boolean
        hasJapanBusinessTrip?: boolean
        dob?: string
      } = {}

      if (isCorePersonnel !== initialValues.isCorePersonnel) {
        fieldChanges.isCorePersonnel = isCorePersonnel
      }
      if (hasJapanBusinessTrip !== initialValues.hasJapanBusinessTrip) {
        fieldChanges.hasJapanBusinessTrip = hasJapanBusinessTrip
      }
      if (dob !== initialValues.dob) {
        fieldChanges.dob = dob
      }

      // 3. Refresh profile data
      await fetch_EmployeeProfile(employeeId)
      
      onOpenChange(false)
    } catch (error) {
      console.error("❌ Failed to save profile:", error)
    } finally {
      setIsSaving(false)
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

  // Get the profile image to display
  const getProfileImage = () => {
    // If image was removed, show default avatar
    if (imageRemoved) return ""
    if (previewImage) return previewImage
    if (employeeProfile?.profilePhotoPath) return employeeProfile?.profilePhotoPath
    if (profile?.profilePhotoPath) return profile?.profilePhotoPath
    if (profile?.avatar) return profile?.avatar
    return ""
  }

  // Get employee name
  const getEmployeeName = () => {
    return profile?.name || employeeProfile?.employeeId || "User"
  }

  // Check if there's an existing image
  const hasExistingImage = () => {
    return !imageRemoved && (employeeProfile?.profilePhotoPath || profile?.profilePhotoPath || profile?.avatar)
  }

  // Use profile data, fallback to employeeProfile
  const displayProfile = profile || employeeProfile || {}

  if (isLoading && !employeeProfile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-[700px]">
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <HugeiconsIcon
                icon={Loading03Icon}
                role="status"
                aria-label="Loading"
                className="size-4 animate-spin"
              />
              <p className="text-sm text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!displayProfile && !employeeProfile) return null

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
                  src={getProfileImage() || "/avatars/default.jpg"}
                  alt={getEmployeeName()}
                />
                <AvatarFallback className="text-2xl">
                  {getEmployeeName()
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
                disabled={isUploading || isUpdating || isSaving}
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
            
            {/* Show Remove button if there's an existing image or preview */}
            {(hasExistingImage() || previewImage) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveImage}
                className="text-destructive"
                disabled={isUpdating || isSaving}
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

          {/* Basic Information - keep existing code */}
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
                  <p className="text-base font-medium">
                    {profile?.name || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Staff ID
                  </Label>
                  <p className="text-base font-medium">
                    {profile?.staffId || profile?.id || employeeId || "Not assigned"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Email Address
                  </Label>
                  <p className="text-base font-medium">
                    {profile?.email || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Role</Label>
                  <p className="text-base font-medium">
                    {profile?.role || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Status
                  </Label>
                  <Badge
                    className={getStatusColor(
                      profile?.empStatus || profile?.status || ""
                    )}
                  >
                    {profile?.empStatus || profile?.status || "Unknown"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </div>

          <Separator className="my-4" />

          {/* Department & Team - keep existing code */}
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
                    {profile?.department || profile?.deptDat || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Division
                  </Label>
                  <p className="text-base font-medium">
                    {profile?.divName || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Team</Label>
                  <p className="text-base font-medium">
                    {profile?.team || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Door Log
                  </Label>
                  <p className="text-base font-medium">
                    {profile?.doorlog || "Not specified"}
                  </p>
                </div>
              </div>
            </CardContent>
          </div>

          {/* Editable Fields Section - CRUD for Additional Information */}
          <Separator className="my-4" />
          <div className="py-2">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <HugeiconsIcon
                icon={ClockIcon}
                strokeWidth={2}
                className="h-4 w-4"
              />
              Additional Information
            </h3>
            <CardContent className="space-y-4 p-0">
              {/* Core Personnel */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={UserGroupIcon}
                      strokeWidth={2}
                      className="h-4 w-4 text-muted-foreground"
                    />
                    <Label
                      className="cursor-pointer text-sm font-medium"
                      htmlFor="core-personnel"
                    >
                      Core Personnel
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Mark as core personnel for special assignments
                  </p>
                </div>
                <Switch
                  id="core-personnel"
                  checked={isCorePersonnel}
                  onCheckedChange={(checked) => {
                    setIsCorePersonnel(checked)
                  }}
                  disabled={isUpdating || isSaving}
                />
              </div>

              {/* Japan Business Trip */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={PlaneIcon}
                      strokeWidth={2}
                      className="h-4 w-4 text-muted-foreground"
                    />
                    <Label
                      className="cursor-pointer text-sm font-medium"
                      htmlFor="japan-trip"
                    >
                      Japan Business Trip
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Eligible for Japan business trips
                  </p>
                </div>
                <Switch
                  id="japan-trip"
                  checked={hasJapanBusinessTrip}
                  onCheckedChange={(checked) => {
                    setHasJapanBusinessTrip(checked)
                  }}
                  disabled={isUpdating || isSaving}
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={CalendarIcon}
                    strokeWidth={2}
                    className="h-4 w-4 text-muted-foreground"
                  />
                  <Label htmlFor="dob" className="text-sm font-medium">
                    Date of Birth
                  </Label>
                </div>
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value)
                  }}
                  disabled={isUpdating || isSaving}
                  className="max-w-[200px]"
                />
              </div>
            </CardContent>
          </div>


          {/* Technical Skills - keep existing code */}
          {profile?.technicalSkills && profile.technicalSkills.length > 0 && (
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

          {/* Development Skills - keep existing code */}
          {profile?.developmentSkills &&
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

          {/* Language Skills - keep existing code */}
          {profile?.languageSkill && (
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

          {/* Management Skills - keep existing code */}
          {profile?.managementSkill && (
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
        </div>

        <DialogFooter className="border-t p-6 pt-4">
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating || isSaving}
          >
            Close
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={isUpdating || isSaving || !hasChanges()}
          >
            {isUpdating || isSaving ? (
              <>
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="mr-2 h-4 w-4 animate-spin"
                />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}