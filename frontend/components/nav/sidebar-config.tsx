import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardBrowsingIcon,
  DiplomaIcon,
  ComputerVideoCallIcon,
  DatabaseIcon,
  Calendar01Icon,
  HelpCircleIcon,
  SettingsIcon,
  CalendarAnalysisIcon,
  Task02Icon,
  ChatFeedback01Icon,
  Analytics01Icon,
  GoogleDocIcon,
  Time04Icon,
  CourseIcon,
  DocumentValidationIcon,
  Time02Icon,
  ChartHistogramIcon,
  Chart01Icon,
  UserGroupIcon,
  CodeIcon,
  TrendingUp,
  CalendarIcon,
  MonitorDotIcon,
  Certificate01Icon,
  Comment01Icon,
  Message01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"

const STROKE_WIDTH = 2

// Types
export interface NavItem {
  title: string
  tabId?: string
  type: "primary" | "dropdown" | "primary-action"
  icon?: React.ReactNode
  isActive?: boolean
  items?: Array<{
    title: string
    tabId?: string
    action?: "import" | "export" | "delete"
    destructive?: boolean
  }>
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    tabId?: string
    action?: "import" | "export" | "delete"
    onClick?: () => void
    destructive?: boolean
  }>
}

export interface NavGroup {
  groupLabel: string
  items: NavItem[]
}

export interface UserData {
  name: string
  email: string
  avatar: string
  role: string
  department?: string
  team?: string
}

export interface SidebarConfig {
  user: UserData | null
  navGroups: NavGroup[]
}

// Admin navigation data
export const adminData: SidebarConfig = {
  user: null,
  navGroups: [
    {
      groupLabel: "Dashboard",
      items: [
        {
          title: "My Dashboard",
          tabId: "admin-dashboard",
          type: "primary",
          icon: (
            <HugeiconsIcon
              icon={DashboardBrowsingIcon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
        },
      ],
    },
    {
      groupLabel: "Manage",
      items: [
        {
          title: "Master Data",
          tabId: "master",
          type: "dropdown",
          icon: (
            <HugeiconsIcon icon={DatabaseIcon} strokeWidth={STROKE_WIDTH} />
          ),
          isActive: false,
          items: [
            {
              title: "Import data",
              action: "import",
            },
            {
              title: "Export data",
              action: "export",
            },
            {
              title: "Delete data",
              action: "delete",
              destructive: true,
            },
          ],
        },
        {
          title: "Employees",
          tabId: "employees",
          type: "primary-action",
          icon: (
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={STROKE_WIDTH} />
          ),
          actions: [
            {
              label: "Import data",
              tabId: "employees",
              action: "import",
            },
            {
              label: "Export data",
              tabId: "employees",
              action: "export",
            },
            {
              label: "Delete data",
              tabId: "employees",
              action: "delete",
              destructive: true,
            },
          ],
        },
        {
          title: "Courses",
          tabId: "courses",
          type: "primary",
          icon: <HugeiconsIcon icon={CourseIcon} strokeWidth={STROKE_WIDTH} />,
        },
        {
          title: "Skills",
          tabId: "skills",
          type: "primary-action",
          icon: <HugeiconsIcon icon={CodeIcon} strokeWidth={STROKE_WIDTH} />,
          actions: [
            {
              label: "Import data",
              tabId: "skills",
              action: "import",
            },
            {
              label: "Export data",
              tabId: "skills",
              action: "export",
            },
          ],
        },
        {
          title: "Current target",
          tabId: "current_target_level",
          type: "primary-action",
          icon: <HugeiconsIcon icon={TrendingUp} strokeWidth={STROKE_WIDTH} />,
          actions: [
            {
              label: "Import data",
              tabId: "current_target_data",
              action: "import",
            },
            {
              label: "Export data",
              tabId: "current_target_data",
              action: "export",
            },
          ],
        },
        {
          title: "Holidays",
          tabId: "holidays",
          type: "primary-action",
          icon: (
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={STROKE_WIDTH} />
          ),
          actions: [
            {
              label: "Import data",
              tabId: "holidays",
              action: "import",
            },
            {
              label: "Export data",
              tabId: "holidays",
              action: "export",
            },
            {
              label: "Delete data",
              tabId: "holidays",
              action: "delete",
              destructive: true,
            },
          ],
        },
        {
          title: "Requested Certificates",
          tabId: "certificates-requests",
          type: "primary",
          icon: (
            <HugeiconsIcon
              icon={Certificate01Icon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
        },
      ],
    },
    // {
    //   groupLabel: "Announcements",
    //   items: [
    //     {
    //       title: "Exams",
    //       tabId: "exams",
    //       type: "primary",
    //       icon: <HugeiconsIcon icon={Task02Icon} strokeWidth={STROKE_WIDTH} />,
    //     },
    //   ],
    // },
    {
      groupLabel: "Reports",
      items: [
        {
          title: "Exam Progress",
          tabId: "exam_progress_report",
          type: "primary-action",
          icon: (
            <HugeiconsIcon
              icon={ChartHistogramIcon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
          actions: [
            {
              label: "Export data",
              tabId: "exam_progress_report",
              action: "export",
            },
          ],
        },
        {
          title: "Self Study Progress",
          tabId: "self_study_progress",
          type: "primary",
          icon: <HugeiconsIcon icon={Chart01Icon} strokeWidth={STROKE_WIDTH} />,
        },
      ],
    },
    {
      groupLabel: "Support",
      items: [
        {
          title: "Feedback",
          tabId: "feedback",
          type: "primary-action",
          icon: (
            <HugeiconsIcon
              icon={Message01Icon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
          actions: [
            {
              label: "Export data",
              tabId: "exam_progress_report",
              action: "export",
            },
          ],
        },
      ],
    },
    {
      groupLabel: "System",
      items: [
        {
          title: "Audit logs",
          tabId: "audit_logs",
          type: "primary",
          icon: (
            <HugeiconsIcon icon={MonitorDotIcon} strokeWidth={STROKE_WIDTH} />
          ),
        },
      ],
    },
  ],
}

// Learner navigation data
export const learnerData: SidebarConfig = {
  user: null,
  navGroups: [
    {
      groupLabel: "Dashboard",
      items: [
        {
          title: "My Dashboard",
          tabId: "learner-dashboard",
          type: "primary",
          icon: (
            <HugeiconsIcon
              icon={DashboardBrowsingIcon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
        },
      ],
    },
    {
      groupLabel: "My Learning",
      items: [
        {
          title: "Courses",
          tabId: "courses",
          type: "primary",
          icon: <HugeiconsIcon icon={CourseIcon} strokeWidth={STROKE_WIDTH} />,
        },
      ],
    },
    // {
    //   groupLabel: "Announcements",
    //   items: [
    //     {
    //       title: "Upcoming Exams",
    //       tabId: "upcoming-exams",
    //       type: "primary",
    //       icon: <HugeiconsIcon icon={Task02Icon} strokeWidth={STROKE_WIDTH} />,
    //     },
    //   ],
    // },
    {
      groupLabel: "Achievements",
      items: [
        {
          title: "Japanese Certificates",
          tabId: "japanese-certificates",
          type: "primary",
          icon: (
            <HugeiconsIcon
              icon={Certificate01Icon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
        },
      ],
    },
    {
      groupLabel: "Support",
      items: [
        {
          title: "Feedback",
          tabId: "feedback",
          type: "primary",
          icon: (
            <HugeiconsIcon icon={Message01Icon} strokeWidth={STROKE_WIDTH} />
          ),
        },
      ],
    },
  ],
}

// Approver navigation data
export const approverData: SidebarConfig = {
  user: {
    name: "Approver",
    email: "approver@gmail.com",
    avatar: "/avatars/shadcn.jpg",
    role: "Approver",
    department: "HR & Operations",
    team: "Approval Committee",
  },
  navGroups: [
    {
      groupLabel: "Dashboard",
      items: [
        {
          title: "My Dashboard",
          tabId: "approver-dashboard",
          type: "primary",
          icon: (
            <HugeiconsIcon
              icon={DashboardBrowsingIcon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
        },
      ],
    },
    {
      groupLabel: "Manage",
      items: [
        {
          title: "Employees",
          tabId: "employees",
          type: "primary",
          icon: (
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={STROKE_WIDTH} />
          ),
        },
        {
          title: "Courses",
          tabId: "courses",
          type: "primary",
          icon: <HugeiconsIcon icon={CourseIcon} strokeWidth={STROKE_WIDTH} />,
        },
        {
          title: "Skills",
          tabId: "skills",
          type: "primary",
          icon: <HugeiconsIcon icon={CodeIcon} strokeWidth={STROKE_WIDTH} />,
        },
        {
          title: "Current target",
          tabId: "current_target_level",
          type: "primary",
          icon: <HugeiconsIcon icon={TrendingUp} strokeWidth={STROKE_WIDTH} />,
        },
        {
          title: "Requested Certificates",
          tabId: "certificates-requests",
          type: "primary",
          icon: (
            <HugeiconsIcon
              icon={DocumentValidationIcon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
        },
      ],
    },
    // {
    //   groupLabel: "Reports",
    //   items: [
    //     {
    //       title: "Approval Reports",
    //       tabId: "approval-reports",
    //       type: "primary",
    //       icon: (
    //         <HugeiconsIcon icon={GoogleDocIcon} strokeWidth={STROKE_WIDTH} />
    //       ),
    //     },
    //     {
    //       title: "Learner Progress Reports",
    //       tabId: "learner-progress-reports",
    //       type: "primary",
    //       icon: (
    //         <HugeiconsIcon
    //           icon={CalendarAnalysisIcon}
    //           strokeWidth={STROKE_WIDTH}
    //         />
    //       ),
    //     },
    //   ],
    // },
    {
      groupLabel: "Support",
      items: [
        {
          title: "Feedback",
          tabId: "feedback",
          type: "primary",
          icon: (
            <HugeiconsIcon
              icon={Message01Icon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
        },
      ],
    },
  ],
}

// Helper function to get sidebar config based on user role
export function getSidebarConfig(
  role: "admin" | "learner" | "approver" | "department_head" | "division_head"
): SidebarConfig {
  switch (role) {
    case "admin":
      return adminData
    case "learner":
      return learnerData
    case "approver":
    case "department_head":
    case "division_head":
      return approverData
    default:
      return adminData
  }
}
