"use client"

import { useState, useEffect } from "react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HugeiconsIcon } from "@hugeicons/react"
import { AddIcon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Skill {
  id?: number
  skillName: string
}

interface SubCategory {
  id?: number
  subCategoryName: string
  skills: Skill[]
}

interface Category {
  id?: number
  categoryName: string
  skillSubCategories: SubCategory[]
}

interface TechnicalAbilityHeadersDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialCategories?: Category[]
  onSaveCategory?: (data: any) => Promise<void>  // For single update (with id)
  onBulkCreate?: (data: any[]) => Promise<void>   // For bulk create (no ids)
  editingCategory?: Category | null
}

// Generate a unique ID for empty categories/subcategories
const generateUniqueEmptyId = () => {
  return `empty-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function TechnicalAbilityHeadersDrawer({
  open,
  onOpenChange,
  initialCategories = [],
  onSaveCategory,
  onBulkCreate,
  editingCategory = null,
}: TechnicalAbilityHeadersDrawerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [originalCategories, setOriginalCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emptyCounter, setEmptyCounter] = useState(0)

  // Initialize categories when drawer opens
  useEffect(() => {
    if (open) {
      if (editingCategory) {
        setCategories([{ ...editingCategory }])
        setOriginalCategories([{ ...editingCategory }])
      } else if (initialCategories.length > 0) {
        const sortedCategories = initialCategories.map(cat => ({
          ...cat,
          skillSubCategories: [...cat.skillSubCategories]
            .sort((a, b) => (a.id || 0) - (b.id || 0))
            .map(sub => ({
              ...sub,
              skills: [...sub.skills].sort((a, b) => (a.id || 0) - (b.id || 0))
            }))
        }))
        setCategories(sortedCategories)
        setOriginalCategories(JSON.parse(JSON.stringify(sortedCategories)))
      } else {
        setCategories([
          {
            categoryName: generateUniqueEmptyId(),
            skillSubCategories: [
              {
                subCategoryName: generateUniqueEmptyId(),
                skills: [{ skillName: "" }]
              }
            ]
          }
        ])
        setOriginalCategories([])
      }
      setError(null)
      setEmptyCounter(0)
    }
  }, [open, initialCategories, editingCategory])

  // Check if there are changes
  const hasChanges = () => {
    return JSON.stringify(categories) !== JSON.stringify(originalCategories)
  }

  const handleAddCategory = () => {
    const newEmptyId = generateUniqueEmptyId()
    setCategories([
      ...categories,
      {
        categoryName: newEmptyId,
        skillSubCategories: [
          {
            subCategoryName: newEmptyId,
            skills: [{ skillName: "" }]
          }
        ]
      }
    ])
    setEmptyCounter(prev => prev + 1)
  }

  const handleRemoveCategory = (index: number) => {
    if (categories.length <= 1) {
      setError("Cannot remove the last category")
      return
    }
    setCategories(categories.filter((_, i) => i !== index))
    setError(null)
  }

  const handleCategoryChange = (index: number, value: string) => {
    const updated = [...categories]
    updated[index].categoryName = value
    setCategories(updated)
  }

  const handleAddSubCategory = (categoryIndex: number) => {
    const updated = [...categories]
    const newEmptyId = generateUniqueEmptyId()
    updated[categoryIndex].skillSubCategories.push({
      subCategoryName: newEmptyId,
      skills: [{ skillName: "" }]
    })
    setCategories(updated)
    setEmptyCounter(prev => prev + 1)
  }

  const handleRemoveSubCategory = (categoryIndex: number, subIndex: number) => {
    const updated = [...categories]
    if (updated[categoryIndex].skillSubCategories.length <= 1) {
      setError("Cannot remove the last sub-category")
      return
    }
    updated[categoryIndex].skillSubCategories = updated[categoryIndex].skillSubCategories.filter(
      (_, i) => i !== subIndex
    )
    setCategories(updated)
    setError(null)
  }

  const handleSubCategoryChange = (categoryIndex: number, subIndex: number, value: string) => {
    const updated = [...categories]
    updated[categoryIndex].skillSubCategories[subIndex].subCategoryName = value
    setCategories(updated)
  }

  const handleAddSkill = (categoryIndex: number, subIndex: number) => {
    const updated = [...categories]
    updated[categoryIndex].skillSubCategories[subIndex].skills.push({ 
      skillName: "" 
    })
    setCategories(updated)
  }

  const handleRemoveSkill = (categoryIndex: number, subIndex: number, skillIndex: number) => {
    const updated = [...categories]
    if (updated[categoryIndex].skillSubCategories[subIndex].skills.length <= 1) {
      setError("Cannot remove the last skill")
      return
    }
    updated[categoryIndex].skillSubCategories[subIndex].skills = updated[categoryIndex].skillSubCategories[subIndex].skills.filter(
      (_, i) => i !== skillIndex
    )
    setCategories(updated)
    setError(null)
  }

  const handleSkillChange = (categoryIndex: number, subIndex: number, skillIndex: number, value: string) => {
    const updated = [...categories]
    updated[categoryIndex].skillSubCategories[subIndex].skills[skillIndex].skillName = value
    setCategories(updated)
  }

  // Check if a name is a generated empty ID
  const isEmptyGeneratedName = (name: string) => {
    return name && name.startsWith('empty-')
  }

  // Get display name (show "empty" placeholder for generated IDs)
  const getDisplayName = (name: string) => {
    if (isEmptyGeneratedName(name)) {
      return ""
    }
    return name
  }

 const handleSubmit = async () => {
  // Filter out completely empty categories
  const validCategories = categories
    .map(cat => ({
      ...cat,
      // If category name is empty, use the generated ID if it exists, otherwise keep empty
      categoryName: cat.categoryName.trim() || cat.categoryName || generateUniqueEmptyId(),
      skillSubCategories: cat.skillSubCategories
        .filter(sub => 
          sub.subCategoryName.trim() !== '' || 
          sub.skills.some(skill => skill.skillName.trim() !== '')
        )
        .map(sub => ({
          ...sub,
          // If subcategory name is empty, use the generated ID if it exists, otherwise keep empty
          subCategoryName: sub.subCategoryName.trim() || sub.subCategoryName || generateUniqueEmptyId(),
          skills: sub.skills.filter(skill => skill.skillName.trim() !== '')
        }))
    }))
    .filter(cat => cat.skillSubCategories.length > 0)

  if (validCategories.length === 0) {
    setError("Please add at least one category with data")
    return
  }

  // Validate each category
  for (const category of validCategories) {
    // Only validate if category name is not a generated empty ID AND is actually empty
    // Check both conditions: not starting with 'empty-' AND empty string
    if (!category.categoryName.startsWith('empty-') && !category.categoryName.trim()) {
      setError("Category name is required")
      return
    }
    for (const sub of category.skillSubCategories) {
      if (!sub.subCategoryName.startsWith('empty-') && !sub.subCategoryName.trim()) {
        setError("Sub-category name is required for all sub-categories")
        return
      }
      for (const skill of sub.skills) {
        if (!skill.skillName.trim()) {
          setError("Skill name is required for all skills")
          return
        }
      }
    }
  }

  setIsSubmitting(true)
  setError(null)

  try {
    // Separate categories with IDs (updates) from those without (creates)
    const categoriesWithIds = validCategories.filter(cat => cat.id)
    const categoriesWithoutIds = validCategories.filter(cat => !cat.id)

    // 1. Handle updates (categories with IDs) - use onSaveCategory
    for (const category of categoriesWithIds) {
      const updateData = {
        id: category.id,
        categoryName: category.categoryName,
        skillSubCategories: category.skillSubCategories.map(sub => ({
          ...(sub.id ? { id: sub.id } : {}),
          subCategoryName: sub.subCategoryName,
          skills: sub.skills.map(skill => ({
            ...(skill.id ? { id: skill.id } : {}),
            skillName: skill.skillName
          }))
        }))
      }
      console.log('Updating category:', JSON.stringify(updateData, null, 2))
      if (onSaveCategory) {
        await onSaveCategory(updateData)
      }
    }

    // 2. Handle creates (categories without IDs) - use onBulkCreate
    if (categoriesWithoutIds.length > 0 && onBulkCreate) {
      const createData = categoriesWithoutIds.map(cat => ({
        categoryName: cat.categoryName,
        skillSubCategories: cat.skillSubCategories.map(sub => ({
          subCategoryName: sub.subCategoryName,
          skills: sub.skills.map(skill => ({
            skillName: skill.skillName
          }))
        }))
      }))
      console.log('Creating new categories:', JSON.stringify(createData, null, 2))
      await onBulkCreate(createData)
    }

    onOpenChange(false)
  } catch (err) {
    console.error('Save error:', err)
    setError(err instanceof Error ? err.message : "Failed to save categories")
  } finally {
    setIsSubmitting(false)
  }
}

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="right-0 left-auto h-full w-full max-w-2xl">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>
            {editingCategory ? "Edit Technical Category" : "Manage Technical Ability"}
          </DrawerTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {editingCategory
              ? "Update the selected category structure"
              : "Add or manage technical skill categories and sub-categories"
            }
          </p>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {categories.map((category, catIndex) => (
                <div key={catIndex} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      Category {catIndex + 1}
                      {category.id && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          ID: {category.id}
                        </Badge>
                      )}
                      {isEmptyGeneratedName(category.categoryName) && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Empty
                        </Badge>
                      )}
                    </Label>
                    {!editingCategory && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCategory(catIndex)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={categories.length <= 1}
                      >
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Category Name</Label>
                    <Input
                      value={getDisplayName(category.categoryName)}
                      onChange={(e) => handleCategoryChange(catIndex, e.target.value)}
                      placeholder="empty"
                      className="w-full"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Sub-Categories</Label>
                    {category.skillSubCategories.map((sub, subIndex) => (
                      <div key={subIndex} className="border-l-2 border-blue-200 pl-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Sub-Category {subIndex + 1}
                            {sub.id && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                ID: {sub.id}
                              </Badge>
                            )}
                            {isEmptyGeneratedName(sub.subCategoryName) && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Empty
                              </Badge>
                            )}
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSubCategory(catIndex, subIndex)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={category.skillSubCategories.length <= 1}
                          >
                            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Sub-Category Name</Label>
                          <Input
                            value={getDisplayName(sub.subCategoryName)}
                            onChange={(e) => handleSubCategoryChange(catIndex, subIndex, e.target.value)}
                            placeholder="empty"
                            className="text-sm w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Skills</Label>
                          {sub.skills.map((skill, skillIndex) => (
                            <div key={skillIndex} className="flex items-center gap-2">
                              <div className="flex-1">
                                <Input
                                  value={skill.skillName}
                                  onChange={(e) => handleSkillChange(catIndex, subIndex, skillIndex, e.target.value)}
                                  placeholder="Enter skill name"
                                  className="text-sm"
                                />
                              </div>
                              {skill.id && (
                                <Badge variant="outline" className="text-xs">
                                  ID: {skill.id}
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSkill(catIndex, subIndex, skillIndex)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={sub.skills.length <= 1}
                              >
                                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddSkill(catIndex, subIndex)}
                            className="text-xs"
                          >
                            <HugeiconsIcon icon={AddIcon} strokeWidth={2} className="h-3 w-3 mr-1" />
                            Add Skill
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSubCategory(catIndex)}
                    >
                      <HugeiconsIcon icon={AddIcon} strokeWidth={2} className="h-3 w-3 mr-1" />
                      Add Sub-Category
                    </Button>
                  </div>
                </div>
              ))}

              {!editingCategory && (
                <Button
                  variant="outline"
                  onClick={handleAddCategory}
                  className="w-full"
                >
                  <HugeiconsIcon icon={AddIcon} strokeWidth={2} className="h-4 w-4 mr-1" />
                  Add Category
                </Button>
              )}

              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">{categories.length}</span> categor{categories.length !== 1 ? 'ies' : 'y'} configured
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Total sub-categories: {categories.reduce((acc, cat) => acc + cat.skillSubCategories.length, 0)}
                </p>
                {hasChanges() && (
                  <p className="text-xs text-orange-600 mt-1">
                    You have unsaved changes
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t">
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || !hasChanges()}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
            <DrawerClose asChild>
              <Button
                variant="outline"
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}