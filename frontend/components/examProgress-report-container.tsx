"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { CardContent } from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  FilterMailIcon,
  Delete02Icon,
  ChartIcon,
  Upload05Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import React from "react"
import { mainStore } from "@/store/mainStore"
import { DepartmentTable } from "@/components/examProgressTables/DepartmentTable"
import { TeamTargetPlanTable } from "@/components/examProgressTables/TeamTargetPlanTable"
import { TeamCommunicationTable } from "@/components/examProgressTables/TeamCommunicationTable"
import { CommunicationCapabilityTable } from "@/components/examProgressTables/CommunicationCapabilityTable"
import { TeamNoCertifiedTable } from "@/components/examProgressTables/TeamNoCertifiedTable"
import { Button } from "@/components/ui/button"
import { ImportDialog } from "@/components/dialogs/import-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuShortcut,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./ui/dropdown-menu"
import { cn } from "@/lib/utils"

const STROKE_WIDTH = 2

type ViewType =
  | "department"
  | "teamTargetPlan"
  | "teamCommunication"
  | "teamCommunicationCapability"
  | "teamNone"

// View mode options
const VIEW_OPTIONS = [
  { value: "department", label: "JLPT Certificates" },
  { value: "teamTargetPlan", label: "JLPT Target Plan" },
  { value: "teamCommunication", label: "Communication Level" },
  { value: "teamNone", label: "No JLPT Certified Members" },
  { value: "teamCommunicationCapability", label: "Communication Capability" },
]

// Filter state type
type FilterState = {
  viewType: string | null // Single value for view type
  department: string[] // Multi-select for department
}

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

export function ExamProgressReportContainer() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [viewType, setViewType] = useState<ViewType>("department")
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Row selection state
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedCount, setSelectedCount] = useState(0)

  const [deptData, setDeptData] = useState<any[]>([])
  const [teamData, setTeamData] = useState<any[]>([])
  const [capabilityData, setCapabilityData] = useState<any[]>([])

  const isDataLoadedRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // State for import dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    viewType: null,
    department: [],
  })

  // Get store methods
  const {
    fetch_AllReportData,
    getDeptWithCounts,
    getTeamWithCounts,
    getCommCapability,
    getTargetDates,
    employeeJapaneseLevel_Data
  } = mainStore()

  // Check if any filters are active
  const hasActiveFilters =
    filters.viewType !== null || filters.department.length > 0

  // Get unique department values for filter dropdown
  const departmentFilterValues = deptData
    .filter((dept) => dept.id !== null && dept.id !== undefined)
    .map((dept) => dept.dept_name)
    .sort()

  const hasDepartmentFilterData = departmentFilterValues.length > 0
  const hasViewTypeFilterData = VIEW_OPTIONS.length > 0
  const hasFilterData = hasViewTypeFilterData || hasDepartmentFilterData

  // Check if there's any data to display
  const hasData =
    deptData.length > 0 || teamData.length > 0 || capabilityData.length > 0
  const hasAnyData =
    deptData.length > 0 || teamData.length > 0 || capabilityData.length > 0

  // Keyboard shortcut for search focus (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }

      // Check for Escape key - clear filters
      if (e.key === "Escape" && hasActiveFilters) {
        e.preventDefault()
        clearAllFilters()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [hasActiveFilters])

  // Transform data to pivot format for capability table
  const transformToPivot = (data: any[]) => {
    if (data.length === 0) return []
    const firstRow = data[0]
    const commKeys: string[] = []
    let index = 0
    while (true) {
      const key = `current_comm_${index}`
      if (key in firstRow) {
        commKeys.push(key)
        index++
      } else {
        break
      }
    }
    const pivotRows: any[] = []
    const fullTexts = [
      "Level 0 | None",
      "Level 1 | G1: Email writing-Chat with DIR and QA/bug/issues reporting using simple words",
      "Level 1 | G2: Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool",
      "Level 1 | G3: Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool, Basic & Internal team daily conversation using simple words",
      "Level 2 | G1: Email reading/writing/MS team chat, Daily team conversation",
      "Level 2 | G2: Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese",
      "Level 2 | G3: Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese, Basic meeting participation",
      "Level 3: Lead Meeting with DIR/Japanese clients, Handle negotiations, Write formal proposal",
    ]
    commKeys.forEach((key, idx) => {
      let currentTotal = 0,
        target1Total = 0,
        target2Total = 0
      data.forEach((row) => {
        currentTotal += (row[`current_comm_${idx}`] as number) || 0
        target1Total += (row[`target1_comm_${idx}`] as number) || 0
        target2Total += (row[`target2_comm_${idx}`] as number) || 0
      })
      pivotRows.push({
        id: fullTexts[idx] || key,
        level_full: fullTexts[idx] || key,
        current: currentTotal,
        target1: target1Total,
        target2: target2Total,
      })
    })
    return pivotRows
  }

  // Load all data once
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true)
      await fetch_AllReportData()

      const depts = getDeptWithCounts() || []
      setDeptData(depts)

      const teams = getTeamWithCounts() || []
      setTeamData(teams)

      const pivoted = transformToPivot(teams)
      setCapabilityData(pivoted)

      // Log the dates after loading
      const dates = getTargetDates()

      isDataLoadedRef.current = true
      setIsLoading(false)
    }
    loadAllData()
  }, [
    fetch_AllReportData,
    getDeptWithCounts,
    getTeamWithCounts,
    getTargetDates,
    employeeJapaneseLevel_Data,
  ])

  // Update selected count when rowSelection changes
  useEffect(() => {
    const count = Object.values(rowSelection).filter(Boolean).length
    setSelectedCount(count)
  }, [rowSelection])

  // Helper to toggle filter values (for department multi-select)
  const toggleFilter = (field: keyof FilterState, value: string) => {
    if (field === "viewType") {
      // For view type, it's a radio select - set the value
      setFilters((prev) => ({
        ...prev,
        viewType: prev.viewType === value ? null : value,
      }))
    } else {
      // For department, it's a multi-select - toggle
      setFilters((prev) => {
        const current = prev[field] as string[]
        if (current.includes(value)) {
          return { ...prev, [field]: current.filter((v) => v !== value) }
        } else {
          return { ...prev, [field]: [...current, value] }
        }
      })
    }
  }

  // Helper to clear all filters
  const clearAllFilters = () => {
    setFilters({
      viewType: null,
      department: [],
    })
    // Reset view type to default
    setViewType("department")
    setSelectedDeptId(null)
    setSearchTerm("")
    setRowSelection({})
  }

  // Apply filters to view type
  useEffect(() => {
    if (filters.viewType) {
      const viewOption = VIEW_OPTIONS.find(
        (opt) => opt.label === filters.viewType
      )
      if (viewOption) {
        setViewType(viewOption.value as ViewType)
      }
    } else {
      // Default to department if no view filter
      setViewType("department")
    }
  }, [filters.viewType])

  // Apply department filter
  useEffect(() => {
    if (filters.department.length > 0) {
      const selectedDeptName = filters.department[0]
      const dept = deptData.find((d) => d.dept_name === selectedDeptName)
      if (dept) {
        setSelectedDeptId(dept.id)
      }
    } else {
      setSelectedDeptId(null)
    }
  }, [filters.department, deptData])

  const handleViewChange = (value: ViewType) => {
    setViewType(value)
    setCurrentPage(1)
    setSearchTerm("")
    setSelectedDeptId(null)
    setRowSelection({})
    // Clear filters when changing view via dropdown
    setFilters({
      viewType: null,
      department: [],
    })
  }

  // Dynamic placeholder based on view type
  const getPlaceholder = () => {
    switch (viewType) {
      case "department":
        return "Search departments..."
      case "teamTargetPlan":
        return "Search teams..."
      case "teamCommunication":
        return "Search teams..."
      case "teamNone":
        return "Search teams..."
      case "teamCommunicationCapability":
        return "Search communication levels..."
      default:
        return "Search..."
    }
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      const selectedIds = Object.keys(rowSelection).filter(
        (key) => rowSelection[key]
      )

      // Delete from the appropriate data source based on view type
      switch (viewType) {
        case "department": {
          const newData = deptData.filter((item) => {
            return !selectedIds.includes(item.dept_name)
          })
          setDeptData(newData)
          break
        }
        case "teamTargetPlan":
        case "teamCommunication":
        case "teamNone": {
          const newData = teamData.filter((item) => {
            return !selectedIds.includes(item.team_name)
          })
          setTeamData(newData)
          // Also update capability data
          const newCapData = transformToPivot(newData)
          setCapabilityData(newCapData)
          break
        }
        case "teamCommunicationCapability": {
          const newData = capabilityData.filter((item) => {
            return !selectedIds.includes(item.id)
          })
          setCapabilityData(newData)
          break
        }
      }

      setRowSelection({})
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("Delete failed:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Get current data based on view type
  const getCurrentData = () => {
    switch (viewType) {
      case "department":
        return deptData
      case "teamTargetPlan":
      case "teamCommunication":
      case "teamNone":
        return teamData
      case "teamCommunicationCapability":
        return capabilityData
      default:
        return []
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner text="Loading certification data..." />
        </div>
      </div>
    )
  }

  const currentData = getCurrentData()
  const targetDates = getTargetDates()

  return (
    <>
      <div className="flex flex-col gap-4 pb-6">
        <CardContent className="px-0">
          {/* Header with Search and Filters - Only show when there's data */}
          {hasAnyData && (
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <InputGroup className="max-w-sm flex-1">
                <InputGroupInput
                  ref={searchInputRef}
                  placeholder={getPlaceholder()}
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

              <div className="flex gap-2">
                {/* Filter Dropdown */}
                {hasFilterData && (
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
                      {/* View Type Filter - Radio selection */}
                      {hasViewTypeFilterData && (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              View Mode
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup
                                  value={filters.viewType || ""}
                                  onValueChange={(value) => {
                                    toggleFilter("viewType", value)
                                  }}
                                >
                                  {VIEW_OPTIONS.map((option) => (
                                    <DropdownMenuRadioItem
                                      key={option.value}
                                      value={option.label}
                                    >
                                      {option.label}
                                    </DropdownMenuRadioItem>
                                  ))}
                                </DropdownMenuRadioGroup>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                        </>
                      )}

                      {/* Department Filter - Multi-select (only show when view type supports it) */}
                      {hasDepartmentFilterData &&
                        viewType !== "department" &&
                        viewType !== "teamCommunicationCapability" && (
                          <>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                Department
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  {departmentFilterValues.map((deptName) => (
                                    <DropdownMenuCheckboxItem
                                      key={deptName}
                                      checked={filters.department.includes(
                                        deptName
                                      )}
                                      onCheckedChange={() =>
                                        toggleFilter("department", deptName)
                                      }
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      {deptName}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                          </>
                        )}

                      <DropdownMenuSeparator />
                      {/* Clear Filters Button */}
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
                )}
              </div>
            </div>
          )}

          {/* Table - Only show when there's data */}
          {hasData ? (
            <>
              {viewType === "department" && (
                <DepartmentTable
                  key={`dept-${viewType}`}
                  searchTerm={searchTerm}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  data={currentData}
                  rowSelection={rowSelection}
                  onRowSelectionChange={setRowSelection}
                />
              )}

              {viewType === "teamTargetPlan" && (
                <TeamTargetPlanTable
                  key={`team-${viewType}`}
                  searchTerm={searchTerm}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  selectedDeptId={selectedDeptId}
                  data={currentData}
                  target1Date={targetDates.target1Date}
                  target2Date={targetDates.target2Date}
                />
              )}

              {viewType === "teamCommunication" && (
                <TeamCommunicationTable
                  key={`comm-${viewType}`}
                  searchTerm={searchTerm}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  selectedDeptId={selectedDeptId}
                  data={currentData}
                  target1Date={targetDates.target1Date}
                  target2Date={targetDates.target2Date}
                />
              )}

              {viewType === "teamCommunicationCapability" && (
                <CommunicationCapabilityTable
                  key={`cap-${viewType}`}
                  searchTerm={searchTerm}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  selectedDeptId={selectedDeptId}
                  data={currentData}
                  target1Date={targetDates.target1Date}
                  target2Date={targetDates.target2Date}
                />
              )}

              {viewType === "teamNone" && (
                <TeamNoCertifiedTable
                  key={`none-${viewType}`}
                  searchTerm={searchTerm}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  selectedDeptId={selectedDeptId}
                  data={currentData}
                  target1Date={targetDates.target1Date}
                  target2Date={targetDates.target2Date}
                />
              )}
            </>
          ) : (
            // Empty state - similar to self-study progress report
            <Empty className="m-auto min-h-[300px] max-w-[500px] rounded-lg">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon
                    icon={ChartIcon}
                    strokeWidth={2}
                    className="h-12 w-12 text-muted-foreground"
                  />
                </EmptyMedia>
                <EmptyTitle>
                  {searchTerm || hasActiveFilters
                    ? "No Matching Records"
                    : "No Exam Progress Data"}
                </EmptyTitle>
                <EmptyDescription className="text-center text-pretty">
                  {searchTerm || hasActiveFilters ? (
                    <>Try adjusting your search or filters.</>
                  ) : (
                    "Import your JLPT target level data to start tracking learners' exam progress."
                  )}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {searchTerm || hasActiveFilters ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      clearAllFilters()
                    }}
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={() => setImportDialogOpen(true)}
                  >
                    <HugeiconsIcon
                      icon={Upload05Icon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                    Import JLPT Target Level
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </div>

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        label="current_target_data"
      />
    </>
  )
}

export default ExamProgressReportContainer
