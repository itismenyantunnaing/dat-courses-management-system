"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { JapaneseCertificate } from "@/types/certificate"
import { format } from "date-fns"
import Image from "next/image"

interface CertificateCardProps {
  certificate: JapaneseCertificate
  onEdit: (certificate: JapaneseCertificate) => void
  showEmployeeInfo?: boolean // Optional prop to show/hide employee info
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

const getStatusStyles = (status: string) => {
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

export function CertificateCard({
  certificate,
  onEdit,
  showEmployeeInfo = false,
}: CertificateCardProps) {
  const [imageError, setImageError] = useState(false)

  const imageUrl = certificate.filePath || "/placeholder-certificate.png"
  const status = certificate.verificationStatus || ""

  const handleCardClick = () => {
    onEdit(certificate)
  }

  // Get employee info from certificate or use defaults
  const employeeName = certificate.employee?.name || "Unknown User"
  const employeeEmail = certificate.employee?.email || "No email provided"
  const employeeAvatar = certificate.employee?.avatar || ""
  const submittedDate =
    certificate.verifiedAt || certificate.createdAt || new Date().toISOString()

  // Check if certificate has been verified
  const isVerified =
    status?.toLowerCase() === "approved" || status?.toLowerCase() === "rejected"
  const verifiedByName = certificate.verifiedByEmployeeName
  const verifiedById = certificate.verifiedByEmployeeId

  return (
    <Card
      className="group cursor-pointer overflow-hidden p-0 pbe-4 transition-all hover:border-primary/50"
      onClick={handleCardClick}
    >
      <div className="relative">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {!imageError ? (
            <Image
              src={imageUrl}
              alt={`${certificate.certificateType} - ${certificate.japaneseLevel}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

          {/* Status Badge - Top Right - New design */}
          <div className="absolute top-3 right-3">
            <Badge
              className={`${getStatusStyles(status)}`}
            >
              {`${status[0].toUpperCase()}${status.slice(1).toLowerCase()}`}
            </Badge>
          </div>
        </div>

        {/* Certificate Type with Level */}
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex w-full items-center justify-between">
            <h3 className="line-clamp-1 text-lg leading-tight font-semibold">
              {certificate.certificateType}
            </h3>
            <span className="shrink-0 text-sm text-muted-foreground">
              {certificate.japaneseLevel}
            </span>
          </div>
        </div>

        {/* Remark Section - Show if remark exists */}
        {certificate.remark && (
          <div className="px-4">
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Remark:</span>{" "}
                {certificate.remark}
              </p>
            </div>
          </div>
        )}

        {/* Verified By Information - Show if certificate is verified */}
        {isVerified && verifiedByName && (
          <div className="px-4 mt-2">
            <div className="rounded-md border border-muted bg-muted/30 px-2 py-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Verified By:
                </span>{" "}
                {verifiedByName}
              </p>
              {certificate.verifiedAt && (
                <p className="mt-0.5 text-xs text-muted-foreground/70">
                  Verified on:{" "}
                  {format(
                    new Date(certificate.verifiedAt),
                    "MMM d, yyyy h:mm a"
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Employee Information - Only show if showEmployeeInfo is true */}
        {showEmployeeInfo && (
          <div className="px-4 pt-2">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-0 w-0 rounded-lg">
                <AvatarImage src={employeeAvatar} alt={employeeName} />
                <AvatarFallback className="rounded-lg">
                  {getInitials(employeeName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{employeeName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {employeeEmail}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(submittedDate), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
