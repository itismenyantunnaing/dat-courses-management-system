// app/components/dialogs/personal-information-dialog.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { resolveUploadUrl } from "@/lib/utils"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Edit01Icon,
  Trash,
  Add01Icon,
} from "@hugeicons/core-free-icons"
import { mainStore } from "@/store/mainStore"
import { compressFile } from "@/lib/compressImage"
import { toast } from "sonner"
import { dialog } from "./import-export-confirm-dialog"

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
  onDropdownOpenChange?: (isOpen: boolean) => void
}

export function PersonalInformationDialog({
  open,
  onOpenChange,
  onDropdownOpenChange,
}: PersonalInformationDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form fields state
  const [isCorePersonnel, setIsCorePersonnel] = useState<boolean>(false)
  const [hasJapanBusinessTrip, setHasJapanBusinessTrip] =
    useState<boolean>(false)
  const [dob, setDob] = useState<string>("")

  // Technical skill editing states
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null)
  const [editYears, setEditYears] = useState<string>("")
  const [editExperienceLevel, setEditExperienceLevel] = useState<string>("")
  const [isSkillUpdating, setIsSkillUpdating] = useState(false)

  // Technical skill adding states
  const [isAddingSkill, setIsAddingSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState<string>("")
  const [newSkillYears, setNewSkillYears] = useState<string>("")
  const [newSkillExperienceLevel, setNewSkillExperienceLevel] =
    useState<string>("")
  const [newSkillCategory, setNewSkillCategory] = useState<string>("")
  const [newSkillSubCategory, setNewSkillSubCategory] = useState<string>("")
  const [isAddingSkillLoading, setIsAddingSkillLoading] = useState(false)

  // Language skill states
  const [languageLevel, setLanguageLevel] = useState<number>(1)
  const [jlptLevel, setJlptLevel] = useState<string>("")
  const [isLanguageUpdating, setIsLanguageUpdating] = useState(false)

  // Management skill states
  const [managementEducation, setManagementEducation] = useState<number>(1)
  const [managementExperience, setManagementExperience] = useState<number>(1)
  const [managementQcd, setManagementQcd] = useState<number>(1)
  const [managementReportConsult, setManagementReportConsult] =
    useState<number>(1)
  const [isManagementUpdating, setIsManagementUpdating] = useState(false)
  const [isManagementEditing, setIsManagementEditing] = useState(false)

  // Development skill states
  const [editingDevSkillId, setEditingDevSkillId] = useState<string | null>(
    null
  )
  const [editDevYears, setEditDevYears] = useState<string>("")
  const [editDevProcessName, setEditDevProcessName] = useState<string>("")
  const [isDevUpdating, setIsDevUpdating] = useState(false)

  // Development skill adding states
  const [isAddingDevSkill, setIsAddingDevSkill] = useState(false)
  const [newDevTypeName, setNewDevTypeName] = useState<string>("")
  const [newDevProcessName, setNewDevProcessName] = useState<string>("")
  const [newDevYears, setNewDevYears] = useState<string>("")
  const [isAddingDevLoading, setIsAddingDevLoading] = useState(false)

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
    fetch_EmployeeProfile,
    profile,
    update_EmployeeProfileFields,
    update_ProfileImage,
    delete_ProfileImage,
    isUpdating,
    isLoading,
    fetch_SkillHeaders,
    skill_headers,
    add_SkillData,
    update_SkillData,
    delete_SkillData,
    add_japaneseLevel,
    update_japaneseLevel,
    add_managementScoreData,
    update_managementScoreData,
    fetch_devCapHeaders,
    devCap_headers,
    add_devCapData,
    update_devCapData,
    add_EmployeeJapaneseLevel,
    edit_EmployeeJapaneseLevel,
    fetch_SystemConfig,
    systemConfig,
  } = mainStore()

  const employeeId = profile?.id

  // Fetch employee profile when dialog opens
  useEffect(() => {
    if (open && employeeId) {
      fetch_EmployeeProfile(employeeId)
      if (skill_headers.length === 0) {
        fetch_SkillHeaders()
      }
      if (devCap_headers.length === 0) {
        fetch_devCapHeaders()
      }
      fetch_SystemConfig()
    }
  }, [open, employeeId, fetch_EmployeeProfile])

  // Update form fields when profile data loads
  useEffect(() => {
    if (profile) {
      const corePersonnel = profile.isCorePersonnel ?? false
      const japanTrip = profile.hasJapanBusinessTrip ?? false
      const dobValue = profile.dob || ""
      const photoPath = profile.profilePhotoPath || ""

      setIsCorePersonnel(corePersonnel)
      setHasJapanBusinessTrip(japanTrip)
      setDob(dobValue)

      // Set language skills if exists
      if (profile.languageSkill) {
        setLanguageLevel(profile.languageSkill.languageSkillLevel || 1)
        setJlptLevel(profile.languageSkill.jlptHighestLevel || "")
      }

      // Set management skills if exists
      if (profile.managementSkill) {
        setManagementEducation(profile.managementSkill.educationScore || 1)
        setManagementExperience(
          profile.managementSkill.managementExperienceLevel || 1
        )
        setManagementQcd(profile.managementSkill.qcdScore || 1)
        setManagementReportConsult(
          profile.managementSkill.reportConsultScore || 1
        )
      }

      setInitialValues({
        isCorePersonnel: corePersonnel,
        hasJapanBusinessTrip: japanTrip,
        dob: dobValue,
        profilePhotoPath: photoPath,
      })

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

      // Set language skills if exists
      if (profile.languageSkill) {
        setLanguageLevel(profile.languageSkill.languageSkillLevel || 1)
        setJlptLevel(profile.languageSkill.jlptHighestLevel || "")
      }

      // Set management skills if exists
      if (profile.managementSkill) {
        setManagementEducation(profile.managementSkill.educationScore || 1)
        setManagementExperience(
          profile.managementSkill.managementExperienceLevel || 1
        )
        setManagementQcd(profile.managementSkill.qcdScore || 1)
        setManagementReportConsult(
          profile.managementSkill.reportConsultScore || 1
        )
      }

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
  }, [profile, profile])

  // Reset preview and image removed state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setPreviewImage("")
      setImageRemoved(false)
      setEditingSkillId(null)
      setEditYears("")
      setEditExperienceLevel("")
    }
  }, [open])

  // Check if there are any changes
  const hasChanges = () => {
    const hasImageChange =
      selectedFile !== null ||
      imageRemoved ||
      (previewImage !== "" && previewImage !== initialValues.profilePhotoPath)

    const hasFieldChanges =
      isCorePersonnel !== initialValues.isCorePersonnel ||
      hasJapanBusinessTrip !== initialValues.hasJapanBusinessTrip ||
      dob !== initialValues.dob

    return hasImageChange || hasFieldChanges
  }

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!validTypes.includes(file.type)) {
        toast.warning("Please upload a valid image file (JPG, PNG, or GIF).")
        return
      }

      setSelectedFile(file)
      setImageRemoved(false)
      setIsUploading(true)

      try {
        const maxSizeMB = systemConfig?.fileUploadSizeMb || 0.75
        // COMPRESS THE IMAGE HERE
        const compressedFile = await compressFile(file, maxSizeMB)

        // Use the compressed file instead of the original
        setSelectedFile(compressedFile)

        // Create preview from compressed file
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewImage(reader.result as string)
          setIsUploading(false)
        }
        reader.readAsDataURL(compressedFile)
      } catch (error) {
        console.error(" Failed to compress image:", error)
        // Fallback: use original file if compression fails
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewImage(reader.result as string)
          setIsUploading(false)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setPreviewImage("")
    setImageRemoved(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle skill update
  const handleSkillUpdate = async (
    skillId: string,
    skillName: string,
    categoryName?: string,
    subCategoryName?: string
  ) => {
    if (!employeeId) {
      return
    }

    if (!editYears || !editExperienceLevel) {
      return
    }

    setIsSkillUpdating(true)
    try {
      await update_SkillData(parseInt(skillId), {
        employeeId: employeeId,
        skillName: skillName,
        categoryName: categoryName,
        subCategoryName: subCategoryName,
        yearsOfExperience: parseFloat(editYears),
        experienceLevel: editExperienceLevel,
      })

      // Refresh profile data
      await fetch_EmployeeProfile(employeeId)

      // Reset edit state
      setEditingSkillId(null)
      setEditYears("")
      setEditExperienceLevel("")
    } catch (error) {
      console.error(" Failed to update skill:", error)
    } finally {
      setIsSkillUpdating(false)
    }
  }

  // Handle adding new skill
  const handleAddSkill = async () => {
    if (!employeeId) {
      return
    }

    if (!newSkillName) {
      return
    }

    if (!newSkillYears || !newSkillExperienceLevel) {
      return
    }

    setIsAddingSkillLoading(true)
    try {
      // You'll need to use add_SkillData from your store
      await add_SkillData({
        employeeId: employeeId,
        skillName: newSkillName,
        categoryName: newSkillCategory || undefined,
        subCategoryName: newSkillSubCategory || undefined,
        yearsOfExperience: parseFloat(newSkillYears),
        experienceLevel: newSkillExperienceLevel,
      })

      // Refresh profile data
      await fetch_EmployeeProfile(employeeId)

      // Reset form
      setNewSkillName("")
      setNewSkillYears("")
      setNewSkillExperienceLevel("")
      setNewSkillCategory("")
      setNewSkillSubCategory("")
      setIsAddingSkill(false)
    } catch (error) {
      console.error(" Failed to add skill:", error)
    } finally {
      setIsAddingSkillLoading(false)
    }
  }

  // Handle skill delete
  const handleSkillDelete = async (skillId: string) => {
    if (!employeeId) {
      return
    }

    const confirmed = await dialog.confirm(
      "Confirm Deletion",
      "Are you sure you want to delete this skill?",
      "Yes, Delete",
      "Cancel",
      undefined,
      true // isDestructive
    )

    if (!confirmed) {
      return
    }
    try {
      await delete_SkillData(parseInt(skillId))

      // Refresh profile data
      await fetch_EmployeeProfile(employeeId)
    } catch (error) {
      console.error(" Failed to delete skill:", error)
    }
  }

  // Handle management skill update
  const handleManagementUpdate = async () => {
    if (!employeeId) {
      toast.warning("No employee ID found")
      return
    }

    setIsManagementUpdating(true)
    try {
      const managementData = {
        employeeId: employeeId,
        managementExperienceLevel: managementExperience,
        qcdScore: managementQcd,
        reportConsultScore: managementReportConsult,
        educationScore: managementEducation,
      }

      // Check if management skill exists
      if (profile?.managementSkill?.id) {
        // Update existing management skill
        await update_managementScoreData(
          profile.managementSkill.id,
          managementData
        )
        toast.success("Management skills updated successfully!")
      } else {
        // Add new management skill
        await add_managementScoreData(managementData)
        toast.success("Management skills added successfully!")
      }

      // Refresh profile data
      await fetch_EmployeeProfile(employeeId)

      // Exit edit mode
      setIsManagementEditing(false)
    } catch (error) {
      console.error(" Failed to update management skill:", error)
      toast.error("Failed to update management skills")
    } finally {
      setIsManagementUpdating(false)
    }
  }

  // Handle language skill update
  const handleLanguageUpdate = async () => {
    if (!employeeId) {
      toast.warning("No employee ID found")
      return
    }

    setIsLanguageUpdating(true)
    try {
      // Prepare the data with both fields
      const languageData = {
        employeeId: employeeId,
        languageSkillLevel: languageLevel,
        jlptHighestLevel: jlptLevel || null,
      }

      // Check if language skill exists
      if (profile?.languageSkill?.id) {
        // Update existing language skill using edit_EmployeeJapaneseLevel
        await edit_EmployeeJapaneseLevel(profile.languageSkill.id, languageData)
        toast.success("Language skills updated successfully!")
      } else {
        // Add new language skill using add_EmployeeJapaneseLevel
        await add_EmployeeJapaneseLevel(languageData)
        toast.success("Language skills added successfully!")
      }

      // Refresh profile data
      await fetch_EmployeeProfile(employeeId)
    } catch (error) {
      console.error(" Failed to update language skill:", error)
      toast.error("Failed to update language skills")
    } finally {
      setIsLanguageUpdating(false)
    }
  }

  const handleSave = async () => {
    if (!employeeId) {
      console.error(" No employee ID found")
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
        try {
          await delete_ProfileImage(employeeId)
        } catch (deleteError) {
          console.error(" Error deleting image:", deleteError)
        }
      } else if (selectedFile) {
        try {
          await update_ProfileImage(employeeId, selectedFile)
        } catch (uploadError) {
          console.error(" Error uploading image:", uploadError)
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

      if (Object.keys(fieldChanges).length > 0) {
        await update_EmployeeProfileFields(employeeId, fieldChanges)
      }

      // 3. Refresh profile data to get latest values
      await fetch_EmployeeProfile(employeeId)

      // 4. Update initial values to match current state
      setInitialValues({
        isCorePersonnel: isCorePersonnel,
        hasJapanBusinessTrip: hasJapanBusinessTrip,
        dob: dob,
        profilePhotoPath:
          profile?.profilePhotoPath || profile?.profilePhotoPath || "",
      })

      onOpenChange(false)
    } catch (error) {
      console.error(" Failed to save profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle development skill edit
  const handleDevSkillEdit = (skill: any) => {
    setEditingDevSkillId(skill.id)
    setEditDevYears(skill.yearsOfExperience?.toString() || "")
    setEditDevProcessName(skill.processName || "")
  }

  // Handle development skill update
  const handleDevSkillUpdate = async (
    skillId: string,
    developmentTypeName: string
  ) => {
    if (!employeeId) {
      toast.warning("No employee ID found")
      return
    }

    if (!editDevYears || !editDevProcessName) {
      toast.warning("Please fill in both years and process name")
      return
    }

    setIsDevUpdating(true)
    try {
      await update_devCapData(parseInt(skillId), {
        employeeId: employeeId,
        developmentTypeName: developmentTypeName,
        processName: editDevProcessName,
        yearsOfExperience: parseFloat(editDevYears),
      })

      toast.success("Development skill updated successfully!")

      // Refresh profile data
      await fetch_EmployeeProfile(employeeId)

      // Reset edit state
      setEditingDevSkillId(null)
      setEditDevYears("")
      setEditDevProcessName("")
    } catch (error) {
      console.error(" Failed to update development skill:", error)
      toast.error("Failed to update development skill")
    } finally {
      setIsDevUpdating(false)
    }
  }

  // Handle adding new development skill
  const handleAddDevSkill = async () => {
    if (!employeeId) {
      toast.warning("No employee ID found")
      return
    }

    if (!newDevTypeName || !newDevProcessName || !newDevYears) {
      toast.warning("Please fill in all fields")
      return
    }

    setIsAddingDevLoading(true)
    try {
      await add_devCapData({
        employeeId: employeeId,
        developmentTypeName: newDevTypeName,
        processName: newDevProcessName,
        yearsOfExperience: parseFloat(newDevYears),
      })

      toast.success("Development skill added successfully!")

      // Refresh profile data
      await fetch_EmployeeProfile(employeeId)

      // Reset form
      setNewDevTypeName("")
      setNewDevProcessName("")
      setNewDevYears("")
      setIsAddingDevSkill(false)
    } catch (error) {
      console.error(" Failed to add development skill:", error)
      toast.error("Failed to add development skill")
    } finally {
      setIsAddingDevLoading(false)
    }
  }

  // Cancel development skill edit
  const cancelDevSkillEdit = () => {
    setEditingDevSkillId(null)
    setEditDevYears("")
    setEditDevProcessName("")
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

  const getExperienceProgress = (years: number) => {
    return Math.min((years / 10) * 100, 100)
  }

  const getProfileImage = () => {
    if (imageRemoved) return ""
    if (previewImage) return previewImage
    if (profile?.profilePhotoPath)
      return resolveUploadUrl(profile?.profilePhotoPath)
    return ""
  }

  const getEmployeeName = () => {
    return profile?.name || profile?.employeeId || "User"
  }

  const hasExistingImage = () => {
    return (
      !imageRemoved &&
      (profile?.profilePhotoPath ||
        profile?.profilePhotoPath ||
        profile?.avatar)
    )
  }

  const displayProfile = profile || profile || {}

  if (isLoading && !profile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex max-h-[90vh] flex-col p-0 sm:max-w-[700px]"
          onInteractOutside={(e) => {
            // Prevent closing when clicking on the select dropdown
            const target = e.target as HTMLElement
            if (
              target.closest('[role="combobox"]') ||
              target.closest('[role="listbox"]')
            ) {
              e.preventDefault()
            }
          }}
        >
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <HugeiconsIcon
                icon={Loading03Icon}
                role="status"
                aria-label="Loading"
                className="size-4 animate-spin"
              />
              <p className="text-sm text-muted-foreground">
                Loading profile...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!displayProfile && !profile) return null

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
                    .map((n: any[]) => n[0])
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
                  <p className="text-base font-medium">
                    {profile?.name || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Staff ID
                  </Label>
                  <p className="text-base font-medium">
                    {profile?.staffId ||
                      profile?.id ||
                      employeeId ||
                      "Not assigned"}
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

          {/* Editable Fields Section */}
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

          {/* Technical Skills */}
          <>
            <Separator className="my-4" />
            <div className="py-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <HugeiconsIcon
                    icon={CodeIcon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                  Technical Skills
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingSkill(!isAddingSkill)}
                  disabled={isUpdating || isSaving}
                >
                  <HugeiconsIcon
                    icon={Add01Icon}
                    strokeWidth={2}
                    className="mr-1 h-4 w-4"
                  />
                  Add Skill
                </Button>
              </div>

              {/* Add Skill Form */}
              {isAddingSkill && (
                <CardContent className="mb-4 space-y-3 rounded-lg border p-4">
                  <div className="grid grid-cols-12 gap-3">
                    {/* Skill Name Dropdown - Takes 6 columns */}
                    <div className="col-span-6 space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Skill Name *
                      </Label>
                      <Select
                        value={newSkillName}
                        onOpenChange={(open) => {
                          // This prevents the dialog from closing when the select opens/closes
                          if (onDropdownOpenChange) {
                            onDropdownOpenChange(open)
                          }
                        }}

                        onValueChange={(value) => {
                          setNewSkillName(value)
                          // Find the selected skill to get category and subcategory
                          for (const category of skill_headers) {
                            for (const sub of category.skillSubCategories ||
                              []) {
                              for (const skill of sub.skills || []) {
                                if (skill.skillName === value) {
                                  setNewSkillCategory(category.categoryName)
                                  setNewSkillSubCategory(sub.subCategoryName)
                                  break
                                }
                              }
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="Select a skill..." />
                        </SelectTrigger>
                        <SelectContent>
                          {skill_headers.map((category: any) => (
                            <div key={category.id}>
                              {category.skillSubCategories?.map((sub: any) => (
                                <div key={sub.id}>
                                  {sub.skills?.map((skill: any) => (
                                    <SelectItem
                                      key={skill.id}
                                      value={skill.skillName}
                                    >
                                      {skill.skillName}
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Years of Experience - Takes 2 columns */}
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Years *
                      </Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={newSkillYears}
                        onChange={(e) => {
                          setNewSkillYears(e.target.value)
                        }}
                        placeholder="0.0"
                        className="h-9 w-full"
                        disabled={isAddingSkillLoading}
                      />
                    </div>

                    {/* Experience Level - Takes 4 columns */}
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Experience Level *
                      </Label>
                      <Input
                        type="text"
                        value={newSkillExperienceLevel}
                        onChange={(e) => {
                          setNewSkillExperienceLevel(e.target.value)
                        }}
                        placeholder="e.g., Intermediate"
                        className="h-9 w-full"
                        disabled={isAddingSkillLoading}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingSkill(false)
                        setNewSkillName("")
                        setNewSkillYears("")
                        setNewSkillExperienceLevel("")
                        setNewSkillCategory("")
                        setNewSkillSubCategory("")
                      }}
                      disabled={isAddingSkillLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddSkill}
                      disabled={
                        isAddingSkillLoading ||
                        !newSkillName ||
                        !newSkillYears ||
                        !newSkillExperienceLevel
                      }
                    >
                      {isAddingSkillLoading ? (
                        <>
                          <HugeiconsIcon
                            icon={Loading03Icon}
                            strokeWidth={2}
                            className="mr-2 h-4 w-4 animate-spin"
                          />
                          Adding...
                        </>
                      ) : (
                        "Add Skill"
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}

              {/* Existing Skills */}
              {profile?.technicalSkills &&
                profile.technicalSkills.length > 0 && (
                  <CardContent className="space-y-4 p-0">
                    {profile.technicalSkills.map(
                      (category: any, categoryIdx: number) => (
                        <div
                          key={`category-${categoryIdx}`}
                          className="space-y-3"
                        >
                          <Label className="text-sm font-medium">
                            {!category.categoryName.includes("empty") &&
                              category.categoryName}
                          </Label>
                          {category.subCategories.map(
                            (sub: any, subIdx: number) => (
                              <div
                                key={`sub-${categoryIdx}-${subIdx}`}
                                className="ml-4 space-y-2"
                              >
                                <p className="text-sm text-muted-foreground">
                                  {!sub.subCategoryName.includes("empty") &&
                                    sub.subCategoryName}
                                </p>
                                <div className="space-y-2">
                                  {sub.skills.map(
                                    (skill: any, skillIdx: number) => {
                                      const years = skill.yearsOfExperience
                                      const experience = skill.experienceLevel
                                      const progress =
                                        getExperienceProgress(years)
                                      // Create a unique key for each skill
                                      const skillKey = `${categoryIdx}-${subIdx}-${skillIdx}`
                                      const skillId =
                                        skill.id || skill.skillId || skillKey

                                      // Check if this specific skill is being edited
                                      const isEditing =
                                        editingSkillId === skillKey

                                      return (
                                        <div
                                          key={skillKey}
                                          className="rounded-lg border bg-muted/5 p-3"
                                        >
                                          {!isEditing ? (
                                            // View mode
                                            <div>
                                              <div className="mb-1 flex items-center justify-between">
                                                <div>
                                                  <span className="font-medium">
                                                    {skill.skillName}
                                                  </span>
                                                  <p className="text-sm text-muted-foreground">
                                                    {experience ||
                                                      "Not specified"}
                                                  </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <div className="text-sm font-semibold text-muted-foreground">
                                                    {years?.toFixed(1) || "0"}{" "}
                                                    years
                                                  </div>
                                                  <div className="flex gap-1">
                                                    <Button
                                                      size="icon"
                                                      variant="ghost"
                                                      className="h-8 w-8"
                                                      onClick={() => {
                                                        setEditingSkillId(
                                                          skillKey
                                                        )
                                                        setEditYears(
                                                          years?.toString() ||
                                                            ""
                                                        )
                                                        setEditExperienceLevel(
                                                          experience || ""
                                                        )
                                                      }}
                                                      disabled={
                                                        isUpdating || isSaving
                                                      }
                                                    >
                                                      <HugeiconsIcon
                                                        icon={Edit01Icon}
                                                        strokeWidth={2}
                                                        className="h-4 w-4"
                                                      />
                                                    </Button>
                                                    {/* <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                                  onClick={() => handleSkillDelete(skillId)}
                                                  disabled={isUpdating || isSaving}
                                                >
                                                  <HugeiconsIcon
                                                    icon={Trash}
                                                    strokeWidth={2}
                                                    className="h-4 w-4"
                                                  />
                                                </Button> */}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            // Edit mode - only shown for the specific skill being edited
                                            <div className="space-y-3">
                                              <div className="flex items-center justify-between">
                                                <span className="font-medium">
                                                  {skill.skillName}
                                                </span>
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                      setEditingSkillId(null)
                                                      setEditYears("")
                                                      setEditExperienceLevel("")
                                                    }}
                                                    disabled={isSkillUpdating}
                                                  >
                                                    Cancel
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    onClick={() => {
                                                      handleSkillUpdate(
                                                        skillId,
                                                        skill.skillName,
                                                        category.categoryName,
                                                        sub.subCategoryName
                                                      )
                                                    }}
                                                    disabled={
                                                      isSkillUpdating ||
                                                      !editYears ||
                                                      !editExperienceLevel
                                                    }
                                                  >
                                                    {isSkillUpdating
                                                      ? "Saving..."
                                                      : "Save"}
                                                  </Button>
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                  <Label className="text-xs text-muted-foreground">
                                                    Years of Experience
                                                  </Label>
                                                  <Input
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    value={editYears}
                                                    onChange={(e) => {
                                                      const value =
                                                        e.target.value
                                                      setEditYears(value)
                                                    }}
                                                    placeholder="e.g., 3.5"
                                                    className="h-9"
                                                    disabled={isSkillUpdating}
                                                  />
                                                </div>
                                                <div className="space-y-1">
                                                  <Label className="text-xs text-muted-foreground">
                                                    Experience Level
                                                  </Label>
                                                  <Input
                                                    type="text"
                                                    value={editExperienceLevel}
                                                    onChange={(e) => {
                                                      const value =
                                                        e.target.value
                                                      setEditExperienceLevel(
                                                        value
                                                      )
                                                    }}
                                                    placeholder="e.g., Intermediate"
                                                    className="h-9"
                                                    disabled={isSkillUpdating}
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          )}
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
                      )
                    )}
                  </CardContent>
                )}
            </div>
          </>

          {/* Development Skills */}
          <>
            <Separator className="my-4" />
            <div className="py-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <HugeiconsIcon
                    icon={UserIcon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                  Development Skills
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingDevSkill(!isAddingDevSkill)}
                  disabled={isUpdating || isSaving}
                >
                  <HugeiconsIcon
                    icon={Add01Icon}
                    strokeWidth={2}
                    className="mr-1 h-4 w-4"
                  />
                  Add Development Skill
                </Button>
              </div>

              {/* Add Development Skill Form */}
              {isAddingDevSkill && (
                <CardContent className="mb-4 space-y-3 rounded-lg border p-4">
                  <div className="grid grid-cols-3 gap-3">
                    {/* Development Type Dropdown */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Development Type *
                      </Label>
                      <Select
                        value={newDevTypeName}
                        onValueChange={(value) => {
                          setNewDevTypeName(value)
                        }}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {devCap_headers.map((type: any) => (
                            <SelectItem
                              key={type.id}
                              value={type.developmentTypeName}
                            >
                              {type.developmentTypeName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Process Name */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Process Name *
                      </Label>
                      <Input
                        type="text"
                        value={newDevProcessName}
                        onChange={(e) => {
                          setNewDevProcessName(e.target.value)
                        }}
                        placeholder="e.g., Agile, Waterfall"
                        className="h-9 w-full"
                        disabled={isAddingDevLoading}
                      />
                    </div>

                    {/* Years of Experience */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Years *
                      </Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={newDevYears}
                        onChange={(e) => {
                          setNewDevYears(e.target.value)
                        }}
                        placeholder="0.0"
                        className="h-9 w-full"
                        disabled={isAddingDevLoading}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingDevSkill(false)
                        setNewDevTypeName("")
                        setNewDevProcessName("")
                        setNewDevYears("")
                      }}
                      disabled={isAddingDevLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddDevSkill}
                      disabled={
                        isAddingDevLoading ||
                        !newDevTypeName ||
                        !newDevProcessName ||
                        !newDevYears
                      }
                    >
                      {isAddingDevLoading ? (
                        <>
                          <HugeiconsIcon
                            icon={Loading03Icon}
                            strokeWidth={2}
                            className="mr-2 h-4 w-4 animate-spin"
                          />
                          Adding...
                        </>
                      ) : (
                        "Add Skill"
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}

              {/* Existing Development Skills */}
              {profile?.developmentSkills &&
                profile.developmentSkills.length > 0 && (
                  <CardContent className="space-y-3 p-0">
                    {profile.developmentSkills.map(
                      (skill: any, idx: number) => {
                        const years = skill.yearsOfExperience
                        const progress = getExperienceProgress(years)
                        const isEditing = editingDevSkillId === skill.id

                        return (
                          <div
                            key={idx}
                            className="rounded-lg border bg-muted/5 p-3"
                          >
                            {!isEditing ? (
                              // View mode
                              <div>
                                <div className="mb-1 flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {skill.developmentTypeName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {skill.processName}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-semibold text-muted-foreground">
                                      {years.toFixed(1)} years
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() =>
                                          handleDevSkillEdit(skill)
                                        }
                                        disabled={isUpdating || isSaving}
                                      >
                                        <HugeiconsIcon
                                          icon={Edit01Icon}
                                          strokeWidth={2}
                                          className="h-4 w-4"
                                        />
                                      </Button>
                                    </div>
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
                            ) : (
                              // Edit mode
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {skill.developmentTypeName}
                                  </span>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelDevSkillEdit}
                                      disabled={isDevUpdating}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleDevSkillUpdate(
                                          skill.id,
                                          skill.developmentTypeName
                                        )
                                      }
                                      disabled={
                                        isDevUpdating ||
                                        !editDevYears ||
                                        !editDevProcessName
                                      }
                                    >
                                      {isDevUpdating ? "Saving..." : "Save"}
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                      Process Name
                                    </Label>
                                    <Input
                                      type="text"
                                      value={editDevProcessName}
                                      onChange={(e) => {
                                        setEditDevProcessName(e.target.value)
                                      }}
                                      placeholder="Process name"
                                      className="h-9"
                                      disabled={isDevUpdating}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                      Years of Experience
                                    </Label>
                                    <Input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      value={editDevYears}
                                      onChange={(e) => {
                                        setEditDevYears(e.target.value)
                                      }}
                                      placeholder="0.0"
                                      className="h-9"
                                      disabled={isDevUpdating}
                                    />
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center gap-3">
                                  <ProgressBar
                                    value={getExperienceProgress(
                                      parseFloat(editDevYears) || 0
                                    )}
                                    className="flex-1"
                                  />
                                  <span className="min-w-[40px] text-xs text-muted-foreground">
                                    {Math.round(
                                      getExperienceProgress(
                                        parseFloat(editDevYears) || 0
                                      )
                                    )}
                                    %
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      }
                    )}
                  </CardContent>
                )}
            </div>
          </>

          {/* Language Skills */}
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
              <CardContent className="space-y-4 p-0">
                <div className="grid grid-cols-2 gap-4">
                  {/* JLPT Level - Editable */}
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      JLPT Level
                    </Label>
                    <Select
                      value={jlptLevel}
                      onValueChange={(value) => {
                        setJlptLevel(value)
                      }}
                      disabled={isLanguageUpdating || isUpdating || isSaving}
                    >
                      <SelectTrigger className="h-9 w-40">
                        <SelectValue placeholder="Select JLPT level..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not specified</SelectItem>
                        <SelectItem value="N1">N1</SelectItem>
                        <SelectItem value="N2">N2</SelectItem>
                        <SelectItem value="N3">N3</SelectItem>
                        <SelectItem value="N4">N4</SelectItem>
                        <SelectItem value="N5">N5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Language Level - Editable */}
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Language Level *
                    </Label>
                    <div className="flex items-center gap-3">
                      <Select
                        value={String(languageLevel)}
                        onValueChange={(value) => {
                          setLanguageLevel(parseInt(value))
                        }}
                        disabled={isLanguageUpdating || isUpdating || isSaving}
                      >
                        <SelectTrigger className="h-9 w-32">
                          <SelectValue placeholder="Select level..." />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <SelectItem key={level} value={String(level)}>
                              Level {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={handleLanguageUpdate}
                        disabled={isLanguageUpdating || isUpdating || isSaving}
                      >
                        {isLanguageUpdating ? (
                          <>
                            <HugeiconsIcon
                              icon={Loading03Icon}
                              strokeWidth={2}
                              className="mr-2 h-4 w-4 animate-spin"
                            />
                            Saving...
                          </>
                        ) : profile?.languageSkill?.id ? (
                          "Update"
                        ) : (
                          "Add"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </>

          {/* Management Skills */}
          <>
            <Separator className="my-4" />
            <div className="py-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <HugeiconsIcon
                    icon={AwardIcon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                  Management Skills
                </h3>
                {!profile?.managementSkill && !isManagementEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsManagementEditing(true)}
                    disabled={isManagementUpdating || isUpdating || isSaving}
                  >
                    <HugeiconsIcon
                      icon={Add01Icon}
                      strokeWidth={2}
                      className="mr-1 h-4 w-4"
                    />
                    Add Management Skills
                  </Button>
                )}
                {profile?.managementSkill && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (isManagementEditing) {
                        // If canceling edit, reset values to current profile values
                        if (profile?.managementSkill) {
                          setManagementEducation(
                            profile.managementSkill.educationScore || 1
                          )
                          setManagementExperience(
                            profile.managementSkill.managementExperienceLevel ||
                              1
                          )
                          setManagementQcd(
                            profile.managementSkill.qcdScore || 1
                          )
                          setManagementReportConsult(
                            profile.managementSkill.reportConsultScore || 1
                          )
                        }
                      }
                      setIsManagementEditing(!isManagementEditing)
                    }}
                    disabled={isManagementUpdating || isUpdating || isSaving}
                  >
                    <HugeiconsIcon
                      icon={isManagementEditing ? Trash : Edit01Icon}
                      strokeWidth={2}
                      className="mr-1 h-4 w-4"
                    />
                    {isManagementEditing ? "Cancel" : "Edit"}
                  </Button>
                )}
              </div>

              <CardContent className="space-y-3 p-0">
                {profile?.managementSkill || isManagementEditing ? (
                  <>
                    <div className="grid grid-cols-4 gap-3">
                      {/* Education Score */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Education
                        </Label>
                        {isManagementEditing ? (
                          <Select
                            value={String(managementEducation)}
                            onValueChange={(value) => {
                              setManagementEducation(parseInt(value))
                            }}
                            disabled={
                              isManagementUpdating || isUpdating || isSaving
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4].map((level) => (
                                <SelectItem key={level} value={String(level)}>
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-base font-medium">
                            {profile?.managementSkill?.educationScore || 0}/5
                          </p>
                        )}
                      </div>

                      {/* Management Experience Level */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Management Exp.
                        </Label>
                        {isManagementEditing ? (
                          <Select
                            value={String(managementExperience)}
                            onValueChange={(value) => {
                              setManagementExperience(parseInt(value))
                            }}
                            disabled={
                              isManagementUpdating || isUpdating || isSaving
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((level) => (
                                <SelectItem key={level} value={String(level)}>
                                  Level {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-base font-medium">
                            Level{" "}
                            {profile?.managementSkill
                              ?.managementExperienceLevel || 0}
                          </p>
                        )}
                      </div>

                      {/* QCD Score */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          QCD
                        </Label>
                        {isManagementEditing ? (
                          <Select
                            value={String(managementQcd)}
                            onValueChange={(value) => {
                              setManagementQcd(parseInt(value))
                            }}
                            disabled={
                              isManagementUpdating || isUpdating || isSaving
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4].map((level) => (
                                <SelectItem key={level} value={String(level)}>
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-base font-medium">
                            {profile?.managementSkill?.qcdScore || 0}/5
                          </p>
                        )}
                      </div>

                      {/* Report/Consult Score */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Report/Consult
                        </Label>
                        {isManagementEditing ? (
                          <Select
                            value={String(managementReportConsult)}
                            onValueChange={(value) => {
                              setManagementReportConsult(parseInt(value))
                            }}
                            disabled={
                              isManagementUpdating || isUpdating || isSaving
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4].map((level) => (
                                <SelectItem key={level} value={String(level)}>
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-base font-medium">
                            {profile?.managementSkill?.reportConsultScore || 0}
                            /5
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Total Level - Inline with action buttons */}
                    <div className="flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">
                          Total Level
                        </Label>
                        <Badge className="px-3 py-1 text-base font-semibold">
                          Level {profile?.managementSkill?.totalLevel || 0}
                        </Badge>
                      </div>
                      {isManagementEditing && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={handleManagementUpdate}
                          disabled={
                            isManagementUpdating || isUpdating || isSaving
                          }
                        >
                          {isManagementUpdating ? (
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
                      )}
                    </div>
                  </>
                ) : (
                  <p className="py-2 text-sm text-muted-foreground">
                    No management skills added yet. Click "Add Management
                    Skills" to get started.
                  </p>
                )}
              </CardContent>
            </div>
          </>
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
