/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useState, useRef, useEffect, useMemo } from "react"
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ListViewIcon,
  GridViewIcon,
  Loading03Icon,
  Certificate01Icon,
  FilterMailIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
// Import the drawer components
import { ApproveCertificateDrawer } from "@/components/drawers/certificate/approveCertificate-drawer"
import { CertificateCard } from "@/components/cards/certificate-card"
import { mainStore } from "@/store/mainStore"
import { JapaneseCertificate } from "@/types/certificate"
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
    departmentName?: string
    divisionName?: string
  }
  submittedDate: string
  employeeId: string
  teamName?: string
  departmentName?: string
  divisionName?: string
  email?: string
}

interface CertificatesRequestsContainerProps {
  selectedCertificateId?: string | number | null
}

const STROKE_WIDTH = 2
type ViewMode = "list" | "card"
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

// Transform CertificateRequest to JapaneseCertificate for the shared card
const transformToCertificate = (
  cert: CertificateRequest
): JapaneseCertificate => {
  return {
    id: cert.id,
    certificateType: cert.certificateType,
    japaneseLevel: cert.japaneseLevel,
    filePath: cert.filePath,
    verificationStatus: cert.status,
    remark: "",
    verifiedAt: cert.status !== "pending" ? new Date() : undefined,
    verifiedByEmployeeName: "",
    employee: {
      name: cert.employee.name,
      email: cert.employee.email,
      avatar: cert.employee.avatar,
    },
    createdAt: new Date(cert.submittedDate),
    employeeName: cert.employee.name,
    email: cert.employee.email,
    employeeId: cert.employee.id,
    teamName: cert.teamName,
  } as JapaneseCertificate
}

export function CertificatesRequestsContainer({
  selectedCertificateId,
}: CertificatesRequestsContainerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [statusTab, setStatusTab] = useState<StatusTab>("all")
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("card")

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    certificateType: [],
    level: [],
  })

  // State for selected certificate and drawers
  const [selectedCertificate, setSelectedCertificate] =
    useState<CertificateRequest | null>(null)
  const [approveDrawerOpen, setApproveDrawerOpen] = useState(false)
  const [denyDrawerOpen, setDenyDrawerOpen] = useState(false)
  const { fetch_AllCertificates, allCertificates, profile } = mainStore()

  // Determine user role
  const userRole = profile?.role?.toLowerCase() || ""
  const isApprover = userRole === "approver"
  const isDepartmentHead = userRole === "department_head"
  const isDivisionHead = userRole === "division_head"
  const isAdmin = userRole === "admin"

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    (filterArray) => filterArray.length > 0
  )

  // Transform allCertificates to CertificateRequest format
  const transformedCertificates: CertificateRequest[] = allCertificates.map(
    (cert: any) => ({
      id: cert.id,
      certificateType: cert.certificateType,
      japaneseLevel: cert.japaneseLevel,
      filePath: cert.filePath,
      status: cert.verificationStatus as "approved" | "pending" | "rejected",
      employee: {
        name: cert.employeeName || "",
        email: cert.email || "",
        avatar: cert.profilePhotoPath || "",
        id: cert.employeeId || "",
        teamName: cert.teamName,
        departmentName: cert.departmentName,
        divisionName: cert.divisionName,
      },
      submittedDate: cert.createdAt
        ? cert.createdAt.toISOString()
        : new Date().toISOString(),
      employeeId: cert.employeeId || "",
      teamName: cert.teamName,
      departmentName: cert.departmentName,
      divisionName: cert.divisionName,
      email: cert.email,
    })
  )

  // Get unique certificate types, levels, and statuses for filter dropdown
  const uniqueCertificateTypes = useMemo(() => {
    const types = new Set<string>()
    transformedCertificates.forEach((cert) => {
      if (cert.certificateType) {
        types.add(cert.certificateType)
      }
    })
    return Array.from(types).sort()
  }, [transformedCertificates])

  const uniqueLevels = useMemo(() => {
    const levels = new Set<string>()
    transformedCertificates.forEach((cert) => {
      if (cert.japaneseLevel) {
        levels.add(cert.japaneseLevel)
      }
    })
    return Array.from(levels).sort()
  }, [transformedCertificates])

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>()
    transformedCertificates.forEach((cert) => {
      if (cert.status) {
        statuses.add(cert.status)
      }
    })
    return Array.from(statuses).sort()
  }, [transformedCertificates])

  const hasCertificateTypeData = uniqueCertificateTypes.length > 0
  const hasLevelData = uniqueLevels.length > 0
  const hasStatusData = uniqueStatuses.length > 0
  const hasFilterData = hasCertificateTypeData || hasLevelData || hasStatusData

  // ✅ Get total count (unfiltered by status)
  const getTotalCount = () => {
    let filtered = transformedCertificates

    // Filter by role
    if (isApprover && profile?.team) {
      filtered = filtered.filter((cert) => {
        const certTeam = cert.employee.teamName || cert.teamName || ""
        const approverTeam = profile.team || ""
        return certTeam.toLowerCase() === approverTeam.toLowerCase()
      })
    } else if (isDepartmentHead && profile?.deptDat) {
      filtered = filtered.filter((cert) => {
        const certDept =
          cert.employee.departmentName || cert.departmentName || ""
        const deptHeadDept = profile.deptDat || ""
        return certDept.toLowerCase() === deptHeadDept.toLowerCase()
      })
    } else if (isDivisionHead && profile?.divName) {
      filtered = filtered.filter((cert) => {
        const certDivision =
          cert.employee.divisionName || cert.divisionName || ""
        const divisionHeadDivision = profile.divName || ""
        return certDivision.toLowerCase() === divisionHeadDivision.toLowerCase()
      })
    } else if (
      !isAdmin &&
      !isApprover &&
      !isDepartmentHead &&
      !isDivisionHead
    ) {
      return 0
    }

    return filtered.length
  }

  // ✅ Get counts for each status
  const getStatusCount = (status: string) => {
    let filtered = transformedCertificates

    // Filter by role
    if (isApprover && profile?.team) {
      filtered = filtered.filter((cert) => {
        const certTeam = cert.employee.teamName || cert.teamName || ""
        const approverTeam = profile.team || ""
        return certTeam.toLowerCase() === approverTeam.toLowerCase()
      })
    } else if (isDepartmentHead && profile?.deptDat) {
      filtered = filtered.filter((cert) => {
        const certDept =
          cert.employee.departmentName || cert.departmentName || ""
        const deptHeadDept = profile.deptDat || ""
        return certDept.toLowerCase() === deptHeadDept.toLowerCase()
      })
    } else if (isDivisionHead && profile?.divName) {
      filtered = filtered.filter((cert) => {
        const certDivision =
          cert.employee.divisionName || cert.divisionName || ""
        const divisionHeadDivision = profile.divName || ""
        return certDivision.toLowerCase() === divisionHeadDivision.toLowerCase()
      })
    } else if (
      !isAdmin &&
      !isApprover &&
      !isDepartmentHead &&
      !isDivisionHead
    ) {
      return 0
    }

    return filtered.filter((cert) => cert.status === status).length
  }

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
    setCurrentPage(1)
  }

  // Helper to clear all filters
  const clearAllFilters = () => {
    setFilters({
      status: [],
      certificateType: [],
      level: [],
    })
    setStatusTab("all")
    setCurrentPage(1)
  }

  // Search input ref for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null)
  const hasProcessedSelectedIdRef = useRef(false)

  // Reset processed flag when selectedCertificateId changes
  useEffect(() => {
    if (selectedCertificateId) {
      hasProcessedSelectedIdRef.current = false
    }
  }, [selectedCertificateId])

  // Effect to find and open the certificate when selectedCertificateId is provided
  useEffect(() => {
    if (
      !selectedCertificateId ||
      isLoading ||
      hasProcessedSelectedIdRef.current ||
      transformedCertificates.length === 0
    ) {
      return
    }

    const certIdStr = selectedCertificateId.toString()
    const foundCertificate = transformedCertificates.find(
      (c) => c.id === certIdStr
    )

    if (foundCertificate) {
      handleCertificateClick(foundCertificate)
      hasProcessedSelectedIdRef.current = true
      return
    }

    console.warn(
      `Certificate with ID ${selectedCertificateId} not found. Refreshing...`
    )
    fetch_AllCertificates().then(() => {
      const refreshedCertificate = transformedCertificates.find(
        (c) => c.id === certIdStr
      )
      if (refreshedCertificate) {
        handleCertificateClick(refreshedCertificate)
      }
      hasProcessedSelectedIdRef.current = true
    })
  }, [
    selectedCertificateId,
    transformedCertificates,
    isLoading,
    fetch_AllCertificates,
  ])

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

  // Filter certificates based on search term, status tab, and filters
  const getFilteredCertificates = () => {
    let filtered = transformedCertificates

    // Filter by role
    if (isApprover && profile?.team) {
      filtered = filtered.filter((cert) => {
        const certTeam = cert.employee.teamName || cert.teamName || ""
        const approverTeam = profile.team || ""
        return certTeam.toLowerCase() === approverTeam.toLowerCase()
      })
    } else if (isDepartmentHead && profile?.deptDat) {
      filtered = filtered.filter((cert) => {
        const certDept =
          cert.employee.departmentName || cert.departmentName || ""
        const deptHeadDept = profile.deptDat || ""
        return certDept.toLowerCase() === deptHeadDept.toLowerCase()
      })
    } else if (isDivisionHead && profile?.divName) {
      filtered = filtered.filter((cert) => {
        const certDivision =
          cert.employee.divisionName || cert.divisionName || ""
        const divisionHeadDivision = profile.divName || ""
        return certDivision.toLowerCase() === divisionHeadDivision.toLowerCase()
      })
    } else if (isAdmin) {
      // Admin sees all
      filtered = transformedCertificates
    } else {
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
        const departmentName = cert.employee.departmentName?.toLowerCase() || ""
        const divisionName = cert.employee.divisionName?.toLowerCase() || ""
        const status = cert.status.toLowerCase()

        return (
          type.includes(searchLower) ||
          level.includes(searchLower) ||
          name.includes(searchLower) ||
          email.includes(searchLower) ||
          employeeId.includes(searchLower) ||
          teamName.includes(searchLower) ||
          departmentName.includes(searchLower) ||
          divisionName.includes(searchLower) ||
          status.includes(searchLower)
        )
      })
    }

    // Apply status filter (from dropdown)
    if (filters.status.length > 0) {
      filtered = filtered.filter((cert) => filters.status.includes(cert.status))
    }

    // Apply certificate type filter
    if (filters.certificateType.length > 0) {
      filtered = filtered.filter((cert) =>
        filters.certificateType.includes(cert.certificateType)
      )
    }

    // Apply level filter
    if (filters.level.length > 0) {
      filtered = filtered.filter((cert) =>
        filters.level.includes(cert.japaneseLevel)
      )
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
    setApproveDrawerOpen(true)
  }

  // Handle approve success
  const handleApproveSuccess = async (id: string, remark: string) => {
    await fetch_AllCertificates()
    setApproveDrawerOpen(false)
    setSelectedCertificate(null)
  }

  // Handle deny success
  const handleDenySuccess = async (id: string, remark: string) => {
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

  const certificateHeaders = [
    { field: "sr", header_name: "Sr." },
    { field: "employee", header_name: "Employee" },
    { field: "certificate_type", header_name: "Certificate Type" },
    { field: "level", header_name: "Level" },
    { field: "status", header_name: "Status" },
    { field: "submitted_date", header_name: "Submitted Date" },
  ]

  const totalColumns = certificateHeaders.length

  // Check if there are any certificates at all
  const hasAnyCertificates = transformedCertificates.length > 0

  // Get role-based access message
  const getAccessDeniedMessage = () => {
    if (isApprover) {
      return `You can only view certificate requests from your team: ${profile?.team || "No team assigned"}`
    }
    if (isDepartmentHead) {
      return `You can only view certificate requests from your department: ${profile?.deptDat || "No department assigned"}`
    }
    if (isDivisionHead) {
      return `You can only view certificate requests from your division: ${profile?.division || "No division assigned"}`
    }
    return "You don't have permission to view certificate requests."
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner text="Loading certificate requests..." />
        </div>
      </div>
    )
  }

  if (!isAdmin && !isApprover && !isDepartmentHead && !isDivisionHead) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 text-6xl">🔒</div>
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">
            You don't have permission to view certificate requests.
          </p>
          <p className="text-sm text-muted-foreground">
            This page is only accessible to Admins, Approvers, Department Heads,
            and Division Heads.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 pt-4 pb-6">
        <CardContent className="px-0">
          {/* Tabs and Search - Only show when there are certificates */}
          {hasAnyCertificates && (
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
                          "h-5 px-1.5 text-xs",
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
                          "h-5 px-1.5 text-xs",
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
                          "h-5 px-1.5 text-xs",
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
                          "h-5 px-1.5 text-xs",
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

              {/* Actions - Search, View Toggle, Filter */}
              <div className="flex items-center gap-1.5">
                <InputGroup className="w-[300px]">
                  <InputGroupInput
                    ref={searchInputRef}
                    placeholder="Search requested certificates..."
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
                            <DropdownMenuSubTrigger>
                              Level
                            </DropdownMenuSubTrigger>
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
              </div>
            </div>
          )}

          {/* Content */}
          {filteredCertificates.length > 0 ? (
            <>
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
                      {paginatedCertificates.map((certificate, index) => (
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
                            <Badge
                              className={getStatusBadge(certificate.status)}
                            >
                              {statusLabels[certificate.status]}
                            </Badge>
                          </BorderedTableCell>
                          <BorderedTableCell>
                            {new Date(
                              certificate.submittedDate
                            ).toLocaleDateString()}
                          </BorderedTableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                // Card View - Using shared CertificateCard component
                <div className="mx-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {paginatedCertificates.map((certificate, index) => (
                      <CertificateCard
                        key={index}
                        certificate={transformToCertificate(certificate)}
                        onEdit={() => handleCertificateClick(certificate)}
                        showEmployeeInfo={true}
                      />
                    ))}
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
                    Showing{" "}
                    {filteredCertificates.length === 0 ? 0 : startIndex + 1} to{" "}
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
                            currentPage === 1 ||
                            filteredCertificates.length === 0
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
            </>
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
                  {hasAnyCertificates &&
                  (searchTerm || hasActiveFilters || statusTab === "all")
                    ? `No Matching ${statusTab === "all" ? "" : `${statusTab}`} Certificates for ${searchTerm}`
                    : `No ${statusTab === "all" ? "" : `${statusTab}`} certificates found.`}
                </EmptyTitle>
                <EmptyDescription className="text-center text-pretty">
                  {hasAnyCertificates &&
                  (searchTerm || hasActiveFilters || statusTab !== "all") ? (
                    <>Try adjusting your search or filters.</>
                  ) : (
                    "Pending learner submissions for Japanese certificates will appear here."
                  )}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {(searchTerm || hasActiveFilters || statusTab !== "all") &&
                hasAnyCertificates ? (
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
                ) : null}
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </div>

      {/* Approve Certificate Drawer */}
      <ApproveCertificateDrawer
        open={approveDrawerOpen}
        onOpenChange={setApproveDrawerOpen}
        certificate={selectedCertificate as any}
        onApprove={handleApproveSuccess}
        onDeny={handleDenySuccess}
      />
    </>
  )
}
