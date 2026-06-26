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
  Delete02Icon,
  UserAdd02Icon,
  CalendarAdd02Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import React from "react"
import { mainStore } from "@/store/mainStore"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { Employee } from "@/types/employee"
import type { TargetDates, EmployeeJapaneseLevel } from "@/types/current_target"
import { CreateCurrentTargetDrawer } from "@/components/drawers/currentTarget/createCurrentTarget-drawer"
import { EditCurrentTargetDrawer } from "@/components/drawers/currentTarget/editCurrentTarget-drawer"
import { EditTargetDatesDrawer } from "@/components/drawers/currentTarget/editTargetDates-drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

// Search filter type
type SearchFilter = 'all' | 'staff_id' | 'name' | 'team' | 'department'

export function CurrentTargetContainer({ searchPlaceholder = "Search employees..." }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // State for create/edit drawers
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<EmployeeJapaneseLevel | null>(null)
  const [selectedEmployeeForProfile, setSelectedEmployeeForProfile] = useState<Employee | null>(null)
  const [isEditTargetDatesDrawerOpen, setIsEditTargetDatesDrawerOpen] = useState(false)
  const [isCreateTargetDatesDrawerOpen, setIsCreateTargetDatesDrawerOpen] = useState(false)

  // Column visibility state for Japanese data sections
  const [selectedSection, setSelectedSection] = useState<string>("all")

  const {
    fetch_EmployeeData,
    employee_data,
    fetch_TargetDates,
    japaneseTargetDates_Data,
    fetch_EmployeeJapaneseLevel,
    employeeJapaneseLevel_Data,
    delete_bulkJapaneseLevel,
  } = mainStore()

  // Create a map for fast employee -> profile lookup
  const [employeeProfileMap, setEmployeeProfileMap] = useState<Map<string, EmployeeJapaneseLevel>>(new Map())

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

  // Build the employee -> profile map when data changes
  useEffect(() => {
    const map = new Map<string, EmployeeJapaneseLevel>()

    if (employeeJapaneseLevel_Data && employeeJapaneseLevel_Data.length > 0) {
      employeeJapaneseLevel_Data.forEach((profile: EmployeeJapaneseLevel) => {
        const empId = profile.employee_id || profile.employeeId
        if (empId) {
          map.set(empId.toString(), profile)
        }
      })
    }

    setEmployeeProfileMap(map)
  }, [employeeJapaneseLevel_Data])

  // Update employees list when employee_data or map changes
  useEffect(() => {
    if (employee_data && employee_data.length > 0) {
      const filteredEmployees = employee_data.filter((employee) => {
        return employeeProfileMap.has(employee.id)
      })
      setEmployees(filteredEmployees)
    }
  }, [employee_data, employeeProfileMap])

  // Helper function to get Japanese level data by employee ID
  const getJapaneseLevelByEmployeeId = (employeeId: string): EmployeeJapaneseLevel | undefined => {
    return employeeProfileMap.get(employeeId)
  }

  // Helper function to get target dates for an employee by index
  const getTargetDatesData = (index: number): TargetDates | undefined => {
    if (!japaneseTargetDates_Data || japaneseTargetDates_Data.length === 0) {
      return undefined
    }
    return japaneseTargetDates_Data?.[index]
  }

  // Helper function to format date for group name
  const formatGroupDate = (date: Date | string | undefined): string => {
    if (!date) return "TBD"
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return "TBD"
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }

  // Handle successful create/update
  const handleDataChanged = () => {
    setRefreshKey(prev => prev + 1)
    fetch_EmployeeJapaneseLevel()
    fetch_EmployeeData()
    fetch_TargetDates()
  }

  // Handle row click to open edit drawer
  const handleRowClick = (employee: Employee) => {
    const profile = getJapaneseLevelByEmployeeId(employee.id)
    if (profile) {
      setSelectedProfile(profile)
      setSelectedEmployeeForProfile(employee)
      setEditDrawerOpen(true)
    }
  }

  // Handle new profile creation
  const handleNewProfile = () => {
    setIsCreateDrawerOpen(true)
  }

  // Handle opening target dates drawer (edit or create)
  const handleEditTargetDates = () => {
    if (japaneseTargetDates_Data && japaneseTargetDates_Data.length > 0) {
      setIsEditTargetDatesDrawerOpen(true)
    } else {
      setIsCreateTargetDatesDrawerOpen(true)
    }
  }

  // Employee Headers
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

  // Grouped Japanese Headers with section keys
  const getJapaneseHeaderGroups = (targetDate?: TargetDates) => {
    const target1Date = targetDate?.target1Date
      ? formatGroupDate(targetDate.target1Date)
      : "(Date 1)"
    const target2Date = targetDate?.target2Date
      ? formatGroupDate(targetDate.target2Date)
      : "(Date 2)"
    const examDateStr = targetDate?.examDate
      ? formatGroupDate(targetDate.examDate)
      : "(Exam Date)"

    return [
      {
        groupName: "Certified Level",
        sectionKey: "certified_level",
        children: [
          { field: "jlpt_highest_level", header_name: "JLPT Highest Level (Certified)" },
          { field: "other_japanese_level", header_name: "Other Highest Japanese Level (Certified) if any" },
          { field: "preferred_learning_group", header_name: "Preferred Joining Group & Level" },
        ]
      },
      {
        groupName: "Current",
        sectionKey: "current",
        children: [
          { field: "current_communication_level", header_name: "Communication Level" },
        ]
      },
      {
        groupName: `Target Level to be on ${target1Date}`,
        sectionKey: "target_levels",
        children: [
          { field: "target_1_jlpt_nat_level", header_name: "JLPT / NAT Test Level" },
          { field: "target_1_communication_level", header_name: "Communication Level" },
        ]
      },
      {
        groupName: `Target Level to be on ${target2Date}`,
        sectionKey: "target_levels",
        children: [
          { field: "target_2_jlpt_nat_level", header_name: "JLPT / NAT Test Level" },
          { field: "target_2_communication_level", header_name: "Communication Level" },
        ]
      },
      {
        groupName: "Current Learning Level and Method",
        sectionKey: "learning_method",
        children: [
          { field: "current_learning_level", header_name: "Japanese Level (Current Learning)" },
          { field: "learning_method", header_name: "If you are studying Japanese, Learning Method (Online/Zoom, In-person, Video Record, Mobile App or Web)" }
        ]
      },
      {
        groupName: `JLPT Exam Target (${examDateStr})`,
        sectionKey: "exam_target",
        children: [
          { field: "want_to_sit_exam", header_name: `Want to sit JLPT exam` },
          { field: "exam_target_level", header_name: "If Yes, Which Level?" },
          { field: "confidence_level", header_name: "Confidence Level to Pass Exam" },
        ]
      },
    ]
  }

  const firstTargetDate = getTargetDatesData(0)
  const allJapaneseHeaderGroups = getJapaneseHeaderGroups(firstTargetDate)

  // Filter visible Japanese header groups based on selected section
  const visibleJapaneseHeaderGroups = allJapaneseHeaderGroups.filter(
    group => {
      if (selectedSection === "all") return true
      return group.sectionKey === selectedSection
    }
  )

  // Flatten for data mapping
  const flattenedJapaneseHeaders = visibleJapaneseHeaderGroups.flatMap(group => group.children);

  // Enhanced search function with filter support
  const filteredEmployees = employees.filter((employee) => {
    if (!searchTerm.trim()) return true
    
    const searchLower = searchTerm.toLowerCase().trim()
    
    switch (searchFilter) {
      case 'staff_id':
        return employee.id.toLowerCase().includes(searchLower)
      case 'name':
        return employee.name.toLowerCase().includes(searchLower)
      case 'team':
        return (employee.team || '').toLowerCase().includes(searchLower)
      case 'department':
        return (employee.dept_dat || '').toLowerCase().includes(searchLower)
      case 'all':
      default:
        return (
          employee.id.toLowerCase().includes(searchLower) ||
          employee.name.toLowerCase().includes(searchLower) ||
          (employee.email && employee.email.toLowerCase().includes(searchLower)) ||
          (employee.team && employee.team.toLowerCase().includes(searchLower)) ||
          (employee.dept_dat && employee.dept_dat.toLowerCase().includes(searchLower))
        )
    }
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

  const getSelectedEmployees = (): Employee[] => {
    const selectedIds = Object.keys(rowSelection).filter((key) => rowSelection[key] === true)
    return employees.filter((employee) => selectedIds.includes(employee.id.toString()))
  }

  const handleBulkDeleteClick = () => {
    const selected = getSelectedEmployees()
    if (selected.length === 0) {
      alert('Please select at least one employee to delete.')
      return
    }
    setBulkDeleteDialogOpen(true)
  }

  const handleBulkDeleteConfirm = async () => {
    const selectedEmployees = getSelectedEmployees()

    if (selectedEmployees.length === 0) {
      alert('No employees selected.')
      return
    }

    setIsDeleting(true)
    try {
      const profileIds: number[] = [];

      selectedEmployees.forEach((emp) => {
        const profile = employeeProfileMap.get(emp.id)
        if (profile?.id) {
          profileIds.push(profile.id)
        }
      });

      if (profileIds.length === 0) {
        alert('No Japanese profile data found for the selected employees.')
        setBulkDeleteDialogOpen(false)
        return
      }

      const result = await delete_bulkJapaneseLevel(profileIds)
      if (result && result.includes("Failed")) {
        alert(result)
        return
      }

      alert(result)

      setRowSelection({})
      setBulkDeleteDialogOpen(false)

      await fetch_EmployeeJapaneseLevel()
      await fetch_EmployeeData()

    } catch (error) {
      console.error('❌ Bulk delete failed:', error)
      alert('Failed to delete Japanese profile data. Please try again.')
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

  // Generate employee options for the create drawer
  const employeeOptions = employee_data
    .filter((emp) => !employeeProfileMap.has(emp.id))
    .map((emp) => ({
      value: emp.id,
      label: `${emp.id} - ${emp.name}`,
    }))

  // Section display names for the column visibility dropdown
  const sectionDisplayNames = {
    certified_level: "Certified Level",
    current: "Current",
    target_levels: "Target Levels",
    learning_method: "Current Learning Level and Method",
    exam_target: "JLPT Exam Target",
  }

  // Handle section selection (radio button style)
  const handleSectionSelect = (sectionKey: string) => {
    if (sectionKey === "all") {
      setSelectedSection("all")
    } else {
      if (selectedSection === sectionKey) {
        setSelectedSection("all")
      } else {
        setSelectedSection(sectionKey)
      }
    }
  }

  // Search filter options
  const searchFilters = [
    { value: 'all', label: 'All Fields' },
    { value: 'staff_id', label: 'Staff ID' },
    { value: 'name', label: 'Name' },
    { value: 'team', label: 'Team' },
    { value: 'department', label: 'Department' },
  ]

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
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <HugeiconsIcon
                  icon={Search01Icon}
                  strokeWidth={STROKE_WIDTH}
                  className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground"
                />
                <Input
                  placeholder={`Search by ${searchFilter === 'all' ? 'Staff ID, Name, Team, or Department' : searchFilters.find(f => f.value === searchFilter)?.label || '...'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={searchFilter}
                onValueChange={(value: SearchFilter) => {
                  setSearchFilter(value)
                  setSearchTerm("")
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {searchFilters.map((filter) => (
                      <SelectItem key={filter.value} value={filter.value}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Column Visibility Dropdown with Radio-style selection */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="h-4 w-4" />
                    {selectedSection === "all" ? "All Sections" : sectionDisplayNames[selectedSection as keyof typeof sectionDisplayNames]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Filter Japanese Data Sections</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    Employee columns are always visible
                  </div>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuCheckboxItem
                    checked={selectedSection === "all"}
                    onCheckedChange={() => handleSectionSelect("all")}
                    className="font-medium"
                  >
                    Show All Sections
                  </DropdownMenuCheckboxItem>
                  
                  <DropdownMenuSeparator />
                  
                  {Object.entries(sectionDisplayNames).map(([key, label]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={selectedSection === key}
                      onCheckedChange={() => handleSectionSelect(key)}
                      className="pl-6"
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <div className="text-xs text-muted-foreground">
                      {selectedSection === "all" 
                        ? "Showing all sections" 
                        : `Showing only: ${sectionDisplayNames[selectedSection as keyof typeof sectionDisplayNames]}`}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {selectedCount > 0 && (
                <Button variant="destructive" onClick={handleBulkDeleteClick}>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete (
                  {selectedCount}) Employee
                  {selectedCount > 1 ? "s" : ""}
                </Button>
              )}
              <Button
                variant="default"
                onClick={handleNewProfile}
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
            <Table key={refreshKey}>
              <TableHeader>
                {/* First Row - Group Headers */}
                <TableRow className="bg-muted/50">
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
                  {visibleJapaneseHeaderGroups.map((group) => (
                    <BorderedTableHead
                      key={group.groupName}
                      className={cn(
                        "align-middle whitespace-nowrap text-center bg-muted/30",
                        (group.groupName.includes("Target Level") || group.groupName.includes("JLPT Exam Target")) && 
                        "cursor-pointer hover:bg-muted/50 transition-colors"
                      )}
                      colSpan={group.children.length}
                      onClick={() => {
                        if (group.groupName.includes("Target Level") || group.groupName.includes("JLPT Exam Target")) {
                          handleEditTargetDates()
                        }
                      }}
                    >
                      {group.groupName}
                    </BorderedTableHead>
                  ))}
                </TableRow>

                <TableRow className="bg-muted/50">
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
                      {searchTerm ? `No employees found matching "${searchTerm}"` : "No employees with Japanese profile data found"}
                    </BorderedTableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((employee, index) => {
                    const isSelected = !!rowSelection[employee.id.toString()]
                    const globalIndex = startIndex + index + 1
                    const jpLevel = getJapaneseLevelByEmployeeId(employee.id)

                    return (
                      <TableRow
                        key={employee.id}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => handleRowClick(employee)}
                      >
                        <BorderedTableCell
                          className="w-10 min-w-[40px]"
                          selected={isSelected}
                          onClick={(e) => e.stopPropagation()}
                        >
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
                          {jpLevel?.jlptNatTest || "-"}
                        </BorderedTableCell>
                        {/* Only render visible Japanese columns */}
                        {visibleJapaneseHeaderGroups.map((group) => {
                          return group.children.map((header) => {
                            let value = "-"
                            switch (header.field) {
                              case "jlpt_highest_level":
                                value = jpLevel?.jlptHighestLevel || "-"
                                break
                              case "other_japanese_level":
                                value = jpLevel?.otherJapaneseLevel || "-"
                                break
                              case "preferred_learning_group":
                                value = jpLevel?.preferredLearningGroup || "-"
                                break
                              case "current_communication_level":
                                value = jpLevel?.currentCommunicationLevel || "-"
                                break
                              case "target_1_jlpt_nat_level":
                                value = jpLevel?.target1JlptNatLevel || "-"
                                break
                              case "target_1_communication_level":
                                value = jpLevel?.target1CommunicationLevel || "-"
                                break
                              case "target_2_jlpt_nat_level":
                                value = jpLevel?.target2JlptNatLevel || "-"
                                break
                              case "target_2_communication_level":
                                value = jpLevel?.target2CommunicationLevel || "-"
                                break
                              case "current_learning_level":
                                value = jpLevel?.currentLearningLevel || "-"
                                break
                              case "learning_method":
                                value = jpLevel?.learningMethod || "-"
                                break
                              case "want_to_sit_exam":
                                value = jpLevel?.wantToSitExam === true ? "Yes" : jpLevel?.wantToSitExam === false ? "No" : "-"
                                break
                              case "exam_target_level":
                                value = jpLevel?.examTargetLevel || "-"
                                break
                              case "confidence_level":
                                value = jpLevel?.confidenceLevel || "-"
                                break
                              default:
                                value = "-"
                            }
                            return (
                              <BorderedTableCell key={header.field} selected={isSelected}>
                                {value}
                              </BorderedTableCell>
                            )
                          })
                        })}
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
              {filteredEmployees.length} employees with Japanese data
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

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete Japanese Profile Data</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to delete the <strong>Japanese profile data</strong> for <strong>{selectedCount}</strong> selected employee{selectedCount > 1 ? "s" : ""}?
                </p>
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 border border-yellow-200">
                  <p className="font-medium">⚠️ Important Note:</p>
                  <p className="mt-1">
                    This action will <strong>only delete the Japanese language profile data</strong> (JLPT levels,
                    communication levels, learning methods, exam targets, etc.).
                  </p>
                  <p className="mt-1">
                    The <strong>employee information</strong> (name, ID, email, department, etc.) will <strong>remain unchanged</strong>.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. The employees will no longer appear in this view until new Japanese profile data is added.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Japanese Data Only"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Profile Drawer */}
      <CreateCurrentTargetDrawer
        key={`create-${refreshKey}`}
        open={isCreateDrawerOpen}
        onOpenChange={setIsCreateDrawerOpen}
        onSuccess={handleDataChanged}
        employeeOptions={employeeOptions}
      />

      {/* Edit Profile Drawer */}
      <EditCurrentTargetDrawer
        key={selectedProfile?.id}
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        profile={selectedProfile}
        onSuccess={handleDataChanged}
      />

      {/* Edit Target Dates Drawer */}
      <EditTargetDatesDrawer
        open={isEditTargetDatesDrawerOpen}
        onOpenChange={setIsEditTargetDatesDrawerOpen}
        targetDates={japaneseTargetDates_Data?.[0] || null}
        mode="edit"
        onSuccess={handleDataChanged}
      />

      {/* Create Target Dates Drawer */}
      <EditTargetDatesDrawer
        open={isCreateTargetDatesDrawerOpen}
        onOpenChange={setIsCreateTargetDatesDrawerOpen}
        targetDates={null}
        mode="create"
        onSuccess={() => {
          handleDataChanged()
          setIsCreateTargetDatesDrawerOpen(false)
        }}
      />
    </>
  )
}