"use client"

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { HugeiconsIcon } from "@hugeicons/react"
import { CircleIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import type { TeamWithCounts } from "@/types/exam_progress_report"
import type { TargetDates } from "@/types/current_target"
import { parseCommunicationLevel } from "@/types/exam_progress_report"

type ColumnConfig = {
  field: string;
  header: string;
  width?: string;
  isSpecial?: boolean;
  tooltip?: string;
}

type ColumnGroupConfig = {
  id: string;
  header: string;
  colSpan: number;
  fields: string[];
  width?: string;
}

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "TBD"
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

const extractCommLevels = (data: TeamWithCounts[]): string[] => {
  if (!data || data.length === 0) {
    return ["Level 0 | None", "Level 1 | G1", "Level 1 | G2", "Level 1 | G3", "Level 2 | G1", "Level 2 | G2", "Level 2 | G3", "Level 3"]
  }
  const firstRow = data[0];
  const levels: string[] = [];
  let index = 0;
  while (true) {
    const key = `current_comm_${index}`;
    if (key in firstRow) { levels.push(key); index++; } else { break; }
  }
  if (levels.length === 0) {
    return ["Level 0 | None", "Level 1 | G1", "Level 1 | G2", "Level 1 | G3", "Level 2 | G1", "Level 2 | G2", "Level 2 | G3", "Level 3"]
  }
  return levels;
}

const getColumnGroups = (targetDate?: TargetDates, commLevels: string[] = []): ColumnGroupConfig[] => {
  const target1Date = targetDate?.target_1_date ? formatDate(targetDate.target_1_date) : "Sep-2026"
  const target2Date = targetDate?.target_2_date ? formatDate(targetDate.target_2_date) : "Mar-2027"
  const levels = commLevels.length > 0 ? commLevels : ["Level 0 | None", "Level 1 | G1", "Level 1 | G2", "Level 1 | G3", "Level 2 | G1", "Level 2 | G2", "Level 2 | G3", "Level 3"]
  return [
    { id: "current", header: "Current", colSpan: levels.length, fields: levels.map((_, index) => `current_comm_${index}`), width: "w-[120px]" },
    { id: "target1", header: target1Date, colSpan: levels.length, fields: levels.map((_, index) => `target1_comm_${index}`), width: "w-[120px]" },
    { id: "target2", header: target2Date, colSpan: levels.length, fields: levels.map((_, index) => `target2_comm_${index}`), width: "w-[120px]" }
  ]
}

const getColumnConfigs = (data: TeamWithCounts[]): ColumnConfig[] => {
  const columns: ColumnConfig[] = [{ field: "team_name", header: "By Team", width: "min-w-[200px]", isSpecial: true }]
  const commFields = extractCommLevels(data);
  const defaultLevels = ["Level 0 | None", "Level 1 | G1", "Level 1 | G2", "Level 1 | G3", "Level 2 | G1", "Level 2 | G2", "Level 2 | G3", "Level 3"];
  const levels = commFields.length > 0 ? commFields : defaultLevels;
  
  // ✅ Use unique keys by combining period + index
  levels.forEach((field, index) => {
    const label = defaultLevels[index] || field;
    const parsed = parseCommunicationLevel(label);
    columns.push({ 
      field: `current_${index}`,  // ✅ Unique key
      header: parsed.label, 
      width: "w-[80px]",
      tooltip: parsed.description
    })
  })
  
  levels.forEach((field, index) => {
    const label = defaultLevels[index] || field;
    const parsed = parseCommunicationLevel(label);
    columns.push({ 
      field: `target1_${index}`,  // ✅ Unique key
      header: parsed.label, 
      width: "w-[80px]",
      tooltip: parsed.description
    })
  })
  
  levels.forEach((field, index) => {
    const label = defaultLevels[index] || field;
    const parsed = parseCommunicationLevel(label);
    columns.push({ 
      field: `target2_${index}`,  // ✅ Unique key
      header: parsed.label, 
      width: "w-[80px]",
      tooltip: parsed.description
    })
  })
  
  return columns
}

const BorderedTableCell = ({ children, className = "", selected = false, ...props }: any) => (
  <TableCell className={cn("border-r border-l", selected && "bg-muted/50", className)} {...props}>{children}</TableCell>
)

const BorderedTableHead = ({ children, className = "", colSpan, rowSpan, ...props }: any) => (
  <TableHead className={cn("border-r border-l text-center", className)} colSpan={colSpan} rowSpan={rowSpan} {...props}>
    {children}
  </TableHead>
)

interface TeamCommunicationTableProps {
  searchTerm: string; currentPage: number; itemsPerPage: number; onPageChange: (page: number) => void; onItemsPerPageChange: (value: number) => void; selectedDeptId?: number | null;
  data: TeamWithCounts[];
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  targetDates?: TargetDates[];
}

export function TeamCommunicationTable({
  searchTerm, currentPage, itemsPerPage, onPageChange, onItemsPerPageChange, selectedDeptId,
  data, rowSelection: externalRowSelection = {}, onRowSelectionChange, targetDates,
}: TeamCommunicationTableProps) {
  const rowSelection = externalRowSelection
  const setRowSelection = onRowSelectionChange

  const firstTargetDate = targetDates?.[0]
  const commFields = extractCommLevels(data)
  const columnGroups = getColumnGroups(firstTargetDate, commFields)
  const columnConfigs = getColumnConfigs(data)
  const dataColumns = columnConfigs.filter(col => !col.isSpecial)

  const calculateGrandTotals = (data: TeamWithCounts[]) => {
    if (data.length === 0) return {}
    const initAcc: any = {}
    const firstRow = data[0];
    const commKeys = Object.keys(firstRow).filter(key => key.startsWith('current_comm_') || key.startsWith('target1_comm_') || key.startsWith('target2_comm_'));
    commKeys.forEach(key => { initAcc[key] = 0; })
    return data.reduce((acc, row) => { commKeys.forEach(key => { acc[key] = (acc[key] || 0) + (row[key as keyof TeamWithCounts] as number || 0) }); return acc }, initAcc)
  }

  const filteredData = data.filter((item) => {
    const matchesSearch = item.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const matchesDept = selectedDeptId ? item.deptId === selectedDeptId : true
    return matchesSearch && matchesDept
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)
  const grandTotal = calculateGrandTotals(filteredData)

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

  // Map column configs to actual data values
  const getValueForColumn = (row: TeamWithCounts, col: ColumnConfig) => {
    // Map the unique key back to actual data field
    if (col.field.startsWith('current_')) {
      const index = parseInt(col.field.split('_')[1])
      return row[`current_comm_${index}`]
    } else if (col.field.startsWith('target1_')) {
      const index = parseInt(col.field.split('_')[1])
      return row[`target1_comm_${index}`]
    } else if (col.field.startsWith('target2_')) {
      const index = parseInt(col.field.split('_')[1])
      return row[`target2_comm_${index}`]
    }
    return row[col.field as keyof TeamWithCounts]
  }

  return (
    <TooltipProvider>
      <div className="relative overflow-x-auto rounded-md border" style={{ zIndex: 1 }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <BorderedTableHead rowSpan={2} className="w-10 align-middle whitespace-nowrap">
                <Checkbox checked={paginatedData.length > 0 && paginatedData.every((row) => rowSelection[row.team_name])} onCheckedChange={handleSelectAll} aria-label="Select all" />
              </BorderedTableHead>
              <BorderedTableHead className="align-middle whitespace-nowrap text-center min-w-[200px]" rowSpan={2}>Team&apos;s Communication Improvement</BorderedTableHead>
              {columnGroups.map((group) => (
                <BorderedTableHead key={group.id} className={cn("align-middle whitespace-nowrap text-center", group.width)} colSpan={group.colSpan}>
                  {group.header}
                </BorderedTableHead>
              ))}
            </TableRow>
            <TableRow className="bg-muted/50">
              {dataColumns.map((col) => (
                <BorderedTableHead key={col.field} className={cn("align-middle whitespace-nowrap text-center", col.width)}>
                  <div className="flex items-center justify-center gap-1">
                    <span>{col.header}</span>
                    {col.tooltip && (
                      <Tooltip>
                        <TooltipTrigger asChild><span className="cursor-help"><HugeiconsIcon icon={CircleIcon} strokeWidth={2} className="h-3 w-3 text-muted-foreground hover:text-foreground" /></span></TooltipTrigger>
                        <TooltipContent className="max-w-xs"><p className="text-xs">{col.tooltip}</p></TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </BorderedTableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow><BorderedTableCell colSpan={columnConfigs.length + 1} className="py-8 text-center text-muted-foreground">No teams found</BorderedTableCell></TableRow>
            ) : (
              <>
                {paginatedData.map((row, index) => {
                  const isSelected = !!rowSelection[row.team_name]
                  return (
                    <TableRow key={row.team_name || index}>
                      <BorderedTableCell className="w-10" selected={isSelected}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleRowSelect(row)} aria-label={`Select ${row.team_name}`} />
                      </BorderedTableCell>
                      {columnConfigs.map((col) => {
                        const value: string | number | undefined = getValueForColumn(row, col)
                        return (
                          <BorderedTableCell key={col.field} className={cn("text-center", col.width, col.isSpecial && "font-medium text-left")} selected={isSelected}>
                            {value !== undefined && value !== null ? value : '-'}
                          </BorderedTableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
                {filteredData.length > 0 && Object.keys(grandTotal).length > 0 && (
                  <TableRow className="bg-muted/30 font-bold">
                    <BorderedTableCell className="w-10" />
                    {columnConfigs.map((col) => {
                      let value: string | number | undefined
                      if (col.isSpecial) {
                        value = col.field === "team_name" ? "Grand Total" : grandTotal[col.field as keyof typeof grandTotal]
                      } else {
                        // Map the unique key back to actual data field for grand total
                        if (col.field.startsWith('current_')) {
                          const index = parseInt(col.field.split('_')[1])
                          value = grandTotal[`current_comm_${index}`]
                        } else if (col.field.startsWith('target1_')) {
                          const index = parseInt(col.field.split('_')[1])
                          value = grandTotal[`target1_comm_${index}`]
                        } else if (col.field.startsWith('target2_')) {
                          const index = parseInt(col.field.split('_')[1])
                          value = grandTotal[`target2_comm_${index}`]
                        } else {
                          value = grandTotal[col.field as keyof typeof grandTotal]
                        }
                      }
                      return (
                        <BorderedTableCell key={col.field} className={cn("text-center", col.width, col.isSpecial && "font-bold text-left")}>
                          {value !== undefined && value !== null ? value : '-'}
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
          <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
            <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
            <SelectContent align="start">
              <SelectGroup><SelectItem value="15">15</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem></SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} teams
        </div>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePrevious() }} className={currentPage === 1 || filteredData.length === 0 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
            {getPageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === "..." ? <span className="px-2">...</span> : (
                  <PaginationLink href="#" isActive={currentPage === page} onClick={(e) => { e.preventDefault(); onPageChange(page as number) }}>{page}</PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handleNext() }} className={currentPage === totalPages || filteredData.length === 0 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </TooltipProvider>
  )
}

export default TeamCommunicationTable