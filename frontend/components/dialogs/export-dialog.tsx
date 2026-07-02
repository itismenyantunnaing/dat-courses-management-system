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
import { mainStore } from "@/store/mainStore"

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
  label?: string // Used ONLY for filtering which tabs to show
}

export function ExportDialog({ open, onOpenChange, label = "all" }: ExportDialogProps) {
  const [activeExportTab, setActiveExportTab] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const { fetch_EmployeeData, fetch_HolidayData, fetch_SkillHeaders, fetch_devCapHeaders, fetch_SkillData, fetch_devCapData, fetch_TargetDates, fetch_languageSkillData, fetch_managementScoreData, fetch_EmployeeJapaneseLevel } = mainStore();

  // Get the filtered tabs based on label prop
  const filteredTabs = useMemo(() => {
    if (label === "all" || label === "All") {
      return exportTabsWithAll
    }
    // Filter tabs based on label
    return exportTabsWithAll.filter((tab) => {
      if (label === "employees") return tab.id === "employees"
      if (label === "courses") return tab.id === "courses"
      if (label === "seminar") return tab.id === "seminar"
      if (label === "exams") return tab.id === "exams"
      if (label === "dashboard") return tab.id === "dashboard"
      if (label === "skills") return tab.id === "skills"
      if (label === "current_target_data") return tab.id === "current_target_data"
      if (label === "holidays") return tab.id === "holidays"
      return tab.id === label
    })
  }, [label])

  // Check if we should show tabs (more than 1 tab)
  const showTabs = filteredTabs.length > 1

  // Get the current tab data
  const currentTabData = useMemo(() => {
    if (showTabs) {
      return exportTabsWithAll.find((tab) => tab.id === activeExportTab)
    } else {
      // If only one tab, use the first filtered tab
      return filteredTabs[0] || exportTabsWithAll[0]
    }
  }, [showTabs, activeExportTab, filteredTabs])

  // Reset when dialog opens - set initial tab
  useEffect(() => {
    if (open) {
      if (showTabs && filteredTabs.length > 0) {
        // Try to set Employees as initial tab if it exists
        const employeeTab = filteredTabs.find(tab => tab.id === "employees")
        const initialTab = employeeTab ? employeeTab.id : filteredTabs[0].id
        setActiveExportTab(initialTab)
      }
      setIsExporting(false)
    }
  }, [open, showTabs, filteredTabs])

  // Fetch data when tab changes
  useEffect(() => {
    if (!open) return;

    const fetchDataForTab = async () => {
      const tabId = currentTabData?.id;

      // Skip fetching for "all" tab
      if (tabId === "all") return;

      try {
        switch (tabId) {
          case "employees":
            await fetch_EmployeeData();
            break;
          case "holidays":
            await fetch_HolidayData();
            break;
          case "skills":
            await Promise.all([
              fetch_SkillHeaders(),
              fetch_devCapHeaders(),
              fetch_SkillData(),
              fetch_devCapData(),
              fetch_languageSkillData(),
              fetch_managementScoreData()
            ]);
            break;
          case "current_target_data":
            await Promise.all([
              fetch_EmployeeJapaneseLevel(),
              fetch_TargetDates(),
            ]);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`❌ Failed to fetch data for tab ${tabId}:`, error);
      }
    };

    fetchDataForTab();
  }, [open, currentTabData?.id]);

  const handleExportClick = useCallback(
    async (format: string) => {
      if (!currentTabData) return;

      setIsExporting(true);

      try {
        const tabId = currentTabData.id;

        // Handle based on tab ID
        switch (tabId) {
          case "all":
            // Export all data
            console.log(`📊 Exporting all data as ${format}`);
            for (const tab of exportTabs) {
              await tab.onExport(format);
            }
            break;

          case "employees":
            console.log(`👤 Exporting Employees data as ${format}`);
            await currentTabData.onExport(format);
            break;

          case "skills":
            console.log(`💻 Exporting Skills data as ${format}`);
            await currentTabData.onExport(format);
            break;

          case "current_target_data":
            console.log(`🎯 Exporting Current Target data as ${format}`);
            await currentTabData.onExport(format);
            break;

          case "holidays":
            console.log(`📅 Exporting Holidays data as ${format}`);
            await currentTabData.onExport(format);
            break;

          case "courses":
            console.log(`📚 Exporting Courses data as ${format}`);
            await currentTabData.onExport(format);
            break;

          default:
            // Default export
            console.log(`📋 Exporting ${currentTabData.label} data as ${format}`);
            await currentTabData.onExport(format);
        }

        onOpenChange(false);
      } catch (error) {
        console.error('❌ Export failed:', error);
        alert(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsExporting(false);
      }
    },
    [currentTabData, onOpenChange]
  )

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // Check if PDF should be hidden for certain tabs
  const shouldHidePDF = useMemo(() => {
    const tabId = currentTabData?.id;
    return tabId === "current_target_data" || tabId === "skills";
  }, [currentTabData]);

  // Export buttons component
  const ExportButtons = () => (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="h-12 w-full justify-start gap-3 transition-colors hover:border-green-200 hover:bg-green-50"
        onClick={() => handleExportClick("excel")}
        disabled={isExporting}
      >
        <HugeiconsIcon icon={Xls01Icon} strokeWidth={2} className="size-5 text-green-600" />
        <span>{isExporting ? 'Exporting...' : 'Export to Excel'}</span>
      </Button>

      <Button
        variant="outline"
        className="h-12 w-full justify-start gap-3 transition-colors hover:border-blue-200 hover:bg-blue-50"
        onClick={() => handleExportClick("csv")}
        disabled={isExporting}
      >
        <HugeiconsIcon icon={Csv01Icon} strokeWidth={2} className="size-5 text-blue-600" />
        <span>{isExporting ? 'Exporting...' : 'Export to CSV'}</span>
      </Button>

      {!shouldHidePDF && (
        <Button
          variant="outline"
          className="h-12 w-full justify-start gap-3 transition-colors hover:border-red-200 hover:bg-red-50"
          onClick={() => handleExportClick("pdf")}
          disabled={isExporting}
        >
          <HugeiconsIcon icon={Pdf01Icon} strokeWidth={2} className="size-5 text-red-600" />
          <span>{isExporting ? 'Exporting...' : 'Export to PDF'}</span>
        </Button>
      )}
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
            <Button variant="outline" onClick={handleCancel} disabled={isExporting}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Tabs view (when multiple tabs)
  const visibleExportTabs = filteredTabs.slice(0, VISIBLE_TABS_COUNT)
  const dropdownExportTabs = filteredTabs.slice(VISIBLE_TABS_COUNT)

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
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="w-full"
                    onClick={() => {
                      // Reset any state when tab changes
                    }}
                  >
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
                      onSelect={() => {
                        setActiveExportTab(tab.id)
                      }}
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

          {filteredTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              <CardContent className="px-0">
                <ExportButtons />
              </CardContent>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter>
          <Button className="flex-1" variant="outline" onClick={handleCancel} disabled={isExporting}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}