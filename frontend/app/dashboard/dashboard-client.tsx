"use client"

import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { AppSidebar } from "../../components/nav/app-sidebar"
import { Separator } from "../../components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "../../components/ui/sidebar"
import { Upload05Icon, Download05Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ImportDialog } from "@/components/dialogs/import-dialog"
import { ExportDialog } from "@/components/dialogs/export-dialog"
import { CreateEmployeeDrawer } from "@/components/drawers/employees/createEmployee-drawer"
import { EmployeeContainer } from "@/components/employee-container"
import { CoursesContainer } from "@/components/courses-container"
import { SeminarContainer } from "@/components/seminar-container"
import { ExamsContainer } from "@/components/exams-container"
import DashboardContainer from "@/components/dashboard-container"
import { SkillContainer } from "@/components/skill-container"
import { HolidaysContainer } from "@/components/holidays-container"
import ChangePassword from "@/components/dialogs/changePassword-dialog"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CurrentTargetContainer } from "@/components/current-target-container"
import { ExamProgressReportContainer } from "@/components/examProgress-report-container"

interface DashboardClientProps {
    userData: {
        userId: string
        role: string
        name: string
        email: string
        status: string
    }
}

export default function DashboardPage({ userData }: DashboardClientProps) {
    const [activeTab, setActiveTab] = useState("dashboard")
    const [mounted, setMounted] = useState(false)
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
    const [isNewEmployeeDrawerOpen, setIsNewEmployeeDrawerOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        // Automatically open change password dialog if user status is "default"
        if (userData.status === "default") {
            setIsChangePasswordOpen(true)
        }
    }, [userData.status])

    const handleImport = () => {
        setIsImportDialogOpen(true)
    }

    const handleExport = () => {
        setIsExportDialogOpen(true)
    }

    const handleEmployeeCreated = () => {
        // Refresh the employee list
        setRefreshKey((prev) => prev + 1)
    }

    const handleNewEmployee = () => {
        setIsNewEmployeeDrawerOpen(true)
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
            case "holidays":
                return "Holiday Management"
            default:
                return "Dashboard"
        }
    }

    if (!mounted) {
        return (
            <div className="flex h-screen w-full">
                <div className="w-64 bg-muted animate-pulse" />
                <div className="flex-1">
                    <div className="h-16 border-b px-4 flex items-center">
                        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="p-4">
                        <div className="h-96 bg-muted rounded animate-pulse" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <SidebarProvider className="w-full overflow-hidden">
                <AppSidebar
                    userRole={
                        userData.role.toLowerCase() as "admin" | "learner" | "approver"
                    }
                    userData={{ name: userData.name, email: userData.email }}
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
                            <EmployeeContainer />
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
                        <TabsContent value="current_target_data" className="m-0">
                            <CurrentTargetContainer />
                        </TabsContent>
                        <TabsContent value="holidays" className="m-0">
                            <HolidaysContainer />
                        </TabsContent>
                        <TabsContent value="exam_progress_report" className="m-0">
                            <ExamProgressReportContainer />
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

            {/* Forced Password Change Dialog for New Users */}
            <Dialog
                open={isChangePasswordOpen}
                onOpenChange={(open) => {
                    // Prevent closing if user status is still "default"
                    if (userData.status === "default" && !open) return
                    setIsChangePasswordOpen(open)
                }}
            >
                <DialogContent
                    className="sm:max-w-[425px]"
                    onPointerDownOutside={(e) => {
                        // Prevent closing by clicking outside if user status is still "default"
                        if (userData.status === "default") e.preventDefault()
                    }}
                    onEscapeKeyDown={(e) => {
                        // Prevent closing by pressing escape if user status is still "default"
                        if (userData.status === "default") e.preventDefault()
                    }}
                >
                    <ChangePassword
                        flow="change"
                        step="old-password"
                        force={true}
                        onClose={() => setIsChangePasswordOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
