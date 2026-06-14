"use client"

import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useState } from "react"
import { AppSidebar } from "../../components/nav/app-sidebar"
import { Separator } from "../../components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  Upload05Icon,
  Download05Icon,
  UserAdd02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { ImportDialog } from "@/components/dialogs/import-dialog"
import { ExportDialog } from "@/components/dialogs/export-dialog"
import { CreateEmployeeDrawer } from "@/components/drawers/employees/createEmployee-drawer"
import { EmployeeContainer } from "@/components/employee-container"
import { CoursesContainer } from "@/components/courses-container"
import { SeminarContainer } from "@/components/seminar-container"
import { ExamsContainer } from "@/components/exams-container"
import { allTabs } from "@/components/nav/nav-group"
import DashboardContainer from "@/components/dashboard-container"
import { SkillContainer } from "@/components/skill-container"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isNewEmployeeDrawerOpen, setIsNewEmployeeDrawerOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleImport = () => {
    setIsImportDialogOpen(true)
  }

  const handleExport = () => {
    setIsExportDialogOpen(true)
  }

  const handleNewEmployee = () => {
    setIsNewEmployeeDrawerOpen(true)
  }

  const handleEmployeeCreated = () => {
    // Refresh the employee list
    setRefreshKey((prev) => prev + 1)
  }

  const getCurrentLabel = () => {
    switch (activeTab) {
      case "employees":
        return "Employee Management"
      case "courses":
        return "Course Management"
      case "seminar":
        return "Seminar Management"
      case "exams":
        return "Exam Management"
      case "skills":
        return "Skill Management"
      default:
        return "Dashboard"
    }
  }

  return (
    <>
      <SidebarProvider className="w-full overflow-hidden">
        <AppSidebar
          userRole="admin"
          onTabChange={setActiveTab}
          activeTab={activeTab}
        />
        <SidebarInset className="overflow-x-auto">
          <header className="flex h-16 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                />
                <p>{getCurrentLabel()}</p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  {activeTab !== "dashboard" && (
                    <>
                      {activeTab === "employees" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleNewEmployee}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <HugeiconsIcon
                            icon={UserAdd02Icon}
                            strokeWidth={2}
                            className="mr-1"
                          />
                          New Employee
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleImport}
                      >
                        <HugeiconsIcon icon={Upload05Icon} strokeWidth={2} />
                        Import
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                      >
                        <HugeiconsIcon icon={Download05Icon} strokeWidth={2} />
                        Export
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="dashboard" className="m-0">
              <DashboardContainer />
            </TabsContent>
            <TabsContent value="employees" className="m-0">
              <EmployeeContainer key={refreshKey} />
            </TabsContent>
            <TabsContent value="courses" className="m-0">
              <CoursesContainer />
            </TabsContent>
            <TabsContent value="seminar" className="m-0">
              <SeminarContainer />
            </TabsContent>
            <TabsContent value="exams" className="m-0">
              <ExamsContainer />
            </TabsContent>
            <TabsContent value="skills" className="m-0">
              <SkillContainer />
            </TabsContent>
          </Tabs>
        </SidebarInset>
      </SidebarProvider>

      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        label={activeTab}
      />
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        label={activeTab}
      />
      <CreateEmployeeDrawer
        open={isNewEmployeeDrawerOpen}
        onOpenChange={setIsNewEmployeeDrawerOpen}
        onSuccess={handleEmployeeCreated}
      />
    </>
  )
}
