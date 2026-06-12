/* eslint-disable react-hooks/static-components */
/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import React, { useState, useEffect, useMemo } from "react"
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
import { extractEmployeesFromExcel, extractEmployees } from "@/lib/excel-extractor"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  label?: string
}

export function ImportDialog({ open, onOpenChange, label = "all" }: ImportDialogProps) {
  const [activeImportTab, setActiveImportTab] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Check if we should show tabs (only for "all" label)
  const showTabs = label === "all";

  // Get the current tab data
  const currentTabData = useMemo(() => {
    if (showTabs) {
      return importTabs.find((tab) => tab.id === activeImportTab)
    } else {
      // Find the matching single tab
      const matchingTab = importTabs.find((tab) => {
        if (label === "employees") return tab.id === "employees"
        if (label === "courses") return tab.id === "courses"
        if (label === "seminar") return tab.id === "seminar"
        if (label === "exams") return tab.id === "exams"
        if (label === "dashboard") return tab.id === "dashboard"
        return tab.id === label
      })
      return matchingTab || importTabs[0]
    }
  }, [showTabs, activeImportTab, label])

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      if (showTabs && importTabs.length > 0) {
        setActiveImportTab(importTabs[0].id)
      }
      setSelectedFile(null)
      setIsDragging(false)
    }
  }, [open, showTabs])

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

const handleImport = async () => {
  if (currentTabData && selectedFile) {
    try {
      const result = await extractEmployeesFromExcel(selectedFile);
      
      if (result.success) {
        console.log(`✅ Found ${result.headers.length} total columns`);
        console.log(`✅ Found ${result.employees.length} employees`);
        
        if (result.employees.length > 0) {
          console.log('📝 Employees list:');
          result.employees.forEach((emp, i) => {
            // Dynamically grab whatever keys are present (e.g., Name, Dept, etc.)
            const empName = emp["Name"] || emp["name"] || Object.values(emp)[1] || "Unknown Name";
            const empDept = emp["Dept"] || emp["department"] || Object.values(emp)[2] || "Unknown Dept";
            
            console.log(`   ${i + 1}. ${empName} (${empDept})`);
          });
          
          console.log('\n🔧 First employee raw row data:', result.employees[0]);
        }
      } else {
        console.error('Error:', result.error);
      }
      
      onOpenChange(false);
      
    } catch (error) {
      console.error('Import error:', error);
      alert(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

  const handleCancel = () => {
    onOpenChange(false)
  }

  // File upload area component
  const FileUploadArea = () => (
    <div
      className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-muted p-3">
          <HugeiconsIcon
            icon={Upload05Icon}
            strokeWidth={1.5}
            className="size-8 text-muted-foreground"
          />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium">
            {selectedFile
              ? selectedFile.name
              : "Choose a file or drag & drop it here"}
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum {currentTabData?.maxSize || 10} MB file size
          </p>
          {selectedFile && (
            <p className="text-xs text-green-600">
              ✓ File selected: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          accept={currentTabData?.accept}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            Browse Files
          </Button>
          {selectedFile && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  // Single tab view (no tab selector)
  if (!showTabs) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{currentTabData?.importTitle || "Import Data"}</DialogTitle>
            <DialogDescription>
              {currentTabData?.importDescription ||
                "Upload your data file to import it into the system."}
            </DialogDescription>
          </DialogHeader>

          <FileUploadArea />

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!selectedFile}>
              Import {currentTabData?.label || "Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Tabs view (when label is "all")
  const visibleImportTabs = importTabs.slice(0, VISIBLE_TABS_COUNT)
  const dropdownImportTabs = importTabs.slice(VISIBLE_TABS_COUNT)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{currentTabData?.importTitle || "Import Data"}</DialogTitle>
          <DialogDescription>
            {currentTabData?.importDescription ||
              "Upload your data file to import it into the system."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeImportTab} onValueChange={setActiveImportTab} className="w-full">
          <div className="flex items-center gap-2">
            <TabsList className="h-auto w-full">
              <div
                className="grid w-full gap-1"
                style={{
                  gridTemplateColumns: `repeat(${visibleImportTabs.length}, 1fr)`,
                }}
              >
                {visibleImportTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="w-full">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>

            {dropdownImportTabs.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0 whitespace-nowrap">
                    More ({dropdownImportTabs.length})
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {dropdownImportTabs.map((tab) => (
                    <DropdownMenuItem
                      key={tab.id}
                      onSelect={() => setActiveImportTab(tab.id)}
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

          {importTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              <FileUploadArea />
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!selectedFile}>
            Import {currentTabData?.label || "Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}