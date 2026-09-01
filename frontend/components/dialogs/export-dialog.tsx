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
import { excelExportStore } from "@/store/excelExportStore"

// Create an "All" tab configuration
const allTab = {
  id: "all",
  label: "All",
  exportTitle: "Export All Data",
  exportDescription:
    "Export all data from the system in your preferred format.",
  onExport: (format: string) => {
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

export function ExportDialog({
  open,
  onOpenChange,
  label = "all",
}: ExportDialogProps) {
  const [activeExportTab, setActiveExportTab] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [exportLanguage, setExportLanguage] = useState<"english" | "japanese">(
    "english"
  )
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false)

  const {
    fetch_EmployeeData,
    fetch_HolidayData,
    fetch_SkillHeaders,
    fetch_devCapHeaders,
    fetch_SkillData,
    fetch_devCapData,
    fetch_TargetDates,
    fetch_languageSkillData,
    fetch_managementScoreData,
    fetch_EmployeeJapaneseLevel,
    fetchAll_CourseData,
    fetch_FeedbackData,
    fetch_FeedbackByEmployeeId,
    courses,
  } = mainStore()

  // Fetch courses when dialog opens
  useEffect(() => {
    if (open) {
      fetchAll_CourseData()
    }
  }, [open, fetchAll_CourseData])

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
      if (label === "current_target_data")
        return tab.id === "current_target_data"
      if (label === "holidays") return tab.id === "holidays"
      if (label === "feedback") return tab.id === "feedback"
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

  // Check if current tab is Skills
  const isSkillsTab = useMemo(() => {
    return currentTabData?.id === "skills"
  }, [currentTabData])

  // Check if current tab is Self-Study Progress
  const isSelfStudyTab = useMemo(() => {
    return currentTabData?.id === "self_study_progress_report"
  }, [currentTabData])

  // Check if current tab is Feedback
  const isFeedbackTab = useMemo(() => {
    return currentTabData?.id === "feedback"
  }, [currentTabData])

  // Reset selected course when switching away from self-study tab
  useEffect(() => {
    if (!isSelfStudyTab) {
      setSelectedCourse("")
    }
  }, [isSelfStudyTab])

  // Reset when dialog opens - set initial tab
  useEffect(() => {
    if (open) {
      if (showTabs && filteredTabs.length > 0) {
        // Try to set Employees as initial tab if it exists
        const employeeTab = filteredTabs.find((tab) => tab.id === "employees")
        const initialTab = employeeTab ? employeeTab.id : filteredTabs[0].id
        setActiveExportTab(initialTab)
      }
      setIsExporting(false)
      // Reset language to English when dialog opens
      setExportLanguage("english")
      // Reset selected course
      setSelectedCourse("")
    }
  }, [open, showTabs, filteredTabs])

  // Fetch data when tab changes
  useEffect(() => {
    if (!open) return

    const fetchDataForTab = async () => {
      const tabId = currentTabData?.id

      // Skip fetching for "all" tab
      if (tabId === "all") return

      try {
        switch (tabId) {
          case "employees":
            await fetch_EmployeeData()
            break
          case "holidays":
            await fetch_HolidayData()
            break
          case "skills":
            await Promise.all([
              fetch_SkillHeaders(),
              fetch_devCapHeaders(),
              fetch_SkillData(),
              fetch_devCapData(),
              fetch_languageSkillData(),
              fetch_managementScoreData(),
            ])
            break
          case "current_target_data":
            await Promise.all([
              fetch_EmployeeJapaneseLevel(),
              fetch_TargetDates(),
            ])
            break
          case "self_study_progress_report":
            await fetchAll_CourseData()
            break
          case "feedback":
            // Fetch feedback data based on user role
            try {
              const store = (window as any).mainStore?.getState()
              const profile = store?.profile
              const userRole = profile?.role?.toLowerCase() || ""
              const isLearner = userRole === "learner"
              const isAdminOrApprover =
                userRole === "admin" || userRole === "approver"

              if (isLearner && profile?.id) {
                await fetch_FeedbackByEmployeeId(profile.id)
              } else if (isAdminOrApprover) {
                await fetch_FeedbackData()
              } else {
                await fetch_FeedbackData()
              }
            } catch (error) {
              console.error(" Failed to fetch feedback data:", error)
            }
            break
          default:
            break
        }
      } catch (error) {
        console.error(` Failed to fetch data for tab ${tabId}:`, error)
      }
    }

    fetchDataForTab()
  }, [
    open,
    currentTabData?.id,
    fetchAll_CourseData,
    fetch_FeedbackData,
    fetch_FeedbackByEmployeeId,
  ])

  const handleExportClick = useCallback(
    async (format: string) => {
      if (!currentTabData) return

      // For self-study tab, check if course is selected
      if (isSelfStudyTab && !selectedCourse) {
        toast.warning("Please select a course before exporting.")
        return
      }

      setIsExporting(true)

      try {
        const tabId = currentTabData.id

        // Handle based on tab ID
        switch (tabId) {
          case "all":
            // Export all data
            for (const tab of exportTabs) {
              await tab.onExport(format)
            }
            break

          case "employees":
            await currentTabData.onExport(format)
            break

          case "skills":
            // Pass language preference to the export function
            await currentTabData.onExport(format, exportLanguage)
            break

          case "current_target_data":
            await currentTabData.onExport(format)
            break

          case "holidays":
            await currentTabData.onExport(format)
            break

          case "courses":
            await currentTabData.onExport(format)
            break

          case "self_study_progress_report":
            // Pass the selected course to the export function
            await currentTabData.onExport(format, selectedCourse)
            break

          case "feedback":
            // Handle feedback export
            await currentTabData.onExport(format)
            break

          default:
            await currentTabData.onExport(format)
        }

        onOpenChange(false)
      } catch (error) {
        console.error(" Export failed:", error)
        toast.error(
          `Failed to export: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      } finally {
        setIsExporting(false)
      }
    },
    [
      currentTabData,
      onOpenChange,
      exportLanguage,
      selectedCourse,
      isSelfStudyTab,
    ]
  )

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // Check if PDF should be hidden for certain tabs
  const shouldHidePDF = useMemo(() => {
    const tabId = currentTabData?.id
    return (
      tabId === "current_target_data" ||
      tabId === "skills" ||
      tabId === "self_study_progress_report" ||
      tabId === "exam_progress_report"
    )
    // Note: Feedback supports PDF, so it's not in this list
  }, [currentTabData])

  // Check if CSV should be hidden for certain tabs
  const shouldHideCSV = useMemo(() => {
    const tabId = currentTabData?.id
    return (
      tabId === "self_study_progress_report" ||
      tabId === "exam_progress_report" ||
      tabId === "skills"
    )
    // Note: Feedback supports CSV, so it's not in this list
  }, [currentTabData])

  // Get course options for dropdown - FILTER OUT "trainer" courses
  const courseOptions = useMemo(() => {
    if (!courses || !Array.isArray(courses)) return []

    // Filter courses where courseType is NOT "trainer"
    // Also ensure we only include courses with self-study data
    const filteredCourses = courses.filter((course: any) => {
      const courseType = course.courseType?.toLowerCase() || ""
      // Exclude "trainer" courses
      if (courseType === "trainer") return false

      // Optional: Only include courses that have self-study data
      // You can add additional filters here if needed
      // For example: course.self_study_sessions?.length > 0

      return true
    })

    return filteredCourses.map((course: any) => ({
      id: course.id || course._id,
      name: course.title || course.name || "Unnamed Course",
    }))
  }, [courses])

  // Export buttons component
  const ExportButtons = () => (
    <div className="space-y-3">
      {/* Course Selection - Only show for Self-Study Progress tab */}
      {isSelfStudyTab && (
        <div className="mb-3">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            Select Course:
          </label>
          <DropdownMenu
            open={isCourseDropdownOpen}
            onOpenChange={setIsCourseDropdownOpen}
            modal={false}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
                disabled={courseOptions.length === 0}
              >
                {selectedCourse
                  ? courseOptions.find((c) => c.id === selectedCourse)?.name ||
                    "Select Course"
                  : "Select a course..."}
                <span className="ml-2">▼</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-[200px] w-full min-w-[200px] overflow-y-auto"
            >
              {courseOptions.length === 0 ? (
                <DropdownMenuItem disabled>
                  No self-study courses available
                </DropdownMenuItem>
              ) : (
                courseOptions.map((course) => (
                  <DropdownMenuItem
                    key={course.id}
                    onSelect={() => {
                      setSelectedCourse(course.id)
                      setIsCourseDropdownOpen(false)
                    }}
                    className="flex items-center justify-between"
                  >
                    <span>{course.name}</span>
                    {selectedCourse === course.id && (
                      <span className="h-4 w-4 text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {courseOptions.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              No self-study courses found. Please create a self-study course
              first.
            </p>
          )}
        </div>
      )}

      {/* Language Toggle - Only show for Skills tab */}
      {isSkillsTab && (
        <div className="mb-3 flex items-center gap-2 rounded-lg p-2">
          <span className="text-sm font-medium text-muted-foreground">
            Export Language:
          </span>
          <div className="flex items-center gap-4 rounded-md bg-muted p-1">
            <Button
              variant={exportLanguage === "english" ? "default" : "ghost"}
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => setExportLanguage("english")}
            >
              English
            </Button>
            <Button
              variant={exportLanguage === "japanese" ? "default" : "ghost"}
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => setExportLanguage("japanese")}
            >
              日本語
            </Button>
          </div>
        </div>
      )}

      <Button
        variant="outline"
        className="h-12 w-full justify-start gap-3 transition-colors hover:border-green-200 hover:bg-green-50"
        onClick={() => handleExportClick("excel")}
        disabled={isExporting || (isSelfStudyTab && !selectedCourse)}
      >
        <HugeiconsIcon
          icon={Xls01Icon}
          strokeWidth={2}
          className="size-5 text-green-600"
        />
        <span>{isExporting ? "Exporting..." : "Export to Excel"}</span>
      </Button>

      {!shouldHideCSV && (
        <Button
          variant="outline"
          className="h-12 w-full justify-start gap-3 transition-colors hover:border-blue-200 hover:bg-blue-50"
          onClick={() => handleExportClick("csv")}
          disabled={isExporting || (isSelfStudyTab && !selectedCourse)}
        >
          <HugeiconsIcon
            icon={Csv01Icon}
            strokeWidth={2}
            className="size-5 text-blue-600"
          />
          <span>{isExporting ? "Exporting..." : "Export to CSV"}</span>
        </Button>
      )}

      {!shouldHidePDF && (
        <Button
          variant="outline"
          className="h-12 w-full justify-start gap-3 transition-colors hover:border-red-200 hover:bg-red-50"
          onClick={() => handleExportClick("pdf")}
          disabled={isExporting || (isSelfStudyTab && !selectedCourse)}
        >
          <HugeiconsIcon
            icon={Pdf01Icon}
            strokeWidth={2}
            className="size-5 text-red-600"
          />
          <span>{isExporting ? "Exporting..." : "Export to PDF"}</span>
        </Button>
      )}
    </div>
  )

  // Single tab view (no tab selector)
  if (!showTabs) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[500px]"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Prevent dialog from closing when clicking inside dropdown
            const target = e.target as HTMLElement
            if (
              target.closest('[role="menu"]') ||
              target.closest('[role="listbox"]')
            ) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {currentTabData?.exportTitle || "Export Data"}
            </DialogTitle>
            <DialogDescription>
              {currentTabData?.exportDescription ||
                "Export data from the system in your preferred format."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <ExportButtons />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isExporting}
            >
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
      <DialogContent
        className="sm:max-w-[500px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Prevent dialog from closing when clicking inside dropdown
          const target = e.target as HTMLElement
          if (
            target.closest('[role="menu"]') ||
            target.closest('[role="listbox"]')
          ) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {currentTabData?.exportTitle || "Export Data"}
          </DialogTitle>
          <DialogDescription>
            {currentTabData?.exportDescription ||
              "Export data from the system in your preferred format."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeExportTab}
          onValueChange={setActiveExportTab}
          className="w-full"
        >
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
                      // Reset language when switching away from skills tab
                      if (tab.id !== "skills") {
                        setExportLanguage("english")
                      }
                      // Reset selected course when switching away from self-study tab
                      if (tab.id !== "self_study_progress_report") {
                        setSelectedCourse("")
                      }
                    }}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>

            {dropdownExportTabs.length > 0 && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 whitespace-nowrap"
                  >
                    More ({dropdownExportTabs.length})
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                      className="ml-1 size-3"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {dropdownExportTabs.map((tab) => (
                    <DropdownMenuItem
                      key={tab.id}
                      onSelect={() => {
                        setActiveExportTab(tab.id)
                        // Reset language when switching away from skills tab
                        if (tab.id !== "skills") {
                          setExportLanguage("english")
                        }
                        // Reset selected course when switching away from self-study tab
                        if (tab.id !== "self_study_progress_report") {
                          setSelectedCourse("")
                        }
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
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isExporting}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
