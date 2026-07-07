// components/courses/category-drawer.tsx
"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PlusSignIcon,
  Delete02Icon,
  Edit03Icon,
} from "@hugeicons/core-free-icons"
import {
  CategoryItem,
  CategoryFormData,
  CategoryDrawerProps,
  COURSE_TYPE_LABELS,
  COURSE_TYPES,
} from "@/types/course"
import { cn } from "@/lib/utils"
import { mainStore } from "@/store/mainStore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function CategoryDrawer({
  open,
  onOpenChange,
  selectedCategory,
  selectedSelfStudyType,
  onSelectCategory,
}: CategoryDrawerProps) {
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [formData, setFormData] = useState<CategoryFormData & { id?: number }>({
    name: "",
    type: "trainer",
    selfStudyType: "other",
  })
  const [activeTab, setActiveTab] = useState<"all" | "trainer" | "self-study">(
    "all"
  )
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [originalFormData, setOriginalFormData] = useState<CategoryFormData & { id?: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null)
  const [duplicateError, setDuplicateError] = useState<string | null>(null)

  // Use store directly
  const {
    courseCategory_data,
    fetch_courseCategories,
    add_courseCategories,
    update_courseCategories,
    delete_courseCategories,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    getUserRole
  } = mainStore()

  // Fetch categories when drawer opens
  useEffect(() => {
    if (open) {
      const loadCategories = async () => {
        setIsLoading(true)
        try {
          await fetch_courseCategories()
        } catch (err) {
          console.error('Failed to fetch categories:', err)
        } finally {
          setIsLoading(false)
        }
      }
      loadCategories()
    }
  }, [open, fetch_courseCategories])

  // Get all categories from store directly
  const getAllCategories = (): CategoryItem[] => {
    const all: CategoryItem[] = []
    if (courseCategory_data) {
      courseCategory_data.trainer.forEach((cat: CategoryItem) => {
        all.push({ ...cat, type: "trainer" })
      })
      courseCategory_data.selfStudy.forEach((cat: CategoryItem) => {
        all.push({ ...cat, type: "self-study" })
      })
    }
    return all
  }

  // Get filtered categories based on active tab
  const getFilteredCategories = (): CategoryItem[] => {
    const all = getAllCategories()
    if (activeTab === "all") return all
    return all.filter((cat) => cat.type === activeTab)
  }

  // Check for duplicate category using store data
  const checkDuplicateCategory = (name: string, type: 'trainer' | 'self-study', excludeId?: number): boolean => {
    const allCategories = getAllCategories()

    return allCategories.some((cat) => {
      if (excludeId && cat.id === excludeId) return false
      return cat.label.toLowerCase() === name.toLowerCase() &&
        cat.type === type
    })
  }

  // Handle self-study type change with JLPT suffix
  const handleSelfStudyTypeChange = (value: "jlpt" | "other") => {
    setFormData((prev) => {
      let newName = prev.name.trim()

      if (value === "jlpt") {
        const lowerName = newName.toLowerCase()

        // Check if name already contains "jlpt" (case insensitive)
        if (!lowerName.includes('jlpt')) {
          // No JLPT found, add suffix
          newName = newName ? `JLPT-${newName}` : 'JLPT'
        }
      } else {
        // If Other is selected, remove JLPT suffix if present (case insensitive)
        const nameWithoutSuffix = newName.replace(/\s*-?\s*jlpt\s*$/i, '').trim()
        newName = nameWithoutSuffix || newName
      }

      return {
        ...prev,
        selfStudyType: value,
        name: newName,
      }
    })
    setDuplicateError(null)
  }

  const handleAddCategory = () => {
    setIsAddingCategory(true)
    setEditingCategory(null)
    setEditingCategoryId(null)
    setDuplicateError(null)
    const newFormData = { name: "", type: "trainer", selfStudyType: "other" }
    setFormData(newFormData)
    setOriginalFormData(null)
  }

  const handleEditCategory = (categoryValue: string) => {
    const allCategories = getAllCategories()
    const found = allCategories.find((c) => c.value === categoryValue)
    if (found) {
      setEditingCategory(categoryValue)
      setEditingCategoryId(found.id || null)
      setIsAddingCategory(true)
      setDuplicateError(null)
      const storedSelfStudyType = found.selfStudyType || "other"
      const newFormData = {
        id: found.id,
        name: found.label,
        type: found.type,
        selfStudyType: storedSelfStudyType,
      }
      setFormData(newFormData)
      setOriginalFormData({ ...newFormData })
    }
  }

  const handleDeleteClick = (category: CategoryItem, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const userRole = getUserRole()
    // if (userRole !== 'ADMIN' && userRole !== 'APPROVER') {
    //   alert('You do not have permission to delete categories. Only administrators and approvers can perform this action.')
    //   return
    // }

    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return

    try {
      const result = await delete_courseCategories(categoryToDelete.id!)
      if (result.success) {
        await fetch_courseCategories()
        setDeleteDialogOpen(false)
        setCategoryToDelete(null)
        if (selectedCategory === categoryToDelete.value) {
          onSelectCategory("")
        }
      } else {
        alert(result.message || 'Failed to delete category')
        setDeleteDialogOpen(false)
        setCategoryToDelete(null)
      }
    } catch (error) {
      console.error("Failed to delete category:", error)
      alert('An error occurred while deleting the category')
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setDuplicateError(null)

    let categoryName = formData.name.trim()

    if (formData.selfStudyType === "jlpt" && categoryName) {
      const lowerName = categoryName.toLowerCase()
      if (!lowerName.includes('jlpt')) {
        categoryName = `JLPT-${categoryName}`
      }
    }

    if (!categoryName) {
      setDuplicateError('Category name is required')
      return
    }

    const isDuplicate = checkDuplicateCategory(
      categoryName,
      formData.type,
      editingCategoryId || undefined
    )

    if (isDuplicate) {
      setDuplicateError(`A category with the name "${categoryName}" and type "${COURSE_TYPE_LABELS[formData.type]}" already exists. Please use a different name.`)
      return
    }

    setIsSubmitting(true)

    try {
      let result

      if (editingCategoryId) {
        result = await update_courseCategories(
          editingCategoryId,
          categoryName,
          formData.type
        )
      } else {
        result = await add_courseCategories(
          categoryName,
          formData.type
        )
      }

      if (result.success) {
        setIsAddingCategory(false)
        setEditingCategory(null)
        setEditingCategoryId(null)
        setFormData({ name: "", type: "trainer", selfStudyType: "other" })
        setOriginalFormData(null)
        setDuplicateError(null)
        await fetch_courseCategories()
      } else {
        if (result.message && (
          result.message.includes('Duplicate entry') ||
          result.message.includes('already exists') ||
          result.message.includes('unique')
        )) {
          await fetch_courseCategories()
          const stillDuplicate = checkDuplicateCategory(
            categoryName,
            formData.type,
            editingCategoryId || undefined
          )
          if (stillDuplicate) {
            setDuplicateError(`A category with the name "${categoryName}" and type "${COURSE_TYPE_LABELS[formData.type]}" already exists. Please use a different name.`)
          } else {
            alert(result.message || 'Failed to save category')
          }
        } else {
          alert(result.message || 'Failed to save category')
        }
      }
    } catch (error: any) {
      console.error("Failed to save category:", error)
      await fetch_courseCategories()
      if (error.message && (
        error.message.includes('Duplicate entry') ||
        error.message.includes('already exists') ||
        error.message.includes('unique')
      )) {
        const stillDuplicate = checkDuplicateCategory(
          categoryName,
          formData.type,
          editingCategoryId || undefined
        )
        if (stillDuplicate) {
          setDuplicateError(`A category with the name "${categoryName}" and type "${COURSE_TYPE_LABELS[formData.type]}" already exists. Please use a different name.`)
        } else {
          alert('An error occurred while saving the category')
        }
      } else {
        alert('An error occurred while saving the category')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCategorySelect = (
    value: string,
    selfStudyType?: "jlpt" | "other",
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    onSelectCategory(value, selfStudyType)
    onOpenChange(false)
  }

  const hasChanges = useMemo(() => {
    if (!originalFormData) return true
    return (
      formData.name !== originalFormData.name ||
      formData.type !== originalFormData.type ||
      formData.selfStudyType !== originalFormData.selfStudyType
    )
  }, [formData, originalFormData])

  useEffect(() => {
    if (!open) {
      setIsAddingCategory(false)
      setEditingCategory(null)
      setEditingCategoryId(null)
      setFormData({ name: "", type: "trainer", selfStudyType: "other" })
      setOriginalFormData(null)
      setActiveTab("all")
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
      setDuplicateError(null)
      setIsLoading(false)
    }
  }, [open])

  // Show loading state
  if (isLoading && getAllCategories().length === 0) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="right-0 left-auto h-full w-full max-w-2xl">
          <DrawerHeader className="shrink-0 border-b">
            <DrawerTitle>Course Categories</DrawerTitle>
          </DrawerHeader>
          <div className="flex h-40 items-center justify-center">
            <div className="text-muted-foreground">Loading categories...</div>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Show error state
  if (error && getAllCategories().length === 0) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="right-0 left-auto h-full w-full max-w-2xl">
          <DrawerHeader className="shrink-0 border-b">
            <DrawerTitle>Course Categories</DrawerTitle>
          </DrawerHeader>
          <div className="flex h-40 flex-col items-center justify-center gap-4">
            <div className="text-destructive">Failed to load categories</div>
            <Button
              variant="outline"
              onClick={async () => {
                setIsLoading(true)
                try {
                  await fetch_courseCategories()
                } finally {
                  setIsLoading(false)
                }
              }}
            >
              Retry
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="right-0 left-auto h-full w-full max-w-2xl">
          <DrawerHeader className="shrink-0 border-b">
            <DrawerTitle>Course Categories</DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-4">
              {isAddingCategory ? (
                <form
                  ref={formRef}
                  onSubmit={handleSaveCategory}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value })
                        setDuplicateError(null)
                      }}
                      placeholder="Enter category name"
                      required
                      className={duplicateError ? "border-destructive" : ""}
                    />
                    {formData.selfStudyType === "jlpt" && (
                      <p className="text-xs text-muted-foreground">
                        ℹ️ &quot;JLPT-&quot; will be automatically added if not already present in the name
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category-type">Category Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "trainer" | "self-study") => {
                        const newSelfStudyType = value === "self-study" ? "other" : undefined
                        setFormData({
                          ...formData,
                          type: value,
                          selfStudyType: newSelfStudyType,
                        })
                        setDuplicateError(null)
                      }}
                    >
                      <SelectTrigger className="w-full" id="category-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {COURSE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {COURSE_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type === "self-study" && (
                    <div className="space-y-2">
                      <Label htmlFor="self-study-type">Self-Study Type</Label>
                      <Select
                        value={formData.selfStudyType || "other"}
                        onValueChange={handleSelfStudyTypeChange}
                      >
                        <SelectTrigger className="w-full" id="self-study-type">
                          <SelectValue placeholder="Select self-study type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="jlpt">
                              JLPT Exam Preparation
                            </SelectItem>
                            <SelectItem value="other">
                              Other Self-Study
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {formData.selfStudyType === "jlpt"
                          ? "JLPT courses include Kanji, Vocabulary, Grammar, Reading, and Listening metrics"
                          : "Other self-study courses include a link field for each session"}
                      </p>
                    </div>
                  )}

                  {duplicateError && (
                    <Alert variant="destructive">
                      <AlertDescription>{duplicateError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        isCreating ||
                        isUpdating ||
                        !formData.name.trim() ||
                        (editingCategoryId ? !hasChanges : false)
                      }
                    >
                      {isSubmitting || isCreating || isUpdating
                        ? "Saving..."
                        : editingCategoryId
                          ? "Update Category"
                          : "Add Category"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingCategory(false)
                        setEditingCategory(null)
                        setEditingCategoryId(null)
                        setFormData({
                          name: "",
                          type: "trainer",
                          selfStudyType: "other",
                        })
                        setOriginalFormData(null)
                        setDuplicateError(null)
                      }}
                    >
                      Back
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <Tabs
                    value={activeTab}
                    onValueChange={(value) =>
                      setActiveTab(value as typeof activeTab)
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="trainer">Trainer</TabsTrigger>
                      <TabsTrigger value="self-study">Self Study</TabsTrigger>
                    </TabsList>
                    <TabsContent value={activeTab} className="mt-4">
                      <div className="flex flex-wrap gap-3">
                        {getFilteredCategories().map((category) => {
                          const isSelected = selectedCategory === category.value
                          const isSelfStudyCategory =
                            category.type === "self-study"

                          const storedSelfStudyType =
                            category.selfStudyType || "other"

                          let currentSelfStudyType = storedSelfStudyType
                          if (isSelected && selectedSelfStudyType) {
                            currentSelfStudyType = selectedSelfStudyType
                          }

                          return (
                            <Item
                              key={category.id || category.value}
                              variant="outline"
                              className={cn(
                                "cursor-pointer px-3 transition-colors",
                                isSelected && "border-primary/80"
                              )}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (isSelfStudyCategory) {
                                  handleCategorySelect(
                                    category.value,
                                    currentSelfStudyType,
                                    e
                                  )
                                } else {
                                  handleCategorySelect(
                                    category.value,
                                    undefined,
                                    e
                                  )
                                }
                              }}
                            >
                              <ItemContent>
                                <ItemTitle>{category.label}</ItemTitle>
                                <ItemDescription>
                                  {COURSE_TYPE_LABELS[category.type]}
                                  {isSelfStudyCategory && (
                                    <span className="ml-2 text-xs text-primary/60">
                                      •{" "}
                                      {currentSelfStudyType === "jlpt"
                                        ? "JLPT"
                                        : "Other"}
                                    </span>
                                  )}
                                </ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleEditCategory(category.value)
                                    }}
                                  >
                                    <HugeiconsIcon
                                      icon={Edit03Icon}
                                      strokeWidth={1.5}
                                      className="h-4 w-4"
                                    />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={(e) => handleDeleteClick(category, e)}
                                  >
                                    <HugeiconsIcon
                                      icon={Delete02Icon}
                                      strokeWidth={1.5}
                                      className="h-4 w-4"
                                    />
                                  </Button>
                                </div>
                              </ItemActions>
                            </Item>
                          )
                        })}
                        {getFilteredCategories().length === 0 && (
                          <div className="w-full py-8 text-center text-muted-foreground">
                            No categories found in this section.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>

          <DrawerFooter className="shrink-0 border-t">
            <div className="flex gap-2">
              {!isAddingCategory && (
                <Button
                  type="button"
                  className="flex-1 gap-2"
                  variant="default"
                  onClick={handleAddCategory}
                >
                  <HugeiconsIcon
                    icon={PlusSignIcon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                  New Category
                </Button>
              )}
              <DrawerClose asChild>
                <Button type="button" variant="outline" className="flex-1">
                  Close
                </Button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{categoryToDelete?.label}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setCategoryToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}