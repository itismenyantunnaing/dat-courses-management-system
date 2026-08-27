"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Delete02Icon,
  Cancel01Icon,
  FilterMailIcon,
  SortByDown01Icon,
  SortByUp01Icon,
  RefreshIcon,
  MonitorDotIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { cn, resolveUploadUrl } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuShortcut,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "./ui/dropdown-menu"
import { AuditLogDetailsDrawer } from "./drawers/auditLogs/auditLogDetails-drawer"
import { mainStore } from "@/store/mainStore"

// Types - Updated to match API response
interface AuditLog {
  id: number
  employeeId: string
  employeeName: string | null
  employeeRole: string | null
  employeeProfilePhotoPath: string | null
  action: string
  module: string
  oldValue: string | null
  newValue: string | null
  description: string
  ipAddress: string
  createdAt: string
}

// Filter state type
type FilterState = {
  action: string[]
  module: string[]
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

// Bordered Table Cell component
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
const getInitials = (name: string | null) => {
  if (!name) return "U"
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"
  )
}

export function AuditLogsContainer() {
  // Get store functions and state
  const {
    auditLogs: storeAuditLogs,
    pagination,
    isLoading,
    fetch_AuditLogsWithFilters,
    delete_AuditLog,
    delete_BulkAuditLogs,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
    clearFilters,
  } = mainStore()

  // Local state for UI
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FilterState>({
    action: [],
    module: [],
  })
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [logToDelete, setLogToDelete] = useState<AuditLog | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

  // Sync store data with local state
  useEffect(() => {
    if (storeAuditLogs && storeAuditLogs.length > 0) {
      setAuditLogs(storeAuditLogs)
    }
  }, [storeAuditLogs])

  // Initial fetch
  useEffect(() => {
    fetch_AuditLogsWithFilters(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      0,
      20
    )
  }, [])

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    (filterArray) => filterArray.length > 0
  )

  // Get unique action values from audit logs
  const uniqueActions = useMemo(() => {
    const actions = new Set<string>()
    auditLogs.forEach((log) => {
      if (log.action) {
        actions.add(log.action)
      }
    })
    return Array.from(actions).sort()
  }, [auditLogs])

  // Get unique module values from audit logs
  const uniqueModules = useMemo(() => {
    const modules = new Set<string>()
    auditLogs.forEach((log) => {
      if (log.module) {
        modules.add(log.module)
      }
    })
    return Array.from(modules).sort()
  }, [auditLogs])

  // Check if there's any filter data available
  const hasActionData = uniqueActions.length > 0
  const hasModuleData = uniqueModules.length > 0
  const hasFilterData = hasActionData || hasModuleData

  // Keyboard shortcut for search focus
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

  // Sort data
  const sortData = (data: AuditLog[]) => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()

      if (sortOrder === "desc") {
        return dateB - dateA
      } else {
        return dateA - dateB
      }
    })
  }

  // Filter data
  const getFilteredData = () => {
    let data = auditLogs

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      data = data.filter(
        (log) =>
          log.employeeName?.toLowerCase().includes(searchLower) ||
          log.employeeId?.toLowerCase().includes(searchLower) ||
          log.action?.toLowerCase().includes(searchLower) ||
          log.module?.toLowerCase().includes(searchLower) ||
          log.ipAddress?.includes(searchLower) ||
          log.description?.toLowerCase().includes(searchLower)
      )
    }

    // Apply action filter
    if (filters.action.length > 0) {
      data = data.filter((log) => filters.action.includes(log.action))
    }

    // Apply module filter
    if (filters.module.length > 0) {
      data = data.filter((log) => filters.module.includes(log.module))
    }

    return sortData(data)
  }

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
    // Reset to first page when sorting changes
    if (pagination.currentPage !== 0) {
      goToPage(0)
    }
  }

  const filteredData = getFilteredData()
  const totalPages = Math.ceil(filteredData.length / pagination.pageSize)
  const startIndex = pagination.currentPage * pagination.pageSize
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + pagination.pageSize
  )

  // Check if there is any data to display
  const hasData = filteredData.length > 0
  const hasAnyLogs = auditLogs.length > 0

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    const newSize = Number(value)
    setPageSize(newSize)
  }

  const handlePrevious = async () => {
    await prevPage()
  }

  const handleNext = async () => {
    await nextPage()
  }

  const handleGoToPage = async (page: number) => {
    await goToPage(page - 1) // Convert 1-based to 0-based
  }

  // Handle select all - selects ALL filtered logs, not just current page
  const handleSelectAll = () => {
    const allSelected = filteredData.every(
      (log) => rowSelection[log.id.toString()]
    )

    if (allSelected) {
      setRowSelection({})
    } else {
      const newSelection: Record<string, boolean> = {}
      filteredData.forEach((log) => {
        newSelection[log.id.toString()] = true
      })
      setRowSelection(newSelection)
    }
  }

  // Handle individual row selection
  const handleRowSelect = (logId: string) => {
    setRowSelection((prev) => ({
      ...prev,
      [logId]: !prev[logId],
    }))
  }

  // Handle row click for details
  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log)
    setDetailsDrawerOpen(true)
  }

  // Get selected logs count
  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  // Get selected logs list
  const getSelectedLogs = () => {
    const selectedIds = Object.entries(rowSelection)
      .filter(([, selected]) => selected)
      .map(([id]) => Number(id))
    return auditLogs.filter((log) => selectedIds.includes(log.id))
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
    // Reset to first page when filtering
    if (pagination.currentPage !== 0) {
      goToPage(0)
    }
  }

  // Helper to clear all filters
  const clearAllFilters = async () => {
    setFilters({
      action: [],
      module: [],
    })
    setSearchTerm("") // Also clear search when clearing filters
    // Reset to first page
    if (pagination.currentPage !== 0) {
      goToPage(0)
    }
    await clearFilters()
  }

  // Handle bulk delete
  const handleBulkDelete = () => {
    const selectedLogs = getSelectedLogs()
    if (selectedLogs.length === 0) return
    setBulkDeleteDialogOpen(true)
  }

  // Handle individual delete
  const handleIndividualDelete = (log: AuditLog) => {
    setLogToDelete(log)
    setDeleteDialogOpen(true)
  }

  // Confirm individual delete
  const confirmIndividualDelete = async () => {
    if (!logToDelete) return
    setIsDeleting(true)
    try {
      await delete_AuditLog(logToDelete.id)
      setAuditLogs((prev) => prev.filter((log) => log.id !== logToDelete.id))
      setDeleteDialogOpen(false)
      setLogToDelete(null)
      // Clear selection for deleted item
      setRowSelection((prev) => {
        const newSelection = { ...prev }
        delete newSelection[logToDelete.id.toString()]
        return newSelection
      })
      await fetch_AuditLogsWithFilters(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        pagination.currentPage,
        pagination.pageSize
      )
    } catch (error) {
      console.error("Failed to delete log:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    const selectedIds = Object.entries(rowSelection)
      .filter(([, selected]) => selected)
      .map(([id]) => Number(id))

    setIsDeleting(true)
    try {
      await delete_BulkAuditLogs(selectedIds)
      setAuditLogs((prev) =>
        prev.filter((log) => !selectedIds.includes(log.id))
      )
      setRowSelection({})
      setBulkDeleteDialogOpen(false)
      await fetch_AuditLogsWithFilters(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        pagination.currentPage,
        pagination.pageSize
      )
    } catch (error) {
      console.error("Failed to delete logs:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Clear all selections
  const handleClearSelection = () => {
    setRowSelection({})
  }

  // Get page numbers for pagination
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

  // Determine if selection bar is active
  const isSelectionActive = selectedCount > 0

  // Check if all filtered logs are selected (for the checkbox state)
  const areAllFilteredSelected =
    filteredData.length > 0 &&
    filteredData.every((log) => rowSelection[log.id.toString()])

  // Get action badge color
  const getActionBadge = (action: string) => {
    switch (action?.toUpperCase()) {
      case "CREATE":
        return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
      case "UPDATE":
        return "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
      case "DELETE":
        return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
      default:
        return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300"
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Handle refresh
  const handleRefresh = async () => {
    await fetch_AuditLogsWithFilters(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      pagination.currentPage,
      pagination.pageSize
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner text="Loading audit logs..." />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 pt-4 pb-6">
        <CardContent className="px-0">
          {/* Header and Search Bar - Only show when there are logs */}
          {hasAnyLogs && (
            <div className="mb-6 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
              <InputGroup className="max-w-sm">
                <InputGroupInput
                  ref={searchInputRef}
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    // Reset to first page when searching
                    if (pagination.currentPage !== 0) {
                      goToPage(0)
                    }
                  }}
                  disabled={isLoading}
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

              <div className="flex items-center gap-1.5">
                {/* Refresh Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={handleRefresh}
                      disabled={isLoading}
                    >
                      <HugeiconsIcon
                        icon={RefreshIcon}
                        strokeWidth={2}
                        className={cn("h-4 w-4", isLoading && "animate-spin")}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh</p>
                  </TooltipContent>
                </Tooltip>

                {/* Sort Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={toggleSortOrder}
                    >
                      <HugeiconsIcon
                        icon={
                          sortOrder === "desc"
                            ? SortByDown01Icon
                            : SortByUp01Icon
                        }
                        strokeWidth={2}
                        className="h-4 w-4"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {sortOrder === "desc" ? "Newest First" : "Oldest First"}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Filter Dropdown - Only show when there's filter data */}
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
                      {/* Action Filter - Only show if there are actions */}
                      {hasActionData && (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              Action
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                {uniqueActions.map((action) => (
                                  <DropdownMenuCheckboxItem
                                    key={action}
                                    checked={filters.action.includes(action)}
                                    onCheckedChange={() =>
                                      toggleFilter("action", action)
                                    }
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    {action}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                        </>
                      )}

                      {/* Module Filter - Only show if there are modules */}
                      {hasModuleData && (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              Module
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                {uniqueModules.map((module) => (
                                  <DropdownMenuCheckboxItem
                                    key={module}
                                    checked={filters.module.includes(module)}
                                    onCheckedChange={() =>
                                      toggleFilter("module", module)
                                    }
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    {module[0].toUpperCase() +
                                      module.slice(1).toLowerCase()}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>

                          <DropdownMenuSeparator />
                        </>
                      )}
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

          {/* Table - Only show when there's data */}
          {hasData ? (
            <>
              <div
                className="relative mx-4 overflow-x-auto rounded-md border"
                style={{ zIndex: 1 }}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <BorderedTableHead className="w-auto min-w-[32px] align-middle whitespace-nowrap">
                        <Checkbox
                          checked={areAllFilteredSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                          disabled={isLoading || filteredData.length === 0}
                        />
                      </BorderedTableHead>
                      <BorderedTableHead className="align-middle whitespace-nowrap">
                        No
                      </BorderedTableHead>
                      <BorderedTableHead className="align-middle whitespace-nowrap">
                        Employee
                      </BorderedTableHead>
                      <BorderedTableHead className="align-middle whitespace-nowrap">
                        Action
                      </BorderedTableHead>
                      <BorderedTableHead className="align-middle whitespace-nowrap">
                        Description
                      </BorderedTableHead>
                      <BorderedTableHead className="align-middle whitespace-nowrap">
                        Module
                      </BorderedTableHead>
                      <BorderedTableHead className="align-middle whitespace-nowrap">
                        Old Value
                      </BorderedTableHead>
                      <BorderedTableHead className="align-middle whitespace-nowrap">
                        New Value
                      </BorderedTableHead>
                      <BorderedTableHead className="align-middle whitespace-nowrap">
                        IP Address
                      </BorderedTableHead>
                      <BorderedTableHead className="align-middle whitespace-nowrap">
                        Timestamp
                      </BorderedTableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedData.map((log, index) => {
                      const isSelected = !!rowSelection[log.id.toString()]
                      return (
                        <TableRow
                          key={log.id}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-muted/50",
                            isSelected && "bg-muted/50"
                          )}
                          onClick={() => handleRowClick(log)}
                        >
                          <BorderedTableCell
                            className="w-10"
                            selected={isSelected}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                handleRowSelect(log.id.toString())
                              }
                              aria-label={`Select log ${log.id}`}
                            />
                          </BorderedTableCell>
                          <BorderedTableCell
                            className="font-mono text-sm"
                            selected={isSelected}
                          >
                            {startIndex + index + 1}
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 rounded-full">
                                <AvatarImage
                                    src={
                                        resolveUploadUrl(log.employeeProfilePhotoPath) ||
                                        "/avatars/default.jpg"
                                    }
                                    alt={log.employeeName || ""}
                                />
                                <AvatarFallback className="rounded-full text-xs">
                                  {getInitials(log.employeeName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium">
                                  {log.employeeName || "Unknown User"}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-muted-foreground">
                                    {log.employeeId}
                                  </span>
                                  {log.employeeRole && (
                                    <>
                                      <span className="text-xs text-muted-foreground">
                                        ·
                                      </span>
                                      <span className="text-xs">
                                        {log.employeeRole}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            <Badge className={getActionBadge(log.action)}>
                              {log.action}
                            </Badge>
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            <div className="truncate text-sm">
                              {log.description}
                            </div>
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            <Badge variant="outline" className="text-xs">
                              {log.module}
                            </Badge>
                          </BorderedTableCell>
                          <BorderedTableCell
                            className="max-w-[150px] truncate font-mono text-xs"
                            selected={isSelected}
                          >
                            {log.oldValue || "-"}
                          </BorderedTableCell>
                          <BorderedTableCell
                            className="max-w-[150px] truncate font-mono text-xs"
                            selected={isSelected}
                          >
                            {log.newValue || "-"}
                          </BorderedTableCell>
                          <BorderedTableCell
                            className="font-mono text-xs"
                            selected={isSelected}
                          >
                            {log.ipAddress}
                          </BorderedTableCell>
                          <BorderedTableCell
                            className="text-sm"
                            selected={isSelected}
                          >
                            {formatDate(log.createdAt)}
                          </BorderedTableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Selection Bar */}
              {isSelectionActive && (
                <div className="fixed top-5 left-1/2 z-50 w-auto max-w-[400px] -translate-x-1/2">
                  <div className="animate-scale-up rounded-md border bg-white px-4 py-2 shadow-md">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={areAllFilteredSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                        <span className="text-sm font-medium whitespace-nowrap">
                          {selectedCount} log
                          {selectedCount > 1 ? "s are" : " is"} selected
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDelete}
                          disabled={isDeleting}
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            strokeWidth={2}
                            className="mr-1 h-4 w-4"
                          />
                          Delete
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSelection}
                          className="px-2"
                        >
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            strokeWidth={2}
                            className="h-4 w-4"
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pagination */}
              <div className="mt-4 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
                <Field orientation="horizontal" className="w-fit">
                  <FieldLabel htmlFor="select-rows-per-page">
                    Rows per page
                  </FieldLabel>
                  <Select
                    value={pagination.pageSize.toString()}
                    onValueChange={handleItemsPerPageChange}
                    disabled={isLoading}
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
                  Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{" "}
                  {Math.min(startIndex + pagination.pageSize, filteredData.length)} of{" "}
                  {filteredData.length} logs
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
                          pagination.currentPage === 0 ||
                            filteredData.length === 0 ||
                            isLoading
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                    {getPageNumbers(totalPages, pagination.currentPage + 1).map(
                      (page, index) => (
                        <PaginationItem key={index}>
                          {page === "..." ? (
                            <span className="px-2">...</span>
                          ) : (
                            <PaginationLink
                              href="#"
                              isActive={pagination.currentPage + 1 === page}
                              onClick={(e) => {
                                e.preventDefault()
                                handleGoToPage(page as number)
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
                          pagination.currentPage === totalPages - 1 ||
                            filteredData.length === 0 ||
                            isLoading
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          ) : (
            // Empty state
            <Empty className="m-auto min-h-[300px] max-w-[500px] rounded-lg">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon
                    icon={MonitorDotIcon}
                    strokeWidth={2}
                    className="h-12 w-12 text-muted-foreground"
                  />
                </EmptyMedia>
                <EmptyTitle>
                  {searchTerm || hasActiveFilters
                    ? `No Matching Logs`
                    : "No Audit Logs"}
                </EmptyTitle>
                <EmptyDescription className="text-center text-pretty">
                  {searchTerm || hasActiveFilters ? (
                    <>Try adjusting your search or filters.</>
                  ) : (
                    "When admins interact with the Employee, Course, Skill or Target level change, detailed logs will show up here."
                  )}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {searchTerm || hasActiveFilters ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      clearAllFilters()
                    }}
                  >
                    Clear
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={handleRefresh}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <HugeiconsIcon
                      icon={RefreshIcon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                    Check Again
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </div>

      {/* Individual Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this audit log entry?
              <br />
              <span className="font-semibold">
                {logToDelete?.employeeName || "Unknown"} - {logToDelete?.action}{" "}
                on {logToDelete?.module}
              </span>
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setLogToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmIndividualDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              {selectedCount === 1 ? (
                <>
                  Are you sure you want to delete the selected audit log entry?
                  <br />
                  This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete {selectedCount} selected audit
                  log entries?
                  <br />
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Details Drawer */}
      <AuditLogDetailsDrawer
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
        log={selectedLog}
      />
    </>
  )
}