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
  Delete02Icon,
  CalendarAdd01Icon,
} from "@hugeicons/core-free-icons"
import React from "react"
import { mainStore } from "@/store/mainStore"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { EditHolidayDrawer } from "@/components/drawers/holidays/editHoliday-drawer"
import { Holiday } from "@/types/holiday"
import { CreateHolidayDrawer } from "./drawers/holidays/createHoliday-drawer"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "./ui/select"

const STROKE_WIDTH = 2

// Status badge styling
const getStatusBadge = (date: string) => {
  const today = new Date()
  const holidayDate = new Date(date)

  if (holidayDate < today) {
    return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300"
  } else if (holidayDate.toDateString() === today.toDateString()) {
    return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
  } else {
    return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
  }
}

const getStatusLabel = (date: string) => {
  const today = new Date()
  const holidayDate = new Date(date)

  if (holidayDate < today) {
    return "Passed"
  } else if (holidayDate.toDateString() === today.toDateString()) {
    return "Today"
  } else {
    return "Upcoming"
  }
}

// BorderedTableCell component
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

export function HolidaysContainer({
  searchPlaceholder = "Search holidays...",
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [holidays, setHolidays] = useState<Holiday[]>([])

  // State for row selection
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  // State for bulk delete dialog
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // State for edit drawer
  const [isNewHolidayDrawerOpen, setIsNewHolidayDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null)

  const { fetch_HolidayData, holiday_data } = mainStore()

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetch_HolidayData()
      setIsLoading(false)
    }

    loadData()
  }, [fetch_HolidayData])

  useEffect(() => {
    if (holiday_data && holiday_data.length > 0) {
      setHolidays(holiday_data)
    }
  }, [holiday_data])

  // Column headers
  const holidayHeaders = [
    { field: "select", header_name: "" },
    { field: "sr", header_name: "Sr." },
    { field: "name", header_name: "Holiday Name" },
    { field: "date", header_name: "Date" },
    { field: "day", header_name: "Day" },
    { field: "status", header_name: "Status" },
    { field: "description", header_name: "Description" },
  ]

  const filteredHolidays = holidays.filter((holiday) => {
    const matchesSearch =
      holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (holiday.description &&
        holiday.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  const totalPages = Math.ceil(filteredHolidays.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedHolidays = filteredHolidays.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  const handleNewHoliday = () => {
    setIsNewHolidayDrawerOpen(true)
  }

  const handleHolidayCreated = () => {
    setRefreshKey((prev) => prev + 1)
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
    const allSelected = paginatedHolidays.every(
      (holiday) => rowSelection[holiday.id.toString()]
    )

    if (allSelected) {
      const newSelection = { ...rowSelection }
      paginatedHolidays.forEach((holiday) => {
        delete newSelection[holiday.id.toString()]
      })
      setRowSelection(newSelection)
    } else {
      const newSelection = { ...rowSelection }
      paginatedHolidays.forEach((holiday) => {
        newSelection[holiday.id.toString()] = true
      })
      setRowSelection(newSelection)
    }
  }

  // Handle individual row selection
  const handleRowSelect = (holidayId: string) => {
    setRowSelection((prev) => ({
      ...prev,
      [holidayId]: !prev[holidayId],
    }))
  }

  // Handle row click to open edit drawer
  const handleRowClick = (holiday: Holiday) => {
    setSelectedHoliday(holiday)
    setEditDrawerOpen(true)
  }

  // Handle successful holiday update
  const handleHolidayUpdated = async () => {
    setIsLoading(true)
    await fetch_HolidayData()
    setIsLoading(false)
  }

  // Get selected holidays count
  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  // Get selected holidays list
  const getSelectedHolidays = () => {
    const selectedIds = Object.entries(rowSelection)
      .filter(([, selected]) => selected)
      .map(([id]) => parseInt(id))
    return holidays.filter((holiday) => selectedIds.includes(holiday.id))
  }

  // Handle bulk delete click
  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true)
  }

  // Handle bulk delete confirm
  const handleBulkDeleteConfirm = async () => {
    const selectedHolidays = getSelectedHolidays()
    if (selectedHolidays.length === 0) return

    setIsDeleting(true)
    try {
      const selectedIds = selectedHolidays.map((holiday) => holiday.id)
      const newHolidays = holidays.filter(
        (holiday) => !selectedIds.includes(holiday.id)
      )
      setHolidays(newHolidays)
      setRowSelection({})
      setBulkDeleteDialogOpen(false)

      const newTotalPages = Math.ceil(newHolidays.length / itemsPerPage)
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

  const totalColumns = holidayHeaders.length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-muted-foreground">Loading holidays...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 py-6">
        <CardContent className="px-4">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-xs flex-1">
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
              {selectedCount > 0 && (
                <Button variant="destructive" onClick={handleBulkDeleteClick}>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete (
                  {selectedCount}) Holiday
                  {selectedCount > 1 ? "s" : ""}
                </Button>
              )}
              <Button
                variant="default"
                onClick={handleNewHoliday}
                className="bg-primary hover:bg-primary/90"
              >
                <HugeiconsIcon icon={CalendarAdd01Icon} strokeWidth={2} />
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
                        paginatedHolidays.length > 0 &&
                        paginatedHolidays.every(
                          (holiday) => rowSelection[holiday.id.toString()]
                        )
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </BorderedTableHead>
                  {holidayHeaders.slice(1).map((header) => (
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
                {paginatedHolidays.length === 0 ? (
                  <TableRow>
                    <BorderedTableCell
                      colSpan={totalColumns}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No holidays found
                    </BorderedTableCell>
                  </TableRow>
                ) : (
                  paginatedHolidays.map((holiday) => {
                    const isSelected = !!rowSelection[holiday.id.toString()]
                    return (
                      <TableRow
                        key={holiday.id}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => handleRowClick(holiday)}
                      >
                        <BorderedTableCell
                          className="w-10"
                          selected={isSelected}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              handleRowSelect(holiday.id.toString())
                            }
                            aria-label={`Select ${holiday.name}`}
                          />
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {holiday.sr}
                        </BorderedTableCell>
                        <BorderedTableCell
                          className="font-medium"
                          selected={isSelected}
                        >
                          {holiday.name}
                        </BorderedTableCell>
                        <BorderedTableCell
                          className="text-sm"
                          selected={isSelected}
                        >
                          {new Date(holiday.date).toLocaleDateString()}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {holiday.day}
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          <Badge className={getStatusBadge(holiday.date)}>
                            {getStatusLabel(holiday.date)}
                          </Badge>
                        </BorderedTableCell>
                        <BorderedTableCell selected={isSelected}>
                          {holiday.description || "-"}
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
              Showing {filteredHolidays.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredHolidays.length)} of{" "}
              {filteredHolidays.length} holidays
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
                      currentPage === 1 || filteredHolidays.length === 0
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
                      filteredHolidays.length === 0
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
              Are you sure you want to delete {selectedCount} selected holiday
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
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditHolidayDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        holiday={selectedHoliday}
        onSuccess={handleHolidayUpdated}
      />
      <CreateHolidayDrawer
        open={isNewHolidayDrawerOpen}
        onOpenChange={setIsNewHolidayDrawerOpen}
        onSuccess={handleHolidayCreated}
      />
    </>
  )
}
