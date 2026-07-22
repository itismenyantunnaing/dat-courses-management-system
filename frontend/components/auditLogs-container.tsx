"use client"

import { useState, useEffect, useRef } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
} from "@hugeicons/core-free-icons"
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
import { AuditLogDetailsDrawer } from "./drawers/auditLogs/auditLogDetails-drawer"

// Types
interface AuditLog {
  id: number
  employee_id: string
  employee_name: string
  action: string
  module: string
  old_value: string | null
  new_value: string | null
  ip_address: string
  created_at: string
}

// Mock data
const mockAuditLogs: AuditLog[] = [
  {
    id: 1,
    employee_id: "EMP001",
    employee_name: "John Doe",
    action: "CREATE",
    module: "EMPLOYEES",
    old_value: null,
    new_value: '{"name":"John Doe","email":"john@example.com"}',
    ip_address: "192.168.1.1",
    created_at: "2026-07-21 10:30:00",
  },
  {
    id: 2,
    employee_id: "EMP002",
    employee_name: "Jane Smith",
    action: "UPDATE",
    module: "COURSES",
    old_value: '{"status":"draft"}',
    new_value: '{"status":"published"}',
    ip_address: "192.168.1.2",
    created_at: "2026-07-21 09:15:00",
  },
  {
    id: 3,
    employee_id: "EMP003",
    employee_name: "Bob Johnson",
    action: "DELETE",
    module: "EMPLOYEES",
    old_value: '{"name":"Bob Johnson","email":"bob@example.com"}',
    new_value: null,
    ip_address: "192.168.1.3",
    created_at: "2026-07-20 16:45:00",
  },
  {
    id: 4,
    employee_id: "EMP001",
    employee_name: "John Doe",
    action: "UPDATE",
    module: "SETTINGS",
    old_value: '{"theme":"light"}',
    new_value: '{"theme":"dark"}',
    ip_address: "192.168.1.1",
    created_at: "2026-07-20 14:20:00",
  },
  {
    id: 5,
    employee_id: "EMP004",
    employee_name: "Alice Williams",
    action: "CREATE",
    module: "DEPARTMENTS",
    old_value: null,
    new_value: '{"name":"Engineering"}',
    ip_address: "192.168.1.4",
    created_at: "2026-07-20 11:00:00",
  },
  {
    id: 6,
    employee_id: "EMP002",
    employee_name: "Jane Smith",
    action: "UPDATE",
    module: "EMPLOYEES",
    old_value: '{"role":"member"}',
    new_value: '{"role":"admin"}',
    ip_address: "192.168.1.2",
    created_at: "2026-07-19 15:30:00",
  },
  {
    id: 7,
    employee_id: "EMP005",
    employee_name: "Michael Brown",
    action: "DELETE",
    module: "COURSES",
    old_value: '{"title":"Old Course"}',
    new_value: null,
    ip_address: "192.168.1.5",
    created_at: "2026-07-19 12:10:00",
  },
  {
    id: 8,
    employee_id: "EMP003",
    employee_name: "Bob Johnson",
    action: "CREATE",
    module: "SKILLS",
    old_value: null,
    new_value: '{"name":"React"}',
    ip_address: "192.168.1.3",
    created_at: "2026-07-19 09:00:00",
  },
]

// Filter state type
type FilterState = {
  action: string[]
  module: string[]
}

// Action options
const ACTION_OPTIONS = [
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
]

// Module options
const MODULE_OPTIONS = [
  { value: "EMPLOYEES", label: "Employees" },
  { value: "COURSES", label: "Courses" },
  { value: "SKILLS", label: "Skills" },
  { value: "DEPARTMENTS", label: "Departments" },
  { value: "SETTINGS", label: "Settings" },
]

// Bordered Table Cell component (matching employee table)
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
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [isLoading, setIsLoading] = useState(false)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs)
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
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc") // Default: newest first
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    (filterArray) => filterArray.length > 0
  )

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

  // Keyboard shortcut for clearing filters (Escape key)
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

  // Sort data by ID
  const sortData = (data: AuditLog[]) => {
    return [...data].sort((a, b) => {
      if (sortOrder === "desc") {
        return b.id - a.id
      } else {
        return a.id - b.id
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
          log.employee_name.toLowerCase().includes(searchLower) ||
          log.employee_id.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          log.module.toLowerCase().includes(searchLower) ||
          log.ip_address.includes(searchLower)
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

    // Apply sorting
    return sortData(data)
  }

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const filteredData = getFilteredData()
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))

  // Handle select all
  const handleSelectAll = () => {
    const allSelected = paginatedData.every(
      (log) => rowSelection[log.id.toString()]
    )

    if (allSelected) {
      setRowSelection({})
    } else {
      const newSelection: Record<string, boolean> = {}
      paginatedData.forEach((log) => {
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
    setCurrentPage(1)
  }

  // Helper to clear all filters
  const clearAllFilters = () => {
    setFilters({
      action: [],
      module: [],
    })
    setCurrentPage(1)
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
      setAuditLogs((prev) => prev.filter((log) => log.id !== logToDelete.id))
      setDeleteDialogOpen(false)
      setLogToDelete(null)
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
      setAuditLogs((prev) =>
        prev.filter((log) => !selectedIds.includes(log.id))
      )
      setRowSelection({})
      setBulkDeleteDialogOpen(false)
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

  // Check if all filtered logs are selected
  const areAllFilteredSelected =
    paginatedData.length > 0 &&
    paginatedData.every((log) => rowSelection[log.id.toString()])

  // Get action badge color with lowercase styling
  const getActionBadge = (action: string) => {
    switch (action) {
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

  return (
    <>
      <div className="flex flex-col gap-4 pt-4 pb-6">
        <CardContent className="px-0">
          {/* Header and Search Bar */}
          <div className="mb-6 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
            <InputGroup className="max-w-sm">
              <InputGroupInput
                ref={searchInputRef}
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                        sortOrder === "desc" ? SortByDown01Icon : SortByUp01Icon
                      }
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Click to switch ascending and descending

                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Filter Dropdown */}
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
                  {/* Action Filter */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Action</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {ACTION_OPTIONS.map((option) => (
                          <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={filters.action.includes(option.value)}
                            onCheckedChange={() =>
                              toggleFilter("action", option.value)
                            }
                            onSelect={(e) => e.preventDefault()}
                          >
                            {option.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  {/* Module Filter */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Module</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {MODULE_OPTIONS.map((option) => (
                          <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={filters.module.includes(option.value)}
                            onCheckedChange={() =>
                              toggleFilter("module", option.value)
                            }
                            onSelect={(e) => e.preventDefault()}
                          >
                            {option.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

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
            </div>
          </div>

          {/* Table */}
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
                    />
                  </BorderedTableHead>
                  <BorderedTableHead className="align-middle whitespace-nowrap">
                    ID
                  </BorderedTableHead>
                  <BorderedTableHead className="align-middle whitespace-nowrap">
                    Employee
                  </BorderedTableHead>
                  <BorderedTableHead className="align-middle whitespace-nowrap">
                    Action
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
                  <BorderedTableHead className="align-middle whitespace-nowrap">
                    Actions
                  </BorderedTableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <BorderedTableCell
                      colSpan={10}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {searchTerm || hasActiveFilters ? (
                        <>
                          No logs found matching{" "}
                          {searchTerm && `"${searchTerm}"`}
                          {searchTerm && hasActiveFilters && " and "}
                          {hasActiveFilters && "selected filters"}
                        </>
                      ) : (
                        "No audit logs found"
                      )}
                    </BorderedTableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((log) => {
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
                          {log.id}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 rounded-full">
                              <AvatarImage
                                src="/avatars/default.jpg"
                                alt={log.employee_name}
                              />
                              <AvatarFallback className="rounded-full text-xs">
                                {getInitials(log.employee_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">
                                {log.employee_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {log.employee_id}
                              </div>
                            </div>
                          </div>
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          <Badge className={getActionBadge(log.action)}>
                            {`${log.action[0]}${log.action.slice(1).toLowerCase()}`}
                          </Badge>
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
                          {log.old_value || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell
                          className="max-w-[150px] truncate font-mono text-xs"
                          selected={isSelected}
                        >
                          {log.new_value || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell
                          className="font-mono text-xs"
                          selected={isSelected}
                        >
                          {log.ip_address}
                        </BorderedTableCell>
                        <BorderedTableCell
                          className="text-sm"
                          selected={isSelected}
                        >
                          {formatDate(log.created_at)}
                        </BorderedTableCell>
                        <BorderedTableCell
                          selected={isSelected}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleIndividualDelete(log)
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive/90"
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              strokeWidth={2}
                              className="h-4 w-4"
                            />
                          </Button>
                        </BorderedTableCell>
                      </TableRow>
                    )
                  })
                )}
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
                      {selectedCount} log{selectedCount > 1 ? "s are" : " is"}{" "}
                      selected
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
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
              Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredData.length)} of{" "}
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
                      currentPage === 1 || filteredData.length === 0
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
                {getPageNumbers(totalPages, currentPage).map((page, index) => (
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
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handleNext()
                    }}
                    className={
                      currentPage === totalPages || filteredData.length === 0
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
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
                {logToDelete?.employee_name} - {logToDelete?.action} on{" "}
                {logToDelete?.module}
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
