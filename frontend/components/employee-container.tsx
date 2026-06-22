/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CardContent } from "@/components/ui/card"
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
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  FilterIcon,
  Delete02Icon,
  UserAdd02Icon,
} from "@hugeicons/core-free-icons"
import React from "react"
import { mainStore } from "@/store/mainStore"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { EditEmployeeDrawer } from "@/components/drawers/employees/editEmployee-drawer"
import { CreateEmployeeDrawer } from "@/components/drawers/employees/createEmployee-drawer"
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

export function EmployeeContainer({
  searchPlaceholder = "Search employees...",
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // State for row selection
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  // State for bulk delete dialog
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // State for edit drawer
  const [isNewEmployeeDrawerOpen, setIsNewEmployeeDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  // Use store directly - no local state duplication
  const {
    fetch_EmployeeData,
    employee_data,
    delete_EmployeeData,
    isDeleting: isStoreDeleting
  } = mainStore()


  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetch_EmployeeData()
      setIsLoading(false)
    }
    loadData()
  }, [fetch_EmployeeData])

  // Column headers
  const employeeHeaders = [
    { field: "select", header_name: "" },
    { field: "sr", header_name: "Sr." },
    { field: "div", header_name: "Div" },
    { field: "staff_id", header_name: "Staff ID" },
    { field: "name", header_name: "Name" },
    { field: "doorlog", header_name: "DoorLog" },
    { field: "dept", header_name: "Dept" },
    { field: "team", header_name: "Team" },
    { field: "status", header_name: "Status" },
    { field: "role", header_name: "Role" },
  ]

  const filteredEmployees = employee_data.filter((employee) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();

    // Safely get values with fallbacks
    const name = (employee.name || '').toLowerCase();
    const id = (employee.id || '').toLowerCase();
    const email = (employee.email || '').toLowerCase();
    const div_name = (employee.div_name || '').toLowerCase();
    const dept_dat = (employee.dept_dat || '').toLowerCase();
    const team = (employee.team || '').toLowerCase();
    const role = (employee.role || '').toLowerCase();
    const status = (employee.emp_status || employee.status || '').toLowerCase();
    const matchesSearch =
      name.includes(searchLower) ||
      id.includes(searchLower) ||
      email.includes(searchLower) ||
      div_name.includes(searchLower) ||
      dept_dat.includes(searchLower) ||
      team.includes(searchLower) ||
      role.includes(searchLower) ||
      status.includes(searchLower);

    // Apply status filter
    const matchesStatus = statusFilter === "all" || employee.emp_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + itemsPerPage
  )


  const handleNewEmployee = () => {
    setIsNewEmployeeDrawerOpen(true)
  }


  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))

  // Handle select all on current page
  const handleSelectAll = () => {
    const allSelected = paginatedEmployees.every(
      (employee) => rowSelection[employee.id.toString()]
    )

    if (allSelected) {
      const newSelection = { ...rowSelection }
      paginatedEmployees.forEach((employee) => {
        delete newSelection[employee.id.toString()]
      })
      setRowSelection(newSelection)
    } else {
      const newSelection = { ...rowSelection }
      paginatedEmployees.forEach((employee) => {
        newSelection[employee.id.toString()] = true
      })
      setRowSelection(newSelection)
    }
  }

  // Handle individual row selection
  const handleRowSelect = (employeeId: string) => {
    setRowSelection((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId],
    }))
  }

  // Handle row click to open edit drawer
  const handleRowClick = (employee: Employee) => {
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
    return employee_data.filter((employee) =>
      selectedIds.includes(employee.id)
    )
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

  return (
    <>
      <div className="flex flex-col gap-4 py-6">
        <CardContent className="px-4">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
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
            <div className="flex gap-2">
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
              {selectedCount > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBulkDeleteClick}
                  disabled={isStoreDeleting}
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete (
                  {selectedCount}) Employee
                  {selectedCount > 1 ? "s" : ""}
                </Button>
              )}
              <Button
                variant="default"
                onClick={handleNewEmployee}
                className="bg-primary hover:bg-primary/90"
              >
                <HugeiconsIcon icon={UserAdd02Icon} strokeWidth={2} />
                New
              </Button>
            </div>
          </div>

          <div
            className="relative overflow-x-auto rounded-md border"
            style={{ zIndex: 1 }}
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <BorderedTableHead className="w-10 align-middle whitespace-nowrap">
                    <Checkbox
                      checked={
                        paginatedEmployees.length > 0 &&
                        paginatedEmployees.every(
                          (employee) => rowSelection[employee.id.toString()]
                        )
                      }
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
                          {index + 1}
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
                          {employee.name}
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
                          <Badge className={getStatusBadge(employee.emp_status)}>
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

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <div className="text-sm text-muted-foreground">
              Showing {filteredEmployees.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of{" "}
              {filteredEmployees.length} employees
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
                      currentPage === 1 || filteredEmployees.length === 0
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
                        filteredEmployees.length === 0
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
    </>
  )
}