"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Loading03Icon,
  Certificate01Icon,
  Upload05Icon,
  FilterMailIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import { JapaneseCertificate } from "@/types/certificate"
import { CertificateCard } from "../components/cards/certificate-card"
import { NewCertificateDrawer } from "./drawers/certificate/createCertificate-drawer"
import { CertificateDetailDrawer } from "../components/drawers/certificate/certificateDetail-drawer"
import { mainStore } from "@/store/mainStore"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuShortcut,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "./ui/dropdown-menu"
import { toast } from "sonner"

const STROKE_WIDTH = 2

const statusLabels = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
}

interface JapaneseCertificateContainerProps {
  selectedCertificateId?: string | number | null
}

type StatusTab = "all" | "approved" | "pending" | "rejected"

// Filter state type
type FilterState = {
  status: string[]
  certificateType: string[]
  level: string[]
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
  const [statusTab, setStatusTab] = useState<StatusTab>("all")
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)
  const [editingCertificate, setEditingCertificate] =
    useState<JapaneseCertificate | null>(null)

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    certificateType: [],
    level: [],
  })

  const searchPlaceholder = "Search certificates..."
  const searchInputRef = useRef<HTMLInputElement>(null)
  const hasProcessedSelectedIdRef = useRef(false)

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    (filterArray) => filterArray.length > 0
  )

  // Get unique certificate types, levels, and statuses for filter dropdown
  const uniqueCertificateTypes = useMemo(() => {
    const types = new Set<string>()
    certificateData.forEach((cert) => {
      if (cert.certificateType) {
        types.add(cert.certificateType)
      }
    })
    return Array.from(types).sort()
  }, [certificateData])

  const uniqueLevels = useMemo(() => {
    const levels = new Set<string>()
    certificateData.forEach((cert) => {
      if (cert.japaneseLevel) {
        levels.add(cert.japaneseLevel)
      }
    })
    return Array.from(levels).sort()
  }, [certificateData])

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>()
    certificateData.forEach((cert) => {
      if (cert.verificationStatus) {
        statuses.add(cert.verificationStatus)
      }
    })
    return Array.from(statuses).sort()
  }, [certificateData])

  const hasCertificateTypeData = uniqueCertificateTypes.length > 0
  const hasLevelData = uniqueLevels.length > 0
  const hasStatusData = uniqueStatuses.length > 0
  const hasFilterData = hasCertificateTypeData || hasLevelData || hasStatusData

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

  // Keyboard shortcut for clearing filters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        e.key === "Escape" &&
        !target.closest("input") &&
        !target.closest("textarea") &&
        hasActiveFilters
      ) {
        e.preventDefault()
        clearAllFilters()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [hasActiveFilters])

  // Fetch certificates on mount
  useEffect(() => {
    const userId = getUserId()
    if (userId) {
      fetch_CertificateData(userId)
    }
  }, [fetch_CertificateData, getUserId])

  // Effect to find and open the certificate when selectedCertificateId is provided
  useEffect(() => {
    if (
      !selectedCertificateId ||
      isLoading ||
      hasProcessedSelectedIdRef.current ||
      certificateData.length === 0
    ) {
      return
    }

    const certIdStr = selectedCertificateId.toString()
    const foundCertificate = certificateData.find((c) => c.id === certIdStr)

    if (foundCertificate) {
      handleCardClick(foundCertificate)
      hasProcessedSelectedIdRef.current = true
      return
    }

    console.warn(
      `Certificate with ID ${selectedCertificateId} not found. Refreshing...`
    )
    const userId = getUserId()
    if (userId) {
      fetch_CertificateData(userId).then(() => {
        const refreshedCertificate = certificateData.find(
          (c) => c.id === certIdStr
        )
        if (refreshedCertificate) {

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

  // Helper to toggle filter values
  const toggleFilter = (field: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[field]
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) }
      } else {
        return { ...prev, [field]: [...current, value] }
      }
    })
  }

  // Helper to clear all filters
  const clearAllFilters = () => {
    setFilters({
      status: [],
      certificateType: [],
      level: [],
    })
    setStatusTab("all")
  }

  // Filter certificates
  const filteredCertificates = useMemo(() => {
    const search = searchTerm.toLowerCase()
    return certificateData.filter((cert) => {
      // Search filter
      const matchesSearch =
        cert.certificateType.toLowerCase().includes(search) ||
        cert.japaneseLevel.toLowerCase().includes(search) ||
        (cert.verifiedAt &&
          format(cert.verifiedAt, "MMM yyyy").toLowerCase().includes(search)) ||
        cert.verificationStatus?.toLowerCase().includes(search)

      // Status tab filter
      const matchesStatusTab =
        statusTab === "all" || cert.verificationStatus === statusTab

      // Status filter (from dropdown)
      const matchesStatusFilter =
        filters.status.length === 0 ||
        filters.status.includes(cert.verificationStatus || "")

      // Certificate type filter
      const matchesType =
        filters.certificateType.length === 0 ||
        filters.certificateType.includes(cert.certificateType)

      // Level filter
      const matchesLevel =
        filters.level.length === 0 || filters.level.includes(cert.japaneseLevel)

      return (
        matchesSearch &&
        matchesStatusTab &&
        matchesStatusFilter &&
        matchesType &&
        matchesLevel
      )
    })
  }, [certificateData, searchTerm, statusTab, filters])

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

  // Get count for a specific status tab
  const getStatusTabCount = (status: string) => {
    if (status === "all") return certificateData.length
    return statusCounts[status as keyof typeof statusCounts] || 0
  }

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
        toast.success(" Certificate deleted successfully!")
        await fetch_CertificateData(getUserId() || "")
        setIsDetailDrawerOpen(false)
        setEditingCertificate(null)
      } else {
        toast.error("❌ " + result)
      }
    } catch (error) {
      console.error("❌ Error deleting certificate:", error)
      toast.error("❌ Failed to delete certificate")
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

  return (
    <div className="p-4">
      {/* Tabs and Search - Only show when there are certificates */}
      {hasCertificates && (
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs */}
            <div>
              <Tabs
                value={statusTab}
                onValueChange={(value) => {
                  setStatusTab(value as StatusTab)
                  setSearchTerm("")
                }}
              >
                <TabsList className="h-auto">
                  <TabsTrigger value="all" className="gap-2">
                    All
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 px-1.5 text-xs",
                        statusTab === "all"
                          ? "bg-secondary"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {getStatusTabCount("all")}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="gap-2">
                    Pending
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 px-1.5 text-xs",
                        statusTab === "pending"
                          ? "bg-secondary"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {getStatusTabCount("pending")}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="gap-2">
                    Approved
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 px-1.5 text-xs",
                        statusTab === "approved"
                          ? "bg-secondary"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {getStatusTabCount("approved")}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="gap-2">
                    Rejected
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 px-1.5 text-xs",
                        statusTab === "rejected"
                          ? "bg-secondary"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {getStatusTabCount("rejected")}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Actions - Search, Filter */}
            <div className="flex items-center gap-2">
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

              {/* Filter Dropdown */}
              {hasFilterData && (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="relative h-9 w-9"
                        >
                          <HugeiconsIcon
                            icon={FilterMailIcon}
                            strokeWidth={2}
                            className="h-4 w-4"
                          />
                          {hasActiveFilters && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background bg-red-600" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filter</p>
                    </TooltipContent>
                  </Tooltip>

                  <DropdownMenuContent className="max-h-[80vh] w-60 overflow-y-auto">
                    {/* Status Filter */}
                    {hasStatusData && (
                      <>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            Status
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              {uniqueStatuses.map((status) => (
                                <DropdownMenuCheckboxItem
                                  key={status}
                                  checked={filters.status.includes(status)}
                                  onCheckedChange={() =>
                                    toggleFilter("status", status)
                                  }
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  {statusLabels[
                                    status as keyof typeof statusLabels
                                  ] || status}
                                </DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      </>
                    )}

                    {/* Certificate Type Filter */}
                    {hasCertificateTypeData && (
                      <>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            Certificate Type
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              {uniqueCertificateTypes.map((type) => (
                                <DropdownMenuCheckboxItem
                                  key={type}
                                  checked={filters.certificateType.includes(
                                    type
                                  )}
                                  onCheckedChange={() =>
                                    toggleFilter("certificateType", type)
                                  }
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  {type}
                                </DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      </>
                    )}

                    {/* Level Filter */}
                    {hasLevelData && (
                      <>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Level</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              {uniqueLevels.map((level) => (
                                <DropdownMenuCheckboxItem
                                  key={level}
                                  checked={filters.level.includes(level)}
                                  onCheckedChange={() =>
                                    toggleFilter("level", level)
                                  }
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  {level}
                                </DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      </>
                    )}

                    <DropdownMenuSeparator />

                    {/* Clear Filters Button */}
                    <DropdownMenuItem
                      onClick={clearAllFilters}
                      variant="destructive"
                      className="gap-2"
                    >
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        strokeWidth={2}
                        className="h-4 w-4"
                      />
                      Clear All Filters
                      <DropdownMenuShortcut>
                        <Kbd>Esc</Kbd>
                      </DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

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
              {hasCertificates &&
              (searchTerm || hasActiveFilters || statusTab === "all")
                ? `No Matching ${statusTab === "all" ? "" : `${statusTab}`} Certificates for ${searchTerm}`
                : `No ${statusTab === "all" ? "" : `${statusTab}`} certificates found.`}
            </EmptyTitle>
            <EmptyDescription className="text-center text-pretty">
              {hasCertificates &&
              (searchTerm || hasActiveFilters || statusTab !== "all") ? (
                <>Try adjusting your search or filters.</>
              ) : (
                "Upload your Japanese language certificates to verify your proficiency and complete your profile."
              )}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {(searchTerm || hasActiveFilters || statusTab !== "all") &&
            hasCertificates ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  clearAllFilters()
                  setStatusTab("all")
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
                Upload Certificate
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
