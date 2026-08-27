"use client"

import { useState, useRef, useEffect } from "react"
import { resolveUploadUrl } from "@/lib/utils"
import { CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ClockIcon,
  SortByDown01Icon,
  SortByUp01Icon,
  FilterMailIcon,
  Delete02Icon,
  CommentAdd01Icon,
  ChatFeedback01Icon,
  ListViewIcon,
  GridViewIcon,
  MessageEdit01Icon,
  Message01Icon,
  MessageAdd01Icon,
} from "@hugeicons/core-free-icons"
import { FeedbackCard } from "./cards/feedback-card"
import { NewFeedbackDialog } from "./dialogs/newFeedback-dialog"
import { EditFeedbackDialog } from "./dialogs/editFeedback-dialog"
import { FeedbackDetailDialog } from "./dialogs/feedbackDetail-dialog"
import { FeedbackSuggestionDto, type FeedbackCategory } from "@/types/feedback"
import { mainStore } from "@/store/mainStore"
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
} from "./ui/dropdown-menu"

type ViewMode = "list" | "card"

// Helper function to format time with sec, min, hr units
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHr / 24)

  if (diffDays > 0) {
    return `${diffDays}D ago`
  } else if (diffHr > 0) {
    return `${diffHr}hr ago`
  } else if (diffMin > 0) {
    return `${diffMin}min ago`
  } else {
    return `${diffSec}sec ago`
  }
}

// Helper function to get initials
const getInitials = (name: string) => {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Helper function to get the effective date (updatedAt or createdAt)
const getEffectiveDate = (feedbackItem: FeedbackSuggestionDto): Date => {
  if (feedbackItem.updatedAt) {
    return new Date(feedbackItem.updatedAt)
  }
  if (feedbackItem.createdAt) {
    return new Date(feedbackItem.createdAt)
  }
  return new Date(0)
}

// Filter state type
type FeedbackFilterState = {
  department: string[]
  team: string[]
  category: string[]
}

export function FeedbackContainer() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFeedback, setSelectedFeedback] =
    useState<FeedbackSuggestionDto | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [newFeedbackDialogOpen, setNewFeedbackDialogOpen] = useState(false)
  const [editFeedbackDialogOpen, setEditFeedbackDialogOpen] = useState(false)
  const [feedbackToEdit, setFeedbackToEdit] =
    useState<FeedbackSuggestionDto | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedbackToDelete, setFeedbackToDelete] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Filter state
  const [filters, setFilters] = useState<FeedbackFilterState>({
    department: [],
    team: [],
    category: [],
  })

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Use the feedback store
  const {
    feedback,
    isLoading,
    fetch_FeedbackData,
    add_FeedbackData,
    delete_FeedbackData,
    update_FeedbackData,
    fetch_FeedbackByEmployeeId,
    profile,
    setProfile,
  } = mainStore()

  // Determine user role
  const userRole = profile?.role?.toLowerCase() || ""
  const isLearner = userRole === "learner"
  const isAdmin = userRole === "admin"
  const isApprover = userRole === "approver"
  const isAdminOrApprover = isAdmin || isApprover
  const canCreateFeedback = isLearner
  const canEditFeedback = isLearner
  const canDeleteFeedback = isAdmin || isLearner
  const canFilter = isAdmin || isApprover // Only admin and approver can filter

  // Get the appropriate icon based on role
  const getEmptyStateIcon = () => {
    if (isAdmin) {
      return Message01Icon
    }
    // For learner and approver, use CommentAdd01Icon
    return CommentAdd01Icon
  }

  // Check if any filters are active - MOVED BEFORE useEffect
  const hasActiveFilters = Object.values(filters).some(
    (filterArray) => filterArray.length > 0
  )

  // Keyboard shortcuts - supports both Ctrl+K (Windows/Linux) and Cmd+K (Mac)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac) - focus search
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
  }, [hasActiveFilters]) // Re-run when hasActiveFilters changes

  // Fetch feedback data on component mount based on role
  useEffect(() => {
    const loadFeedback = async () => {
      if (profile) {
        setProfile(profile)
      }

      if (isLearner && profile?.id) {
        await fetch_FeedbackByEmployeeId(profile.id)
      } else if (isAdminOrApprover) {
        await fetch_FeedbackData()
      } else {
        await fetch_FeedbackData()
      }
    }
    loadFeedback()
  }, [
    fetch_FeedbackData,
    fetch_FeedbackByEmployeeId,
    profile?.id,
    isLearner,
    isAdminOrApprover,
    profile,
    setProfile,
  ])

  // Get unique values for filter fields from feedback data
  const getFilterUniqueValues = (field: keyof FeedbackSuggestionDto) => {
    const values = new Set<string>()
    feedback.forEach((item) => {
      const value = item[field] as string
      if (value && value.trim()) {
        values.add(value.trim())
      }
    })
    return Array.from(values).sort()
  }

  // Get department values
  const departmentValues = getFilterUniqueValues("department")
  const hasDepartmentData = departmentValues.length > 0

  // Get team values
  const teamValues = getFilterUniqueValues("team")
  const hasTeamData = teamValues.length > 0

  // Get category values
  const categoryValues = getFilterUniqueValues("category")
  const hasCategoryData = categoryValues.length > 0

  // Check if there's any filter data available
  const hasFilterData = hasDepartmentData || hasTeamData || hasCategoryData

  // Helper to toggle filter values
  const toggleFilter = (field: keyof FeedbackFilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[field]
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) }
      } else {
        return { ...prev, [field]: [...current, value] }
      }
    })
  }

  // Helper to clear all filters
  const clearAllFilters = () => {
    setFilters({
      department: [],
      team: [],
      category: [],
    })
  }

  // Filter and sort feedbacks based on search term, filters, and sort order
  const filteredAndSortedFeedbacks = feedback
    .filter((feedbackItem) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        feedbackItem.employeeId?.toLowerCase().includes(searchLower) ||
        feedbackItem.employeeName?.toLowerCase().includes(searchLower) ||
        feedbackItem.subject?.toLowerCase().includes(searchLower) ||
        feedbackItem.description?.toLowerCase().includes(searchLower) ||
        feedbackItem.department?.toLowerCase().includes(searchLower) ||
        feedbackItem.team?.toLowerCase().includes(searchLower) ||
        feedbackItem.category?.toLowerCase().includes(searchLower) //  Add category search

      // Department filter
      const matchesDepartment =
        !canFilter ||
        filters.department.length === 0 ||
        (feedbackItem.department &&
          filters.department.includes(feedbackItem.department))

      // Team filter
      const matchesTeam =
        !canFilter ||
        filters.team.length === 0 ||
        (feedbackItem.team && filters.team.includes(feedbackItem.team))

      // Category filter -  Add category filter
      const matchesCategory =
        !canFilter ||
        filters.category.length === 0 ||
        (feedbackItem.category &&
          filters.category.includes(feedbackItem.category))

      return (
        matchesSearch && matchesDepartment && matchesTeam && matchesCategory
      )
    })
    .sort((a, b) => {
      const dateA = getEffectiveDate(a).getTime()
      const dateB = getEffectiveDate(b).getTime()

      if (sortOrder === "desc") {
        return dateB - dateA
      } else {
        return dateA - dateB
      }
    })

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedFeedbacks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedFeedbacks = filteredAndSortedFeedbacks.slice(
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

  // Handle feedback card click
  const handleFeedbackClick = (feedbackItem: FeedbackSuggestionDto) => {
    setSelectedFeedback(feedbackItem)
    setDetailDialogOpen(true)
  }

  // Handle edit button click
  const handleEditClick = (
    e: React.MouseEvent,
    feedbackItem: FeedbackSuggestionDto
  ) => {
    e.stopPropagation()
    setFeedbackToEdit(feedbackItem)
    setEditFeedbackDialogOpen(true)
    if (detailDialogOpen) {
      setDetailDialogOpen(false)
    }
  }

  // Handle delete button click from feedback card
  const handleDeleteClick = (e: React.MouseEvent, feedbackId: number) => {
    e.stopPropagation()
    setFeedbackToDelete(feedbackId)
    setDeleteDialogOpen(true)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (feedbackToDelete === null) return

    setIsDeleting(true)
    try {
      const result = await delete_FeedbackData(feedbackToDelete)

      if (result.includes("successfully")) {
        setMessage({ type: "success", text: result })
        setDeleteDialogOpen(false)
        setFeedbackToDelete(null)

        if (selectedFeedback?.id === feedbackToDelete) {
          setDetailDialogOpen(false)
          setSelectedFeedback(null)
        }

        setTimeout(() => setMessage(null), 1000)
      } else {
        setMessage({ type: "error", text: result })
      }
    } catch (error) {
      console.error("Failed to delete feedback:", error)
      setMessage({ type: "error", text: "Failed to delete feedback" })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle new feedback
  const handleNewFeedback = () => {
    setNewFeedbackDialogOpen(true)
  }

  // Handle submit feedback
  const handleSubmitFeedback = async (
    subject: string,
    category: FeedbackCategory,
    description: string
  ) => {
    setIsSubmitting(true)
    try {
      const employeeId = profile?.id

      if (!employeeId) {
        throw new Error("Employee ID not found")
      }

      const newFeedback: FeedbackSuggestionDto = {
        employeeId: employeeId,
        subject: subject,
        category: category,
        description: description,
      }

      const result = await add_FeedbackData(newFeedback)

      if (result.includes("successfully")) {
        setNewFeedbackDialogOpen(false)
        setMessage({ type: "success", text: result })
        setTimeout(() => setMessage(null), 1000)
      } else {
        setMessage({ type: "error", text: result })
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      setMessage({ type: "error", text: "Failed to submit feedback" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit feedback
  const handleEditFeedback = async (
    id: number,
    subject: string,
    category: FeedbackCategory,
    description: string
  ) => {
    setIsSubmitting(true)
    try {
      const updatedFeedback: FeedbackSuggestionDto = {
        id: id,
        employeeId: feedbackToEdit?.employeeId || "",
        subject: subject,
        category: category,
        description: description,
      }

      const result = await update_FeedbackData(id, updatedFeedback)

      if (result.includes("successfully")) {
        setEditFeedbackDialogOpen(false)
        setFeedbackToEdit(null)
        setMessage({ type: "success", text: result })
        setTimeout(() => setMessage(null), 1000)
      } else {
        setMessage({ type: "error", text: result })
      }
    } catch (error) {
      console.error("Failed to update feedback:", error)
      setMessage({ type: "error", text: "Failed to update feedback" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get display time for detail dialog
  const getDisplayTime = (feedbackItem: FeedbackSuggestionDto | null) => {
    if (!feedbackItem) return "Just now"
    if (feedbackItem.updatedAt) {
      return formatTime(feedbackItem.updatedAt)
    }
    if (feedbackItem.createdAt) {
      return formatTime(feedbackItem.createdAt)
    }
    return "Just now"
  }

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
    setCurrentPage(1)
  }

  const hasFeedback = filteredAndSortedFeedbacks.length > 0

  return (
    <>
      <div className="flex flex-col gap-4 pt-4 pb-6">
        <CardContent className="px-0">
          {/* Header with Search and New Button - Only show when there's feedback */}
          {feedback.length > 0 && (
            <div className="mb-6 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
              <InputGroup className="w-[400px]">
                <InputGroupInput
                  ref={searchInputRef}
                  placeholder="Search feedbacks..."
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

              <div className="flex items-center gap-2">
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

                {/* Sort Buttons */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={toggleSortOrder}
                    >
                      <HugeiconsIcon
                        icon={
                          sortOrder === "desc"
                            ? SortByUp01Icon
                            : SortByDown01Icon
                        }
                        strokeWidth={2}
                        className="h-4 w-4"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {sortOrder === "desc" ? "Least recent" : "Most recent"}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Filter Dropdown - Only show for admin/approver and when there's filter data */}
                {canFilter && hasFilterData && (
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
                      {/* Category Filter */}
                      {hasCategoryData && (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              Category
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                {categoryValues.map((value) => (
                                  <DropdownMenuCheckboxItem
                                    key={value}
                                    checked={filters.category.includes(value)}
                                    onCheckedChange={() =>
                                      toggleFilter("category", value)
                                    }
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    {value.charAt(0).toUpperCase() +
                                      value.slice(1).toLowerCase()}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                        </>
                      )}
                      
                      {/* Department Filter */}
                      {hasDepartmentData && (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              Department
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                {departmentValues.map((value) => (
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
                        </>
                      )}

                      {/* Team Filter */}
                      {hasTeamData && (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              Team
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                {teamValues.map((value) => (
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

                {canCreateFeedback && (
                  <Button
                    variant="default"
                    onClick={handleNewFeedback}
                    className="bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                    title={
                      !canCreateFeedback
                        ? "Only learners can create feedback"
                        : ""
                    }
                  >
                    <HugeiconsIcon icon={MessageAdd01Icon} strokeWidth={2} />
                    New Feedback
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div
              className={`mx-4 mb-4 rounded p-4 ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="mx-4 py-12 text-center text-muted-foreground">
              Loading feedback...
            </div>
          )}

          {/* Feedback Cards/Table Grid */}
          {!isLoading && (
            <div className="mx-4">
              {paginatedFeedbacks.length > 0 ? (
                <>
                  {viewMode === "card" ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {paginatedFeedbacks.map((feedbackItem) => (
                        <FeedbackCard
                          key={feedbackItem.id}
                          feedback={{
                            id: feedbackItem.id!,
                            employee: {
                              name:
                                feedbackItem.employeeName ||
                                `Employee ${feedbackItem.employeeId}`,
                              email: `${feedbackItem.employeeId}@company.com`,
                              department: feedbackItem.department || "N/A",
                              team: feedbackItem.team || "N/A",
                              avatar:
                                resolveUploadUrl(
                                  selectedFeedback?.profilePhotoPath
                                ) || "",
                            },
                            subject: feedbackItem.subject || "",
                            category: feedbackItem.category,
                            description: feedbackItem.description,
                            createdAt:
                              feedbackItem.createdAt ||
                              new Date().toISOString(),
                            updatedAt: feedbackItem.updatedAt,
                          }}
                          onClick={() => handleFeedbackClick(feedbackItem)}
                          onDelete={handleDeleteClick}
                          onEdit={
                            canEditFeedback
                              ? (e) => handleEditClick(e, feedbackItem)
                              : undefined
                          }
                          formatTime={formatTime}
                          getInitials={getInitials}
                          canEdit={canEditFeedback}
                          canDelete={canDeleteFeedback}
                        />
                      ))}
                    </div>
                  ) : (
                    // Table View with border
                    <div className="relative overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="border-r whitespace-nowrap">
                              Sr.
                            </TableHead>
                            <TableHead className="border-r whitespace-nowrap">
                              Employee
                            </TableHead>
                            <TableHead className="border-r whitespace-nowrap">
                              Department
                            </TableHead>
                            <TableHead className="border-r whitespace-nowrap">
                              Team
                            </TableHead>
                            <TableHead className="border-r whitespace-nowrap">
                              Subject
                            </TableHead>
                            <TableHead className="border-r whitespace-nowrap">
                              Description
                            </TableHead>
                            <TableHead className="border-r whitespace-nowrap">
                              Last updated
                            </TableHead>
                            <TableHead className="text-right whitespace-nowrap">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedFeedbacks.map((feedbackItem, index) => (
                            <TableRow
                              key={feedbackItem.id}
                              className="cursor-pointer transition-colors hover:bg-muted/50"
                              onClick={() => handleFeedbackClick(feedbackItem)}
                            >
                              <TableCell className="border-r whitespace-nowrap">
                                {startIndex + index + 1}
                              </TableCell>
                              <TableCell className="border-r">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={
                                        resolveUploadUrl(
                                          selectedFeedback?.profilePhotoPath
                                        ) || ""
                                      }
                                      alt={feedbackItem.employeeName || ""}
                                    />
                                    <AvatarFallback className="text-xs text-primary">
                                      {feedbackItem.employeeName
                                        ? getInitials(feedbackItem.employeeName)
                                        : feedbackItem.employeeId
                                            ?.slice(0, 2)
                                            .toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="text-sm font-medium">
                                      {feedbackItem.employeeName ||
                                        `Employee ${feedbackItem.employeeId}`}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {feedbackItem.employeeId}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="border-r whitespace-nowrap">
                                {feedbackItem.department || "-"}
                              </TableCell>
                              <TableCell className="border-r whitespace-nowrap">
                                {feedbackItem.team || "-"}
                              </TableCell>
                              <TableCell className="max-w-[150px] border-r">
                                <div className="truncate">
                                  {feedbackItem.subject}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px] border-r">
                                <div className="truncate text-sm text-muted-foreground">
                                  {feedbackItem.description}
                                </div>
                              </TableCell>
                              <TableCell className="border-r text-sm whitespace-nowrap text-muted-foreground">
                                {getDisplayTime(feedbackItem)}
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  {canEditFeedback && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-primary/10"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEditClick(e, feedbackItem)
                                      }}
                                    >
                                      <HugeiconsIcon
                                        icon={MessageEdit01Icon}
                                        strokeWidth={2}
                                        className="h-4 w-4"
                                      />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive/90"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteClick(e, feedbackItem.id!)
                                    }}
                                  >
                                    <HugeiconsIcon
                                      icon={Delete02Icon}
                                      strokeWidth={2}
                                      className="h-4 w-4"
                                    />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Pagination */}
                  {filteredAndSortedFeedbacks.length > 0 && (
                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <Field orientation="horizontal" className="w-fit">
                        <FieldLabel htmlFor="select-rows-per-page">
                          Rows per page
                        </FieldLabel>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={handleItemsPerPageChange}
                        >
                          <SelectTrigger
                            className="w-15"
                            id="select-rows-per-page"
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
                        {filteredAndSortedFeedbacks.length === 0
                          ? 0
                          : startIndex + 1}{" "}
                        to{" "}
                        {Math.min(
                          startIndex + itemsPerPage,
                          filteredAndSortedFeedbacks.length
                        )}{" "}
                        of {filteredAndSortedFeedbacks.length} feedbacks
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
                                currentPage === 1 ||
                                filteredAndSortedFeedbacks.length === 0
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
                                filteredAndSortedFeedbacks.length === 0
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                // Empty state
                <Empty className="m-auto min-h-[300px] max-w-[500px] rounded-lg">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <HugeiconsIcon
                        icon={Message01Icon}
                        strokeWidth={2}
                        className="h-12 w-12 text-muted-foreground"
                      />
                    </EmptyMedia>
                    <EmptyTitle>
                      {searchTerm || hasActiveFilters
                        ? `No Matching Feedback for ${searchTerm}`
                        : "No Feedback"}
                    </EmptyTitle>
                    <EmptyDescription className="text-center text-pretty">
                      {searchTerm || hasActiveFilters ? (
                        <>Try adjusting your search or filters.</>
                      ) : isLearner ? (
                        "Share your thoughts on courses, management, or the system."
                      ) : (
                        "Submitted feedback on courses, management, or the system will appear here."
                      )}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    {(searchTerm || hasActiveFilters) &&
                    filteredAndSortedFeedbacks.length === 0 ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("")
                          clearAllFilters()
                        }}
                      >
                        Clear
                      </Button>
                    ) : (
                      canCreateFeedback && (
                        <Button variant="default" onClick={handleNewFeedback}>
                          <HugeiconsIcon
                            icon={MessageAdd01Icon}
                            strokeWidth={2}
                            className="h-4 w-4"
                          />
                          New Feedback
                        </Button>
                      )
                    )}
                  </EmptyContent>
                </Empty>
              )}
            </div>
          )}
        </CardContent>
      </div>

      {/* Feedback Detail Dialog - Now using separate component */}
      <FeedbackDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        feedback={selectedFeedback}
        getDisplayTime={getDisplayTime}
        getInitials={getInitials}
        resolveUploadUrl={resolveUploadUrl}
      />

      {/* New Feedback Dialog */}
      {canCreateFeedback && (
        <NewFeedbackDialog
          open={newFeedbackDialogOpen}
          onOpenChange={setNewFeedbackDialogOpen}
          onSubmit={handleSubmitFeedback}
          isLoading={isSubmitting}
        />
      )}

      {/* Edit Feedback Dialog */}
      {canEditFeedback && feedbackToEdit && (
        <EditFeedbackDialog
          open={editFeedbackDialogOpen}
          onOpenChange={setEditFeedbackDialogOpen}
          feedback={feedbackToEdit}
          onSubmit={handleEditFeedback}
          isLoading={isSubmitting}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this feedback?
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setFeedbackToDelete(null)
              }}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
