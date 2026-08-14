"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Loading03Icon,
  Certificate01Icon,
  Upload05Icon,
} from "@hugeicons/core-free-icons"
import { JapaneseCertificate } from "@/types/certificate"
import { CertificateCard } from "../components/cards/certificate-card"
import { NewCertificateDrawer } from "./drawers/certificate/createCertificate-drawer"
import { CertificateDetailDrawer } from "../components/drawers/certificate/certificateDetail-drawer"
import { mainStore } from "@/store/mainStore"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const STROKE_WIDTH = 2

const statusLabels = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
}

interface JapaneseCertificateContainerProps {
  selectedCertificateId?: string | number | null
}

// Spinner component
const Spinner = ({ className, ...props }: React.ComponentProps<"svg">) => {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
    />
  )
}

// Spinner with text
const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <Spinner />
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
}

export function JapaneseCertificateContainer({
  selectedCertificateId,
}: JapaneseCertificateContainerProps) {
  const {
    certificateData,
    fetch_CertificateData,
    getUserId,
    isLoading,
    delete_CertificateData,
  } = mainStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)
  const [editingCertificate, setEditingCertificate] =
    useState<JapaneseCertificate | null>(null)

  const searchPlaceholder = "Search certificates..."
  const searchInputRef = useRef<HTMLInputElement>(null)
  const hasProcessedSelectedIdRef = useRef(false)

  // Reset processed flag when selectedCertificateId changes
  useEffect(() => {
    if (selectedCertificateId) {
      hasProcessedSelectedIdRef.current = false
    }
  }, [selectedCertificateId])

  // Keyboard shortcut for search focus (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Fetch certificates on mount
  useEffect(() => {
    const userId = getUserId()
    if (userId) {
      fetch_CertificateData(userId)
    }
  }, [fetch_CertificateData, getUserId])

  // Effect to find and open the certificate when selectedCertificateId is provided
  useEffect(() => {
    // Only process if:
    // 1. We have a selectedCertificateId
    // 2. We're not loading
    // 3. We haven't processed this ID yet
    // 4. We have certificates loaded
    if (
      !selectedCertificateId ||
      isLoading ||
      hasProcessedSelectedIdRef.current ||
      certificateData.length === 0
    ) {
      return
    }

    // Find the certificate (convert ID to string for comparison)
    const certIdStr = selectedCertificateId.toString()
    const foundCertificate = certificateData.find((c) => c.id === certIdStr)

    if (foundCertificate) {
      // Open the certificate detail drawer
      handleCardClick(foundCertificate)
      hasProcessedSelectedIdRef.current = true
      return
    }

    // If certificate not found, try to refresh data
    console.warn(
      `Certificate with ID ${selectedCertificateId} not found. Refreshing...`
    )
    const userId = getUserId()
    if (userId) {
      fetch_CertificateData(userId).then(() => {
        // After refresh, check again
        const refreshedCertificate = certificateData.find(
          (c) => c.id === certIdStr
        )
        if (refreshedCertificate) {
          console.log(
            "✅ Found certificate after refresh:",
            refreshedCertificate.id
          )
          handleCardClick(refreshedCertificate)
        } else {
          console.error(
            `Certificate with ID ${selectedCertificateId} not found after refresh`
          )
        }
        hasProcessedSelectedIdRef.current = true
      })
    } else {
      hasProcessedSelectedIdRef.current = true
    }
  }, [
    selectedCertificateId,
    certificateData,
    isLoading,
    fetch_CertificateData,
    getUserId,
  ])

  // Count certificates by status
  const statusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: certificateData.length,
    }
    certificateData.forEach((cert) => {
      if (cert.verificationStatus === "pending") counts.pending++
      else if (cert.verificationStatus === "approved") counts.approved++
      else if (cert.verificationStatus === "rejected") counts.rejected++
    })
    return counts
  }, [certificateData])

  // Filter certificates
  const filteredCertificates = useMemo(() => {
    const search = searchTerm.toLowerCase()
    return certificateData.filter((cert) => {
      const matchesSearch =
        cert.certificateType.toLowerCase().includes(search) ||
        cert.japaneseLevel.toLowerCase().includes(search) ||
        (cert.verifiedAt &&
          format(cert.verifiedAt, "MMM yyyy").toLowerCase().includes(search)) ||
        cert.verificationStatus?.toLowerCase().includes(search)

      const matchesStatus =
        statusFilter === "all" || cert.verificationStatus === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [certificateData, searchTerm, statusFilter])

  // Handle card click - opens detail drawer
  const handleCardClick = (certificate: JapaneseCertificate) => {
    setEditingCertificate(certificate)
    setIsDetailDrawerOpen(true)
  }

  // Handle delete from detail drawer
  const handleDeleteCertificate = async (certificate: JapaneseCertificate) => {
    try {
      const result = await delete_CertificateData(certificate.id)
      if (result.includes("successfully")) {
        alert("✅ Certificate deleted successfully!")
        await fetch_CertificateData(getUserId() || "")
        setIsDetailDrawerOpen(false)
        setEditingCertificate(null)
      } else {
        alert("❌ " + result)
      }
    } catch (error) {
      console.error("❌ Error deleting certificate:", error)
      alert("❌ Failed to delete certificate")
    }
  }

  // Handle update success from detail drawer
  const handleUpdateSuccess = async () => {
    await fetch_CertificateData(getUserId() || "")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner text="Loading certificates..." />
        </div>
      </div>
    )
  }

  const hasCertificates = certificateData.length > 0

  // Generate empty state message based on status counts
  const getEmptyStateMessage = () => {
    const parts = []
    if (statusCounts.pending > 0) {
      parts.push(
        `${statusCounts.pending} pending certificate${statusCounts.pending > 1 ? "s" : ""}`
      )
    }
    if (statusCounts.approved > 0) {
      parts.push(
        `${statusCounts.approved} approved certificate${statusCounts.approved > 1 ? "s" : ""}`
      )
    }
    if (statusCounts.rejected > 0) {
      parts.push(
        `${statusCounts.rejected} rejected certificate${statusCounts.rejected > 1 ? "s" : ""}`
      )
    }

    if (parts.length === 0) {
      return "You don't have any certificates yet."
    }

    const statusFilterLabel =
      statusFilter === "all"
        ? ""
        : statusFilter === "pending"
          ? "pending "
          : statusFilter === "approved"
            ? "approved "
            : "rejected "

    if (statusFilter !== "all") {
      const count = statusCounts[statusFilter as keyof typeof statusCounts]
      if (count === 0) {
        return `You have ${parts.join(", ")} but no ${statusFilterLabel}certificates to show.`
      }
    }

    return `You have ${parts.join(", ")}.`
  }

  return (
    <div className="p-4">
      {/* Always show search/filter/button when there are certificates */}
      {hasCertificates && (
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-4">
              <InputGroup className="max-w-xs flex-1">
                <InputGroupInput
                  ref={searchInputRef}
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <InputGroupAddon>
                  <HugeiconsIcon
                    icon={Search01Icon}
                    strokeWidth={STROKE_WIDTH}
                    className="h-4 w-4 text-muted-foreground"
                  />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <Kbd>Ctrl + K</Kbd>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-auto min-w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent align="center" sideOffset={5}>
                  <SelectGroup>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                variant="default"
                onClick={() => setIsNewDrawerOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <HugeiconsIcon icon={Upload05Icon} strokeWidth={2} />
                Upload Certificate
              </Button>
            </div>
          </div>
        </div>
      )}

      {filteredCertificates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCertificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              onEdit={handleCardClick}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <Empty className="m-auto min-h-[300px] max-w-[500px] rounded-lg">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon
                icon={Certificate01Icon}
                strokeWidth={2}
                className="h-12 w-12 text-muted-foreground"
              />
            </EmptyMedia>
            <EmptyTitle>
              {hasCertificates ? "No Matching Certificates" : "No Certificates"}
            </EmptyTitle>
            <EmptyDescription className="text-center text-pretty">
              {hasCertificates ? (
                <>
                  {getEmptyStateMessage()}
                  {(searchTerm || statusFilter !== "all") && (
                    <span className="mt-2 block">
                      Try adjusting your search or filters.
                    </span>
                  )}
                </>
              ) : (
                "You haven't uploaded any Japanese certificates yet."
              )}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {(searchTerm || statusFilter !== "all") && hasCertificates ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => setIsNewDrawerOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <HugeiconsIcon
                  icon={Upload05Icon}
                  strokeWidth={2}
                  className="h-4 w-4"
                />
                Upload
              </Button>
            )}
          </EmptyContent>
        </Empty>
      )}

      {/* New Certificate Drawer */}
      <NewCertificateDrawer
        open={isNewDrawerOpen}
        onOpenChange={setIsNewDrawerOpen}
      />

      {/* Certificate Detail Drawer */}
      <CertificateDetailDrawer
        open={isDetailDrawerOpen}
        onOpenChange={setIsDetailDrawerOpen}
        certificate={editingCertificate}
        onDelete={handleDeleteCertificate}
        onUpdateSuccess={handleUpdateSuccess}
      />
    </div>
  )
}
