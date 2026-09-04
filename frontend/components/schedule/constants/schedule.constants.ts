
import {
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  ClockIcon,
  File02Icon,
} from "@hugeicons/core-free-icons"
import { SessionAttendanceStatus } from "@/types/schedule"

export const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
export const DOW_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]
export const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export const HOUR_START = 7 // 7 AM
export const HOUR_END = 19 // 7 PM
export const HOUR_HEIGHT = 64 // px per hour row
export const STROKE_WIDTH = 2
export const CURRENT_LEARNER_ID = "learner-self-01"

export const SESSION_THEMES = [
  {
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-700",
    subtext: "text-blue-600/70",
    hoverRing: "hover:ring-blue-400",
  },
  {
    bg: "bg-purple-50",
    border: "border-purple-400",
    text: "text-purple-700",
    subtext: "text-purple-600/70",
    hoverRing: "hover:ring-purple-400",
  },
  {
    bg: "bg-emerald-50",
    border: "border-emerald-400",
    text: "text-emerald-700",
    subtext: "text-emerald-600/70",
    hoverRing: "hover:ring-emerald-400",
  },
  {
    bg: "bg-amber-50",
    border: "border-amber-400",
    text: "text-amber-700",
    subtext: "text-amber-600/70",
    hoverRing: "hover:ring-amber-400",
  },
  {
    bg: "bg-rose-50",
    border: "border-rose-400",
    text: "text-rose-700",
    subtext: "text-rose-600/70",
    hoverRing: "hover:ring-rose-400",
  },
]

export const SESSION_ATTENDANCE_OPTIONS: Array<{
  value: SessionAttendanceStatus
  label: string
  code: string
  icon: any
  iconColor: string
  badgeCn: string
  dotCn: string
}> = [
  {
    value: "PRESENT",
    label: "Present",
    code: "P",
    icon: CheckmarkCircle02Icon,
    iconColor: "text-green-600",
    badgeCn: "bg-green-100 text-green-700 border-green-200",
    dotCn: "bg-green-500",
  },
  {
    value: "ABSENT",
    label: "Absent",
    code: "A",
    icon: CancelCircleIcon,
    iconColor: "text-red-600",
    badgeCn: "bg-red-100 text-red-700 border-red-200",
    dotCn: "bg-red-500",
  },
  {
    value: "LATE",
    label: "Late",
    code: "L",
    icon: ClockIcon,
    iconColor: "text-yellow-600",
    badgeCn: "bg-yellow-100 text-yellow-700 border-yellow-200",
    dotCn: "bg-yellow-500",
  },
  {
    value: "EXCUSED",
    label: "Excused",
    code: "E",
    icon: File02Icon,
    iconColor: "text-blue-600",
    badgeCn: "bg-blue-100 text-blue-700 border-blue-200",
    dotCn: "bg-blue-500",
  },
]

export const ATTENDANCE_OPTION_BY_VALUE = Object.fromEntries(
  SESSION_ATTENDANCE_OPTIONS.map((o) => [o.value, o])
) as Record<
  SessionAttendanceStatus,
  (typeof SESSION_ATTENDANCE_OPTIONS)[number]
>