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
  JapaneseCertificate,
} from "@/types/certificate"
import { CertificateForm } from "@/components/drawers/certificate/certificateForm"
import { mainStore } from "@/store/mainStore"

interface EditCertificateDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  certificate: JapaneseCertificate | null
}

export function EditCertificateDrawer({
  open,
  onOpenChange,
  certificate,
}: EditCertificateDrawerProps) {
  const [hasChanges, setHasChanges] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const update_CertificateData = mainStore((state) => state.update_CertificateData)
  const fetch_CertificateData = mainStore((state) => state.fetch_CertificateData)

  // Reset hasChanges when drawer opens or certificate changes
  useEffect(() => {
    if (open && certificate) {
      setHasChanges(false)
    }
  }, [open, certificate])

  const handleSubmit = async (data: {
    certificateType: typeof CERTIFICATE_TYPES[number]
    level: typeof CERTIFICATE_LEVELS[number]
    imageUrl?: string
    file?: File
  }) => {
    if (!certificate) {
      console.error('❌ No certificate to edit')
      return
    }

    setIsSubmitting(true)

    try {
      console.log('📤 Updating certificate:', {
        id: certificate.id,
        certificateType: data.certificateType,
        japaneseLevel: data.level,
        hasFile: !!data.file,
        fileName: data.file?.name
      })

      // ✅ FIX: Pass the file as 'file' not 'filePath'
      const result = await update_CertificateData(certificate.id, {
        certificateType: data.certificateType,
        japaneseLevel: data.level,
        file: data.file,  // ✅ Changed from filePath to file
      })

      console.log('✅ Update result:', result)

      if (result.includes('successfully')) {
        alert('✅ Certificate updated successfully!')
        onOpenChange(false)
        await fetch_CertificateData()
      } else {
        alert('❌ ' + result)
      }
    } catch (error) {
      console.error('❌ Error updating certificate:', error)
      alert('❌ Failed to update certificate')
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

  if (!certificate) return null

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="right-0 left-auto h-full w-full max-w-2xl">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>Edit Certificate</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <CertificateForm
              ref={formRef}
              mode="edit"
              initialData={{
                certificateType: certificate.certificateType as (typeof CERTIFICATE_TYPES)[number] | "",
                level: certificate.japaneseLevel as (typeof CERTIFICATE_LEVELS)[number] | "",
              }}
              // ✅ Pass the current image URL
              initialImage={certificate.filePath || null}
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
