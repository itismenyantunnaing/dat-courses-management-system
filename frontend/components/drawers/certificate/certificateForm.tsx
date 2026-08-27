"use client"

import React, { useState, useRef, useEffect, forwardRef } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Upload05Icon } from "@hugeicons/core-free-icons"
import {
  CERTIFICATE_TYPES,
  CERTIFICATE_LEVELS,
  type JapaneseCertificate,
} from "@/types/certificate"
import { mainStore } from "@/store/mainStore"
import { compressFile } from "@/lib/compressImage"
import { resolveUploadUrl } from "@/lib/utils"

interface CertificateFormData {
  certificateType: (typeof CERTIFICATE_TYPES)[number] | ""
  level: (typeof CERTIFICATE_LEVELS)[number] | ""
}

interface CertificateFormProps {
  initialData?: CertificateFormData & { id?: string | number }
  initialImage?: string | null
  mode: "add" | "edit"
  onSubmit: (data: {
    certificateType: (typeof CERTIFICATE_TYPES)[number]
    level: (typeof CERTIFICATE_LEVELS)[number]
    imageUrl?: string
    file?: File
  }) => void
  onCancel: () => void
  isSubmitting?: boolean
  onChanges?: (hasChanges: boolean) => void
  onDropdownOpenChange?: (isOpen: boolean) => void
}

export const CertificateForm = forwardRef<
  HTMLFormElement,
  CertificateFormProps
>(
  (
    {
      initialData,
      initialImage,
      mode,
      onSubmit,
      onCancel,
      isSubmitting = false,
      onChanges,
      onDropdownOpenChange,
    },
    ref
  ) => {
    const [formData, setFormData] = useState<CertificateFormData>({
      certificateType: initialData?.certificateType || "",
      level: initialData?.level || "",
    })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(
      resolveUploadUrl(initialImage)
    )
    const [isDragging, setIsDragging] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const initialFormDataRef = useRef<CertificateFormData | null>(null)
    const { certificateData, fetch_SystemConfig, systemConfig } = mainStore()

    useEffect(() => {
      fetch_SystemConfig()
    }, [systemConfig])

    // Get existing certificate combinations
    const existingCertificates = certificateData || []

    // Get the current certificate being edited (if in edit mode)
    const currentCertificateId = mode === "edit" ? initialData?.id : null

    // Check if a level is already used for the selected certificate type
    const isLevelDisabled = (level: string): boolean => {
      // If no certificate type is selected, don't disable anything
      if (!formData.certificateType) return false

      return existingCertificates.some((cert: JapaneseCertificate) => {
        // Skip checking the current certificate when editing
        if (mode === "edit" && cert.id === currentCertificateId) {
          return false
        }

        // Check if same certificate type and level exists
        const certType = cert.certificateType
        const certLevel = cert.japaneseLevel
        return certType === formData.certificateType && certLevel === level
      })
    }

    // Get available levels for the selected certificate type
    const getAvailableLevels = () => {
      if (!formData.certificateType) return CERTIFICATE_LEVELS
      return CERTIFICATE_LEVELS.filter((level) => !isLevelDisabled(level))
    }

    // Check if the current selection is already taken
    const isDuplicateSelection = (): boolean => {
      if (!formData.certificateType || !formData.level) return false

      return existingCertificates.some((cert: JapaneseCertificate) => {
        if (mode === "edit" && cert.id === currentCertificateId) {
          return false
        }

        const certType = cert.certificateType
        const certLevel = cert.japaneseLevel
        return (
          certType === formData.certificateType && certLevel === formData.level
        )
      })
    }

    // Get display label for certificate type
    const getDisplayLabel = (type: string) => {
      return type === "NAT_TEST" ? "NAT-test" : type === "TOP_J" ? "TopJ" : type
    }

    // ✅ Check if form is valid and update changes
    useEffect(() => {
      const hasCertificateType = !!formData.certificateType
      const hasLevel = !!formData.level
      const hasFile = mode === "add" ? !!selectedFile : true
      const isDuplicate = isDuplicateSelection()

      const valid = hasCertificateType && hasLevel && hasFile && !isDuplicate
      setIsFormValid(valid)

      // ✅ Check for changes
      if (mode === "edit" && initialFormDataRef.current) {
        const hasFormChanges =
          formData.certificateType !==
          initialFormDataRef.current.certificateType ||
          formData.level !== initialFormDataRef.current.level ||
          selectedFile !== null

        if (onChanges) {
          onChanges(hasFormChanges && !isDuplicate)
        }
      } else if (mode === "add") {
        const hasChanges =
          !!formData.certificateType || !!formData.level || !!selectedFile
        if (onChanges) {
          onChanges(hasChanges && !isDuplicate)
        }
      }
    }, [formData, selectedFile, mode, onChanges])

    // Store initial data for comparison
    useEffect(() => {
      if (mode === "edit" && initialData) {
        initialFormDataRef.current = {
          certificateType: initialData.certificateType,
          level: initialData.level,
        }
      }
    }, [initialData, mode])

    // ✅ Update image preview when initialImage changes
    useEffect(() => {
      if (mode === "edit" && initialImage) {
        setImagePreview(resolveUploadUrl(initialImage))
        setSelectedFile(null)
      }
    }, [initialImage, mode])

    // When certificate type changes, clear the level if it's disabled
    useEffect(() => {
      if (formData.certificateType && formData.level) {
        if (isLevelDisabled(formData.level)) {
          setFormData((prev) => ({ ...prev, level: "" }))
        }
      }
    }, [formData.certificateType])

    const handleImageChange = async (file: File | null) => {
      if (file) {
        if (!file.type.startsWith("image/")) {
          alert("Please select an image file")
          return
        }

        try {
          const maxSizeMB = systemConfig?.fileUploadSizeMb || 0.75
          // COMPRESS THE IMAGE HERE
          const compressed = await compressFile(file, maxSizeMB)

          setSelectedFile(compressed)

          // Create preview from compressed file
          const reader = new FileReader()
          reader.onloadend = () => {
            setImagePreview(reader.result as string)
          }
          reader.readAsDataURL(compressed)
        } catch (error) {
          // Fallback: use original file if compression fails
          console.warn('Compression failed, using original file:', error)
          setSelectedFile(file)

          // Create preview from original file
          const reader = new FileReader()
          reader.onloadend = () => {
            setImagePreview(reader.result as string)
          }
          reader.readAsDataURL(file)
        }
      } else {
        setSelectedFile(null)
        setImagePreview(resolveUploadUrl(initialImage))
      }
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageChange(e.dataTransfer.files[0])
      }
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()

      if (!formData.certificateType || !formData.level) {
        alert("Please select certificate type and level")
        return
      }

      if (mode === "add" && !selectedFile) {
        alert("Please select an image file")
        return
      }

      if (isDuplicateSelection()) {
        alert(
          `A certificate with type "${getDisplayLabel(formData.certificateType)}" and level "${formData.level}" already exists. Please select a different combination.`
        )
        return
      }

      onSubmit({
        certificateType:
          formData.certificateType as (typeof CERTIFICATE_TYPES)[number],
        level: formData.level as (typeof CERTIFICATE_LEVELS)[number],
        imageUrl: imagePreview || undefined,
        file: selectedFile || undefined,
      })
    }

    const ImageUploadArea = () => (
      <div
        className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25"
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-2">
          {imagePreview ? (
            <div className="relative aspect-square w-full max-w-[200px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Certificate preview"
                className="h-full w-full rounded-lg object-cover"
              />
            </div>
          ) : (
            <div className="rounded-full bg-muted p-2">
              <HugeiconsIcon
                icon={Upload05Icon}
                strokeWidth={1.5}
                className="size-6 text-muted-foreground"
              />
            </div>
          )}
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium">
              {selectedFile
                ? selectedFile.name
                : mode === "edit" && initialImage
                  ? "Current image uploaded"
                  : "Choose an image or drag & drop it here"}
            </p>

          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
            accept=".jpg,.jpeg,.png"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
            {selectedFile && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleImageChange(null)}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    )

    const availableLevels = getAvailableLevels()
    const hasCertificateType = !!formData.certificateType

    return (
      <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-semibold">
            Certificate Information
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Certificate Type Select - with stopPropagation wrapper like employeeForm */}
            <div
              className="min-w-0 space-y-2"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Label htmlFor="certificateType">
                Certificate Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.certificateType}
                onValueChange={(value: (typeof CERTIFICATE_TYPES)[number]) =>
                  setFormData({
                    ...formData,
                    certificateType: value,
                    level: "",
                  })
                }
                onOpenChange={onDropdownOpenChange}
              >
                <SelectTrigger id="certificateType" className="w-full">
                  <SelectValue placeholder="Select certificate type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Certificate Type</SelectLabel>
                    {CERTIFICATE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getDisplayLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Level Select - with stopPropagation wrapper like employeeForm */}
            <div
              className="min-w-0 space-y-2"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Label htmlFor="level">
                Level <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.level}
                onValueChange={(value: (typeof CERTIFICATE_LEVELS)[number]) =>
                  setFormData({ ...formData, level: value })
                }
                disabled={!hasCertificateType}
                onOpenChange={onDropdownOpenChange}
              >
                <SelectTrigger id="level" className="w-full">
                  <SelectValue
                    placeholder={
                      hasCertificateType
                        ? "Select level"
                        : "Select certificate type first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Certificate Level</SelectLabel>
                    {!hasCertificateType ? (
                      <SelectItem value="" disabled>
                        Please select a certificate type first
                      </SelectItem>
                    ) : availableLevels.length === 0 ? (
                      <SelectItem value="" disabled>
                        All levels are already taken
                      </SelectItem>
                    ) : (
                      CERTIFICATE_LEVELS.map((level) => {
                        const isDisabled = isLevelDisabled(level)
                        return (
                          <SelectItem
                            key={level}
                            value={level}
                            disabled={isDisabled}
                            className={
                              isDisabled ? "cursor-not-allowed opacity-50" : ""
                            }
                          >
                            {level}
                            {isDisabled && " (already exists)"}
                          </SelectItem>
                        )
                      })
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {hasCertificateType && availableLevels.length === 0 && (
                <p className="text-xs text-yellow-600">
                  All levels for {getDisplayLabel(formData.certificateType)} are
                  already taken.
                </p>
              )}
            </div>

            {/* Image Upload Area */}
            <div className="min-w-0 space-y-2 sm:col-span-2">
              <Label>
                Certificate Image{" "}
                {mode === "add" && <span className="text-red-500">*</span>}
              </Label>
              <ImageUploadArea />
            </div>
          </div>
        </div>
      </form>
    )
  }
)

CertificateForm.displayName = "CertificateForm"