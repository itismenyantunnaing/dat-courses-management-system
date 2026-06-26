/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import React from "react"
import { mainStore } from "@/store/mainStore"
import { DepartmentTable } from '@/components/examProgressTables/DepartmentTable'
import { TeamTargetPlanTable } from '@/components/examProgressTables/TeamTargetPlanTable'
import { TeamCommunicationTable } from '@/components/examProgressTables/TeamCommunicationTable'
import { CommunicationCapabilityTable } from '@/components/examProgressTables/CommunicationCapabilityTable'
import { TeamNoCertifiedTable } from '@/components/examProgressTables/TeamNoCertifiedTable'
import { Button } from "@/components/ui/button"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const STROKE_WIDTH = 2

type ViewType = 'department' | 'teamTargetPlan' | 'teamCommunication' | 'teamCommunicationCapability' | 'teamNone'

export function ExamProgressReportContainer() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [viewType, setViewType] = useState<ViewType>("department")
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Row selection state
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedCount, setSelectedCount] = useState(0)

  const [deptData, setDeptData] = useState<any[]>([])
  const [teamData, setTeamData] = useState<any[]>([])
  const [capabilityData, setCapabilityData] = useState<any[]>([])

  const isDataLoadedRef = useRef(false)

  // Get store methods
  const {
    fetch_AllData,
    getDeptWithCounts,
    getTeamWithCounts,
    getCommCapability,
    getTargetDates,
  } = mainStore()

  // Transform data to pivot format for capability table
  const transformToPivot = (data: any[]) => {
    if (data.length === 0) return []
    const firstRow = data[0]
    const commKeys: string[] = []
    let index = 0
    while (true) {
      const key = `current_comm_${index}`
      if (key in firstRow) { commKeys.push(key); index++ } else { break; }
    }
    const pivotRows: any[] = []
    const fullTexts = [
      "Level 0 | None",
      "Level 1 | G1: Email writing-Chat with DIR and QA/bug/issues reporting using simple words",
      "Level 1 | G2: Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool",
      "Level 1 | G3: Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool, Basic & Internal team daily conversation using simple words",
      "Level 2 | G1: Email reading/writing/MS team chat, Daily team conversation",
      "Level 2 | G2: Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese",
      "Level 2 | G3: Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese, Basic meeting participation",
      "Level 3: Lead Meeting with DIR/Japanese clients, Handle negotiations, Write formal proposal"
    ]
    commKeys.forEach((key, idx) => {
      let currentTotal = 0, target1Total = 0, target2Total = 0
      data.forEach(row => {
        currentTotal += (row[`current_comm_${idx}`] as number) || 0
        target1Total += (row[`target1_comm_${idx}`] as number) || 0
        target2Total += (row[`target2_comm_${idx}`] as number) || 0
      })
      pivotRows.push({
        id: fullTexts[idx] || key,
        level_full: fullTexts[idx] || key,
        current: currentTotal,
        target1: target1Total,
        target2: target2Total
      })
    })
    return pivotRows
  }

  // Load all data once
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true)
      await fetch_AllData()

      const depts = getDeptWithCounts() || []
      setDeptData(depts)

      const teams = getTeamWithCounts() || []
      setTeamData(teams)

      const pivoted = transformToPivot(teams)
      setCapabilityData(pivoted)

      // Log the dates after loading
      const dates = getTargetDates()
      console.log('Dates after loading:', dates)

      isDataLoadedRef.current = true
      setIsLoading(false)
    }
    loadAllData()
  }, [fetch_AllData, getDeptWithCounts, getTeamWithCounts, getTargetDates])

  // Update selected count when rowSelection changes
  useEffect(() => {
    const count = Object.values(rowSelection).filter(Boolean).length
    setSelectedCount(count)
  }, [rowSelection])

  const handleViewChange = (value: ViewType) => {
    setViewType(value)
    setCurrentPage(1)
    setSearchTerm("")
    setSelectedDeptId(null)
    setRowSelection({})
  }

  // Dynamic placeholder based on view type
  const getPlaceholder = () => {
    switch (viewType) {
      case 'department':
        return 'Search departments...'
      case 'teamTargetPlan':
        return 'Search teams...'
      case 'teamCommunication':
        return 'Search teams...'
      case 'teamNone':
        return 'Search teams...'
      case 'teamCommunicationCapability':
        return 'Search communication levels...'
      default:
        return 'Search...'
    }
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key])

      // Delete from the appropriate data source based on view type
      switch (viewType) {
        case 'department': {
          const newData = deptData.filter((item) => {
            return !selectedIds.includes(item.dept_name)
          })
          setDeptData(newData)
          break
        }
        case 'teamTargetPlan':
        case 'teamCommunication':
        case 'teamNone': {
          const newData = teamData.filter((item) => {
            return !selectedIds.includes(item.team_name)
          })
          setTeamData(newData)
          // Also update capability data
          const newCapData = transformToPivot(newData)
          setCapabilityData(newCapData)
          break
        }
        case 'teamCommunicationCapability': {
          const newData = capabilityData.filter((item) => {
            return !selectedIds.includes(item.id)
          })
          setCapabilityData(newData)
          break
        }
      }

      setRowSelection({})
      setDeleteDialogOpen(false)

    } catch (error) {
      console.error("Delete failed:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Get current data based on view type
  const getCurrentData = () => {
    switch (viewType) {
      case 'department':
        return deptData
      case 'teamTargetPlan':
      case 'teamCommunication':
      case 'teamNone':
        return teamData
      case 'teamCommunicationCapability':
        return capabilityData
      default:
        return []
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-muted-foreground">Loading certification data...</p>
        </div>
      </div>
    )
  }

  const currentData = getCurrentData()
  const targetDates = getTargetDates()

  return (
    <>
      <div className="flex flex-col gap-4 py-6">
        <CardContent className="px-4">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={STROKE_WIDTH}
                className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground"
              />
              <Input
                placeholder={getPlaceholder()}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              {selectedCount > 0 && (
                <Button variant="destructive" onClick={handleDeleteClick}>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="mr-1 h-4 w-4" />
                  Delete ({selectedCount}) row{selectedCount > 1 ? 's' : ''}
                </Button>
              )}

              {/* Show department filter only for team views that support it (exclude Communication Capability) */}
              {(viewType !== 'department' && viewType !== 'teamCommunicationCapability') && deptData && deptData.length > 0 && (
                <Select
                  value={selectedDeptId?.toString() || "all"}
                  onValueChange={(value) => {
                    setSelectedDeptId(value === "all" ? null : Number(value))
                    setCurrentPage(1)
                    setRowSelection({})
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent align="center" sideOffset={5}>
                    <SelectGroup>
                      <SelectItem value="all">All Departments</SelectItem>
                      {deptData
                        .filter((dept) => dept.id !== null && dept.id !== undefined)
                        .map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.dept_name}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}

              <Select value={viewType} onValueChange={handleViewChange}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select View" />
                </SelectTrigger>
                <SelectContent align="center" sideOffset={5}>
                  <SelectGroup>
                    <SelectItem value="department">By Department</SelectItem>
                    <SelectItem value="teamTargetPlan">By Team (Target Plan)</SelectItem>
                    <SelectItem value="teamCommunication">By Team (Communication Level)</SelectItem>
                    <SelectItem value="teamNone">By Team (No Certified Members)</SelectItem>
                    <SelectItem value="teamCommunicationCapability">Communication Capability</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {viewType === 'department' && (
            <DepartmentTable
              key={`dept-${viewType}`}
              searchTerm={searchTerm}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              data={currentData}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
            />
          )}

          {viewType === 'teamTargetPlan' && (
            <TeamTargetPlanTable
              key={`team-${viewType}`}
              searchTerm={searchTerm}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              selectedDeptId={selectedDeptId}
              data={currentData}
              target1Date={targetDates.target1Date}
              target2Date={targetDates.target2Date}
            />
          )}

          {viewType === 'teamCommunication' && (
            <TeamCommunicationTable
              key={`comm-${viewType}`}
              searchTerm={searchTerm}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              selectedDeptId={selectedDeptId}
              data={currentData}
              target1Date={targetDates.target1Date}
              target2Date={targetDates.target2Date}
            />
          )}

          {viewType === 'teamCommunicationCapability' && (
            <CommunicationCapabilityTable
              key={`cap-${viewType}`}
              searchTerm={searchTerm}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              selectedDeptId={selectedDeptId}
              data={currentData}
              target1Date={targetDates.target1Date}
              target2Date={targetDates.target2Date}
            />
          )}

          {viewType === 'teamNone' && (
            <TeamNoCertifiedTable
              key={`none-${viewType}`}
              searchTerm={searchTerm}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              selectedDeptId={selectedDeptId}
              data={currentData}
              target1Date={targetDates.target1Date}
              target2Date={targetDates.target2Date}
            />
          )}
        </CardContent>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} selected row
              {selectedCount > 1 ? "s" : ""}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ExamProgressReportContainer