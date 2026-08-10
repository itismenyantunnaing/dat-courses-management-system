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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CERTIFICATE_TYPES,
  CERTIFICATE_LEVELS,
  JapaneseCertificate,
} from "@/types/certificate"
import { CertificateForm } from "@/components/drawers/certificate/certificateForm"
import { mainStore } from "@/store/mainStore"
import { format } from "date-fns"
import Image from "next/image"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

interface ApproveCertificateDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  certificate: JapaneseCertificate | null
  onApprove?: (certificateId: string, remark: string) => Promise<void>
  onDeny?: (certificateId: string, remark: string) => Promise<void>
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

export function ApproveCertificateDrawer({
  open,
  onOpenChange,
  certificate,
  onApprove,
  onDeny,
}: ApproveCertificateDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const [remark, setRemark] = useState("")
  const [imageError, setImageError] = useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const verify_CertificateData = mainStore(
    (state) => state.verify_CertificateData
  )
  const reject_CertificateData = mainStore(
    (state) => state.reject_CertificateData
  )

  // Reset states when drawer opens
  useEffect(() => {
    if (open && certificate) {
      setRemark(certificate.remark || "")
      setImageError(false)
    }
  }, [open, certificate])

  const handleApprove = async () => {
    if (!certificate) {
      console.error("❌ No certificate to approve")
      return
    }

    setIsSubmitting(true)

    try {
      // Update certificate status to "approved" with remark
      const result = await verify_CertificateData(certificate.id, remark)

      if (result.includes("successfully")) {
        alert("✅ Certificate approved successfully!")
        onOpenChange(false)
        if (onApprove) {
          await onApprove(certificate.id, remark)
        }
      } else {
        alert("❌ " + result)
      }
    } catch (error) {
      console.error("❌ Error approving certificate:", error)
      alert("❌ Failed to approve certificate")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeny = async () => {
    if (!certificate) {
      console.error("❌ No certificate to deny")
      return
    }

    if (!remark.trim()) {
      alert("❌ Please provide a reason for denying this certificate")
      return
    }

    setIsSubmitting(true)

    try {
      // Update certificate status to "rejected" with remark
      const result = await reject_CertificateData(certificate.id, remark)

      if (result.includes("successfully")) {
        alert("✅ Certificate denied successfully!")
        onOpenChange(false)
        if (onDeny) {
          await onDeny(certificate.id, remark)
        }
      } else {
        alert("❌ " + result)
      }
    } catch (error) {
      console.error("❌ Error denying certificate:", error)
      alert("❌ Failed to deny certificate")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add dropdown interaction handlers
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

  if (!certificate) return null

  const imageUrl = certificate.filePath || "/placeholder-certificate.png"
  const status = certificate.status
  const employeeName = certificate.employee.name || ""
  const employeeEmail = certificate.email || "No email provided"
  const employeeAvatar = ""
  const submittedDate = certificate.createdAt
    ? certificate.createdAt.toISOString()
    : new Date().toISOString()
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
        <DrawerHeader className="flex w-full justify-between border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle>Review Requested Certificate</DrawerTitle>
            {/* <DrawerClose asChild>
            <Button variant="ghost" size="icon" disabled={isSubmitting}>
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </Button>
          </DrawerClose> */}
            <Badge
              className={`${getStatusBadge(status)} px-3 py-1 text-xs font-medium`}
            >
              {status[0].toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 px-6 py-4">
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
            </div>

            {/* Certificate Details */}
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    {certificate.certificateType}
                  </h3>
                  <span>•</span>
                  <p className="text-sm text-muted-foreground">
                    {certificate.japaneseLevel}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(submittedDate), "MMM d, yyyy")}
                </span>
              </div>

              <Separator />

              {/* Employee Information */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  Submitted By
                </h4>
                <div className="flex items-center gap-2 rounded-lg py-3">
                  <Avatar className="h-10 w-10 overflow-hidden rounded-full">
                    <AvatarImage
                      className="h-10 w-10 overflow-hidden rounded-full"
                      src={employeeAvatar}
                      alt={employeeName}
                    />
                    <AvatarFallback className="overflow-hidden rounded-full">
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

              {/* Remark Field */}
              <div className="space-y-2">
                <Label htmlFor="remark" className="text-sm font-medium">
                  Remark
                  <span className="font-normal text-muted-foreground">
                    (Optional for approval, required for denial)
                  </span>
                </Label>
                <Textarea
                  id="remark"
                  placeholder="Add any remarks or notes about this certificate request..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t">
          <div className="flex gap-2">
            {status !== "rejected" && (
              <Button
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeny}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Deny"}
              </Button>
            )}
            {status !== "approved" && (
              <Button
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
                onClick={handleApprove}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Approve"}
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
