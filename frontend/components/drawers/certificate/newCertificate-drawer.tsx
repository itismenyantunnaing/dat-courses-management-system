/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import React, { useState, useEffect, useRef } from "react"
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
  CERTIFICATE_TYPES,
  CERTIFICATE_LEVELS,
} from "@/types/certificate"
import { CertificateForm } from "@/components/drawers/certificate/certificateForm"
import { mainStore } from "@/store/mainStore"

interface NewCertificateDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewCertificateDrawer({
  open,
  onOpenChange,
}: NewCertificateDrawerProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {add_CertificateData, fetch_CertificateData, certificateData} = mainStore()

  useEffect(() => {
    if (open) {
      setHasChanges(false)
    }
  }, [open])

  const handleSubmit = async (data: {
    certificateType: typeof CERTIFICATE_TYPES[number]
    level: typeof CERTIFICATE_LEVELS[number]
    imageUrl?: string
    file?: File
  }) => {
    if (!data.file) {
      alert('Please select an image file')
      return
    }

    setIsSubmitting(true)

    try {

      const result = await add_CertificateData({
        certificateType: data.certificateType,
        japaneseLevel: data.level,
        file: data.file,
        id: ""
      })


      if (result.includes('successfully')) {
        alert('✅ Certificate added successfully!')
        onOpenChange(false)
        await fetch_CertificateData()
      } else {
        alert('❌ ' + result)
      }
    } catch (error) {
      console.error('❌ Error adding certificate:', error)
      alert('❌ Failed to add certificate')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChanges = (changed: boolean) => {
    setHasChanges(changed)
  }

  const handleFormSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="right-0 left-auto h-full w-full max-w-2xl">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>Add New Certificate</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <CertificateForm
              ref={formRef}
              mode="add"
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              isSubmitting={isSubmitting}
              onChanges={handleChanges}
            />
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t">
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleFormSubmit}
              disabled={isSubmitting || !hasChanges}
            >
              {isSubmitting ? "Adding..." : "Add Certificate"}
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