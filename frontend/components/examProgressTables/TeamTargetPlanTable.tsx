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
import { cn } from "@/lib/utils"
import type { TeamWithCounts } from "@/types/exam_progress_report"

type ColumnConfig = {
  field: string
  header: string
  width?: string
  isSpecial?: boolean
}

type ColumnGroupConfig = {
  id: string
  header: string
  colSpan: number
  fields: string[]
  width?: string
}

const formatDate = (date: string | null | undefined): string => {
  if (!date) return "TBD"
  return date // Date is already formatted as "MMM-yyyy" from backend
}

const getColumnGroups = (
  target1Date?: string | null,
  target2Date?: string | null
): ColumnGroupConfig[] => {
  const date1 = target1Date ? formatDate(target1Date) : "Target 1"
  const date2 = target2Date ? formatDate(target2Date) : "Target 2"

  return [
    {
      id: "current",
      header: "Current",
      colSpan: 5,
      fields: ["N1", "N2", "N3", "N4", "N5"],
      width: "w-[100px]",
    },
    {
      id: "target1",
      header: date1,
      colSpan: 5,
      fields: [
        "target1_N1",
        "target1_N2",
        "target1_N3",
        "target1_N4",
        "target1_N5",
      ],
      width: "w-[100px]",
    },
    {
      id: "target2",
      header: date2,
      colSpan: 5,
      fields: [
        "target2_N1",
        "target2_N2",
        "target2_N3",
        "target2_N4",
        "target2_N5",
      ],
      width: "w-[100px]",
    },
  ]
}

const getColumnConfigs = (): ColumnConfig[] => {
  const columns: ColumnConfig[] = [
    {
      field: "team_name",
      header: "By Team",
      width: "min-w-[200px]",
      isSpecial: true,
    },
  ]
  const nFields = ["N1", "N2", "N3", "N4", "N5"]
  nFields.forEach((field) =>
    columns.push({ field, header: field, width: "w-[80px]" })
  )
  const target1NFields = [
    "target1_N1",
    "target1_N2",
    "target1_N3",
    "target1_N4",
    "target1_N5",
  ]
  target1NFields.forEach((field) =>
    columns.push({
      field,
      header: field.replace("target1_", ""),
      width: "w-[80px]",
    })
  )
  const target2NFields = [
    "target2_N1",
    "target2_N2",
    "target2_N3",
    "target2_N4",
    "target2_N5",
  ]
  target2NFields.forEach((field) =>
    columns.push({
      field,
      header: field.replace("target2_", ""),
      width: "w-[80px]",
    })
  )
  return columns
}

const BorderedTableCell = ({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof TableCell>) => (
  <TableCell className={cn("border-r border-l", className)} {...props}>
    {children}
  </TableCell>
)

const BorderedTableHead = ({
  children,
  className = "",
  colSpan,
  rowSpan,
  ...props
}: React.ComponentProps<typeof TableHead> & {
  colSpan?: number
  rowSpan?: number
}) => (
  <TableHead
    className={cn("border-r border-l text-center", className)}
    colSpan={colSpan}
    rowSpan={rowSpan}
    {...props}
  >
    {children}
  </TableHead>
)

interface TeamTargetPlanTableProps {
  searchTerm: string
  currentPage: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (value: number) => void
  selectedDeptId?: number | null
  data: TeamWithCounts[]
  target1Date?: string | null
  target2Date?: string | null
}

export function TeamTargetPlanTable({
  searchTerm,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  selectedDeptId,
  data,
  target1Date,
  target2Date,
}: TeamTargetPlanTableProps) {
  const columnGroups = getColumnGroups(target1Date, target2Date)
  const columnConfigs = getColumnConfigs()
  const dataColumns = columnConfigs.filter((col) => !col.isSpecial)

  const calculateGrandTotals = (data: TeamWithCounts[]) => {
    if (data.length === 0) return {}
    return data.reduce(
      (acc, row) => ({
        N1: acc.N1 + (row.N1 || 0),
        N2: acc.N2 + (row.N2 || 0),
        N3: acc.N3 + (row.N3 || 0),
        N4: acc.N4 + (row.N4 || 0),
        N5: acc.N5 + (row.N5 || 0),
        target1_N1: acc.target1_N1 + (row.target1_N1 || 0),
        target1_N2: acc.target1_N2 + (row.target1_N2 || 0),
        target1_N3: acc.target1_N3 + (row.target1_N3 || 0),
        target1_N4: acc.target1_N4 + (row.target1_N4 || 0),
        target1_N5: acc.target1_N5 + (row.target1_N5 || 0),
        target2_N1: acc.target2_N1 + (row.target2_N1 || 0),
        target2_N2: acc.target2_N2 + (row.target2_N2 || 0),
        target2_N3: acc.target2_N3 + (row.target2_N3 || 0),
        target2_N4: acc.target2_N4 + (row.target2_N4 || 0),
        target2_N5: acc.target2_N5 + (row.target2_N5 || 0),
      }),
      {
        N1: 0,
        N2: 0,
        N3: 0,
        N4: 0,
        N5: 0,
        target1_N1: 0,
        target1_N2: 0,
        target1_N3: 0,
        target1_N4: 0,
        target1_N5: 0,
        target2_N1: 0,
        target2_N2: 0,
        target2_N3: 0,
        target2_N4: 0,
        target2_N5: 0,
      }
    )
  }

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const matchesDept = selectedDeptId ? item.deptId === selectedDeptId : true
    return matchesSearch && matchesDept
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  )
  const grandTotal = calculateGrandTotals(filteredData)

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
      <div
        className="relative overflow-x-auto rounded-md border-y"
        style={{ zIndex: 1 }}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <BorderedTableHead
                className="min-w-[200px] text-center align-middle whitespace-nowrap"
                rowSpan={2}
              >
                By Team
              </BorderedTableHead>
              {columnGroups.map((group) => (
                <BorderedTableHead
                  key={group.id}
                  className={cn(
                    "text-center align-middle whitespace-nowrap",
                    group.width
                  )}
                  colSpan={group.colSpan}
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
                    "text-center align-middle whitespace-nowrap",
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
                  colSpan={columnConfigs.length}
                  className="py-8 text-center text-muted-foreground"
                >
                  No teams found
                </BorderedTableCell>
              </TableRow>
            ) : (
              <>
                {paginatedData.map((row, index) => {
                  return (
                    <TableRow key={row.team_name || index}>
                      {columnConfigs.map((col) => {
                        const value: string | number | undefined =
                          row[col.field as keyof TeamWithCounts]
                        return (
                          <BorderedTableCell
                            key={col.field}
                            className={cn(
                              "text-center",
                              col.width,
                              col.isSpecial && "text-left"
                            )}
                          >
                            {value !== undefined && value !== null
                              ? value
                              : "-"}
                          </BorderedTableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
                {filteredData.length > 0 &&
                  Object.keys(grandTotal).length > 0 && (
                    <TableRow className="bg-muted/30 font-bold">
                      {columnConfigs.map((col) => {
                        let value: string | number | undefined
                        if (col.isSpecial) {
                          value =
                            col.field === "team_name"
                              ? "Total teams"
                              : grandTotal[col.field as keyof typeof grandTotal]
                        } else {
                          value =
                            grandTotal[col.field as keyof typeof grandTotal]
                        }
                        return (
                          <BorderedTableCell
                            key={col.field}
                            className={cn(
                              "text-center",
                              col.width,
                              col.isSpecial && "text-left font-bold"
                            )}
                          >
                            {value !== undefined && value !== null
                              ? value
                              : "-"}
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
          {filteredData.length} teams
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

export default TeamTargetPlanTable
