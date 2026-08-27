"use client"

import { useState, useEffect, useRef } from "react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserIcon } from "@hugeicons/core-free-icons"
import { mainStore } from "@/store/mainStore"
import {
  SkillsetForm,
  DevelopmentData,
  LanguageSkillData,
  ManagementSkillData,
  TechnicalSkillData,
} from "./skillsetForm"
import { toast } from "sonner"

interface SkillsetDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: {
    id: string
    name: string
  } | null
  onSuccess?: () => void
}

export function SkillsetDrawer({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: SkillsetDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)
  const [developmentData, setDevelopmentData] = useState<DevelopmentData[]>([])
  const [originalDevelopmentData, setOriginalDevelopmentData] = useState<
    DevelopmentData[]
  >([])
  const [languageSkillData, setLanguageSkillData] = useState<LanguageSkillData>(
    {
      languageSkillLevel: null,
    }
  )
  const [originalLanguageSkillData, setOriginalLanguageSkillData] =
    useState<LanguageSkillData>({
      languageSkillLevel: null,
    })
  const [managementSkillData, setManagementSkillData] =
    useState<ManagementSkillData>({
      managementExperienceLevel: null,
      qcdScore: null,
      reportConsultScore: null,
      educationScore: null,
    })
  const [originalManagementSkillData, setOriginalManagementSkillData] =
    useState<ManagementSkillData>({
      managementExperienceLevel: null,
      qcdScore: null,
      reportConsultScore: null,
      educationScore: null,
    })
  const [technicalSkillData, setTechnicalSkillData] = useState<
    TechnicalSkillData[]
  >([])
  const [originalTechnicalSkillData, setOriginalTechnicalSkillData] = useState<
    TechnicalSkillData[]
  >([])

  const {
    devCap_headers,
    devCap_data,
    languageSkill_data,
    managementScores_Data,
    add_devCapData,
    update_devCapData,
    skill_headers,
    fetch_devCapData,
    add_japaneseLevel,
    update_japaneseLevel,
    fetch_languageSkillData,
    add_managementScoreData,
    update_managementScoreData,
    fetch_managementScoreData,
    skillData,
    add_SkillData,
    update_SkillData,
    fetch_SkillData,
  } = mainStore()

  // Initialize form data when drawer opens
  useEffect(() => {
    if (open && employee) {
      // Get all development types from headers
      const types = devCap_headers || []

      // Get employee's existing development data
      const employeeDevCaps =
        devCap_data?.filter(
          (item: any) =>
            item.employeeId === employee.id || item.employee_id === employee.id
        ) || []

      // Build development data array with all types
      const initialData: DevelopmentData[] = types.map((type: any) => {
        const existing = employeeDevCaps.find(
          (item: any) => item.developmentTypeName === type.developmentTypeName
        )

        return {
          id: existing?.id || null,
          developmentTypeName: type.developmentTypeName,
          processName: existing?.processName || existing?.process_name || "",
          yearsOfExperience:
            existing?.yearsOfExperience || existing?.years_of_experience || 0,
          existingId: existing?.id || null,
        }
      })

      setDevelopmentData(initialData)
      setOriginalDevelopmentData(JSON.parse(JSON.stringify(initialData)))

      // Get employee's existing language skill data
      const existingLanguageSkill = languageSkill_data?.find(
        (item: any) =>
          item.employee_id === employee.id || item.employeeId === employee.id
      )

      const langData: LanguageSkillData = {
        languageSkillLevel:
          existingLanguageSkill?.language_skill_level ||
          existingLanguageSkill?.languageSkillLevel ||
          null,
      }

      setLanguageSkillData(langData)
      setOriginalLanguageSkillData(JSON.parse(JSON.stringify(langData)))

      // Get employee's existing management skill data
      const existingManagementSkill = managementScores_Data?.find(
        (item: any) =>
          item.employee_id === employee.id || item.employeeId === employee.id
      )

      const mgmtData: ManagementSkillData = {
        managementExperienceLevel:
          existingManagementSkill?.management_experience_level ||
          existingManagementSkill?.managementExperienceLevel ||
          null,
        qcdScore:
          existingManagementSkill?.qcd_score ||
          existingManagementSkill?.qcdScore ||
          null,
        reportConsultScore:
          existingManagementSkill?.report_consult_score ||
          existingManagementSkill?.reportConsultScore ||
          null,
        educationScore:
          existingManagementSkill?.education_score ||
          existingManagementSkill?.educationScore ||
          null,
      }

      setManagementSkillData(mgmtData)
      setOriginalManagementSkillData(JSON.parse(JSON.stringify(mgmtData)))

      // Get employee's existing technical skill data
      const employeeTechnicalSkills =
        skillData?.filter(
          (item: any) =>
            item.employee_id === employee.id || item.employeeId === employee.id
        ) || []

      const techData: TechnicalSkillData[] = employeeTechnicalSkills.map(
        (skill: any) => ({
          employeeId: employee.id,
          skillId: skill.skill_id || skill.skillId,
          skillName: skill.skill_name || skill.skillName || "",
          categoryName: skill.category_name || skill.categoryName || "",
          subCategoryName:
            skill.sub_category_name || skill.subCategoryName || "",
          yearsOfExperience:
            skill.years_of_experience || skill.yearsOfExperience || null,
          experienceLevel:
            skill.experience_level || skill.experienceLevel || null,
        })
      )

      setTechnicalSkillData(techData)
      setOriginalTechnicalSkillData(JSON.parse(JSON.stringify(techData)))
    }
  }, [
    open,
    employee,
    devCap_headers,
    devCap_data,
    languageSkill_data,
    managementScores_Data,
    skillData,
  ])

  // Check if any data has changed
  const hasChanges = () => {
    const devChanged =
      JSON.stringify(developmentData) !==
      JSON.stringify(originalDevelopmentData)
    const langChanged =
      JSON.stringify(languageSkillData) !==
      JSON.stringify(originalLanguageSkillData)
    const mgmtChanged =
      JSON.stringify(managementSkillData) !==
      JSON.stringify(originalManagementSkillData)
    const techChanged =
      JSON.stringify(technicalSkillData) !==
      JSON.stringify(originalTechnicalSkillData)
    return devChanged || langChanged || mgmtChanged || techChanged
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

  // Handle pointer down outside - only prevent if clicking on dropdown
  const handlePointerDownOutside = (e: Event) => {
    const target = e.target as HTMLElement
    // Allow closing when clicking on the overlay or outside
    // But prevent if clicking on dropdown items or the select trigger
    if (
      target.closest('[role="listbox"]') ||
      target.closest('[role="option"]') ||
      target.closest("[data-dropdown-trigger]")
    ) {
      e.preventDefault()
    }
  }

  const handleSubmit = async () => {
    if (!employee) {
      toast.info("No employee selected")
      return
    }

    if (!hasChanges()) {
      return
    }

    setIsSubmitting(true)

    try {
      const results = []

      // Process each development type
      for (const dev of developmentData) {
        // Skip if no changes or empty process name
        if (!dev.processName.trim()) continue

        const devData = {
          employeeId: employee.id,
          developmentTypeName: dev.developmentTypeName,
          processName: dev.processName.trim(),
          yearsOfExperience: dev.yearsOfExperience || 0,
        }

        // Check if this development type already exists for the employee
        const existingDev = devCap_data?.find(
          (item: any) =>
            (item.employeeId === employee.id ||
              item.employee_id === employee.id) &&
            item.developmentTypeName === dev.developmentTypeName
        )

        let result
        if (existingDev) {
          // Update existing
          result = await update_devCapData(existingDev.id, devData)
        } else {
          // Create new
          result = await add_devCapData(devData)
        }
        results.push(result)
      }

      // Process language skills (Japanese Level)
      const existingLangSkill = languageSkill_data?.find(
        (item: any) =>
          item.employee_id === employee.id || item.employeeId === employee.id
      )

      if (languageSkillData.languageSkillLevel) {
        const langData = {
          employeeId: employee.id,
          languageSkillLevel: languageSkillData.languageSkillLevel,
        }

        if (existingLangSkill) {
          // Update existing language skill
          await update_japaneseLevel(existingLangSkill.id, langData)
        } else {
          // Create new language skill
          await add_japaneseLevel(langData)
        }
      }

      // Process management skills
      const existingManagementSkill = managementScores_Data?.find(
        (item: any) =>
          item.employee_id === employee.id || item.employeeId === employee.id
      )

      // Check if any management field has a value
      const hasManagementData =
        managementSkillData.managementExperienceLevel !== null ||
        managementSkillData.qcdScore !== null ||
        managementSkillData.reportConsultScore !== null ||
        managementSkillData.educationScore !== null

      if (hasManagementData) {
        const mgmtData = {
          employeeId: employee.id,
          managementExperienceLevel:
            managementSkillData.managementExperienceLevel || 0,
          qcdScore: managementSkillData.qcdScore || 0,
          reportConsultScore: managementSkillData.reportConsultScore || 0,
          educationScore: managementSkillData.educationScore || 0,
        }

        if (existingManagementSkill) {
          // Update existing management skill
          await update_managementScoreData(existingManagementSkill.id, mgmtData)
        } else {
          // Create new management skill
          await add_managementScoreData(mgmtData)
        }
      }

      // Process technical skills
      // Get existing technical skills for this employee
      const existingTechnicalSkills =
        skillData?.filter(
          (item: any) =>
            item.employee_id === employee.id || item.employeeId === employee.id
        ) || []

      // For each technical skill in the form
      for (const techSkill of technicalSkillData) {
        // Skip if no data entered
        if (!techSkill.yearsOfExperience && !techSkill.experienceLevel) continue

        // Find the skill in skill_headers to get proper category and subcategory
        let categoryName = ""
        let subCategoryName = ""

        // Search through skill_headers to find the skill
        for (const category of skill_headers || []) {
          for (const subCategory of category.skillSubCategories || []) {
            const foundSkill = subCategory.skills?.find(
              (s: any) => s.skillName === techSkill.skillName
            )
            if (foundSkill) {
              categoryName = category.categoryName || ""
              subCategoryName = subCategory.subCategoryName || ""
              break
            }
          }
          if (categoryName) break
        }

        // Check if this skill already exists for the employee
        const existingTechSkill = existingTechnicalSkills.find(
          (item: any) =>
            (item.skillName || item.skill_name) === techSkill.skillName
        )

        const techData = {
          employeeId: employee.id,
          skillName: techSkill.skillName,
          categoryName: categoryName,
          subCategoryName: subCategoryName,
          yearsOfExperience: techSkill.yearsOfExperience || 0,
          experienceLevel: techSkill.experienceLevel || "",
        }

        if (existingTechSkill) {
          // Update existing technical skill
          const skillId = existingTechSkill.id || existingTechSkill.skillId
          await update_SkillData(skillId, techData)
        } else {
          // Create new technical skill
          await add_SkillData(techData)
        }
      }

      // Refresh data
      await Promise.all([
        fetch_devCapData(),
        fetch_languageSkillData(),
        fetch_managementScoreData(),
        fetch_SkillData(),
      ])

      toast.success("Skillset updated successfully!")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to save skillset:", error)
      toast.error("Failed to save skillset. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!employee) return null

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      direction="right"
      onPointerDownOutside={handlePointerDownOutside}
      onEscapeKeyDown={(e) => {
        // Prevent escape key from closing when dropdown is open
        if (isInteractingWithDropdown) {
          e.preventDefault()
        }
      }}
    >
      <DrawerContent className="right-0 left-auto h-full w-full max-w-2xl">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>Edit Skillset</DrawerTitle>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <HugeiconsIcon
              icon={UserIcon}
              strokeWidth={2}
              className="h-4 w-4"
            />
            <span>
              Employee: {employee.name} ({employee.id})
            </span>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <SkillsetForm
              developmentData={developmentData}
              languageSkillData={languageSkillData}
              managementSkillData={managementSkillData}
              technicalSkillData={technicalSkillData}
              employeeId={employee.id}
              onDataChange={setDevelopmentData}
              onLanguageSkillChange={setLanguageSkillData}
              onManagementSkillChange={setManagementSkillData}
              onTechnicalSkillChange={setTechnicalSkillData}
              onDropdownOpenChange={handleDropdownOpenChange}
            />
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t">
          <div className="flex gap-2">
            <DrawerClose asChild>
              <Button
                variant="outline"
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </DrawerClose>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || !hasChanges()}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
