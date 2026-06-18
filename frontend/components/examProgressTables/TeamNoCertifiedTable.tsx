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
import type { TeamWithCounts } from "@/types/exam_progress_report"
import type { TargetDates } from "@/types/current_target"

const BorderedTableCell = ({ children, className = "", selected = false, ...props }: any) => (
  <TableCell className={cn("border-r border-l", selected && "bg-muted/50", className)} {...props}>{children}</TableCell>
)

const BorderedTableHead = ({ children, className = "", colSpan, rowSpan, ...props }: any) => (
  <TableHead className={cn("border-r border-l text-center", className)} colSpan={colSpan} rowSpan={rowSpan} {...props}>
    {children}
  </TableHead>
)

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "TBD"
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

interface TeamNoCertifiedTableProps {
  searchTerm: string; currentPage: number; itemsPerPage: number; onPageChange: (page: number) => void; onItemsPerPageChange: (value: number) => void; selectedDeptId?: number | null;
  data: TeamWithCounts[];
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  targetDates?: TargetDates[];
}

export function TeamNoCertifiedTable({ 
  searchTerm, currentPage, itemsPerPage, onPageChange, onItemsPerPageChange, selectedDeptId,
  data, rowSelection: externalRowSelection = {}, onRowSelectionChange, targetDates,
}: TeamNoCertifiedTableProps) {
  const rowSelection = externalRowSelection
  const setRowSelection = onRowSelectionChange

  const filteredData = selectedDeptId ? data.filter(row => row.deptId === selectedDeptId) : data
  const searchedData = filteredData.filter((item) => item.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)

  const totalPages = Math.ceil(searchedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = searchedData.slice(startIndex, startIndex + itemsPerPage)

  const grandTotal = searchedData.reduce((acc, row) => ({
    current: acc.current + (row.None || 0),
    target1: acc.target1 + (row.target1_None || 0),
    target2: acc.target2 + (row.target2_None || 0)
  }), { current: 0, target1: 0, target2: 0 })

  const firstTarget = targetDates?.[0]
  const date1 = firstTarget?.target_1_date ? formatDate(firstTarget.target_1_date) : "Sep-2026"
  const date2 = firstTarget?.target_2_date ? formatDate(firstTarget.target_2_date) : "Mar-2027"

  const handleSelectAll = () => {
    const allSelected = paginatedData.every((row) => rowSelection[row.team_name])
    const newSelection = { ...rowSelection }
    if (allSelected) {
      paginatedData.forEach((row) => { delete newSelection[row.team_name] })
    } else {
      paginatedData.forEach((row) => { newSelection[row.team_name] = true })
    }
    setRowSelection(newSelection)
  }

  const handleRowSelect = (row: TeamWithCounts) => {
    const newSelection = { ...rowSelection, [row.team_name]: !rowSelection[row.team_name] }
    setRowSelection(newSelection)
  }

  const handlePrevious = () => { if (currentPage > 1) onPageChange(currentPage - 1) }
  const handleNext = () => { if (currentPage < totalPages) onPageChange(currentPage + 1) }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    if (totalPages <= maxVisible) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
    else if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push("..."); pages.push(totalPages) }
    else if (currentPage >= totalPages - 2) { pages.push(1); pages.push("..."); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i) }
    else { pages.push(1); pages.push("..."); for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i); pages.push("..."); pages.push(totalPages) }
    return pages
  }

  return (
    <div className="relative overflow-x-auto rounded-md border" style={{ zIndex: 1 }}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <BorderedTableHead rowSpan={2} className="w-10 align-middle whitespace-nowrap">
              <Checkbox checked={paginatedData.length > 0 && paginatedData.every((row) => rowSelection[row.team_name])} onCheckedChange={handleSelectAll} aria-label="Select all" />
            </BorderedTableHead>
            <BorderedTableHead className="align-middle whitespace-nowrap text-center" rowSpan={2}>No Certified Members</BorderedTableHead>
            <BorderedTableHead className="align-middle whitespace-nowrap text-center" colSpan={3}>To be Certified at</BorderedTableHead>
          </TableRow>
          <TableRow className="bg-muted/50">
            <BorderedTableHead className=" text-center">Current</BorderedTableHead>
            <BorderedTableHead className=" text-center">{date1}</BorderedTableHead>
            <BorderedTableHead className=" text-center">{date2}</BorderedTableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow><BorderedTableCell colSpan={5} className="py-8 text-center text-muted-foreground">No data found</BorderedTableCell></TableRow>
          ) : (
            <>
              {paginatedData.map((row, index) => {
                const rowTotal = (row.None || 0) + (row.target1_None || 0) + (row.target2_None || 0)
                const isSelected = !!rowSelection[row.team_name]
                return (
                  <TableRow key={row.team_name || index}>
                    <BorderedTableCell className="w-10" selected={isSelected}>
                      <Checkbox checked={isSelected} onCheckedChange={() => handleRowSelect(row)} aria-label={`Select ${row.team_name}`} />
                    </BorderedTableCell>
                    <BorderedTableCell className="font-medium text-left" selected={isSelected}>{row.team_name}</BorderedTableCell>
                    <BorderedTableCell className="text-center " selected={isSelected}>{row.None || 0}</BorderedTableCell>
                    <BorderedTableCell className="text-center " selected={isSelected}>{row.target1_None || 0}</BorderedTableCell>
                    <BorderedTableCell className="text-center  font-bold" selected={isSelected}>{rowTotal}</BorderedTableCell>
                  </TableRow>
                )
              })}
              {paginatedData.length > 0 && (
                <TableRow className="bg-muted/30 font-bold">
                  <BorderedTableCell className="w-10" />
                  <BorderedTableCell className=" font-bold text-left">Grand Total</BorderedTableCell>
                  <BorderedTableCell className="text-center ">{grandTotal.current}</BorderedTableCell>
                  <BorderedTableCell className="text-center ">{grandTotal.target1}</BorderedTableCell>
                  <BorderedTableCell className="text-center  font-bold">{grandTotal.current + grandTotal.target1 + grandTotal.target2}</BorderedTableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default TeamNoCertifiedTable