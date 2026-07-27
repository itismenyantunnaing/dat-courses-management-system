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

const BorderedTableCell = ({ children, className = "", ...props }: any) => (
  <TableCell className={cn("border-r border-l", className)} {...props}>{children}</TableCell>
)

const BorderedTableHead = ({ children, className = "", colSpan, rowSpan, ...props }: any) => (
  <TableHead className={cn("border-r border-l text-center", className)} colSpan={colSpan} rowSpan={rowSpan} {...props}>
    {children}
  </TableHead>
)

const formatDate = (date: string | null | undefined): string => {
  if (!date) return "TBD"
  return date // Date is already formatted as "MMM-yyyy" from backend
}

interface CommunicationCapabilityTableProps {
  searchTerm: string; 
  currentPage: number; 
  itemsPerPage: number; 
  onPageChange: (page: number) => void; 
  onItemsPerPageChange: (value: number) => void; 
  selectedDeptId?: number | null;
  data: any[];
  target1Date?: string | null;  // ✅ Direct date string
  target2Date?: string | null;  // ✅ Direct date string
}

export function CommunicationCapabilityTable({
  searchTerm, 
  currentPage, 
  itemsPerPage, 
  onPageChange, 
  onItemsPerPageChange, 
  selectedDeptId,
  data,
  target1Date,
  target2Date,
}: CommunicationCapabilityTableProps) {


  const filteredData = data.filter((item) => {
    const matchesSearch = item.level_full?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    return matchesSearch
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const paginatedTotal = paginatedData.reduce((acc, row) => ({
    current: acc.current + (row.current || 0),
    target1: acc.target1 + (row.target1 || 0),
    target2: acc.target2 + (row.target2 || 0)
  }), { current: 0, target1: 0, target2: 0 })

  const grandTotal = paginatedTotal.current + paginatedTotal.target1 + paginatedTotal.target2

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
      for (let i = 1; i <= 4; i++) pages.push(i); 
      pages.push("..."); 
      pages.push(totalPages) 
    } else if (currentPage >= totalPages - 2) { 
      pages.push(1); 
      pages.push("..."); 
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i) 
    } else { 
      pages.push(1); 
      pages.push("..."); 
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i); 
      pages.push("..."); 
      pages.push(totalPages) 
    }
    return pages
  }

  // Get formatted dates
  const date1 = target1Date ? formatDate(target1Date) : "Target 1"
  const date2 = target2Date ? formatDate(target2Date) : "Target 2"

  return (
    <div className="relative overflow-x-auto rounded-md border" style={{ zIndex: 1 }}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <BorderedTableHead className="align-middle whitespace-nowrap text-center min-w-[400px]" rowSpan={2}>
              Communication Capability
            </BorderedTableHead>
            <BorderedTableHead className="w-[100px] text-center" colSpan={3}>
              To be Certified at
            </BorderedTableHead>
          </TableRow>
          <TableRow className="bg-muted/50">
            <BorderedTableHead className="w-[100px] text-center">Current</BorderedTableHead>
            <BorderedTableHead className="w-[100px] text-center">{date1}</BorderedTableHead>
            <BorderedTableHead className="w-[100px] text-center">{date2}</BorderedTableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <BorderedTableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                No data found
              </BorderedTableCell>
            </TableRow>
          ) : (
            <>
              {paginatedData.map((row, index) => (
                <TableRow key={row.id || index}>
                  <BorderedTableCell className="font-medium min-w-[200px] max-w-[400px] text-left whitespace-normal break-words">
                    {row.level_full}
                  </BorderedTableCell>
                  <BorderedTableCell className="text-center w-[100px]">
                    {row.current || 0}
                  </BorderedTableCell>
                  <BorderedTableCell className="text-center w-[100px]">
                    {row.target1 || 0}
                  </BorderedTableCell>
                  <BorderedTableCell className="text-center w-[100px]">
                    {row.target2 || 0}
                  </BorderedTableCell>
                </TableRow>
              ))}
              {paginatedData.length > 0 && (
                <TableRow className="bg-muted/30 font-bold">
                  <BorderedTableCell className="min-w-[200px] max-w-[400px] font-bold text-left whitespace-normal break-words">
                    Total
                  </BorderedTableCell>
                  <BorderedTableCell className="text-center w-[100px]">
                    {paginatedTotal.current}
                  </BorderedTableCell>
                  <BorderedTableCell className="text-center w-[100px]">
                    {paginatedTotal.target1}
                  </BorderedTableCell>
                  <BorderedTableCell className="text-center w-[100px] font-bold">
                    {paginatedTotal.target2}
                  </BorderedTableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>

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
          {filteredData.length} items
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
    </div>
  )
}

export default CommunicationCapabilityTable