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
import { ExamsContainer } from "@/components/exams-container"
import { SkillContainer } from "@/components/skill-container"
import { HolidaysContainer } from "@/components/holidays-container"
import ChangePassword from "@/components/dialogs/changePassword-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CurrentTargetContainer } from "@/components/current-target-container"
import { ExamProgressReportContainer } from "@/components/examProgress-report-container"
import { mainStore } from "@/store/mainStore"
import { JapaneseCertificateContainer } from "@/components/japaneseCertificate-conatiner"
import { CertificatesRequestsContainer } from "@/components/requestedCertificates-container"
import { NotificationsDrawer } from "@/components/drawers/notifications-drawer"
import { SendMailDialog } from "@/components/dialogs/sendMail-dialog"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  MailSend02Icon,
  NotificationIcon,
  Download02Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import AdminDashboardContainer from "@/components/Dashboard/adminDashboard-container"
import ApproverDashboardContainer from "@/components/Dashboard/approverDashboard-container"
import LearnerDashboardContainer from "@/components/Dashboard/learnerDashboard-container"
import { FeedbackContainer } from "@/components/feedback-container"
import SelfStudyProgessReportContainer from "@/components/selfStudyProgess-report-container"
import { AuditLogsContainer } from "@/components/auditLogs-container"
import { webScoketStore } from "@/store/websocketStore"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import type { SessionData } from "@/types/session"
import { AnnouncementContainer } from "@/components/announcement-container"
import { getAuthToken, logout } from "@/app/actions/auth"
import { ImportExportDialog } from "@/components/dialogs/import-export-confirm-dialog"
import { ScheduleContainer } from "@/components/schedule-container"

interface DashboardClientProps {
  userData: SessionData
}

export default function DashboardPage({ userData }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState("")
  const [mounted, setMounted] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false)
  const [isProfileLoaded, setIsProfileLoaded] = useState(false)
  const [sendMailOpen, setSendMailOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [countdown, setCountdown] = useState(5)

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedCertificateId, setSelectedCertificateId] = useState<
    number | null
  >(null)
  const [pendingCertificateId, setPendingCertificateId] = useState<
    number | null
  >(null)
  const [refreshAnnouncements, setRefreshAnnouncements] = useState(false)
  const [navigateToAnnouncement, setNavigateToAnnouncement] = useState(false)

  // Get session store actions
  const {
    setSession,
    fetch_EmployeeProfile,
    profile,
    unreadCount: dbUnreadCount,
    fetch_UnreadCount,
    fetch_CertificateData,
    fetch_AllCertificates,
    fetchAll_CourseData,
    fetch_AnnouncementData,
  } = mainStore()
  const { connect } = webScoketStore()

  // Subscribe to WebSocket store for real-time updates
  const isConnected = webScoketStore((state) => state.isConnected)
  const notifications = webScoketStore((state) => state.notifications)

  const initialized = useRef(false)
  const previousNotificationsLength = useRef(0)

  // Initialize session in Zustand store when component mounts
  useEffect(() => {
    if (!initialized.current && userData) {
      ;(async () => {
        setSession(userData)
        await fetch_EmployeeProfile(userData.userId)
        initialized.current = true
        setIsProfileLoaded(true)
      })()
    }
  }, [userData, setSession, fetch_EmployeeProfile])

  // Connect to WebSocket when profile is loaded and user is authenticated
  useEffect(() => {
    if (isProfileLoaded && profile?.id) {
      connect()
      fetch_UnreadCount(profile.id)
    }
  }, [isProfileLoaded, profile?.id, connect, fetch_UnreadCount])

  // Refetch database unread count ONLY when a NEW WebSocket notification arrives
  useEffect(() => {
    if (
      profile?.id &&
      notifications.length > previousNotificationsLength.current
    ) {
      fetch_UnreadCount(profile.id)
    }
    previousNotificationsLength.current = notifications.length
  }, [notifications, profile?.id, fetch_UnreadCount])

  // Clean up WebSocket connection when component unmounts
  useEffect(() => {
    return () => {
      const { disconnect } = webScoketStore.getState()
      disconnect()
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    if (typeof window !== "undefined") {
      ;(window as any).mainStore = mainStore
    }
  }, [])

  // Countdown timer for auto-logout
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isSuccessDialogOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (isSuccessDialogOpen && countdown === 0) {
      // Auto logout when countdown reaches 0
      handleSuccessConfirm()
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isSuccessDialogOpen, countdown])

  // Show alert when new notification arrives
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0]
      if (latest && !latest.read) {
        const hasNavigationTarget = latest.courseId || latest.certificateId || latest.isAnnouncement

        const toastOptions: any = {
          description: latest.message,
          duration: 5000,
          position: "top-center",
          style: {
            background: "#1a1a2e",
            color: "#ffffff",
            borderRadius: "12px",
            padding: "16px",
            width: "480px",
            maxWidth: "90vw",
          },
          cancel: {
            label: "Dismiss",
            onClick: () => {
              webScoketStore.getState().markAsRead(latest.id)
            },
          },
        }

        if (hasNavigationTarget) {
          toastOptions.action = {
            label: "View",
            onClick: async () => {
              webScoketStore.getState().markAsRead(latest.id)

              if (latest.courseId) {
                // Refresh course data before navigating
                try {
                  // Clear existing selection first
                  setSelectedCourseId(null)

                  // Refresh course data
                  await fetchAll_CourseData()

                  // Set the course ID and navigate
                  setSelectedCourseId(latest.courseId)
                  setActiveTab("courses")
                } catch (error) {
                  console.error("Failed to refresh course data:", error)
                  // Still try to navigate
                  setSelectedCourseId(latest.courseId)
                  setActiveTab("courses")
                }
              } else if (latest.certificateId) {
                // First refresh the certificate data
                const targetTab = user_role === "learner"
                  ? "japanese-certificates"
                  : "certificates-requests"

                // Set the active tab first
                setActiveTab(targetTab)

                // Wait for the data to refresh before setting the certificate ID
                try {
                  // Clear any existing selection first to force a refresh
                  setSelectedCertificateId(null)
                  setPendingCertificateId(null)

                  // Refresh certificate data based on user role
                  if (user_role === "learner") {
                    await fetch_CertificateData(profile?.id)
                  } else {
                    await fetch_AllCertificates(profile?.id)
                  }

                  // Now set the certificate ID to open the drawer with fresh data
                  setPendingCertificateId(latest.certificateId)
                  setSelectedCertificateId(latest.certificateId)
                } catch (error) {
                  console.error("Failed to refresh certificate data:", error)
                  // Still try to open the drawer even if refresh fails
                  setPendingCertificateId(latest.certificateId)
                  setSelectedCertificateId(latest.certificateId)
                }
              } else if (latest.isAnnouncement) {
                // Handle announcement navigation - refresh data and navigate to tab
                try {
                  // Clear any existing refresh flag
                  setNavigateToAnnouncement(false)
                  
                  // Refresh announcement data
                  await fetch_AnnouncementData()
                  
                  // Navigate to announcement tab
                  setNavigateToAnnouncement(true)
                  setActiveTab("announcement")
                } catch (error) {
                  console.error("Failed to refresh announcement data:", error)
                  setNavigateToAnnouncement(true)
                  setActiveTab("announcement")
                }
              }
            },
          }
        }

        // Show toast with the message
        toast[
          latest.type === "error"
            ? "error"
            : latest.type === "success"
              ? "success"
              : latest.type === "warning"
                ? "warning"
                : "info"
        ](latest.title || "Notification", toastOptions)
      }
    }
  }, [notifications])

  useEffect(() => {
    if (profile?.status === "default") {
      setIsChangePasswordOpen(true)
    }
  }, [profile])

  const userRole = profile?.role
    ? (profile.role.toLowerCase() as "admin" | "learner" | "approver")
    : "learner"

  const user_role = profile?.role ? userRole : "learner"

  useEffect(() => {
    if (!isProfileLoaded || !user_role) return

    const normalizedRole = user_role.toLowerCase()
    let tab = "learner-dashboard"

    switch (normalizedRole) {
      case "admin":
        tab = "admin-dashboard"
        break
      case "approver":
      case "department_head":
      case "division_head":
        tab = "approver-dashboard"
        break
      default:
        tab = "learner-dashboard"
        break
    }

    setActiveTab(tab)
  }, [user_role, isProfileLoaded])

  // Use database unread count
  const totalUnreadCount = dbUnreadCount || 0

  useEffect(() => {
    if (
      (activeTab === "japanese-certificates" ||
        activeTab === "certificates-requests") &&
      pendingCertificateId
    ) {
      setSelectedCertificateId(pendingCertificateId)
      setPendingCertificateId(null)
    }
  }, [activeTab, pendingCertificateId])

  const handleNotificationAction = (
    action: "view-course" | "view-certificate" | "view-announcement",
    id: number
  ) => {
    if (action === "view-course") {
      setSelectedCourseId(id)
      setActiveTab("courses")
    } else if (action === "view-certificate") {
      const targetTab =
        user_role === "learner"
          ? "japanese-certificates"
          : "certificates-requests"
      setPendingCertificateId(id)
      setSelectedCertificateId(null)
      setActiveTab(targetTab)
    } else if (action === "view-announcement") {
      // For announcements, just refresh data and navigate to the tab
      fetch_AnnouncementData().then(() => {
        setActiveTab("announcement")
      })
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    
    // Trigger refresh when navigating to announcement tab
    if (tab === "announcement") {
      setRefreshAnnouncements(true)
      // Reset after a moment
      setTimeout(() => setRefreshAnnouncements(false), 100)
    }
    
    if (tab !== "japanese-certificates" && tab !== "certificates-requests") {
      setSelectedCertificateId(null)
      setPendingCertificateId(null)
    }
  }

  // ========== EXPORT FUNCTION ==========
  const handleExportTemplate = async () => {
    try {
      setIsExporting(true)

      // Simple export with default values
      const response = await fetch("/api/excel/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // Uses default TEMPLATE_UPDATES
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error("Failed to export: " + (error.error || "Unknown error"))
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `skills_template_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("Template downloaded successfully!")
    } catch (error) {
      toast.error("Failed to download template")
    } finally {
      setIsExporting(false)
    }
  }

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
      case 'schedule':
        return 'Schedule'
      case "jlpt_target_level":
        return "JLPT Target Level"
      case "exams":
        return "Exam Management"
      case "skills":
        return "Employees' Skills"
      case "holidays":
        return "Holidays"
      case "japanese-certificates":
        return "Japanese Certificates"
      case "certificates-requests":
        return "Requested Certificates"
      case "announcement":
        return "Announcements"
      case "feedback":
        // Dynamic label based on user role
        return user_role === "learner" ? "Your Feedback" : "Learners' Feedback"
      case "exam_progress_report":
        return "Exam Progress Report"
      case "self_study_progress":
        return "Self Study Progress Report"
      case "audit_logs":
        return "Audit logs"
      default:
        return "Dashboard"
    }
  }

  const tabConfigs = [
    { value: "admin-dashboard", component: AdminDashboardContainer },
    { value: "approver-dashboard", component: ApproverDashboardContainer },
    {
      value: "learner-dashboard",
      component: LearnerDashboardContainer,
      props: {
        onNavigateToCourse: (courseId: number) => {
          setSelectedCourseId(courseId)
          setActiveTab("courses")
        },
        onNavigateToCertificate: (certificateId: number) => {
          setSelectedCertificateId(certificateId)
          setActiveTab("japanese-certificates")
        },
      },
    },
    { value: "employees", component: EmployeeContainer },
    {
      value: "courses",
      component: CoursesContainer,
      props: {
        userRole: userRole,
        selectedCourseId: selectedCourseId,
      },
    },
    { value: "schedule", component: ScheduleContainer },
    { value: "exams", component: ExamsContainer },
    {
      value: "announcement",
      component: AnnouncementContainer,
      props: {
        shouldRefresh: refreshAnnouncements,
      },
    },
    { value: "feedback", component: FeedbackContainer },
    { value: "skills", component: SkillContainer },
    { value: "jlpt_target_level", component: CurrentTargetContainer },
    { value: "holidays", component: HolidaysContainer },
    { value: "audit_logs", component: AuditLogsContainer },
    { value: "exam_progress_report", component: ExamProgressReportContainer },
    {
      value: "self_study_progress",
      component: SelfStudyProgessReportContainer,
    },
    {
      value: "japanese-certificates",
      component: JapaneseCertificateContainer,
      props: {
        selectedCertificateId: selectedCertificateId,
      },
    },
    {
      value: "certificates-requests",
      component: CertificatesRequestsContainer,
      props: {
        selectedCertificateId: selectedCertificateId,
      },
    },
  ]

  // Handle password update success
  const handlePasswordUpdateSuccess = (message: string) => {
    setSuccessMessage(message)
    setIsChangePasswordOpen(false)
    setCountdown(5) // Reset countdown to 5 seconds
    // Show success dialog after a small delay to allow the change password dialog to close
    setTimeout(() => {
      setIsSuccessDialogOpen(true)
    }, 300)
  }

  // Handle success dialog confirm
  const handleSuccessConfirm = async () => {
    setIsSuccessDialogOpen(false)
    await logout()
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
          userRole={user_role}
          onTabChange={handleTabChange}
          activeTab={activeTab}
        />
        <SidebarInset className="flex flex-col overflow-x-hidden">
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
                {/* Notification Bell */}
                <div className="relative">
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
                    {totalUnreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 flex h-5 min-w-[20px] animate-pulse items-center justify-center px-1 text-[10px]"
                      >
                        {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                      </Badge>
                    )}
                  </Button>
                  <div
                    className={`absolute -right-1 -bottom-1 h-3 w-3 rounded-full border-2 border-white ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </div>

                {user_role !== "learner" && (
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
                )}
              </div>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              {tabConfigs.map(({ value, component: Component, props }) => (
                <TabsContent key={value} value={value} className="m-0 mt-4">
                  <Component {...props} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
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
          showCloseButton={false}
          disableClose={true}
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
            onPasswordUpdate={(data) => {
              // Handle password update success
              handlePasswordUpdateSuccess(
                "Password changed successfully!\nPlease login with your new password."
              )
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent
          className="text-center sm:max-w-[425px]"
          showCloseButton={false}
        >
          <DialogHeader>
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  strokeWidth={2}
                  className="h-12 w-12 text-green-600 dark:text-green-400"
                />
              </div>
            </div>
            <DialogTitle className="text-2xl">Success!</DialogTitle>
            <DialogDescription className="text-base whitespace-pre-line">
              {successMessage || "Password changed successfully!"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <div className="flex items-center gap-3">
              <Button
                className="w-full sm:w-auto"
                onClick={handleSuccessConfirm}
              >
                Continue
              </Button>
              <span className="text-sm text-muted-foreground">
                ({countdown}s)
              </span>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportExportDialog />
    </>
  )
}
