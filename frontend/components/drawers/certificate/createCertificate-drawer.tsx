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
import { CERTIFICATE_TYPES, CERTIFICATE_LEVELS } from "@/types/certificate"
import { CertificateForm } from "@/components/drawers/certificate/certificateForm"
import { mainStore } from "@/store/mainStore"
import { toast } from "sonner"

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
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)
  const { add_CertificateData, fetch_CertificateData, certificateData } =
    mainStore()

  useEffect(() => {
    if (open) {
      setHasChanges(false)
    }
  }, [open])

  const handleSubmit = async (data: {
    certificateType: (typeof CERTIFICATE_TYPES)[number]
    level: (typeof CERTIFICATE_LEVELS)[number]
    imageUrl?: string
    file?: File
  }) => {
    if (!data.file) {
      toast.info("Please select an image file")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await add_CertificateData({
        certificateType: data.certificateType,
        japaneseLevel: data.level,
        file: data.file,
        id: "",
      })

      if (result.includes("successfully")) {
        toast.success(" Certificate added successfully!")
        onOpenChange(false)
        await fetch_CertificateData()
      } else {
        toast.error("❌ " + result)
      }
    } catch (error) {
      console.error("❌ Error adding certificate:", error)
      toast.error("❌ Failed to add certificate")
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
              onDropdownOpenChange={handleDropdownOpenChange} // Pass this down
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
              {isSubmitting ? "Adding..." : "Add Certificate"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
