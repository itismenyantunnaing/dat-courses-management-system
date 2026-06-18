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

interface CommunicationCapabilityTableProps {
  searchTerm: string; currentPage: number; itemsPerPage: number; onPageChange: (page: number) => void; onItemsPerPageChange: (value: number) => void; selectedDeptId?: number | null;
  data: any[];
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
}

export function CommunicationCapabilityTable({
  searchTerm, currentPage, itemsPerPage, onPageChange, onItemsPerPageChange, selectedDeptId,
  data, rowSelection: externalRowSelection = {}, onRowSelectionChange,
}: CommunicationCapabilityTableProps) {
  const rowSelection = externalRowSelection
  const setRowSelection = onRowSelectionChange

  const filteredData = data.filter((item) => {
    const matchesSearch = item.level_full?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    return matchesSearch
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const paginatedTotal = paginatedData.reduce((acc, row) => ({
    current: acc.current + row.current,
    target1: acc.target1 + row.target1,
    target2: acc.target2 + row.target2
  }), { current: 0, target1: 0, target2: 0 })

  const handleSelectAll = () => {
    const allSelected = paginatedData.every((row) => rowSelection[row.id])
    const newSelection = { ...rowSelection }
    if (allSelected) {
      paginatedData.forEach((row) => { delete newSelection[row.id] })
    } else {
      paginatedData.forEach((row) => { newSelection[row.id] = true })
    }
    setRowSelection(newSelection)
  }

  const handleRowSelect = (row: any) => {
    const newSelection = { ...rowSelection, [row.id]: !rowSelection[row.id] }
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
              <Checkbox checked={paginatedData.length > 0 && paginatedData.every((row) => rowSelection[row.id])} onCheckedChange={handleSelectAll} aria-label="Select all" />
            </BorderedTableHead>
            <BorderedTableHead className="align-middle whitespace-nowrap text-center min-w-[400px]" rowSpan={2}>Communication Capability</BorderedTableHead>
          </TableRow>
          <TableRow className="bg-muted/50">
            <BorderedTableHead className="w-[100px] text-center">Current</BorderedTableHead>
            <BorderedTableHead className="w-[100px] text-center">Sep-2026</BorderedTableHead>
            <BorderedTableHead className="w-[100px] text-center">Mar-2027</BorderedTableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow><BorderedTableCell colSpan={5} className="py-8 text-center text-muted-foreground">No data found</BorderedTableCell></TableRow>
          ) : (
            <>
              {paginatedData.map((row, index) => {
                const rowTotal = (row.current || 0) + (row.target1 || 0) + (row.target2 || 0)
                const isSelected = !!rowSelection[row.id]
                return (
                  <TableRow key={row.id || index}>
                    <BorderedTableCell className="w-10" selected={isSelected}>
                      <Checkbox checked={isSelected} onCheckedChange={() => handleRowSelect(row)} aria-label={`Select ${row.level_full}`} />
                    </BorderedTableCell>
                    <BorderedTableCell className="font-medium min-w-[200px] max-w-[400px] text-left whitespace-normal break-words" selected={isSelected}>
                      {row.level_full}
                    </BorderedTableCell>
                    <BorderedTableCell className="text-center w-[100px]" selected={isSelected}>{row.current || 0}</BorderedTableCell>
                    <BorderedTableCell className="text-center w-[100px]" selected={isSelected}>{row.target1 || 0}</BorderedTableCell>
                    <BorderedTableCell className="text-center w-[100px] font-bold" selected={isSelected}>{rowTotal}</BorderedTableCell>
                  </TableRow>
                )
              })}
              {paginatedData.length > 0 && (
                <TableRow className="bg-muted/30 font-bold">
                  <BorderedTableCell className="w-10" />
                  <BorderedTableCell className="min-w-[200px] max-w-[400px] font-bold text-left whitespace-normal break-words">Total</BorderedTableCell>
                  <BorderedTableCell className="text-center w-[100px]">{paginatedTotal.current}</BorderedTableCell>
                  <BorderedTableCell className="text-center w-[100px]">{paginatedTotal.target1}</BorderedTableCell>
                  <BorderedTableCell className="text-center w-[100px] font-bold">{paginatedTotal.current + paginatedTotal.target1 + paginatedTotal.target2}</BorderedTableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default CommunicationCapabilityTable