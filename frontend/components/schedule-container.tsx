// components/schedule/ScheduleContainer.tsx
"use client"

import React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  Search01Icon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  ClockIcon,
  File02Icon,
  UserGroupIcon,
  Time02Icon,
  CourseIcon,
  TeacherIcon,
  CircleIcon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type ScheduleView = "week" | "month"
type ScheduleType = "trainer-provided" | "self-study"

interface Session {
  id: string
  name: string
  courseName: string
  instructor?: string
  instructorEmail?: string
  dayIndex: number // 0 = Monday ... 6 = Sunday
  startHour: number // decimal hours, e.g. 8.5 = 8:30 AM
  endHour: number
  theme: number // index into SESSION_THEMES
  group?: string // Added group field
  type?: ScheduleType // Added type field
  weekIndex?: number // Self-study only: which of the 4 board columns (0-3)
  durationDays?: number // Self-study only: length of the session, defaults to 7
  sessionDate?: Date // For status calculation
}

type SessionAttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"

interface SessionLearnerRow {
  id: string
  learnerName: string
  email: string
  department: string
  team: string
  position: string
  group?: string // Added group field
  status: SessionAttendanceStatus
  note?: string
  lateMinutes?: number
}

interface SessionDialogState {
  open: boolean
  session: Session | null
}

type SessionTestRole = "learner" | "admin"

/* -------------------------------------------------------------------------- */
/*  Self-study progress types                                                */
/* -------------------------------------------------------------------------- */

// Mirrors the ProgressTab study columns: grammar, vocabulary, kanji,
// reading, listening - each tracked as current-vs-target for a session.
const SELF_STUDY_COLUMNS = [
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "kanji", label: "Kanji" },
  { key: "reading", label: "Reading" },
  { key: "listening", label: "Listening" },
] as const

type SelfStudyColumnKey = (typeof SELF_STUDY_COLUMNS)[number]["key"]

interface SelfStudyProgressFields {
  grammarCurrent: number
  grammarTarget: number
  vocabularyCurrent: number
  vocabularyTarget: number
  kanjiCurrent: number
  kanjiTarget: number
  readingCurrent: number
  readingTarget: number
  listeningCurrent: number
  listeningTarget: number
}

interface SessionProgressRow extends SelfStudyProgressFields {
  id: string
  learnerName: string
  email: string
  department: string
  team: string
  position: string
  group?: string
}

/* -------------------------------------------------------------------------- */
/*  Config                                                                    */
/* -------------------------------------------------------------------------- */

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
const DOW_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]
const MONTH_SHORT = [
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

const HOUR_START = 7 // 7 AM
const HOUR_END = 19 // 7 PM
const HOUR_HEIGHT = 64 // px per hour row

const STROKE_WIDTH = 2
const CURRENT_LEARNER_ID = "learner-self-01"

// Pastel block themes, cycled across sessions - mirrors the soft calendar-card
// look in the reference design without leaning on any single default palette.
const SESSION_THEMES = [
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

// Matches AttendanceTab visuals exactly — green/red/yellow/blue + codes
const SESSION_ATTENDANCE_OPTIONS: Array<{
  value: SessionAttendanceStatus
  label: string
  code: string
  icon:
    | typeof CheckmarkCircle02Icon
    | typeof CancelCircleIcon
    | typeof ClockIcon
    | typeof File02Icon
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

const ATTENDANCE_OPTION_BY_VALUE = Object.fromEntries(
  SESSION_ATTENDANCE_OPTIONS.map((o) => [o.value, o])
) as Record<
  SessionAttendanceStatus,
  (typeof SESSION_ATTENDANCE_OPTIONS)[number]
>

const getInitials = (name: string) => {
  if (!name) return "??"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/* -------------------------------------------------------------------------- */
/*  Dummy data - 16 sessions spread across the week with course names        */
/* -------------------------------------------------------------------------- */

const INSTRUCTORS = [
  { name: "Tanaka Hiroshi", email: "tanaka.hiroshi@dat.co.jp" },
  { name: "Suzuki Emiko", email: "suzuki.emiko@dat.co.jp" },
  { name: "Yamamoto Ken", email: "yamamoto.ken@dat.co.jp" },
  { name: "Sato Yuki", email: "sato.yuki@dat.co.jp" },
]

const DUMMY_SESSIONS: Session[] = [
  {
    id: "1",
    name: "Session 1",
    courseName: "Introduction to React",
    instructor: INSTRUCTORS[0].name,
    instructorEmail: INSTRUCTORS[0].email,
    dayIndex: 0,
    startHour: 8,
    endHour: 9,
    theme: 0,
    group: "Group A - Frontend",
    type: "trainer-provided",
  },
  {
    id: "2",
    name: "Session 2",
    courseName: "Advanced TypeScript",
    instructor: INSTRUCTORS[1].name,
    instructorEmail: INSTRUCTORS[1].email,
    dayIndex: 0,
    startHour: 9.5,
    endHour: 10.5,
    theme: 2,
    group: "Group B - Backend",
    type: "trainer-provided",
  },
  {
    id: "3",
    name: "Session 3",
    courseName: "UI/UX Design Principles",
    instructor: INSTRUCTORS[2].name,
    instructorEmail: INSTRUCTORS[2].email,
    dayIndex: 0,
    startHour: 11,
    endHour: 12,
    theme: 1,
    group: "Group H - UI/UX",
    type: "self-study",
    weekIndex: 0,
    durationDays: 7,
  },
  {
    id: "4",
    name: "Session 4",
    courseName: "Database Design",
    instructor: INSTRUCTORS[3].name,
    instructorEmail: INSTRUCTORS[3].email,
    dayIndex: 1,
    startHour: 8,
    endHour: 9,
    theme: 0,
    group: "Group A - Frontend",
    type: "trainer-provided",
  },
  {
    id: "5",
    name: "Session 5",
    courseName: "API Development",
    instructor: INSTRUCTORS[0].name,
    instructorEmail: INSTRUCTORS[0].email,
    dayIndex: 1,
    startHour: 9,
    endHour: 10,
    theme: 2,
    group: "Group B - Backend",
    type: "trainer-provided",
  },
  {
    id: "6",
    name: "Session 6",
    courseName: "Cloud Computing",
    instructor: INSTRUCTORS[1].name,
    instructorEmail: INSTRUCTORS[1].email,
    dayIndex: 1,
    startHour: 10.5,
    endHour: 11.5,
    theme: 3,
    group: "Group F - Cloud",
    type: "self-study",
    weekIndex: 1,
    durationDays: 7,
  },
  {
    id: "7",
    name: "Session 7",
    courseName: "DevOps Fundamentals",
    instructor: INSTRUCTORS[2].name,
    instructorEmail: INSTRUCTORS[2].email,
    dayIndex: 2,
    startHour: 8.5,
    endHour: 9.5,
    theme: 0,
    group: "Group E - DevOps",
    type: "trainer-provided",
  },
  {
    id: "8",
    name: "Session 8",
    courseName: "Machine Learning",
    instructor: INSTRUCTORS[3].name,
    instructorEmail: INSTRUCTORS[3].email,
    dayIndex: 2,
    startHour: 10,
    endHour: 11,
    theme: 2,
    group: "Group G - Data Science",
    type: "trainer-provided",
  },
  {
    id: "9",
    name: "Session 9",
    courseName: "Data Analytics",
    instructor: INSTRUCTORS[0].name,
    instructorEmail: INSTRUCTORS[0].email,
    dayIndex: 2,
    startHour: 12,
    endHour: 13,
    theme: 4,
    group: "Group G - Data Science",
    type: "self-study",
    weekIndex: 2,
    durationDays: 7,
  },
  {
    id: "10",
    name: "Session 10",
    courseName: "Project Management",
    instructor: INSTRUCTORS[1].name,
    instructorEmail: INSTRUCTORS[1].email,
    dayIndex: 3,
    startHour: 9,
    endHour: 10,
    theme: 1,
    group: "Group C - Full Stack",
    type: "trainer-provided",
  },
  {
    id: "11",
    name: "Session 11",
    courseName: "Agile Methodologies",
    instructor: INSTRUCTORS[2].name,
    instructorEmail: INSTRUCTORS[2].email,
    dayIndex: 3,
    startHour: 11,
    endHour: 12.5,
    theme: 3,
    group: "Group C - Full Stack",
    type: "self-study",
    weekIndex: 3,
    durationDays: 7,
  },
  {
    id: "12",
    name: "Session 12",
    courseName: "Cybersecurity Basics",
    instructor: INSTRUCTORS[3].name,
    instructorEmail: INSTRUCTORS[3].email,
    dayIndex: 4,
    startHour: 8,
    endHour: 9,
    theme: 0,
    group: "Group D - Mobile",
    type: "trainer-provided",
  },
  {
    id: "13",
    name: "Session 13",
    courseName: "Network Architecture",
    instructor: INSTRUCTORS[0].name,
    instructorEmail: INSTRUCTORS[0].email,
    dayIndex: 4,
    startHour: 9.5,
    endHour: 10.5,
    theme: 4,
    group: "Group D - Mobile",
    type: "self-study",
    weekIndex: 0,
    durationDays: 7,
  },
  {
    id: "14",
    name: "Session 14",
    courseName: "Software Testing",
    instructor: INSTRUCTORS[1].name,
    instructorEmail: INSTRUCTORS[1].email,
    dayIndex: 4,
    startHour: 11.5,
    endHour: 12.5,
    theme: 2,
    group: "Group B - Backend",
    type: "trainer-provided",
  },
  {
    id: "15",
    name: "Session 15",
    courseName: "Mobile Development",
    instructor: INSTRUCTORS[2].name,
    instructorEmail: INSTRUCTORS[2].email,
    dayIndex: 5,
    startHour: 10,
    endHour: 11.5,
    theme: 1,
    group: "Group D - Mobile",
    type: "self-study",
    weekIndex: 1,
    durationDays: 7,
  },
  {
    id: "16",
    name: "Session 16",
    courseName: "Web Performance Optimization",
    instructor: INSTRUCTORS[3].name,
    instructorEmail: INSTRUCTORS[3].email,
    dayIndex: 6,
    startHour: 11,
    endHour: 12,
    theme: 3,
    group: "Group A - Frontend",
    type: "trainer-provided",
  },
]

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const getWeekStart = (refDate: Date) => {
  const date = new Date(refDate)
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diffToMonday)
  date.setHours(0, 0, 0, 0)
  return date
}

const getWeekDates = (weekStart: Date) =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const formatHourLabel = (hour: number) => {
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour} ${period}`
}

const formatTimeLabel = (hour: number) => {
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = Math.floor(hour % 12 === 0 ? 12 : hour % 12)
  const minutes = Math.round((hour % 1) * 60)
  return minutes === 0
    ? `${displayHour} ${period}`
    : `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`
}

const formatFullDate = (d: Date) => {
  const dow = DOW_LONG[d.getDay()]
  const month = MONTH_SHORT[d.getMonth()]
  return ` ${month} ${d.getDate()} ${d.getFullYear()} (${dow})`
}

const formatWeekRangeLabel = (weekDates: Date[]) => {
  const start = weekDates[0]
  const end = weekDates[6]
  const startMonth = start.toLocaleString("default", { month: "short" })
  const endMonth = end.toLocaleString("default", { month: "short" })
  const year = end.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()} ${year}`
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()} ${year}`
}

// Range label spanning the full 4-column self-study board (28 days)
const formatStudyPeriodLabel = (columns: { start: Date; end: Date }[]) => {
  if (!columns.length) return ""
  const start = columns[0].start
  const end = columns[columns.length - 1].end
  const startMonth = start.toLocaleString("default", { month: "short" })
  const endMonth = end.toLocaleString("default", { month: "short" })
  const year = end.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()} ${year}`
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()} ${year}`
}

// Short label for a single board column, e.g. "Aug 4 - Aug 10"
const formatStudyColumnLabel = (col: { start: Date; end: Date }) => {
  const startMonth = col.start.toLocaleString("default", { month: "short" })
  const endMonth = col.end.toLocaleString("default", { month: "short" })
  if (startMonth === endMonth) {
    return `${startMonth} ${col.start.getDate()} - ${col.end.getDate()}`
  }
  return `${startMonth} ${col.start.getDate()} - ${endMonth} ${col.end.getDate()}`
}

// Format month label for navigation
const formatMonthLabel = (date: Date) => {
  return date.toLocaleString("default", { month: "short" })
}

/* -------------------------------------------------------------------------- */
/*  Dummy session-learner data generator + summary calc                      */
/* -------------------------------------------------------------------------- */

const LEARNER_POOL: Omit<
  SessionLearnerRow,
  "status" | "note" | "lateMinutes"
>[] = [
  {
    id: CURRENT_LEARNER_ID,
    learnerName: "Okafor Nkemdilim",
    email: "okafor.n@company.com",
    department: "Engineering",
    team: "Frontend",
    position: "Junior Engineer",
    group: "Group A - Frontend",
  },
  {
    id: "l-02",
    learnerName: "Suzuki Aoi",
    email: "suzuki.aoi@company.com",
    department: "Engineering",
    team: "Backend",
    position: "Engineer",
    group: "Group B - Backend",
  },
  {
    id: "l-03",
    learnerName: "Tanaka Haruto",
    email: "tanaka.h@company.com",
    department: "Engineering",
    team: "Frontend",
    position: "Senior Engineer",
    group: "Group A - Frontend",
  },
  {
    id: "l-04",
    learnerName: "Patel Aarav",
    email: "patel.a@company.com",
    department: "Product",
    team: "Design",
    position: "Product Designer",
    group: "Group H - UI/UX",
  },
  {
    id: "l-05",
    learnerName: "Nguyen Minh",
    email: "nguyen.m@company.com",
    department: "Engineering",
    team: "DevOps",
    position: "SRE",
    group: "Group E - DevOps",
  },
  {
    id: "l-06",
    learnerName: "Kobayashi Ren",
    email: "kobayashi.r@company.com",
    department: "Marketing",
    team: "Growth",
    position: "Marketing Lead",
    group: "Group G - Data Science",
  },
  {
    id: "l-07",
    learnerName: "Ito Yuna",
    email: "ito.y@company.com",
    department: "HR",
    team: "People Ops",
    position: "HR Specialist",
    group: "Group F - Cloud",
  },
  {
    id: "l-08",
    learnerName: "Kim Min-ji",
    email: "kim.mj@company.com",
    department: "Engineering",
    team: "QA",
    position: "QA Engineer",
    group: "Group C - Full Stack",
  },
  {
    id: "l-09",
    learnerName: "Chen Wei",
    email: "chen.w@company.com",
    department: "Sales",
    team: "Enterprise",
    position: "Account Manager",
    group: "Group D - Mobile",
  },
  {
    id: "l-10",
    learnerName: "Sato Kota",
    email: "sato.k@company.com",
    department: "Engineering",
    team: "Backend",
    position: "Engineer",
    group: "Group B - Backend",
  },
  {
    id: "l-11",
    learnerName: "Ali Farah",
    email: "ali.f@company.com",
    department: "Product",
    team: "PM",
    position: "Product Manager",
    group: "Group C - Full Stack",
  },
  {
    id: "l-12",
    learnerName: "Garcia Lucas",
    email: "garcia.l@company.com",
    department: "Engineering",
    team: "Frontend",
    position: "Engineer",
    group: "Group A - Frontend",
  },
]

const mulberry32 = (seed: number) => (): number => {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const generateSessionLearners = (
  sessionId: string,
  sessionNo: number
): SessionLearnerRow[] => {
  const rand = mulberry32(parseInt(sessionId, 10) * 1000 + sessionNo * 97)
  const statuses: SessionAttendanceStatus[] = [
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "ABSENT",
    "LATE",
    "EXCUSED",
  ]

  return LEARNER_POOL.map((row, idx) => {
    // Force current learner PRESENT most of the time for nice defaults
    let status: SessionAttendanceStatus
    if (row.id === CURRENT_LEARNER_ID) {
      status = sessionNo % 7 === 0 ? "LATE" : "PRESENT"
    } else {
      const sample = statuses[Math.floor(rand() * statuses.length)]
      status = sample
    }

    const noteHints: Partial<Record<SessionAttendanceStatus, string>> = {
      LATE: idx % 2 === 0 ? "15 min late due to train delay" : undefined,
      EXCUSED: "Sick leave submitted via HR",
      ABSENT: idx % 3 === 0 ? "No prior notice" : undefined,
    }

    return {
      ...row,
      status,
      note: noteHints[status],
      lateMinutes: status === "LATE" ? 10 + Math.floor(rand() * 40) : undefined,
    }
  })
}

interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  ratePercent: number
}

const calculateAttendanceSummary = (
  rows: SessionLearnerRow[]
): AttendanceSummary => {
  const total = rows.length || 1
  const present = rows.filter((r) => r.status === "PRESENT").length
  const absent = rows.filter((r) => r.status === "ABSENT").length
  const late = rows.filter((r) => r.status === "LATE").length
  const excused = rows.filter((r) => r.status === "EXCUSED").length
  const ratePercent = Math.round(((present + late + excused) / total) * 100)
  return { total, present, absent, late, excused, ratePercent }
}

/* -------------------------------------------------------------------------- */
/*  Dummy self-study progress data generator + summary calc                  */
/* -------------------------------------------------------------------------- */

const generateSessionProgress = (
  sessionId: string,
  sessionNo: number
): SessionProgressRow[] => {
  const rand = mulberry32(parseInt(sessionId, 10) * 733 + sessionNo * 31)

  const targetRanges: Record<
    SelfStudyColumnKey,
    { min: number; range: number }
  > = {
    grammar: { min: 50, range: 30 },
    vocabulary: { min: 40, range: 25 },
    kanji: { min: 30, range: 20 },
    reading: { min: 20, range: 15 },
    listening: { min: 20, range: 15 },
  }

  return LEARNER_POOL.map((row): SessionProgressRow => {
    // Current learner tends to be further along for nicer defaults
    const isCurrentLearner = row.id === CURRENT_LEARNER_ID
    const progress: Partial<SelfStudyProgressFields> = {}

    SELF_STUDY_COLUMNS.forEach(({ key }) => {
      const { min, range } = targetRanges[key]
      const target = min + Math.floor(rand() * range)
      const multiplier = isCurrentLearner
        ? 0.6 + rand() * 0.4
        : 0.3 + rand() * 0.65
      const current = Math.min(target, Math.floor(target * multiplier))

      const currentKey = `${key}Current` as keyof SelfStudyProgressFields
      const targetKey = `${key}Target` as keyof SelfStudyProgressFields
      progress[currentKey] = current
      progress[targetKey] = target
    })

    return {
      ...row,
      ...(progress as SelfStudyProgressFields),
    }
  })
}

interface ProgressSummary {
  totalCurrent: number
  totalTarget: number
  ratePercent: number
}

const calculateProgressSummary = (
  rows: SessionProgressRow[]
): ProgressSummary => {
  let totalCurrent = 0
  let totalTarget = 0
  rows.forEach((row) => {
    SELF_STUDY_COLUMNS.forEach(({ key }) => {
      totalCurrent += row[`${key}Current` as keyof SelfStudyProgressFields]
      totalTarget += row[`${key}Target` as keyof SelfStudyProgressFields]
    })
  })
  const ratePercent = totalTarget
    ? Math.round((totalCurrent / totalTarget) * 100)
    : 0
  return { totalCurrent, totalTarget, ratePercent }
}

/* -------------------------------------------------------------------------- */
/*  SessionAttendanceSelect (narrow + wide variants)                         */
/* -------------------------------------------------------------------------- */

function SessionAttendanceSelect({
  value,
  onChange,
  disabled = false,
  wide = false,
  onOpenChange,
}: {
  value: SessionAttendanceStatus
  onChange: (value: SessionAttendanceStatus) => void
  disabled?: boolean
  wide?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const option = ATTENDANCE_OPTION_BY_VALUE[value]

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as SessionAttendanceStatus)}
      disabled={disabled}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger
        className={cn(
          "border-[1px] border-gray-200 bg-transparent hover:bg-muted/50 focus:ring-0",
          wide ? "w-full" : "w-[56px]",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <SelectValue>
          {wide ? (
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-medium", option.iconColor)}>
                {option.label}
              </span>
            </div>
          ) : (
            <span className={cn("text-xs font-semibold", option.iconColor)}>
              {option.code}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[180px]">
        <SelectGroup>
          <SelectLabel>Attendance Status</SelectLabel>
          {SESSION_ATTENDANCE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex w-full items-center gap-2 pr-8">
                <span className={cn("text-sm", opt.iconColor)}>
                  {opt.label}
                </span>
                <span
                  className={cn(
                    "ml-auto text-xs text-muted-foreground",
                    opt.iconColor
                  )}
                >
                  ({opt.code})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

/* -------------------------------------------------------------------------- */
/*  SelfStudyProgressFieldRow (learner-editable current vs. target)          */
/* -------------------------------------------------------------------------- */

function SelfStudyProgressFieldRow({
  label,
  current,
  target,
  onChange,
}: {
  label: string
  current: number
  target: number
  onChange: (value: number) => void
}) {
  const [localValue, setLocalValue] = useState(String(current))

  useEffect(() => {
    setLocalValue(String(current))
  }, [current])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setLocalValue(raw)
    const parsed = Number(raw)
    if (!Number.isNaN(parsed)) {
      onChange(parsed)
    }
  }

  return (
    <div className="flex justify-between pr-12">
      <Label className="text-sm font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          value={localValue}
          onChange={handleChange}
          className="h-8 w-24 border-gray-200 text-center text-sm"
        />
        <span className="text-sm text-muted-foreground">/ {target}</span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Role Toggle UI (matches ProgressTab pattern exactly)                     */
/* -------------------------------------------------------------------------- */

function RoleToggle({
  value,
  onChange,
}: {
  value: SessionTestRole
  onChange: (r: SessionTestRole) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border p-1">
      <Button
        variant={value === "learner" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-3 text-xs"
        onClick={() => onChange("learner")}
      >
        Learner
      </Button>
      <Button
        variant={value === "admin" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-3 text-xs"
        onClick={() => onChange("admin")}
      >
        Admin
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  SessionDetailDialog                                                       */
/* -------------------------------------------------------------------------- */

interface StudyColumnRange {
  start: Date
  end: Date
}

interface SessionDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session | null
  weekDates: Date[]
  studyColumns: StudyColumnRange[]
  testRole: SessionTestRole
  onTestRoleChange: (r: SessionTestRole) => void
  attendanceRows: SessionLearnerRow[]
  onAttendanceChange: (learnerId: string, next: SessionAttendanceStatus) => void
  onNoteChange: (learnerId: string, note: string) => void
  onMarkAllPresent: () => void
  progressRows: SessionProgressRow[]
  onProgressChange: (
    learnerId: string,
    field: keyof SelfStudyProgressFields,
    value: number
  ) => void
  currentLearnerId: string
}

function SessionDetailDialog({
  open,
  onOpenChange,
  session,
  weekDates,
  studyColumns,
  testRole,
  onTestRoleChange,
  attendanceRows,
  onAttendanceChange,
  onNoteChange,
  onMarkAllPresent,
  progressRows,
  onProgressChange,
  currentLearnerId,
}: SessionDetailDialogProps) {
  const isAdmin = testRole === "admin"
  const isSelfStudy = session?.type === "self-study"
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)

  // Derived from session.dayIndex + weekDates prop (trainer-provided only)
  const sessionDate = useMemo(() => {
    if (!session || isSelfStudy) return null
    const d = weekDates[session.dayIndex]
    return d ? new Date(d) : null
  }, [session, weekDates, isSelfStudy])

  // Self-study sessions live in one of the 4 board columns instead of a day
  const studyRange = useMemo(() => {
    if (!session || !isSelfStudy || session.weekIndex == null) return null
    return studyColumns[session.weekIndex] ?? null
  }, [session, isSelfStudy, studyColumns])

  const summary = useMemo(
    () => calculateAttendanceSummary(attendanceRows),
    [attendanceRows]
  )

  const progressSummary = useMemo(
    () => calculateProgressSummary(progressRows),
    [progressRows]
  )

  const currentLearnerRow = useMemo(
    () => attendanceRows.find((r) => r.id === currentLearnerId) ?? null,
    [attendanceRows, currentLearnerId]
  )

  const currentLearnerProgress = useMemo(
    () => progressRows.find((r) => r.id === currentLearnerId) ?? null,
    [progressRows, currentLearnerId]
  )

  // Calculate completion percentage for each learner
  const getLearnerCompletion = (row: SessionProgressRow): number => {
    let totalCurrent = 0
    let totalTarget = 0
    SELF_STUDY_COLUMNS.forEach(({ key }) => {
      totalCurrent += row[`${key}Current` as keyof SelfStudyProgressFields]
      totalTarget += row[`${key}Target` as keyof SelfStudyProgressFields]
    })
    return totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0
  }

  // Get session status based on date
  const getSessionStatus = (): { label: string; variant: string } => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    if (isSelfStudy) {
      // For self-study, use progress data to determine status
      if (!studyRange)
        return {
          label: "Upcoming",
          variant: "bg-yellow-100 text-yellow-700 border-yellow-200",
        }

      const startDate = new Date(studyRange.start)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(studyRange.end)
      endDate.setHours(0, 0, 0, 0)

      if (endDate < now) {
        // Check if all learners have completed
        const allCompleted = progressRows.every((row) => {
          let totalCurrent = 0
          let totalTarget = 0
          SELF_STUDY_COLUMNS.forEach(({ key }) => {
            totalCurrent +=
              row[`${key}Current` as keyof SelfStudyProgressFields]
            totalTarget += row[`${key}Target` as keyof SelfStudyProgressFields]
          })
          return totalTarget > 0 && totalCurrent >= totalTarget
        })
        return allCompleted
          ? {
              label: "Completed",
              variant: "bg-green-100 text-green-700 border-green-200",
            }
          : {
              label: "In Progress",
              variant: "bg-blue-100 text-blue-700 border-blue-200",
            }
      } else if (startDate <= now && now <= endDate) {
        return {
          label: "In Progress",
          variant: "bg-blue-100 text-blue-700 border-blue-200",
        }
      } else {
        return {
          label: "Upcoming",
          variant: "bg-yellow-100 text-yellow-700 border-yellow-200",
        }
      }
    } else {
      // For trainer-provided
      if (!sessionDate)
        return {
          label: "Upcoming",
          variant: "bg-yellow-100 text-yellow-700 border-yellow-200",
        }

      const sessionDateObj = new Date(sessionDate)
      sessionDateObj.setHours(0, 0, 0, 0)

      if (sessionDateObj < now) {
        return {
          label: "Completed",
          variant: "bg-green-100 text-green-700 border-green-200",
        }
      } else if (sessionDateObj.getTime() === now.getTime()) {
        return {
          label: "Today",
          variant: "bg-blue-100 text-blue-700 border-blue-200",
        }
      } else {
        return {
          label: "Upcoming",
          variant: "bg-yellow-100 text-yellow-700 border-yellow-200",
        }
      }
    }
  }

  const sessionStatus = getSessionStatus()

  // Add dropdown interaction handlers
  const handleDropdownOpenChange = (isOpen: boolean) => {
    // Clear any pending timer
    if (dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }

    if (isOpen) {
      setIsInteractingWithDropdown(true)
    } else {
      // Delay setting to false to prevent dialog from closing when clicking outside dropdown
      dropdownCloseTimer.current = setTimeout(() => {
        setIsInteractingWithDropdown(false)
        dropdownCloseTimer.current = null
      }, 150)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Don't close if we're interacting with a dropdown
    if (!newOpen && isInteractingWithDropdown) {
      return
    }
    // Clear any pending timer when dialog closes
    if (!newOpen && dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }
    onOpenChange(newOpen)
  }

  // Handle pointer down outside - only prevent if clicking on dropdown
  const handlePointerDownOutside = (e: Event) => {
    const target = e.target as HTMLElement
    // Allow closing when clicking on the overlay or outside
    // But prevent if clicking on dropdown items or the select trigger
    if (
      target.closest('[role="listbox"]') ||
      target.closest('[role="option"]') ||
      target.closest("[data-dropdown-trigger]")
    ) {
      e.preventDefault()
    }
  }

  const handleSave = () => {
    if (isSelfStudy) {
      if (isAdmin) {
        toast.success("Progress reviewed", {
          description: `${progressSummary.ratePercent}% average completion across ${progressRows.length} learners`,
        })
      } else {
        toast.success("Progress saved", {
          description: currentLearnerProgress
            ? `${progressSummary.ratePercent}% of your target completed`
            : "Your progress has been recorded",
        })
      }
    } else if (isAdmin) {
      toast.success("Session attendance saved", {
        description: `${summary.present} present · ${summary.absent} absent · ${summary.late} late · ${summary.excused} excused`,
      })
    } else {
      toast.success("Attendance submitted", {
        description: currentLearnerRow
          ? `Your status: ${ATTENDANCE_OPTION_BY_VALUE[currentLearnerRow.status].label}`
          : "Your attendance has been recorded",
      })
    }
    onOpenChange(false)
  }

  if (!session || (isSelfStudy ? !studyRange : !sessionDate)) {
    // Render minimal dialog with empty content to satisfy radix open state
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={handlePointerDownOutside}
          onEscapeKeyDown={(e) => {
            // Prevent escape key from closing when dropdown is open
            if (isInteractingWithDropdown) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>No session</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  const sessionNoMatch = session.name.match(/Session\s+(\d+)/i)
  const sessionNo = sessionNoMatch ? Number(sessionNoMatch[1]) : null

  const statusBadgeByThemeIdx: Record<number, string | undefined> = {
    0: "bg-blue-100 text-blue-700 border-blue-200",
    1: "bg-purple-100 text-purple-700 border-purple-200",
    2: "bg-emerald-100 text-emerald-700 border-emerald-200",
    3: "bg-amber-100 text-amber-700 border-amber-200",
    4: "bg-rose-100 text-rose-700 border-rose-200",
  }
  const sessionBadgeCn = statusBadgeByThemeIdx[session.theme]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] w-full flex-col p-0",
          isSelfStudy ? "sm:max-w-4xl" : "sm:max-w-2xl",
          !isAdmin && isSelfStudy ? "sm:max-w-2xl" : ""
        )}
        showCloseButton
        onPointerDownOutside={handlePointerDownOutside}
        onEscapeKeyDown={(e) => {
          // Prevent escape key from closing when dropdown is open
          if (isInteractingWithDropdown) {
            e.preventDefault()
          }
        }}
      >
        {/* ===== Header ===== */}
        <DialogHeader className="gap-3 border-b p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-2 pr-8">
              <DialogTitle className="text-xl leading-tight">
                <span className="block truncate">{session.courseName}</span>
              </DialogTitle>
              <RoleToggle value={testRole} onChange={onTestRoleChange} />
            </div>
          </div>
        </DialogHeader>

        {/* ===== Body ===== */}
        <div
          className={cn(
            "flex-1 space-y-6 overflow-y-auto px-6",
            isSelfStudy && isAdmin ? "pb-10" : ""
          )}
        >
          {/* Session Info grid (label-left layout mirrors reference image) */}
          <section className="space-y-3">
            <div className="grid grid-cols-[130px_1fr] items-start gap-x-4 gap-y-4 rounded-lg bg-muted/10 pt-4">
              {/* Session Number */}
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <HugeiconsIcon
                  icon={CircleIcon}
                  strokeWidth={STROKE_WIDTH}
                  className="h-4 w-4"
                />
                Session No.
              </div>
              <div>
                {sessionNo ? (
                  <span className="font-medium">Session {sessionNo}</span>
                ) : (
                  <span className="font-medium">{session.name}</span>
                )}
              </div>

              {/* Group */}
              {session.group && (
                <>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <HugeiconsIcon
                      icon={UserGroupIcon}
                      strokeWidth={STROKE_WIDTH}
                      className="h-4 w-4"
                    />
                    Group
                  </div>
                  <div className="text-sm leading-tight font-medium">
                    {session.group}
                  </div>
                </>
              )}

              {/* Status */}
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  strokeWidth={STROKE_WIDTH}
                  className="h-4 w-4"
                />
                Status
              </div>
              <div>
                <Badge className={cn("border", sessionStatus.variant)}>
                  {sessionStatus.label}
                </Badge>
              </div>

              {/* Date / Duration */}
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <HugeiconsIcon
                  icon={Calendar01Icon}
                  strokeWidth={STROKE_WIDTH}
                  className="h-4 w-4"
                />
                {isSelfStudy ? "Duration" : "Date"}
              </div>
              {isSelfStudy && studyRange ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {formatFullDate(studyRange.start).trim()}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={STROKE_WIDTH}
                    className="h-4 w-4 text-muted-foreground"
                  />
                  <span className="font-medium">
                    {formatFullDate(studyRange.end).trim()}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({session.durationDays ?? 7} days)
                  </span>
                </div>
              ) : (
                <div>
                  <span className="font-medium">
                    {sessionDate ? formatFullDate(sessionDate) : "—"}
                  </span>
                </div>
              )}

              {/* Time (trainer-provided only - self-study runs by duration, not a slot) */}
              {!isSelfStudy && (
                <>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <HugeiconsIcon
                      icon={Time02Icon}
                      strokeWidth={STROKE_WIDTH}
                      className="h-4 w-4"
                    />
                    Time
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {formatTimeLabel(session.startHour)}
                    </span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={STROKE_WIDTH}
                      className="h-4 w-4 text-muted-foreground"
                    />
                    <span className="font-medium">
                      {formatTimeLabel(session.endHour)}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({Math.round((session.endHour - session.startHour) * 60)}{" "}
                      min)
                    </span>
                  </div>
                </>
              )}

              {/* Instructor */}
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <HugeiconsIcon
                  icon={TeacherIcon}
                  strokeWidth={STROKE_WIDTH}
                  className="h-4 w-4"
                />
                Instructor
              </div>
              <div className="text-sm leading-tight font-medium">
                {session.instructor ?? "TBA"}
              </div>
            </div>
          </section>

          <Separator />

          {isSelfStudy ? (
            /* ===== Progress Section (self-study) ===== */
            <section className="space-y-3">
              {isAdmin ? (
                <div className="space-y-4">
                  {/* Summary Tile */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                      <h4 className="font-medium text-muted-foreground">
                        Progress Summary
                      </h4>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-bold">
                          {progressSummary.ratePercent}%
                        </h4>
                        <span className="text-sm text-muted-foreground">
                          {progressSummary.totalCurrent} /{" "}
                          {progressSummary.totalTarget} completed across{" "}
                          {progressRows.length} learners
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Learner Progress Table with Current/Target and Completion columns */}
                  <div className="overflow-hidden rounded-lg border">
                    <div className="max-h-[320px] min-w-0 overflow-x-auto overflow-y-auto">
                      <Table className="border-separate border-spacing-0">
                        <TableHeader className="sticky top-0 z-20 bg-muted/70 backdrop-blur-sm">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="sticky left-0 z-30 h-11 w-[220px] border-r-2 border-r-border bg-muted/90">
                              Learner
                            </TableHead>
                            {SELF_STUDY_COLUMNS.map((col) => (
                              <TableHead
                                key={col.key}
                                className="text-center whitespace-nowrap"
                                colSpan={2}
                              >
                                {col.label}
                              </TableHead>
                            ))}
                            <TableHead className="text-center whitespace-nowrap">
                              Complete
                            </TableHead>
                          </TableRow>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="sticky left-0 z-30 h-11 w-[220px] border-r-2 border-r-border bg-muted/90" />
                            {SELF_STUDY_COLUMNS.map((col) => (
                              <React.Fragment key={col.key}>
                                <TableHead className="text-center text-xs font-medium whitespace-nowrap text-muted-foreground">
                                  Current
                                </TableHead>
                                <TableHead className="text-center text-xs font-medium whitespace-nowrap text-muted-foreground">
                                  Target
                                </TableHead>
                              </React.Fragment>
                            ))}
                            <TableHead className="text-center text-xs font-medium whitespace-nowrap text-muted-foreground">
                              %
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {progressRows.map((row) => {
                            const completion = getLearnerCompletion(row)
                            return (
                              <TableRow key={row.id}>
                                <TableCell className="sticky left-0 z-10 w-[220px] border-r-2 border-r-border bg-background">
                                  <div className="flex items-center gap-3 py-0.5">
                                    <Avatar className="h-8 w-8 shrink-0">
                                      <AvatarImage
                                        src=""
                                        alt={row.learnerName}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {getInitials(row.learnerName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-sm leading-tight font-medium">
                                        {row.learnerName}
                                      </div>
                                      <div className="flex gap-1 truncate text-xs text-muted-foreground">
                                        <span className="max-w-[50%] truncate">
                                          {row.department}
                                        </span>
                                        <span className="text-muted-foreground">
                                          •
                                        </span>
                                        <span className="max-w-[50%] truncate">
                                          {row.team}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                {SELF_STUDY_COLUMNS.map((col) => {
                                  const currentKey =
                                    `${col.key}Current` as keyof SelfStudyProgressFields
                                  const targetKey =
                                    `${col.key}Target` as keyof SelfStudyProgressFields
                                  return (
                                    <React.Fragment key={col.key}>
                                      <TableCell className="text-center whitespace-nowrap">
                                        <span className="text-sm font-medium">
                                          {row[currentKey]}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-center whitespace-nowrap">
                                        <span className="text-sm text-muted-foreground">
                                          {row[targetKey]}
                                        </span>
                                      </TableCell>
                                    </React.Fragment>
                                  )
                                })}
                                <TableCell className="text-center whitespace-nowrap">
                                  <Badge
                                    className={cn(
                                      "font-medium",
                                      completion >= 80
                                        ? "bg-green-100 text-green-700"
                                        : completion >= 50
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-red-100 text-red-700"
                                    )}
                                  >
                                    {completion}%
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                // LEARNER VIEW
                <div className="space-y-4 rounded-lg pb-4">
                  {currentLearnerProgress ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 items-center gap-x-4 gap-y-3">
                        {SELF_STUDY_COLUMNS.map((col) => {
                          const currentKey =
                            `${col.key}Current` as keyof SelfStudyProgressFields
                          const targetKey =
                            `${col.key}Target` as keyof SelfStudyProgressFields
                          return (
                            <SelfStudyProgressFieldRow
                              key={col.key}
                              label={col.label}
                              current={currentLearnerProgress[currentKey]}
                              target={currentLearnerProgress[targetKey]}
                              onChange={(val) =>
                                onProgressChange(
                                  currentLearnerProgress.id,
                                  currentKey,
                                  val
                                )
                              }
                            />
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-sm text-muted-foreground">
                      No enrollment record found for you in this session.
                    </div>
                  )}
                </div>
              )}
            </section>
          ) : (
            /* ===== Attendance Section (trainer-provided) ===== */
            <section className="space-y-3">
              {isAdmin ? (
                <div className="space-y-4">
                  {/* Summary Tiles */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                      <h4 className="font-medium text-muted-foreground">
                        Attendance Summary
                      </h4>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-bold">
                          {summary.ratePercent}%
                        </h4>
                        <span className="text-sm font-medium text-green-600">
                          P: {summary.present}
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          A: {summary.absent}
                        </span>
                        <span className="text-sm font-medium text-yellow-600">
                          L: {summary.late}
                        </span>
                        <span className="text-sm font-medium text-blue-600">
                          E: {summary.excused}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onMarkAllPresent}
                    >
                      Mark all as Present
                    </Button>
                  </div>

                  {/* Learner Attendance Table - Updated to match AttendanceTab style */}
                  <div className="overflow-hidden rounded-lg border">
                    <div className="max-h-[270px] min-w-0 overflow-y-auto">
                      <Table className="border-separate border-spacing-0">
                        <TableHeader className="sticky top-0 z-20 bg-muted/70 backdrop-blur-sm">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="sticky left-0 z-30 h-11 w-[250px] border-r-2 border-r-border bg-muted/90">
                              Learner
                            </TableHead>
                            <TableHead>Attendance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceRows.map((row) => {
                            const opt = ATTENDANCE_OPTION_BY_VALUE[row.status]
                            return (
                              <TableRow key={row.id}>
                                <TableCell className="sticky left-0 z-10 w-[250px] border-r-2 border-r-border bg-background">
                                  <div className="flex items-center gap-3 py-0.5">
                                    <Avatar className="h-8 w-8 shrink-0">
                                      <AvatarImage
                                        src=""
                                        alt={row.learnerName}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {getInitials(row.learnerName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-sm leading-tight font-medium">
                                        {row.learnerName}
                                      </div>
                                      <div className="flex gap-1 truncate text-xs text-muted-foreground">
                                        <span className="max-w-[50%] truncate">
                                          {row.department}
                                        </span>
                                        <span className="text-muted-foreground">
                                          •
                                        </span>
                                        <span className="max-w-[50%] truncate">
                                          {row.team}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <SessionAttendanceSelect
                                      value={row.status}
                                      wide
                                      onChange={(next) =>
                                        onAttendanceChange(row.id, next)
                                      }
                                      onOpenChange={handleDropdownOpenChange}
                                    />
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                // LEARNER VIEW
                <div className="space-y-4 rounded-lg pb-4">
                  {currentLearnerRow ? (
                    <>
                      <div className="grid grid-cols-[130px_1fr] items-start gap-x-4 gap-y-4">
                        <Label className="flex items-center gap-2 pt-2 text-sm font-medium text-muted-foreground">
                          Your Attendance
                        </Label>
                        <div>
                          <SessionAttendanceSelect
                            value={currentLearnerRow.status}
                            wide
                            onChange={(next) =>
                              onAttendanceChange(currentLearnerRow.id, next)
                            }
                            onOpenChange={handleDropdownOpenChange}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-4 text-sm text-muted-foreground">
                      No enrollment record found for you in this session.
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        {/* ===== Footer ===== */}
        {!(isSelfStudy && isAdmin) && (
          <DialogFooter className="border-t p-6 pt-4">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              {isAdmin
                ? "Save Changes"
                : isSelfStudy
                  ? "Save Progress"
                  : "Submit Attendance"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* Small summary tile helper inside the dialog */
function AttendanceStatTile({
  label,
  value,
  dotCn,
  valueColor,
}: {
  label: string
  value: number
  dotCn: string
  valueColor: string
}) {
  return (
    <div className="min-w-[96px] rounded-lg border bg-muted/20 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", dotCn)} />
        {label}
      </div>
      <div className={cn("mt-0.5 text-2xl leading-none font-bold", valueColor)}>
        {value}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  ScheduleContainer (Root)                                                  */
/* -------------------------------------------------------------------------- */

export function ScheduleContainer({ userRole }: { userRole?: string }) {
  const [view, setView] = useState<ScheduleView>("week")
  const [scheduleType, setScheduleType] =
    useState<ScheduleType>("trainer-provided")
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  // Self-study uses a 4-column board (each column ~ 7 days) instead of the
  // hourly week/month grid used by trainer-provided sessions.
  const [studyPeriodStart, setStudyPeriodStart] = useState(() =>
    getWeekStart(new Date())
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [justScrolledToToday, setJustScrolledToToday] = useState(false)
  const searchInputRef = useCallback((node: HTMLInputElement | null) => {
    ;(
      window as unknown as { __scheduleSearch?: HTMLInputElement | null }
    ).__scheduleSearch = node
  }, [])
  const [dialog, setDialog] = useState<SessionDialogState>({
    open: false,
    session: null,
  })
  const [testRole, setTestRole] = useState<SessionTestRole>(
    userRole === "admin" ||
      userRole === "approver" ||
      userRole === "department_head"
      ? "admin"
      : "learner"
  )
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // attendanceStore[sessionId] = SessionLearnerRow[]
  const [attendanceStore, setAttendanceStore] = useState<
    Record<string, SessionLearnerRow[]>
  >({})

  // progressStore[sessionId] = SessionProgressRow[] (self-study only)
  const [progressStore, setProgressStore] = useState<
    Record<string, SessionProgressRow[]>
  >({})

  // Populate attendance + progress stores once on mount
  useEffect(() => {
    const initialAttendance: Record<string, SessionLearnerRow[]> = {}
    const initialProgress: Record<string, SessionProgressRow[]> = {}
    DUMMY_SESSIONS.forEach((s) => {
      const noMatch = s.name.match(/Session\s+(\d+)/i)
      const sNo = noMatch ? Number(noMatch[1]) : Math.abs(parseInt(s.id, 10))
      if (s.type === "self-study") {
        initialProgress[s.id] = generateSessionProgress(s.id, sNo)
      } else {
        initialAttendance[s.id] = generateSessionLearners(s.id, sNo)
      }
    })
    setAttendanceStore(initialAttendance)
    setProgressStore(initialProgress)
  }, [])

  // Keyboard shortcut: Ctrl/Cmd + K focuses the search
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault()
        const input =
          (window as unknown as { __scheduleSearch?: HTMLInputElement | null })
            .__scheduleSearch ??
          document.querySelector<HTMLInputElement>(
            'input[placeholder="Search sessions..."]'
          )
        input?.focus()
        input?.select()
      }

      // Keyboard shortcut for today (Ctrl+T)
      if ((e.ctrlKey || e.metaKey) && e.key === "t") {
        e.preventDefault()
        scrollToToday()
      }
    }
    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [])

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const today = useMemo(() => new Date(), [])

  // 4 columns of ~7 days each, for the self-study board
  const studyColumns = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => {
        const start = new Date(studyPeriodStart)
        start.setDate(start.getDate() + i * 7)
        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        return { start, end }
      }),
    [studyPeriodStart]
  )

  // Live current-time indicator (updates each minute)
  const [nowTime, setNowTime] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNowTime(new Date()), 60 * 1000)
    return () => window.clearInterval(id)
  }, [])
  const nowHour =
    nowTime.getHours() + nowTime.getMinutes() / 60 + nowTime.getSeconds() / 3600
  const nowDayIndex = (() => {
    const d = nowTime.getDay() // 0 = Sun
    return d === 0 ? 6 : d - 1 // map to Mon=0..Sun=6
  })()
  const nowInRange = nowHour >= HOUR_START && nowHour <= HOUR_END
  const nowTop =
    nowHour <= HOUR_START
      ? 0
      : nowHour >= HOUR_END
        ? (HOUR_END - HOUR_START) * HOUR_HEIGHT
        : (nowHour - HOUR_START) * HOUR_HEIGHT
  const todayDayIndex = weekDates.findIndex((d) => isSameDay(d, nowTime))

  const hours = useMemo(
    () =>
      Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i),
    []
  )

  // Get counts for each schedule type
  const getTypeCount = (type: ScheduleType) => {
    return DUMMY_SESSIONS.filter((s) => s.type === type).length
  }

  // Filter sessions based on search term and schedule type
  const filteredSessions = useMemo(() => {
    let sessions = DUMMY_SESSIONS.filter((s) => s.type === scheduleType)

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      sessions = sessions.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.courseName.toLowerCase().includes(term) ||
          (s.instructor ?? "").toLowerCase().includes(term) ||
          (s.group ?? "").toLowerCase().includes(term)
      )
    }

    return sessions
  }, [scheduleType, searchTerm])

  const goToToday = () => {
    setWeekStart(getWeekStart(new Date()))
    // Scroll to today after the week changes
    setTimeout(() => scrollToToday(), 100)
  }

  const goToPreviousWeek = () =>
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() - 7)
      return next
    })
  const goToNextWeek = () =>
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + 7)
      return next
    })

  // Self-study period nav (moves the 4-column board by 28 days at a time)
  const goToTodayPeriod = () => {
    setStudyPeriodStart(getWeekStart(new Date()))
  }

  const goToPreviousPeriod = () =>
    setStudyPeriodStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() - 28)
      return next
    })

  const goToNextPeriod = () =>
    setStudyPeriodStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + 28)
      return next
    })

  // Month navigation for trainer-provided
  const goToPreviousMonth = () =>
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() - 1)
      return next
    })

  const goToNextMonth = () =>
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() + 1)
      return next
    })

  const openSessionDialog = useCallback((s: Session) => {
    setDialog({ open: true, session: s })
  }, [])

  const activeRows = dialog.session
    ? (attendanceStore[dialog.session.id] ?? [])
    : []

  const activeProgressRows = dialog.session
    ? (progressStore[dialog.session.id] ?? [])
    : []

  const onProgressChange = useCallback(
    (
      learnerId: string,
      field: keyof SelfStudyProgressFields,
      value: number
    ) => {
      if (!dialog.session) return
      const sid = dialog.session.id
      setProgressStore((prev) => {
        const rows = prev[sid] ?? []
        return {
          ...prev,
          [sid]: rows.map((r) =>
            r.id === learnerId ? { ...r, [field]: value } : r
          ),
        }
      })
    },
    [dialog.session]
  )

  const onAttendanceChange = useCallback(
    (learnerId: string, next: SessionAttendanceStatus) => {
      if (!dialog.session) return
      const sid = dialog.session.id
      setAttendanceStore((prev) => {
        const rows = prev[sid] ?? []
        return {
          ...prev,
          [sid]: rows.map((r) =>
            r.id === learnerId
              ? {
                  ...r,
                  status: next,
                  lateMinutes:
                    next === "LATE" ? (r.lateMinutes ?? 15) : undefined,
                }
              : r
          ),
        }
      })
    },
    [dialog.session]
  )

  const onNoteChange = useCallback(
    (learnerId: string, note: string) => {
      if (!dialog.session) return
      const sid = dialog.session.id
      setAttendanceStore((prev) => {
        const rows = prev[sid] ?? []
        return {
          ...prev,
          [sid]: rows.map((r) => (r.id === learnerId ? { ...r, note } : r)),
        }
      })
    },
    [dialog.session]
  )

  const onMarkAllPresent = useCallback(() => {
    if (!dialog.session) return
    const sid = dialog.session.id
    setAttendanceStore((prev) => {
      const rows = prev[sid] ?? []
      return {
        ...prev,
        [sid]: rows.map((r) => ({
          ...r,
          status: "PRESENT" as SessionAttendanceStatus,
          lateMinutes: undefined,
        })),
      }
    })
    toast.success("All learners marked as Present")
  }, [dialog.session])

  // Scroll to today's column
  const scrollToToday = () => {
    const outerContainer = tableContainerRef.current
    if (!outerContainer) return

    // Find the scrollable container
    const container =
      outerContainer.querySelector<HTMLElement>(
        '[data-slot="table-container"]'
      ) ?? outerContainer

    // Find today's column header
    const todayDate = new Date()
    const todayWeekIndex = weekDates.findIndex((d) => isSameDay(d, todayDate))

    if (todayWeekIndex === -1) {
      // Today is not in the current week view
      return
    }

    // Find the column header for today
    const headerCells =
      container.querySelectorAll<HTMLElement>("[data-day-index]")
    let targetCell: HTMLElement | null = null
    for (const cell of headerCells) {
      if (cell.getAttribute("data-day-index") === String(todayWeekIndex)) {
        targetCell = cell
        break
      }
    }

    if (!targetCell) {
      // Fallback: find by class or structure
      const dayHeaders = container.querySelectorAll(
        ".border-l.bg-background.py-2"
      )
      // Skip the first one (time gutter)
      if (dayHeaders.length > todayWeekIndex + 1) {
        targetCell = dayHeaders[todayWeekIndex + 1] as HTMLElement
      }
    }

    if (!targetCell) {
      // Fallback: scroll to the approximate position based on column index
      const columnWidth = 140 // minmax(140px, 1fr)
      const scrollLeft = (todayWeekIndex + 1) * columnWidth - 100 // +1 for time gutter
      if (container.scrollWidth > container.clientWidth) {
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: "smooth",
        })
      }
      setJustScrolledToToday(true)
      setTimeout(() => setJustScrolledToToday(false), 1200)
      return
    }

    // Calculate scroll position
    const containerRect = container.getBoundingClientRect()
    const targetRect = targetCell.getBoundingClientRect()

    // Measure the time gutter width (first column)
    const timeGutter = container.querySelector<HTMLElement>(".sticky.left-0")
    const timeGutterWidth = timeGutter?.getBoundingClientRect().width ?? 64

    const cellWidth = targetRect.width
    const viewportAvailableWidth = containerRect.width - timeGutterWidth

    const cellLeftInContainer = targetRect.left - containerRect.left
    const currentScrollLeft = container.scrollLeft
    const cellAbsoluteLeft = cellLeftInContainer + currentScrollLeft

    const centeringOffset = Math.max(
      0,
      (viewportAvailableWidth - cellWidth) / 2
    )
    const desiredScrollLeft =
      cellAbsoluteLeft - timeGutterWidth - centeringOffset

    const maxScrollLeft = container.scrollWidth - container.clientWidth
    const clampedScrollLeft = Math.min(
      Math.max(0, desiredScrollLeft),
      Math.max(0, maxScrollLeft)
    )

    if (container.scrollWidth > container.clientWidth) {
      container.scrollTo({
        left: clampedScrollLeft,
        behavior: "smooth",
      })
    }

    // Trigger pulse highlight
    setJustScrolledToToday(true)
    setTimeout(() => setJustScrolledToToday(false), 1200)
  }

  const gridHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT

  return (
    <div className="w-full min-w-0 rounded-lg bg-background pb-6">
      {/* ===== Sub Header (nav / search / view) ===== */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
        <div>
          <Tabs
            value={scheduleType}
            onValueChange={(value) => setScheduleType(value as ScheduleType)}
          >
            <TabsList className="h-auto">
              <TabsTrigger value="trainer-provided" className="gap-2">
                Trainer-Provided
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-5 px-1.5 text-xs",
                    scheduleType === "trainer-provided"
                      ? "bg-secondary"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {getTypeCount("trainer-provided")}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="self-study" className="gap-2">
                Self-Study
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-5 px-1.5 text-xs",
                    scheduleType === "self-study"
                      ? "bg-secondary"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {getTypeCount("self-study")}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <InputGroup className="w-[300px]">
            <InputGroupInput
              placeholder="Search sessions..."
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <InputGroupAddon>
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={STROKE_WIDTH}
                className="h-4 w-4 text-muted-foreground"
              />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Kbd>Ctrl + K</Kbd>
            </InputGroupAddon>
          </InputGroup>

          {/* Navigation - day range for trainer, month for self-study */}
          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={
                scheduleType === "self-study"
                  ? goToPreviousMonth
                  : goToPreviousWeek
              }
              aria-label={
                scheduleType === "self-study"
                  ? "Previous month"
                  : "Previous week"
              }
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                strokeWidth={STROKE_WIDTH}
                className="h-4 w-4"
              />
            </Button>
            <div className="flex items-center gap-1.5 border-x px-3 text-sm font-medium whitespace-nowrap">
              <HugeiconsIcon
                icon={Calendar01Icon}
                strokeWidth={STROKE_WIDTH}
                className="h-3.5 w-3.5 text-muted-foreground"
              />
              {scheduleType === "self-study"
                ? formatMonthLabel(weekStart)
                : formatWeekRangeLabel(weekDates)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={
                scheduleType === "self-study" ? goToNextMonth : goToNextWeek
              }
              aria-label={
                scheduleType === "self-study" ? "Next month" : "Next week"
              }
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={STROKE_WIDTH}
                className="h-4 w-4"
              />
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Schedule Type Tabs ===== */}
      <div className="mb-4"></div>

      {scheduleType === "self-study" ? (
        /* ===== Self-study board (4 columns, ~7 days each) ===== */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {studyColumns.map((col, colIndex) => {
            const colSessions = filteredSessions.filter(
              (s) => s.weekIndex === colIndex
            )
            const isCurrentColumn =
              today >= col.start &&
              today <=
                new Date(
                  col.end.getFullYear(),
                  col.end.getMonth(),
                  col.end.getDate(),
                  23,
                  59,
                  59
                )

            return (
              <div
                key={colIndex}
                className={cn(
                  "flex min-w-0 flex-col rounded-lg border",
                  isCurrentColumn && "border-blue-300 bg-blue-50/30"
                )}
              >
                <div
                  className={cn(
                    "rounded-t-lg border-b bg-background px-3 py-2.5",
                    isCurrentColumn && "bg-blue-100/50 text-blue-700"
                  )}
                >
                  <div className="text-sm font-semibold">
                    Week {colIndex + 1}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <HugeiconsIcon
                      icon={Calendar01Icon}
                      strokeWidth={STROKE_WIDTH}
                      className="h-3 w-3"
                    />
                    {formatStudyColumnLabel(col)}
                  </div>
                </div>

                <div className="flex-1 space-y-2 p-2.5">
                  {colSessions.length === 0 ? (
                    <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                      No sessions
                    </div>
                  ) : (
                    colSessions.map((session) => {
                      const theme = SESSION_THEMES[session.theme]
                      return (
                        <button
                          type="button"
                          key={session.id}
                          onClick={() => openSessionDialog(session)}
                          className={cn(
                            "w-full cursor-pointer overflow-hidden rounded-md border-l-[3px] p-2.5 text-left ring-offset-background transition-all hover:ring-2 hover:ring-offset-1",
                            theme.bg,
                            theme.border,
                            theme.hoverRing
                          )}
                        >
                          <div
                            className={cn(
                              "truncate text-sm font-semibold",
                              theme.text
                            )}
                          >
                            {session.courseName}
                          </div>
                          <div
                            className={cn(
                              "mt-0.5 truncate text-xs",
                              theme.subtext
                            )}
                          >
                            {session.name}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ===== Week grid (trainer-provided) ===== */
        <div className="min-w-0 overflow-hidden rounded-sm border">
          <div
            ref={tableContainerRef}
            className="min-w-0 overflow-auto scroll-smooth"
          >
            <div className="grid min-w-[900px] grid-cols-[64px_repeat(7,minmax(140px,1fr))]">
              {/* Sticky day-header row */}
              <div className="bg-background" />
              {weekDates.map((date, i) => {
                const isToday = isSameDay(date, today)
                const monthName = date.toLocaleString("default", {
                  month: "short",
                })

                return (
                  <div
                    key={`head-${i}`}
                    data-day-index={i}
                    className={cn(
                      "sticky top-0 z-20 border-l bg-background py-2 text-center transition-colors duration-200",
                      isToday && "bg-blue-100/50 text-blue-600",
                      isToday &&
                        justScrolledToToday &&
                        "animate-pulse bg-blue-200/80 ring-2 ring-blue-500 ring-inset"
                    )}
                  >
                    <div
                      className={cn(
                        "mx-auto mb-1 flex w-fit items-center justify-center gap-1 rounded-lg text-sm font-semibold"
                      )}
                    >
                      <span>{monthName}</span>
                      <span
                        className={cn(
                          isToday &&
                            "flex items-center justify-center rounded-full"
                        )}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "text-xs font-medium text-muted-foreground"
                      )}
                    >
                      {WEEKDAY_LABELS[i]}
                    </div>
                  </div>
                )
              })}

              {/* Time gutter */}
              <div
                className="sticky left-0 z-20 border-t bg-background"
                style={{ height: gridHeight }}
              >
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute right-3 translate-y-4 text-[11px] font-medium text-muted-foreground"
                    style={{ top: i * HOUR_HEIGHT }}
                  >
                    {formatHourLabel(hour)}
                  </div>
                ))}
                {/* Current-time handle in time gutter (only when today in current week) */}
                {todayDayIndex !== -1 && nowInRange && (
                  <div
                    className="pointer-events-none absolute right-0 z-30 flex translate-x-1/2 translate-y-4 items-center"
                    style={{ top: nowTop }}
                  >
                    <div className="h-3 w-3 rounded-full border-2 border-white bg-red-500" />
                  </div>
                )}
              </div>

              {/* Day columns */}
              {weekDates.map((date, dayIndex) => {
                const isToday = isSameDay(date, today)
                const daySessions = filteredSessions.filter(
                  (s) => s.dayIndex === dayIndex
                )

                return (
                  <div
                    key={`col-${dayIndex}`}
                    className={cn(
                      "relative border-t border-l",
                      isToday && "bg-blue-50/40",
                      isToday &&
                        justScrolledToToday &&
                        "animate-pulse bg-blue-100/60"
                    )}
                    style={{ height: gridHeight }}
                  >
                    {/* Hour gridlines */}
                    {hours.map((hour, i) => (
                      <div
                        key={hour}
                        className="absolute inset-x-0 border-t border-dashed border-muted"
                        style={{ top: i * HOUR_HEIGHT }}
                      />
                    ))}

                    {/* Current-time red line (only today) */}
                    {todayDayIndex !== -1 &&
                      dayIndex === todayDayIndex &&
                      nowInRange && (
                        <div
                          className="pointer-events-none absolute inset-x-0 z-20 translate-y-4"
                          style={{ top: nowTop }}
                        >
                          <div className="relative h-[2px] w-full bg-red-500" />
                        </div>
                      )}

                    {/* Session blocks (click opens dialog) */}
                    {daySessions.map((session) => {
                      const theme = SESSION_THEMES[session.theme]
                      const top =
                        (session.startHour - HOUR_START) * HOUR_HEIGHT + 14
                      const height =
                        (session.endHour - session.startHour) * HOUR_HEIGHT

                      return (
                        <button
                          type="button"
                          key={session.id}
                          onClick={() => openSessionDialog(session)}
                          className={cn(
                            "group absolute inset-x-1 cursor-pointer overflow-hidden rounded-md border-l-[3px] p-1.5 text-left ring-offset-background transition-all hover:ring-2 hover:ring-offset-1",
                            theme.bg,
                            theme.border,
                            theme.hoverRing
                          )}
                          style={{
                            top: top + 2,
                            height: Math.max(height - 4, 30),
                          }}
                        >
                          <div
                            className={cn(
                              "truncate text-xs font-semibold",
                              theme.text
                            )}
                          >
                            {session.courseName}
                          </div>
                          <div
                            className={cn(
                              "mt-0.5 truncate text-[10px]",
                              theme.subtext
                            )}
                          >
                            {session.group} • {session.name}
                          </div>
                          <div
                            className={cn(
                              "mt-0.5 truncate text-[11px]",
                              theme.subtext
                            )}
                          >
                            {formatTimeLabel(session.startHour)} -{" "}
                            {formatTimeLabel(session.endHour)}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== Session Detail Dialog (shared for all sessions) ===== */}
      <SessionDetailDialog
        open={dialog.open}
        onOpenChange={(o) => setDialog((st) => ({ ...st, open: o }))}
        session={dialog.session}
        weekDates={weekDates}
        studyColumns={studyColumns}
        testRole={testRole}
        onTestRoleChange={setTestRole}
        attendanceRows={activeRows}
        onAttendanceChange={onAttendanceChange}
        onNoteChange={onNoteChange}
        onMarkAllPresent={onMarkAllPresent}
        progressRows={activeProgressRows}
        onProgressChange={onProgressChange}
        currentLearnerId={CURRENT_LEARNER_ID}
      />
    </div>
  )
}
