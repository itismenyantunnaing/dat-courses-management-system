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
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Edit03Icon,
  Delete02Icon,
  Alert01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import Image from "next/image"
import { JapaneseCertificate } from "@/types/certificate"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CertificateForm } from "@/components/drawers/certificate/certificateForm"
import { mainStore } from "@/store/mainStore"
import { CERTIFICATE_TYPES, CERTIFICATE_LEVELS } from "@/types/certificate"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface CertificateDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  certificate: JapaneseCertificate | null
  onDelete?: (certificate: JapaneseCertificate) => void
  onUpdateSuccess?: () => void
}

// Helper function to get initials
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const getStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
    case "pending":
      return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
    case "rejected":
      return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
    default:
      return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300"
  }
}

const statusLabels = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
}

export function CertificateDetailDrawer({
  open,
  onOpenChange,
  certificate,
  onDelete,
  onUpdateSuccess,
}: CertificateDetailDrawerProps) {
  const [imageError, setImageError] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const { update_CertificateData, fetch_CertificateData, getUserId } = mainStore()

  // Reset edit mode when drawer closes
  useEffect(() => {
    if (!open) {
      setIsEditMode(false)
      setHasChanges(false)
      setImageError(false)
    }
  }, [open])

  // Reset image error when certificate changes
  useEffect(() => {
    setImageError(false)
  }, [certificate?.id])

  if (!certificate) return null

  const imageUrl = certificate.filePath || "/placeholder-certificate.png"
  const status = certificate.verificationStatus || ""

  // Get employee info
  const employeeName =
    certificate.employee?.name || certificate.employeeName || "Unknown User"
  const employeeEmail =
    certificate.employee?.email || certificate.email || "No email provided"
  const employeeAvatar = certificate.employee?.avatar || ""

  // Get submitted date
  const submittedDate = certificate.createdAt || new Date()

  const handleEditClick = () => {
    setIsEditMode(true)
    setHasChanges(false)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setHasChanges(false)
  }

  const handleFormSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  }

  const handleSubmit = async (data: {
    certificateType: (typeof CERTIFICATE_TYPES)[number]
    level: (typeof CERTIFICATE_LEVELS)[number]
    imageUrl?: string
    file?: File
  }) => {
    if (!certificate) return

    setIsSubmitting(true)

    try {
      const result = await update_CertificateData(certificate.id, {
        certificateType: data.certificateType,
        japaneseLevel: data.level,
        file: data.file,
      })

      if (result.includes("successfully")) {
        alert("✅ Certificate updated successfully!")
        // Refresh data with the user ID
        const userId = getUserId()
        if (userId) {
          await fetch_CertificateData(userId)
        } else {
          await fetch_CertificateData()
        }
        onUpdateSuccess?.()
        setIsEditMode(false)
        // Close the drawer after successful update
        onOpenChange(false)
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

  const handleDeleteClick = () => {
    // Check if certificate is approved - don't allow deletion
    if (status?.toLowerCase() === "approved") {
      alert("❌ Cannot delete an approved certificate")
      return
    }
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!certificate) return

    setIsDeleting(true)
    try {
      onDelete?.(certificate)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("❌ Error deleting certificate:", error)
      alert("❌ Failed to delete certificate")
    } finally {
      setIsDeleting(false)
    }
  }

  // Dropdown interaction handlers
  const handleDropdownOpenChange = (isOpen: boolean) => {
    if (dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }

    if (isOpen) {
      setIsInteractingWithDropdown(true)
    } else {
      dropdownCloseTimer.current = setTimeout(() => {
        setIsInteractingWithDropdown(false)
        dropdownCloseTimer.current = null
      }, 150)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isInteractingWithDropdown) {
      return
    }
    if (!newOpen && dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }
    if (!newOpen) {
      setIsEditMode(false)
      setHasChanges(false)
    }
    onOpenChange(newOpen)
  }

  const handlePointerDownOutside = (e: Event) => {
    const target = e.target as HTMLElement
    if (
      target.closest('[role="listbox"]') ||
      target.closest('[role="option"]') ||
      target.closest("[data-dropdown-trigger]")
    ) {
      e.preventDefault()
    }
  }

  return (
    <>
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
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2">
                {isEditMode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancelEdit}
                    type="button"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                  </Button>
                )}

                {isEditMode ? "Edit Certificate" : "Certificate Details"}
              </DrawerTitle>
              {!isEditMode && status?.toLowerCase() !== "approved" && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleEditClick}
                    type="button"
                  >
                    <HugeiconsIcon
                      icon={Edit03Icon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleDeleteClick}
                    type="button"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                  </Button>
                </div>
              )}
              {!isEditMode && status?.toLowerCase() === "approved" && (
                <div className="text-sm text-muted-foreground">
                  <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                    Verified ✓
                  </Badge>
                </div>
              )}
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-4">
              {isEditMode ? (
                <CertificateForm
                  ref={formRef}
                  mode="edit"
                  initialData={{
                    certificateType: certificate.certificateType as
                      (typeof CERTIFICATE_TYPES)[number] | "",
                    level: certificate.japaneseLevel as
                      (typeof CERTIFICATE_LEVELS)[number] | "",
                    id: certificate.id,
                  }}
                  initialImage={certificate.filePath || null}
                  onSubmit={handleSubmit}
                  onCancel={handleCancelEdit}
                  isSubmitting={isSubmitting}
                  onChanges={handleChanges}
                  onDropdownOpenChange={handleDropdownOpenChange}
                  disabled={status?.toLowerCase() === "approved"}
                />
              ) : (
                // View Mode
                <div className="space-y-6">
                  {/* Certificate Image */}
                  <div className="relative m-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-lg border bg-muted">
                    {!imageError ? (
                      <Image
                        src={imageUrl}
                        alt={`${certificate.certificateType} - ${certificate.japaneseLevel}`}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 500px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted/50">
                        <div className="text-center">
                          <div className="mb-2 text-4xl">📄</div>
                          <p className="text-sm text-muted-foreground">
                            No Image Available
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Status Badge - Top Right */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        className={`${getStatusBadge(status)} px-3 py-1 text-xs font-medium`}
                      >
                        {statusLabels[status as keyof typeof statusLabels] ||
                          status}
                      </Badge>
                    </div>
                  </div>

                  {/* Certificate Details with Submitted Date */}
                  <div className="mt-4 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {certificate.certificateType}
                      </h3>
                      <span>•</span>
                      <p className="text-sm text-muted-foreground">
                        {certificate.japaneseLevel}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(submittedDate), "MMM d, yyyy")}
                    </span>
                  </div>

                  {/* Employee Info */}
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                      Employee
                    </h4>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={employeeAvatar}
                          alt={employeeName}
                        />
                        <AvatarFallback>
                          {getInitials(employeeName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employeeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {employeeEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Remark */}
                  {certificate.remark && (
                    <>
                      <Separator />
                      <div className="rounded-lg border p-4">
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                          Remark
                        </h4>
                        <p className="text-sm">{certificate.remark}</p>
                      </div>
                    </>
                  )}

                  {/* Verified By */}
                  {status?.toLowerCase() === "approved" && certificate.verifiedByEmployeeName && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="mt-2 text-sm font-medium text-muted-foreground">
                          Verified By
                        </h4>
                        <div className="flex items-center gap-2 rounded-lg py-3">
                          <Avatar className="h-10 w-10 overflow-hidden rounded-full">
                            <AvatarImage
                              className="h-10 w-10 overflow-hidden rounded-full"
                              src=""
                              alt={certificate.verifiedByEmployeeName}
                            />
                            <AvatarFallback className="overflow-hidden rounded-full">
                              {getInitials(certificate.verifiedByEmployeeName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {certificate.verifiedByEmployeeName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Verifier
                            </p>
                          </div>
                          {certificate.verifiedAt && (
                            <div className="ml-auto text-sm text-muted-foreground">
                              Verified on:{" "}
                              {format(
                                new Date(certificate.verifiedAt),
                                "MMM d, yyyy h:mm a"
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <DrawerFooter className="shrink-0 border-t">
            {isEditMode ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="flex-1"
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleFormSubmit}
                  disabled={isSubmitting || !hasChanges}
                  type="button"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <DrawerClose asChild>
                <Button variant="outline" className="w-full" type="button">
                  Close
                </Button>
              </DrawerClose>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {certificate?.certificateType}
              </span>{" "}
              certificate?
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="flex-1"
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1"
              type="button"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}