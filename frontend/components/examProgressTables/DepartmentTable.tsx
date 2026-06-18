"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { DeptWithCounts } from "@/types/exam_progress_report"

type ColumnConfig = {
  field: string;
  header: string;
  width?: string;
  isSpecial?: boolean;
}

type ColumnGroupConfig = {
  header: string;
  colSpan: number;
  fields: string[];
  width?: string;
  isSpecial?: boolean;
}

const columnGroups: ColumnGroupConfig[] = [
  {
    header: "Certified",
    colSpan: 5,
    fields: ["N1", "N2", "N3", "N4", "N5"],
    width: "w-[100px]"
  },
  {
    header: "Not Certified",
    colSpan: 1,
    fields: ["None"],
    width: "w-[100px]"
  },
  {
    header: "Total",
    colSpan: 1,
    fields: ["total"],
    width: "w-[150px]",
    isSpecial: true
  }
]

const columnConfigs: ColumnConfig[] = [
  { field: "dept_name", header: "By Department", width: "min-w-[200px]", isSpecial: true },
  { field: "N1", header: "N1", width: "w-[100px]" },
  { field: "N2", header: "N2", width: "w-[100px]" },
  { field: "N3", header: "N3", width: "w-[100px]" },
  { field: "N4", header: "N4", width: "w-[100px]" },
  { field: "N5", header: "N5", width: "w-[100px]" },
  { field: "None", header: "None", width: "w-[100px]" },
  { field: "total", header: "Total", width: "w-[150px]", isSpecial: true },
]

const specialColumns = columnConfigs.filter(col => col.isSpecial)
const dataColumns = columnConfigs.filter(col => !col.isSpecial)

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
  <TableHead className={cn("border-r border-l text-center", className)} colSpan={colSpan} rowSpan={rowSpan} {...props}>
    {children}
  </TableHead>
)

interface DepartmentTableProps {
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: number) => void;
  data: DeptWithCounts[];
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
}

export function DepartmentTable({
  searchTerm,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  data,
  rowSelection: externalRowSelection = {},
  onRowSelectionChange,
}: DepartmentTableProps) {
  const rowSelection = externalRowSelection
  const setRowSelection = onRowSelectionChange

  const calculateRowTotal = (row: DeptWithCounts) => {
    return row.N1 + row.N2 + row.N3 + row.N4 + row.N5 + row.None
  }

  const calculateGrandTotals = (data: DeptWithCounts[]) => {
    if (data.length === 0) return { N1: 0, N2: 0, N3: 0, N4: 0, N5: 0, None: 0, total: 0 }

    const totals = data.reduce((acc, row) => ({
      N1: acc.N1 + row.N1,
      N2: acc.N2 + row.N2,
      N3: acc.N3 + row.N3,
      N4: acc.N4 + row.N4,
      N5: acc.N5 + row.N5,
      None: acc.None + row.None,
    }), { N1: 0, N2: 0, N3: 0, N4: 0, N5: 0, None: 0 })

    return {
      ...totals,
      total: totals.N1 + totals.N2 + totals.N3 + totals.N4 + totals.N5 + totals.None
    }
  }

  const filteredData = data.filter((item) => {
    const matchesSearch = item.dept_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)
  const grandTotal = calculateGrandTotals(filteredData)

  const handleSelectAll = () => {
    const allSelected = paginatedData.every(
      (row) => rowSelection[row.dept_name]
    )

    const newSelection = { ...rowSelection }
    if (allSelected) {
      paginatedData.forEach((row) => {
        delete newSelection[row.dept_name]
      })
    } else {
      paginatedData.forEach((row) => {
        newSelection[row.dept_name] = true
      })
    }
    setRowSelection(newSelection)
  }

  const handleRowSelect = (row: DeptWithCounts) => {
    const newSelection = {
      ...rowSelection,
      [row.dept_name]: !rowSelection[row.dept_name],
    }
    setRowSelection(newSelection)
  }

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1)
  }

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1)
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

  return (
    <>
      <div className="relative overflow-x-auto rounded-md border" style={{ zIndex: 1 }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <BorderedTableHead rowSpan={2} className="w-10 align-middle whitespace-nowrap">
                <Checkbox
                  checked={
                    paginatedData.length > 0 &&
                    paginatedData.every((row) => rowSelection[row.dept_name])
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </BorderedTableHead>
              <BorderedTableHead
                className="align-middle whitespace-nowrap text-center min-w-[200px]"
                rowSpan={2}
              >
                By Department
              </BorderedTableHead>

              {columnGroups.map((group) => (
                <BorderedTableHead
                  key={group.header}
                  className={cn(
                    "align-middle whitespace-nowrap text-center",
                    group.width,
                    group.isSpecial && "border-l border-r"
                  )}
                  colSpan={group.isSpecial ? undefined : group.colSpan}
                  rowSpan={group.isSpecial ? 2 : undefined}
                >
                  {group.header}
                </BorderedTableHead>
              ))}
            </TableRow>

            <TableRow className="bg-muted/50">
              {dataColumns.map((col) => (
                <BorderedTableHead
                  key={col.field}
                  className={cn(
                    "align-middle whitespace-nowrap text-center",
                    col.width
                  )}
                >
                  {col.header}
                </BorderedTableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <BorderedTableCell
                  colSpan={columnConfigs.length + 1}
                  className="py-8 text-center text-muted-foreground"
                >
                  No departments found
                </BorderedTableCell>
              </TableRow>
            ) : (
              <>
                {paginatedData.map((row, index) => {
                  const rowTotal = calculateRowTotal(row)
                  const isSelected = !!rowSelection[row.dept_name]
                  return (
                    <TableRow key={row.id || index}>
                      <BorderedTableCell className="w-10" selected={isSelected}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleRowSelect(row)}
                          aria-label={`Select ${row.dept_name}`}
                        />
                      </BorderedTableCell>
                      {columnConfigs.map((col) => {
                        let value: string | number | undefined

                        if (col.field === "total") {
                          value = rowTotal
                        } else if (col.field === "dept_name") {
                          value = row.dept_name
                        } else {
                          value = row[col.field as keyof DeptWithCounts]
                        }

                        return (
                          <BorderedTableCell
                            key={col.field}
                            className={cn(
                              "text-center",
                              col.width,
                              col.field === "dept_name" && "font-medium text-left",
                              col.field === "total" && "font-bold"
                            )}
                            selected={isSelected}
                          >
                            {value}
                          </BorderedTableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}

                {filteredData.length > 0 && (
                  <TableRow className="bg-muted/30 font-bold">
                    <BorderedTableCell className="w-10" />
                    {columnConfigs.map((col) => {
                      let value: string | number | undefined

                      if (col.field === "dept_name") {
                        value = "Grand Total"
                      } else if (col.field === "total") {
                        value = grandTotal.total
                      } else {
                        value = grandTotal[col.field as keyof typeof grandTotal]
                      }

                      return (
                        <BorderedTableCell
                          key={col.field}
                          className={cn(
                            "text-center",
                            col.width,
                            col.field === "dept_name" && "font-bold text-left"
                          )}
                        >
                          {value}
                        </BorderedTableCell>
                      )
                    })}
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
          >
            <SelectTrigger className="w-[70px]">
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
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(startIndex + itemsPerPage, filteredData.length)} of{" "}
          {filteredData.length} departments
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
                      onPageChange(page as number)
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
    </>
  )
}

export default DepartmentTable