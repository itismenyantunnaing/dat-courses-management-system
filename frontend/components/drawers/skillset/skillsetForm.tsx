"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { mainStore } from "@/store/mainStore"

export interface DevelopmentData {
  id: number | null
  developmentTypeName: string
  processName: string
  yearsOfExperience: number
  existingId?: number | null
}

export interface LanguageSkillData {
  languageSkillLevel: number | null
}

export interface ManagementSkillData {
  managementExperienceLevel: number | null
  qcdScore: number | null
  reportConsultScore: number | null
  educationScore: number | null
}

export interface TechnicalSkillData {
  employeeId: string
  skillId: number
  skillName: string
  categoryName: string
  subCategoryName: string
  yearsOfExperience: number | null
  experienceLevel: string | null
}

interface SkillsetFormProps {
  developmentData: DevelopmentData[]
  languageSkillData: LanguageSkillData
  managementSkillData: ManagementSkillData
  technicalSkillData: TechnicalSkillData[]
  employeeId: string
  onDataChange: (data: DevelopmentData[]) => void
  onLanguageSkillChange: (data: LanguageSkillData) => void
  onManagementSkillChange: (data: ManagementSkillData) => void
  onTechnicalSkillChange: (data: TechnicalSkillData[]) => void
  onDropdownOpenChange?: (isOpen: boolean) => void
}

const LEVEL_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
]

const SCORE_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
]

export function SkillsetForm({
  developmentData,
  languageSkillData,
  managementSkillData,
  technicalSkillData = [],
  employeeId,
  onDataChange,
  onLanguageSkillChange,
  onManagementSkillChange,
  onTechnicalSkillChange,
  onDropdownOpenChange,
}: SkillsetFormProps) {
  const { skill_headers } = mainStore()

  const handleInputChange = (
    index: number,
    field: keyof DevelopmentData,
    value: string | number
  ) => {
    const updated = [...developmentData]
    if (field === "yearsOfExperience") {
      updated[index][field] =
        typeof value === "string" ? parseFloat(value) || 0 : value
    } else if (field === "processName") {
      updated[index][field] = value as string
    }
    onDataChange(updated)
  }

  const handleLanguageLevelChange = (value: string) => {
    onLanguageSkillChange({
      languageSkillLevel: parseInt(value),
    })
  }

  const handleManagementChange = (
    field: keyof ManagementSkillData,
    value: string
  ) => {
    onManagementSkillChange({
      ...managementSkillData,
      [field]: parseInt(value),
    })
  }

  const handleTechnicalSkillChange = (
    skillId: number,
    skillName: string,
    field: keyof TechnicalSkillData,
    value: string | number
  ) => {
    const updated = [...technicalSkillData]
    // Try to find by skillId first, then by skillName
    let existingIndex = updated.findIndex((s) => s.skillId === skillId)
    if (existingIndex === -1) {
      existingIndex = updated.findIndex((s) => s.skillName === skillName)
    }

    if (existingIndex !== -1) {
      // Update existing skill
      if (field === "yearsOfExperience") {
        updated[existingIndex][field] =
          typeof value === "string" ? parseFloat(value) || 0 : value
      } else if (field === "experienceLevel") {
        updated[existingIndex][field] = value as string
      }
    } else {
      // Add new skill - find the skill details from skill_headers
      let categoryName = ""
      let subCategoryName = ""

      // Find the skill in skill_headers to get category and subcategory names
      for (const category of skill_headers || []) {
        for (const subCategory of category.skillSubCategories || []) {
          const foundSkill = subCategory.skills?.find(
            (s: any) => s.id === skillId || s.skillName === skillName
          )
          if (foundSkill) {
            categoryName = category.categoryName || ""
            subCategoryName = subCategory.subCategoryName || ""
            break
          }
        }
        if (categoryName) break
      }

      const newSkill: TechnicalSkillData = {
        employeeId: employeeId,
        skillId: skillId,
        skillName: skillName,
        categoryName: categoryName,
        subCategoryName: subCategoryName,
        yearsOfExperience:
          field === "yearsOfExperience"
            ? typeof value === "string"
              ? parseFloat(value) || 0
              : value
            : 0,
        experienceLevel: field === "experienceLevel" ? (value as string) : null,
      }
      updated.push(newSkill)
    }

    onTechnicalSkillChange(updated)
  }

  return (
    <div className="space-y-6">
      {/* Management Ability Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Management Ability</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="managementExperienceLevel">
              Management experience
            </Label>
            <Select
              value={
                managementSkillData.managementExperienceLevel?.toString() || ""
              }
              onValueChange={(value) =>
                handleManagementChange("managementExperienceLevel", value)
              }
              onOpenChange={onDropdownOpenChange}
            >
              <SelectTrigger id="managementExperienceLevel" className="w-full">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qcdScore">QCD</Label>
            <Select
              value={managementSkillData.qcdScore?.toString() || ""}
              onValueChange={(value) =>
                handleManagementChange("qcdScore", value)
              }
              onOpenChange={onDropdownOpenChange}
            >
              <SelectTrigger id="qcdScore" className="w-full">
                <SelectValue placeholder="Select score" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SCORE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportConsultScore">
              Reporting, contacting, and consulting
            </Label>
            <Select
              value={managementSkillData.reportConsultScore?.toString() || ""}
              onValueChange={(value) =>
                handleManagementChange("reportConsultScore", value)
              }
              onOpenChange={onDropdownOpenChange}
            >
              <SelectTrigger id="reportConsultScore" className="w-full">
                <SelectValue placeholder="Select score" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SCORE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="educationScore">Education</Label>
            <Select
              value={managementSkillData.educationScore?.toString() || ""}
              onValueChange={(value) =>
                handleManagementChange("educationScore", value)
              }
              onOpenChange={onDropdownOpenChange}
            >
              <SelectTrigger id="educationScore" className="w-full">
                <SelectValue placeholder="Select score" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SCORE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Language Skills Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Language Skills</h3>
        <div className="grid gap-4 sm:grid-cols-1">
          <div className="space-y-2">
            <Label htmlFor="languageLevel">Level (Levels 1-5)</Label>
            <Select
              value={languageSkillData.languageSkillLevel?.toString() || ""}
              onValueChange={handleLanguageLevelChange}
              onOpenChange={onDropdownOpenChange}
            >
              <SelectTrigger id="languageLevel" className="w-full max-w-xs">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Development Capabilities Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Development Capabilities</h3>
        <div className="grid gap-6">
          {developmentData.map((dev, index) => (
            <div key={dev.developmentTypeName} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  {dev.developmentTypeName}
                </Label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`years-${index}`}>Years of Experience</Label>
                  <Input
                    id={`years-${index}`}
                    type="number"
                    min="0"
                    step="0.5"
                    value={dev.yearsOfExperience || ""}
                    onChange={(e) =>
                      handleInputChange(
                        index,
                        "yearsOfExperience",
                        e.target.value
                      )
                    }
                    placeholder="e.g., 3.5"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`process-${index}`}>Experience process</Label>
                  <Input
                    id={`process-${index}`}
                    value={dev.processName}
                    onChange={(e) =>
                      handleInputChange(index, "processName", e.target.value)
                    }
                    placeholder={`Enter process for ${dev.developmentTypeName}`}
                    className="w-full"
                  />
                </div>
              </div>
              {index < developmentData.length - 1 && (
                <Separator className="my-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Technical Ability Section - Sorted */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Technical Ability</h3>
        <div className="space-y-6">
          {(skill_headers || [])
            .sort((a: any, b: any) => {
              // Sort categories by ID
              return (a.id || 0) - (b.id || 0)
            })
            .map((category: any) => (
              <div key={category.id} className="space-y-4">
                <h4 className="text-md font-medium text-gray-700">
                  {category.categoryName}
                </h4>
                {(category.skillSubCategories || [])
                  .sort((a: any, b: any) => {
                    // Sort sub-categories by ID
                    return (a.id || 0) - (b.id || 0)
                  })
                  .map((subCategory: any) => (
                    <div key={subCategory.id} className="space-y-3 pl-4">
                      <Label className="text-sm font-medium text-gray-500">
                        {subCategory.subCategoryName}
                      </Label>
                      <div className="grid gap-4">
                        {(subCategory.skills || [])
                          .sort((a: any, b: any) => {
                            // Sort skills by ID
                            return (a.id || 0) - (b.id || 0)
                          })
                          .map((skill: any) => {
                            // Find existing skill data for this employee
                            const existingSkill = technicalSkillData?.find(
                              (s) => s.skillName === skill.skillName
                            )

                            return (
                              <div
                                key={skill.id}
                                className="grid gap-4 rounded-md bg-muted/30 p-4 sm:grid-cols-3"
                              >
                                <div className="flex items-center">
                                  <Label className="text-sm font-medium">
                                    {skill.skillName}
                                  </Label>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Years</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={
                                      existingSkill?.yearsOfExperience ?? ""
                                    }
                                    onChange={(e) => {
                                      handleTechnicalSkillChange(
                                        skill.id,
                                        skill.skillName,
                                        "yearsOfExperience",
                                        e.target.value
                                      )
                                    }}
                                    placeholder="e.g., 3.5"
                                    className="w-full"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Experience</Label>
                                  <Input
                                    type="text"
                                    value={existingSkill?.experienceLevel || ""}
                                    onChange={(e) => {
                                      handleTechnicalSkillChange(
                                        skill.id,
                                        skill.skillName,
                                        "experienceLevel",
                                        e.target.value
                                      )
                                    }}
                                    placeholder="e.g., Expert"
                                    className="w-full"
                                  />
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
