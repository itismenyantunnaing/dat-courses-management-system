/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useEffect, useState, useRef } from "react"
import { AppSidebar } from "../../components/nav/app-sidebar"
import { Separator } from "../../components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar"
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
import { mainStore } from "@/store/mainStore"
import { JapaneseCertificateContainer } from "@/components/japaneseCertificate-conatiner"

interface DashboardClientProps {
  userData: {
    token: string
    userId: string
    role: string
    name: string
    email: string
    status: string
    loginTime: number
    expiresAt: number
  }
}

export default function DashboardPage({ userData }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [mounted, setMounted] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

  // Get session store actions
  const { setSession } = mainStore()
  const initialized = useRef(false)

  // Initialize session in Zustand store when component mounts
  useEffect(() => {
    if (!initialized.current && userData) {
      setSession(userData)
      initialized.current = true
    }
  }, [userData, setSession])

  useEffect(() => {
    setMounted(true)
    // Attach store to window for global access in non-hook files
    if (typeof window !== "undefined") {
      ;(window as any).mainStore = mainStore
    }
  }, [])

  useEffect(() => {
    // Automatically open change password dialog if user status is "default"
    if (userData.status === "default") {
      setIsChangePasswordOpen(true)
    }
  }, [])

  const getCurrentLabel = () => {
    switch (activeTab) {
      case "employees":
        return "Employee Management"
      case "courses":
        return "Course Management"
      case "current_target_level":
        return "Current Target Level Management"
      case "seminar":
        return "Seminar Management"
      case "exams":
        return "Exam Management"
      case "skills":
        return "Skill Management"
      case "holidays":
        return "Holiday Management"
      case "japanese-certificates":
        return "Japanese Certificates Management"
      default:
        return "Dashboard"
    }
  }

  if (!mounted) {
    return (
      <div className="flex h-screen w-full">
        <div className="w-64 animate-pulse bg-muted" />
        <div className="flex-1">
          <div className="flex h-16 items-center border-b px-4">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          </div>
          <div className="p-4">
            <div className="h-96 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <SidebarProvider className="w-full overflow-hidden">
        <AppSidebar
          userRole="admin"
          userData={{ name: userData.name, email: userData.email }}
          onTabChange={setActiveTab}
          activeTab={activeTab}
        />
        <SidebarInset className="overflow-x-auto">
          <header className="flex h-16 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                />
                <p>{getCurrentLabel()}</p>
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
            <TabsContent value="current_target_level" className="m-0">
              <CurrentTargetContainer />
            </TabsContent>
            <TabsContent value="holidays" className="m-0">
              <HolidaysContainer />
            </TabsContent>
            <TabsContent value="exam_progress_report" className="m-0">
              <ExamProgressReportContainer />
            </TabsContent>
            <TabsContent value="japanese-certificates" className="m-0">
              <JapaneseCertificateContainer />
            </TabsContent>
          </Tabs>
        </SidebarInset>
      </SidebarProvider>

      {/* Forced Password Change Dialog for New Users */}
      <Dialog
        open={isChangePasswordOpen}
        onOpenChange={(open) => {
          if (userData.status === "default" && !open) return
          setIsChangePasswordOpen(open)
        }}
      >
        <DialogContent
          className="sm:max-w-[425px]"
          onPointerDownOutside={(e) => {
            if (userData.status === "default") e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
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
