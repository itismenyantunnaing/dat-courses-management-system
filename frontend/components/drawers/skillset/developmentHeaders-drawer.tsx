"use client"

import { useState, useEffect, useRef } from "react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HugeiconsIcon } from "@hugeicons/react"
import { AddIcon } from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"

interface DevelopmentHeadersDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTypes?: string[]
  onSave?: (types: string[]) => Promise<void>
}

export function DevelopmentHeadersDrawer({
  open,
  onOpenChange,
  initialTypes = [],
  onSave,
}: DevelopmentHeadersDrawerProps) {
  const [types, setTypes] = useState<string[]>([])
  const [newType, setNewType] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [originalTypes, setOriginalTypes] = useState<string[]>([])

  // Initialize types when drawer opens
  useEffect(() => {
    if (open) {
      setTypes([...initialTypes])
      setOriginalTypes([...initialTypes])
      setNewType("")
      setError(null)
    }
  }, [open, initialTypes])

  // Check if there are new types added
  const hasNewTypes = () => {
    return types.some((type) => !originalTypes.includes(type))
  }

  const handleAddType = () => {
    const trimmed = newType.trim()
    if (trimmed && !types.includes(trimmed)) {
      setTypes([...types, trimmed])
      setNewType("")
      setError(null)
    } else if (types.includes(trimmed)) {
      setError("This development type already exists")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddType()
    }
  }

  const handleSubmit = async () => {
    if (types.length === 0) {
      setError("Please add at least one development type")
      return
    }

    if (!hasNewTypes()) {
      setError("No new types to add")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Only send the new types that were added
      const newTypes = types.filter((type) => !originalTypes.includes(type))
      await onSave?.(newTypes)
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save development types"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle pointer down outside - prevent drawer from closing when interacting with content
  const handlePointerDownOutside = (e: Event) => {
    const target = e.target as HTMLElement
    // Allow closing when clicking on the overlay or outside
    // But prevent if clicking on interactive elements inside the drawer
    if (
      target.closest("input") ||
      target.closest("button") ||
      target.closest('[role="dialog"]')
    ) {
      // Don't prevent default for these elements
      return
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      onPointerDownOutside={handlePointerDownOutside}
    >
      <DrawerContent className="right-0 left-auto h-full w-full max-w-2xl">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>Manage Development Types</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <div className="space-y-6">
              {/* Add new type */}
              <div className="space-y-2">
                <Label htmlFor="newType">Add Development Type</Label>
                <div className="flex gap-2">
                  <Input
                    id="newType"
                    placeholder="e.g., Web Development"
                    value={newType}
                    onChange={(e) => {
                      setNewType(e.target.value)
                      setError(null)
                    }}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleAddType} variant="outline">
                    <HugeiconsIcon
                      icon={AddIcon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                    Add
                  </Button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* List of types */}
              <div className="space-y-3">
                <Label>Current Development Types</Label>
                {types.length === 0 ? (
                  <div className="rounded-md border-2 border-dashed py-8 text-center text-sm text-muted-foreground">
                    No development types added yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {types.map((type, index) => (
                      <div
                        key={index}
                        className="flex items-center rounded-md bg-muted/50 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-sm">
                            {index + 1}
                          </Badge>
                          <span className="font-medium">
                            {type}
                            {originalTypes.includes(type) ? (
                              <span className="ml-2 text-xs text-green-600">
                                (existing)
                              </span>
                            ) : (
                              <span className="ml-2 text-xs text-blue-600">
                                (new)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="rounded-md bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">{types.length}</span>{" "}
                  development type{types.length !== 1 ? "s" : ""} configured
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  {hasNewTypes() ? (
                    <span className="text-green-600">
                      {
                        types.filter((type) => !originalTypes.includes(type))
                          .length
                      }{" "}
                      new type(s) ready to add
                    </span>
                  ) : (
                    "No new types to add"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t">
          <div className="flex gap-2">
            <DrawerClose asChild>
              <Button
                variant="outline"
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </DrawerClose>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || types.length === 0 || !hasNewTypes()}
            >
              {isSubmitting ? "Saving..." : "Save Development Types"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
