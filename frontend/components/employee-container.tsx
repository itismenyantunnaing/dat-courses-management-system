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
import { CardContent, Card } from "@/components/ui/card"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Delete02Icon,
  UserAdd01Icon,
  Cancel01Icon,
  PlusSignIcon,
  UserGroupIcon,
  DashboardBrowsingIcon,
  DatabaseIcon,
  Calendar01Icon,
  ListViewIcon,
  GridViewIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Edit03Icon,
  Loading03Icon,
  FilterMailIcon,
} from "@hugeicons/core-free-icons"
import React from "react"
import { mainStore } from "@/store/mainStore"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { EditEmployeeDrawer } from "@/components/drawers/employees/editEmployee-drawer"
import { CreateEmployeeDrawer } from "@/components/drawers/employees/createEmployee-drawer"
import { AddDivDeptTeamDialog } from "@/components/dialogs/createDivDeptTeam-dialog"
import { EditDivDeptTeamDialog } from "@/components/dialogs/editDivDeptTeam-dialog"
import { Employee } from "@/types/employee"
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

const STROKE_WIDTH = 2

// Spinner component
const Spinner = ({ className, ...props }: React.ComponentProps<"svg">) => {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
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

// Status badge styling
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950"
    case "inactive":
      return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-950"
    default:
      return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-950"
  }
}

const statusLabels = {
  active: "Active",
  inactive: "Inactive",
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
  ...props
}: React.ComponentProps<typeof TableHead>) => (
  <TableHead className={`border-r border-l ${className}`} {...props}>
    {children}
  </TableHead>
)

// Define the tabs configuration with icons
const VIEW_TABS = [
  { id: "employees", label: "Employees", icon: UserGroupIcon },
  { id: "divisions", label: "Divisions", icon: DashboardBrowsingIcon },
  { id: "departments", label: "Departments", icon: DatabaseIcon },
  { id: "teams", label: "Teams", icon: Calendar01Icon },
] as const

type ViewTab = (typeof VIEW_TABS)[number]["id"]

type ViewMode = "list" | "card"

// Filter state type
type FilterState = {
  division: string[]
  department: string[]
  team: string[]
  status: string[]
  role: string[]
}

// Helper function to get initials
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function EmployeeContainer({
  searchPlaceholder = "Search employees...",
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeView, setActiveView] = useState<ViewTab>("employees")
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    division: [],
    department: [],
    team: [],
    status: [],
    role: [],
  })

  // State for drill-down view
  const [selectedItem, setSelectedItem] = useState<string>("")
  const [isDrillDown, setIsDrillDown] = useState(false)
  const [drillDownPage, setDrillDownPage] = useState(1)
  const [drilldownSearchTerm, setDrilldownSearchTerm] = useState("")

  // Search input refs for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null)
  const drilldownSearchInputRef = useRef<HTMLInputElement>(null)

  // State for row selection
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  // State for bulk delete dialog
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // State for edit drawer
  const [isNewEmployeeDrawerOpen, setIsNewEmployeeDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  )

  // State for Add/Edit Div/Dept/Team
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<string>("")
  const [dialogItemType, setDialogItemType] = useState<
    "division" | "department" | "team"
  >("division")

  // Use store directly - no local state duplication
  const {
    fetch_EmployeeData,
    fetch_divisions,
    fetch_dat_departments,
    fetch_teams,
    fetch_roles,
    employee_data,
    delete_EmployeeData,
    isDeleting: isStoreDeleting,
    add_division,
    add_dat_department,
    add_team,
    update_division,
    update_department,
    update_team,
    divisions,
    dat_departments,
    teams,
  } = mainStore()

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetch_EmployeeData()
      await fetch_divisions()
      await fetch_dat_departments()
      await fetch_teams()
      await fetch_roles()
      setIsLoading(false)
    }
    loadData()
  }, [fetch_EmployeeData])

  // Check if any filters are active
  const hasActiveFilters =
    Object.values(filters).some((filterArray) => filterArray.length > 0) ||
    statusFilter !== "all"

  // Keyboard shortcut for search focus (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        // Focus the appropriate search input based on the current view
        if (isDrillDown) {
          drilldownSearchInputRef.current?.focus()
        } else {
          searchInputRef.current?.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isDrillDown])

  // Keyboard shortcut for clearing filters (Escape key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not in an input field and not in drilldown
      const target = e.target as HTMLElement
      if (
        e.key === "Escape" &&
        !target.closest("input") &&
        !target.closest("textarea") &&
        !isDrillDown &&
        hasActiveFilters
      ) {
        e.preventDefault()
        clearAllFilters()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isDrillDown, hasActiveFilters])

  // Column headers (only used for table view)
  const employeeHeaders = [
    { field: "select", header_name: "" },
    { field: "sr", header_name: "Sr." },
    { field: "div", header_name: "Div" },
    { field: "staff_id", header_name: "Staff ID" },
    { field: "name", header_name: "Name" },
    { field: "email", header_name: "Email" },
    { field: "doorlog", header_name: "DoorLog" },
    { field: "dept", header_name: "Dept" },
    { field: "team", header_name: "Team" },
    { field: "status", header_name: "Status" },
    { field: "role", header_name: "Role" },
  ]

  // Get unique values for each view
  const getUniqueValues = (field: keyof Employee) => {
    const values = new Set<string>()
    employee_data.forEach((employee) => {
      const value = employee[field] as string
      if (value && value.trim()) {
        values.add(value.trim())
      }
    })
    return Array.from(values).sort()
  }

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
      division: [],
      department: [],
      team: [],
      status: [],
      role: [],
    })
    setCurrentPage(1)
  }

  // Get unique values for filter fields
  const getFilterUniqueValues = (field: keyof Employee) => {
    const values = new Set<string>()
    employee_data.forEach((employee) => {
      const value = employee[field] as string
      if (value && value.trim()) {
        values.add(value.trim())
      }
    })
    return Array.from(values).sort()
  }

  // Get employees by category (division, department, or team)
  const getEmployeesByCategory = (category: string, field: keyof Employee) => {
    return employee_data.filter((employee) => employee[field] === category)
  }

  // Get employees with empty category
  const getEmployeesWithEmptyCategory = (field: keyof Employee) => {
    return employee_data.filter((employee) => {
      const value = employee[field] as string
      return !value || value.trim() === ""
    })
  }

  // Filter employees based on active view
  const getFilteredData = () => {
    const data = employee_data

    // Apply view filter
    if (activeView === "divisions") {
      const divs = getUniqueValues("div_name")
      const filteredDivs = searchTerm.trim()
        ? divs.filter((item) =>
            item.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : divs
      // Add "Others" category if there are employees with empty div_name
      const othersCount = getEmployeesWithEmptyCategory("div_name").length
      if (othersCount > 0) {
        return [...filteredDivs, "Others"]
      }
      return filteredDivs
    } else if (activeView === "departments") {
      const depts = getUniqueValues("dept_dat")
      const filteredDepts = searchTerm.trim()
        ? depts.filter((item) =>
            item.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : depts
      // Add "Others" category if there are employees with empty dept_dat
      const othersCount = getEmployeesWithEmptyCategory("dept_dat").length
      if (othersCount > 0) {
        return [...filteredDepts, "Others"]
      }
      return filteredDepts
    } else if (activeView === "teams") {
      const teams = getUniqueValues("team")
      const filteredTeams = searchTerm.trim()
        ? teams.filter((item) =>
            item.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : teams
      // Add "Others" category if there are employees with empty team
      const othersCount = getEmployeesWithEmptyCategory("team").length
      if (othersCount > 0) {
        return [...filteredTeams, "Others"]
      }
      return filteredTeams
    }

    // Default: employees view - APPLY ALL FILTERS HERE
    return data.filter((employee) => {
      // First apply search filter
      let matchesSearch = true
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()
        const name = (employee.name || "").toLowerCase()
        const id = (employee.id || "").toLowerCase()
        const email = (employee.email || "").toLowerCase()
        const div_name = (employee.div_name || "").toLowerCase()
        const dept_dat = (employee.dept_dat || "").toLowerCase()
        const team = (employee.team || "").toLowerCase()
        const role = (employee.role || "").toLowerCase()
        const status = (
          employee.emp_status ||
          employee.status ||
          ""
        ).toLowerCase()
        matchesSearch =
          name.includes(searchLower) ||
          id.includes(searchLower) ||
          email.includes(searchLower) ||
          div_name.includes(searchLower) ||
          dept_dat.includes(searchLower) ||
          team.includes(searchLower) ||
          role.includes(searchLower) ||
          status.includes(searchLower)
      }

      // Apply status filter (legacy)
      const matchesStatus =
        statusFilter === "all" || employee.emp_status === statusFilter

      // Apply custom filters
      const filterMatch = Object.entries(filters).every(
        ([field, selectedValues]) => {
          if (selectedValues.length === 0) return true

          let value: string = ""
          switch (field) {
            case "division":
              value = employee.div_name || ""
              break
            case "department":
              value = employee.dept_dat || ""
              break
            case "team":
              value = employee.team || ""
              break
            case "status":
              value = employee.emp_status || employee.status || ""
              break
            case "role":
              value = employee.role || ""
              break
            default:
              return true
          }
          return selectedValues.includes(value)
        }
      )

      return matchesSearch && matchesStatus && filterMatch
    })
  }

  // Get the data based on active view
  const viewData = getFilteredData()

  // For non-employee views, we show list items (divisions, departments, teams)
  const isListView = activeView !== "employees"
  const listItems = isListView ? (viewData as string[]) : []
  const filteredEmployees = isListView
    ? employee_data
    : (viewData as Employee[])

  // Calculate pagination for employees view
  const totalPages = isListView
    ? Math.ceil(listItems.length / itemsPerPage)
    : Math.ceil(filteredEmployees.length / itemsPerPage)

  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEmployees = isListView
    ? listItems.slice(startIndex, startIndex + itemsPerPage)
    : filteredEmployees.slice(startIndex, startIndex + itemsPerPage)

  const handleNewEmployee = () => {
    setIsNewEmployeeDrawerOpen(true)
  }

  const handleNewItem = () => {
    setAddDialogOpen(true)
  }

  // Handle edit item - opens edit dialog for division/department/team
  const handleEditItem = (item: string) => {
    // Don't allow editing "Others" category
    if (item === "Others") return
    setSelectedItemForEdit(item)
    // Set the dialog item type based on the active view
    setDialogItemType(
      activeView === "divisions"
        ? "division"
        : activeView === "departments"
          ? "department"
          : "team"
    )
    setEditDialogOpen(true)
  }

  const handleAddItem = async (name: string, parentId?: number) => {
    let result = null

    if (dialogItemType === "division") {
      result = await add_division(name)
    } else if (dialogItemType === "department") {
      if (!parentId) {
        alert("Division ID is required")
        return
      }
      result = await add_dat_department(parentId, name)
    } else if (dialogItemType === "team") {
      if (!parentId) {
        alert("Department ID is required")
        return
      }
      result = await add_team(parentId, name)
    }

    if (result?.success) {
      alert(`✅ ${dialogItemType} "${name}" added successfully!`)
      await fetch_EmployeeData()
    } else {
      alert(`❌ Failed to add: ${result?.error || "Unknown error"}`)
    }
  }

  // Updated handleEditItemSubmit with proper update logic
  const handleEditItemSubmit = async (
    oldName: string,
    newName: string,
    parentId?: number
  ) => {
    console.log(`🔄 Updating ${dialogItemType}:`, {
      oldName,
      newName,
      parentId,
    })

    let result = null

    try {
      if (dialogItemType === "division") {
        // Find the division ID
        const division = divisions.find((d: any) => d.divisionName === oldName)
        if (!division) {
          alert("❌ Division not found")
          return
        }
        result = await update_division(division.id, newName)
      } else if (dialogItemType === "department") {
        // Find the department ID
        const department = dat_departments.find(
          (d: any) => d.deptName === oldName
        )
        if (!department) {
          alert("❌ Department not found")
          return
        }
        // Department update needs divisionId and deptName
        if (!parentId) {
          alert("❌ Division ID is required for department update")
          return
        }
        result = await update_department(department.id, parentId, newName)
      } else if (dialogItemType === "team") {
        // Find the team ID
        const team = teams.find((t: any) => t.teamName === oldName)
        if (!team) {
          alert("❌ Team not found")
          return
        }
        // Team update needs departmentDatId and teamName
        if (!parentId) {
          alert("❌ Department ID is required for team update")
          return
        }
        result = await update_team(team.id, parentId, newName)
      }

      if (result?.success) {
        alert(
          `✅ ${dialogItemType.charAt(0).toUpperCase() + dialogItemType.slice(1)} updated successfully!`
        )

        // Refresh ALL data
        await fetch_EmployeeData()
        await fetch_divisions()
        await fetch_dat_departments()
        await fetch_teams()
        await fetch_roles()
      } else {
        alert(`❌ Failed to update: ${result?.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error updating item:", error)
      alert(`❌ Failed to update ${dialogItemType}. Please try again.`)
    }
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
    if (isDrillDown) {
      setDrillDownPage(1)
    }
  }

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))

  // Handle select all - selects ALL filtered employees across all pages
  const handleSelectAll = () => {
    if (isListView) return

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
    if (isListView) return
    setRowSelection((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId],
    }))
  }

  // Handle row click to open edit drawer - REMOVED THE CONDITION
  const handleRowClick = (employee: Employee) => {
    setSelectedEmployee(employee)
    setEditDrawerOpen(true)
  }

  // Handle click on a division/department/team card - opens drill-down
  const handleCardClick = (item: string) => {
    setSelectedItem(item)
    setIsDrillDown(true)
    setDrillDownPage(1)
    setRowSelection({})
    setDrilldownSearchTerm("") // Reset drilldown search when opening
  }

  // Handle back button click
  const handleBack = () => {
    setIsDrillDown(false)
    setSelectedItem("")
    setDrillDownPage(1)
    setCurrentPage(1)
    setRowSelection({})
    setDrilldownSearchTerm("") // Reset drilldown search when going back
  }

  // Get selected employees count
  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  // Get selected employees list
  const getSelectedEmployees = () => {
    const selectedIds = Object.entries(rowSelection)
      .filter(([, selected]) => selected)
      .map(([id]) => id)
    return employee_data.filter((employee) => selectedIds.includes(employee.id))
  }

  // Handle bulk delete click
  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true)
  }

  // Handle bulk delete confirm
  const handleBulkDeleteConfirm = async () => {
    const selectedEmployees = getSelectedEmployees()
    if (selectedEmployees.length === 0) return

    try {
      const selectedIds = selectedEmployees.map((emp) => emp.id)

      const result = await delete_EmployeeData(selectedIds)
      alert(result)
      setRowSelection({})
      setBulkDeleteDialogOpen(false)

      const newTotalPages = Math.ceil(employee_data.length / itemsPerPage)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      } else if (newTotalPages === 0) {
        setCurrentPage(1)
      }
    } catch (error) {
      console.error("Bulk delete failed:", error)
    }
  }

  // Handle individual employee delete confirm
  const handleIndividualDeleteConfirm = async () => {
    if (!employeeToDelete) return

    setIsDeleting(true)
    try {
      const result = await delete_EmployeeData([employeeToDelete.id])
      alert(result)
      setDeleteDialogOpen(false)
      setEmployeeToDelete(null)

      // Refresh data after deletion
      await fetch_EmployeeData()
    } catch (error) {
      console.error("Failed to delete employee:", error)
      alert("Failed to delete employee. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Clear all selections
  const handleClearSelection = () => {
    setRowSelection({})
  }

  const getPageNumbers = (totalPages: number, currentPage: number) => {
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

  const totalColumns = employeeHeaders.length

  // Check if all filtered employees are selected (for the header checkbox)
  const areAllFilteredSelected =
    !isListView &&
    filteredEmployees.length > 0 &&
    filteredEmployees.every((employee) => rowSelection[employee.id.toString()])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner text="Loading employees..." />
        </div>
      </div>
    )
  }

  // Determine if selection bar is active
  const isSelectionActive = !isListView && selectedCount > 0

  // Render employee card
  const renderEmployeeCard = (employee: Employee, index: number) => {
    const isSelected = !!rowSelection[employee.id.toString()]

    // Handle individual employee delete
    const handleDeleteEmployee = (e: React.MouseEvent) => {
      e.stopPropagation() // Prevent opening the edit drawer
      setEmployeeToDelete(employee)
      setDeleteDialogOpen(true)
    }

    return (
      <Card
        key={employee.id}
        className="group cursor-pointer py-4 transition-colors hover:bg-muted/40"
        onClick={() => handleRowClick(employee)}
      >
        <CardContent className="relative px-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="mb-4 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={employee.profile_photo_path || ""}
                    alt={employee.name}
                  />
                  <AvatarFallback className="text-primary">
                    {getInitials(employee.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{employee.name}</h3>
                  <span className="text-muted-foreground">
                    {employee.role || "-"}
                  </span>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-muted-foreground uppercase">
                    Div
                  </span>
                  {employee.div_name || "-"}
                </div>
                <div className="col-span-2">
                  <span className="block text-xs text-muted-foreground uppercase">
                    Dept
                  </span>
                  {employee.dept_dat || "-"}
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground uppercase">
                    DoorLog
                  </span>
                  {employee.doorlog || "-"}
                </div>
                <div className="col-span-2">
                  <span className="block text-xs text-muted-foreground uppercase">
                    Team
                  </span>
                  {employee.team || "-"}
                </div>
                <div className="col-span-3 text-muted-foreground">
                  {employee.email || "-"}
                </div>
                <div className="absolute top-0 right-3">
                  <Badge className={getStatusBadge(employee.emp_status)}>
                    {statusLabels[
                      employee.emp_status as keyof typeof statusLabels
                    ] || employee.emp_status}
                  </Badge>
                </div>
                {/* Delete Button - Bottom Right Corner - Hidden by default, shown on hover */}
                <div className="absolute right-3 bottom-[-3] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteEmployee}
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive/90"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render category card (division/department/team) with full employee cards
  const renderCategoryCard = (item: string) => {
    const isOthers = item === "Others"
    let employees: Employee[]

    if (isOthers) {
      // Get employees with empty category
      const field =
        activeView === "divisions"
          ? "div_name"
          : activeView === "departments"
            ? "dept_dat"
            : "team"
      employees = getEmployeesWithEmptyCategory(field)
    } else {
      // Get employees for this category
      const field =
        activeView === "divisions"
          ? "div_name"
          : activeView === "departments"
            ? "dept_dat"
            : "team"
      employees = getEmployeesByCategory(item, field)
    }

    const displayEmployees = employees.slice(0, 4)

    return (
      <div key={item} className="rounded-lg bg-card pbs-0 pbe-4">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">{item}</h3>
            <span className="text-sm text-muted-foreground">
              {employees.length} employee{employees.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!isOthers && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditItem(item)
                }}
                className="gap-1"
              >
                <HugeiconsIcon
                  icon={Edit03Icon}
                  strokeWidth={2}
                  className="h-4 w-4"
                />
                Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleCardClick(item)
              }}
              className="gap-1"
            >
              All Employees
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="h-4 w-4"
              />
            </Button>
          </div>
        </div>

        {/* Employee Cards - 4 per row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {displayEmployees.map((emp) => renderEmployeeCard(emp, 0))}
        </div>
      </div>
    )
  }

  // Get drill-down employees (filtered by selected category and search term)
  const getDrillDownEmployees = () => {
    if (!selectedItem) return []
    const isOthers = selectedItem === "Others"
    const field =
      activeView === "divisions"
        ? "div_name"
        : activeView === "departments"
          ? "dept_dat"
          : "team"

    let employees: Employee[]
    if (isOthers) {
      employees = getEmployeesWithEmptyCategory(field)
    } else {
      employees = getEmployeesByCategory(selectedItem, field)
    }

    // Apply search filter for drilldown
    if (drilldownSearchTerm.trim()) {
      const searchLower = drilldownSearchTerm.toLowerCase()
      employees = employees.filter((employee) => {
        const name = (employee.name || "").toLowerCase()
        const id = (employee.id || "").toLowerCase()
        const email = (employee.email || "").toLowerCase()
        const role = (employee.role || "").toLowerCase()
        const status = (employee.emp_status || "").toLowerCase()
        const doorlog = (employee.doorlog || "").toLowerCase()
        const dept_dat = (employee.dept_dat || "").toLowerCase()
        const team = (employee.team || "").toLowerCase()
        const div_name = (employee.div_name || "").toLowerCase()

        return (
          name.includes(searchLower) ||
          id.includes(searchLower) ||
          email.includes(searchLower) ||
          role.includes(searchLower) ||
          status.includes(searchLower) ||
          doorlog.includes(searchLower) ||
          dept_dat.includes(searchLower) ||
          team.includes(searchLower) ||
          div_name.includes(searchLower)
        )
      })
    }

    return employees
  }

  const drillDownEmployees = isDrillDown ? getDrillDownEmployees() : []

  // Calculate drill-down pagination
  const drillDownTotalPages = Math.ceil(
    drillDownEmployees.length / itemsPerPage
  )
  const drillDownStartIndex = (drillDownPage - 1) * itemsPerPage
  const drillDownPaginated = drillDownEmployees.slice(
    drillDownStartIndex,
    drillDownStartIndex + itemsPerPage
  )

  // Drill down pagination handlers
  const handleDrillDownPrevious = () => {
    setDrillDownPage((prev) => Math.max(prev - 1, 1))
  }

  const handleDrillDownNext = () => {
    setDrillDownPage((prev) => Math.min(prev + 1, drillDownTotalPages))
  }

  const handleDrillDownPageChange = (page: number) => {
    setDrillDownPage(page)
  }

  // Get the count of employees for the current view
  const getTotalEmployeeCount = () => {
    if (isListView) return 0
    return filteredEmployees.length
  }

  return (
    <>
      <div className="flex flex-col gap-4 pt-4 pb-6">
        <CardContent className="px-0">
          {/* Tabs and Search Bar */}
          <div className="mb-8 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs */}
            <div>
              <Tabs
                value={activeView}
                onValueChange={(value) => {
                  setActiveView(value as ViewTab)
                  setCurrentPage(1)
                  setRowSelection({})
                  setIsDrillDown(false)
                  setSelectedItem("")
                  setSearchTerm("")
                  setDrilldownSearchTerm("")
                }}
              >
                <TabsList className="h-auto">
                  {VIEW_TABS.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Actions - Search, View (list and card) and New Button */}
            <div className="flex items-center gap-1.5">
              {/* Only show main search when NOT in drilldown */}
              {!isDrillDown && (
                <InputGroup className="max-w-sm">
                  <InputGroupInput
                    ref={searchInputRef}
                    placeholder={
                      isListView ? `Search ${activeView}...` : searchPlaceholder
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <InputGroupAddon>
                    <HugeiconsIcon
                      icon={Search01Icon}
                      strokeWidth={2}
                      className="h-4 w-4 text-muted-foreground"
                    />
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <Kbd>Ctrl + K</Kbd>
                  </InputGroupAddon>
                </InputGroup>
              )}

              {!isListView && !isDrillDown && (
                <>
                  {/* View Mode Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="icon"
                        onClick={() => setViewMode("list")}
                        className="h-9 w-9"
                      >
                        <HugeiconsIcon
                          icon={ListViewIcon}
                          strokeWidth={2}
                          className="h-4 w-4"
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>List View</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "card" ? "default" : "outline"}
                        size="icon"
                        onClick={() => setViewMode("card")}
                        className="h-9 w-9"
                      >
                        <HugeiconsIcon
                          icon={GridViewIcon}
                          strokeWidth={2}
                          className="h-4 w-4"
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Card View</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Filter Dropdown */}
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

                    <DropdownMenuContent className="max-h-[80vh] w-60 overflow-y-auto">
                      {/* Division Filter */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          Division
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {getFilterUniqueValues("div_name").map((value) => (
                              <DropdownMenuCheckboxItem
                                key={value}
                                checked={filters.division.includes(value)}
                                onCheckedChange={() =>
                                  toggleFilter("division", value)
                                }
                                onSelect={(e) => e.preventDefault()}
                              >
                                {value}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      {/* Department Filter */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          Department
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {getFilterUniqueValues("dept_dat").map((value) => (
                              <DropdownMenuCheckboxItem
                                key={value}
                                checked={filters.department.includes(value)}
                                onCheckedChange={() =>
                                  toggleFilter("department", value)
                                }
                                onSelect={(e) => e.preventDefault()}
                              >
                                {value}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      {/* Team Filter */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Team</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="max-h-[500px] overflow-y-auto">
                            {getFilterUniqueValues("team").map((value) => (
                              <DropdownMenuCheckboxItem
                                key={value}
                                checked={filters.team.includes(value)}
                                onCheckedChange={() =>
                                  toggleFilter("team", value)
                                }
                                onSelect={(e) => e.preventDefault()}
                              >
                                {value}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      {/* Status Filter */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {Object.entries(statusLabels).map(
                              ([value, label]) => (
                                <DropdownMenuCheckboxItem
                                  key={value}
                                  checked={filters.status.includes(value)}
                                  onCheckedChange={() =>
                                    toggleFilter("status", value)
                                  }
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  {label}
                                </DropdownMenuCheckboxItem>
                              )
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      {/* Role Filter */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Role</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {getFilterUniqueValues("role").map((value) => (
                              <DropdownMenuCheckboxItem
                                key={value}
                                checked={filters.role.includes(value)}
                                onCheckedChange={() =>
                                  toggleFilter("role", value)
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

                      {/* Clear Filters Button - This should close the dropdown */}
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
                </>
              )}

              {!isListView && !isDrillDown && (
                <Button
                  variant="default"
                  onClick={handleNewEmployee}
                  className="bg-primary hover:bg-primary/90"
                >
                  <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} />
                  New
                </Button>
              )}
              {isListView && !isDrillDown && (
                <Button
                  variant="default"
                  onClick={() => {
                    setDialogItemType(
                      activeView === "divisions"
                        ? "division"
                        : activeView === "departments"
                          ? "department"
                          : "team"
                    )
                    handleNewItem()
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
                  New {activeView.slice(0, -1)}
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          {isListView && !isDrillDown ? (
            // Category Cards View (Divisions/Departments/Teams) - NO PAGINATION
            <div className="mx-4 space-y-4">
              {listItems.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No {activeView} found
                </div>
              ) : (
                listItems.map((item) => renderCategoryCard(item as string))
              )}
            </div>
          ) : isDrillDown ? (
            // Drill Down View - Employees in selected category (Card View)
            <div className="mx-4">
              <div className="mbs-8 mbe-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {/* Back Button for Drill Down */}
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="gap-2"
                  >
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                  </Button>
                  <h2 className="text-lg font-semibold">{selectedItem}</h2>
                  <p className="text-sm text-muted-foreground">
                    {drillDownEmployees.length} employee
                    {drillDownEmployees.length > 1 ? "s" : ""}
                  </p>
                </div>

                {/* Search bar for drilldown with Cmd+K */}
                <div className="flex items-center gap-2">
                  <InputGroup className="w-full sm:w-120">
                    <InputGroupInput
                      ref={drilldownSearchInputRef}
                      placeholder={`Search employees in ${selectedItem}...`}
                      value={drilldownSearchTerm}
                      onChange={(e) => {
                        setDrilldownSearchTerm(e.target.value)
                        setDrillDownPage(1)
                      }}
                    />
                    <InputGroupAddon>
                      <HugeiconsIcon
                        icon={Search01Icon}
                        strokeWidth={2}
                        className="h-4 w-4 text-muted-foreground"
                      />
                    </InputGroupAddon>
                    {drilldownSearchTerm && (
                      <InputGroupAddon align="inline-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setDrilldownSearchTerm("")
                            setDrillDownPage(1)
                          }}
                        >
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            strokeWidth={2}
                            className="h-3 w-3"
                          />
                        </Button>
                      </InputGroupAddon>
                    )}
                    <InputGroupAddon align="inline-end">
                      <Kbd>⌘K</Kbd>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {drillDownPaginated.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-muted-foreground">
                    {drilldownSearchTerm ? (
                      <>
                        No employees found matching "{drilldownSearchTerm}" in{" "}
                        {selectedItem}
                      </>
                    ) : (
                      <>No employees found in {selectedItem}</>
                    )}
                  </div>
                ) : (
                  drillDownPaginated.map((employee, index) => {
                    const isEmployee = (emp: any): emp is Employee =>
                      emp && typeof emp === "object" && "id" in emp

                    if (!isEmployee(employee)) return null
                    return renderEmployeeCard(employee, index)
                  })
                )}
              </div>

              {/* Drill Down Pagination */}
              {drillDownEmployees.length > 0 && (
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <Field orientation="horizontal" className="w-fit">
                    <FieldLabel htmlFor="select-rows-per-page-drilldown">
                      Rows per page
                    </FieldLabel>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger
                        className="w-15"
                        id="select-rows-per-page-drilldown"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectGroup>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {drillDownEmployees.length === 0
                      ? 0
                      : drillDownStartIndex + 1}{" "}
                    to{" "}
                    {Math.min(
                      drillDownStartIndex + itemsPerPage,
                      drillDownEmployees.length
                    )}{" "}
                    of {drillDownEmployees.length} employees
                  </div>
                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            handleDrillDownPrevious()
                          }}
                          className={
                            drillDownPage === 1 ||
                            drillDownEmployees.length === 0
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                      {getPageNumbers(drillDownTotalPages, drillDownPage).map(
                        (page, index) => (
                          <PaginationItem key={index}>
                            {page === "..." ? (
                              <span className="px-2">...</span>
                            ) : (
                              <PaginationLink
                                href="#"
                                isActive={drillDownPage === page}
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleDrillDownPageChange(page as number)
                                }}
                              >
                                {page}
                              </PaginationLink>
                            )}
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            handleDrillDownNext()
                          }}
                          className={
                            drillDownPage === drillDownTotalPages ||
                            drillDownEmployees.length === 0
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          ) : viewMode === "list" ? (
            // Table View for Employees
            <div
              className={cn("relative mx-4 overflow-x-auto rounded-md border")}
              style={{ zIndex: 1 }}
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <BorderedTableHead className="w-auto min-w-[32px] align-middle whitespace-nowrap">
                      <Checkbox
                        checked={areAllFilteredSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </BorderedTableHead>
                    {employeeHeaders.slice(1).map((header) => (
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
                        {searchTerm || hasActiveFilters ? (
                          <>
                            No employees found matching{" "}
                            {searchTerm && `"${searchTerm}"`}
                            {searchTerm && hasActiveFilters && " and "}
                            {hasActiveFilters && "selected filters"}
                          </>
                        ) : (
                          "No employees found"
                        )}
                      </BorderedTableCell>
                    </TableRow>
                  ) : (
                    paginatedEmployees.map((employee, index) => {
                      const isEmployee = (emp: any): emp is Employee =>
                        emp && typeof emp === "object" && "id" in emp

                      if (!isEmployee(employee)) return null

                      const isSelected = !!rowSelection[employee.id.toString()]
                      return (
                        <TableRow
                          key={employee.id}
                          className="cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => handleRowClick(employee)}
                        >
                          <BorderedTableCell
                            className="w-10"
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
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            {startIndex + index + 1}
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            {employee.div_name}
                          </BorderedTableCell>
                          <BorderedTableCell
                            className="text-sm"
                            selected={isSelected}
                          >
                            {employee.id}
                          </BorderedTableCell>
                          <BorderedTableCell
                            className="font-medium"
                            selected={isSelected}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={employee.profile_photo_path || ""}
                                  alt={employee.name}
                                />
                                <AvatarFallback className="text-xs text-primary">
                                  {getInitials(employee.name)}
                                </AvatarFallback>
                              </Avatar>
                              {employee.name}
                            </div>
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            {employee.email || "-"}
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            {employee.doorlog}
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            {employee.dept_dat}
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            {employee.team}
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            <Badge
                              className={getStatusBadge(employee.emp_status)}
                            >
                              {statusLabels[
                                employee.emp_status as keyof typeof statusLabels
                              ] || employee.emp_status}
                            </Badge>
                          </BorderedTableCell>
                          <BorderedTableCell selected={isSelected}>
                            {employee.role}
                          </BorderedTableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            // Card View for Employees
            <div className={cn("relative mx-4")} style={{ zIndex: 1 }}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedEmployees.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-muted-foreground">
                    {searchTerm || hasActiveFilters ? (
                      <>
                        No employees found matching{" "}
                        {searchTerm && `"${searchTerm}"`}
                        {searchTerm && hasActiveFilters && " and "}
                        {hasActiveFilters && "selected filters"}
                      </>
                    ) : (
                      "No employees found"
                    )}
                  </div>
                ) : (
                  paginatedEmployees.map((employee, index) => {
                    const isEmployee = (emp: any): emp is Employee =>
                      emp && typeof emp === "object" && "id" in emp

                    if (!isEmployee(employee)) return null
                    return renderEmployeeCard(employee, index)
                  })
                )}
              </div>
            </div>
          )}

          {/* Selection Bar */}
          {isSelectionActive && (
            <>
              <div className="fixed top-5 left-1/2 z-50 w-auto max-w-[90%] max-w-[400px] -translate-x-1/2">
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
                        disabled={isStoreDeleting}
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

          {/* Pagination - Only show for main views and drill-down, not category cards */}
          {!isListView && !isDrillDown && (
            <div
              className={cn(
                "mt-4 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between"
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
                  <SelectTrigger className="w-15" id="select-rows-per-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectGroup>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <div className="text-sm text-muted-foreground">
                Showing {filteredEmployees.length === 0 ? 0 : startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, filteredEmployees.length)}{" "}
                of {filteredEmployees.length} employees
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
                  {getPageNumbers(totalPages, currentPage).map(
                    (page, index) => (
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
                    )
                  )}
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
          )}
        </CardContent>
      </div>

      {/* Individual Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{employeeToDelete?.name}</span>?
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setEmployeeToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleIndividualDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              {selectedCount === 1 ? (
                <>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">
                    {getSelectedEmployees()[0]?.name}
                  </span>
                  ? This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete {selectedCount} selected
                  employees?
                  <br />
                  This action cannot be undone.
                </>
              )}
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
              disabled={isStoreDeleting}
            >
              {isStoreDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateEmployeeDrawer
        open={isNewEmployeeDrawerOpen}
        onOpenChange={setIsNewEmployeeDrawerOpen}
      />
      <EditEmployeeDrawer
        key={selectedEmployee?.id}
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        employee={selectedEmployee}
      />

      <AddDivDeptTeamDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        itemType={dialogItemType}
        onAdd={handleAddItem}
      />

      <EditDivDeptTeamDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        itemType={dialogItemType}
        itemName={selectedItemForEdit}
        onEdit={handleEditItemSubmit}
      />
    </>
  )
}
