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
  UserGroupIcon,
  CodeIcon,
  TrendingUp,
  CalendarIcon,
} from "@hugeicons/core-free-icons"
import { importTabs } from "./tabs-config"

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
  user: UserData
  navGroups: NavGroup[]
}

// Admin navigation data
export const adminData: SidebarConfig = {
  user: {
    name: "Admin",
    email: "admin@gmail.com",
    avatar: "/avatars/shadcn.jpg",
    role: "Admin",
    department: "IT Administration",
    team: "Platform Management",
  },
  navGroups: [
    {
      groupLabel: "Dashboard",
      items: [
        {
          title: "My Dashboard",
          tabId: "dashboard",
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
        // Master Data - Keep as dropdown
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
        // Employees - Changed to primary-action
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
        // Courses - Changed to primary-action
        {
          title: "Courses",
          tabId: "courses",
          type: "primary-action",
          icon: <HugeiconsIcon icon={CourseIcon} strokeWidth={STROKE_WIDTH} />,
          actions: [
            {
              label: "Import data",
              tabId: "courses",
              action: "import",
            },
            {
              label: "Export data",
              tabId: "courses",
              action: "export",
            },
            {
              label: "Delete data",
              tabId: "courses",
              action: "delete",
              destructive: true,
            },
          ],
        },
        // Skills - Changed to primary-action
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
            {
              label: "Delete data",
              tabId: "skills",
              action: "delete",
              destructive: true,
            },
          ],
        },
        // Current Target - Changed to primary-action
        {
          title: "Current target",
          tabId: "current_target_data",
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
            {
              label: "Delete data",
              tabId: "current_target_data",
              action: "delete",
              destructive: true,
            },
          ],
        },
        // Holidays - Changed to primary-action
        {
          title: "Holidays",
          tabId: "holidays",
          type: "primary-action",
          icon: (
            <HugeiconsIcon icon={CalendarIcon} strokeWidth={STROKE_WIDTH} />
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
      ],
    },
    {
      groupLabel: "Announcements",
      items: [
        {
          title: "Seminar",
          tabId: "seminar",
          type: "primary",
          icon: (
            <HugeiconsIcon
              icon={ComputerVideoCallIcon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
        },
        {
          title: "Exams",
          tabId: "exams",
          type: "primary",
          icon: <HugeiconsIcon icon={Task02Icon} strokeWidth={STROKE_WIDTH} />,
        },
      ],
    },
    {
      groupLabel: "Reports",
      items: [
        {
          title: "Exam progress",
          tabId: "exam_progress_report",
          type: "primary",
          icon: (
            <HugeiconsIcon
              icon={ChartHistogramIcon}
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
          title: "Settings",
          tabId: "settings",
          type: "primary",
          icon: (
            <HugeiconsIcon icon={SettingsIcon} strokeWidth={STROKE_WIDTH} />
          ),
        },
        {
          title: "Help",
          tabId: "help",
          type: "primary",
          icon: (
            <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={STROKE_WIDTH} />
          ),
        },
      ],
    },
  ],
}

// Learner navigation data
export const learnerData: SidebarConfig = {
  user: {
    name: "Nyan Tun Naing",
    email: "itismenyantunnaing@gmail.com",
    avatar: "/avatars/shadcn.jpg",
    role: "Learner",
    department: "Computer Science",
    team: "Block Chain",
  },
  navGroups: [
    {
      groupLabel: "Dashboard",
      items: [
        {
          title: "My Dashboard",
          tabId: "dashboard",
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
        {
          title: "My Study Hours",
          tabId: "study-hours",
          type: "primary",
          icon: <HugeiconsIcon icon={Time04Icon} strokeWidth={STROKE_WIDTH} />,
        },
        {
          title: "My Progress",
          tabId: "progress",
          type: "primary",
          icon: (
            <HugeiconsIcon
              icon={CalendarAnalysisIcon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
        },
      ],
    },
    {
      groupLabel: "Announcements",
      items: [
        {
          title: "Schedule",
          tabId: "schedule",
          type: "primary",
          icon: (
            <HugeiconsIcon icon={Calendar01Icon} strokeWidth={STROKE_WIDTH} />
          ),
        },
        {
          title: "Upcoming Seminars",
          tabId: "seminars",
          type: "primary",
          icon: (
            <HugeiconsIcon
              icon={ComputerVideoCallIcon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
        },
        {
          title: "Upcoming Exams",
          tabId: "upcoming-exams",
          type: "primary",
          icon: <HugeiconsIcon icon={Task02Icon} strokeWidth={STROKE_WIDTH} />,
        },
        {
          title: "Results",
          tabId: "results",
          type: "primary",
          icon: <HugeiconsIcon icon={DiplomaIcon} strokeWidth={STROKE_WIDTH} />,
        },
      ],
    },
    {
      groupLabel: "Achievements",
      items: [
        {
          title: "Offstore Certificates",
          tabId: "offstore-certificates",
          type: "primary",
          icon: <HugeiconsIcon icon={DiplomaIcon} strokeWidth={STROKE_WIDTH} />,
        },
        {
          title: "Japanese Certificates",
          tabId: "japanese-certificates",
          type: "primary",
          icon: <HugeiconsIcon icon={DiplomaIcon} strokeWidth={STROKE_WIDTH} />,
        },
      ],
    },
    {
      groupLabel: "Reports",
      items: [
        {
          title: "My Learning Report",
          tabId: "my-learning-report",
          type: "primary",
          icon: (
            <HugeiconsIcon icon={GoogleDocIcon} strokeWidth={STROKE_WIDTH} />
          ),
        },
        {
          title: "Study Analysis",
          tabId: "study-analysis",
          type: "primary",
          icon: (
            <HugeiconsIcon icon={Analytics01Icon} strokeWidth={STROKE_WIDTH} />
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
            <HugeiconsIcon
              icon={ChatFeedback01Icon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
        },
        {
          title: "Help",
          tabId: "help",
          type: "primary",
          icon: (
            <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={STROKE_WIDTH} />
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
          tabId: "dashboard",
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
      groupLabel: "Approvals",
      items: [
        {
          title: "Pending Approvals",
          tabId: "pending-approvals",
          type: "primary",
          icon: <HugeiconsIcon icon={Time02Icon} strokeWidth={STROKE_WIDTH} />,
        },
        {
          title: "Course Requests",
          tabId: "course-requests",
          type: "primary",
          icon: <HugeiconsIcon icon={CourseIcon} strokeWidth={STROKE_WIDTH} />,
        },
        {
          title: "Leave Requests",
          tabId: "leave-requests",
          type: "primary",
          icon: (
            <HugeiconsIcon icon={Calendar01Icon} strokeWidth={STROKE_WIDTH} />
          ),
        },
        {
          title: "Certification Requests",
          tabId: "certification-requests",
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
    {
      groupLabel: "Review & Feedback",
      items: [
        {
          title: "Performance Reviews",
          tabId: "performance-reviews",
          type: "primary",
          icon: (
            <HugeiconsIcon icon={Analytics01Icon} strokeWidth={STROKE_WIDTH} />
          ),
        },
        {
          title: "Learner Feedback",
          tabId: "learner-feedback",
          type: "primary",
          icon: (
            <HugeiconsIcon
              icon={ChatFeedback01Icon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
        },
      ],
    },
    {
      groupLabel: "Reports",
      items: [
        {
          title: "Approval Reports",
          tabId: "approval-reports",
          type: "primary",
          icon: (
            <HugeiconsIcon icon={GoogleDocIcon} strokeWidth={STROKE_WIDTH} />
          ),
        },
        {
          title: "Learner Progress Reports",
          tabId: "learner-progress-reports",
          type: "primary",
          icon: (
            <HugeiconsIcon
              icon={CalendarAnalysisIcon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
        },
      ],
    },
    {
      groupLabel: "Announcements",
      items: [
        {
          title: "Seminar",
          tabId: "seminar",
          type: "primary",
          icon: (
            <HugeiconsIcon
              icon={ComputerVideoCallIcon}
              strokeWidth={STROKE_WIDTH}
            />
          ),
        },
        {
          title: "Exams",
          tabId: "exams",
          type: "primary",
          icon: <HugeiconsIcon icon={Task02Icon} strokeWidth={STROKE_WIDTH} />,
        },
      ],
    },
    {
      groupLabel: "Support",
      items: [
        {
          title: "Settings",
          tabId: "settings",
          type: "primary",
          icon: (
            <HugeiconsIcon icon={SettingsIcon} strokeWidth={STROKE_WIDTH} />
          ),
        },
        {
          title: "Help",
          tabId: "help",
          type: "primary",
          icon: (
            <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={STROKE_WIDTH} />
          ),
        },
      ],
    },
  ],
}

// Helper function to get sidebar config based on user role
export function getSidebarConfig(
  role: "admin" | "learner" | "approver",
  userData?: { name?: string; email?: string }
): SidebarConfig {
  let baseConfig: SidebarConfig

  switch (role) {
    case "admin":
      baseConfig = adminData
      break
    case "learner":
      baseConfig = learnerData
      break
    case "approver":
      baseConfig = approverData
      break
    default:
      baseConfig = adminData
  }

  // Create a new object to avoid mutating the original static data
  const config: SidebarConfig = {
    ...baseConfig,
    user: {
      ...baseConfig.user,
      ...(userData?.name && { name: userData.name }),
      ...(userData?.email && { email: userData.email }),
    },
  }

  return config
}
