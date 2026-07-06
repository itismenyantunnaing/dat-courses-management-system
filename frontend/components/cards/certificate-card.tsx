"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { JapaneseCertificate } from "@/types/certificate"
import { format } from "date-fns"
import Image from "next/image"

interface CertificateCardProps {
  certificate: JapaneseCertificate
  onEdit: (certificate: JapaneseCertificate) => void
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

export function CertificateCard({ certificate, onEdit }: CertificateCardProps) {
  const [imageError, setImageError] = useState(false)

  const imageUrl = certificate.filePath || "/placeholder-certificate.png"
  const status = certificate.status || "pending"

  const handleCardClick = () => {
    onEdit(certificate)
  }

  return (
    <Card
      className="group cursor-pointer overflow-hidden pbs-0 transition-all hover:border-primary/50"
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

          {/* Status Badge - Top Right */}
          <div className="absolute top-3 right-3">
            <Badge
              className={`${getStatusStyles(status)} px-3 py-1 text-xs font-medium tracking-wider uppercase`}
            >
              {status}
            </Badge>
          </div>
        </div>

        {/* Certificate Type with Level displayed as text */}
        <div className="flex items-center justify-between px-4 pt-4 pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="line-clamp-1 text-lg leading-tight font-semibold">
              {certificate.certificateType}
            </h3>
            <span className="shrink-0 text-sm text-muted-foreground">
              {certificate.japaneseLevel}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
