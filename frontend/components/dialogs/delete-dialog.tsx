/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { deleteOptions, allTabs } from "../nav/nav-group"

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedItems?: string[]
}

export function DeleteDialog({
  open,
  onOpenChange,
  preselectedItems = [],
}: DeleteDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteComboboxOpen, setIsDeleteComboboxOpen] = useState(false)
  const [isAllSelected, setIsAllSelected] = useState(false)

  // Use ref to track if we've already set preselected items for the current dialog session
  const hasSetPreselectedForSession = useRef(false)
  const previousOpenState = useRef(false)

  // Reset state when dialog opens and set preselected items
  useEffect(() => {
    // Check if dialog just opened (was closed and now open)
    const justOpened = open && !previousOpenState.current

    if (justOpened) {
      setIsDeleting(false)
      setIsDeleteComboboxOpen(false)
      hasSetPreselectedForSession.current = false

      // Set preselected items if any exist
      if (preselectedItems.length > 0) {
        setSelectedItems(preselectedItems)
        hasSetPreselectedForSession.current = true
      } else {
        setSelectedItems([])
      }
    }

    // If dialog just closed, reset everything
    if (!open && previousOpenState.current) {
      setSelectedItems([])
      setIsDeleteComboboxOpen(false)
      setIsDeleting(false)
      hasSetPreselectedForSession.current = false
    }

    // Update previous open state for next render
    previousOpenState.current = open
  }, [open, preselectedItems])

  useEffect(() => {
    setIsAllSelected(
      selectedItems.length === deleteOptions.length && deleteOptions.length > 0
    )
  }, [selectedItems])

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    )
  }

  const removeItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedItems((prev) => prev.filter((id) => id !== itemId))
  }

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems([])
    } else {
      setSelectedItems(deleteOptions.map((option) => option.id))
    }
  }

  const handleDelete = () => {
    if (selectedItems.length === 0) return

    // Get labels for all selected items
    const itemLabels = selectedItems
      .map(id => deleteOptions.find(opt => opt.id === id)?.label || id)
      .join(', ');

    // Show ONE confirmation for all items
    if (!confirm(`Are you sure you want to delete: ${itemLabels}?\n\nThis action cannot be undone!`)) {
      return;
    }

    setIsDeleting(true)

    // Execute all deletions
    selectedItems.forEach((itemId) => {
      const tab = allTabs.find((t) => t.id === itemId)
      if (tab && tab.onDelete) {
        tab.onDelete([itemId])
      }
    })

    setIsDeleting(false)
    onOpenChange(false)
    setSelectedItems([])
    hasSetPreselectedForSession.current = false
    previousOpenState.current = false
  }

  const handleCancel = () => {
    onOpenChange(false)
    setSelectedItems([])
    setIsDeleteComboboxOpen(false)
    hasSetPreselectedForSession.current = false
    previousOpenState.current = false
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            Delete Data
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete data from
            the system.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <Popover
              open={isDeleteComboboxOpen}
              onOpenChange={setIsDeleteComboboxOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  role="combobox"
                  aria-expanded={isDeleteComboboxOpen}
                  className="h-auto w-full justify-between border border-input bg-background py-2 hover:border-input hover:bg-background focus:bg-background focus:ring-0 focus:ring-offset-0 active:bg-background data-[state=open]:bg-background"
                >
                  <div className="flex flex-wrap gap-1">
                    {selectedItems.length > 0 ? (
                      selectedItems.map((itemId) => {
                        const item = deleteOptions.find(
                          (opt) => opt.id === itemId
                        )
                        return (
                          <Badge
                            key={itemId}
                            variant="secondary"
                            className="gap-1"
                          >
                            {item?.label}
                            <span
                              onClick={(e) => removeItem(itemId, e)}
                              className="ml-1 inline-flex cursor-pointer items-center justify-center rounded-full p-0.5 hover:bg-muted"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  removeItem(itemId, e as any)
                                }
                              }}
                            >
                              ✕
                            </span>
                          </Badge>
                        )
                      })
                    ) : (
                      <span className="text-muted-foreground">
                        Choose data to delete...
                      </span>
                    )}
                  </div>
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    strokeWidth={2}
                    className="ml-2 h-4 w-4 shrink-0 opacity-50"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <Command>
                  <div className="grid w-full grid-cols-[1fr_auto] items-center gap-2">
                    <CommandInput placeholder="Search items..." />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="whitespace-nowrap"
                      disabled={deleteOptions.length === 0}
                    >
                      {isAllSelected ? "Deselect All" : "Select All"}
                    </Button>
                  </div>

                  <CommandList>
                    <CommandEmpty>No item found.</CommandEmpty>
                    <CommandGroup>
                      {deleteOptions.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={option.label}
                          onSelect={() => toggleItem(option.id)}
                          data-checked={selectedItems.includes(option.id)}
                          className="flex w-full cursor-pointer items-center justify-between"
                        >
                          <span>{option.label}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={selectedItems.length === 0 || isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="mr-2">⏳</span>
                Deleting...
              </>
            ) : (
              `Delete (${selectedItems.length}) Item${selectedItems.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
