"use client"

import React, { useRef } from "react"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Upload05Icon } from "@hugeicons/core-free-icons"

interface ImageUploadProps {
  imagePreview: string | null
  selectedImage: File | null
  isDragging: boolean
  onImageChange: (file: File | null) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

export const ImageUploadArea: React.FC<ImageUploadProps> = ({
  imagePreview,
  selectedImage,
  isDragging,
  onImageChange,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25"
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex flex-col items-center gap-2">
        {imagePreview ? (
          <div className="relative aspect-video w-full max-w-[300px]">
            <img
              src={imagePreview}
              alt="Course preview"
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
            {selectedImage
              ? selectedImage.name
              : "Choose an image or drag & drop it here (Optional)"}
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum 10 MB (JPG, PNG)
          </p>
          {selectedImage && (
            <p className="text-xs text-green-600">
              ✓ Image selected: {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => onImageChange(e.target.files?.[0] || null)}
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
          {selectedImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onImageChange(null)}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}