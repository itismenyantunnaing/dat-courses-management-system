/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useState, useRef, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CardContent, Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ListViewIcon,
  GridViewIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
// Import the drawer components
import { ApproveCertificateDrawer } from "@/components/drawers/certificate/approveCertificate-drawer"
import { mainStore } from "@/store/mainStore"

// Types
interface CertificateRequest {
  id: string
  certificateType: string
  japaneseLevel: string
  filePath?: string
  status: "approved" | "pending" | "rejected"
  employee: {
    name: string
    email: string
    avatar?: string
    id: string
    teamName?: string
  }
  submittedDate: string
  employeeId: string
  teamName?: string
  email?: string
}

const STROKE_WIDTH = 2
type ViewMode = "list" | "card"
type StatusTab = "all" | "approved" | "pending" | "rejected"

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

const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <Spinner />
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
}

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950"
    case "pending":
      return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-950"
    case "rejected":
      return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
    default:
      return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-950"
  }
}

const statusLabels = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
}

const BorderedTableCell = ({
  children,
  className = "",
  selected = false,
  ...props
}: React.ComponentProps<typeof TableCell> & { selected?: boolean }) => (
  <TableCell
    className={cn("border-r border-l", selected && "bg-muted/50", className)}
    {...props}
  >
    {children}
  </TableCell>
)

const BorderedTableHead = ({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof TableHead>) => (
  <TableHead className={`border-r border-l ${className}`} {...props}>
    {children}
  </TableHead>
)

// Helper function to get initials
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Certificate Card Component
const CertificateCard = ({
  certificate,
  onClick,
}: {
  certificate: CertificateRequest
  onClick: () => void
}) => {
  const [imageError, setImageError] = useState(false)
  const imageUrl = certificate.filePath || "/placeholder-certificate.png"
  const status = certificate.status || "pending"

  return (
    <Card
      className="group cursor-pointer overflow-hidden pbs-0 transition-all hover:border-primary/50"
      onClick={onClick}
    >
      <div className="relative">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {!imageError ? (
            <img
              src={imageUrl}
              alt={`${certificate.certificateType} - ${certificate.japaneseLevel}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
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
              className={`${getStatusBadge(status)} px-3 py-1 text-xs font-medium tracking-wider uppercase`}
            >
              {status}
            </Badge>
          </div>
        </div>

        {/* Certificate Type with Level */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="line-clamp-1 text-lg leading-tight font-semibold">
              {certificate.certificateType}
            </h3>
            <span className="shrink-0 text-sm text-muted-foreground">
              {certificate.japaneseLevel}
            </span>
          </div>
        </div>

        {/* Employee Information */}
        <div className="border-t px-4 pt-2 pb-4">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={certificate.employee.avatar}
                alt={certificate.employee.name}
              />
              <AvatarFallback className="rounded-lg">
                {getInitials(certificate.employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {certificate.employee.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {certificate.employee.email}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(certificate.submittedDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function CertificatesRequestsContainer() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [statusTab, setStatusTab] = useState<StatusTab>("all")
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("card")

  // State for selected certificate and drawers
  const [selectedCertificate, setSelectedCertificate] =
    useState<CertificateRequest | null>(null)
  const [approveDrawerOpen, setApproveDrawerOpen] = useState(false)
  const [denyDrawerOpen, setDenyDrawerOpen] = useState(false)
  const { fetch_AllCertificates, allCertificates, profile } = mainStore()
  const isApprover = profile?.role?.toLowerCase() === "approver"
  const isAdmin = profile?.role?.toLowerCase() === "admin"

  // Transform allCertificates to CertificateRequest format
  const transformedCertificates: CertificateRequest[] = allCertificates.map(
    (cert) => ({
      id: cert.id,
      certificateType: cert.certificateType,
      japaneseLevel: cert.japaneseLevel,
      filePath: cert.filePath,
      status: cert.verificationStatus as "approved" | "pending" | "rejected",
      employee: {
        name: cert.employeeName || "",
        email: cert.email || "",
        avatar: "",
        id: cert.employeeId || "",
        teamName: cert.teamName,
      },
      submittedDate: cert.createdAt
        ? cert.createdAt.toISOString()
        : new Date().toISOString(),
      employeeId: cert.employeeId || "",
      teamName: cert.teamName,
      email: cert.email,
    })
  )

  // ✅ Get total count (unfiltered by status) - MOVED HERE
  const getTotalCount = () => {
    let filtered = transformedCertificates

    if (isApprover && profile?.team) {
      filtered = filtered.filter((cert) => {
        const certTeam = cert.employee.teamName || cert.teamName || ""
        const approverTeam = profile.team || ""
        return certTeam.toLowerCase() === approverTeam.toLowerCase()
      })
    } else if (!isApprover && !isAdmin) {
      return 0
    }

    return filtered.length
  }

  // ✅ Get counts for each status - MOVED HERE
  const getStatusCount = (status: string) => {
    // Apply same team filtering for counts
    let filtered = transformedCertificates

    if (isApprover && profile?.team) {
      filtered = filtered.filter((cert) => {
        const certTeam = cert.employee.teamName || cert.teamName || ""
        const approverTeam = profile.team || ""
        return certTeam.toLowerCase() === approverTeam.toLowerCase()
      })
    } else if (!isApprover && !isAdmin) {
      return 0
    }

    return filtered.filter((cert) => cert.status === status).length
  }

  // Search input ref for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        await fetch_AllCertificates()
      } catch (err) {
        console.error("Failed to fetch certificate data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [fetch_AllCertificates])

  // Filter certificates based on search term and status tab
  const getFilteredCertificates = () => {
    let filtered = transformedCertificates

    // 🔒 SECURITY: Only show certificates if user is approver and team matches
    // Check if user role is "approver"

    if (isApprover && profile?.team) {
      // Filter certificates where employee's team matches approver's team
      filtered = filtered.filter((cert) => {
        const certTeam = cert.employee.teamName || cert.teamName || ""
        const approverTeam = profile.team || ""
        return certTeam.toLowerCase() === approverTeam.toLowerCase()
      })
    } else if (isAdmin) {
      filtered = transformedCertificates
    } else if (!isApprover) {
      // If not approver, show empty results or you could show all
      // For security, we'll return empty array for non-approvers
      filtered = []
    }

    // Filter by status tab
    if (statusTab !== "all") {
      filtered = filtered.filter((cert) => cert.status === statusTab)
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((cert) => {
        const type = cert.certificateType.toLowerCase()
        const level = cert.japaneseLevel.toLowerCase()
        const name = cert.employee.name.toLowerCase()
        const email = cert.employee.email.toLowerCase()
        const employeeId = cert.employee.id.toLowerCase()
        const teamName = cert.employee.teamName?.toLowerCase() || ""
        const status = cert.status.toLowerCase()

        return (
          type.includes(searchLower) ||
          level.includes(searchLower) ||
          name.includes(searchLower) ||
          email.includes(searchLower) ||
          employeeId.includes(searchLower) ||
          teamName.includes(searchLower) ||
          status.includes(searchLower)
        )
      })
    }

    return filtered
  }

  const filteredCertificates = getFilteredCertificates()
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCertificates = filteredCertificates.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  // Handle card/row click - opens the appropriate drawer
  const handleCertificateClick = (certificate: CertificateRequest) => {
    setSelectedCertificate(certificate)

    // If pending, open approve drawer (which has both approve and deny buttons)
    if (certificate.status === "pending") {
      setApproveDrawerOpen(true)
    } else {
      // For approved/rejected, you might want to show a view-only drawer
      // For now, we'll just show approve drawer but you can customize
      setApproveDrawerOpen(true)
    }
  }

  // Handle approve success
  const handleApproveSuccess = async (id: string, remark: string) => {
    console.log("✅ Approved certificate:", id, remark)
    // Refetch all certificates
    await fetch_AllCertificates()
    setApproveDrawerOpen(false)
    setSelectedCertificate(null)
  }

  // Handle deny success
  const handleDenySuccess = async (id: string, remark: string) => {
    console.log("❌ Denied certificate:", id, remark)
    // Refetch all certificates
    await fetch_AllCertificates()
    setDenyDrawerOpen(false)
    setSelectedCertificate(null)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))

  const getPageNumbers = (totalPages: number, currentPage: number) => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i)
      pages.push("...")
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1)
      pages.push("...")
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push("...")
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  // Column headers
  const certificateHeaders = [
    { field: "sr", header_name: "Sr." },
    { field: "employee", header_name: "Employee" },
    { field: "certificate_type", header_name: "Certificate Type" },
    { field: "level", header_name: "Level" },
    { field: "status", header_name: "Status" },
    { field: "submitted_date", header_name: "Submitted Date" },
  ]

  const totalColumns = certificateHeaders.length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner text="Loading certificate requests..." />
        </div>
      </div>
    )
  }

  // If not approver, show access denied message
  if (!isApprover && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 text-6xl">🔒</div>
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">
            You don't have permission to view certificate requests.
          </p>
          <p className="text-sm text-muted-foreground">
            This page is only accessible to Approvers.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 pt-4 pb-6">
        <CardContent className="px-0">
          {/* Tabs and Search Bar */}
          <div className="mb-8 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs */}
            <div>
              <Tabs
                value={statusTab}
                onValueChange={(value) => {
                  setStatusTab(value as StatusTab)
                  setCurrentPage(1)
                }}
              >
                <TabsList className="h-auto">
                  <TabsTrigger value="all" className="gap-2">
                    All
                    <Badge
                      variant="secondary"
                      className={cn(
                        "ml-1 h-5 px-1.5 text-xs",
                        statusTab === "all"
                          ? "bg-secondary"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {getTotalCount()}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="gap-2">
                    Pending
                    <Badge
                      variant="secondary"
                      className={cn(
                        "ml-1 h-5 px-1.5 text-xs",
                        statusTab === "pending"
                          ? "bg-secondary"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {getStatusCount("pending")}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="gap-2">
                    Approved
                    <Badge
                      variant="secondary"
                      className={cn(
                        "ml-1 h-5 px-1.5 text-xs",
                        statusTab === "approved"
                          ? "bg-secondary"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {getStatusCount("approved")}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="gap-2">
                    Rejected
                    <Badge
                      variant="secondary"
                      className={cn(
                        "ml-1 h-5 px-1.5 text-xs",
                        statusTab === "rejected"
                          ? "bg-secondary"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {getStatusCount("rejected")}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Actions - Search, View Toggle */}
            <div className="flex items-center gap-1.5">
              <InputGroup className="w-[300px]">
                <InputGroupInput
                  ref={searchInputRef}
                  placeholder="Search certificate requests..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                />
                <InputGroupAddon>
                  <HugeiconsIcon
                    icon={Search01Icon}
                    strokeWidth={2}
                    className="h-4 w-4 text-muted-foreground"
                  />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <Kbd>Ctrl + K</Kbd>
                </InputGroupAddon>
              </InputGroup>

              {/* View Mode Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className="h-9 w-9"
                  >
                    <HugeiconsIcon
                      icon={ListViewIcon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>List View</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "card" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("card")}
                    className="h-9 w-9"
                  >
                    <HugeiconsIcon
                      icon={GridViewIcon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Card View</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Content */}
          {viewMode === "list" ? (
            // Table View
            <div className="relative mx-4 overflow-x-auto rounded-md border-y">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {certificateHeaders.map((header) => (
                      <BorderedTableHead
                        key={header.field}
                        className="align-middle whitespace-nowrap"
                      >
                        {header.header_name}
                      </BorderedTableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedCertificates.length === 0 ? (
                    <TableRow>
                      <BorderedTableCell
                        colSpan={totalColumns}
                        className="py-8 text-center text-muted-foreground"
                      >
                        {searchTerm ? (
                          <>
                            No certificate requests found matching "{searchTerm}
                            "
                          </>
                        ) : statusTab !== "all" ? (
                          <>No {statusTab} certificate requests found</>
                        ) : (
                          "No certificate requests found"
                        )}
                      </BorderedTableCell>
                    </TableRow>
                  ) : (
                    paginatedCertificates.map((certificate, index) => (
                      <TableRow
                        key={certificate.id}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => handleCertificateClick(certificate)}
                      >
                        <BorderedTableCell>
                          {startIndex + index + 1}
                        </BorderedTableCell>
                        <BorderedTableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 rounded-lg">
                              <AvatarImage
                                src={certificate.employee.avatar}
                                alt={certificate.employee.name}
                              />
                              <AvatarFallback className="rounded-lg text-xs">
                                {getInitials(certificate.employee.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {certificate.employee.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {certificate.employee.email}
                              </div>
                            </div>
                          </div>
                        </BorderedTableCell>
                        <BorderedTableCell>
                          {certificate.certificateType}
                        </BorderedTableCell>
                        <BorderedTableCell>
                          {certificate.japaneseLevel}
                        </BorderedTableCell>
                        <BorderedTableCell>
                          <Badge className={getStatusBadge(certificate.status)}>
                            {statusLabels[certificate.status]}
                          </Badge>
                        </BorderedTableCell>
                        <BorderedTableCell>
                          {new Date(
                            certificate.submittedDate
                          ).toLocaleDateString()}
                        </BorderedTableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            // Card View
            <div className="mx-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedCertificates.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-muted-foreground">
                    {searchTerm ? (
                      <>No certificate requests found matching "{searchTerm}"</>
                    ) : statusTab !== "all" ? (
                      <>No {statusTab} certificate requests found</>
                    ) : (
                      "No certificate requests found"
                    )}
                  </div>
                ) : (
                  paginatedCertificates.map((certificate) => (
                    <CertificateCard
                      key={certificate.id}
                      certificate={certificate}
                      onClick={() => handleCertificateClick(certificate)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {filteredCertificates.length > 0 && (
            <div className="mt-4 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
              <Field orientation="horizontal" className="w-fit">
                <FieldLabel htmlFor="select-rows-per-page">
                  Rows per page
                </FieldLabel>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={handleItemsPerPageChange}
                >
                  <SelectTrigger className="w-15" id="select-rows-per-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectGroup>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <div className="text-sm text-muted-foreground">
                Showing {filteredCertificates.length === 0 ? 0 : startIndex + 1}{" "}
                to{" "}
                {Math.min(
                  startIndex + itemsPerPage,
                  filteredCertificates.length
                )}{" "}
                of {filteredCertificates.length} certificate requests
              </div>
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handlePrevious()
                      }}
                      className={
                        currentPage === 1 || filteredCertificates.length === 0
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  {getPageNumbers(totalPages, currentPage).map(
                    (page, index) => (
                      <PaginationItem key={index}>
                        {page === "..." ? (
                          <span className="px-2">...</span>
                        ) : (
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={(e) => {
                              e.preventDefault()
                              setCurrentPage(page as number)
                            }}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handleNext()
                      }}
                      className={
                        currentPage === totalPages ||
                        filteredCertificates.length === 0
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </div>

      {/* Approve Certificate Drawer */}
      <ApproveCertificateDrawer
        open={approveDrawerOpen}
        onOpenChange={setApproveDrawerOpen}
        certificate={selectedCertificate as any}
        onApprove={handleApproveSuccess}
        onDeny={() => {
          // Close approve drawer and open deny drawer
          setApproveDrawerOpen(false)
          setDenyDrawerOpen(true)
        }}
      />
    </>
  )
}
