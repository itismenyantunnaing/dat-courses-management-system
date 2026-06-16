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
} from "@hugeicons/core-free-icons"
import React from "react"
import { mainStore } from "@/store/mainStore"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { Employee } from "@/types/employee"
import type { TargetDates, EmployeeJapaneseLevel } from "@/types/current_target"

const STROKE_WIDTH = 2

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
  colSpan,
  rowSpan,
  ...props
}: React.ComponentProps<typeof TableHead> & { colSpan?: number; rowSpan?: number }) => (
  <TableHead className={`border-r border-l ${className}`} colSpan={colSpan} rowSpan={rowSpan} {...props}>
    {children}
  </TableHead>
)

export function CurrentTargetContainer({ searchPlaceholder = "Search employees..." }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  const {
    fetch_EmployeeData,
    employee_data,
    fetch_TargetDates,
    japaneseTargetDates_Data,
    fetch_EmployeeJapaneseLevel,
    employeeJapaneseLevel_Data
  } = mainStore()

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([
        fetch_EmployeeData(),
        fetch_TargetDates(),
        fetch_EmployeeJapaneseLevel()
      ])
      setIsLoading(false)
    }

    loadData()
  }, [fetch_EmployeeData, fetch_TargetDates, fetch_EmployeeJapaneseLevel])

  useEffect(() => {
    if (employee_data && employee_data.length > 0) {
      setEmployees(employee_data)
    }
  }, [employee_data])

  // Helper function to get Japanese level data for an employee by index
  const getJapaneseLevelData = (index: number): EmployeeJapaneseLevel | undefined => {
    return employeeJapaneseLevel_Data?.[index]
  }

  // Helper function to get target dates for an employee by index
  const getTargetDatesData = (index: number): TargetDates | undefined => {
    return japaneseTargetDates_Data?.[index]
  }

  // Helper function to format date for group name
  const formatGroupDate = (date: Date | string | undefined): string => {
    if (!date) return "TBD"
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }

  // Employee Headers (will use rowSpan=2)
  const employeeHeaders = [
    { field: "select", header_name: "" },
    { field: "Sr", header_name: "Sr" },
    { field: "staff_id", header_name: "Staff ID" },
    { field: "name", header_name: "Name" },
    { field: "email", header_name: "Email" },
    { field: "position", header_name: "Post" },
    { field: "team", header_name: "Team" },
    { field: "dept", header_name: "Dept" },
    { field: "jlpt_nat_test", header_name: "JLPT / NAT Test" },
  ];

  // Grouped Japanese Headers
  const getJapaneseHeaderGroups = (targetDate?: TargetDates) => {
    const target1Date = targetDate?.target_1_date
      ? formatGroupDate(targetDate.target_1_date)
      : "Sep-2026"
    const target2Date = targetDate?.target_2_date
      ? formatGroupDate(targetDate.target_2_date)
      : "Mar-2027"

    return [
      {
        groupName: "Certified Level",
        children: [
          { field: "jlpt_highest_level", header_name: "JLPT Highest Level (Certified)" },
          { field: "other_japanese_level", header_name: "Other Highest Japanese Level (Certified) if any" },
          { field: "preferred_joining_group", header_name: "Preferred Joining Group & Level" },
        ]
      },
      {
        groupName: "Current",
        children: [
          { field: "communication_level_1", header_name: "Communication Level" },
        ]
      },
      {
        groupName: `Target Level to be on ${target1Date}`,
        children: [
          { field: "target_1_date", header_name: "Target Date" },
          { field: "jlpt_nat_test_level", header_name: "JLPT / NAT Test Level" },
          { field: "communication_level_2", header_name: "Communication Level" },
        ]
      },
      {
        groupName: `Target Level to be on ${target2Date}`,
        children: [
          { field: "target_2_date", header_name: "Target Date" },
          { field: "jlpt_nat_test_level_2", header_name: "JLPT / NAT Test Level" },
          { field: "communication_level_3", header_name: "Communication Level" },
        ]
      },
      {
        groupName: "Current Learning Level and Method",
        children: [
          { field: "japanese_level_current", header_name: "Japanese Level (Current Learning)" },
          { field: "learning_method", header_name: "If you are studying Japanese, Learning Method (Online/Zoom, In-person, Video Record, Mobile App or Web)" }
        ]
      },
      {
        groupName: "JLPT Exam Target",
        children: [
          { field: "want_sit_jlpt_jul_2026", header_name: "Want to sit JLPT exam on Jul 2026" },
          { field: "jlpt_level_for_jul_2026", header_name: "If Yes, Which Level?" },
          { field: "confidence_level_pass_exam", header_name: "Confidence Level to Pass Exam" },
        ]
      },
    ]
  }

  const firstTargetDate = getTargetDatesData(0)
  const japaneseHeaderGroups = getJapaneseHeaderGroups(firstTargetDate)

  // Flatten for data mapping
  const flattenedJapaneseHeaders = japaneseHeaderGroups.flatMap(group => group.children);

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus =
      statusFilter === "all" || employee.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEmployees = filteredEmployees.slice(
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

  const handleRowSelect = (employeeId: string) => {
    setRowSelection((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId],
    }))
  }

  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  const getSelectedEmployees = () => {
    const selectedIds = Object.entries(rowSelection)
      .filter(([, selected]) => selected)
      .map(([id]) => parseInt(id))
    return employees.filter((employee) => selectedIds.includes(Number(employee.id)))
  }

  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true)
  }

  const handleBulkDeleteConfirm = async () => {
    const selectedEmployees = getSelectedEmployees()
    if (selectedEmployees.length === 0) return

    setIsDeleting(true)
    try {
      const selectedIds = selectedEmployees.map((emp) => emp.id)
      const newEmployees = employees.filter(
        (employee) => !selectedIds.includes(employee.id)
      )
      setEmployees(newEmployees)
      setRowSelection({})
      setBulkDeleteDialogOpen(false)

      const newTotalPages = Math.ceil(newEmployees.length / itemsPerPage)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      } else if (newTotalPages === 0) {
        setCurrentPage(1)
      }
    } catch (error) {
      console.error("Bulk delete failed:", error)
    } finally {
      setIsDeleting(false)
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

  const totalColumns = employeeHeaders.length + flattenedJapaneseHeaders.length

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
                <SelectTrigger className="w-[150px]">
                  <HugeiconsIcon icon={FilterIcon} strokeWidth={STROKE_WIDTH} />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent align="center" sideOffset={5}>
                  <SelectGroup>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {selectedCount > 0 && (
                <Button variant="destructive" onClick={handleBulkDeleteClick}>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete (
                  {selectedCount}) Employee
                  {selectedCount > 1 ? "s" : ""}
                </Button>
              )}
            </div>
          </div>

          <div
            className="relative overflow-x-auto rounded-md border"
            style={{ zIndex: 1 }}
          >
            <Table>
              <TableHeader>
                {/* First Row - Group Headers */}
                <TableRow className="bg-muted/50">
                  {/* Employee Headers - with rowSpan=2 */}
                  {employeeHeaders.map((header) => (
                    <BorderedTableHead
                      key={header.field}
                      className={cn(
                        "align-middle whitespace-nowrap text-center",
                        header.field === "select" && "w-10 min-w-[40px]"
                      )}
                      rowSpan={2}
                    >
                      {header.field === "select" ? (
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
                      ) : (
                        header.header_name
                      )}
                    </BorderedTableHead>
                  ))}
                  {/* Japanese Group Headers */}
                  {japaneseHeaderGroups.map((group) => (
                    <BorderedTableHead
                      key={group.groupName}
                      className="align-middle whitespace-nowrap text-center bg-muted/30"
                      colSpan={group.children.length}
                    >
                      {group.groupName}
                    </BorderedTableHead>
                  ))}
                </TableRow>

                {/* Second Row - Sub Headers (only for Japanese headers) */}
                <TableRow className="bg-muted/50">
                  {/* Japanese Sub Headers */}
                  {flattenedJapaneseHeaders.map((header) => (
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
                    const globalIndex = startIndex + index + 1
                    const actualIndex = startIndex + index
                    const jpLevel = getJapaneseLevelData(actualIndex)


                    return (
                      <TableRow key={employee.id}>
                        {/* Employee Data */}
                        <BorderedTableCell className="w-10 min-w-[40px]" selected={isSelected}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleRowSelect(employee.id.toString())}
                            aria-label={`Select ${employee.name}`}
                          />
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>{globalIndex}</BorderedTableCell>
                        <BorderedTableCell selected={isSelected} className="font-mono text-sm">
                          {employee.id || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected} className="font-medium">
                          {employee.name}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {employee.email || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {employee.position || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {employee.team || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {employee.dept_dat || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {employee.jlpt_nat_test || "-"}
                        </BorderedTableCell>

                        {/* Japanese Data from Store */}
                        <BorderedTableCell selected={isSelected}>
                          {jpLevel?.jlpt_highest_level || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {jpLevel?.other_japanese_level || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {jpLevel?.preferred_learning_group || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {jpLevel?.current_communication_level || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {jpLevel?.target_1_jlpt_nat_level || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {jpLevel?.target_1_communication_level || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {jpLevel?.target_2_jlpt_nat_level || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {jpLevel?.target_2_communication_level || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {jpLevel?.current_learning_level || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {jpLevel?.learning_method || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {jpLevel?.want_to_sit_exam === true ? "Yes" : jpLevel?.want_to_sit_exam === false ? "No" : "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {jpLevel?.exam_target_level || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {jpLevel?.confidence_level || "-"}
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
                <SelectTrigger className="w-18" id="select-rows-per-page">
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
                      currentPage === totalPages || filteredEmployees.length === 0
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

      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} selected employee
              {selectedCount > 1 ? "s" : ""}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}