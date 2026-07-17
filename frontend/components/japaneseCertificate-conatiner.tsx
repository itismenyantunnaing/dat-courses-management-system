"use client"

import React, { useState, useMemo, useEffect } from "react"
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
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  DiplomaIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { JapaneseCertificate } from "@/types/certificate"
import { CertificateCard } from "../components/cards/certificate-card"
import { NewCertificateDrawer } from "../components/drawers/certificate/newCertificate-drawer"
import { EditCertificateDrawer } from "../components/drawers/certificate/editCertificate-drawer"
import { mainStore } from "@/store/mainStore"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const STROKE_WIDTH = 2

const statusLabels = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
}

// Spinner component
const Spinner = ({ className, ...props }: React.ComponentProps<"svg">) => {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
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

export function JapaneseCertificateContainer() {
  const { certificateData, fetch_CertificateData, getUserId, isLoading } =
    mainStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [editingCertificate, setEditingCertificate] =
    useState<JapaneseCertificate | null>(null)

  const searchPlaceholder = "Search certificates..."

  // Fetch certificates on mount
  useEffect(() => {
    const userId = getUserId()
    if (userId) {
      fetch_CertificateData(userId)
    }
  }, [])

  // Filter certificates
  const filteredCertificates = useMemo(() => {
    const search = searchTerm.toLowerCase()
    return certificateData.filter((cert) => {
      console.log(cert)
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
  

  const handleEdit = (certificate: JapaneseCertificate) => {
    setEditingCertificate(certificate)
    setIsEditDrawerOpen(true)
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

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative max-w-xs flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={STROKE_WIDTH}
              className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground"
            />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
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
            <HugeiconsIcon icon={DiplomaIcon} strokeWidth={2} />
            New
          </Button>
        </div>
      </div>

      {filteredCertificates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCertificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all"
              ? "No certificates found matching your filters"
              : "No certificates available. Upload your first certificate!"}
          </p>
        </div>
      )}

      <NewCertificateDrawer
        open={isNewDrawerOpen}
        onOpenChange={setIsNewDrawerOpen}
      />

      <EditCertificateDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        certificate={editingCertificate}
      />
    </div>
  )
}
