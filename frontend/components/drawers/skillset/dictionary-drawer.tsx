"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mainStore } from "@/store/mainStore"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Delete02Icon,
  EditIcon,
  Add01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface DictionaryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface DictionaryFormData {
  englishText: string
  japaneseText: string
}

interface DictionaryEntry {
  id: number
  englishText: string
  japaneseText: string
}

const ITEMS_PER_PAGE = 20

export function DictionaryDrawer({
  open,
  onOpenChange,
  onSuccess,
}: DictionaryDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState<DictionaryFormData>({
    englishText: "",
    japaneseText: "",
  })
  const [editingEntry, setEditingEntry] = useState<DictionaryEntry | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<DictionaryEntry | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const listContainerRef = useRef<HTMLDivElement>(null)
  const isLoadingMoreRef = useRef(false)
  const searchTermRef = useRef(searchTerm)

  // Refs to track dialog states to prevent drawer from closing.
  // Combined into one flag with a short delay before clearing — mirrors the
  // dropdown-close-timer pattern used in other drawers. Without the delay,
  // the ref flips to false the instant the dialog's open state changes,
  // which can be before Radix's focus-restoration (onCloseAutoFocus) has
  // finished firing — leaving no guard up when the drawer's dismiss logic
  // reacts to that trailing focus/pointer event.
  const isDialogInteractingRef = useRef(false)
  const dialogCloseTimerRef = useRef<NodeJS.Timeout | null>(null)

  const {
    dictionary,
    fetch_dictionary,
    add_dictionary,
    update_dictionary,
    delete_dictionary,
  } = mainStore()

  // Update searchTermRef when searchTerm changes
  useEffect(() => {
    searchTermRef.current = searchTerm
  }, [searchTerm])

  // Update the combined dialog-interacting ref whenever either dialog's
  // open state changes. Opening sets it immediately; closing waits 150ms
  // before clearing it, so the drawer stays guarded through any trailing
  // focus/pointer events caused by the dialog's close/unmount.
  useEffect(() => {
    if (dialogCloseTimerRef.current) {
      clearTimeout(dialogCloseTimerRef.current)
      dialogCloseTimerRef.current = null
    }

    if (formDialogOpen || deleteDialogOpen) {
      isDialogInteractingRef.current = true
    } else {
      dialogCloseTimerRef.current = setTimeout(() => {
        isDialogInteractingRef.current = false
        dialogCloseTimerRef.current = null
      }, 150)
    }
  }, [formDialogOpen, deleteDialogOpen])

  // Filter dictionary entries based on search term
  const filteredDictionary = useMemo(() => {
    if (!searchTerm.trim()) return dictionary || []

    const term = searchTerm.toLowerCase().trim()
    return (dictionary || []).filter((entry: DictionaryEntry) => {
      // Search in English text
      if (entry.englishText.toLowerCase().includes(term)) return true
      // Search in Japanese text
      if (entry.japaneseText.toLowerCase().includes(term)) return true
      return false
    })
  }, [dictionary, searchTerm])

  // Get visible entries based on pagination
  const visibleEntries = useMemo(() => {
    return filteredDictionary.slice(0, visibleCount)
  }, [filteredDictionary, visibleCount])

  const hasMoreEntries = visibleCount < filteredDictionary.length

  // Load dictionary data when drawer opens
  useEffect(() => {
    if (open) {
      loadDictionary()
      // Reset search term and pagination when drawer opens
      setSearchTerm("")
      setVisibleCount(ITEMS_PER_PAGE)
    }
  }, [open])

  const loadDictionary = async () => {
    setIsLoading(true)
    try {
      await fetch_dictionary()
    } catch (error) {
      console.error("Failed to load dictionary:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset form when drawer opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    // Check if a dialog is open (or just closed within the grace period)
    // before allowing the drawer to close
    if (!newOpen && isDialogInteractingRef.current) {
      return
    }

    if (!newOpen) {
      // Reset form when closing
      setFormData({
        englishText: "",
        japaneseText: "",
      })
      setEditingEntry(null)
      setFormDialogOpen(false)
      setEntryToDelete(null)
      setDeleteDialogOpen(false)
      setSearchTerm("")
      setVisibleCount(ITEMS_PER_PAGE)
    }
    onOpenChange(newOpen)
  }

  const handleAddNew = () => {
    setEditingEntry(null)
    setFormData({
      englishText: "",
      japaneseText: "",
    })
    setFormDialogOpen(true)
  }

  const handleEdit = (entry: DictionaryEntry) => {
    setEditingEntry(entry)
    setFormData({
      englishText: entry.englishText,
      japaneseText: entry.japaneseText,
    })
    setFormDialogOpen(true)
  }

  const handleCancelForm = () => {
    setEditingEntry(null)
    setFormData({
      englishText: "",
      japaneseText: "",
    })
    setFormDialogOpen(false)
  }

  const handleDeleteClick = (entry: DictionaryEntry) => {
    setEntryToDelete(entry)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return

    setIsDeleting(true)
    try {
      await delete_dictionary(entryToDelete.id)
      await loadDictionary()
      setDeleteDialogOpen(false)
      setEntryToDelete(null)

      // If we were editing the deleted entry, clear the form
      if (editingEntry?.id === entryToDelete.id) {
        handleCancelForm()
      }

      onSuccess?.()
    } catch (error) {
      console.error("Failed to delete dictionary entry:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete entry")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.englishText || !formData.japaneseText) return

    setIsSubmitting(true)

    try {
      if (editingEntry) {
        // Update existing entry
        await update_dictionary(editingEntry.id, {
          englishText: formData.englishText.trim(),
          japaneseText: formData.japaneseText.trim(),
        })
      } else {
        // Create new entry
        await add_dictionary({
          englishText: formData.englishText.trim(),
          japaneseText: formData.japaneseText.trim(),
        })
      }

      // Refresh the dictionary list
      await loadDictionary()

      // Reset form and close dialog
      setFormData({
        englishText: "",
        japaneseText: "",
      })
      setEditingEntry(null)
      setFormDialogOpen(false)

      // Trigger success callback
      onSuccess?.()
    } catch (error) {
      console.error(
        `Failed to ${editingEntry ? "update" : "create"} dictionary entry:`,
        error
      )
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid =
    formData.englishText.trim() && formData.japaneseText.trim()

  // Handle scroll to load more
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      const bottom =
        target.scrollHeight - target.scrollTop <= target.clientHeight + 50 // 50px threshold for smoother loading

      if (bottom && hasMoreEntries && !isLoadingMoreRef.current && !isLoading) {
        isLoadingMoreRef.current = true
        setIsLoadingMore(true)

        // Simulate loading delay for better UX
        setTimeout(() => {
          setVisibleCount((prev) =>
            Math.min(prev + ITEMS_PER_PAGE, filteredDictionary.length)
          )
          setIsLoadingMore(false)
          setTimeout(() => {
            isLoadingMoreRef.current = false
          }, 100)
        }, 300)
      }
    },
    [hasMoreEntries, isLoading, filteredDictionary.length]
  )

  // Reset pagination when search changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
    isLoadingMoreRef.current = false
    // Reset scroll position
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0
    }
  }, [searchTerm])

  // Reset pagination when dictionary data changes (e.g., after add/delete/update)
  useEffect(() => {
    if (!isLoading) {
      setVisibleCount(ITEMS_PER_PAGE)
      if (listContainerRef.current) {
        listContainerRef.current.scrollTop = 0
      }
    }
  }, [dictionary, isLoading])

  // Handle form dialog open change
  const handleFormDialogOpenChange = (newOpen: boolean) => {
    setFormDialogOpen(newOpen)
    if (!newOpen) {
      // Reset form when dialog closes
      setEditingEntry(null)
      setFormData({
        englishText: "",
        japaneseText: "",
      })
    }
  }

  // Handle delete dialog open change
  const handleDeleteDialogOpenChange = (newOpen: boolean) => {
    setDeleteDialogOpen(newOpen)
    if (!newOpen) {
      setEntryToDelete(null)
    }
  }

  // Guard against the drawer treating clicks inside a portaled Dialog (or
  // any dropdown/listbox) as "outside" clicks
  const handlePointerDownOutside = (e: Event) => {
    if (isDialogInteractingRef.current) {
      e.preventDefault()
      return
    }
    const target = e.target as HTMLElement
    if (
      target.closest('[role="dialog"]') ||
      target.closest('[role="listbox"]') ||
      target.closest('[role="option"]') ||
      target.closest("[data-dropdown-trigger]")
    ) {
      e.preventDefault()
    }
  }

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
        <DrawerContent
          className="right-0 left-auto h-full w-[75%] sm:w-[60%] md:w-[50%] lg:w-[40%] xl:w-[30%]"
          onPointerDownOutside={handlePointerDownOutside}
          onEscapeKeyDown={(e) => {
            if (isDialogInteractingRef.current) {
              e.preventDefault()
            }
          }}
        >
          <DrawerHeader className="shrink-0 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle>Translations for the skillset table</DrawerTitle>
              </div>
              <Button size="sm" onClick={handleAddNew}>
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={2}
                  className="h-4 w-4"
                />
                Add New
              </Button>
            </div>

            {/* Search Bar */}
            <div className="shrink-0 pt-1">
              <div className="relative">
                <HugeiconsIcon
                  icon={Search01Icon}
                  strokeWidth={2}
                  className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search translations in English or Japanese..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </DrawerHeader>

          <div
            ref={listContainerRef}
            className="flex-1 overflow-y-auto"
            onScroll={handleScroll}
          >
            <div className="px-6 py-4">
              {/* Dictionary List */}
              <div>
                <h3 className="mb-4 text-lg font-semibold">
                  All Translations ({filteredDictionary.length})
                </h3>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                  </div>
                ) : filteredDictionary.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? "No matching translations found"
                        : "No translations found"}
                    </p>
                    {searchTerm ? (
                      <p className="text-sm text-muted-foreground">
                        Try searching with different keywords
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Click "Add New" to create your first translation
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {visibleEntries.map((entry: DictionaryEntry) => (
                        <div
                          key={entry.id}
                          className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                            editingEntry?.id === entry.id
                              ? "border-primary bg-muted/30"
                              : ""
                          }`}
                        >
                          <div className="flex flex-1 items-center gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {entry.englishText}
                                </span>
                                <span className="text-muted-foreground">→</span>
                                <span>{entry.japaneseText}</span>
                              </div>
                            </div>
                            {editingEntry?.id === entry.id && (
                              <Badge variant="outline" className="shrink-0">
                                Editing
                              </Badge>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(entry)}
                              disabled={isSubmitting}
                            >
                              <HugeiconsIcon
                                icon={EditIcon}
                                strokeWidth={2}
                                className="h-4 w-4"
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(entry)}
                              disabled={isSubmitting}
                            >
                              <HugeiconsIcon
                                icon={Delete02Icon}
                                strokeWidth={2}
                                className="h-4 w-4"
                              />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Loading more indicator */}
                    {hasMoreEntries && (
                      <div className="mt-4 border-t pt-4">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                            <span>Loading more entries...</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Showing {visibleEntries.length} of{" "}
                            {filteredDictionary.length} entries
                          </span>
                        </div>
                      </div>
                    )}

                    {/* All loaded indicator */}
                    {!hasMoreEntries && filteredDictionary.length > 0 && (
                      <div className="mt-4 border-t pt-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          Showing all {filteredDictionary.length} entries
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <DrawerFooter className="shrink-0 border-t">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Form Dialog - Add/Edit Entry */}
      <Dialog
        open={formDialogOpen}
        onOpenChange={handleFormDialogOpenChange}
        modal={true}
      >
        <DialogContent
          className="sm:max-w-[500px]"
          onPointerDownOutside={(e) => {
            // Prevent closing the dialog when clicking outside
            e.preventDefault()
          }}
          onCloseAutoFocus={(e) => {
            // Prevent Radix from returning focus to the trigger button on
            // close — that refocus fires while the Drawer's own focus trap
            // is still active, and is what actually causes the Drawer to
            // dismiss itself right after this dialog closes.
            e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            // Close the dialog on Escape, but don't close the drawer
            setFormDialogOpen(false)
            setEditingEntry(null)
            setFormData({
              englishText: "",
              japaneseText: "",
            })
            e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Translation" : "Add New Translation"}
            </DialogTitle>
            <DialogDescription>
              {editingEntry
                ? "Update the translation for this entry."
                : "Create a new translation entry for the skillset table."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* English Text */}
            <div className="space-y-2">
              <Label htmlFor="englishText">
                English Text <span className="text-red-500">*</span>
              </Label>
              <Input
                id="englishText"
                placeholder="Enter English text (e.g., Yes)"
                value={formData.englishText}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    englishText: e.target.value,
                  })
                }
                required
                className="w-full"
                autoFocus
              />
            </div>

            {/* Japanese Text */}
            <div className="space-y-2">
              <Label htmlFor="japaneseText">
                Japanese Text <span className="text-red-500">*</span>
              </Label>
              <Input
                id="japaneseText"
                placeholder="Enter Japanese translation (e.g., はい)"
                value={formData.japaneseText}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    japaneseText: e.target.value,
                  })
                }
                required
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelForm}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting
                ? editingEntry
                  ? "Updating..."
                  : "Adding..."
                : editingEntry
                  ? "Update Entry"
                  : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
        modal={true}
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            // Prevent closing the dialog when clicking outside
            e.preventDefault()
          }}
          onCloseAutoFocus={(e) => {
            // Same reasoning as the form dialog above
            e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            // Close the dialog on Escape, but don't close the drawer
            setDeleteDialogOpen(false)
            setEntryToDelete(null)
            e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete Dictionary Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the translation for{" "}
              <span className="font-semibold">
                "{entryToDelete?.englishText}"
              </span>
              ?
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
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
