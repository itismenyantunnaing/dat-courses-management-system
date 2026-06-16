/* eslint-disable react-hooks/set-state-in-effect */
"use client"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { AppSidebar } from "../../components/nav/app-sidebar"
import { Separator } from "../../components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "../../components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Upload05Icon, Download05Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { ImportDialog } from "@/components/dialogs/import-dialog"
import { ExportDialog } from "@/components/dialogs/export-dialog"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import ChangePassword from "@/components/dialogs/changePassword-dialog"
import { EmployeeContainer } from "@/components/employee-container"
import { CoursesContainer } from "@/components/courses-container"
import { SeminarContainer } from "@/components/seminar-container"
import { ExamsContainer } from "@/components/exams-container"
import { allTabs } from "@/components/nav/nav-group"
import DashboardContainer from "@/components/dashboard-container"
import { SkillContainer } from "@/components/skill-container"
import { CurrentTargetContainer } from "@/components/current-target-container"

interface DashboardClientProps {
    userData: {
        userId: string
        role: string
        name: string
        email: string
        status: string
    }
}

const tabComponents = [
    { value: "dashboard", component: <DashboardContainer /> },
    { value: "employees", component: <EmployeeContainer /> },
    { value: "courses", component: <CoursesContainer /> },
    { value: "seminar", component: <SeminarContainer /> },
    { value: "exams", component: <ExamsContainer /> },
    { value: "skills", component: <SkillContainer /> },
    { value: "current_target_data", component: <CurrentTargetContainer /> },
];

export default function DashboardPage({ userData }: DashboardClientProps) {
    // const { currentDataType, setCurrentDataType, currentLabel } = usePage()
    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState("dashboard")
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
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
                    userRole={userData.role.toLowerCase() as "admin" | "learner" | "approver"}
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
                        {tabComponents.map((tab) => (
                            <TabsContent key={tab.value} value={tab.value} className="m-0">
                                {tab.component}
                            </TabsContent>
                        ))}
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
