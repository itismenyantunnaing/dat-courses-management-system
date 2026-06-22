// components/drawers/currentTarget/editTargetDates-drawer.tsx

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
import { TargetDates } from "@/types/current_target"
import { mainStore } from "@/store/mainStore"
import { 
  TargetDatesForm, 
  TargetDatesFormData 
} from "@/components/drawers/currentTarget/targetDatesForm"

interface EditTargetDatesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetDates: TargetDates | null
  onSuccess?: () => void
  mode?: 'create' | 'edit' // Add mode prop
}

const defaultFormData: TargetDatesFormData = {
  target1Date: "",
  target2Date: "",
  examDate: "",
}

export function EditTargetDatesDrawer({
  open,
  onOpenChange,
  targetDates,
  onSuccess,
  mode = 'edit', // Default to edit mode
}: EditTargetDatesDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { update_TargetDates, add_TargetDates } = mainStore()
  
  const [formData, setFormData] = useState<TargetDatesFormData>(defaultFormData)
  const [originalFormData, setOriginalFormData] = useState<TargetDatesFormData>(defaultFormData)

  const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return ""
    const d = new Date(date)
    if (isNaN(d.getTime())) return ""
    return d.toISOString().split("T")[0]
  }

  const resetForm = () => {
    setFormData(defaultFormData)
    setOriginalFormData(defaultFormData)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  // Load target dates data when drawer opens
  useEffect(() => {
    if (open) {
      if (mode === 'create') {
        // Reset form for create mode
        resetForm()
      } else if (targetDates && mode === 'edit') {
        const newFormData = {
          target1Date: formatDateForInput(targetDates.target1Date),
          target2Date: formatDateForInput(targetDates.target2Date),
          examDate: formatDateForInput(targetDates.examDate || ""),
        }
        setFormData(newFormData)
        setOriginalFormData(newFormData)
      }
    }
  }, [targetDates, open, mode])

  // Check if form has changes
  const hasChanges = (): boolean => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData)
  }

  // Check if required fields are filled
  const isFormValid = (): boolean => {
    return formData.target1Date.trim() !== "" &&
      formData.target2Date.trim() !== ""
  }

  const handleSubmit = async () => {
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!isFormValid()) {
      setErrorMessage("Please fill in all required fields")
      return
    }

    if (mode === 'edit' && !hasChanges()) {
      setErrorMessage("No changes to save")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        target1Date: formData.target1Date,
        target2Date: formData.target2Date,
        examDate: formData.examDate || null,
      }

      let result: string | undefined

      if (mode === 'create') {
        // Create new target dates
        result = await add_TargetDates(payload)
      } else {
        // Update existing target dates
        if (!targetDates?.id) {
          setErrorMessage("Target dates not found")
          setIsSubmitting(false)
          return
        }
        result = await update_TargetDates(targetDates.id, payload)
      }

      // Check if the result contains an error message
      if (result && result.includes("Failed")) {
        setErrorMessage(result)
        setIsSubmitting(false)
        return
      }

      // Show success message
      setSuccessMessage(result || `Target dates ${mode === 'create' ? 'created' : 'updated'} successfully`)
      
      // Close after a short delay
      setTimeout(() => {
        resetForm()
        onOpenChange(false)
        onSuccess?.()
      }, 1500)
      
    } catch (error) {
      console.error(`Failed to ${mode === 'create' ? 'create' : 'update'} target dates:`, error)
      setErrorMessage("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when drawer closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="right-0 left-auto h-full w-full max-w-2xl">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>
            {mode === 'create' ? 'Add Target Dates' : 'Edit Target Dates'}
          </DrawerTitle>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'create' 
              ? 'Set the target and exam dates for all Japanese profiles.'
              : 'Update the target and exam dates for all Japanese profiles.'
            }
          </p>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <TargetDatesForm 
              data={formData} 
              onChange={setFormData} 
            />

            {/* Display error message if any */}
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {errorMessage}
              </div>
            )}

            {/* Display success message if any */}
            {successMessage && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                {successMessage}
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t">
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid() || (mode === 'edit' && !hasChanges())}
            >
              {isSubmitting 
                ? (mode === 'create' ? "Creating..." : "Saving...") 
                : (mode === 'create' ? "Create Target Dates" : "Save Changes")
              }
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