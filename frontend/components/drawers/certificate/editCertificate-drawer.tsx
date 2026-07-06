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
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const update_CertificateData = mainStore(
    (state) => state.update_CertificateData
  )
  const fetch_CertificateData = mainStore(
    (state) => state.fetch_CertificateData
  )

  // Reset hasChanges when drawer opens or certificate changes
  useEffect(() => {
    if (open && certificate) {
      setHasChanges(false)
    }
  }, [open, certificate])

  const handleSubmit = async (data: {
    certificateType: (typeof CERTIFICATE_TYPES)[number]
    level: (typeof CERTIFICATE_LEVELS)[number]
    imageUrl?: string
    file?: File
  }) => {
    if (!certificate) {
      console.error("❌ No certificate to edit")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("📤 Updating certificate:", {
        id: certificate.id,
        certificateType: data.certificateType,
        japaneseLevel: data.level,
        hasFile: !!data.file,
        fileName: data.file?.name,
      })

      const result = await update_CertificateData(certificate.id, {
        certificateType: data.certificateType,
        japaneseLevel: data.level,
        file: data.file,
      })

      console.log("✅ Update result:", result)

      if (result.includes("successfully")) {
        alert("✅ Certificate updated successfully!")
        onOpenChange(false)
        await fetch_CertificateData()
      } else {
        alert("❌ " + result)
      }
    } catch (error) {
      console.error("❌ Error updating certificate:", error)
      alert("❌ Failed to update certificate")
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

  // Add dropdown interaction handlers
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

  if (!certificate) return null

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent
        className="right-0 left-auto h-full w-full max-w-2xl"
        onPointerDownOutside={handlePointerDownOutside}
        onEscapeKeyDown={(e) => {
          // Prevent escape key from closing when dropdown is open
          if (isInteractingWithDropdown) {
            e.preventDefault()
          }
        }}
      >
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>Edit Certificate</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <CertificateForm
              ref={formRef}
              mode="edit"
              initialData={{
                certificateType: certificate.certificateType as
                  | (typeof CERTIFICATE_TYPES)[number]
                  | "",
                level: certificate.japaneseLevel as
                  | (typeof CERTIFICATE_LEVELS)[number]
                  | "",
                id: certificate.id, // Pass the ID for duplicate checking
              }}
              initialImage={certificate.filePath || null}
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              isSubmitting={isSubmitting}
              onChanges={handleChanges}
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
              onClick={handleFormSubmit}
              disabled={isSubmitting || !hasChanges}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
