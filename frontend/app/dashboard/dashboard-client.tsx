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
import { SkillContainer } from "@/components/skill-container"
import { HolidaysContainer } from "@/components/holidays-container"
import ChangePassword from "@/components/dialogs/changePassword-dialog"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CurrentTargetContainer } from "@/components/current-target-container"
import { ExamProgressReportContainer } from "@/components/examProgress-report-container"
import { mainStore } from "@/store/mainStore"
import { JapaneseCertificateContainer } from "@/components/japaneseCertificate-conatiner"
import { CertificatesRequestsContainer } from "@/components/certificatesRequests-container"
import { NotificationsDrawer } from "@/components/drawers/notifications-drawer"
import { SendMailDialog } from "@/components/dialogs/sendMail-dialog"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { MailSend02Icon, NotificationIcon } from "@hugeicons/core-free-icons"
import AdminDashboardContainer from "@/components/Dashboard/adminDashboard-container"
import ApproverDashboardContainer from "@/components/Dashboard/approverDashboard-container"
import LearnerDashboardContainer from "@/components/Dashboard/learnerDashboard-container"
import { FeedbackContainer } from "@/components/feedback-container"
import SelfStudyProgessReportContainer from "@/components/selfStudyProgess-report-container"
import { AuditLogsContainer } from "@/components/auditLogs-container"

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
  const [activeTab, setActiveTab] = useState("")
  const [mounted, setMounted] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false)
  const [isProfileLoaded, setIsProfileLoaded] = useState(false) // Add this state
  const [sendMailOpen, setSendMailOpen] = useState(false)

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedCertificateId, setSelectedCertificateId] = useState<number | null>(null)

  // Get session store actions
  const { setSession, fetch_profile, profile } = mainStore()
  const initialized = useRef(false)

  // Initialize session in Zustand store when component mounts
  useEffect(() => {
    if (!initialized.current && userData) {
      ; (async () => {
        setSession(userData)
        await fetch_profile(userData.userId)
        initialized.current = true
        setIsProfileLoaded(true) // Mark profile as loaded
      })()
    }
  }, [userData, setSession, fetch_profile])

  useEffect(() => {
    setMounted(true)
    // Attach store to window for global access in non-hook files
    if (typeof window !== "undefined") {
      ; (window as any).mainStore = mainStore
    }
  }, [])

  useEffect(() => {
    // Automatically open change password dialog if user status is "default"
    if (profile.status === "default") {
      setIsChangePasswordOpen(true)
    }
  }, [profile])

  const userRole = profile?.role
    ? (profile.role.toLowerCase() as "admin" | "learner" | "approver")
    : "learner"

  const user_role = profile?.role ? userRole : "learner"

  // Only set active tab when profile is loaded and user_role is not empty
  useEffect(() => {
    if (!isProfileLoaded || !user_role) return // Wait for profile to load

    setActiveTab(
      user_role === "admin"
        ? "admin-dashboard"
        : user_role === "approver"
          ? "approver-dashboard"
          : "learner-dashboard"
    )
  }, [user_role, isProfileLoaded])

  const getCurrentLabel = () => {
    switch (activeTab) {
      case "admin-dashboard":
        return "Admin Dashboard"
      case "approver-dashboard":
        return "Approver Dashboard"
      case "learner-dashboard":
        return "Learner Dashboard"
      case "employees":
        return "Employees"
      case "courses":
        return "Courses"
      case "current_target_level":
        return "Current Target Level"
      case "seminar":
        return "Seminar Management"
      case "exams":
        return "Exam Management"
      case "skills":
        return "Skills"
      case "holidays":
        return "Holidays"
      case "japanese-certificates":
        return "Japanese Certificates"
      case "certificates-requests":
        return "Certificates Requests"
      case "feedback":
        return "Learners' feedback"
      case "exam_progress_report":
        return "Exam Progress Report"
      case "self_study_progress":
        return "Self Study Progress Report"
      case "feedback":
        return "Learners' feedback"
      case "audit_logs":
        return "Audit logs"
      default:
        return "Dashboard"
    }
  }

  // Handle notification actions
  const handleNotificationAction = (action: 'view-course' | 'view-certificate', id: number) => {
    if (action === 'view-course') {
      setSelectedCourseId(id)
      setActiveTab('courses')
    } else if (action === 'view-certificate') {
      setSelectedCertificateId(id)
      // Navigate to the appropriate certificate tab based on user role
      if (user_role === 'learner') {
        setActiveTab('japanese-certificates')
        // Just navigate to the tab, don't open drawer for learners
      } else {
        setActiveTab('certificates-requests')
        // For admin/approver, we might want to open the detail
      }
    }
  }

  // Reset selected course ID when switching away from courses tab
  useEffect(() => {
    if (activeTab !== 'courses') {
      setSelectedCourseId(null)
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'certificates-requests') {
      setSelectedCertificateId(null)
    }
  }, [activeTab])

  const tabConfigs = [
    { value: "admin-dashboard", component: AdminDashboardContainer },
    { value: "approver-dashboard", component: ApproverDashboardContainer },
    {
      value: "learner-dashboard",
      component: LearnerDashboardContainer,
      props: {
        onNavigateToCourse: (courseId: number) => {
          setSelectedCourseId(courseId)
          setActiveTab('courses')
        },
        onNavigateToCertificate: (certificateId: number) => {
          setSelectedCertificateId(certificateId)
          setActiveTab('japanese-certificates')
        }
      },
    },
    { value: "employees", component: EmployeeContainer },
    {
      value: "courses",
      component: CoursesContainer,
      props: {
        userRole: userRole,
        selectedCourseId: selectedCourseId
      },
    },
    { value: "seminar", component: SeminarContainer },
    { value: "exams", component: ExamsContainer },
    { value: "feedback", component: FeedbackContainer },
    { value: "skills", component: SkillContainer },
    { value: "current_target_level", component: CurrentTargetContainer },
    { value: "holidays", component: HolidaysContainer },
    { value: "audit_logs", component: AuditLogsContainer },
    { value: "exam_progress_report", component: ExamProgressReportContainer },
    { value: "self_study_progress", component: SelfStudyProgessReportContainer },
    {
      value: "japanese-certificates",
      component: JapaneseCertificateContainer,
      props: {
        selectedCertificateId: selectedCertificateId
      },
    },
    {
      value: "certificates-requests",
      component: CertificatesRequestsContainer,
      props: {
        selectedCertificateId: selectedCertificateId
      },
    },
  ]

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
          userRole={user_role}
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
                <h2 className="text-xl font-semibold tracking-tight">
                  {getCurrentLabel()}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNotificationDrawerOpen(true)}
                  className="relative"
                >
                  <HugeiconsIcon
                    icon={NotificationIcon}
                    strokeWidth={2}
                    className="h-5 w-5"
                  />
                </Button>
                {user_role !== "learner" &&
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative"
                    onClick={() => setSendMailOpen(true)}
                  >
                    <HugeiconsIcon
                      icon={MailSend02Icon}
                      strokeWidth={2}
                      className="h-5 w-5"
                    />
                  </Button>
                }

              </div>
            </div>
          </header>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {tabConfigs.map(({ value, component: Component, props }) => (
              <TabsContent key={value} value={value} className="m-0">
                <Component {...props} />
              </TabsContent>
            ))}
          </Tabs>
        </SidebarInset>
      </SidebarProvider>

      {/* Notifications Drawer */}
      <NotificationsDrawer
        open={notificationDrawerOpen}
        onOpenChange={setNotificationDrawerOpen}
        onAction={handleNotificationAction}
      />

      {/* Send Mail Dialog */}
      <SendMailDialog
        open={sendMailOpen}
        onOpenChange={setSendMailOpen}
        defaultEmail={profile?.email || ""}
      />

      {/* Forced Password Change Dialog for New Users */}
      <Dialog
        open={isChangePasswordOpen}
        onOpenChange={(open) => {
          if (profile.status === "default" && !open) return
          setIsChangePasswordOpen(open)
        }}
      >
        <DialogContent
          className="sm:max-w-[425px]"
          onPointerDownOutside={(e) => {
            if (profile.status === "default") e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            if (profile.status === "default") e.preventDefault()
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
