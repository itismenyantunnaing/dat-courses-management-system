/* eslint-disable react-hooks/static-components */
/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import { Upload05Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { importTabs, VISIBLE_TABS_COUNT } from "../nav/tabs-config"
import { toast } from "sonner"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  label?: string // Used ONLY for filtering which tabs to show
}

export function ImportDialog({
  open,
  onOpenChange,
  label = "all",
}: ImportDialogProps) {
  const [activeImportTab, setActiveImportTab] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Get the filtered tabs based on label prop
  const filteredTabs = useMemo(() => {
    if (label === "all") {
      return importTabs
    }
    // Filter tabs based on label
    return importTabs.filter((tab) => {
      if (label === "employees") return tab.id === "employees"
      if (label === "holidays") return tab.id === "holidays"
      return tab.id === label
    })
  }, [label])

  // Check if we should show tabs (more than 1 tab)
  const showTabs = filteredTabs.length > 1

  // Get the current tab data
  const currentTabData = useMemo(() => {
    if (showTabs) {
      return importTabs.find((tab) => tab.id === activeImportTab)
    } else {
      // If only one tab, use the first filtered tab
      return filteredTabs[0] || importTabs[0]
    }
  }, [showTabs, activeImportTab, filteredTabs])

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      if (showTabs && filteredTabs.length > 0) {
        setActiveImportTab(filteredTabs[0].id)
      }
      setSelectedFile(null)
      setIsDragging(false)
      setIsProcessing(false)
      // Reset file input ref
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [open, showTabs, filteredTabs])

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveImportTab(tabId)
    setSelectedFile(null)
    setIsDragging(false)
    setIsProcessing(false)
    // Reset file input ref
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFileChange = (file: File | null) => {
    if (file && currentTabData) {
      setSelectedFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  // Import logic based on tab config
  const handleImport = async () => {
    if (!currentTabData || !selectedFile) {
      toast.warning("Please select a file first")
      return
    }

    setIsProcessing(true)

    try {
      // Use the centralized onImport function from tabs-config.ts
      const result = await currentTabData.onImport(selectedFile)

      // Handle optional result object or simple success
      if (result && typeof result === "object") {
        if (result.success) {
          onOpenChange(false)
        }
      } else {
        toast.success(` Successfully imported ${currentTabData.label} data!`)
        onOpenChange(false)
      }
    } catch (error) {
      console.error(" Import error:", error)
      toast.error(
        ` Failed to import: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    // Prevent cancel during processing
    if (isProcessing) return
    onOpenChange(false)
  }

  // File upload area component - FIXED with useCallback
  const FileUploadArea = useCallback(() => {
    // Use a more reliable click handler
    const handleBrowseClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Direct click without setTimeout
      if (!isProcessing && fileInputRef.current) {
        fileInputRef.current.click()
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      if (file && currentTabData) {
        setSelectedFile(file)
      }
      // Reset input value to allow selecting same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }

    // Also try using the button's onClick directly without ref
    const handleButtonClick = () => {
      if (!isProcessing && fileInputRef.current) {
        fileInputRef.current.click()
      }
    }

    return (
      <div className="space-y-4">
        <div
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25"
          } ${!selectedFile && !isProcessing ? "cursor-pointer" : ""} ${
            isProcessing ? "pointer-events-none opacity-60" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="pointer-events-none rounded-full bg-muted p-3">
              <HugeiconsIcon
                icon={Upload05Icon}
                strokeWidth={1.5}
                className="size-8 text-muted-foreground"
              />
            </div>
            <div className="pointer-events-none space-y-2 text-center">
              <p className="text-sm">
                {selectedFile ? (
                  selectedFile.name
                ) : (
                  <>
                    Choose a excel file or drag & drop it here.
                    <br />
                    Your excel file tab name has to be{" "}
                    <span className="font-bold text-blue-600">
                      {currentTabData?.label}
                    </span>
                    .
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum {currentTabData?.maxSize || 10} MB file size
              </p>
              {selectedFile && (
                <p className="text-xs text-green-600">
                  ✓ File selected:{" "}
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              ref={fileInputRef}
              onChange={handleInputChange}
              accept={currentTabData?.accept}
              disabled={isProcessing}
              key={`file-input-${currentTabData?.id || "default"}-${open}`}
            />
            <div className="pointer-events-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleButtonClick}
                disabled={isProcessing}
                className="relative z-10 cursor-pointer hover:bg-muted/80"
              >
                Browse Files
              </Button>
              {selectedFile && !isProcessing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }, [isDragging, isProcessing, selectedFile, currentTabData, open])

  // Single tab view (no tab selector)
  if (!showTabs) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[550px]"
          disableClose={isProcessing}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Prevent dialog from closing when clicking inside dropdown
            const target = e.target as HTMLElement
            if (
              target.closest('[role="menu"]') ||
              target.closest('[role="listbox"]') ||
              target.closest("button") ||
              target.closest("input")
            ) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {currentTabData?.importTitle || "Import Data"}
            </DialogTitle>
            <DialogDescription>
              {currentTabData?.importDescription ||
                "Upload your data file to import it into the system."}
            </DialogDescription>
          </DialogHeader>

          <FileUploadArea />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing
                ? "Processing..."
                : `Import ${currentTabData?.label || "Data"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Tabs view (when multiple tabs)
  const visibleImportTabs = filteredTabs.slice(0, VISIBLE_TABS_COUNT)
  const dropdownImportTabs = filteredTabs.slice(VISIBLE_TABS_COUNT)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[550px]"
        disableClose={isProcessing}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Prevent dialog from closing when clicking inside dropdown
          const target = e.target as HTMLElement
          if (
            target.closest('[role="menu"]') ||
            target.closest('[role="listbox"]') ||
            target.closest("button") ||
            target.closest("input")
          ) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {currentTabData?.importTitle || "Import Data"}
          </DialogTitle>
          <DialogDescription>
            {currentTabData?.importDescription ||
              "Upload your data file to import it into the system."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeImportTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <div className="flex items-center gap-2">
            <TabsList className="h-auto w-full">
              <div
                className="grid w-full gap-1"
                style={{
                  gridTemplateColumns: `repeat(${visibleImportTabs.length}, 1fr)`,
                }}
              >
                {visibleImportTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="w-full"
                    disabled={isProcessing}
                    onClick={() => {
                      setSelectedFile(null)
                      setIsDragging(false)
                      setIsProcessing(false)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>

            {dropdownImportTabs.length > 0 && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 whitespace-nowrap"
                    disabled={isProcessing}
                  >
                    More ({dropdownImportTabs.length})
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                      className="ml-1 size-3"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {dropdownImportTabs.map((tab) => (
                    <DropdownMenuItem
                      key={tab.id}
                      disabled={isProcessing}
                      onSelect={() => {
                        setActiveImportTab(tab.id)
                        setSelectedFile(null)
                        setIsDragging(false)
                        setIsProcessing(false)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
                      }}
                      className="flex items-center justify-between"
                    >
                      <span>{tab.label}</span>
                      {activeImportTab === tab.id && (
                        <span className="h-4 w-4 text-primary">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {filteredTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              <FileUploadArea />
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter className="flex">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isProcessing}
            className="flex-1"
          >
            {isProcessing
              ? "Processing..."
              : `Import ${currentTabData?.label || "Data"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
