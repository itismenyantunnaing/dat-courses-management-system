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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  PlusSignIcon,
  ClockIcon,
  SortByDown01Icon,
  SortByUp01Icon,
  FilterMailIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import { FeedbackCard } from "./cards/feedback-card"
import { NewFeedbackDialog } from "./dialogs/newFeedback-dialog"
import { EditFeedbackDialog } from "./dialogs/editFeedback-dialog"
import { FeedbackSuggestionDto } from "@/types/feedback"
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
}

export function FeedbackContainer() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSuggestionDto | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [newFeedbackDialogOpen, setNewFeedbackDialogOpen] = useState(false)
  const [editFeedbackDialogOpen, setEditFeedbackDialogOpen] = useState(false)
  const [feedbackToEdit, setFeedbackToEdit] = useState<FeedbackSuggestionDto | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedbackToDelete, setFeedbackToDelete] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Filter state
  const [filters, setFilters] = useState<FeedbackFilterState>({
    department: [],
    team: [],
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
    setProfile
  } = mainStore()

  // Determine user role
  const userRole = profile?.role?.toLowerCase() || ''
  const isLearner = userRole === 'learner'
  const isAdminOrApprover = userRole === 'admin' || userRole === 'approver'
  const canCreateFeedback = isLearner
  const canEditFeedback = isLearner

  // Fetch feedback data on component mount based on role
  useEffect(() => {
    const loadFeedback = async () => {
      if (profile) {
        setProfile(profile);
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
  }, [fetch_FeedbackData, fetch_FeedbackByEmployeeId, profile?.id, isLearner, isAdminOrApprover, profile, setProfile])

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some((filterArray) => filterArray.length > 0)

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
        feedbackItem.team?.toLowerCase().includes(searchLower)

      // Department filter
      const matchesDepartment = filters.department.length === 0 || 
        (feedbackItem.department && filters.department.includes(feedbackItem.department))

      // Team filter
      const matchesTeam = filters.team.length === 0 || 
        (feedbackItem.team && filters.team.includes(feedbackItem.team))

      return matchesSearch && matchesDepartment && matchesTeam
    })
    .sort((a, b) => {
      const dateA = getEffectiveDate(a).getTime()
      const dateB = getEffectiveDate(b).getTime()

      if (sortOrder === 'desc') {
        return dateB - dateA
      } else {
        return dateA - dateB
      }
    })

  // Handle feedback card click
  const handleFeedbackClick = (feedbackItem: FeedbackSuggestionDto) => {
    setSelectedFeedback(feedbackItem)
    setDetailDialogOpen(true)
  }

  // Handle edit button click
  const handleEditClick = (e: React.MouseEvent, feedbackItem: FeedbackSuggestionDto) => {
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

      if (result.includes('successfully')) {
        setMessage({ type: 'success', text: result })
        setDeleteDialogOpen(false)
        setFeedbackToDelete(null)

        if (selectedFeedback?.id === feedbackToDelete) {
          setDetailDialogOpen(false)
          setSelectedFeedback(null)
        }

        setTimeout(() => setMessage(null), 1000)
      } else {
        setMessage({ type: 'error', text: result })
      }
    } catch (error) {
      console.error("Failed to delete feedback:", error)
      setMessage({ type: 'error', text: 'Failed to delete feedback' })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle new feedback
  const handleNewFeedback = () => {
    setNewFeedbackDialogOpen(true)
  }

  // Handle submit feedback
  const handleSubmitFeedback = async (subject: string, description: string) => {
    setIsSubmitting(true)
    try {
      const employeeId = profile?.id

      if (!employeeId) {
        throw new Error('Employee ID not found')
      }

      const newFeedback: FeedbackSuggestionDto = {
        employeeId: employeeId,
        subject: subject,
        description: description,
      }

      const result = await add_FeedbackData(newFeedback)

      if (result.includes('successfully')) {
        setNewFeedbackDialogOpen(false)
        setMessage({ type: 'success', text: result })
        setTimeout(() => setMessage(null), 1000)
      } else {
        setMessage({ type: 'error', text: result })
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      setMessage({ type: 'error', text: 'Failed to submit feedback' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit feedback
  const handleEditFeedback = async (id: number, subject: string, description: string) => {
    setIsSubmitting(true)
    try {
      const updatedFeedback: FeedbackSuggestionDto = {
        id: id,
        employeeId: feedbackToEdit?.employeeId || '',
        subject: subject,
        description: description,
      }

      const result = await update_FeedbackData(id, updatedFeedback)

      if (result.includes('successfully')) {
        setEditFeedbackDialogOpen(false)
        setFeedbackToEdit(null)
        setMessage({ type: 'success', text: result })
        setTimeout(() => setMessage(null), 1000)
      } else {
        setMessage({ type: 'error', text: result })
      }
    } catch (error) {
      console.error("Failed to update feedback:", error)
      setMessage({ type: 'error', text: 'Failed to update feedback' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get display time for detail dialog
  const getDisplayTime = (feedbackItem: FeedbackSuggestionDto | null) => {
    if (!feedbackItem) return 'Just now'
    if (feedbackItem.updatedAt) {
      return formatTime(feedbackItem.updatedAt)
    }
    if (feedbackItem.createdAt) {
      return formatTime(feedbackItem.createdAt)
    }
    return 'Just now'
  }

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  // Keyboard shortcut for search focus (Cmd+K / Ctrl+K)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault()
      searchInputRef.current?.focus()
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 pt-4 pb-6">
        <CardContent className="px-0">
          {/* Header with Search and New Button */}
          <div className="mb-6 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
            <InputGroup className="w-[400px]" onKeyDown={handleKeyDown}>
              <InputGroupInput
                ref={searchInputRef}
                placeholder="Search by employee, subject, description..."
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
                <Kbd>⌘K</Kbd>
              </InputGroupAddon>
            </InputGroup>

            <div className="flex items-center gap-2">
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
                  {/* Department Filter */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Department
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {getFilterUniqueValues("department").map((value) => (
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
                      <DropdownMenuSubContent>
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
                      icon={sortOrder === 'desc' ? SortByUp01Icon : SortByDown01Icon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{sortOrder === 'desc' ? 'Least recent' : 'Most recent'}</p>
                </TooltipContent>
              </Tooltip>

              {canCreateFeedback && (
                <Button
                  variant="default"
                  onClick={handleNewFeedback}
                  className="bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                  title={!canCreateFeedback ? "Only learners can create feedback" : ""}
                >
                  <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
                  New Feedback
                </Button>
              )}
            </div>
          </div>

          {/* Role Indicator */}
          <div className="mx-4 mb-4">
            <span className="text-sm text-muted-foreground">
              {isLearner ? 'Showing your feedback' :
                isAdminOrApprover ? 'Showing all feedback' :
                  'Showing feedback'}
            </span>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mx-4 mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
              {message.text}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="mx-4 py-12 text-center text-muted-foreground">
              Loading feedback...
            </div>
          )}

          {/* Feedback Cards Grid */}
          {!isLoading && (
            <div className="mx-4">
              {filteredAndSortedFeedbacks.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {searchTerm || hasActiveFilters ? (
                    <>
                      No feedback found matching {searchTerm && `"${searchTerm}"`}
                      {searchTerm && hasActiveFilters && " and "}
                      {hasActiveFilters && "selected filters"}
                    </>
                  ) : (
                    isLearner ? (
                      <>You haven't submitted any feedback yet</>
                    ) : (
                      <>No feedback available</>
                    )
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredAndSortedFeedbacks.map((feedbackItem) => (
                    <FeedbackCard
                      key={feedbackItem.id}
                      feedback={{
                        id: feedbackItem.id!,
                        employee: {
                          name: feedbackItem.employeeName || `Employee ${feedbackItem.employeeId}`,
                          email: `${feedbackItem.employeeId}@company.com`,
                          department: feedbackItem.department || "N/A",
                          team: feedbackItem.team || "N/A",
                          avatar: feedbackItem.profilePhotoPath || "",
                        },
                        subject: feedbackItem.subject,
                        description: feedbackItem.description,
                        createdAt: feedbackItem.createdAt || new Date().toISOString(),
                        updatedAt: feedbackItem.updatedAt,
                      }}
                      onClick={() => handleFeedbackClick(feedbackItem)}
                      onDelete={handleDeleteClick}
                      onEdit={canEditFeedback ? (e) => handleEditClick(e, feedbackItem) : undefined}
                      formatTime={formatTime}
                      getInitials={getInitials}
                      canEdit={canEditFeedback}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>

      {/* Feedback Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-[600px]">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="pr-8">
              {selectedFeedback?.subject}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  Description
                </h4>
                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ wordBreak: 'break-word' }}
                >
                  {selectedFeedback?.description}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t p-6 pt-4">
            <div className="flex w-full items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={selectedFeedback?.profilePhotoPath || ""}
                    alt={selectedFeedback?.employeeName || `Employee ${selectedFeedback?.employeeId}`}
                  />
                  <AvatarFallback className="text-lg text-primary">
                    {selectedFeedback?.employeeName
                      ? getInitials(selectedFeedback.employeeName)
                      : selectedFeedback?.employeeId?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedFeedback?.employeeName || `Employee ${selectedFeedback?.employeeId}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                    {selectedFeedback?.department && (
                      <>
                        <span>{selectedFeedback.department}</span>
                        <span>•</span>
                      </>
                    )}
                    {selectedFeedback?.team && (
                      <span>{selectedFeedback.team}</span>
                    )}
                    {!selectedFeedback?.department && !selectedFeedback?.team && (
                      <span>ID: {selectedFeedback?.employeeId}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground">
                <HugeiconsIcon
                  icon={ClockIcon}
                  strokeWidth={2}
                  className="h-3 w-3"
                />
                {getDisplayTime(selectedFeedback)}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setFeedbackToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}