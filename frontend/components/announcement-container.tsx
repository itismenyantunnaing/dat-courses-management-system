"use client"

import { useState, useRef, useEffect } from "react"
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
  ListViewIcon,
  GridViewIcon,
  MessageEdit01Icon,
  Speaker01Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons"
import { AnnouncementCard } from "@/components/cards/announcement-card"
import { NewAnnouncementDialog } from "@/components/dialogs/newAnnouncement-dialog"
import { EditAnnouncementDialog } from "@/components/dialogs/editAnnouncement-dialog"
import { AnnouncementDto, AnnouncementCategory } from "@/types/announcement"
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

// Helper function to format time
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
}

// Category color mapping
const getCategoryStyles = (category?: AnnouncementCategory) => {
  switch (category) {
    case 'COURSE':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'EXAM':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'OTHER':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

const getCategoryLabel = (category?: AnnouncementCategory) => {
  switch (category) {
    case 'COURSE':
      return 'Course'
    case 'EXAM':
      return 'Exam'
    case 'OTHER':
      return 'Other'
    default:
      return 'Unknown'
  }
}

// Filter state type
type AnnouncementFilterState = {
  category: string[]
  createdBy: string[]
}

export function AnnouncementContainer() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementDto | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [newAnnouncementDialogOpen, setNewAnnouncementDialogOpen] = useState(false)
  const [editAnnouncementDialogOpen, setEditAnnouncementDialogOpen] = useState(false)
  const [announcementToEdit, setAnnouncementToEdit] = useState<AnnouncementDto | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Filter state - same as feedback
  const [filters, setFilters] = useState<AnnouncementFilterState>({
    category: [],
    createdBy: [],
  })

  const searchInputRef = useRef<HTMLInputElement>(null)

  const {
    announcements,
    isLoading,
    fetch_AnnouncementData,
    add_AnnouncementData,
    delete_AnnouncementData,
    update_AnnouncementData,
    profile
  } = mainStore()

  const userRole = profile?.role?.toLowerCase() || ""
  const canEdit = userRole !== "learner" 

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    (filterArray) => filterArray.length > 0
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      // Escape key - clear filters
      if (e.key === "Escape" && hasActiveFilters) {
        e.preventDefault()
        clearAllFilters()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [hasActiveFilters])

  // Fetch announcements on mount
  useEffect(() => {
    fetch_AnnouncementData()
  }, [fetch_AnnouncementData])

  // Get unique values for filter fields
  const getFilterUniqueValues = (field: keyof AnnouncementDto) => {
    const values = new Set<string>()
    announcements.forEach((item: AnnouncementDto) => {
      const value = item[field] as string
      if (value && value.trim()) {
        values.add(value.trim())
      }
    })
    return Array.from(values).sort()
  }

  // Get category values
  const categoryValues = getFilterUniqueValues("category")
  const hasCategoryData = categoryValues.length > 0

  // Get createdBy values
  const createdByValues = getFilterUniqueValues("createdBy")
  const hasCreatedByData = createdByValues.length > 0

  // Check if there's any filter data available
  const hasFilterData = hasCategoryData || hasCreatedByData

  // Helper to toggle filter values
  const toggleFilter = (field: keyof AnnouncementFilterState, value: string) => {
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
      category: [],
      createdBy: [],
    })
  }

  // Filter and sort announcements
  const filteredAndSortedAnnouncements = announcements
    .filter((announcement: AnnouncementDto) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        announcement.title?.toLowerCase().includes(searchLower) ||
        announcement.text?.toLowerCase().includes(searchLower) ||
        announcement.createdBy?.toLowerCase().includes(searchLower)

      // Category filter
      const matchesCategory = filters.category.length === 0 ||
        (announcement.category && filters.category.includes(announcement.category))

      // CreatedBy filter
      const matchesCreatedBy = filters.createdBy.length === 0 ||
        (announcement.createdBy && filters.createdBy.includes(announcement.createdBy))

      return matchesSearch && matchesCategory && matchesCreatedBy
    })
    .sort((a: AnnouncementDto, b: AnnouncementDto) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0

      if (sortOrder === "desc") {
        return dateB - dateA
      } else {
        return dateA - dateB
      }
    })

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAnnouncements.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAnnouncements = filteredAndSortedAnnouncements.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))

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

  // Handle announcement card click
  const handleAnnouncementClick = (announcement: AnnouncementDto) => {
    setSelectedAnnouncement(announcement)
    setDetailDialogOpen(true)
  }

  // Handle edit button click
  const handleEditClick = (e: React.MouseEvent, announcement: AnnouncementDto) => {
    e.stopPropagation()
    setAnnouncementToEdit(announcement)
    setEditAnnouncementDialogOpen(true)
    if (detailDialogOpen) {
      setDetailDialogOpen(false)
    }
  }

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent, announcementId: number) => {
    e.stopPropagation()
    setAnnouncementToDelete(announcementId)
    setDeleteDialogOpen(true)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (announcementToDelete === null) return

    setIsDeleting(true)
    try {
      const result = await delete_AnnouncementData(announcementToDelete)

      if (result.includes("successfully")) {
        setMessage({ type: "success", text: result })
        setDeleteDialogOpen(false)
        setAnnouncementToDelete(null)

        if (selectedAnnouncement?.id === announcementToDelete) {
          setDetailDialogOpen(false)
          setSelectedAnnouncement(null)
        }

        setTimeout(() => setMessage(null), 1000)
      } else {
        setMessage({ type: "error", text: result })
      }
    } catch (error) {
      console.error("Failed to delete announcement:", error)
      setMessage({ type: "error", text: "Failed to delete announcement" })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle new announcement
  const handleNewAnnouncement = () => {
    setNewAnnouncementDialogOpen(true)
  }

  // Handle submit announcement
  const handleSubmitAnnouncement = async (title: string, category: AnnouncementCategory, text: string) => {
    setIsSubmitting(true)
    try {
      const newAnnouncement: AnnouncementDto = {
        title: title,
        category: category,
        text: text,
      }

      const result = await add_AnnouncementData(newAnnouncement)

      if (result.includes("successfully")) {
        setNewAnnouncementDialogOpen(false)
        setMessage({ type: "success", text: result })
        setTimeout(() => setMessage(null), 1000)
      } else {
        setMessage({ type: "error", text: result })
      }
    } catch (error) {
      console.error("Failed to create announcement:", error)
      setMessage({ type: "error", text: "Failed to create announcement" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit announcement
  const handleEditAnnouncement = async (
    id: number,
    title: string,
    category: AnnouncementCategory,
    text: string
  ) => {
    setIsSubmitting(true)
    try {
      const updatedAnnouncement: AnnouncementDto = {
        id: id,
        title: title,
        category: category,
        text: text,
      }

      const result = await update_AnnouncementData(id, updatedAnnouncement)

      if (result.includes("successfully")) {
        setEditAnnouncementDialogOpen(false)
        setAnnouncementToEdit(null)
        setMessage({ type: "success", text: result })
        setTimeout(() => setMessage(null), 1000)
      } else {
        setMessage({ type: "error", text: result })
      }
    } catch (error) {
      console.error("Failed to update announcement:", error)
      setMessage({ type: "error", text: "Failed to update announcement" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
    setCurrentPage(1)
  }

  const hasAnnouncements = filteredAndSortedAnnouncements.length > 0

  return (
    <>
      <div className="flex flex-col gap-4 pt-4 pb-6">
        <CardContent className="px-0">
          {/* Header with Search and New Button */}
          {announcements.length > 0 && (
            <div className="mb-6 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
              <InputGroup className="w-[400px]">
                <InputGroupInput
                  ref={searchInputRef}
                  placeholder="Search announcements..."
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
                        icon={sortOrder === "desc" ? SortByUp01Icon : SortByDown01Icon}
                        strokeWidth={2}
                        className="h-4 w-4"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{sortOrder === "desc" ? "Newest first" : "Oldest first"}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Filter Dropdown - Same as feedback */}
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
                                    {getCategoryLabel(value as AnnouncementCategory)}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                        </>
                      )}

                      {/* Created By Filter */}
                      {hasCreatedByData && (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              Created By
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                {createdByValues.map((value) => (
                                  <DropdownMenuCheckboxItem
                                    key={value}
                                    checked={filters.createdBy.includes(value)}
                                    onCheckedChange={() =>
                                      toggleFilter("createdBy", value)
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
                        </>
                      )}

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

                {canEdit && (
                  <Button
                    variant="default"
                    onClick={handleNewAnnouncement}
                    className="bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                    New Announcement
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div
              className={`mx-4 mb-4 rounded p-4 ${message.type === "success"
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
              Loading announcements...
            </div>
          )}

          {/* Announcement Cards/Table Grid */}
          {!isLoading && (
            <div className="mx-4">
              {paginatedAnnouncements.length > 0 ? (
                <>
                  {viewMode === "card" ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {paginatedAnnouncements.map((announcement: AnnouncementDto) => (
                        <AnnouncementCard
                          key={announcement.id}
                          announcement={{
                            id: announcement.id!,
                            title: announcement.title,
                            text: announcement.text,
                            category: announcement.category,
                            createdBy: announcement.createdBy,
                            createdAt: announcement.createdAt || new Date().toISOString(),
                            updatedAt: announcement.updatedAt,
                          }}
                          onClick={() => handleAnnouncementClick(announcement)}
                          onDelete={handleDeleteClick}
                          onEdit={canEdit ? (e) => handleEditClick(e, announcement) : undefined}
                          formatTime={formatTime}
                          canEdit={canEdit}
                        />
                      ))}
                    </div>
                  ) : (
                    // Table View
                    <div className="relative overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="border-r whitespace-nowrap">Sr.</TableHead>
                            <TableHead className="border-r whitespace-nowrap">Title</TableHead>
                            <TableHead className="border-r whitespace-nowrap">Category</TableHead>
                            <TableHead className="border-r whitespace-nowrap">Created By</TableHead>
                            <TableHead className="border-r whitespace-nowrap">Text</TableHead>
                            <TableHead className="border-r whitespace-nowrap">Created At</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedAnnouncements.map((announcement: AnnouncementDto, index: number) => (
                            <TableRow
                              key={announcement.id}
                              className="cursor-pointer transition-colors hover:bg-muted/50"
                              onClick={() => handleAnnouncementClick(announcement)}
                            >
                              <TableCell className="border-r whitespace-nowrap">
                                {startIndex + index + 1}
                              </TableCell>
                              <TableCell className="max-w-[150px] border-r">
                                <div className="truncate font-medium">{announcement.title}</div>
                              </TableCell>
                              <TableCell className="border-r whitespace-nowrap">
                                {announcement.category && (
                                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${getCategoryStyles(announcement.category)}`}>
                                    {getCategoryLabel(announcement.category)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="border-r whitespace-nowrap">
                                {announcement.createdBy}
                              </TableCell>
                              <TableCell className="max-w-[250px] border-r">
                                <div className="truncate text-sm text-muted-foreground">
                                  {announcement.text}
                                </div>
                              </TableCell>
                              <TableCell className="border-r text-sm whitespace-nowrap text-muted-foreground">
                                {announcement.createdAt ? formatTime(announcement.createdAt) : "-"}
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  {canEdit && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-primary/10"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEditClick(e, announcement)
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
                                      handleDeleteClick(e, announcement.id!)
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
                  {filteredAndSortedAnnouncements.length > 0 && (
                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <Field orientation="horizontal" className="w-fit">
                        <FieldLabel htmlFor="select-rows-per-page">Rows per page</FieldLabel>
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
                        Showing{" "}
                        {filteredAndSortedAnnouncements.length === 0
                          ? 0
                          : startIndex + 1}{" "}
                        to{" "}
                        {Math.min(
                          startIndex + itemsPerPage,
                          filteredAndSortedAnnouncements.length
                        )}{" "}
                        of {filteredAndSortedAnnouncements.length} announcements
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
                                currentPage === 1 || filteredAndSortedAnnouncements.length === 0
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
                                currentPage === totalPages || filteredAndSortedAnnouncements.length === 0
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
                        icon={Speaker01Icon}
                        strokeWidth={2}
                        className="h-12 w-12 text-muted-foreground"
                      />
                    </EmptyMedia>
                    <EmptyTitle>
                      {searchTerm || hasActiveFilters
                        ? "No Matching Announcements"
                        : "No Announcements"}
                    </EmptyTitle>
                    <EmptyDescription className="text-center text-pretty">
                      {searchTerm || hasActiveFilters ? (
                        <>Try adjusting your search or filters.</>
                      ) : (
                        "Stay updated with the latest announcements."
                      )}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    {(searchTerm || hasActiveFilters) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("")
                          clearAllFilters()
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                    {canEdit && !searchTerm && !hasActiveFilters && (
                      <Button
                        variant="default"
                        onClick={handleNewAnnouncement}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="h-4 w-4" />
                        New Announcement
                      </Button>
                    )}
                  </EmptyContent>
                </Empty>
              )}
            </div>
          )}
        </CardContent>
      </div>

      {/* Announcement Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-[600px]">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="pr-8">{selectedAnnouncement?.title}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  Announcement
                </h4>
                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ wordBreak: "break-word" }}
                >
                  {selectedAnnouncement?.text}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t p-6 pt-4">
            <div className="flex w-full items-center justify-between">
              <div>
                <p className="font-medium">{selectedAnnouncement?.createdBy}</p>
                {selectedAnnouncement?.category && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryStyles(selectedAnnouncement.category)}`}>
                    {getCategoryLabel(selectedAnnouncement.category)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground">
                <HugeiconsIcon icon={ClockIcon} strokeWidth={2} className="h-3 w-3" />
                {selectedAnnouncement?.createdAt ? formatTime(selectedAnnouncement.createdAt) : "-"}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Announcement Dialog */}
      {canEdit && (
        <NewAnnouncementDialog
          open={newAnnouncementDialogOpen}
          onOpenChange={setNewAnnouncementDialogOpen}
          onSubmit={handleSubmitAnnouncement}
          isLoading={isSubmitting}
        />
      )}

      {/* Edit Announcement Dialog */}
      {canEdit && announcementToEdit && (
        <EditAnnouncementDialog
          open={editAnnouncementDialogOpen}
          onOpenChange={setEditAnnouncementDialogOpen}
          announcement={announcementToEdit}
          onSubmit={handleEditAnnouncement}
          isLoading={isSubmitting}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this announcement?
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setAnnouncementToDelete(null)
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