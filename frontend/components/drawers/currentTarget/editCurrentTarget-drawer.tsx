/* eslint-disable react-hooks/set-state-in-effect */

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
import {
  CurrentTargetForm,
  CurrentTargetFormData,
} from "@/components/drawers/currentTarget/currentTargetForm"
import type { EmployeeJapaneseLevel } from "@/types/current_target"
import { mainStore } from "@/store/mainStore"

interface EditCurrentTargetDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: EmployeeJapaneseLevel | null
  onSuccess?: () => void
}

export function EditCurrentTargetDrawer({
  open,
  onOpenChange,
  profile,
  onSuccess,
}: EditCurrentTargetDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)
  const { edit_EmployeeJapaneseLevel } = mainStore()

  const [formData, setFormData] = useState<CurrentTargetFormData>({
    employeeId: "",
    employeeName: "",
    jlptNatTest: "",
    jlptHighestLevel: "",
    otherJapaneseLevel: "",
    preferredLearningGroup: "",
    currentCommunicationLevel: "",
    target1JlptNatLevel: "",
    target1CommunicationLevel: "",
    target2JlptNatLevel: "",
    target2CommunicationLevel: "",
    currentLearningLevel: "",
    learningMethod: "",
    wantToSitExam: false,
    examTargetLevel: "",
    confidenceLevel: "",
  })

  const [originalFormData, setOriginalFormData] =
    useState<CurrentTargetFormData>({
      employeeId: "",
      employeeName: "",
      jlptNatTest: "",
      jlptHighestLevel: "",
      otherJapaneseLevel: "",
      preferredLearningGroup: "",
      currentCommunicationLevel: "",
      target1JlptNatLevel: "",
      target1CommunicationLevel: "",
      target2JlptNatLevel: "",
      target2CommunicationLevel: "",
      currentLearningLevel: "",
      learningMethod: "",
      wantToSitExam: false,
      examTargetLevel: "",
      confidenceLevel: "",
    })

  // Check if form has changes
  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData)
  }

  // Load profile data when drawer opens
  useEffect(() => {
    if (profile && open) {
      const newFormData = {
        employeeId: profile.employeeId || profile.employee_id || "",
        employeeName: "",
        jlptNatTest: profile.jlptNatTest || "",
        jlptHighestLevel: profile.jlptHighestLevel || "",
        otherJapaneseLevel: profile.otherJapaneseLevel || "",
        preferredLearningGroup: profile.preferredLearningGroup || "",
        currentCommunicationLevel: profile.currentCommunicationLevel || "",
        target1JlptNatLevel: profile.target1JlptNatLevel || "",
        target1CommunicationLevel: profile.target1CommunicationLevel || "",
        target2JlptNatLevel: profile.target2JlptNatLevel || "",
        target2CommunicationLevel: profile.target2CommunicationLevel || "",
        currentLearningLevel: profile.currentLearningLevel || "",
        learningMethod: profile.learningMethod || "",
        wantToSitExam: profile.wantToSitExam || false,
        examTargetLevel: profile.examTargetLevel || "",
        confidenceLevel: profile.confidenceLevel || "",
      }
      setFormData(newFormData)
      setOriginalFormData(newFormData)
    }
  }, [profile, open])

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
    if (!hasChanges()) {
      console.log("No changes to save")
      return
    }

    if (!profile?.id) {
      console.error("Profile ID is required for update")
      return
    }

    setIsSubmitting(true)

    try {
      const requestData = {
        employeeId: formData.employeeId,
        jlptNatTest: formData.jlptNatTest || null,
        jlptHighestLevel: formData.jlptHighestLevel || null,
        otherJapaneseLevel: formData.otherJapaneseLevel || null,
        preferredLearningGroup: formData.preferredLearningGroup || null,
        currentCommunicationLevel: formData.currentCommunicationLevel || null,
        target1JlptNatLevel: formData.target1JlptNatLevel || null,
        target1CommunicationLevel: formData.target1CommunicationLevel || null,
        target2JlptNatLevel: formData.target2JlptNatLevel || null,
        target2CommunicationLevel: formData.target2CommunicationLevel || null,
        currentLearningLevel: formData.currentLearningLevel || null,
        learningMethod: formData.learningMethod || null,
        wantToSitExam: formData.wantToSitExam,
        examTargetLevel: formData.examTargetLevel || null,
        confidenceLevel: formData.confidenceLevel || null,
      }

      const result = await edit_EmployeeJapaneseLevel(profile.id, requestData)
      alert(result)

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to update Japanese profile:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent
        className="right-0 left-auto h-full w-full max-w-2xl"
        onPointerDownOutside={handlePointerDownOutside}
        onEscapeKeyDown={(e) => {
          if (isInteractingWithDropdown) {
            e.preventDefault()
          }
        }}
      >
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>Edit Japanese Profile</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <CurrentTargetForm
              data={formData}
              onChange={setFormData}
              isEdit={true}
              showEmployeeSelect={false}
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
