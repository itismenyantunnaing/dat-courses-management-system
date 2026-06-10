/* eslint-disable react-hooks/static-components */
/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
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
import { CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Csv01Icon,
  Pdf01Icon,
  Xls01Icon,
} from "@hugeicons/core-free-icons"
import { exportTabs, VISIBLE_TABS_COUNT } from "../nav/tabs-config"

// Create an "All" tab configuration
const allTab = {
  id: "all",
  label: "All",
  exportTitle: "Export All Data",
  exportDescription: "Export all data from the system in your preferred format.",
  onExport: (format: string) => {
    console.log(`Exporting all data as ${format}`)
    exportTabs.forEach((tab) => {
      tab.onExport(format)
    })
  },
}

// Combine "All" tab with existing tabs
const exportTabsWithAll = [allTab, ...exportTabs]

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  label?: string
}

export function ExportDialog({ open, onOpenChange, label = "all" }: ExportDialogProps) {
  const [activeExportTab, setActiveExportTab] = useState("")

  // Check if we should show tabs (only for "all" label)
  const showTabs = label === "all" || label === "All"

  // Get the current tab data
  const currentTabData = useMemo(() => {
    if (showTabs) {
      return exportTabsWithAll.find((tab) => tab.id === activeExportTab)
    } else {
      // Find the matching single tab
      const matchingTab = exportTabsWithAll.find((tab) => {
        if (label === "employees") return tab.id === "employees"
        if (label === "courses") return tab.id === "courses"
        if (label === "seminar") return tab.id === "seminar"
        if (label === "exams") return tab.id === "exams"
        if (label === "dashboard") return tab.id === "dashboard"
        return tab.id === label
      })
      return matchingTab || exportTabsWithAll[0]
    }
  }, [showTabs, activeExportTab, label])

  // Reset when dialog opens
  useEffect(() => {
    if (open && showTabs && exportTabsWithAll.length > 0) {
      setActiveExportTab(exportTabsWithAll[0].id)
    }
  }, [open, showTabs])

  const handleExportClick = useCallback(
    (format: string) => {
      if (currentTabData) {
        currentTabData.onExport(format)
      }
      onOpenChange(false)
    },
    [currentTabData, onOpenChange]
  )

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // Export buttons component
  const ExportButtons = () => (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="h-12 w-full justify-start gap-3 transition-colors hover:border-green-200 hover:bg-green-50"
        onClick={() => handleExportClick("excel")}
      >
        <HugeiconsIcon icon={Xls01Icon} strokeWidth={2} className="size-5 text-green-600" />
        <span>Export to Excel</span>
      </Button>

      <Button
        variant="outline"
        className="h-12 w-full justify-start gap-3 transition-colors hover:border-blue-200 hover:bg-blue-50"
        onClick={() => handleExportClick("csv")}
      >
        <HugeiconsIcon icon={Csv01Icon} strokeWidth={2} className="size-5 text-blue-600" />
        <span>Export to CSV</span>
      </Button>

      <Button
        variant="outline"
        className="h-12 w-full justify-start gap-3 transition-colors hover:border-red-200 hover:bg-red-50"
        onClick={() => handleExportClick("pdf")}
      >
        <HugeiconsIcon icon={Pdf01Icon} strokeWidth={2} className="size-5 text-red-600" />
        <span>Export to PDF</span>
      </Button>
    </div>
  )

  // Single tab view (no tab selector)
  if (!showTabs) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentTabData?.exportTitle || "Export Data"}</DialogTitle>
            <DialogDescription>
              {currentTabData?.exportDescription ||
                "Export data from the system in your preferred format."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <ExportButtons />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Tabs view (when label is "all")
  const visibleExportTabs = exportTabsWithAll.slice(0, VISIBLE_TABS_COUNT)
  const dropdownExportTabs = exportTabsWithAll.slice(VISIBLE_TABS_COUNT)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{currentTabData?.exportTitle || "Export Data"}</DialogTitle>
          <DialogDescription>
            {currentTabData?.exportDescription ||
              "Export data from the system in your preferred format."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeExportTab} onValueChange={setActiveExportTab} className="w-full">
          <div className="flex items-center gap-2">
            <TabsList className="h-auto w-full">
              <div
                className="grid w-full gap-1"
                style={{
                  gridTemplateColumns: `repeat(${visibleExportTabs.length}, 1fr)`,
                }}
              >
                {visibleExportTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="w-full">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>

            {dropdownExportTabs.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0 whitespace-nowrap">
                    More ({dropdownExportTabs.length})
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {dropdownExportTabs.map((tab) => (
                    <DropdownMenuItem
                      key={tab.id}
                      onSelect={() => setActiveExportTab(tab.id)}
                      className="flex items-center justify-between"
                    >
                      <span>{tab.label}</span>
                      {activeExportTab === tab.id && (
                        <span className="h-4 w-4 text-primary">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {exportTabsWithAll.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              <CardContent className="px-0">
                <ExportButtons />
              </CardContent>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}