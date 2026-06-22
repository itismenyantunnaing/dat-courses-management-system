// components/drawers/currentTarget/createCurrentTarget-drawer.tsx

"use client"

import { useState } from "react"
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
import { mainStore } from "@/store/mainStore"

interface CreateCurrentTargetDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  employeeOptions?: { value: string; label: string }[]
}

const defaultFormData: CurrentTargetFormData = {
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
}

export function CreateCurrentTargetDrawer({
  open,
  onOpenChange,
  onSuccess,
  employeeOptions = [],
}: CreateCurrentTargetDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { add_EmployeeJapaneseLevel } = mainStore()
  
  const [formData, setFormData] = useState<CurrentTargetFormData>(defaultFormData)

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.employeeId) {
      console.error("Please select an employee")
      return
    }

    setIsSubmitting(true)

    try {
      // Map form data to the API request format
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

      // Call the store's add method
      const result = await add_EmployeeJapaneseLevel(requestData)
      alert(result)
      
      // Reset form
      setFormData(defaultFormData)

      onOpenChange(false)
      onSuccess?.()
      
    } catch (error) {
      console.error("Failed to create Japanese profile:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="right-0 left-auto h-full w-full max-w-2xl">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>Add Japanese Profile</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <CurrentTargetForm 
              data={formData} 
              onChange={setFormData} 
              showEmployeeSelect={true}
              employeeOptions={employeeOptions}
            />
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t">
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.employeeId}
            >
              {isSubmitting ? "Creating..." : "Create Profile"}
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