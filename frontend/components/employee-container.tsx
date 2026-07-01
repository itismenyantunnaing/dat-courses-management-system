/* eslint-disable react-hooks/set-state-in-effect */
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
import { CardContent, Card } from "@/components/ui/card"
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
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Delete02Icon,
  UserAdd01Icon,
  Cancel01Icon,
  PlusSignIcon,
  UserGroupIcon,
  DashboardBrowsingIcon,
  DatabaseIcon,
  Calendar01Icon,
  ListViewIcon,
  GridViewIcon,
} from "@hugeicons/core-free-icons"
import React from "react"
import { mainStore } from "@/store/mainStore"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { EditEmployeeDrawer } from "@/components/drawers/employees/editEmployee-drawer"
import { CreateEmployeeDrawer } from "@/components/drawers/employees/createEmployee-drawer"
import { AddDivDeptTeamDialog } from "@/components/dialogs/createDivDeptTeam-dialog"
import { EditDivDeptTeamDialog } from "@/components/dialogs/editDivDeptTeam-dialog"
import { Employee } from "@/types/employee"

const STROKE_WIDTH = 2

// Status badge styling
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950"
    case "inactive":
      return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-950"
    default:
      return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-950"
  }
}

const statusLabels = {
  active: "Active",
  inactive: "Inactive",
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

// Define the tabs configuration with icons
const VIEW_TABS = [
  { id: "employees", label: "Employees", icon: UserGroupIcon },
  { id: "divisions", label: "Divisions", icon: DashboardBrowsingIcon },
  { id: "departments", label: "Departments", icon: DatabaseIcon },
  { id: "teams", label: "Teams", icon: Calendar01Icon },
] as const

type ViewTab = (typeof VIEW_TABS)[number]["id"]

type ViewMode = "list" | "card"

// Helper function to get initials
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function EmployeeContainer({
  searchPlaceholder = "Search employees...",
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeView, setActiveView] = useState<ViewTab>("employees")
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  // Search input ref for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null)

  // State for row selection
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  // State for bulk delete dialog
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // State for edit drawer
  const [isNewEmployeeDrawerOpen, setIsNewEmployeeDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  )

  // State for Add/Edit Div/Dept/Team
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string>("")
  const [dialogItemType, setDialogItemType] = useState<
    "division" | "department" | "team"
  >("division")

  // Use store directly - no local state duplication
  const {
    fetch_EmployeeData,
    employee_data,
    delete_EmployeeData,
    isDeleting: isStoreDeleting,
  } = mainStore()

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetch_EmployeeData()
      setIsLoading(false)
    }
    loadData()
  }, [fetch_EmployeeData])

  // Keyboard shortcut for search focus (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Column headers
  const employeeHeaders = [
    { field: "select", header_name: "" },
    { field: "sr", header_name: "Sr." },
    { field: "div", header_name: "Div" },
    { field: "staff_id", header_name: "Staff ID" },
    { field: "name", header_name: "Name" },
    { field: "email", header_name: "Email" },
    { field: "doorlog", header_name: "DoorLog" },
    { field: "dept", header_name: "Dept" },
    { field: "team", header_name: "Team" },
    { field: "status", header_name: "Status" },
    { field: "role", header_name: "Role" },
  ]

  // Get unique values for each view
  const getUniqueValues = (field: keyof Employee) => {
    const values = new Set<string>()
    employee_data.forEach((employee) => {
      const value = employee[field] as string
      if (value && value.trim()) {
        values.add(value.trim())
      }
    })
    return Array.from(values).sort()
  }

  // Filter employees based on active view
  const getFilteredData = () => {
    let data = employee_data

    // Apply view filter
    if (activeView === "divisions") {
      const divs = getUniqueValues("div_name")
      // Filter by search term for list views
      if (searchTerm.trim()) {
        return divs.filter((item) =>
          item.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      return divs
    } else if (activeView === "departments") {
      const depts = getUniqueValues("dept_dat")
      if (searchTerm.trim()) {
        return depts.filter((item) =>
          item.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      return depts
    } else if (activeView === "teams") {
      const teams = getUniqueValues("team")
      if (searchTerm.trim()) {
        return teams.filter((item) =>
          item.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      return teams
    }

    // Default: employees view
    return data.filter((employee) => {
      if (!searchTerm.trim()) return true

      const searchLower = searchTerm.toLowerCase()

      // Safely get values with fallbacks
      const name = (employee.name || "").toLowerCase()
      const id = (employee.id || "").toLowerCase()
      const email = (employee.email || "").toLowerCase()
      const div_name = (employee.div_name || "").toLowerCase()
      const dept_dat = (employee.dept_dat || "").toLowerCase()
      const team = (employee.team || "").toLowerCase()
      const role = (employee.role || "").toLowerCase()
      const status = (
        employee.emp_status ||
        employee.status ||
        ""
      ).toLowerCase()
      const matchesSearch =
        name.includes(searchLower) ||
        id.includes(searchLower) ||
        email.includes(searchLower) ||
        div_name.includes(searchLower) ||
        dept_dat.includes(searchLower) ||
        team.includes(searchLower) ||
        role.includes(searchLower) ||
        status.includes(searchLower)

      // Apply status filter
      const matchesStatus =
        statusFilter === "all" || employee.emp_status === statusFilter

      return matchesSearch && matchesStatus
    })
  }

  // Get the data based on active view
  const viewData = getFilteredData()

  // For non-employee views, we show list items (divisions, departments, teams)
  const isListView = activeView !== "employees"
  const listItems = isListView ? (viewData as string[]) : []
  const filteredEmployees = isListView
    ? employee_data
    : (viewData as Employee[])

  // Calculate pagination for employees view
  const totalPages = isListView
    ? Math.ceil(listItems.length / itemsPerPage)
    : Math.ceil(filteredEmployees.length / itemsPerPage)

  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEmployees = isListView
    ? listItems.slice(startIndex, startIndex + itemsPerPage)
    : filteredEmployees.slice(startIndex, startIndex + itemsPerPage)

  const handleNewEmployee = () => {
    setIsNewEmployeeDrawerOpen(true)
  }

  const handleNewItem = () => {
    setAddDialogOpen(true)
  }

  const handleEditItem = (item: string) => {
    setSelectedItem(item)
    setEditDialogOpen(true)
  }

  const handleAddItem = (name: string) => {
    console.log(`Added new ${dialogItemType}: ${name}`)
    alert(
      `✅ ${dialogItemType.charAt(0).toUpperCase() + dialogItemType.slice(1)} "${name}" added successfully!`
    )
    // Refresh data after adding
    fetch_EmployeeData()
  }

  const handleEditItemSubmit = (oldName: string, newName: string) => {
    console.log(`Updated ${dialogItemType} from "${oldName}" to "${newName}"`)
    alert(
      `✅ ${dialogItemType.charAt(0).toUpperCase() + dialogItemType.slice(1)} updated from "${oldName}" to "${newName}" successfully!`
    )
    // Refresh data after editing
    fetch_EmployeeData()
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))

  // Handle select all - selects ALL filtered employees across all pages
  const handleSelectAll = () => {
    if (isListView) return // No selection for list views

    const allSelected = filteredEmployees.every(
      (employee) => rowSelection[employee.id.toString()]
    )

    if (allSelected) {
      // Deselect all
      setRowSelection({})
    } else {
      // Select all filtered employees
      const newSelection: Record<string, boolean> = {}
      filteredEmployees.forEach((employee) => {
        newSelection[employee.id.toString()] = true
      })
      setRowSelection(newSelection)
    }
  }

  // Handle individual row selection
  const handleRowSelect = (employeeId: string) => {
    if (isListView) return
    setRowSelection((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId],
    }))
  }

  // Handle row click to open edit drawer
  const handleRowClick = (employee: Employee) => {
    if (isListView) return
    setSelectedEmployee(employee)
    setEditDrawerOpen(true)
  }

  // Get selected employees count
  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  // Get selected employees list
  const getSelectedEmployees = () => {
    const selectedIds = Object.entries(rowSelection)
      .filter(([, selected]) => selected)
      .map(([id]) => id)
    return employee_data.filter((employee) => selectedIds.includes(employee.id))
  }

  // Handle bulk delete click
  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true)
  }

  // Handle bulk delete confirm
  const handleBulkDeleteConfirm = async () => {
    const selectedEmployees = getSelectedEmployees()
    if (selectedEmployees.length === 0) return

    try {
      const selectedIds = selectedEmployees.map((emp) => emp.id)

      const result = await delete_EmployeeData(selectedIds)
      alert(result)
      setRowSelection({})
      setBulkDeleteDialogOpen(false)

      const newTotalPages = Math.ceil(employee_data.length / itemsPerPage)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      } else if (newTotalPages === 0) {
        setCurrentPage(1)
      }
    } catch (error) {
      console.error("Bulk delete failed:", error)
    }
  }

  // Clear all selections
  const handleClearSelection = () => {
    setRowSelection({})
  }

  const getPageNumbers = () => {
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

  const totalColumns = employeeHeaders.length

  // Check if all filtered employees are selected (for the header checkbox)
  const areAllFilteredSelected =
    !isListView &&
    filteredEmployees.length > 0 &&
    filteredEmployees.every((employee) => rowSelection[employee.id.toString()])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    )
  }

  // Determine if selection bar is active
  const isSelectionActive = !isListView && selectedCount > 0

  // Render employee card
  const renderEmployeeCard = (employee: Employee, index: number) => {
    const isSelected = !!rowSelection[employee.id.toString()]
    return (
      <Card
        key={employee.id}
        className="py-4"
        onClick={() => handleRowClick(employee)}
      >
        <CardContent className="relative px-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="mb-4 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={employee.profile_photo_path || ""}
                    alt={employee.name}
                  />
                  <AvatarFallback className=" text-primary">
                    {getInitials(employee.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{employee.name}</h3>
                  <span className="text-muted-foreground">
                    {employee.role || "-"}
                  </span>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-muted-foreground uppercase">
                    Div
                  </span>
                  {employee.div_name || "-"}
                </div>
                <div className="col-span-2">
                  <span className="block text-xs text-muted-foreground uppercase">
                    Dept
                  </span>
                  {employee.dept_dat || "-"}
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground uppercase">
                    DoorLog
                  </span>
                  {employee.doorlog || "-"}
                </div>
                <div className="col-span-2">
                  <span className="block text-xs text-muted-foreground uppercase">
                    Team
                  </span>
                  {employee.team || "-"}
                </div>
                <div className="col-span-3 text-muted-foreground">
                  {employee.email || "-"}
                </div>
                <div className="absolute top-0 right-3">
                  <Badge className={getStatusBadge(employee.emp_status)}>
                    {statusLabels[
                      employee.emp_status as keyof typeof statusLabels
                    ] || employee.emp_status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 pb-6 pt-4">
        <CardContent className="px-0">
          {/* Tabs and Search Bar */}
          <div className="mb-4 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs */}
            <div>
              <Tabs
                value={activeView}
                onValueChange={(value) => {
                  setActiveView(value as ViewTab)
                  setCurrentPage(1)
                  setRowSelection({})
                  // Reset search when switching tabs
                  setSearchTerm("")
                }}
              >
                <TabsList className="h-auto">
                  {VIEW_TABS.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Actions - Search, View (list and card) and New Button */}
            <div className="flex items-center gap-1.5">
              <InputGroup className="max-w-sm">
                <InputGroupInput
                  ref={searchInputRef}
                  placeholder={
                    isListView ? `Search ${activeView}...` : searchPlaceholder
                  }
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
                  <Kbd>⌘K</Kbd>
                </InputGroupAddon>
              </InputGroup>

              {!isListView && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-auto">
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
              )}
              {!isListView && (
                <>
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
                </>
              )}
              {!isListView && (
                <Button
                  variant="default"
                  onClick={handleNewEmployee}
                  className="bg-primary hover:bg-primary/90"
                >
                  <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} />
                  New Employee
                </Button>
              )}
              {isListView && (
                <Button
                  variant="default"
                  onClick={() => {
                    setDialogItemType(
                      activeView === "divisions"
                        ? "division"
                        : activeView === "departments"
                          ? "department"
                          : "team"
                    )
                    handleNewItem()
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
                  New {activeView.slice(0, -1)}
                </Button>
              )}
            </div>
          </div>

          {/* Table / Card View */}
          {isListView ? (
            // List View for Divisions/Departments/Teams
            <div
              className={cn(
                "relative mx-4 overflow-x-auto rounded-md border",
                isSelectionActive && "pointer-events-none"
              )}
              style={{ zIndex: 1 }}
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <BorderedTableHead className="align-middle whitespace-nowrap">
                      {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                    </BorderedTableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedEmployees.length === 0 ? (
                    <TableRow>
                      <BorderedTableCell
                        colSpan={1}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No {activeView} found
                      </BorderedTableCell>
                    </TableRow>
                  ) : (
                    paginatedEmployees.map((item, index) => (
                      <TableRow
                        key={index}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => handleEditItem(item as string)}
                      >
                        <BorderedTableCell>{item as string}</BorderedTableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : viewMode === "list" ? (
            // Table View for Employees
            <div
              className={cn(
                "relative mx-4 overflow-x-auto rounded-md border",
                isSelectionActive && "pointer-events-none"
              )}
              style={{ zIndex: 1 }}
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <BorderedTableHead className="w-10 align-middle whitespace-nowrap">
                      <Checkbox
                        checked={areAllFilteredSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </BorderedTableHead>
                    {employeeHeaders.slice(1).map((header) => (
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
                  {paginatedEmployees.length === 0 ? (
                    <TableRow>
                      <BorderedTableCell
                        colSpan={totalColumns}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No employees found
                      </BorderedTableCell>
                    </TableRow>
                  ) : (
                    paginatedEmployees.map((employee, index) => {
                      const isEmployee = (emp: any): emp is Employee =>
                        emp && typeof emp === "object" && "id" in emp

                      if (!isEmployee(employee)) return null

                      const isSelected = !!rowSelection[employee.id.toString()]
                      return (
                        <TableRow
                          key={employee.id}
                          className="cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => handleRowClick(employee)}
                        >
                          <BorderedTableCell
                            className="w-10"
                            selected={isSelected}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                handleRowSelect(employee.id.toString())
                              }
                              aria-label={`Select ${employee.name}`}
                            />
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            {startIndex + index + 1}
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            {employee.div_name}
                          </BorderedTableCell>
                          <BorderedTableCell
                            className="text-sm"
                            selected={isSelected}
                          >
                            {employee.id}
                          </BorderedTableCell>
                          <BorderedTableCell
                            className="font-medium"
                            selected={isSelected}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={employee.profile_photo_path || ""}
                                  alt={employee.name}
                                />
                                <AvatarFallback className="text-xs text-primary">
                                  {getInitials(employee.name)}
                                </AvatarFallback>
                              </Avatar>
                              {employee.name}
                            </div>
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            {employee.email || "-"}
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            {employee.doorlog}
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            {employee.dept_dat}
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            {employee.team}
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            <Badge
                              className={getStatusBadge(employee.emp_status)}
                            >
                              {statusLabels[
                                employee.emp_status as keyof typeof statusLabels
                              ] || employee.emp_status}
                            </Badge>
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            {employee.role}
                          </BorderedTableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            // Card View for Employees
            <div
              className={cn(
                "relative mx-4",
                isSelectionActive && "pointer-events-none"
              )}
              style={{ zIndex: 1 }}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedEmployees.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-muted-foreground">
                    No employees found
                  </div>
                ) : (
                  paginatedEmployees.map((employee, index) => {
                    const isEmployee = (emp: any): emp is Employee =>
                      emp && typeof emp === "object" && "id" in emp

                    if (!isEmployee(employee)) return null
                    return renderEmployeeCard(employee, index)
                  })
                )}
              </div>
            </div>
          )}

          {/* Overlay and Selection Bar */}
          {isSelectionActive && (
            <>
              {/* Overlay - Click to clear selection */}
              <div
                className="pointer-events-auto absolute inset-0 z-40 cursor-pointer bg-black/2"
                onClick={handleClearSelection}
              />

              {/* Selection Bar */}
              <div className="absolute top-35 left-1/2 z-50 w-auto max-w-[90%] min-w-[300px] -translate-x-1/2">
                <div className="animate-scale-up rounded-md border bg-white px-4 py-2 shadow-md">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={areAllFilteredSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                      <span className="text-sm font-medium whitespace-nowrap">
                        {selectedCount} employees are Selected
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDeleteClick}
                        disabled={isStoreDeleting}
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
            </>
          )}

          {/* Pagination */}
          <div
            className={cn(
              "mt-4 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between",
              isSelectionActive && "pointer-events-none"
            )}
          >
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
              {isListView
                ? listItems.length === 0
                  ? 0
                  : startIndex + 1
                : filteredEmployees.length === 0
                  ? 0
                  : startIndex + 1}{" "}
              to{" "}
              {isListView
                ? Math.min(startIndex + itemsPerPage, listItems.length)
                : Math.min(
                    startIndex + itemsPerPage,
                    filteredEmployees.length
                  )}{" "}
              of {isListView ? listItems.length : filteredEmployees.length}{" "}
              {isListView ? activeView : "employees"}
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
                      (isListView
                        ? listItems.length
                        : filteredEmployees.length) === 0
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
                {getPageNumbers().map((page, index) => (
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
                      currentPage === totalPages ||
                      (isListView
                        ? listItems.length
                        : filteredEmployees.length) === 0
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

      {/* Bulk Delete Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} selected employee
              {selectedCount > 1 ? "s" : ""}? This action cannot be undone.
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
              onClick={handleBulkDeleteConfirm}
              disabled={isStoreDeleting}
            >
              {isStoreDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateEmployeeDrawer
        open={isNewEmployeeDrawerOpen}
        onOpenChange={setIsNewEmployeeDrawerOpen}
      />
      <EditEmployeeDrawer
        key={selectedEmployee?.id}
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        employee={selectedEmployee}
      />

      {/* Add Div/Dept/Team Dialog */}
      <AddDivDeptTeamDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        itemType={dialogItemType}
        onAdd={handleAddItem}
      />

      {/* Edit Div/Dept/Team Dialog */}
      <EditDivDeptTeamDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        itemType={dialogItemType}
        itemName={selectedItem}
        onEdit={handleEditItemSubmit}
      />
    </>
  )
}
