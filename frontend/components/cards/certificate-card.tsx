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

const getLevelColor = (level: string) => {
  switch (level) {
    case "N1": return "bg-red-500"
    case "N2": return "bg-orange-500"
    case "N3": return "bg-yellow-500"
    case "N4": return "bg-green-500"
    case "N5": return "bg-blue-500"
    default: return "bg-gray-500"
  }
}

const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800"
    case "pending":
      return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
    case "rejected":
      return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800"
    default:
      return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300 border-gray-200 dark:border-gray-800"
  }
}

export function CertificateCard({ certificate, onEdit }: CertificateCardProps) {
  const [imageError, setImageError] = useState(false)

  const imageUrl = certificate.filePath || '/placeholder-certificate.png'
  const status = certificate.status || "pending"

  const handleCardClick = () => {
    onEdit(certificate)
  }

  const formattedDate = certificate.verifiedAt 
    ? format(new Date(certificate.verifiedAt), "d MMM yyyy")
    : "Not verified"

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:shadow-md"
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
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm text-muted-foreground">No Image Available</p>
              </div>
            </div>
          )}

          <div className="absolute top-3 right-3">
            <Badge
              variant="outline"
              className={`${getStatusStyles(status)} border px-3 py-1 text-xs font-medium tracking-wider uppercase`}
            >
              {status}
            </Badge>
          </div>

          <div className="absolute bottom-3 left-3">
            <Badge
              className={`${getLevelColor(certificate.japaneseLevel)} px-3 py-1 text-sm font-bold text-white shadow-md`}
            >
              {certificate.japaneseLevel}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 px-4 pb-4">
          <h3 className="line-clamp-1 text-lg leading-tight font-semibold">
            {certificate.certificateType}
          </h3>
          <div className="text-sm text-muted-foreground shrink-0 ml-2">
            {formattedDate}
          </div>
        </div>
      </div>
    </Card>
  )
}