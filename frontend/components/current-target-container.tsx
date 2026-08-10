/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useState, useEffect, useRef } from "react"
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
  SelectLabel,
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
  ViewIcon,
  Loading03Icon,
  Cancel01Icon,
  FilterMailIcon,
  CalendarSyncIcon,
  LayoutGridIcon,
  EyeIcon,
} from "@hugeicons/core-free-icons"
import React from "react"
import { mainStore } from "@/store/mainStore"

import { cn } from "@/lib/utils"
import type { Employee } from "@/types/employee"
import type { TargetDates, EmployeeJapaneseLevel } from "@/types/current_target"
import { CreateCurrentTargetDrawer } from "@/components/drawers/currentTarget/createCurrentTarget-drawer"
import { EditCurrentTargetDrawer } from "@/components/drawers/currentTarget/editCurrentTarget-drawer"
import { EditTargetDatesDrawer } from "@/components/drawers/currentTarget/editTargetDates-drawer"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuShortcut,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "./ui/dropdown-menu"
import { Checkbox } from "./ui/checkbox"

const STROKE_WIDTH = 2

// Spinner component
const Spinner = ({ className, ...props }: React.ComponentProps<"svg">) => {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
    />
  )
}

// Spinner with text
const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <Spinner />
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
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
  colSpan,
  rowSpan,
  ...props
}: React.ComponentProps<typeof TableHead> & {
  colSpan?: number
  rowSpan?: number
}) => (
  <TableHead
    className={`border-r border-l ${className}`}
    colSpan={colSpan}
    rowSpan={rowSpan}
    {...props}
  >
    {children}
  </TableHead>
)

// Search filter type
type SearchFilter = "all" | "staff_id" | "name" | "team" | "department"

// Filter state type
type FilterState = {
  jlpt_nat_test: string[]
  jlpt_highest_level: string[]
  other_japanese_level: string[]
  preferred_learning_group: string[]
  current_communication_level: string[]
  target_1_jlpt_nat_level: string[]
  target_1_communication_level: string[]
  target_2_jlpt_nat_level: string[]
  target_2_communication_level: string[]
  current_learning_level: string[]
  learning_method: string[]
  want_to_sit_exam: string[]
  exam_target_level: string[]
  confidence_level: string[]
}

export function CurrentTargetContainer({
  searchPlaceholder = "Search employees...",
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  // Row selection state - tracks ALL filtered employees, not just current page
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // State for create/edit drawers
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] =
    useState<EmployeeJapaneseLevel | null>(null)
  const [selectedEmployeeForProfile, setSelectedEmployeeForProfile] =
    useState<Employee | null>(null)
  const [isEditTargetDatesDrawerOpen, setIsEditTargetDatesDrawerOpen] =
    useState(false)
  const [isCreateTargetDatesDrawerOpen, setIsCreateTargetDatesDrawerOpen] =
    useState(false)

  // Column visibility state for Japanese data sections
  const [selectedSection, setSelectedSection] = useState<string>("all")

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    jlpt_nat_test: [],
    jlpt_highest_level: [],
    other_japanese_level: [],
    preferred_learning_group: [],
    current_communication_level: [],
    target_1_jlpt_nat_level: [],
    target_1_communication_level: [],
    target_2_jlpt_nat_level: [],
    target_2_communication_level: [],
    current_learning_level: [],
    learning_method: [],
    want_to_sit_exam: [],
    exam_target_level: [],
    confidence_level: [],
  })

  // Helper to toggle filter values
  const toggleFilter = (field: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[field]
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) }
      } else {
        return { ...prev, [field]: [...current, value] }
      }
    })
    setCurrentPage(1)
  }

  // Helper to clear all filters
  const clearAllFilters = () => {
    setFilters({
      jlpt_nat_test: [],
      jlpt_highest_level: [],
      other_japanese_level: [],
      preferred_learning_group: [],
      current_communication_level: [],
      target_1_jlpt_nat_level: [],
      target_1_communication_level: [],
      target_2_jlpt_nat_level: [],
      target_2_communication_level: [],
      current_learning_level: [],
      learning_method: [],
      want_to_sit_exam: [],
      exam_target_level: [],
      confidence_level: [],
    })
    setCurrentPage(1)
  }

  // Search input ref for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null)

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
  const [employeeProfileMap, setEmployeeProfileMap] = useState<
    Map<string, EmployeeJapaneseLevel>
  >(new Map())

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([
        fetch_EmployeeData(),
        fetch_TargetDates(),
        fetch_EmployeeJapaneseLevel(),
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
      const filteredEmployees = employee_data.filter((employee: Employee) => {
        return employeeProfileMap.has(employee.id)
      })
      setEmployees(filteredEmployees)
    }
  }, [employee_data, employeeProfileMap])

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    (filterArray) => filterArray.length > 0
  )

  // Keyboard shortcut for search focus (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Keyboard shortcut for clearing filters (Escape key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not in an input field
      const target = e.target as HTMLElement
      if (
        e.key === "Escape" &&
        !target.closest("input") &&
        !target.closest("textarea") &&
        hasActiveFilters
      ) {
        e.preventDefault()
        clearAllFilters()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [hasActiveFilters])

  // Helper function to get Japanese level data by employee ID
  const getJapaneseLevelByEmployeeId = (
    employeeId: string
  ): EmployeeJapaneseLevel | undefined => {
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
    const dateObj = typeof date === "string" ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return "TBD"
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    })
  }

  // Handle successful create/update
  const handleDataChanged = () => {
    setRefreshKey((prev) => prev + 1)
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

  // Clear all selections
  const handleClearSelection = () => {
    setRowSelection({})
  }

  // Check if field needs truncation (communication fields + current_learning_level)
  const isTruncatableField = (field: string): boolean => {
    return [
      "current_communication_level",
      "target_1_communication_level",
      "target_2_communication_level",
      "current_learning_level", // Added this field
    ].includes(field)
  }

  // Employee Headers
  const employeeHeaders = [
    // { field: "select", header_name: "" },
    { field: "Sr", header_name: "Sr" },
    { field: "staff_id", header_name: "Staff ID" },
    { field: "name", header_name: "Name" },
    { field: "email", header_name: "Email" },
    { field: "position", header_name: "Post" },
    { field: "team", header_name: "Team" },
    { field: "dept", header_name: "Dept" },
    { field: "jlpt_nat_test", header_name: "JLPT / NAT Test" },
  ]

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
          {
            field: "jlpt_highest_level",
            header_name: `JLPT Highest Level (Certified)`,
          },
          {
            field: "other_japanese_level",
            header_name: `Other Highest Japanese Level (Certified)`,
          },
          {
            field: "preferred_learning_group",
            header_name: "Preferred Joining Group & Level",
          },
        ],
      },
      {
        groupName: "Current",
        sectionKey: "current",
        children: [
          {
            field: "current_communication_level",
            header_name: "Communication Level",
          },
        ],
      },
      {
        groupName: `Target Level to be on ${target1Date}`,
        sectionKey: "target_levels",
        children: [
          {
            field: "target_1_jlpt_nat_level",
            header_name: "JLPT / NAT Test Level",
          },
          {
            field: "target_1_communication_level",
            header_name: "Communication Level",
          },
        ],
      },
      {
        groupName: `Target Level to be on ${target2Date}`,
        sectionKey: "target_levels",
        children: [
          {
            field: "target_2_jlpt_nat_level",
            header_name: "JLPT / NAT Test Level",
          },
          {
            field: "target_2_communication_level",
            header_name: "Communication Level",
          },
        ],
      },
      {
        groupName: "Current Learning Level and Method",
        sectionKey: "learning_method",
        children: [
          {
            field: "current_learning_level",
            header_name: "Japanese Level (Current Learning)",
          },
          {
            field: "learning_method",
            header_name: "Learning Method",
          },
        ],
      },
      {
        groupName: `JLPT Exam Target`,
        sectionKey: "exam_target",
        children: [
          {
            field: `want_to_sit_exam`,
            header_name: `Want to sit JLPT exam on ${examDateStr}`,
          },
          { field: "exam_target_level", header_name: "If Yes, Which Level?" },
          {
            field: "confidence_level",
            header_name: "Confidence Level to Pass Exam",
          },
        ],
      },
    ]
  }

  const firstTargetDate = getTargetDatesData(0)
  const allJapaneseHeaderGroups = getJapaneseHeaderGroups(firstTargetDate)

  // Filter visible Japanese header groups based on selected section
  const visibleJapaneseHeaderGroups = allJapaneseHeaderGroups.filter(
    (group) => {
      if (selectedSection === "all") return true
      return group.sectionKey === selectedSection
    }
  )

  // Flatten for data mapping
  const flattenedJapaneseHeaders = visibleJapaneseHeaderGroups.flatMap(
    (group) => group.children
  )

  // Helper to get unique values for a field
  const getUniqueValues = (field: keyof FilterState): string[] => {
    const values = new Set<string>()
    employees.forEach((employee) => {
      const jpLevel = getJapaneseLevelByEmployeeId(employee.id)
      let value: string | null = "-"
      switch (field) {
        case "jlpt_nat_test":
          value = jpLevel?.jlptNatTest || "-"
          break
        case "jlpt_highest_level":
          value = jpLevel?.jlptHighestLevel || "-"
          break
        case "other_japanese_level":
          value = jpLevel?.otherJapaneseLevel || "-"
          break
        case "preferred_learning_group":
          value = jpLevel?.preferredLearningGroup || "-"
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
        case "current_communication_level":
          value = jpLevel?.currentCommunicationLevel || "-"
          break
        case "current_learning_level":
          value = jpLevel?.currentLearningLevel || "-"
          break
        case "learning_method":
          value = jpLevel?.learningMethod || "-"
          break
        case "want_to_sit_exam":
          value =
            jpLevel?.wantToSitExam === true
              ? "Yes"
              : jpLevel?.wantToSitExam === false
                ? "No"
                : "-"
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
      if (value) values.add(value)
    })
    return Array.from(values).sort()
  }

  // Enhanced search function with filter support - returns ALL filtered employees
  const filteredEmployees = employees.filter((employee) => {
    const jpLevel = getJapaneseLevelByEmployeeId(employee.id)

    // Apply search term filter first
    const searchMatch = (() => {
      if (!searchTerm.trim()) return true
      const searchLower = searchTerm.toLowerCase().trim()
      switch (searchFilter) {
        case "staff_id":
          return employee.id.toLowerCase().includes(searchLower)
        case "name":
          return employee.name.toLowerCase().includes(searchLower)
        case "team":
          return (employee.team || "").toLowerCase().includes(searchLower)
        case "department":
          return (employee.dept_dat || "").toLowerCase().includes(searchLower)
        case "all":
        default:
          return (
            employee.id.toLowerCase().includes(searchLower) ||
            employee.name.toLowerCase().includes(searchLower) ||
            (employee.email &&
              employee.email.toLowerCase().includes(searchLower)) ||
            (employee.team &&
              employee.team.toLowerCase().includes(searchLower)) ||
            (employee.dept_dat &&
              employee.dept_dat.toLowerCase().includes(searchLower))
          )
      }
    })()

    // Apply custom filters
    const filterMatch = Object.entries(filters).every(
      ([field, selectedValues]) => {
        if (selectedValues.length === 0) return true

        let value: string | null = "-"
        switch (field as keyof FilterState) {
          case "jlpt_nat_test":
            value = jpLevel?.jlptNatTest || "-"
            break
          case "jlpt_highest_level":
            value = jpLevel?.jlptHighestLevel || "-"
            break
          case "other_japanese_level":
            value = jpLevel?.otherJapaneseLevel || "-"
            break
          case "preferred_learning_group":
            value = jpLevel?.preferredLearningGroup || "-"
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
          case "current_communication_level":
            value = jpLevel?.currentCommunicationLevel || "-"
            break
          case "current_learning_level":
            value = jpLevel?.currentLearningLevel || "-"
            break
          case "learning_method":
            value = jpLevel?.learningMethod || "-"
            break
          case "want_to_sit_exam":
            value =
              jpLevel?.wantToSitExam === true
                ? "Yes"
                : jpLevel?.wantToSitExam === false
                  ? "No"
                  : "-"
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
        return selectedValues.includes(value)
      }
    )

    return searchMatch && filterMatch
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

  // Handle select all - selects ALL filtered employees across all pages
  const handleSelectAll = () => {
    const allSelected = filteredEmployees.every(
      (employee) => rowSelection[employee.id.toString()]
    )

    if (allSelected) {
      setRowSelection({})
    } else {
      const newSelection: Record<string, boolean> = {}
      filteredEmployees.forEach((employee) => {
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

  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  const getSelectedEmployees = (): Employee[] => {
    const selectedIds = Object.keys(rowSelection).filter(
      (key) => rowSelection[key] === true
    )
    return employees.filter((employee) =>
      selectedIds.includes(employee.id.toString())
    )
  }

  // Check if all filtered employees are selected (for the header checkbox)
  const areAllFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((employee) => rowSelection[employee.id.toString()])

  const handleBulkDeleteClick = () => {
    const selected = getSelectedEmployees()
    if (selected.length === 0) {
      alert("Please select at least one employee to delete.")
      return
    }
    setBulkDeleteDialogOpen(true)
  }

  const handleBulkDeleteConfirm = async () => {
    const selectedEmployees = getSelectedEmployees()

    if (selectedEmployees.length === 0) {
      alert("No employees selected.")
      return
    }

    setIsDeleting(true)
    try {
      const profileIds: number[] = []

      selectedEmployees.forEach((emp) => {
        const profile = employeeProfileMap.get(emp.id)
        if (profile?.id) {
          profileIds.push(profile.id)
        }
      })

      if (profileIds.length === 0) {
        alert("No Japanese profile data found for the selected employees.")
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

      // Update pagination after deletion
      const newTotalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      } else if (newTotalPages === 0) {
        setCurrentPage(1)
      }
    } catch (error) {
      console.error("❌ Bulk delete failed:", error)
      alert("Failed to delete Japanese profile data. Please try again.")
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
    .filter((emp: Employee) => !employeeProfileMap.has(emp.id))
    .map((emp: Employee) => ({
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

  // Section options for Select component
  const sectionOptions = [
    { value: "all", label: "All Sections" },
    ...Object.entries(sectionDisplayNames).map(([key, label]) => ({
      value: key,
      label: label,
    })),
  ]

  // Handle section selection with Select
  const handleSectionSelect = (value: string) => {
    setSelectedSection(value)
  }

  // Determine if selection bar is active
  const isSelectionActive = selectedCount > 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner text="Loading current target data..." />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 pt-4 pb-6">
        <CardContent className="px-4">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-2">
              <InputGroup className="max-w-[500px] flex-1">
                <InputGroupInput
                  ref={searchInputRef}
                  placeholder="Search by Staff ID, Name, Team, or Department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <InputGroupAddon>
                  <HugeiconsIcon
                    icon={Search01Icon}
                    strokeWidth={STROKE_WIDTH}
                    className="h-4 w-4 text-muted-foreground"
                  />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <Kbd>Ctrl + K</Kbd>
                </InputGroupAddon>
              </InputGroup>
            </div>
            <div className="flex gap-2">
              {/* Property Visibility Dropdown */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <HugeiconsIcon
                          icon={EyeIcon}
                          strokeWidth={2}
                          className="h-4 w-4"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Property Visibility</p>
                  </TooltipContent>
                </Tooltip>

                <DropdownMenuContent className="w-72">
                  {sectionOptions.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={selectedSection === option.value}
                      onCheckedChange={() => handleSectionSelect(option.value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Edit Target Dates Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleEditTargetDates}
                  >
                    <HugeiconsIcon
                      icon={CalendarSyncIcon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Target Dates</p>
                </TooltipContent>
              </Tooltip>

              {/* Filter Dropdown with indicator */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="relative h-9 w-9"
                      >
                        <HugeiconsIcon
                          icon={FilterMailIcon}
                          strokeWidth={2}
                          className="h-4 w-4"
                        />
                        {hasActiveFilters && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background bg-red-600" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter</p>
                  </TooltipContent>
                </Tooltip>

                <DropdownMenuContent className="w-80">

                  {/* JLPT / NAT Test */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      JLPT / NAT Test
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {getUniqueValues("jlpt_nat_test").map((value) => (
                          <DropdownMenuCheckboxItem
                            key={value}
                            checked={filters.jlpt_nat_test.includes(value)}
                            onCheckedChange={() =>
                              toggleFilter("jlpt_nat_test", value)
                            }
                            onSelect={(e) => e.preventDefault()}
                          >
                            {value}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Certified Level */}
                  <DropdownMenuLabel>Certified Level</DropdownMenuLabel>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      JLPT Highest Level (Certified)
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {getUniqueValues("jlpt_highest_level").map((value) => (
                          <DropdownMenuCheckboxItem
                            key={value}
                            checked={filters.jlpt_highest_level.includes(value)}
                            onCheckedChange={() =>
                              toggleFilter("jlpt_highest_level", value)
                            }
                            onSelect={(e) => e.preventDefault()}
                          >
                            {value}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Other Highest Japanese Level (Certified)
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {getUniqueValues("other_japanese_level").map(
                          (value) => (
                            <DropdownMenuCheckboxItem
                              key={value}
                              checked={filters.other_japanese_level.includes(
                                value
                              )}
                              onCheckedChange={() =>
                                toggleFilter("other_japanese_level", value)
                              }
                              onSelect={(e) => e.preventDefault()}
                            >
                              {value}
                            </DropdownMenuCheckboxItem>
                          )
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Preferred Joining Group & Level
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {getUniqueValues("preferred_learning_group").map(
                          (value) => (
                            <DropdownMenuCheckboxItem
                              key={value}
                              checked={filters.preferred_learning_group.includes(
                                value
                              )}
                              onCheckedChange={() =>
                                toggleFilter("preferred_learning_group", value)
                              }
                              onSelect={(e) => e.preventDefault()}
                            >
                              {value}
                            </DropdownMenuCheckboxItem>
                          )
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Current */}
                  <DropdownMenuLabel>Current</DropdownMenuLabel>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Communication Level
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="max-w-[250px]">
                        {getUniqueValues("current_communication_level").map(
                          (value) => (
                            <DropdownMenuCheckboxItem
                              key={value}
                              checked={filters.current_communication_level.includes(
                                value
                              )}
                              onCheckedChange={() =>
                                toggleFilter(
                                  "current_communication_level",
                                  value
                                )
                              }
                              onSelect={(e) => e.preventDefault()}
                            >
                              {value !== "-" ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="block truncate">
                                        {value}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-sm">{value}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                value
                              )}
                            </DropdownMenuCheckboxItem>
                          )
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Target Level to be on (Date 1) */}
                  <DropdownMenuLabel>
                    Target Level to be on{" "}
                    {firstTargetDate?.target1Date
                      ? formatGroupDate(firstTargetDate.target1Date)
                      : "(Date 1)"}
                  </DropdownMenuLabel>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      JLPT / NAT Test Level
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {getUniqueValues("target_1_jlpt_nat_level").map(
                          (value) => (
                            <DropdownMenuCheckboxItem
                              key={value}
                              checked={filters.target_1_jlpt_nat_level.includes(
                                value
                              )}
                              onCheckedChange={() =>
                                toggleFilter("target_1_jlpt_nat_level", value)
                              }
                              onSelect={(e) => e.preventDefault()}
                            >
                              {value}
                            </DropdownMenuCheckboxItem>
                          )
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Communication Level
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="max-w-[250px]">
                        {getUniqueValues("target_1_communication_level").map(
                          (value) => (
                            <DropdownMenuCheckboxItem
                              key={value}
                              checked={filters.target_1_communication_level.includes(
                                value
                              )}
                              onCheckedChange={() =>
                                toggleFilter(
                                  "target_1_communication_level",
                                  value
                                )
                              }
                              onSelect={(e) => e.preventDefault()}
                            >
                              {value !== "-" ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="block truncate">
                                        {value}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-sm">{value}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                value
                              )}
                            </DropdownMenuCheckboxItem>
                          )
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Target Level to be on (Date 2) */}
                  <DropdownMenuLabel>
                    Target Level to be on{" "}
                    {firstTargetDate?.target2Date
                      ? formatGroupDate(firstTargetDate.target2Date)
                      : "(Date 2)"}
                  </DropdownMenuLabel>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      JLPT / NAT Test Level
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {getUniqueValues("target_2_jlpt_nat_level").map(
                          (value) => (
                            <DropdownMenuCheckboxItem
                              key={value}
                              checked={filters.target_2_jlpt_nat_level.includes(
                                value
                              )}
                              onCheckedChange={() =>
                                toggleFilter("target_2_jlpt_nat_level", value)
                              }
                              onSelect={(e) => e.preventDefault()}
                            >
                              {value}
                            </DropdownMenuCheckboxItem>
                          )
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Communication Level
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="max-w-[250px]">
                        {getUniqueValues("target_2_communication_level").map(
                          (value) => (
                            <DropdownMenuCheckboxItem
                              key={value}
                              checked={filters.target_2_communication_level.includes(
                                value
                              )}
                              onCheckedChange={() =>
                                toggleFilter(
                                  "target_2_communication_level",
                                  value
                                )
                              }
                              onSelect={(e) => e.preventDefault()}
                            >
                              {value !== "-" ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="block truncate">
                                        {value}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-sm">{value}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                value
                              )}
                            </DropdownMenuCheckboxItem>
                          )
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Current Learning Level and Method */}
                  <DropdownMenuLabel>
                    Current Learning Level and Method
                  </DropdownMenuLabel>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Japanese Level (Current Learning)
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="max-w-[250px]">
                        {getUniqueValues("current_learning_level").map(
                          (value) => (
                            <DropdownMenuCheckboxItem
                              key={value}
                              checked={filters.current_learning_level.includes(
                                value
                              )}
                              onCheckedChange={() =>
                                toggleFilter("current_learning_level", value)
                              }
                              onSelect={(e) => e.preventDefault()}
                            >
                              {value !== "-" ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="block truncate">
                                        {value}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-sm">{value}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                value
                              )}
                            </DropdownMenuCheckboxItem>
                          )
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Learning Method
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {getUniqueValues("learning_method").map((value) => (
                          <DropdownMenuCheckboxItem
                            key={value}
                            checked={filters.learning_method.includes(value)}
                            onCheckedChange={() =>
                              toggleFilter("learning_method", value)
                            }
                            onSelect={(e) => e.preventDefault()}
                          >
                            {value}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* JLPT Exam Target (Exam Date) */}
                  <DropdownMenuLabel>JLPT Exam Target</DropdownMenuLabel>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Want to sit JLPT exam{" "}
                      {firstTargetDate?.examDate
                        ? `(${formatGroupDate(firstTargetDate.examDate)})`
                        : "(Exam Date)"}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {getUniqueValues("want_to_sit_exam").map((value) => (
                          <DropdownMenuCheckboxItem
                            key={value}
                            checked={filters.want_to_sit_exam.includes(value)}
                            onCheckedChange={() =>
                              toggleFilter("want_to_sit_exam", value)
                            }
                            onSelect={(e) => e.preventDefault()}
                          >
                            {value}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      If Yes, Which Level?
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {getUniqueValues("exam_target_level").map((value) => (
                          <DropdownMenuCheckboxItem
                            key={value}
                            checked={filters.exam_target_level.includes(value)}
                            onCheckedChange={() =>
                              toggleFilter("exam_target_level", value)
                            }
                            onSelect={(e) => e.preventDefault()}
                          >
                            {value}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Confidence Level to Pass Exam
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {getUniqueValues("confidence_level").map((value) => (
                          <DropdownMenuCheckboxItem
                            key={value}
                            checked={filters.confidence_level.includes(value)}
                            onCheckedChange={() =>
                              toggleFilter("confidence_level", value)
                            }
                            onSelect={(e) => e.preventDefault()}
                          >
                            {value}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Clear Filters Button - This will close the dropdown */}
                  <DropdownMenuItem
                    onClick={clearAllFilters}
                    variant="destructive"
                    className="gap-2"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                    Clear All Filters
                    <DropdownMenuShortcut>
                      <Kbd>Esc</Kbd>
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
            className={cn("relative overflow-x-auto rounded-md border")}
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
                        "text-center align-middle whitespace-nowrap",
                        header.field === "select" && "w-10 min-w-[40px]"
                      )}
                      rowSpan={2}
                    >
                      {header.field === "select" ? (
                        <Checkbox
                          checked={areAllFilteredSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      ) : (
                        header.header_name
                      )}
                    </BorderedTableHead>
                  ))}
                  {visibleJapaneseHeaderGroups.map((group, index) => (
                    <BorderedTableHead
                      key={index}
                      className={cn(
                        "bg-muted/30 text-center align-middle whitespace-nowrap",
                        (group.groupName.includes("Target Level") ||
                          group.groupName.includes("JLPT Exam Target")) &&
                          "cursor-pointer transition-colors hover:bg-muted/50"
                      )}
                      colSpan={group.children.length}
                      onClick={() => {
                        if (
                          group.groupName.includes("Target Level") ||
                          group.groupName.includes("JLPT Exam Target")
                        ) {
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
                      className={cn(
                        "align-middle whitespace-nowrap",
                        (header.field === "current_communication_level" ||
                          header.field === "target_1_communication_level" ||
                          header.field === "target_2_communication_level" ||
                          header.field === "current_learning_level") &&
                          "w-48"
                      )}
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
                      {searchTerm
                        ? `No employees found matching "${searchTerm}"`
                        : "No employees with Japanese profile data found"}
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
                        {/* <BorderedTableCell
                          className="w-10 min-w-[40px]"
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
                        </BorderedTableCell> */}
                        <BorderedTableCell selected={isSelected}>
                          {globalIndex}
                        </BorderedTableCell>
                        <BorderedTableCell
                          selected={isSelected}
                          className="text-sm"
                        >
                          {employee.id || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell
                          selected={isSelected}
                          className="font-medium"
                        >
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
                                value =
                                  jpLevel?.currentCommunicationLevel || "-"
                                break
                              case "target_1_jlpt_nat_level":
                                value = jpLevel?.target1JlptNatLevel || "-"
                                break
                              case "target_1_communication_level":
                                value =
                                  jpLevel?.target1CommunicationLevel || "-"
                                break
                              case "target_2_jlpt_nat_level":
                                value = jpLevel?.target2JlptNatLevel || "-"
                                break
                              case "target_2_communication_level":
                                value =
                                  jpLevel?.target2CommunicationLevel || "-"
                                break
                              case "current_learning_level":
                                value = jpLevel?.currentLearningLevel || "-"
                                break
                              case "learning_method":
                                value = jpLevel?.learningMethod || "-"
                                break
                              case "want_to_sit_exam":
                                value =
                                  jpLevel?.wantToSitExam === true
                                    ? "Yes"
                                    : jpLevel?.wantToSitExam === false
                                      ? "No"
                                      : "-"
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

                            const displayValue = value || "-"
                            const isTruncatable = isTruncatableField(
                              header.field
                            )

                            return (
                              <BorderedTableCell
                                key={header.field}
                                selected={isSelected}
                                className={cn(
                                  isTruncatable && "max-w-[192px]",
                                  (header.field ===
                                    "current_communication_level" ||
                                    header.field ===
                                      "target_1_communication_level" ||
                                    header.field ===
                                      "target_2_communication_level" ||
                                    header.field ===
                                      "current_learning_level") &&
                                    "w-48"
                                )}
                              >
                                {isTruncatable && displayValue !== "-" ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="block truncate">
                                          {displayValue}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-sm">
                                          {displayValue}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  displayValue
                                )}
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

          {/* Selection Bar */}
          {isSelectionActive && (
            <>
              <div className="fixed top-5 left-1/2 z-50 w-auto max-w-[90%] min-w-[300px] -translate-x-1/2">
                <div className="animate-scale-up rounded-md border bg-white px-4 py-2 shadow-md">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={areAllFilteredSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                      <span className="text-sm font-medium whitespace-nowrap">
                        {selectedCount} employee
                        {selectedCount > 1 ? "s are" : " is"} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDeleteClick}
                        disabled={isDeleting}
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          strokeWidth={2}
                          className="mr-1 h-4 w-4"
                        />
                        Delete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSelection}
                        className="px-2"
                      >
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          strokeWidth={2}
                          className="h-4 w-4"
                        />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div
            className={cn(
              "mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            )}
          >
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
              {filteredEmployees.length} employees with Japanese language data
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
            <DialogTitle>Confirm Delete Japanese Profile Data</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to delete the{" "}
                  <strong>Japanese profile data</strong> for{" "}
                  <strong>{selectedCount}</strong> selected employee
                  {selectedCount > 1 ? "s" : ""}?
                </p>
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  <p className="font-medium">⚠️ Important Note:</p>
                  <p className="mt-1">
                    This action will{" "}
                    <strong>
                      only delete the Japanese language profile data
                    </strong>{" "}
                    (JLPT levels, communication levels, learning methods, exam
                    targets, etc.).
                  </p>
                  <p className="mt-1">
                    The <strong>employee information</strong> (name, ID, email,
                    department, etc.) will <strong>remain unchanged</strong>.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. The employees will no longer
                  appear in this view until new Japanese profile data is added.
                </p>
              </div>
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
